from django.shortcuts import render
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
import os
import json

from pos.pos_service import POSService

@api_view(['GET'])
@permission_classes([AllowAny])
def get_table_order(request, table_id):
    # Initialize the POS service
    pos_service = POSService()
    
    try:
        # Get location ID from environment or use default
        location_id = os.environ.get('SQUARE_LOCATION_ID')
        
        # Search for orders related to this table
        result = pos_service.search_orders(
            location_ids=[location_id],
            filter_source_names=[f"table_{table_id}"]
        )

        if result.get('success', False):
            # Return orders based on the adapter response format
            if 'orders' in result:
                return JsonResponse({"orders": result['orders']})
            elif 'order_entries' in result:
                return JsonResponse({"orders": result['order_entries']})
            else:
                return JsonResponse({"orders": []})
        else:
            return JsonResponse({"error": result.get('errors', 'Unknown error')}, status=400)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@api_view(['GET'])
@permission_classes([AllowAny])
def list_all_orders(request):
    """Endpoint to list all orders from the POS system"""
    # Initialize the POS service
    pos_service = POSService()
    
    try:
        # Use the new get_all_orders method which doesn't require location_id
        result = pos_service.get_all_orders()
        
        if result.get('success', False):
            # Return orders based on the adapter response format
            if 'orders' in result:
                return JsonResponse({"orders": result['orders']})
            elif 'order_entries' in result:
                return JsonResponse({"orders": result['order_entries']})
            else:
                return JsonResponse({"orders": []})
        else:
            return JsonResponse({"error": result.get('errors', 'Unknown error')}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_order_details(request, order_id):
    """Endpoint to get details of a specific order"""
    # Initialize the POS service
    pos_service = POSService()
    
    result = pos_service.retrieve_order(order_id)
    
    if result.get('success', False):
        return JsonResponse({"order": result.get('order', {})})
    else:
        return JsonResponse({"error": result.get('errors', 'Unknown error')}, status=400)

@api_view(['GET'])
@permission_classes([AllowAny])
def test_pos_connection(request):
    """Endpoint to test if the POS API connection is working and list available locations"""
    try:
        # Get the POS type from the request or environment
        pos_type = request.GET.get('pos_type', os.environ.get('POS_TYPE', 'square'))
        
        # Initialize the POS service with the specified type
        pos_service = POSService(pos_type=pos_type)
        
        # Test authentication
        is_authenticated = pos_service.is_authenticated()
        
        if is_authenticated:
            # Get locations using the new list_locations method
            locations_result = pos_service.list_locations()
            
            return JsonResponse({
                "success": True,
                "message": f"Successfully connected to {pos_type.capitalize()} API",
                "pos_type": pos_type,
                "locations": locations_result.get('locations', [])
            })
        else:
            return JsonResponse({
                "success": False,
                "message": f"Failed to connect to {pos_type.capitalize()} API",
                "pos_type": pos_type
            }, status=400)
    except Exception as e:
        return JsonResponse({
            "success": False,
            "message": "Error connecting to POS API",
            "error": str(e)
        }, status=500)

@api_view(['POST'])
@permission_classes([AllowAny])
def create_order(request):
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
        result = pos_service.adapter.create(data)
        
        if result.get('success', False):
            return JsonResponse({
                'success': True,
                'order': result.get('order', {})
            })
        else:
            return JsonResponse({
                'success': False,
                'error': result.get('errors', 'Unknown error')
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
