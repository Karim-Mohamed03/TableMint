from django.urls import path
from .views import get_table_order

urlpatterns = [
    path('table/<int:table_id>/order/', get_table_order, name='table_order'),
]
