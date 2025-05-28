from rest_framework import serializers
from orders.models import Order, OrderItem

class OrderItemSerializer(serializers.ModelSerializer):
    """Serializer for order items"""
    class Meta:
        model = OrderItem
        fields = ['id', 'name', 'description', 'unit_price', 'quantity', 'notes', 'pos_reference', 'total_price']

class OrderSerializer(serializers.ModelSerializer):
    """Serializer for orders with nested items"""
    items = OrderItemSerializer(many=True, read_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    table_number = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = [
            'id', 'table', 'table_number', 'status', 'created_at', 'updated_at',
            'total_amount', 'tax', 'service_charge', 'subtotal', 'pos_reference',
            'square_location_id', 'items'
        ]
    
    def get_table_number(self, obj):
        """Get the table number for easier frontend display"""
        if obj.table:
            return obj.table.number
        return None