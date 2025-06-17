import json
import logging
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST, require_http_methods
from django.utils.decorators import method_decorator
from django.views import View
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from django.shortcuts import get_object_or_404

from tables.models import Table
from orders.models import Order
from .square_adapter import SquareAdapter
from .serializers import OrderSerializer
from .square_webhook_adapter import SquareWebhookAdapter
from .ncr_adapter import ncr_adapter
from .pos_factory import POSFactory
from .pos_service import POSService

logger = logging.getLogger(__name__)

@method_decorator(csrf_exempt, name='dispatch')
class SquareWebhookView(View):
    """
    Handles incoming webhook events from Square
    
    This view processes webhooks for:
    - order.created
    - order.updated
    - payment.updated
    
    And keeps our table orders in sync with Square.
    """
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # self.adapter = SquareWebhookAdapter()
    
    @method_decorator(require_POST)
    def dispatch(self, request, *args, **kwargs):
        return super().dispatch(request, *args, **kwargs)
    
    def post(self, request, *args, **kwargs):
        # Get the raw request body
        body = request.body.decode('utf-8')

        print("🔔 Square Webhook Received:", body)
        
        # Parse the webhook payload to extract order ID
        try:
            payload = json.loads(body)
            event_type = payload.get('type')
            
            # Check if this is an order.created event
            if event_type == 'order.created':
                # Extract the order ID from the webhook payload
                order_id = payload.get('data', {}).get('object', {}).get('order_created', {}).get('order_id')
                print(f"📢 SQUARE ORDER ID: {order_id}")
        except json.JSONDecodeError:
            print("❌ Invalid JSON in webhook body")
        except Exception as e:
            print(f"❌ Error extracting order ID: {str(e)}")

        return HttpResponse(status=200)
        
        # Verify the webhook signature
        signature_header = request.headers.get('Square-Signature')
        if not signature_header or not self.adapter.verify_webhook_signature(signature_header, body):
            logger.warning("Invalid Square webhook signature")
            return HttpResponse(status=401)
        
        # Parse the webhook payload
        try:
            payload = json.loads(body)
        except json.JSONDecodeError:
            logger.error("Invalid JSON in Square webhook payload")
            return HttpResponse(status=400)
        
        # Get the event type
        event_type = payload.get('type')
        if not event_type:
            logger.error("No event type in Square webhook payload")
            return HttpResponse(status=400)
        
        # Process different event types
        try:
            if event_type == 'order.created' or event_type == 'order.updated':
                result = self.handle_order_event(payload)
                logger.info(f"Processed order event: {result}")
            elif event_type == 'payment.updated':
                result = self.handle_payment_event(payload)
                logger.info(f"Processed payment event: {result}")
            else:
                # We only care about orders and payments
                logger.info(f"Ignoring webhook event of type: {event_type}")
                result = {'status': 'ignored', 'event_type': event_type}
                
            # Always return a 200 OK to acknowledge receipt
            return JsonResponse({'status': 'success', 'result': result})
            
        except Exception as e:
            logger.exception(f"Error processing Square webhook: {e}")
            # We return 200 to acknowledge receipt even if we have processing errors
            # to prevent Square from retrying repeatedly
            return JsonResponse({'status': 'error', 'message': str(e)}, status=200)
    
    def handle_order_event(self, payload):
        """Process order.created or order.updated events"""
        data = payload.get('data', {})
        object_data = data.get('object', {})
        order_data = object_data.get('order', {})
        
        if not order_data:
            logger.error("No order data in payload")
            return {'error': 'No order data found in payload'}
        
        # Sync the order from Square to our system
        result = self.adapter.sync_order_from_square(order_data)
        
        if not result:
            return {'error': 'Failed to sync order from Square'}
            
        return result
    
    def handle_payment_event(self, payload):
        """Process payment.updated events"""
        data = payload.get('data', {})
        object_data = data.get('object', {})
        payment_data = object_data.get('payment', {})
        
        if not payment_data:
            logger.error("No payment data in payload")
            return {'error': 'No payment data found in payload'}
        
        # Update order status based on payment
        result = self.adapter.update_order_status_from_payment(payment_data)
        
        if not result:
            return {'error': 'Failed to update order status'}
            
        return result

