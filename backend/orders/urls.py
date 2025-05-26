from django.urls import path
from .views import create, search, get, create_ncr_order, create_ncr_order_advanced, create_restaurant_example, create_ncr_order_table

urlpatterns = [
    # Main order endpoints - matches documentation
    path('', create, name='create_order'),  # POST /orders/
    path('search/', search, name='search_orders'),  # POST /orders/search/
    path('<str:order_id>/', get, name='get_order'),  # GET /orders/{order_id}/
    
    # NCR-specific endpoints for testing
    path('ncr/create/', create_ncr_order, name='create_ncr_order'),
    path('ncr/create-advanced/', create_ncr_order_advanced, name='create_ncr_order_advanced'),
    path('ncr/create-example/', create_restaurant_example, name='create_restaurant_example'),
    # path('ncr/get/<str:order_id>/', get_ncr_order, name='get_ncr_order'),
    # path('ncr/create-v3-example/', create_ncr_order_v3_example, name='create_ncr_order_v3_example'),
    path('ncr/create-table/', create_ncr_order_table, name='create_ncr_order_table')
]

#xYUv76Bvje35p7n0mJrOaooole4F