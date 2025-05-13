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
    """
    Square POS system adapter implementation.
    
    This adapter implements the POSAdapter interface for the Square payment system,
    providing concrete implementations for all required operations.
    """
    
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
        """
        Create a new order in Square.

        Args:
            order_data: Dictionary containing order details.

        Returns:
            Dict: Response from Square with order details.
        """
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

            # Check for errors
            if result.errors:
                return {
                    "success": False,
                    "error": [e.detail if hasattr(e, 'detail') else str(e) for e in result.errors]
                }

            return {
                "success": True,
                "order": result.order
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

            
    def retrieve(self, order_id: str) -> Dict[str, Any]:
        """
        Retrieve a specific order from Square.
        
        Args:
            order_id: The ID of the order to retrieve.
            
        Returns:
            Dict: Order details from Square.
        """
        try:
            result = self.client.orders.retrieve_order(
                order_id=order_id
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
            
    def search_orders(self, **kwargs) -> Dict[str, Any]:
        """
        Search for orders in Square based on provided criteria.
        
        Args:
            **kwargs: Search parameters for Square Orders API.
                location_ids: List of Square location IDs to filter by.
                closed_at_start: ISO-8601 datetime string to filter orders closed after this time.
                closed_at_end: ISO-8601 datetime string to filter orders closed before this time.
                states: List of order state strings (e.g., ["COMPLETED"]).
                customer_ids: List of Square customer IDs to filter by.
                sort_field: Field to sort by (default: "CLOSED_AT").
                sort_order: "ASC" or "DESC" (default: "DESC").
                limit: Maximum number of records to return per page (1-1000).
                cursor: Pagination cursor from a previous response.
                return_entries: If True, returns "order_entries"; if False, returns "orders".
                filter_source_names: List of source names to filter by (e.g., ["table_1"]).
            
        Returns:
            Dict: Search results containing matching orders.
        """
        try:
            # Extract parameters from kwargs
            location_ids = kwargs.get('location_ids', [self.location_id])
            closed_at_start = kwargs.get('closed_at_start')
            closed_at_end = kwargs.get('closed_at_end')
            states = kwargs.get('states')
            customer_ids = kwargs.get('customer_ids')
            sort_field = kwargs.get('sort_field', 'CLOSED_AT')
            sort_order = kwargs.get('sort_order', 'DESC')
            limit = kwargs.get('limit', 20)
            cursor = kwargs.get('cursor')
            return_entries = kwargs.get('return_entries', True)
            filter_source_names = kwargs.get('filter_source_names')
            
            # Build the filter and sort query
            query: Dict[str, Any] = {"filter": {}, "sort": {"sort_field": sort_field, "sort_order": sort_order}}

            if closed_at_start or closed_at_end:
                date_filter: Dict[str, Any] = {"closed_at": {}}
                if closed_at_start:
                    date_filter["closed_at"]["start_at"] = closed_at_start
                if closed_at_end:
                    date_filter["closed_at"]["end_at"] = closed_at_end
                query["filter"]["date_time_filter"] = date_filter

            if states:
                query["filter"]["state_filter"] = {"states": states}

            if customer_ids:
                query["filter"]["customer_filter"] = {"customer_ids": customer_ids}
                
            # Add source filter if source names are provided
            if filter_source_names:
                query["filter"]["source_filter"] = {"source_names": filter_source_names}

            # Construct request body
            search_body: Dict[str, Any] = {
                "location_ids": location_ids,
                "query": query,
                "limit": limit,
                "return_entries": return_entries
            }
            if cursor:
                search_body["cursor"] = cursor

            result = self.client.orders.search(**search_body)
            # Prepare JSON-serializable response
            response: Dict[str, Any] = {"success": True}
            if return_entries and hasattr(result, 'order_entries'):
                response["order_entries"] = [
                    entry.dict() if hasattr(entry, 'dict') else entry
                    for entry in result.order_entries
                ]
            if not return_entries and hasattr(result, 'orders'):
                response["orders"] = [
                    order.dict() if hasattr(order, 'dict') else order
                    for order in result.orders
                ]
            if hasattr(result, 'cursor') and result.cursor:
                response["cursor"] = result.cursor
            if hasattr(result, 'errors') and result.errors:
                response["errors"] = [
                    error.dict() if hasattr(error, 'dict') else error
                    for error in result.errors
                ]
            return response

        except Exception as e:
            return {
                "success": False,
                "errors": str(e)
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
