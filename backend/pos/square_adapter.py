import os
import uuid
from typing import Dict, List, Optional, Any
from pathlib import Path

from dotenv import load_dotenv
from square import Square
from square.environment import SquareEnvironment
from square.core.api_error import ApiError

from .pos_adapter import POSAdapter

# Get the base directory (backend folder)
BASE_DIR = Path(__file__).resolve().parent.parent

# Load .env from the backend directory
load_dotenv(os.path.join(BASE_DIR, '.env'))


class SquareAdapter(POSAdapter):
    def __init__(self):
        """Initialize Square client with access token from .env file"""
        self.client = Square(
            token=os.environ.get('SQUARE_ACCESS_TOKEN'),
            environment=SquareEnvironment.SANDBOX
        )
        self.location_id = os.environ.get('SQUARE_LOCATION_ID')
        
    def authenticate(self) -> bool:
        """
        Authenticate with Square API.
        
        Returns:
            bool: True if authentication is successful, False otherwise.
        """
        try:
            # Try to list locations as a simple API test
            result = self.client.locations.list_locations()
            return result.is_success()
        except Exception:
            return False
            
    def create(self, order_data: Dict[str, Any]) -> Dict[str, Any]:

        try:
            # Ensure we have at least one line item
            line_items = order_data.get("line_items")
            if not line_items:
                return {
                    "success": False,
                    "error": "At least one line item is required."
                }

            # Build idempotency_key
            idempotency_key = order_data.get("idempotency_key", str(uuid.uuid4()))

            # Build the order payload
            order_payload: Dict[str, Any] = {
                "location_id": order_data.get("location_id", self.location_id),
                "line_items": line_items,
            }

            # Optional additions
            for opt in ("customer_id", "reference_id"):
                if order_data.get(opt):
                    order_payload[opt] = order_data[opt]

            # Create the order
            result = self.client.orders.create(
                idempotency_key=idempotency_key,
                order=order_payload
            )

            # Check if the result has errors attribute and it contains errors
            if hasattr(result, 'errors') and result.errors:
                return {
                    "success": False,
                    "error": [e.detail if hasattr(e, 'detail') else str(e) for e in result.errors]
                }

            # Check the response structure and extract the order data
            if hasattr(result, 'order'):
                # If the response has an 'order' attribute directly
                order_obj = result.order
            elif hasattr(result, 'body') and hasattr(result.body, 'order'):
                # If the response has a 'body' attribute that contains an 'order'
                order_obj = result.body.order
            else:
                # If we can't find the order in the expected places, return the whole result
                return {
                    "success": True,
                    "order": result
                }

            # Convert the order object to a dictionary if needed
            if hasattr(order_obj, 'dict'):
                # If the order object has a dict method, use it
                order_dict = order_obj.dict()
            elif isinstance(order_obj, dict):
                # If it's already a dictionary
                order_dict = order_obj
            else:
                # Last resort - try to convert to dictionary using __dict__
                try:
                    order_dict = vars(order_obj)
                except:
                    # If all else fails, return the original object and let the view handle it
                    return {
                        "success": True,
                        "order": order_obj
                    }

            return {
                "success": True,
                "order": order_dict
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

            
    def get(self, order_id: str) -> Dict[str, Any]:
        try:
            result = self.client.orders.get(
                order_id=order_id
            )
            return result
        except Exception as e:
            return {
                "success": False,
                "errors": str(e)
            }

    
            
    def search(self, **kwargs) -> Dict[str, Any]:
    
        try:
            # Extract parameters from kwargs
            location_ids = kwargs.get('location_ids', [self.location_id])
            closed_at_start = kwargs.get('closed_at_start')
            closed_at_end = kwargs.get('closed_at_end')
            states = kwargs.get('states')
            customer_ids = kwargs.get('customer_ids')
            sort_field = kwargs.get('sort_field')
            sort_order = kwargs.get('sort_order', 'DESC')
            limit = kwargs.get('limit', 20)
            cursor = kwargs.get('cursor')
            return_entries = kwargs.get('return_entries', True)
            filter_source_names = kwargs.get('filter_source_names')
            
            # Set default sort field based on states
            # If states contains only OPEN, use CREATED_AT
            # If states contains COMPLETED or CANCELED, use CLOSED_AT
            # If sort_field is explicitly provided, use that instead
            if not sort_field:
                if states and all(state in ['COMPLETED', 'CANCELED'] for state in states):
                    sort_field = 'CLOSED_AT'
                else:
                    sort_field = 'CREATED_AT'
                
            # Build the filter and sort query
            query = {"filter": {}, "sort": {"sort_field": sort_field, "sort_order": sort_order}}

            # Add date_time_filter if start/end dates are provided
            if closed_at_start or closed_at_end:
                date_time_filter = {"closed_at": {}}
                if closed_at_start:
                    date_time_filter["closed_at"]["start_at"] = closed_at_start
                if closed_at_end:
                    date_time_filter["closed_at"]["end_at"] = closed_at_end
                query["filter"]["date_time_filter"] = date_time_filter

            # Add state filter if states are provided
            if states:
                query["filter"]["state_filter"] = {"states": states}

            # Add customer filter if customer IDs are provided
            if customer_ids:
                query["filter"]["customer_filter"] = {"customer_ids": customer_ids}
                
            # Add source filter if source names are provided
            if filter_source_names:
                query["filter"]["source_filter"] = {"source_names": filter_source_names}

            # Construct complete request body
            search_body = {
                "location_ids": location_ids,
                "query": query,
                "limit": limit,
                "return_entries": return_entries
            }
            
            # Add cursor for pagination if provided
            if cursor:
                search_body["cursor"] = cursor

            # Call the Square Orders API search method
            result = self.client.orders.search(**search_body)
            
            # Handle different result structures depending on what was requested
            response = {"success": True}
            
            # Check for errors first
            if hasattr(result, 'errors') and result.errors:
                return {
                    "success": False,
                    "error": [e.detail if hasattr(e, 'detail') else str(e) for e in result.errors]
                }
                
            # Extract the appropriate data based on the response structure
            if hasattr(result, 'body'):
                # If response has a body attribute containing the results
                if return_entries and 'order_entries' in result.body:
                    response["order_entries"] = result.body['order_entries']
                elif not return_entries and 'orders' in result.body:
                    response["orders"] = result.body['orders']
                
                # Add cursor for pagination if present
                if 'cursor' in result.body:
                    response["cursor"] = result.body['cursor']
                    
            elif hasattr(result, 'order_entries') and return_entries:
                # Direct access to order_entries
                response["order_entries"] = [
                    entry.dict() if hasattr(entry, 'dict') else entry
                    for entry in result.order_entries
                ]
            elif hasattr(result, 'orders') and not return_entries:
                # Direct access to orders
                response["orders"] = [
                    order.dict() if hasattr(order, 'dict') else order
                    for order in result.orders
                ]
                
            # Add cursor if available directly on the result
            if hasattr(result, 'cursor') and result.cursor:
                response["cursor"] = result.cursor
                
            return response

        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
            
    def add_item_to_order(self, order_id: str, item_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Add an item to an existing order in Square.
        
        Args:
            order_id: The ID of the order to modify.
            item_data: Dictionary containing item details.
            
        Returns:
            Dict: Updated order details.
        """
        try:
            # First retrieve the current order
            order_result = self.retrieve_order(order_id)
            
            if not order_result.get('success', False):
                return order_result
                
            order = order_result.get('order', {})
            version = order.get('version', 0)
            
            # Create update request with new line item
            update_body = {
                "order": {
                    "location_id": order.get('location_id', self.location_id),
                    "version": version,
                    "line_items": [item_data]
                },
                "idempotency_key": str(uuid.uuid4())
            }
            
            # Update the order
            result = self.client.orders.update_order(
                order_id=order_id,
                body=update_body
            )
            
            if result.is_success():
                return {
                    "success": True,
                    "order": result.body.get('order')
                }
            else:
                return {
                    "success": False,
                    "errors": result.errors
                }
                
        except Exception as e:
            return {
                "success": False,
                "errors": str(e)
            }
            
    def process_payment(self, payment_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process a payment for an order using Square.
        
        Args:
            payment_data: Dictionary containing payment details.
            
        Returns:
            Dict: Payment processing result.
        """
        try:
            # Extract required fields
            source_id = payment_data.get('source_id')
            amount = payment_data.get('amount')
            
            if not source_id or not amount:
                return {
                    'success': False, 
                    'error': 'Missing required fields: source_id and amount are required'
                }
                
            # Optional fields
            currency = payment_data.get('currency', 'GBP')
            idempotency_key = payment_data.get('idempotency_key', str(uuid.uuid4()))
            customer_id = payment_data.get('customer_id')
            location_id = payment_data.get('location_id')
            reference_id = payment_data.get('reference_id')
            note = payment_data.get('note')
            app_fee_amount = payment_data.get('app_fee_amount')
            autocomplete = payment_data.get('autocomplete', True)
            
            # Build the payload for payment creation
            payment_body: Dict[str, Any] = {
                "idempotency_key": idempotency_key,
                "amount_money": {"amount": amount, "currency": currency},
                "source_id": source_id,
                "autocomplete": autocomplete
            }
            
            # Optional fields
            if customer_id:
                payment_body["customer_id"] = customer_id
            if location_id:
                payment_body["location_id"] = location_id
            elif self.location_id:
                payment_body["location_id"] = self.location_id
            if reference_id:
                payment_body["reference_id"] = reference_id
            if note:
                payment_body["note"] = note
            if app_fee_amount is not None:
                payment_body["app_fee_money"] = {"amount": app_fee_amount, "currency": currency}
                
            # Call the Square Payments API
            result = self.client.payments.create(**payment_body)
            
            # Format the response
            response: Dict[str, Any] = {"success": True}
            if hasattr(result, 'payment'):
                response['payment'] = (
                    result.payment.dict() if hasattr(result.payment, 'dict') else result.payment
                )
            else:
                response = {"success": True, "result": result}
                
            return response
            
        except Exception as e:
            return {
                "success": False,
                "errors": str(e)
            }

    def get_all_orders(self) -> Dict[str, Any]:
        """
        Fetch all orders from Square without using search.
        This is a fallback method for simpler implementations.
        
        Returns:
            Dict: All orders or error details.
        """
        try:
            # Get orders using the orders API
            result = self.client.orders.get()
            
            if result.is_success():
                return {
                    "success": True,
                    "orders": result.body.get("orders", [])
                }
            else:
                return {
                    "success": False,
                    "errors": result.errors
                }
        except Exception as e:
            return {
                "success": False,
                "errors": str(e)
            }
            
    def list_locations(self) -> Dict[str, Any]:
        """
        List all locations available for this Square account.
        
        Returns:
            Dict: Location information or error details.
        """
        try:
            result = self.client.locations.list_locations()
            
            if result.is_success():
                return {
                    "success": True,
                    "locations": result.body.get('locations', [])
                }
            else:
                return {
                    "success": False,
                    "errors": result.errors
                }
        except Exception as e:
            return {
                "success": False,
                "errors": str(e)
            }
    
    def create_payment(self, payment_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a payment using Square.
        
        Args:
            payment_data: Dictionary containing payment details including:
                - source_id: ID of the payment source (card nonce, card token, etc.)
                - amount: Payment amount in the smallest currency unit (e.g., cents for USD/GBP)
                - currency: Currency code (default: GBP)
                - idempotency_key: Unique key to prevent duplicate processing (auto-generated if not provided)
                - order_id: Optional ID of an order to associate with this payment
                - customer_id: Optional ID of a customer making the payment
                - location_id: Optional location ID (uses default location if not provided)
                - reference_id: Optional reference ID for the payment
                - note: Optional note about the payment
                - tip_money: Optional tip amount
                - app_fee_money: Optional app fee amount
                - delay_capture: Whether to delay payment capture (default: False)
                - autocomplete: Whether to autocomplete the payment (default: True)
                - verification_token: Optional verification token for SCA
                
        Returns:
            Dict: Payment creation result including payment details or error information.
        """
        try:
            # Extract required fields
            source_id = payment_data.get('source_id')
            amount = payment_data.get('amount')
            
            if not source_id or not amount:
                return {
                    'success': False, 
                    'error': 'Missing required fields: source_id and amount are required'
                }
                
            # Optional fields with defaults
            currency = payment_data.get('currency', 'GBP')
            idempotency_key = payment_data.get('idempotency_key', str(uuid.uuid4()))
            order_id = payment_data.get('order_id')
            customer_id = payment_data.get('customer_id')
            location_id = payment_data.get('location_id', self.location_id)
            reference_id = payment_data.get('reference_id')
            note = payment_data.get('note')
            tip_money = payment_data.get('tip_money')
            app_fee_amount = payment_data.get('app_fee_amount')
            delay_capture = payment_data.get('delay_capture', False)
            autocomplete = payment_data.get('autocomplete', True)
            verification_token = payment_data.get('verification_token')
            
            # Build the payload for payment creation
            payment_body = {
                "idempotency_key": idempotency_key,
                "amount_money": {"amount": amount, "currency": currency},
                "source_id": source_id,
                "delay_capture": delay_capture,
                "autocomplete": autocomplete
            }
            
            # Add optional fields if provided
            if customer_id:
                payment_body["customer_id"] = customer_id
            if location_id:
                payment_body["location_id"] = location_id
            if order_id:
                payment_body["order_id"] = order_id
            if reference_id:
                payment_body["reference_id"] = reference_id
            if note:
                payment_body["note"] = note
            if verification_token:
                payment_body["verification_token"] = verification_token
            if tip_money:
                payment_body["tip_money"] = {"amount": tip_money, "currency": currency}
            if app_fee_amount is not None:
                payment_body["app_fee_money"] = {"amount": app_fee_amount, "currency": currency}
                
            # Call the Square Payments API to create the payment
            result = self.client.payments.create(**payment_body)
            
            # Check if the result has errors attribute and it contains errors
            if hasattr(result, 'errors') and result.errors:
                return {
                    "success": False,
                    "error": [e.detail if hasattr(e, 'detail') else str(e) for e in result.errors]
                }
            
            # Extract payment information from the response
            payment = None
            if hasattr(result, 'payment'):
                payment = result.payment
            elif hasattr(result, 'body') and hasattr(result.body, 'payment'):
                payment = result.body.payment
                
            # Convert payment object to dictionary if possible
            if payment:
                if hasattr(payment, 'dict'):
                    payment_dict = payment.dict()
                elif isinstance(payment, dict):
                    payment_dict = payment
                else:
                    try:
                        payment_dict = vars(payment)
                    except:
                        payment_dict = payment
                        
                return {
                    "success": True,
                    "payment": payment_dict
                }
            else:
                # Return the raw result if we can't extract the payment
                return {
                    "success": True,
                    "result": result
                }
                
        except ApiError as e:
            return {
                "success": False,
                "error": str(e),
                "code": e.status_code if hasattr(e, 'status_code') else 'unknown'
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    def create_external_payment(self, order_id: str, amount: int, source: str = "stripe") -> Dict[str, Any]:
        """
        Create a payment record in Square for a payment that was processed externally (e.g., with Stripe).
        This is useful for keeping your Square system in sync with payments processed through other systems.
        
        Args:
            order_id: The Square order ID to associate with this payment
            amount: Payment amount in smallest currency unit (cents for GBP)
            source: Name of the external payment source (default: "stripe")
            
        Returns:
            Dict: Payment creation result including payment details or error information
        """
        try:
            if not order_id or amount is None:
                return {
                    'success': False,
                    'error': 'Missing required fields: order_id and amount are required'
                }
            
            # Create a unique idempotency key
            idempotency_key = str(uuid.uuid4())
            
            # Build the payment request body
            payment_body = {
                "idempotency_key": idempotency_key,
                "source_id": "EXTERNAL",
                "amount_money": {
                    "amount": amount,
                    "currency": "GBP"
                },
                "external_details": {
                    "type": "EXTERNAL",
                    "source": source
                },
                "order_id": order_id
            }
            
            # Add location ID if available
            if self.location_id:
                payment_body["location_id"] = self.location_id
            
            # Call the Square Payments API
            result = self.client.payments.create(**payment_body)
            
            # Check for errors
            if hasattr(result, 'errors') and result.errors:
                return {
                    "success": False,
                    "error": [e.detail if hasattr(e, 'detail') else str(e) for e in result.errors]
                }
            
            # Extract payment information
            payment = None
            if hasattr(result, 'payment'):
                payment = result.payment
            elif hasattr(result, 'body') and hasattr(result.body, 'payment'):
                payment = result.body.payment
            
            # Format the payment result
            if payment:
                if hasattr(payment, 'dict'):
                    payment_dict = payment.dict()
                elif isinstance(payment, dict):
                    payment_dict = payment
                else:
                    try:
                        payment_dict = vars(payment)
                    except:
                        payment_dict = payment
                
                return {
                    "success": True,
                    "payment": payment_dict
                }
            else:
                return {
                    "success": True,
                    "result": result
                }
        
        except ApiError as e:
            return {
                "success": False,
                "error": str(e),
                "code": e.status_code if hasattr(e, 'status_code') else 'unknown'
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

