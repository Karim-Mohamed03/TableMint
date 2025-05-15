from django.db import models
import json


class Payment(models.Model):
    """Model to store payment information."""
    
    # Payment status choices
    STATUS_PENDING = 'pending'
    STATUS_COMPLETED = 'completed'
    STATUS_FAILED = 'failed'
    STATUS_CANCELED = 'canceled'
    
    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_COMPLETED, 'Completed'),
        (STATUS_FAILED, 'Failed'),
        (STATUS_CANCELED, 'Canceled'),
    ]
    
    # Square payment ID
    square_payment_id = models.CharField(max_length=255, unique=True, null=True, blank=True)
    
    # Basic payment information
    amount = models.IntegerField(help_text="Amount in cents")
    currency = models.CharField(max_length=3, default="USD")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    
    # Payment metadata
    idempotency_key = models.UUIDField(unique=True)
    source_id = models.CharField(max_length=255)
    customer_id = models.CharField(max_length=255, null=True, blank=True)
    reference_id = models.CharField(max_length=255, null=True, blank=True)
    note = models.TextField(null=True, blank=True)
    
    # Response data
    response_data = models.JSONField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Payment {self.id}: {self.amount/100} {self.currency} - {self.status}"


class OrderSearch(models.Model):
    """Model to store order search history."""
    
    # Search parameters and results
    search_params = models.JSONField(null=True, blank=True)
    result_count = models.IntegerField(default=0)
    cursor = models.CharField(max_length=255, null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    
    def set_search_params(self, params_dict):
        """Set search parameters as a JSON string"""
        self.search_params = params_dict
    
    def get_search_params(self):
        """Get search parameters as a dictionary"""
        return self.search_params
    
    def __str__(self):
        return f"Order Search {self.id}: {self.result_count} results - {self.created_at}"


class PhillyCheesesteakPayment(models.Model):
    """Model to store Marwan's Philly Cheesesteak payment information."""
    
    # Required fields
    order_id = models.CharField(max_length=255)
    payment_id = models.CharField(max_length=255)
    location_id = models.CharField(max_length=255)
    
    # Amount information (updated to separate base amount and tip)
    amount = models.IntegerField(help_text="Total amount in cents (base amount + tip)")
    base_amount = models.IntegerField(help_text="Base amount without tip, in cents", null=True)
    tip_amount = models.IntegerField(help_text="Tip amount in cents", null=True)
    
    # Order total from Square
    total_money = models.IntegerField(help_text="Total amount from Square order in cents", null=True)
    total_currency = models.CharField(max_length=3, default="GBP")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        base_display = f"${self.base_amount/100:.2f}" if self.base_amount is not None else "N/A"
        tip_display = f"${self.tip_amount/100:.2f}" if self.tip_amount is not None else "N/A"
        total_display = f"${self.total_money/100:.2f}" if self.total_money is not None else "N/A"
        return f"Philly Payment: Order {self.order_id}, Base: {base_display}, Tip: {tip_display}, Order Total: {total_display}"