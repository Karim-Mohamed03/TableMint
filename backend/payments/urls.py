from django.urls import path
from payments import stripe_views

urlpatterns = [
    path('create-payment-intent', stripe_views.create_payment_intent, name='create-payment-intent'),
]
