from django.urls import path
from . import stripe_views

app_name = 'payments'

urlpatterns = [
    path('create-payment-intent', stripe_views.create_payment_intent, name='create_payment_intent'),
]
