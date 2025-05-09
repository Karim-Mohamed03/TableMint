import json
import stripe
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings

# This is your test secret API key.
stripe.api_key = 'sk_test_51MNLkFEACKuyUvsyuJi4BZW7FuHrtKBFeJjrashJ88baTmaB2c0u1svIM7Av11La7TUTRMz74fxQ2eiGJn6kDELJ00YqDLNMO6'

def calculate_order_amount(items):
    # Extract amount from the first item or use a default value
    if items and isinstance(items, list) and len(items) > 0:
        if isinstance(items[0], dict) and 'amount' in items[0]:
            return items[0]['amount']
    # Default fallback
    return 1400

@csrf_exempt
def create_payment_intent(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            # Create a PaymentIntent with the order amount and currency
            intent = stripe.PaymentIntent.create(
                amount=calculate_order_amount(data.get('items', [])),
                currency='gbp',
                # In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional
                automatic_payment_methods={
                    'enabled': True,
                },
            )
            return JsonResponse({
                'clientSecret': intent['client_secret']
            })
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=403)
    return JsonResponse({'error': 'Invalid request method'}, status=405)
