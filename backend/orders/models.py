# We'll modify the existing Order model by adding a field to track the Square order ID
# This code should be added to your existing orders/models.py file

from django.db import models
from django.contrib.auth.models import User
from decimal import Decimal
import uuid
from cryptography.fernet import Fernet
from django.conf import settings
import json
import base64

# Add this line to your imports
from django.db.models import F

# Since Order model is already defined, we'll just show the changes needed:
class Order(models.Model):
    STATUS_CHOICES = (
        ('open', 'Open'),
        ('paid', 'Paid'),
        ('cancelled', 'Cancelled'),
    )
    
    table = models.ForeignKey('tables.Table', on_delete=models.CASCADE, related_name='orders')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    tax = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    service_charge = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    # Reference to external POS system order ID (if applicable)
    pos_reference = models.CharField(max_length=100, blank=True, null=True)
    
    # Add this field to store the Square location ID
    square_location_id = models.CharField(max_length=255, blank=True, null=True)
    
    def __str__(self):
        return f"Order {self.id} - Table {self.table.number} - {self.status}"
    
    def calculate_total(self):
        """Calculate the total order amount including all items"""
        subtotal = sum(item.total_price for item in self.items.all())
        self.total_amount = subtotal + self.tax + self.service_charge
        self.save()
        return self.total_amount
    
    @property
    def subtotal(self):
        """Calculate the subtotal (before tax and service charge)"""
        return sum(item.total_price for item in self.items.all())
    
    @classmethod
    def get_by_square_order_id(cls, square_order_id):
        """
        Find an order by its Square order ID (pos_reference)
        """
        return cls.objects.filter(pos_reference=square_order_id).first()
    
    @classmethod
    def update_or_create_from_square(cls, square_order_id, table_id, location_id, status='open'):
        """
        Create or update an order based on Square webhook data
        """
        from tables.models import Table  # Import here to avoid circular imports
        
        table = Table.objects.get(id=table_id)
        
        # Try to find an existing order with this Square order ID
        order, created = cls.objects.update_or_create(
            pos_reference=square_order_id,
            defaults={
                'table': table,
                'status': status,
                'square_location_id': location_id
            }
        )
        
        return order, created

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    unit_price = models.DecimalField(max_digits=8, decimal_places=2)
    quantity = models.PositiveIntegerField(default=1)
    notes = models.TextField(blank=True, null=True)
    # Reference to external POS system item ID (if applicable)
    pos_reference = models.CharField(max_length=100, blank=True, null=True)
    
    def __str__(self):
        return f"{self.quantity}x {self.name}"
    
    @property
    def total_price(self):
        return self.unit_price * self.quantity

class ShareSession(models.Model):
    """Secure model for storing encrypted cart sharing sessions"""
    
    # Unique identifier for the share session (public, non-sensitive)
    share_token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    
    # Encrypted data containing the actual sharing information
    encrypted_data = models.TextField()
    
    # Optional reference to the original order (if applicable)
    original_order_id = models.CharField(max_length=255, blank=True, null=True)
    
    # Session metadata
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    
    # Usage tracking
    access_count = models.PositiveIntegerField(default=0)
    last_accessed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['share_token']),
            models.Index(fields=['expires_at']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return f"ShareSession {self.share_token} - {'Active' if self.is_active else 'Inactive'}"
    
    @staticmethod
    def get_encryption_key():
        """Get or generate encryption key for this session"""
        # Use Django's SECRET_KEY as base for encryption
        # In production, consider using a separate encryption key
        secret = settings.SECRET_KEY.encode()
        # Create a Fernet-compatible key (32 bytes, base64 encoded)
        key = base64.urlsafe_b64encode(secret[:32].ljust(32, b'0'))
        return key
    
    def encrypt_data(self, data):
        """Encrypt data before storing"""
        if isinstance(data, dict):
            data = json.dumps(data)
        
        fernet = Fernet(self.get_encryption_key())
        encrypted = fernet.encrypt(data.encode())
        self.encrypted_data = base64.urlsafe_b64encode(encrypted).decode()
    
    def decrypt_data(self):
        """Decrypt and return the stored data"""
        try:
            fernet = Fernet(self.get_encryption_key())
            encrypted_bytes = base64.urlsafe_b64decode(self.encrypted_data.encode())
            decrypted = fernet.decrypt(encrypted_bytes)
            return json.loads(decrypted.decode())
        except Exception as e:
            raise ValueError(f"Failed to decrypt share session data: {str(e)}")
    
    def is_expired(self):
        """Check if the share session has expired"""
        from django.utils import timezone
        return timezone.now() > self.expires_at
    
    def is_valid(self):
        """Check if the share session is valid and can be used"""
        return self.is_active and not self.is_expired()
    
    def record_access(self):
        """Record that this share session was accessed"""
        from django.utils import timezone
        self.access_count += 1
        self.last_accessed_at = timezone.now()
        self.save(update_fields=['access_count', 'last_accessed_at'])