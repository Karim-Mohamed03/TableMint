from django.urls import path
from .views import SquareWebhookView, TableOrderView

urlpatterns = [
    # Square webhook endpoint
    path('webhooks/square', SquareWebhookView.as_view(), name='square_webhook'),
    
    # Table order API
    path('api/tables/<int:table_id>/order/', TableOrderView.as_view(), name='table_order'),
]