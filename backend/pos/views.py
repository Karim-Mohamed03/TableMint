import json
import logging
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.utils.decorators import method_decorator
from django.views import View

from .square_webhook_adapter import SquareWebhookAdapter

logger = logging.getLogger(__name__)

@method_decorator(csrf_exempt, name='dispatch')
class SquareWebhookView(View):
    """
    Handles incoming webhook events from Square
    
    This view processes webhooks for:
    - order.created
    - order.updated
    - payment.updated
    
    And keeps our table orders in sync with Square.
    """
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.adapter = SquareWebhookAdapter()
    
    @method_decorator(require_POST)
    def dispatch(self, request, *args, **kwargs):
        return super().dispatch(request, *args, **kwargs)
    
    def post(self, request, *args, **kwargs):
        # Get the raw request body
        body = request.body.decode('utf-8')
        
        # Verify the webhook signature
        signature_header = request.headers.get('Square-Signature')
        if not signature_header or not self.adapter.verify_webhook_signature(signature_header, body):
            logger.warning("Invalid Square webhook signature")
            return HttpResponse(status=401)
        
        # Parse the webhook payload
        try:
            payload = json.loads(body)
        except json.JSONDecodeError:
            logger.error("Invalid JSON in Square webhook payload")
            return HttpResponse(status=400)
        
        # Get the event type
        event_type = payload.get('type')
        if not event_type:
            logger.error("No event type in Square webhook payload")
            return HttpResponse(status=400)
        
        # Process different event types
        try:
            if event_type == 'order.created' or event_type == 'order.updated':
                result = self.handle_order_event(payload)
                logger.info(f"Processed order event: {result}")
            elif event_type == 'payment.updated':
                result = self.handle_payment_event(payload)
                logger.info(f"Processed payment event: {result}")
            else:
                # We only care about orders and payments
                logger.info(f"Ignoring webhook event of type: {event_type}")
                result = {'status': 'ignored', 'event_type': event_type}
                
            # Always return a 200 OK to acknowledge receipt
            return JsonResponse({'status': 'success', 'result': result})
            
        except Exception as e:
            logger.exception(f"Error processing Square webhook: {e}")
            # We return 200 to acknowledge receipt even if we have processing errors
            # to prevent Square from retrying repeatedly
            return JsonResponse({'status': 'error', 'message': str(e)}, status=200)
    
    def handle_order_event(self, payload):
        """Process order.created or order.updated events"""
        data = payload.get('data', {})
        object_data = data.get('object', {})
        order_data = object_data.get('order', {})
        
        if not order_data:
            logger.error("No order data in payload")
            return {'error': 'No order data found in payload'}
        
        # Sync the order from Square to our system
        result = self.adapter.sync_order_from_square(order_data)
        
        if not result:
            return {'error': 'Failed to sync order from Square'}
            
        return result
    
    def handle_payment_event(self, payload):
        """Process payment.updated events"""
        data = payload.get('data', {})
        object_data = data.get('object', {})
        payment_data = object_data.get('payment', {})
        
        if not payment_data:
            logger.error("No payment data in payload")
            return {'error': 'No payment data found in payload'}
        
        # Update order status based on payment
        result = self.adapter.update_order_status_from_payment(payment_data)
        
        if not result:
            return {'error': 'Failed to update order status'}
            
        return result