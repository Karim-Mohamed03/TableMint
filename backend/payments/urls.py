from django.urls import path
from .views import stripe_views, square_views, receipt_views

app_name = 'payments'

urlpatterns = [
    path('create-payment-intent', stripe_views.create_payment_intent, name='create_payment_intent'),
    path('record-philly-payment', stripe_views.record_philly_payment, name='record_philly_payment'),
    path('get-order-base-sum/<str:order_id>', stripe_views.get_order_base_sum, name='get_order_base_sum'),
    path('get-order-base-sum', stripe_views.get_order_base_sum, name='get_order_base_sum_post'),
    path('create-external-payment', stripe_views.create_square_external_payment, name='create_square_external_payment'),
    path('create-square-payment', square_views.create_external_payment, name='create_square_payment'),  # Backwards compatibility
    path('send-email-receipt', receipt_views.send_email_receipt, name='send_email_receipt'),
    path('create_payment', square_views.create_payment, name='create_payment')
]
