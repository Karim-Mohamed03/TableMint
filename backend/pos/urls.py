from django.urls import path
from .views import SquareWebhookView, TableOrderView, get_catalog, get_locations
from .api_views import get_order_by_reference
from .clover_api_views import create_clover_order, get_clover_order, list_clover_orders

urlpatterns = [
    # Square webhook endpoint
    path('webhooks/square', SquareWebhookView.as_view(), name='square_webhook'),
    
    # Table order API
    path('tables/<int:table_id>/order/', TableOrderView.as_view(), name='table_order'),
    
    # NCR order reference lookup
    path('orders/find-by-reference/', get_order_by_reference, name='find_order_by_reference'),
    
    # Clover API endpoints for testing
    path('clover/orders/', create_clover_order, name='create_clover_order'),
    path('clover/orders/<str:order_id>/', get_clover_order, name='get_clover_order'),
    path('clover/orders-all/', list_clover_orders, name='list_clover_orders'),
    
    # Catalog endpoint
    path('catalog/', get_catalog, name='get_catalog'),
    
    # Locations endpoint
    path('locations/', get_locations, name='get_locations'),
]