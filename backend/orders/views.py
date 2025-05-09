from django.shortcuts import render
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from .square_client import square_client, location_id, fetch_all_orders, fetch_order_by_id

@api_view(['GET'])
@permission_classes([AllowAny])
def get_table_order(request, table_id):
    # You'll need logic to map table_id to Square's order or ticket reference
    try:
        result = square_client.orders.search_orders(
            body={
                "location_ids": [location_id],
                "query": {
                    "filter": {
                        "source_filter": {
                            "source_names": [f"table_{table_id}"]
                        }
                    }
                }
            }
        )

        if result.is_success():
            orders = result.body.get("orders", [])
            return JsonResponse({"orders": orders})
        else:
            return JsonResponse({"error": result.errors}, status=400)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@api_view(['GET'])
@permission_classes([AllowAny])
def list_all_orders(request):
    """Endpoint to list all orders from Square"""
    result = fetch_all_orders()
    
    if result['success']:
        return JsonResponse({"orders": result['orders']})
    else:
        return JsonResponse({"error": result['errors']}, status=400)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_order_details(request, order_id):
    """Endpoint to get details of a specific order"""
    result = fetch_order_by_id(order_id)
    
    if result['success']:
        return JsonResponse({"order": result['order']})
    else:
        return JsonResponse({"error": result['errors']}, status=400)

@api_view(['GET'])
@permission_classes([AllowAny])
def test_square_connection(request):
    """Endpoint to test if the Square API connection is working"""
    try:
        # Try to list locations as a simple API test
        result = square_client.locations.list_locations()
        
        if result.is_success():
            locations = result.body.get('locations', [])
            return JsonResponse({
                "success": True,
                "message": "Successfully connected to Square API",
                "locations": locations
            })
        else:
            return JsonResponse({
                "success": False,
                "message": "Failed to connect to Square API",
                "errors": result.errors
            }, status=400)
    except Exception as e:
        return JsonResponse({
            "success": False,
            "message": "Error connecting to Square API",
            "error": str(e)
        }, status=500)
