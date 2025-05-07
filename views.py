from django.shortcuts import render
from backend.payments.stripe_views import create_payment_intent

# You can add other views here if needed
def home(request):
    return render(request, 'index.html')
