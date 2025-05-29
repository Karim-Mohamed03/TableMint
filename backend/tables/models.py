from django.db import models
import qrcode
from io import BytesIO
from django.core.files import File
from PIL import Image
from django.urls import reverse
from django.conf import settings

class Table(models.Model):
    restaurant = models.ForeignKey('restaurants.Restaurant', on_delete=models.CASCADE, related_name='tables')
    number = models.PositiveIntegerField()
    capacity = models.PositiveIntegerField(default=4)
    qr_code = models.ImageField(upload_to='qr_codes/', blank=True, null=True)
    is_occupied = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['restaurant', 'number']
    
    def __str__(self):
        return f"{self.restaurant.name} - Table {self.number}"
    
    def save(self, *args, **kwargs):
        if not self.qr_code:
            self.generate_qr_code()
        super().save(*args, **kwargs)
    
    def generate_qr_code(self):
        # Generate the URL for this table
        table_url = settings.ALLOWED_HOSTS[0]
        if table_url == 'localhost' or '127.0.0.1' in table_url:
            url = f"https://tablemint.onrender.com/table/{self.pk}"
        else:
            url = f"https://{table_url}/table/{self.pk}"
            
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
        filename = f'qr_code_table_{self.restaurant.id}_{self.number}.png'
        self.qr_code.save(filename, File(buffer), save=False)
        
    @property
    def qr_code_url(self):
        if self.qr_code:
            return self.qr_code.url
        return None
