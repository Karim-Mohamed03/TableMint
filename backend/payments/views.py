import uuid
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils.decorators import method_decorator
from django.views import View
import json
import os

from pos.pos_service import POSService
from .models import Payment

@method_decorator(csrf_exempt, name='dispatch')
class CreatePaymentView(View):
    """View to handle payment creation requests."""
    
    def post(self, request, *args, **kwargs):
        try:
            # Parse the request body
            data = json.loads(request.body)
            
            # Required fields
            source_id = data.get('source_id')
            amount = data.get('amount')
            
            if not source_id or not amount:
                return JsonResponse({
                    'success': False, 
                    'error': 'Missing required fields: source_id and amount are required'
                }, status=400)
            
            # Optional fields
            currency = data.get('currency', 'GBP')
            customer_id = data.get('customer_id')
            location_id = data.get('location_id')
            reference_id = data.get('reference_id')
            note = data.get('note')
            app_fee_amount = data.get('app_fee_amount')
            autocomplete = data.get('autocomplete', True)
            
            # Generate idempotency key for this request
            idempotency_key = str(uuid.uuid4())
            
            # Create payment record in our database first
            payment = Payment.objects.create(
                idempotency_key=idempotency_key,
                amount=amount,
                currency=currency,
                source_id=source_id,
                customer_id=customer_id,
                reference_id=reference_id,
                note=note,
            )
            
            # Initialize POS service and make the payment
            pos_service = POSService()
            payment_result = pos_service.process_payment({
                'source_id': source_id,
                'amount': amount,
                'currency': currency,
                'idempotency_key': idempotency_key,
                'customer_id': customer_id,
                'location_id': location_id,
                'reference_id': reference_id,
                'note': note,
                'app_fee_amount': app_fee_amount,
                'autocomplete': autocomplete
            })
            
            # Update our payment record with payment ID and response data
            if payment_result.get('success', False) and 'payment' in payment_result:
                payment_data = payment_result['payment']
                payment.square_payment_id = payment_data.get('id', '')
                payment.status = payment_data.get('status', '').lower()
                payment.response_data = payment_result  # Store full response for later use
            payment.save()
            
            return JsonResponse({
                'success': True,
                'payment': payment_result
            })
            
        except Exception as e:
            # Handle errors
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)



@method_decorator(csrf_exempt, name='dispatch')
class SearchOrdersView(View):
    """View to handle searching Square orders."""
    
    def post(self, request, *args, **kwargs):
        try:
            # Parse the request body
            data = json.loads(request.body)
            
            # Extract parameters from request
            location_ids = data.get('location_ids')
            closed_at_start = data.get('closed_at_start')
            closed_at_end = data.get('closed_at_end')
            states = data.get('states', ['COMPLETED'])  # Default to completed orders
            customer_ids = data.get('customer_ids')
            sort_field = data.get('sort_field', 'CLOSED_AT')
            sort_order = data.get('sort_order', 'DESC')
            limit = data.get('limit', 20)
            cursor = data.get('cursor')
            return_entries = data.get('return_entries', True)
            
            # Initialize POS service and search for orders
            pos_service = POSService()
            result = pos_service.search_orders(
                location_ids=location_ids,
                closed_at_start=closed_at_start,
                closed_at_end=closed_at_end,
                states=states,
                customer_ids=customer_ids,
                sort_field=sort_field,
                sort_order=sort_order,
                limit=limit,
                cursor=cursor,
                return_entries=return_entries
            )
            
            # Optional: log the search if using the OrderSearch model
            if 'OrderSearch' in globals():
                search_log = OrderSearch.objects.create(
                    search_params=data,
                    result_count=len(result.get('order_entries', [])) if return_entries else len(result.get('orders', [])),
                    cursor=result.get('cursor')
                )
            
            return JsonResponse(result)
            
        except Exception as e:
            # Handle errors
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)