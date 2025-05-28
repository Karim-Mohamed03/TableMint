# We'll modify the existing Order model by adding a field to track the Square order ID
# This code should be added to your existing orders/models.py file

from django.db import models
from decimal import Decimal

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
        return f"Order #{self.id} - {self.table}"
    
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
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(default=1)
    notes = models.TextField(blank=True, null=True)
    # Reference to external POS system item ID (if applicable)
    pos_reference = models.CharField(max_length=100, blank=True, null=True)
    
    def __str__(self):
        return f"{self.quantity} x {self.name}"
    
    @property
    def total_price(self):
        return self.unit_price * Decimal(self.quantity)