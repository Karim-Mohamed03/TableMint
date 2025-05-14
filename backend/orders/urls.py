from django.urls import path
from .views import create, search, get

urlpatterns = [
    path('create/', create, name='create'),
    path('search/', search, name='search'),
    path('get/<str:order_id>/', get, name='get'),
    
]

#xYUv76Bvje35p7n0mJrOaooole4F