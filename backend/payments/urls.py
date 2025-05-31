from django.urls import path
from . import stripe_views, views

app_name = 'payments'

urlpatterns = [
    path('create-payment-intent', stripe_views.create_payment_intent, name='create_payment_intent'),
    path('record-philly-payment', stripe_views.record_philly_payment, name='record_philly_payment'),
    path('get-order-base-sum/<str:order_id>', stripe_views.get_order_base_sum, name='get_order_base_sum'),
    path('get-order-base-sum', stripe_views.get_order_base_sum, name='get_order_base_sum_post'),
    path('create-square-payment', views.create_square_payment_from_stripe, name='create_square_payment'),
    path('send-email-receipt', views.send_email_receipt, name='send_email_receipt'),
]
