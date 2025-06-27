from django.db import models
import uuid

class Restaurant(models.Model):
    # Match the actual Supabase database schema
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.TextField(null=True, blank=True)
    location_id = models.TextField(null=True, blank=True)
    access_token = models.TextField(null=True, blank=True)
    refresh_token = models.TextField(null=True, blank=True)
    token_expires = models.DateTimeField(null=True, blank=True)
    currency = models.TextField(null=True, blank=True, default='GBP')
    timezone = models.TextField(null=True, blank=True, default='Europe/London')
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)
    integration_name = models.TextField(null=True, blank=True)
    is_connected = models.BooleanField(null=True, blank=True, default=False)
    active_menu = models.TextField(null=True, blank=True)
    stripe_account_id = models.TextField(null=True, blank=True)
    stripe_is_connected = models.BooleanField(default=False)
    stripe_onboarding_completed = models.BooleanField(default=False)
    active_subscription = models.TextField(null=True, blank=True)
    
    class Meta:
        managed = False  # Don't let Django manage this table's schema
        db_table = 'restaurants'

    def __str__(self):
        return self.name or f"Restaurant {self.id}"

    def branding_config(self):
        """
        Returns a basic branding configuration for compatibility
        """
        return {
            'id': str(self.id),
            'name': self.name or 'Unknown Restaurant',
            'logo_url': None,
            'background_image_url': None,
            'primary_color': '#0071e3',
            'secondary_color': '#f5f5f7',
            'show_logo_on_receipt': True,
            'show_background_image': True,
        }

class RestaurantLocation(models.Model):
    """
    Model for restaurant_locations table
    This is the intermediate table that connects tables to restaurants
    """
    id = models.UUIDField(primary_key=True, editable=False)
    rest_id = models.UUIDField(null=True, blank=True)  # References restaurants.id
    location_id = models.TextField(null=True, blank=True)  # Square location ID
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        managed = False  # Don't let Django manage this table's schema
        db_table = 'restaurant_locations'
    
    def __str__(self):
        return f"Location {self.location_id} for Restaurant {self.rest_id}"
    
    def get_restaurant(self):
        """Get the associated restaurant"""
        if self.rest_id:
            try:
                return Restaurant.objects.filter(id=self.rest_id).first()
            except Exception:
                return None
        return None


class RestaurantMenuTemplate(models.Model):
    """
    Model for restaurant_menu_templates table
    Stores menu templates for restaurants
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    menu_data = models.JSONField()
    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, db_column='restaurant_id')
    template_id = models.UUIDField(null=True, blank=True)  # Optional reference to template
    
    class Meta:
        managed = False  # Don't let Django manage this table's schema
        db_table = 'restaurant_menu_templates'
    
    def __str__(self):
        return f"{self.name} - {self.restaurant.name if self.restaurant else 'No Restaurant'}"
    
    @classmethod
    def get_published_menu(cls, restaurant_id):
        """Get the published menu for a restaurant"""
        try:
            return cls.objects.filter(
                restaurant_id=restaurant_id,
                is_published=True
            ).order_by('-updated_at').first()
        except Exception as e:
            print(f"Error getting published menu: {str(e)}")
            return None