class TableOrderView(APIView):
    """
    API endpoint to get orders for a specific table
    
    GET /api/tables/{table_id}/order/
    """
    
    def get(self, request, table_id, format=None):
        # Find the table
        table = get_object_or_404(Table, id=table_id)
        
        # Get the most recent open order for this table
        order = Order.objects.filter(
            table=table, 
            status='open'
        ).order_by('-created_at').first()
        
        if not order:
            return Response(
                {"detail": f"No open order found for table {table_id}"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # If we have a Square order ID and no order items yet, try to sync with Square
        if order.pos_reference and not order.items.exists():
            # Initialize Square adapter
            square_adapter = SquareAdapter()
            
            # Get the full order details from Square
            square_order = square_adapter.get(order.pos_reference)
            
            # If successful, add the Square order items to our order
            if square_order and 'success' in square_order and square_order['success']:
                # Process Square order items into our database
                # This would need additional code to parse Square line items 
                # and create OrderItem objects
                pass
        
        # Serialize and return the order
        serializer = OrderSerializer(order)
        return Response(serializer.data)

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

@csrf_exempt
@require_http_methods(["POST"])
def create_clover_order(request):
    """
    API endpoint to create a new order in Clover
    
    POST body:
        order_data: Dictionary containing order details
    """
    try:
        # Parse the request body
        data = json.loads(request.body)
        order_data = data.get('order_data')
        
        if not order_data:
            return JsonResponse({
                'success': False,
                'error': 'Missing required parameter: order_data'
            }, status=400)
        
        # Create a Clover adapter instance
        pos_factory = POSFactory()
        clover_adapter = pos_factory.create_adapter('clover')
        
        # Create the order in Clover using the 'create' method
        logger.info(f"Creating order in Clover with data: {json.dumps(order_data)}")
        result = clover_adapter.create(order_data)
        
        return JsonResponse(result)
        
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'Invalid JSON in request body'
        }, status=400)
    except Exception as e:
        logger.error(f"Error creating Clover order: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@csrf_exempt
@api_view(['GET'])
@permission_classes([AllowAny])
def get_catalog(request):
    """
    API endpoint to fetch catalog items and categories from the POS system
    
    GET /api/pos/catalog/
    
    Query Parameters:
        location_id (optional): Specific location ID to filter catalog for
        restaurant_id (optional): Restaurant UUID to use restaurant-specific credentials
        table_token (optional): Table token to look up restaurant through
    
    Returns:
        JSON response with catalog data including items and categories
    """
    try:
        # Get query parameters
        location_id = request.GET.get('location_id')
        restaurant_id = request.GET.get('restaurant_id')
        table_token = request.GET.get('table_token')
        
        # Initialize the POS service with restaurant-specific credentials if provided
        restaurant = None
        if restaurant_id or table_token:
            try:
                pos_service = POSService.for_restaurant(
                    restaurant_id=restaurant_id, 
                    table_token=table_token
                )
                logger.info(f"Using restaurant-specific POS service for restaurant_id={restaurant_id}, table_token={table_token}")
                
                # Get the restaurant instance to access active_menu
                if restaurant_id:
                    from restaurants.models import Restaurant
                    restaurant = Restaurant.objects.get(id=restaurant_id)
                elif table_token:
                    from tables.models import Table
                    table = Table.objects.get(token=table_token)
                    restaurant = table.restaurant
                    
            except ValueError as e:
                logger.error(f"Failed to create POS service for restaurant: {str(e)}")
                return JsonResponse({
                    'success': False,
                    'error': f'Restaurant configuration error: {str(e)}'
                }, status=400)
        else:
            # If no specific restaurant context, try to use the first connected restaurant
            try:
                from restaurants.models import Restaurant
                connected_restaurant = Restaurant.objects.filter(is_connected=True, access_token__isnull=False).first()
                
                if connected_restaurant:
                    logger.info(f"No restaurant context provided, using first connected restaurant: {connected_restaurant.name} (ID: {connected_restaurant.id})")
                    pos_service = POSService.for_restaurant(restaurant_id=str(connected_restaurant.id))
                    restaurant = connected_restaurant
                else:
                    logger.error("No connected restaurants found with valid access tokens")
                    return JsonResponse({
                        'success': False,
                        'error': 'No connected restaurants available. Please configure a restaurant with Square integration.'
                    }, status=503)
            except Exception as e:
                logger.error(f"Error finding connected restaurant: {str(e)}")
                return JsonResponse({
                    'success': False,
                    'error': f'Failed to find connected restaurant: {str(e)}'
                }, status=500)
        
        # Check if the adapter is authenticated
        if not pos_service.is_authenticated():
            return JsonResponse({
                'success': False,
                'error': 'Failed to authenticate with POS system'
            }, status=401)
        
        # Get catalog data using the POS service
        result = pos_service.get_catalog()
        
        if result.get('success', False):
            catalog_objects = result.get('objects', [])
            
            # Filter by active_menu if the restaurant has one configured
            if restaurant and restaurant.active_menu:
                active_menu_id = restaurant.active_menu
                logger.info(f"Filtering catalog by active_menu: {active_menu_id}")
                filtered_objects = []
                
                # First, find all categories that belong to this menu (including subcategories)
                menu_category_ids = set()
                menu_category_ids.add(active_menu_id)  # Include the menu itself
                
                # Find all subcategories that belong to this menu
                for obj in catalog_objects:
                    if obj.get('type') == 'CATEGORY':
                        category_data = obj.get('category_data', {})
                        parent_category = category_data.get('parent_category', {})
                        root_category = category_data.get('root_category')
                        
                        # Check if this category is a direct child of the menu
                        if parent_category.get('id') == active_menu_id:
                            menu_category_ids.add(obj.get('id'))
                        
                        # Check if this category belongs to the menu via root_category
                        elif root_category == active_menu_id:
                            menu_category_ids.add(obj.get('id'))
                
                logger.info(f"Found category IDs for menu {active_menu_id}: {menu_category_ids}")
                
                for obj in catalog_objects:
                    should_include = False
                    
                    # Include the menu category itself and all its subcategories
                    if obj.get('type') == 'CATEGORY':
                        if obj.get('id') in menu_category_ids:
                            should_include = True
                    
                    # Include items that belong to any category in this menu
                    elif obj.get('type') == 'ITEM':
                        item_data = obj.get('item_data', {})
                        categories = item_data.get('categories', [])
                        
                        # Check if any of the item's categories are in our menu
                        for cat in categories:
                            if cat.get('id') in menu_category_ids:
                                should_include = True
                                break
                    
                    # Include other types (like IMAGE, TAX, DISCOUNT, MODIFIER_LIST) as they may be referenced
                    elif obj.get('type') in ['IMAGE', 'TAX', 'DISCOUNT', 'MODIFIER_LIST']:
                        should_include = True
                    
                    if should_include:
                        filtered_objects.append(obj)
                
                logger.info(f"Filtered catalog: {len(catalog_objects)} -> {len(filtered_objects)} objects")
                catalog_objects = filtered_objects
            else:
                logger.info("No active_menu configured for restaurant, returning all catalog items")
            
            return JsonResponse({
                'success': True,
                'objects': catalog_objects
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
            
    except Exception as e:
        logger.error(f"Error fetching catalog: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)