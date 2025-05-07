from django.urls import path
from . import views

app_name = 'tables_frontend'

urlpatterns = [
    path('<int:table_id>/', views.table_receipt_view, name='table-receipt'),
    path('<int:table_id>/receipt/', views.table_receipt_view, name='table-receipt-detail'),
]