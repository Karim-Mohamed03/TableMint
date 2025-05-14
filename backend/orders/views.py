from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
import json
from pos.pos_service import POSService

@api_view(['POST'])
@permission_classes([AllowAny])
def create(request):
    """Endpoint to create a new order using the POS system"""
    try:
        # Parse the request body
        data = json.loads(request.body)
        
        # Validate required fields
        if 'line_items' not in data or not data['line_items']:
            return JsonResponse({
                'success': False,
                'error': 'At least one line item is required'
            }, status=400)
            
        # Initialize the POS service
        pos_service = POSService()
        
        # Create the order using the create method
        result = pos_service.create(data)
        
        if result.get('success', False):
            return JsonResponse({
                'success': True,
                'order': result.get('order', {})
            })
        else:
            # Handle the error field which could be a string or list
            error = result.get('error')
            if error is None:
                error = result.get('errors', 'Unknown error')
                
            return JsonResponse({
                'success': False,
                'error': error
            }, status=400)
            
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'Invalid JSON in request body'
        }, status=400)
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@api_view(['POST'])
@permission_classes([AllowAny])
def search(request):
    """Endpoint to search for orders using the POS system"""
    try:
        # Parse the request body
        data = request.data        
        # Initialize the POS service
        pos_service = POSService()
        
        # Extract parameters from the request
        # We're passing all parameters directly to the search method
        search_params = {
            'location_ids': data.get('location_ids'),
            'closed_at_start': data.get('closed_at_start'),
            'closed_at_end': data.get('closed_at_end'),
            'states': data.get('states'),
            'customer_ids': data.get('customer_ids'),
            'sort_field': data.get('sort_field'),
            'sort_order': data.get('sort_order'),
            'limit': data.get('limit'),
            'cursor': data.get('cursor'),
            'return_entries': data.get('return_entries', True),
            'filter_source_names': data.get('filter_source_names')
        }
        
        # Remove None values to allow defaults to be used
        search_params = {k: v for k, v in search_params.items() if v is not None}
        
        # Search for orders using the search method
        result = pos_service.search(**search_params)
        
        if result.get('success', False):
            response_data = {'success': True}
            
            # Include order entries or orders based on what was returned
            if 'order_entries' in result:
                response_data['order_entries'] = result['order_entries']
            elif 'orders' in result:
                response_data['orders'] = result['orders']
            
            # Include cursor if available for pagination
            if 'cursor' in result:
                response_data['cursor'] = result['cursor']
                
            return JsonResponse(response_data)
        else:
            # Handle the error field which could be a string or list
            error = result.get('error')
            if error is None:
                error = result.get('errors', 'Unknown error')
                
            return JsonResponse({
                'success': False,
                'error': error
            }, status=400)
            
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'Invalid JSON in request body'
        }, status=400)
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@api_view(['GET'])
@permission_classes([AllowAny])
def get(request, order_id):
    """Endpoint to retrieve a specific order by ID using the POS system"""
    try:
        # Initialize the POS service
        pos_service = POSService()
        
        # Get the order using the get method
        result = pos_service.get(order_id=order_id)
        
        # Helper function to recursively convert objects to dictionaries
        def convert_to_dict(obj):
            if isinstance(obj, dict):
                return {k: convert_to_dict(v) for k, v in obj.items()}
            elif hasattr(obj, '__dict__'):
                # Convert object to dict and filter out private attributes
                obj_dict = {k: v for k, v in vars(obj).items() if not k.startswith('_')}
                return {k: convert_to_dict(v) for k, v in obj_dict.items()}
            elif isinstance(obj, list):
                return [convert_to_dict(item) for item in obj]
            elif isinstance(obj, (str, int, float, bool, type(None))):
                return obj
            else:
                # Convert any other object to string representation
                return str(obj)
        
        # Handle the response based on the available fields: order and errors
        if hasattr(result, 'order'):
            # Convert the entire order object to a serializable dictionary
            order_dict = convert_to_dict(result.order)
            
            # Return in the same format as create function
            return JsonResponse({
                'success': True,
                'order': order_dict
            })
        elif hasattr(result, 'errors'):
            # Handle error response
            return JsonResponse({
                'success': False,
                'error': convert_to_dict(result.errors)
            }, status=400)
        
        # Handle dictionary response
        elif isinstance(result, dict):
            if 'order' in result:
                # Make sure the order is serializable
                result['order'] = convert_to_dict(result['order'])
                return JsonResponse({
                    'success': True,
                    'order': result['order']
                })
            elif 'errors' in result:
                # Make sure errors are serializable
                return JsonResponse({
                    'success': False,
                    'error': convert_to_dict(result['errors'])
                }, status=400)
            elif 'success' in result:
                # Already in the expected format, but ensure everything is serializable
                return JsonResponse(convert_to_dict(result))
            else:
                # Unexpected dict format
                return JsonResponse({
                    'success': False,
                    'error': 'Response does not contain order data'
                }, status=404)
        else:
            # Try to convert the entire result
            try:
                serializable_result = convert_to_dict(result)
                if isinstance(serializable_result, dict) and 'order' in serializable_result:
                    return JsonResponse({
                        'success': True,
                        'order': serializable_result['order']
                    })
                else:
                    return JsonResponse({
                        'success': False,
                        'error': 'Could not extract order data from response'
                    }, status=500)
            except Exception as conversion_error:
                return JsonResponse({
                    'success': False,
                    'error': f'Failed to convert response: {str(conversion_error)}'
                }, status=500)
            
    except Exception as e:
        import traceback
        traceback_str = traceback.format_exc()
        return JsonResponse({
            'success': False,
            'error': str(e),
            'traceback': traceback_str
        }, status=500)
                
    except Exception as e:
        import traceback
        traceback_str = traceback.format_exc()
        return JsonResponse({
            'success': False,
            'error': str(e),
            'traceback': traceback_str
        }, status=500)
            
    except Exception as e:
        import traceback
        traceback_str = traceback.format_exc()
        return JsonResponse({
            'success': False,
            'error': str(e),
            'traceback': traceback_str
        }, status=500)