from django.urls import path
from .views import get_table_order, list_all_orders, get_order_details, test_pos_connection, create_order

urlpatterns = [
    path('create/', create_order, name='create_order'),
    path('table/<int:table_id>/order/', get_table_order, name='table_order'),
    path('all/', list_all_orders, name='list_all_orders'),
    path('<str:order_id>/', get_order_details, name='order_details'),
    path('test-connection/', test_pos_connection, name='test_pos_connection'),
]
