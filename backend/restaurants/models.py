from django.db import models

class Restaurant(models.Model):
    # Keep existing primary key structure
    name = models.CharField(max_length=100)
    
    # New fields for POS integration
    location_id = models.TextField(null=True, blank=True)
    access_token = models.TextField(null=True, blank=True)  # Encrypted access token
    refresh_token = models.TextField(null=True, blank=True)
    token_expires = models.DateTimeField(null=True, blank=True)
    currency = models.TextField(default='GBP')
    timezone = models.TextField(default='Europe/London')
    integration_name = models.TextField(null=True, blank=True)
    is_connected = models.BooleanField(default=False, null=True)
    active_menu = models.TextField(null=True, blank=True)  # Menu ID from Square
    stripe_account_id = models.TextField(null=True, blank=True)
    stripe_is_connected = models.BooleanField(default=False)
    stripe_onboarding_completed = models.BooleanField(default=False)
    
    # Keep existing branding fields
    address = models.CharField(max_length=255, null=True, blank=True)
    phone = models.CharField(max_length=20, null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    logo = models.ImageField(upload_to='restaurant_logos/', blank=True, null=True)
    background_image = models.ImageField(upload_to='restaurant_backgrounds/', blank=True, null=True, 
                                         help_text="Background image to display on the payment page")
    # Brand colors
    primary_color = models.CharField(max_length=20, blank=True, null=True, default="#0071e3", 
                                    help_text="Primary brand color (hex code)")
    secondary_color = models.CharField(max_length=20, blank=True, null=True, default="#f5f5f7",
                                    help_text="Secondary brand color (hex code)")
    # Branding display options
    show_logo_on_receipt = models.BooleanField(default=True, 
                                            help_text="Display restaurant logo on payment receipt")
    show_background_image = models.BooleanField(default=True, 
                                             help_text="Display background image on payment page")
    # Legacy fields for backward compatibility
    pos_api_key = models.CharField(max_length=255, blank=True, null=True, help_text="API key for connecting to POS system")
    pos_type = models.CharField(max_length=50, blank=True, null=True, help_text="Type of POS system used")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name or f"Restaurant {self.id}"

    def branding_config(self):
        """
        Returns a dictionary with the restaurant's branding configuration 
        for use in the frontend
        """
        return {
            'id': str(self.id),
            'name': self.name,
            'logo_url': self.logo.url if self.logo else None,
            'background_image_url': self.background_image.url if self.background_image else None,
            'primary_color': self.primary_color,
            'secondary_color': self.secondary_color,
            'show_logo_on_receipt': self.show_logo_on_receipt,
            'show_background_image': self.show_background_image,
        }
