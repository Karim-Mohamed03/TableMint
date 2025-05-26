from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
from pos.pos_service import POSService
from pos.ncr_adapter import NCRAdapter
from pos.square_adapter import SquareAdapter
import datetime
import uuid


import logging
logger = logging.getLogger(__name__)

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
    
@api_view(['POST'])
@permission_classes([AllowAny])
def create_ncr_order(request):
    """Endpoint to create a new order using NCR API directly"""
    try:
        # Parse the request body
        data = json.loads(request.body)
        
        # Validate required fields
        if 'order_items' not in data or not data['order_items']:
            return JsonResponse({
                'success': False,
                'error': 'At least one order item is required'
            }, status=400)
            
        # Initialize the NCR adapter
        ncr_adapter = NCRAdapter()
        
        # Extract order data from request
        customer_name = data.get('customer_name')
        customer_phone = data.get('customer_phone')
        fulfillment_type = data.get('fulfillment_type', 'Pickup')
        order_items = data.get('order_items', [])
        table_id = data.get('table_id')
        pickup_time = data.get('pickup_time')
        
        # Create the order using the NCR adapter
        order_result = ncr_adapter.create_simple_order(
            customer_name=customer_name,
            customer_phone=customer_phone,
            fulfillment_type=fulfillment_type,
            order_items=order_items,
            table_id=table_id,
            pickup_time=pickup_time
        )
        
        return JsonResponse({
            'success': True,
            'order': order_result
        })
            
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
def create_ncr_order_advanced(request):
    """Endpoint to create a new order using NCR API with full OrderData schema"""
    try:
        # Parse the request body
        data = json.loads(request.body)
        
        # Validate that order_data is provided
        if 'order_data' not in data:
            return JsonResponse({
                'success': False,
                'error': 'order_data is required for advanced order creation'
            }, status=400)
            
        # Initialize the NCR adapter
        ncr_adapter = NCRAdapter()
        
        # Create the order using the full NCR API
        order_result = ncr_adapter.create_order_v3(data['order_data'])
        
        return JsonResponse({
            'success': True,
            'order': order_result
        })
            
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
def create_restaurant_example(request):
    """Endpoint to create an example restaurant order"""
    try:
        # Initialize the NCR adapter
        ncr_adapter = NCRAdapter()
        
        # Create example order
        order_result = ncr_adapter.create_restaurant_order_example()
        
        return JsonResponse({
            'success': True,
            'order': order_result
        })
            
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

