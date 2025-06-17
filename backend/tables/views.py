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
        table = get_object_or_404(Table, token=token, is_active=True)
        
        # Get restaurant information
        restaurant = table.restaurant
        if restaurant:
            # Decrypt the access token if it exists
            decrypted_access_token = None
            if restaurant.access_token:
                try:
                    decrypted_access_token = decrypt_token(restaurant.access_token)
                except Exception as e:
                    logger.error(f"Failed to decrypt access token for restaurant {restaurant.id}: {str(e)}")
            
            # Build the redirect URL with parameters
            frontend_url = "https://test-app-fawn-phi.vercel.app/QROrderPay"
            
            # Add query parameters for context
            params = []
            params.append(f"table_token={token}")
            params.append(f"table_label={table.table_label}")
            params.append(f"restaurant_id={restaurant.id}")
            
            if restaurant.active_menu:
                params.append(f"menu_id={restaurant.active_menu}")
            
            if restaurant.location_id:
                params.append(f"location_id={restaurant.location_id}")
            
            redirect_url = f"{frontend_url}?{'&'.join(params)}"
            
            return redirect(redirect_url)
        else:
            # No restaurant associated, redirect to generic menu
            return redirect(f"https://test-app-fawn-phi.vercel.app/QROrderPay?table_token={token}&table_label={table.table_label}")
            
    except Table.DoesNotExist:
        logger.error(f"Table not found for token: {token}")
        # Redirect to main menu with error
        return redirect("https://test-app-fawn-phi.vercel.app/QROrderPay?error=invalid_table")
    except Exception as e:
        logger.error(f"Error processing QR code for token {token}: {str(e)}")
        return redirect("https://test-app-fawn-phi.vercel.app/QROrderPay?error=system_error")

@api_view(['GET'])
@permission_classes([AllowAny])
def get_table_context(request, token):
    """
    API endpoint to get table and restaurant context for frontend
    URL: /api/tables/context/{token}/
    """
    try:
        table = get_object_or_404(Table, token=token, is_active=True)
        
        response_data = {
            'success': True,
            'table': {
                'token': table.token,
                'label': table.table_label,
                'restaurant_id': str(table.restaurant.id) if table.restaurant else None
            }
        }
        
        # Get restaurant information if available
        if table.restaurant:
            restaurant = table.restaurant
            
            # Decrypt access token
            decrypted_access_token = None
            if restaurant.access_token:
                try:
                    decrypted_access_token = decrypt_token(restaurant.access_token)
                except Exception as e:
                    logger.error(f"Failed to decrypt access token: {str(e)}")
            
            response_data['restaurant'] = {
                'id': str(restaurant.id),
                'name': restaurant.name,
                'location_id': restaurant.location_id,
                'active_menu': restaurant.active_menu,
                'currency': restaurant.currency,
                'timezone': restaurant.timezone,
                'integration_name': restaurant.integration_name,
                'access_token': decrypted_access_token,  # Only send in secure context
                'branding': restaurant.branding_config()
            }
        
        return JsonResponse(response_data)
        
    except Table.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'Table not found'
        }, status=404)
    except Exception as e:
        logger.error(f"Error getting table context: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': 'Internal server error'
        }, status=500)