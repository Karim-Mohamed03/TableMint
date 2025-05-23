from django.urls import path
from .views import SquareWebhookView, TableOrderView
from .api_views import get_order_by_reference

urlpatterns = [
    # Square webhook endpoint
    path('webhooks/square', SquareWebhookView.as_view(), name='square_webhook'),
    
    # Table order API
    path('tables/<int:table_id>/order/', TableOrderView.as_view(), name='table_order'),
    
    # NCR order reference lookup
    path('orders/find-by-reference/', get_order_by_reference, name='find_order_by_reference'),
]