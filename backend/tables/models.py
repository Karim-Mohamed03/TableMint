from django.db import models
import secrets
import string
import uuid

class Table(models.Model):
    # Match the exact production database schema
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    restaurant_id = models.UUIDField(null=True, blank=True)  # References restaurant_locations.id
    table_label = models.TextField()
    token = models.TextField(unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'restaurant_tables'
        managed = False  # Don't let Django manage this table's schema
    
    def __str__(self):
        return f"Table {self.table_label} - {self.token}"
    
    def generate_token(self):
        """Generate a unique token for the table"""
        if not self.token:
            alphabet = string.ascii_letters + string.digits
            token = ''.join(secrets.choice(alphabet) for _ in range(12))
            # Ensure uniqueness
            while Table.objects.filter(token=token).exists():
                token = ''.join(secrets.choice(alphabet) for _ in range(12))
            self.token = token
    
    def save(self, *args, **kwargs):
        if not self.table_label:
            self.table_label = 'Table'
        if not self.token:
            self.generate_token()
        super().save(*args, **kwargs)
    
    def get_restaurant_location(self):
        """
        Get the restaurant location record that this table belongs to
        """
        if self.restaurant_id:
            try:
                from restaurants.models import RestaurantLocation
                return RestaurantLocation.objects.filter(id=self.restaurant_id).first()
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.warning(f"Could not find restaurant location for ID {self.restaurant_id}: {str(e)}")
                return None
        return None
    
    def get_restaurant(self):
        """
        Get restaurant info through the restaurant_locations table
        restaurant_tables -> restaurant_locations -> restaurants
        """
        restaurant_location = self.get_restaurant_location()
        if restaurant_location:
            return restaurant_location.get_restaurant()
        return None
    
    def get_restaurant_info(self):
        """
        Get comprehensive restaurant and location information as a dictionary
        """
        restaurant_location = self.get_restaurant_location()
        restaurant = self.get_restaurant()
        
        if restaurant and restaurant_location:
            return {
                'id': str(restaurant.id),
                'name': restaurant.name,
                'location_id': restaurant_location.location_id,  # From restaurant_locations table
                'active_menu': restaurant.active_menu,  # Now using actual field from database
                'currency': restaurant.currency or 'GBP',
                'timezone': restaurant.timezone or 'Europe/London',
                'integration_name': restaurant.integration_name,
                'branding': restaurant.branding_config()
            }
        elif restaurant_location:
            # Have location but no restaurant (shouldn't happen but handle gracefully)
            return {
                'id': str(restaurant_location.rest_id) if restaurant_location.rest_id else None,
                'name': f'Restaurant for Table {self.table_label}',
                'location_id': restaurant_location.location_id,
                'active_menu': None,
                'currency': 'GBP',
                'timezone': 'Europe/London',
                'integration_name': 'square',
                'branding': None
            }
        else:
            # No location found, return minimal fallback info
            return {
                'id': str(self.restaurant_id) if self.restaurant_id else None,
                'name': f'Restaurant for Table {self.table_label}',
                'location_id': None,
                'active_menu': None,
                'currency': 'GBP',
                'timezone': 'Europe/London',
                'integration_name': None,
                'branding': None
            }
