from django.urls import path
from . import views

urlpatterns = [
    path('api/restaurants/<int:restaurant_id>/config/', views.get_restaurant_config, name='get_restaurant_config'),
    path('api/restaurants/<int:restaurant_id>/branding/', views.update_restaurant_branding, name='update_restaurant_branding'),
    path('api/restaurants/order/<str:order_id>/branding/', views.get_branding_for_order, name='get_branding_for_order'),
] 