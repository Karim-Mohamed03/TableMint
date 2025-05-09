import os
from square import Square
from square.environment import SquareEnvironment
from square.core.api_error import ApiError
from dotenv import load_dotenv
from pathlib import Path

# Get the base directory (backend folder)
BASE_DIR = Path(__file__).resolve().parent.parent

# Load .env from the backend directory
load_dotenv(os.path.join(BASE_DIR, '.env'))

square_client = Square(
    token=os.environ.get('SQUARE_ACCESS_TOKEN'),
    environment=SquareEnvironment.SANDBOX
)

# Get location ID from environment variables
location_id = os.environ.get('SQUARE_LOCATION_ID')

def fetch_all_orders(location_id=None):
    """Fetch all orders from Square for the given location"""
    if not location_id:
        location_id = os.environ.get('SQUARE_LOCATION_ID')
    
    try:

        #TODO we need to get the IDs of orders for parameter here but orders do not want to be created
        result = square_client.orders.get()
        
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

def fetch_order_by_id(order_id):
    """Fetch a specific order from Square by its ID"""
    try:
        # Using retrieve_order() as shown in the documentation
        result = square_client.orders.retrieve_order(
            order_id=order_id
        )
        
        if result.is_success():
            return {
                "success": True,
                "order": result.body.get("order")
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