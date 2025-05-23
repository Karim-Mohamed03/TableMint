from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
import json
import logging
from .ncr_adapter import ncr_adapter  # Import the instance, not the class

logger = logging.getLogger(__name__)

@csrf_exempt
@require_http_methods(["GET"])
def get_order_by_reference(request):
    """
    API endpoint to get the most recent order by reference ID
    
    GET parameters:
        ref_type: Type of reference ID (e.g., TABLE_NUMBER, ORDER_REF)
        ref_value: Value of the reference ID
        days_back: (Optional) Number of days to look back (default: 1)
    """
    ref_type = request.GET.get('ref_type')
    ref_value = request.GET.get('ref_value')
    days_back = int(request.GET.get('days_back', 1))
    
    if not ref_type or not ref_value:
        return JsonResponse({
            'success': False,
            'error': 'Missing required parameters: ref_type and ref_value'
        }, status=400)
    
    try:
        logger.info(f"Finding order with reference {ref_type}={ref_value} (days_back={days_back})")
        order = ncr_adapter.get_most_recent_order_by_reference_id(ref_type, ref_value, days_back)
        
        return JsonResponse({
            'success': True,
            'order': order
        })
    except Exception as e:
        logger.error(f"Error finding order by reference: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)