@api_view(['POST'])
@permission_classes([AllowAny])
def create_ncr_order_table(request):
    """
    Endpoint to create a new order using NCR API with table number and items
    
    Expected request body:
    {
        "table_number": 5,
        "items": [
            {
                "name": "Burger",
                "quantity": 2,
                "price": 12.99,
                "product_id": "burger-001",
                "product_code": "BURG001"
            },
            {
                "name": "Fries", 
                "quantity": 1,
                "price": 4.99,
                "product_id": "fries-001",
                "product_code": "FRIES001"
            }
        ]
    }
    """
    try:
        # Parse the request body
        data = json.loads(request.body)
        
        # Validate required fields
        if 'table_number' not in data:
            return JsonResponse({
                'success': False,
                'error': 'table_number is required'
            }, status=400)
            
        if 'items' not in data or not data['items']:
            return JsonResponse({
                'success': False,
                'error': 'At least one item is required'
            }, status=400)
            
        # Validate items structure
        required_item_fields = ['name', 'quantity', 'price']
        for i, item in enumerate(data['items']):
            for field in required_item_fields:
                if field not in item:
                    return JsonResponse({
                        'success': False,
                        'error': f'Item {i+1} is missing required field: {field}'
                    }, status=400)
            
            # Validate data types
            try:
                item['quantity'] = int(item['quantity'])
                item['price'] = float(item['price'])
            except (ValueError, TypeError):
                return JsonResponse({
                    'success': False,
                    'error': f'Item {i+1} has invalid quantity or price format'
                }, status=400)
        
        # Initialize the NCR adapter
        ncr_adapter = NCRAdapter()
        
        # Extract data from request
        table_number = data['table_number']
        items = data['items']
        
        logger.info(f"Creating NCR order for table {table_number} with {len(items)} items")
        
        # Create the order using the NCR adapter
        order_result = ncr_adapter.create_ncr_order(
            table_number=table_number,
            items=items
        )
        
        logger.info(f"Successfully created NCR order: {order_result.get('id', 'unknown')}")
        
        return JsonResponse({
            'success': True,
            'order': order_result,
            'message': f'Order created successfully for table {table_number}'
        })
            
    except json.JSONDecodeError as e:
        logger.error(f"JSON decode error: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': 'Invalid JSON in request body'
        }, status=400)
        
    except Exception as e:
        logger.error(f"Error creating NCR order: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)
    

# @csrf_exempt
# @require_http_methods(["GET"])
# def get_inventory(request):
#     try:
#         # Get query parameters
#         catalog_object_id = request.GET.get('catalog_object_id')
#         location_ids_param = request.GET.get('location_ids')
#         cursor = request.GET.get('cursor')
        
#         # Validate required parameters
#         if not catalog_object_id:
#             return JsonResponse({
#                 'errors': ['catalog_object_id is required']
#             }, status=400)
        
#         # Parse location_ids if provided
#         location_ids = None
#         if location_ids_param:
#             location_ids = [loc.strip() for loc in location_ids_param.split(',') if loc.strip()]
        
#         # Initialize Square adapter
#         square_adapter = SquareAdapter()
        
#         # Check authentication
#         if not square_adapter.authenticate():
#             return JsonResponse({
#                 'errors': ['Failed to authenticate with Square API']
#             }, status=401)
        
#         # Get inventory data
#         result = square_adapter.get_inventory(
#             catalog_object_id=catalog_object_id,
#             location_ids=location_ids,
#             cursor=cursor
#         )
        
#         # Return the result in Square API format
#         if 'errors' in result and result['errors']:
#             return JsonResponse(result, status=400)
#         else:
#             return JsonResponse(result, status=200)
            
#     except Exception as e:
#         logger.error(f"Error in get_inventory view: {str(e)}")
#         return JsonResponse({
#             'errors': [str(e)]
#         }, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def get_inventory(request):
    try:
        # Get query parameters
        catalog_object_id = request.GET.get('catalog_object_id')
        location_ids = request.GET.get('location_ids')  # New parameter
        
        # Validate required parameters
        if not catalog_object_id:
            return JsonResponse({
                'errors': ['catalog_object_id is required'],
                'counts': []
            }, status=400)
        
        # Initialize Square adapter
        square_adapter = SquareAdapter()
        
        # Check authentication
        if not square_adapter.authenticate():
            return JsonResponse({
                'errors': ['Failed to authenticate with Square API'],
                'counts': []
            }, status=401)
        
        # Get inventory data using our fixed function with location_ids
        result = square_adapter.get_inventory(
            catalog_object_id=catalog_object_id,
            location_ids=location_ids  # Pass location_ids to the function
        )
        
        # Return the result in Square API format
        if 'errors' in result and result['errors']:
            return JsonResponse(result, status=400)
        else:
            return JsonResponse(result, status=200)
            
    except Exception as e:
        logger.error(f"Error in get_inventory view: {str(e)}")
        return JsonResponse({
            'errors': [str(e)],
            'counts': []
        }, status=500)
    
    
@csrf_exempt
@require_http_methods(["POST"])
def batch_get_inventory(request):
    """
    Get inventory counts for multiple catalog objects in a single request.
    
    Request Body (JSON):
    {
        "catalog_object_ids": ["id1", "id2", "id3"],
        "location_ids": ["loc1", "loc2"] (optional),
        "cursor": "pagination_cursor" (optional)
    }
    """
    try:
        # Parse JSON body
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({
                'success': False,
                'errors': ['Invalid JSON in request body'],
                'counts': []
            }, status=400)
        
        # Extract parameters
        catalog_object_ids = data.get('catalog_object_ids', [])
        location_ids = data.get('location_ids')
        cursor = data.get('cursor')
        
        # Validate required parameters
        if not catalog_object_ids or not isinstance(catalog_object_ids, list):
            return JsonResponse({
                'success': False,
                'errors': ['catalog_object_ids must be a non-empty list'],
                'counts': []
            }, status=400)
        
        # Initialize Square adapter
        square_adapter = SquareAdapter()
        
        # Check authentication
        if not square_adapter.authenticate():
            return JsonResponse({
                'success': False,
                'errors': ['Failed to authenticate with Square API'],
                'counts': []
            }, status=401)
        
        # Get batch inventory data
        result = square_adapter.batch_retrieve_inventory_counts(
            catalog_object_ids=catalog_object_ids,
            location_ids=location_ids,
            cursor=cursor
        )
        
        # Return the result
        if result.get('success'):
            return JsonResponse(result, status=200)
        else:
            return JsonResponse(result, status=400)
            
    except Exception as e:
        logger.error(f"Error in batch_get_inventory view: {str(e)}")
        return JsonResponse({
            'success': False,
            'errors': [str(e)],
            'counts': []
        }, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def get_inventory_by_location(request, location_id):
    """
    Get inventory counts for all items at a specific location.
    This is a helper view that combines catalog and inventory data.
    
    URL: /api/inventory/location/<location_id>/
    
    Query Parameters:
        - cursor (optional): Pagination cursor
    """
    try:
        cursor = request.GET.get('cursor')
        
        # Initialize Square adapter
        square_adapter = SquareAdapter()
        
        # Check authentication
        if not square_adapter.authenticate():
            return JsonResponse({
                'success': False,
                'errors': ['Failed to authenticate with Square API'],
                'counts': []
            }, status=401)
        
        # First, get catalog items
        catalog_result = square_adapter.get_catalog()
        
        if not catalog_result.get('success'):
            return JsonResponse({
                'success': False,
                'errors': ['Failed to retrieve catalog: ' + str(catalog_result.get('error', 'Unknown error'))],
                'counts': []
            }, status=400)
        
        # Extract catalog object IDs for items and item variations
        catalog_objects = catalog_result.get('objects', [])
        catalog_object_ids = []
        
        for obj in catalog_objects:
            if isinstance(obj, dict):
                obj_type = obj.get('type')
                if obj_type in ['ITEM', 'ITEM_VARIATION']:
                    catalog_object_ids.append(obj.get('id'))
        
        if not catalog_object_ids:
            return JsonResponse({
                'success': True,
                'errors': [],
                'counts': [],
                'message': 'No items found in catalog'
            }, status=200)
        
        # Get inventory for all catalog items at this location
        result = square_adapter.batch_retrieve_inventory_counts(
            catalog_object_ids=catalog_object_ids,
            location_ids=[location_id],
            cursor=cursor
        )
        
        # Return the result
        if result.get('success'):
            return JsonResponse(result, status=200)
        else:
            return JsonResponse(result, status=400)
            
    except Exception as e:
        logger.error(f"Error in get_inventory_by_location view: {str(e)}")
        return JsonResponse({
            'success': False,
            'errors': [str(e)],
            'counts': []
        }, status=500)
    
@csrf_exempt
@require_http_methods(["POST"])
def batch_create_changes(request):
    try:
        # Parse JSON request body
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({
                'errors': ['Invalid JSON in request body'],
                'counts': []
            }, status=400)
        
        # Get required parameters
        idempotency_key = data.get('idempotency_key')
        changes = data.get('changes')
        ignore_unchanged_counts = data.get('ignore_unchanged_counts')
        
        # Validate required parameters
        if not idempotency_key:
            return JsonResponse({
                'errors': ['idempotency_key is required'],
                'counts': []
            }, status=400)
            
        if not changes or not isinstance(changes, list):
            return JsonResponse({
                'errors': ['changes is required and must be an array'],
                'counts': []
            }, status=400)
        
        # Validate idempotency_key length (1-128 characters as per documentation)
        if len(idempotency_key) < 1 or len(idempotency_key) > 128:
            return JsonResponse({
                'errors': ['idempotency_key must be between 1 and 128 characters'],
                'counts': []
            }, status=400)
        
        # Validate changes array length (max 100 as per documentation)
        if len(changes) > 100:
            return JsonResponse({
                'errors': ['changes array cannot exceed 100 items'],
                'counts': []
            }, status=400)
        
        # Initialize POS service
        pos_service = POSService()
        
        # Check authentication
        if not pos_service.is_authenticated():
            return JsonResponse({
                'errors': ['Failed to authenticate with POS system'],
                'counts': []
            }, status=401)
        
        # Create inventory changes
        result = pos_service.batch_create_changes(
            idempotency_key=idempotency_key,
            changes=changes,
            ignore_unchanged_counts=ignore_unchanged_counts
        )
        
        # Return the result in Square API format
        if 'errors' in result and result['errors']:
            return JsonResponse(result, status=400)
        else:
            return JsonResponse(result, status=200)
            
    except Exception as e:
        logger.error(f"Error in batch_create_changes view: {str(e)}")
        return JsonResponse({
            'errors': [str(e)],
            'counts': []
        }, status=500)