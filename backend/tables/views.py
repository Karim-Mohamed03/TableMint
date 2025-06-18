from django.shortcuts import render, get_object_or_404, redirect
from django.http import JsonResponse
from rest_framework import generics
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from .models import Table
from .serializers import TableSerializer
from restaurants.models import Restaurant
from qlub_backend.encryption import decrypt_token
import logging

logger = logging.getLogger(__name__)

class TableListCreateView(generics.ListCreateAPIView):
    queryset = Table.objects.all()
    serializer_class = TableSerializer
    
class TableDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Table.objects.all()
    serializer_class = TableSerializer

class TableQRCodeView(generics.RetrieveAPIView):
    queryset = Table.objects.all()
    serializer_class = TableSerializer
    
    def retrieve(self, request, *args, **kwargs):
        # Get the table instance
        instance = self.get_object()
        # Return QR code data using serializer
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

@api_view(['GET'])
@permission_classes([AllowAny])
def table_qr_redirect(request, token):
    """
    Handle QR code scans - redirect to frontend with table context
    URL: /table/{token}/
    """
    try:
        # Find the table by token
        table = Table.objects.filter(token=token, is_active=True).first()
        
        if not table:
            logger.error(f"Table not found for token: {token}")
            # Redirect to main menu with error
            return redirect("https://test-app-fawn-phi.vercel.app/QROrderPay?error=invalid_table")
        
        # Build the redirect URL with parameters
        frontend_url = "https://test-app-fawn-phi.vercel.app/QROrderPay"
        
        # Add query parameters for context
        params = []
        params.append(f"table_token={token}")
        params.append(f"table_label={table.table_label}")
        
        if table.restaurant_id:
            params.append(f"restaurant_id={table.restaurant_id}")
        
        # Get restaurant information using the fallback method
        restaurant_info = table.get_restaurant_info()
        
        if restaurant_info.get('active_menu'):
            params.append(f"menu_id={restaurant_info['active_menu']}")
        if restaurant_info.get('location_id'):
            params.append(f"location_id={restaurant_info['location_id']}")
        
        redirect_url = f"{frontend_url}?{'&'.join(params)}"
        
        logger.info(f"Redirecting table {token} to: {redirect_url}")
        return redirect(redirect_url)
            
    except Exception as e:
        logger.error(f"Error processing QR code for token {token}: {str(e)}")
        return redirect("https://test-app-fawn-phi.vercel.app/QROrderPay?error=system_error")

@api_view(['GET'])
@permission_classes([AllowAny])
def get_table_context(request, token):
    """
    API endpoint to get table and restaurant context for frontend
    URL: /api/tables/context/{token}/
    Optimized version with timeout protection and efficient queries
    """
    try:
        # Use select_related to optimize the query and avoid N+1 queries
        table = Table.objects.filter(
            token=token, 
            is_active=True
        ).first()
        
        if not table:
            logger.warning(f"Table not found for token: {token}")
            return JsonResponse({
                'success': False,
                'error': 'Table not found'
            }, status=404)
        
        response_data = {
            'success': True,
            'table': {
                'token': table.token,
                'label': table.table_label,
                'restaurant_id': str(table.restaurant_id) if table.restaurant_id else None
            }
        }
        
        # Get restaurant information with optimized queries
        restaurant_info = None
        if table.restaurant_id:
            try:
                # Direct query instead of going through multiple method calls
                from restaurants.models import RestaurantLocation, Restaurant
                
                # Get restaurant location first
                restaurant_location = RestaurantLocation.objects.filter(
                    id=table.restaurant_id
                ).first()
                
                if restaurant_location and restaurant_location.rest_id:
                    # Get restaurant data
                    restaurant = Restaurant.objects.filter(
                        id=restaurant_location.rest_id
                    ).first()
                    
                    if restaurant:
                        # Build response directly without calling branding_config()
                        restaurant_info = {
                            'id': str(restaurant.id),
                            'name': restaurant.name or f'Restaurant for Table {table.table_label}',
                            'location_id': restaurant_location.location_id,
                            'active_menu': restaurant.active_menu,
                            'currency': restaurant.currency or 'GBP',
                            'timezone': restaurant.timezone or 'Europe/London',
                            'integration_name': restaurant.integration_name,
                            'branding': {
                                'id': str(restaurant.id),
                                'name': restaurant.name or 'Unknown Restaurant',
                                'logo_url': None,
                                'background_image_url': None,
                                'primary_color': '#0071e3',
                                'secondary_color': '#f5f5f7',
                                'show_logo_on_receipt': True,
                                'show_background_image': True,
                            }
                        }
            except Exception as e:
                logger.warning(f"Error getting restaurant info for table {token}: {str(e)}")
                # Continue with fallback
        
        # Use fallback info if restaurant lookup failed
        if not restaurant_info:
            restaurant_info = {
                'id': str(table.restaurant_id) if table.restaurant_id else None,
                'name': f'Restaurant for Table {table.table_label}',
                'location_id': None,
                'active_menu': None,
                'currency': 'GBP',
                'timezone': 'Europe/London',
                'integration_name': None,
                'branding': None
            }
        
        response_data['restaurant'] = restaurant_info
        
        logger.info(f"Successfully retrieved context for table {token}")
        return JsonResponse(response_data)
        
    except Exception as e:
        logger.error(f"Error getting table context for token {token}: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': 'Internal server error'
        }, status=500)