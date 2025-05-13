import os
import uuid
import requests
from typing import Dict, List, Optional, Any
from pathlib import Path

from dotenv import load_dotenv

from .pos_adapter import POSAdapter

# Get the base directory (backend folder)
BASE_DIR = Path(__file__).resolve().parent.parent

# Load .env from the backend directory
load_dotenv(os.path.join(BASE_DIR, '.env'))


class CloverAdapter(POSAdapter):
    """
    Clover POS system adapter implementation.
    
    This adapter implements the POSAdapter interface for the Clover payment system,
    providing concrete implementations for all required operations.
    """
    
    def __init__(self):
        """Initialize Clover client with credentials from .env file"""
        self.api_key = os.environ.get('CLOVER_API_KEY')
        self.merchant_id = os.environ.get('CLOVER_MERCHANT_ID')
        self.base_url = os.environ.get('CLOVER_API_URL', 'https://api.clover.com/v3')
        self.sandbox_mode = os.environ.get('CLOVER_SANDBOX', 'True').lower() == 'true'
        
        # If in sandbox mode, use the sandbox URL
        if self.sandbox_mode:
            self.base_url = os.environ.get('CLOVER_SANDBOX_URL', 'https://sandbox.dev.clover.com/v3')
            
    def authenticate(self) -> bool:
        """
        Authenticate with Clover API.
        
        Returns:
            bool: True if authentication is successful, False otherwise.
        """
        try:
            # Try to get merchant info as a simple API test
            headers = self._get_headers()
            response = requests.get(
                f"{self.base_url}/merchants/{self.merchant_id}",
                headers=headers
            )
            return response.status_code == 200
        except Exception:
            return False
            
    def create_order(self, order_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new order in Clover.
        
        Args:
            order_data: Dictionary containing order details.
            
        Returns:
            Dict: Response from Clover with order details.
        """
        try:
            headers = self._get_headers()
            
            # Prepare order data for Clover API
            clover_order = {
                "state": order_data.get("state", "open"),
                "note": order_data.get("note", "")
            }
            
            # Add customer if provided
            if "customer_id" in order_data:
                clover_order["customers"] = {"id": order_data["customer_id"]}
                
            # Create the order
            response = requests.post(
                f"{self.base_url}/merchants/{self.merchant_id}/orders",
                headers=headers,
                json=clover_order
            )
            
            if response.status_code == 200 or response.status_code == 201:
                order = response.json()
                
                # If line items are provided, add them to the order
                if "line_items" in order_data and order_data["line_items"]:
                    order_id = order["id"]
                    for item in order_data["line_items"]:
                        self.add_item_to_order(order_id, item)
                    
                    # Refresh the order to get updated data
                    updated_order = self.retrieve_order(order["id"])
                    if updated_order.get("success"):
                        return updated_order
                
                return {
                    "success": True,
                    "order": order
                }
            else:
                return {
                    "success": False,
                    "errors": response.text
                }
                
        except Exception as e:
            return {
                "success": False,
                "errors": str(e)
            }
            
    def retrieve_order(self, order_id: str) -> Dict[str, Any]:
        """
        Retrieve a specific order from Clover.
        
        Args:
            order_id: The ID of the order to retrieve.
            
        Returns:
            Dict: Order details from Clover.
        """
        try:
            headers = self._get_headers()
            response = requests.get(
                f"{self.base_url}/merchants/{self.merchant_id}/orders/{order_id}",
                headers=headers
            )
            
            if response.status_code == 200:
                return {
                    "success": True,
                    "order": response.json()
                }
            else:
                return {
                    "success": False,
                    "errors": response.text
                }
                
        except Exception as e:
            return {
                "success": False,
                "errors": str(e)
            }
            
    def search_orders(self, **kwargs) -> Dict[str, Any]:
        """
        Search for orders in Clover based on provided criteria.
        
        Args:
            **kwargs: Search parameters for Clover Orders API.
            
        Returns:
            Dict: Search results containing matching orders.
        """
        try:
            headers = self._get_headers()
            
            # Extract parameters from kwargs
            limit = kwargs.get('limit', 20)
            offset = kwargs.get('offset', 0)
            filter_source_names = kwargs.get('filter_source_names')
            
            # Build query parameters
            params = {
                "limit": limit,
                "offset": offset
            }
            
            # Add filter parameters if provided
            if "customer_id" in kwargs:
                params["filter"] = f"customerIds={kwargs['customer_id']}"
                
            if "state" in kwargs:
                state_filter = f"state={kwargs['state']}"
                if "filter" in params:
                    params["filter"] += f"&{state_filter}"
                else:
                    params["filter"] = state_filter
                    
            # If source names are provided, we'll need to filter the results later
            # as Clover doesn't have a direct equivalent to Square's source_filter
                    
            # Execute the search
            response = requests.get(
                f"{self.base_url}/merchants/{self.merchant_id}/orders",
                headers=headers,
                params=params
            )
            
            if response.status_code == 200:
                result = response.json()
                orders = result.get("elements", [])
                
                # If filter_source_names is provided, filter the orders manually
                if filter_source_names:
                    filtered_orders = []
                    for order in orders:
                        # Check if the order has a note containing any of the source names
                        note = order.get("note", "").lower()
                        if any(source.lower() in note for source in filter_source_names):
                            filtered_orders.append(order)
                    orders = filtered_orders
                
                return {
                    "success": True,
                    "orders": orders,
                    "total": len(orders)
                }
            else:
                return {
                    "success": False,
                    "errors": response.text
                }
                
        except Exception as e:
            return {
                "success": False,
                "errors": str(e)
            }
            
    def add_item_to_order(self, order_id: str, item_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Add an item to an existing order in Clover.
        
        Args:
            order_id: The ID of the order to modify.
            item_data: Dictionary containing item details.
            
        Returns:
            Dict: Updated order details.
        """
        try:
            headers = self._get_headers()
            
            # Prepare line item data for Clover API
            line_item = {
                "name": item_data.get("name", "Item"),
                "price": item_data.get("price", 0),
                "quantity": item_data.get("quantity", 1)
            }
            
            # Add item to the order
            response = requests.post(
                f"{self.base_url}/merchants/{self.merchant_id}/orders/{order_id}/line_items",
                headers=headers,
                json=line_item
            )
            
            if response.status_code == 200 or response.status_code == 201:
                # Get the updated order
                return self.retrieve_order(order_id)
            else:
                return {
                    "success": False,
                    "errors": response.text
                }
                
        except Exception as e:
            return {
                "success": False,
                "errors": str(e)
            }
            
    def process_payment(self, payment_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process a payment for an order using Clover.
        
        Args:
            payment_data: Dictionary containing payment details.
            
        Returns:
            Dict: Payment processing result.
        """
        try:
            headers = self._get_headers()
            
            # Extract required fields
            order_id = payment_data.get("order_id")
            amount = payment_data.get("amount")
            
            if not order_id or not amount:
                return {
                    "success": False,
                    "errors": "Missing required fields: order_id and amount are required"
                }
                
            # Prepare payment data for Clover API
            payment = {
                "amount": amount,
                "currency": payment_data.get("currency", "GBP"),
                "external_reference_id": payment_data.get("reference_id", str(uuid.uuid4()))
            }
            
            # Add payment source if provided
            if "source" in payment_data:
                payment["source"] = payment_data["source"]
                
            # Process the payment
            response = requests.post(
                f"{self.base_url}/merchants/{self.merchant_id}/orders/{order_id}/payments",
                headers=headers,
                json=payment
            )
            
            if response.status_code == 200 or response.status_code == 201:
                return {
                    "success": True,
                    "payment": response.json()
                }
            else:
                return {
                    "success": False,
                    "errors": response.text
                }
                
        except Exception as e:
            return {
                "success": False,
                "errors": str(e)
            }
            
    def get_all_orders(self) -> Dict[str, Any]:
        """
        Fetch all orders from Clover without filtering.
        
        Returns:
            Dict: All orders or error details.
        """
        try:
            headers = self._get_headers()
            
            # Get all orders with a large limit
            response = requests.get(
                f"{self.base_url}/merchants/{self.merchant_id}/orders",
                headers=headers,
                params={"limit": 100}
            )
            
            if response.status_code == 200:
                result = response.json()
                return {
                    "success": True,
                    "orders": result.get("elements", [])
                }
            else:
                return {
                    "success": False,
                    "errors": response.text
                }
        except Exception as e:
            return {
                "success": False,
                "errors": str(e)
            }
            
    def list_locations(self) -> Dict[str, Any]:
        """
        List all locations available for this Clover account.
        
        Returns:
            Dict: Location information or error details.
        """
        try:
            headers = self._get_headers()
            
            # Get merchant info which includes locations
            response = requests.get(
                f"{self.base_url}/merchants/{self.merchant_id}",
                headers=headers
            )
            
            if response.status_code == 200:
                merchant = response.json()
                
                # For Clover, we'll return the merchant itself as a location
                # since Clover's API structure is different from Square's
                return {
                    "success": True,
                    "locations": [{
                        "id": merchant.get("id"),
                        "name": merchant.get("name"),
                        "address": merchant.get("address", {})
                    }]
                }
            else:
                return {
                    "success": False,
                    "errors": response.text
                }
        except Exception as e:
            return {
                "success": False,
                "errors": str(e)
            }
            
    def _get_headers(self) -> Dict[str, str]:
        """
        Get the headers required for Clover API requests.
        
        Returns:
            Dict: Headers with authorization and content type.
        """
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
