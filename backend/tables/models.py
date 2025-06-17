from django.db import models
import qrcode
from io import BytesIO
from django.core.files import File
from PIL import Image
from django.urls import reverse
from django.conf import settings
import secrets
import string
import uuid

class Table(models.Model):
    # Use existing primary key structure for now
    restaurant = models.ForeignKey('restaurants.Restaurant', on_delete=models.CASCADE, related_name='tables')
    number = models.PositiveIntegerField()
    capacity = models.PositiveIntegerField(default=4)
    qr_code = models.ImageField(upload_to='qr_codes/', blank=True, null=True)
    is_occupied = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # New fields for token-based system
    table_label = models.TextField(null=True, blank=True)
    token = models.TextField(unique=True, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ['restaurant', 'number']
    
    def __str__(self):
        return f"{self.restaurant.name} - Table {self.table_label or self.number} - {self.token or 'No Token'}"
    
    def generate_token(self):
        """Generate a unique token for the table"""
        if not self.token:
            # Generate a random token similar to the one in your example
            alphabet = string.ascii_letters + string.digits
            token = ''.join(secrets.choice(alphabet) for _ in range(12))
            # Ensure uniqueness
            while Table.objects.filter(token=token).exists():
                token = ''.join(secrets.choice(alphabet) for _ in range(12))
            self.token = token
    
    def save(self, *args, **kwargs):
        # Set table_label from number if not set
        if not self.table_label:
            self.table_label = str(self.number)
            
        if not self.token:
            self.generate_token()
        
        super().save(*args, **kwargs)
        
        # Generate QR code after saving (so we have an ID)
        if not self.qr_code:
            self.generate_qr_code()
            # Save again to update the qr_code field
            super().save(update_fields=['qr_code'])
    
    def generate_qr_code(self):
        # Generate the URL for this table using the token
        if settings.DEBUG:
            base_url = "http://localhost:3000"
        else:
            base_url = "https://test-app-fawn-phi.vercel.app"
            
        url = f"{base_url}/table/{self.token}"
            
        # Generate QR code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(url)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Save QR code image
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        filename = f'qr_code_table_{self.restaurant.id}_{self.table_label}_{self.token}.png'
        self.qr_code.save(filename, File(buffer), save=False)
        
    @property
    def qr_code_url(self):
        if self.qr_code:
            return self.qr_code.url
        return None
