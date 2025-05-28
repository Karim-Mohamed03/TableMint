from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
import json
import logging
from .pos_factory import POSFactory
from .pos_service import POSService

logger = logging.getLogger(__name__)

@csrf_exempt
@require_http_methods(["POST"])
def create_clover_order(request):
    """
    API endpoint to create a new order in Clover
    
    POST body:
    {
        "state": "open",  # optional
        "note": "Order note",  # optional
        "line_items": [  # optional
            {
                "name": "Item name",
                "price": 1000,  # in cents
                "quantity": 1
            }
        ]
    }
    """
    try:
        # Parse request body
        data = json.loads(request.body)
        
        # Initialize Clover adapter
        pos_service = POSService(pos_type="clover")
        
        # Check authentication
        if not pos_service.is_authenticated():
            return JsonResponse({
                'success': False,
                'error': 'Failed to authenticate with Clover'
            }, status=401)
        
        # Create order
        result = pos_service.create(data)
        
        if result.get('success'):
            return JsonResponse(result)
        else:
            return JsonResponse(result, status=400)
            
    except Exception as e:
        logger.error(f"Error creating Clover order: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def get_clover_order(request, order_id):
    """
    API endpoint to retrieve an order from Clover by ID
    """
    try:
        # Initialize Clover adapter
        pos_service = POSService(pos_type="clover")
        
        # Check authentication
        if not pos_service.is_authenticated():
            return JsonResponse({
                'success': False,
                'error': 'Failed to authenticate with Clover'
            }, status=401)
        
        # Get order
        result = pos_service.get(order_id)
        
        if result.get('success'):
            return JsonResponse(result)
        else:
            return JsonResponse(result, status=404)
            
    except Exception as e:
        logger.error(f"Error retrieving Clover order: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def list_clover_orders(request):
    """
    API endpoint to list all orders from Clover
    """
    try:
        # Initialize Clover adapter
        pos_service = POSService(pos_type="clover")
        
        # Check authentication
        if not pos_service.is_authenticated():
            return JsonResponse({
                'success': False,
                'error': 'Failed to authenticate with Clover'
            }, status=401)
        
        # Get all orders
        result = pos_service.get_all_orders()
        
        return JsonResponse(result)
            
    except Exception as e:
        logger.error(f"Error listing Clover orders: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)