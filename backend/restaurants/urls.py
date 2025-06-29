from django.urls import path
from . import views

urlpatterns = [
    path('api/restaurants/<uuid:restaurant_id>/published-menu/', views.get_published_menu, name='get_published_menu'),
    path('api/restaurants/<uuid:restaurant_id>/config/', views.get_restaurant_config, name='get_restaurant_config'),
    path('api/restaurants/<uuid:restaurant_id>/branding/', views.update_restaurant_branding, name='update_restaurant_branding'),
    path('api/restaurants/order/<str:order_id>/branding/', views.get_branding_for_order, name='get_branding_for_order'),
] 