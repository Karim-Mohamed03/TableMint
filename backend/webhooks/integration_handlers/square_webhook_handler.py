from .webhook_handler import WebhookHandler
import logging
import requests
import json
import os

logger = logging.getLogger(__name__)

class SquareWebhookHandler(WebhookHandler):
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

    def _fetch_order_from_square(self, order_id):
        """
        Fetch order details from Square API
        """
        try:
            # Get Square API credentials from environment
            access_token = os.environ.get('SQUARE_ACCESS_TOKEN')
            base_url = os.environ.get('SQUARE_API_URL', 'https://connect.squareup.com/v2')
            
            # Set up request headers
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            # Make API call to Square to get order details
            url = f"{base_url}/orders/{order_id}"
            response = requests.get(url, headers=headers)
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"Failed to fetch order from Square. Status: {response.status_code}, Response: {response.text}")
                return None
        except Exception as e:
            logger.error(f"Error fetching order from Square: {str(e)}")
            return None

    def _fetch_customer_custom_attribute(self, customer_id, attribute_key):
        """
        Fetch a specific custom attribute for a customer from Square API
        
        Args:
            customer_id (str): The Square customer ID
            attribute_key (str): The key of the custom attribute to fetch
            
        Returns:
            str: The value of the custom attribute, or None if not found
        """
        try:
            if not customer_id:
                logger.warning("Cannot fetch customer custom attribute: No customer_id provided")
                return None
                
            # Get Square API credentials from environment
            access_token = os.environ.get('SQUARE_ACCESS_TOKEN')
            base_url = os.environ.get('SQUARE_API_URL', 'https://connect.squareup.com/v2')
            
            # Set up request headers
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            # Make API call to Square to get customer custom attributes
            url = f"{base_url}/customers/{customer_id}/custom-attributes/{attribute_key}"
            
            response = requests.get(url, headers=headers)
            
            if response.status_code == 200:
                custom_attribute_data = response.json()
                if 'custom_attribute' in custom_attribute_data:
                    return custom_attribute_data['custom_attribute'].get('value')
                    
                logger.warning(f"Custom attribute data structure unexpected: {custom_attribute_data}")
                return None
            else:
                logger.error(f"Failed to fetch customer custom attribute from Square. Status: {response.status_code}, Response: {response.text}")
                return None
        except Exception as e:
            logger.error(f"Error fetching customer custom attribute from Square: {str(e)}")
            return None

    def _handle_order_created(self, payload):
        """Handle order.created event"""
        try:
            # Extract data from the webhook payload
            order_data = payload.get('data', {}).get('object', {})
            customer_id = None
            table_number = None
            
            # Check if order is directly in the payload
            if 'order' in order_data:
                order = order_data['order']
                order_id = order.get('id')
                reference_id = order.get('reference_id')
                # Extract customer ID if available in the payload
                customer_id = order.get('customer_id')
                logger.info(f"Order created event received with data in payload - Order ID: {order_id}, Reference ID: {reference_id}")
            else:
                # Fall back to order_id if full order data isn't in the payload
                order_id = order_data.get('order_id')
                logger.info(f"Order created event received for order ID: {order_id}")
                
                # Make an API call to Square to fetch the complete order details
                order_details = self._fetch_order_from_square(order_id)
                
                # Extract reference_id and customer_id from the order details
                if order_details and 'order' in order_details:
                    order = order_details['order']
                    reference_id = order.get('reference_id')
                    customer_id = order.get('customer_id')
                else:
                    reference_id = None
                    logger.warning(f"Could not retrieve order details for order {order_id}")
            
            # Fetch table number from customer custom attributes if customer_id is available
            if customer_id:
                table_number = self._fetch_customer_custom_attribute(customer_id, 'table-number')
                if table_number:
                    logger.info(f"Retrieved table number for customer {customer_id}: {table_number}")
                else:
                    logger.warning(f"Could not retrieve table number for customer {customer_id}")
            
            # Create a detailed alert/log with order ID, reference ID, and table number
            if reference_id:
                logger.info(f"Square Order Alert: New order created - Order ID: {order_id}, Reference ID: {reference_id}, Table Number: {table_number}")
                
                # Example notification payload that includes reference_id and table number
                notification_payload = {
                    'event_type': 'order.created',
                    'order_id': order_id,
                    'reference_id': reference_id,
                    'timestamp': order_data.get('created_at')
                }
                
                # Add table number to notification payload if available
                if table_number:
                    notification_payload['table_number'] = table_number
                
                # TODO: Send notification with the payload to your notification system
                # self._send_notification(notification_payload)
            
            return True
        except Exception as e:
            logger.error(f"Error processing order.created webhook: {str(e)}")
            return False
    
    def _handle_payment_created(self, payload):
        """Handle payment.created event"""
        # Implement payment processing logic
        return True
    
    def _handle_refund_created(self, payload):
        """Handle refund.created event"""
        # Implement refund processing logic
        return True

