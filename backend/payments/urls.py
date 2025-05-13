from django.urls import path
from . import views

app_name = 'payments'

urlpatterns = [
    path('create/', views.CreatePaymentView.as_view(), name='create'),
    path('get/<str:payment_id>/', views.CreatePaymentView.as_view(), name='get'),
    path('search-orders/', views.SearchOrdersView.as_view(), name='search_orders'),
]
