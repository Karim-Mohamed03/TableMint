from .webhook_handler import WebhookHandler
import logging
import json
import os
from typing import Dict, Any

logger = logging.getLogger(__name__)

class SquareWebhookHandler(WebhookHandler):
    def __init__(self, square_adapter):
        """
        Initialize the Square webhook handler with a Square adapter
        
        Args:
            square_adapter: An instance of the Square adapter that has a get() method
        """
        self.square_adapter = square_adapter
        super().__init__()
    
    def validate_request(self, request):
        """
        Validate Square webhook signature
        https://developer.squareup.com/docs/webhooks/validate-signatures
        """
        # TODO: Implement Square signature validation
        return True
    
    def get_event_type(self, payload):
        """Square specific event type extraction"""
        return payload.get('type')
    
    def process_event(self, event_type, payload):
        """Process Square webhook events"""
        logger.info(f"Processing Square event: {event_type}")
        
        if event_type == 'order.created':
            return self._handle_order_created(payload)
        elif event_type == 'payment.created':
            return self._handle_payment_created(payload)
        elif event_type == 'refund.created':
            return self._handle_refund_created(payload)
        # Add more event handlers as needed
        
        return True

    def _handle_order_created(self, payload):
        """Handle order.created event"""
        try:
            # Extract data from the webhook payload
            order_data = payload.get('data', {}).get('object', {})
            
            # Get the order ID from the webhook payload
            if 'order' in order_data:
                order = order_data['order']
                order_id = order.get('id')
                logger.info(f"Order created event received with data in payload - Order ID: {order_id}")
            else:
                # Fall back to order_id if full order data isn't in the payload
                order_id = order_data.get('order_id')
                if not order_id and 'order_created' in order_data:
                    order_id = order_data.get('order_created', {}).get('order_id')
                    
                # Special handling for the specific payload structure seen in logs
                if not order_id and isinstance(order_data, dict):
                    for key, value in order_data.items():
                        if isinstance(value, dict) and 'order_id' in value:
                            order_id = value.get('order_id')
                            break
                
                print(f"📢 SQUARE ORDER ID: {order_id}")
                logger.info(f"Order created event received for order ID: {order_id}")
            
            if not order_id:
                logger.error("No order ID found in webhook payload")
                logger.error(f"Payload structure: {json.dumps(payload)}")
                return False
            
            # Use the Square adapter to fetch the complete order details
            logger.info(f"Fetching order details from Square for order ID: {order_id}")
            order_response = self.square_adapter.get(order_id)
            
            # Check if the request was successful
            if not order_response.get('success', True):
                logger.error(f"Failed to retrieve order details: {order_response.get('errors')}")
                return False
            
            # Log the raw response for debugging
            logger.info(f"Square API response: {json.dumps(order_response) if order_response else 'None'}")
            
            # Extract reference_id and customer_id from the order details
            if order_response and 'order' in order_response:
                order = order_response['order']
                reference_id = order.get('reference_id')
                customer_id = order.get('customer_id')
                
                # Print the reference ID to terminal
                print(f"📝 Square Order Reference ID: {reference_id}")
                logger.info(f"Square Order Reference ID: {reference_id}")
                
                # Continue with processing
                logger.info(f"Square Order Alert: New order created - Order ID: {order_id}, Reference ID: {reference_id}")
                
                # Example notification payload that includes reference_id
                notification_payload = {
                    'event_type': 'order.created',
                    'order_id': order_id,
                    'reference_id': reference_id,
                    'timestamp': order.get('created_at')
                }
                
                # TODO: Send notification with the payload to your notification system
                # self._send_notification(notification_payload)
                
                return True
            else:
                logger.error(f"Could not retrieve order details for order {order_id}")
                if order_response:
                    logger.error(f"Order details response structure: {json.dumps(order_response)}")
                return False
                
        except Exception as e:
            logger.error(f"Error processing order.created webhook: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            return False
    
    def _handle_payment_created(self, payload):
        """Handle payment.created event"""
        # Implement payment processing logic
        return True
    
    def _handle_refund_created(self, payload):
        """Handle refund.created event"""
        # Implement refund processing logic
        return True