from django.db import models

class Restaurant(models.Model):
    name = models.CharField(max_length=100)
    address = models.CharField(max_length=255)
    phone = models.CharField(max_length=20)
    email = models.EmailField()
    logo = models.ImageField(upload_to='restaurant_logos/', blank=True, null=True)
    # This field would contain API credentials for the restaurant's POS system
    pos_api_key = models.CharField(max_length=255, blank=True, null=True, help_text="API key for connecting to POS system")
    pos_type = models.CharField(max_length=50, blank=True, null=True, help_text="Type of POS system used")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name
