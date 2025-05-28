import requests
import uuid
import datetime
import json
import logging
import time
import hmac
import hashlib
import base64

from email.utils import formatdate

# Default configuration values
DEFAULT_BASE_URL = "https://api.ncr.com/order/3/orders/1"  # From order-service variable
DEFAULT_ACCESS_KEY = "AccessKey 2570d9ed65b249d59f0a37a656371ce3:yJgACb/5cHryqTednETBlE/A8XO2cYVjl1TyC1VIMr943Q4i96j7u1n40e0vHOClQKuy5Gm5yMJAa1y+Sl8uVg=="      # First part of the access key
DEFAULT_SECRET_KEY = "26ff4c8e00cf4a8db81bedbb395945f7"  # Second part of the access key
DEFAULT_ORG_ID = "test-drive-d64fa11d6c414ef890523"         # From bsp-organization variable
DEFAULT_SHARED_KEY = "2570d9ed65b249d59f0a37a656371ce3"

class NCRAdapter:
    def __init__(self, 
                 base_url=DEFAULT_BASE_URL, 
                 access_key=DEFAULT_ACCESS_KEY,
                 secret_key=DEFAULT_SECRET_KEY, 
                 org_id=DEFAULT_ORG_ID,
                 shared_key=DEFAULT_SHARED_KEY):
        self.shared_key = shared_key
        self.base_url = base_url
        self.access_key = access_key
        self.secret_key = secret_key
        self.org_id = org_id
        self.logger = logging.getLogger(__name__)

    def _generate_signature(self, method, path, date):
        """Generate HMAC signature for NCR API authentication"""
        message = f"{method}\n{path}\n{date}"
        self.logger.debug(f"Signature message: {message}")
        
        # Create HMAC SHA-256 signature
        signature = hmac.new(
            base64.b64decode(self.secret_key), 
            message.encode('utf-8'), 
            hashlib.sha256
        ).digest()
        
        # Encode the signature in base64
        return base64.b64encode(signature).decode()

    def _get_headers(self, method, path):
        """Generate headers for NCR API requests including authentication signature"""
        # Format current time as required by HTTP Date header (RFC 7231)
        date_header = formatdate(timeval=None, localtime=False, usegmt=True)
        
        # Generate signature
        signature = self._generate_signature(method, path, date_header)
        
        # Create authorization header
        auth_header = f"AccessKey {self.access_key}:{signature}"
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": self.access_key,
            "Date": date_header,
            "nep-organization": self.org_id,

            "nep-application-key": self.shared_key,
            # "nep-correlation-id": str(uuid.uuid4())
        }
        
        self.logger.debug(f"Generated headers: {headers}")
        return headers

    def create_order(self, location_id, table_number, items):
        """
        Create a new order in the NCR system
        
        Args:
            location_id (str): Location identifier
            table_number (int or str): Table number for the order
            items (list): List of item dictionaries with item_id and quantity
            
        Returns:
            dict: Order response from NCR API
            
        Raises:
            Exception: If the order creation fails
        """
        path = "/order/3/orders/1/orders"
        url = f"{self.base_url}/orders"
        
        # Generate a unique order reference ID
        order_ref = f"order-{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}-{str(uuid.uuid4())[:8]}"
        
        # Build the order payload
        payload = {
            "locationId": location_id,
            "revenueCenterId": "default",  # Adjust based on your config
            "status": "OPEN",
            "origin": "IN_STORE",
            "orderSource": {
                "systemName": "YourAppName",
                "applicationName": "YourAppName"
            },
            "additionalReferenceIds": [
                {
                    "type": "TABLE_NUMBER",
                    "value": str(table_number)
                },
                {
                    "type": "ORDER_REF",
                    "value": order_ref
                }
            ],
            "orderItems": [
                {
                    "itemId": item["item_id"],
                    "quantity": item.get("quantity", 1)
                }
                for item in items
            ]
        }
        
        self.logger.debug(f"Creating order with payload: {json.dumps(payload)}")
        
        try:
            # Get fresh headers for this request
            headers = self._get_headers("POST", path)
            response = requests.post(url, json=payload, headers=headers)
            
            # Check if the request was successful
            if response.status_code == 201:
                order_data = response.json()
                self.logger.info(f"Order created successfully: {order_data.get('id', 'unknown')}")
                return order_data
            else:
                error_msg = f"Failed to create order: {response.status_code}, {response.text}"
                self.logger.error(error_msg)
                raise Exception(error_msg)
                
        except requests.RequestException as e:
            error_msg = f"Request error creating order: {str(e)}"
            self.logger.error(error_msg)
            raise Exception(error_msg)

    def get_order(self, order_id):
        """
        Retrieve an existing order by ID
        
        Args:
            order_id (str): The NCR order ID to retrieve
            
        Returns:
            dict: Order data
        """
        # Updated URL format to match the specified endpoint
        path = f"/order/3/orders/1/{order_id}"
        url = f"{self.base_url}/{order_id}"
        
        try:
            # Get fresh headers for this request
            headers = self._get_headers("GET", path)
            response = requests.get(url, headers=headers)
            
            if response.status_code == 200:
                return response.json()
            else:
                error_msg = f"Failed to get order {order_id}: {response.status_code}, {response.text}"
                self.logger.error(error_msg)
                raise Exception(error_msg)
                
        except requests.RequestException as e:
            error_msg = f"Request error getting order: {str(e)}"
            self.logger.error(error_msg)
            raise Exception(error_msg)
    
    def get_most_recent_order_by_reference_id(self, reference_id_name, reference_id_value, days_back=1):
        """
        Retrieve the most recently created order matching a given additional reference ID.
        Args:
            reference_id_name (str): Type of the reference ID (e.g., 'ORDER_REF', 'TABLE_NUMBER').
            reference_id_value (str): Value of the reference ID.
            days_back (int): How many days back to search from now. Defaults to 1.
        Returns:
            dict: The most recently created order.
        Raises:
            Exception: If the request fails or no orders are found.
        """
        path = "/order/3/orders/1/find-by-additional-reference-id"
        url = f"{self.base_url}/find-by-additional-reference-id"
        
        to_date = datetime.datetime.utcnow()
        from_date = to_date - datetime.timedelta(days=days_back)
        payload = {
            "fromCreatedDate": from_date.isoformat() + "Z",
            "toCreatedDate": to_date.isoformat() + "Z",
            "referenceIdName": reference_id_name,
            "referenceIdValue": reference_id_value
        }
        
        self.logger.debug(f"Finding most recent order with payload: {json.dumps(payload)}")
        
        try:
            # Get fresh headers for this request
            headers = self._get_headers("POST", path)
            
            # Log full request details for debugging
            self.logger.debug(f"Request URL: {url}")
            self.logger.debug(f"Request headers: {headers}")
            self.logger.debug(f"Request payload: {payload}")
            
            response = requests.post(url, headers=headers, json=payload)
            
            self.logger.debug(f"Response status: {response.status_code}")
            self.logger.debug(f"Response body: {response.text}")
            
            if response.status_code != 200:
                error_msg = f"Failed to find order by reference ID: {response.status_code}, {response.text}"
                self.logger.error(error_msg)
                raise Exception(error_msg)
                
            orders = response.json().get("orders", [])
            if not orders:
                raise Exception("No orders found for the given reference ID.")
                
            # Sort orders by createdDateTime descending and return the most recent one
            most_recent_order = max(
                orders,
                key=lambda o: o.get("createdDateTime", "")
            )
            self.logger.info(f"Most recent order found: {most_recent_order.get('id', 'unknown')}")
            return most_recent_order
            
        except requests.RequestException as e:
            error_msg = f"Request error finding order: {str(e)}"
            self.logger.error(error_msg)
            raise Exception(error_msg)

# Create a properly initialized default instance
ncr_adapter = NCRAdapter()