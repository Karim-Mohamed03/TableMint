from django.urls import path
from .views import create, search

urlpatterns = [
    path('create/', create, name='create'),
    path('search/', search, name='search'),
]
