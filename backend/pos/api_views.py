from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from tables.models import Table
from orders.models import Order
from .square_adapter import SquareAdapter
from .serializers import OrderSerializer


from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt


class TableOrderView(APIView):
    """
    API endpoint to get orders for a specific table
    
    GET /api/tables/{table_id}/order/
    """
    
    def get(self, request, table_id, format=None):
        # Find the table
        table = get_object_or_404(Table, id=table_id)
        
        # Get the most recent open order for this table
        order = Order.objects.filter(
            table=table, 
            status='open'
        ).order_by('-created_at').first()
        
        if not order:
            return Response(
                {"detail": f"No open order found for table {table_id}"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # If we have a Square order ID and no order items yet, try to sync with Square
        if order.pos_reference and not order.items.exists():
            # Initialize Square adapter
            square_adapter = SquareAdapter()
            
            # Get the full order details from Square
            square_order = square_adapter.get(order.pos_reference)
            
            # If successful, add the Square order items to our order
            if square_order and 'success' in square_order and square_order['success']:
                # Process Square order items into our database
                # This would need additional code to parse Square line items 
                # and create OrderItem objects
                pass
        
        # Serialize and return the order
        serializer = OrderSerializer(order)
        return Response(serializer.data)



class SquareWebhookView(APIView):
    """
    Webhook endpoint to receive Square event notifications
    POST /webhooks/square
    """
    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)

    def post(self, request, *args, **kwargs):
        try:
            data = request.data  # Already parsed JSON if DRF is used
            print("🔔 Square Webhook Received:", data)
            # Optional: handle the webhook with your adapter
            return Response({"message": "Received"}, status=status.HTTP_200_OK)
        except Exception as e:
            print("❌ Webhook error:", str(e))
            return Response({"error": "bad request"}, status=status.HTTP_400_BAD_REQUEST)
