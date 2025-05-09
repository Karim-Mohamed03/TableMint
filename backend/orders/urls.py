from django.urls import path
from .views import get_table_order, list_all_orders, get_order_details, test_square_connection

urlpatterns = [
    path('table/<int:table_id>/order/', get_table_order, name='table_order'),
    path('all/', list_all_orders, name='list_all_orders'),
    path('<str:order_id>/', get_order_details, name='order_details'),
    path('test-connection/', test_square_connection, name='test_square_connection'),
]
