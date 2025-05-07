from django.db import models
import uuid

class Payment(models.Model):
    PAYMENT_METHODS = (
        ('credit_card', 'Credit Card'),
        ('apple_pay', 'Apple Pay'),
        ('google_pay', 'Google Pay'),
        ('cash', 'Cash'),
    )
    
    PAYMENT_STATUS = (
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    )
    
    order = models.ForeignKey('orders.Order', on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=50, choices=PAYMENT_METHODS)
    status = models.CharField(max_length=20, choices=PAYMENT_STATUS, default='pending')
    transaction_id = models.CharField(max_length=255, blank=True, null=True)
    reference_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    # Payment gateway response data
    gateway_response = models.JSONField(blank=True, null=True)
    
    def __str__(self):
        return f"Payment {self.reference_id} - {self.get_payment_method_display()} - {self.amount}"
    
    def complete_payment(self, transaction_id=None, gateway_response=None):
        """Mark payment as completed with transaction details"""
        self.status = 'completed'
        if transaction_id:
            self.transaction_id = transaction_id
        if gateway_response:
            self.gateway_response = gateway_response
        self.save()
        
        # Update the associated order status
        self.order.status = 'paid'
        self.order.save()
        
        return True
    
    def fail_payment(self, gateway_response=None):
        """Mark payment as failed with optional error details"""
        self.status = 'failed'
        if gateway_response:
            self.gateway_response = gateway_response
        self.save()
        return True
