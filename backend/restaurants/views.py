from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from .models import Restaurant, RestaurantMenuTemplate
import os
from django.conf import settings
from django.urls import reverse

# Create your views here.

@api_view(['GET'])
@permission_classes([AllowAny])
def get_published_menu(request, restaurant_id):
    """
    Get the published menu template for a restaurant
    """
    try:
        menu_template = RestaurantMenuTemplate.get_published_menu(restaurant_id)
        if not menu_template:
            return Response({
                'success': False,
                'error': 'No published menu found for this restaurant'
            }, status=404)
            
        return Response({
            'success': True,
            'menu': {
                'id': str(menu_template.id),
                'name': menu_template.name,
                'menu_data': menu_template.menu_data,
                'restaurant_id': str(menu_template.restaurant_id)
            }
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=500)


# API endpoint to get restaurant details including branding
@api_view(['GET'])
@permission_classes([AllowAny])
def get_restaurant_config(request, restaurant_id):
    """
    Get restaurant configuration including branding details
    """
    try:
        restaurant = get_object_or_404(Restaurant, id=str(restaurant_id), is_active=True)
        branding_config = restaurant.branding_config()
        branding_config['active_template'] = restaurant.active_template or 'Modern Minimalist'
        
        return Response({
            'success': True,
            'restaurant': branding_config
        })
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# API endpoint to update restaurant branding
@api_view(['PUT'])
def update_restaurant_branding(request, restaurant_id):
    """
    Update restaurant branding configuration
    """
    try:
        restaurant = get_object_or_404(Restaurant, id=restaurant_id)
        
        # Update branding fields if provided in request
        if 'primary_color' in request.data:
            restaurant.primary_color = request.data['primary_color']
        
        if 'secondary_color' in request.data:
            restaurant.secondary_color = request.data['secondary_color']
            
        if 'show_logo_on_receipt' in request.data:
            restaurant.show_logo_on_receipt = request.data['show_logo_on_receipt']
            
        if 'show_background_image' in request.data:
            restaurant.show_background_image = request.data['show_background_image']
        
        # Handle file uploads for logo and background_image
        if 'logo' in request.FILES:
            restaurant.logo = request.FILES['logo']
            
        if 'background_image' in request.FILES:
            restaurant.background_image = request.FILES['background_image']
        
        restaurant.save()
        
        return Response({
            'success': True,
            'restaurant': restaurant.branding_config()
        })
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# API endpoint to get branding for an order
@api_view(['GET'])
@permission_classes([AllowAny])
def get_branding_for_order(request, order_id):
    """
    Get restaurant branding configuration for a specific order
    This is useful when the frontend only has the order ID
    """
    try:
        # For this example, we'll return branding with images from assets folder
        # Rather than using the database records
        
        # Define the paths to the static assets - for verification only
        logo_path = os.path.join(settings.BASE_DIR, 'assets', 'logo.jpg')
        background_path = os.path.join(settings.BASE_DIR, 'assets', 'background.jpg')
        
        # Check if the files exist
        logo_exists = os.path.exists(logo_path)
        background_exists = os.path.exists(background_path)
        
        # Get the host from the request
        host = request.get_host()
        protocol = 'https' if request.is_secure() else 'http'
        base_url = f"{protocol}://{host}"
        
        # Direct absolute URLs - use this format instead of relative URLs
        logo_url = f"{base_url}/assets/logo.jpg" if logo_exists else None
        background_url = f"{base_url}/assets/background.jpg" if background_exists else None
        
        # Construct the response
        branding = {
            'id': 1,
            'name': "Marwan's Philly Cheesesteak",
            'logo_url': logo_url,
            'background_image_url': background_url,
            'primary_color': "#0071e3",
            'secondary_color': "#f5f5f7",
            'show_logo_on_receipt': True,
            'show_background_image': True,
        }
        
        # Add CORS headers to the response
        response = Response({
            'success': True,
            'order_id': order_id,
            'restaurant': branding,
            'debug_info': {
                'logo_exists': logo_exists,
                'background_exists': background_exists,
                'logo_path': logo_path,
                'background_path': background_path,
                'base_url': base_url,
                'logo_url': logo_url,
                'background_url': background_url
            }
        })
        
        return response
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
