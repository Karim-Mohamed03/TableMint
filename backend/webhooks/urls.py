from django.urls import path
from . import views

app_name = 'webhooks'

urlpatterns = [
    path('square/', views.square_webhook, name='square_webhook'),
    path('clover/', views.clover_webhook, name='clover_webhook'),
]