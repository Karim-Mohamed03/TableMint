import requests
import uuid
import datetime
import json
import logging

class NCRAdapter:
    def __init__(self, base_url, api_key, org_id):

        self.base_url = base_url
        self.api_key = api_key
        self.org_id = org_id
        self.headers = {
            "Content-Type": "application/json",
            "Authorization": f"apikey {self.api_key}",
            "nep-organization": self.org_id,
            "nep-correlation-id": str(uuid.uuid4()),
            "nep-application-key": self.api_key
        }
        self.logger = logging.getLogger(__name__)

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
            # Generate a new correlation ID for each request
            self.headers["nep-correlation-id"] = str(uuid.uuid4())
            response = requests.post(url, json=payload, headers=self.headers)
            
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
        url = f"{self.base_url}/orders/{order_id}"
        
        try:
            # Generate a new correlation ID for each request
            self.headers["nep-correlation-id"] = str(uuid.uuid4())
            response = requests.get(url, headers=self.headers)
            
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


