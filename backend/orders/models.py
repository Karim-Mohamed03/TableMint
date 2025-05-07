from django.db import models
from decimal import Decimal

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
