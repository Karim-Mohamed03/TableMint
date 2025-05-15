import os
import logging
import json
import uuid
from typing import Dict, Any, Optional
from pathlib import Path

from dotenv import load_dotenv
from square import Square
from square.environment import SquareEnvironment

from .pos_adapter import POSAdapter

logger = logging.getLogger(__name__)

# Get the base directory (backend folder)
BASE_DIR = Path(__file__).resolve().parent.parent

# Load .env from the backend directory
load_dotenv(os.path.join(BASE_DIR, '.env'))


class SquareWebhookAdapter(POSAdapter):
    """
    Extended Square adapter with webhook handling functions
    """
    def __init__(self):
        """Initialize Square client with access token from .env file"""
        self.client = Square(
            token=os.environ.get('SQUARE_ACCESS_TOKEN'),
            environment=SquareEnvironment.SANDBOX  # Change to PRODUCTION in production
        )
        self.location_id = os.environ.get('SQUARE_LOCATION_ID')
        self.webhook_signature_key = os.environ.get('SQUARE_WEBHOOK_SIGNATURE_KEY', '')
        
    def verify_webhook_signature(self, signature_header: str, body: str) -> bool:
        """
        Verify that the webhook request was sent by Square
        
        Args:
            signature_header: The Square-Signature header from the request
            body: The raw request body as a string
            
        Returns:
            bool: True if signature is valid, False otherwise
        """
        try:
            import hmac
            import hashlib
            
            if not signature_header or not self.webhook_signature_key:
                logger.error("Missing signature header or webhook signature key")
                return False
                
            # Parse the signature header
            signature_parts = {}
            for part in signature_header.split(','):
                key, value = part.split('=')
                signature_parts[key] = value
            
            if 't' not in signature_parts or 'v1' not in signature_parts:
                logger.error("Invalid signature format")
                return False
                
            timestamp = signature_parts['t']
            signature = signature_parts['v1']
            
            # Calculate expected signature
            message = f"{timestamp}{body}"
            expected_signature = hmac.new(
                self.webhook_signature_key.encode('utf-8'),
                message.encode('utf-8'),
                hashlib.sha256
            ).hexdigest()
            
            # Use constant-time comparison to prevent timing attacks
            return hmac.compare_digest(expected_signature, signature)
            
        except Exception as e:
            logger.exception(f"Error verifying webhook signature: {e}")
            return False
    
    def get_table_id_from_order(self, order_id: str) -> Optional[int]:
        """
        Gets the table_id from a Square order using custom attributes.
        
        First tries to get it from the custom attributes API.
        If that fails, tries to get it from the reference_id field.
        
        Args:
            order_id (str): The Square order ID
            
        Returns:
            int: The table ID or None if not found
        """
        try:
            # First try to get the order with custom attributes
            result = self.client.orders.retrieve_order(order_id=order_id)
            
            if not result.is_success():
                logger.error(f"Failed to retrieve order {order_id}: {result.errors}")
                return None
                
            order = result.body.get('order', {})
            
            # First check for custom attribute named 'table_id'
            custom_attributes = order.get('custom_attributes', [])
            for attr in custom_attributes:
                if attr.get('name') == 'table_id' and attr.get('value'):
                    try:
                        return int(attr.get('value'))
                    except (ValueError, TypeError):
                        logger.error(f"Invalid table_id custom attribute: {attr.get('value')}")
            
            # Next, check the reference_id field
            reference_id = order.get('reference_id')
            if reference_id and reference_id.startswith('table_'):
                try:
                    return int(reference_id.split('_')[1])
                except (IndexError, ValueError):
                    logger.error(f"Invalid reference_id format: {reference_id}")
            
            # Finally, try to find the table ID in the source name
            # Some POS integrations put this as "Table 5" in the source name
            source_name = order.get('source', {}).get('name', '')
            if source_name and source_name.lower().startswith('table '):
                try:
                    return int(source_name.split(' ')[1])
                except (IndexError, ValueError):
                    logger.error(f"Invalid source name format: {source_name}")
            
            logger.error(f"Could not find table_id for order {order_id}")
            return None
            
        except Exception as e:
            logger.exception(f"Error retrieving table_id from Square: {e}")
            return None
            
    def update_order_status_from_payment(self, payment_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Updates order status based on payment information
        
        Args:
            payment_data: Payment data from Square webhook
            
        Returns:
            Dict: Updated order information or None if error
        """
        try:
            order_id = payment_data.get('order_id')
            if not order_id:
                logger.error("No order_id in payment data")
                return None
                
            payment_status = payment_data.get('status')
            
            # Determine our internal order status based on Square payment status
            order_status = 'open'  # Default to open
            if payment_status == 'COMPLETED':
                order_status = 'paid'
            elif payment_status in ['FAILED', 'CANCELED']:
                order_status = 'cancelled'
            
            # Get the order to update
            from orders.models import Order
            order = Order.get_by_square_order_id(order_id)
            
            if not order:
                logger.error(f"Could not find order with Square ID {order_id}")
                return None
                
            # Update the order status
            order.status = order_status
            order.save()
            
            return {
                'success': True,
                'order_id': order.id,
                'square_order_id': order_id,
                'new_status': order_status
            }
            
        except Exception as e:
            logger.exception(f"Error updating order status: {e}")
            return None
            
    def sync_order_from_square(self, order_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Syncs order information from Square to our system
        
        Args:
            order_data: Order data from Square webhook
            
        Returns:
            Dict: Updated order information or None if error
        """
        try:
            order_id = order_data.get('id')
            if not order_id:
                logger.error("No order ID in order data")
                return None
                
            location_id = order_data.get('location_id')
            if not location_id:
                logger.error("No location ID in order data")
                return None
                
            # Get the table ID for this order
            table_id = self.get_table_id_from_order(order_id)
            if not table_id:
                logger.error(f"Could not determine table_id for order {order_id}")
                return None
                
            # Determine order status
            state = order_data.get('state', '')
            status = 'open'
            if state == 'COMPLETED':
                status = 'paid'
            elif state == 'CANCELED':
                status = 'cancelled'
                
            # Create or update the order in our system
            from orders.models import Order
            order, created = Order.update_or_create_from_square(
                square_order_id=order_id,
                table_id=table_id,
                location_id=location_id,
                status=status
            )
            
            # Optionally sync order items if needed
            # This would require additional code to parse line items from Square
            
            return {
                'success': True,
                'order_id': order.id,
                'square_order_id': order_id,
                'table_id': table_id,
                'status': status,
                'created': created
            }
            
        except Exception as e:
            logger.exception(f"Error syncing order from Square: {e}")
            return None