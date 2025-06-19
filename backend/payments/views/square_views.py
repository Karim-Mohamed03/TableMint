import uuid
import json
import os
import logging
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils.decorators import method_decorator
from django.views import View
from django.db.models import Sum
from django.db import transaction
from django.core.exceptions import ValidationError

from pos.pos_service import POSService
from ..models import Payment, PhillyCheesesteakPayment, OrderSearch
from pos.square_adapter import SquareAdapter
from pos.pos_factory import POSFactory

logger = logging.getLogger(__name__)


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


@csrf_exempt
def create_external_payment(request):
    """
    Create an external payment record in Square for payments processed through Stripe.
    This function can work in two modes:
    
    1. Single Payment Mode: Creates a payment record for a single Stripe payment
    2. Aggregate Mode: Creates a payment record based on the sum of all Stripe payments for an order
    
    This keeps the Square system in sync with payments processed through Stripe.
    Restaurant context is REQUIRED - no fallbacks.
    """
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            order_id = data.get('order_id')
            restaurant_id = data.get('restaurant_id')
            table_token = data.get('table_token')
            
            if not order_id:
                return JsonResponse({
                    'success': False,
                    'error': 'Missing required field: order_id'
                }, status=400)
            
            # Restaurant context is REQUIRED - no fallbacks
            if not restaurant_id and not table_token:
                return JsonResponse({
                    'success': False,
                    'error': 'Restaurant context is required. Provide either restaurant_id or table_token parameter.'
                }, status=400)
            
            # Check if this is a single payment mode (has amount and tip_amount)
            single_payment_amount = data.get('amount')
            single_payment_tip = data.get('tip_amount', 0)
            
            # Initialize POS service with restaurant-specific credentials
            try:
                pos_service = POSService.for_restaurant(
                    restaurant_id=restaurant_id, 
                    table_token=table_token
                )
                logger.info(f"Using restaurant-specific POS service for external payment: restaurant_id={restaurant_id}, table_token={table_token}")
            except ValueError as e:
                logger.error(f"Failed to create POS service for restaurant: {str(e)}")
                return JsonResponse({
                    'success': False,
                    'error': f'Restaurant configuration error: {str(e)}'
                }, status=400)
            
            if single_payment_amount is not None:
                # Single Payment Mode - create payment record for this specific payment
                result = pos_service.adapter.create_external_payment(
                    order_id=order_id,
                    amount=single_payment_amount,
                    tip_amount=single_payment_tip,
                    source="stripe"
                )
                
                if result.get('success'):
                    return JsonResponse({
                        'success': True,
                        'order_id': order_id,
                        'amount': single_payment_amount,
                        'tip_amount': single_payment_tip,
                        'mode': 'single_payment',
                        'square_payment': result.get('payment')
                    })
                else:
                    return JsonResponse({
                        'success': False,
                        'error': result.get('error', 'Unknown error creating Square payment'),
                        'order_id': order_id,
                        'amount': single_payment_amount,
                        'tip_amount': single_payment_tip,
                        'mode': 'single_payment'
                    }, status=500)
            
            else:
                # Aggregate Mode - get the sum of all recorded payments for this order
                order_base_sum = PhillyCheesesteakPayment.objects.filter(
                    order_id=order_id
                ).aggregate(sum_base_amount=Sum('base_amount'))['sum_base_amount'] or 0
                
                order_tip_sum = PhillyCheesesteakPayment.objects.filter(
                    order_id=order_id
                ).aggregate(sum_tip_amount=Sum('tip_amount'))['sum_tip_amount'] or 0
                
                # Get the order details from Square to check the total amount
                order_result = pos_service.get(order_id)
                
                # Check if we got a successful response
                if not hasattr(order_result, 'is_success') or not order_result.is_success():
                    return JsonResponse({
                        'success': False,
                        'error': 'Could not retrieve order details from Square',
                        'square_error': str(order_result.errors) if hasattr(order_result, 'errors') else str(order_result)
                    }, status=500)
                
                # Extract the order from the response
                order = None
                if hasattr(order_result, 'order'):
                    order = order_result.order
                elif hasattr(order_result, 'body') and hasattr(order_result.body, 'order'):
                    order = order_result.body.order
                
                if not order:
                    return JsonResponse({
                        'success': False,
                        'error': 'Order not found in Square response',
                        'order_id': order_id
                    }, status=404)
                
                # Get the total amount from the order
                order_total_amount = 0
                if hasattr(order, 'total_money') and hasattr(order.total_money, 'amount'):
                    order_total_amount = order.total_money.amount
                
                # Check if the sum of base amounts matches the order total
                if order_base_sum != order_total_amount:
                    return JsonResponse({
                        'success': False,
                        'error': 'Sum of base amounts does not match order total',
                        'order_id': order_id,
                        'base_sum': order_base_sum,
                        'order_total': order_total_amount,
                        'mode': 'aggregate',
                        'match': False
                    })
                
                # If they match, create the external payment
                result = pos_service.adapter.create_external_payment(
                    order_id=order_id,
                    amount=order_base_sum,
                    tip_amount=order_tip_sum,
                    source="stripe"
                )
                
                if result.get('success'):
                    return JsonResponse({
                        'success': True,
                        'order_id': order_id,
                        'amount': order_base_sum,
                        'tip_amount': order_tip_sum,
                        'order_total': order_total_amount,
                        'mode': 'aggregate',
                        'match': True,
                        'square_payment': result.get('payment')
                    })
                else:
                    return JsonResponse({
                        'success': False,
                        'error': result.get('error', 'Unknown error creating Square payment'),
                        'order_id': order_id,
                        'amount': order_base_sum,
                        'tip_amount': order_tip_sum,
                        'mode': 'aggregate',
                        'match': True
                    }, status=500)
            
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)
    
    return JsonResponse({'error': 'Invalid request method'}, status=405)



@csrf_exempt
@require_http_methods(["POST"])
def create_payment(request):
    """
    Django view to create a payment using Square.
    
    Accepts POST requests with payment data and processes them through Square's Payments API.
    """
    try:
        # Parse the request body
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            logger.error("Invalid JSON in payment request")
            return JsonResponse({
                'success': False,
                'error': 'Invalid JSON data'
            }, status=400)
        
        # Extract and validate required fields
        source_id = data.get('source_id')
        amount = data.get('amount')
        restaurant_id = data.get('restaurant_id')
        table_token = data.get('table_token')
        
        if not source_id or not amount:
            logger.warning("Missing required fields in payment request")
            return JsonResponse({
                'success': False, 
                'error': 'Missing required fields: source_id and amount are required'
            }, status=400)
        
        # Validate amount is positive integer
        try:
            amount = int(amount)
            if amount <= 0:
                raise ValueError("Amount must be positive")
        except (ValueError, TypeError):
            return JsonResponse({
                'success': False,
                'error': 'Amount must be a positive integer'
            }, status=400)
        
        # Validate source_id format (basic check)
        if not isinstance(source_id, str) or len(source_id.strip()) == 0:
            return JsonResponse({
                'success': False,
                'error': 'Invalid source_id format'
            }, status=400)
        
        # Optional fields with defaults and validation
        currency = data.get('currency', 'GBP')
        if currency not in ['USD', 'GBP', 'EUR', 'CAD', 'AUD', 'JPY']:  # Add supported currencies
            return JsonResponse({
                'success': False,
                'error': f'Unsupported currency: {currency}'
            }, status=400)
        
        # Always generate a fresh UUID for idempotency - don't accept from client
        idempotency_key = str(uuid.uuid4())
        order_id = data.get('order_id')
        customer_id = data.get('customer_id')
        reference_id = data.get('reference_id')
        note = data.get('note', '')[:500]  # Limit note length
        tip_money = data.get('tip_money')
        app_fee_amount = data.get('app_fee_amount')
        autocomplete = data.get('autocomplete', True)
        verification_token = data.get('verification_token')
        
        # Validate tip_money if provided
        if tip_money is not None:
            try:
                tip_money = int(tip_money)
                if tip_money < 0:
                    raise ValueError("Tip amount cannot be negative")
            except (ValueError, TypeError):
                return JsonResponse({
                    'success': False,
                    'error': 'Tip amount must be a non-negative integer'
                }, status=400)
        
        # Validate app_fee_amount if provided
        if app_fee_amount is not None:
            try:
                app_fee_amount = int(app_fee_amount)
                if app_fee_amount < 0:
                    raise ValueError("App fee amount cannot be negative")
            except (ValueError, TypeError):
                return JsonResponse({
                    'success': False,
                    'error': 'App fee amount must be a non-negative integer'
                }, status=400)
        
        logger.info(f"Creating Square payment - Amount: {amount} {currency}, Source ID: {source_id[:8]}...")
        
        # Use database transaction to ensure data consistency
        with transaction.atomic():
            # Create payment record in our database first with pending status
            payment_record = Payment.objects.create(
                idempotency_key=idempotency_key,
                amount=amount,
                currency=currency,
                source_id=source_id,
                customer_id=customer_id,
                order_id=order_id,
                reference_id=reference_id,
                note=note,
                status='pending'  # Set initial status as pending
            )
            
            # Restaurant context is REQUIRED - no fallbacks
            if not restaurant_id and not table_token:
                logger.error("No restaurant context provided for payment creation")
                payment_record.status = 'error'
                payment_record.response_data = {'error': 'Restaurant context is required. Provide either restaurant_id or table_token parameter.'}
                payment_record.save()
                return JsonResponse({
                    'success': False,
                    'error': 'Restaurant context is required. Provide either restaurant_id or table_token parameter.',
                    'payment_record_id': payment_record.id
                }, status=400)
            
            # Initialize POS service with restaurant-specific credentials
            try:
                pos_service = POSService.for_restaurant(
                    restaurant_id=restaurant_id, 
                    table_token=table_token
                )
                logger.info(f"Using restaurant-specific POS service for payment creation: restaurant_id={restaurant_id}, table_token={table_token}")
            except ValueError as e:
                logger.error(f"Failed to create POS service for restaurant: {str(e)}")
                payment_record.status = 'error'
                payment_record.response_data = {'error': f'Restaurant configuration error: {str(e)}'}
                payment_record.save()
                return JsonResponse({
                    'success': False,
                    'error': f'Restaurant configuration error: {str(e)}',
                    'payment_record_id': payment_record.id
                }, status=400)

            # Get location_id from the restaurant context (no .env fallback)
            # The POS service adapter already has the correct location_id from the restaurant
            location_id = data.get('location_id')  # Only use explicit location_id if provided
            if not location_id:
                # Get the location_id from the restaurant's POS adapter
                location_id = pos_service.adapter.location_id
                logger.info(f"Using location_id from restaurant context: {location_id}")

            payment_data = {
                'source_id': source_id,
                'amount': amount,
                'currency': currency,
                'idempotency_key': idempotency_key,
                'order_id': order_id,
                'customer_id': customer_id,
                'location_id': location_id,
                'reference_id': reference_id,
                'note': note,
                'tip_money': tip_money,
                'app_fee_amount': app_fee_amount,
                'autocomplete': autocomplete,
                'verification_token': verification_token
            }
            
            try:
                payment_result = pos_service.create_payment(payment_data)
                
                # Update our payment record with Square payment ID and response
                if payment_result.get('success', False) and 'payment' in payment_result:
                    payment_data_response = payment_result['payment']
                    payment_record.square_payment_id = payment_data_response.get('id', '')
                    payment_record.status = payment_data_response.get('status', 'unknown').lower()
                    payment_record.response_data = payment_result
                    payment_record.save()
                    
                    logger.info(f"Successfully created Square payment: {payment_record.square_payment_id}")
                    
                    return JsonResponse({
                        'success': True,
                        'payment': payment_result.get('payment'),
                        'payment_record_id': payment_record.id
                    }, status=201)  # 201 Created for successful resource creation
                    
                else:
                    # Payment failed - update record and return error
                    payment_record.status = 'failed'
                    payment_record.response_data = payment_result
                    payment_record.save()
                    
                    error_msg = payment_result.get('error', 'Unknown error')
                    logger.error(f"Failed to create Square payment: {error_msg}")
                    
                    # Return appropriate status code based on error type
                    status_code = 402 if 'declined' in str(error_msg).lower() else 400
                    
                    return JsonResponse({
                        'success': False,
                        'error': error_msg,
                        'payment_record_id': payment_record.id
                    }, status=status_code)
                    
            except Exception as square_error:
                # Update payment record with error status
                payment_record.status = 'error'
                payment_record.response_data = {'error': str(square_error)}
                payment_record.save()
                raise square_error  # Re-raise to be caught by outer exception handler
        
    except ValidationError as e:
        logger.error(f"Validation error in create_payment: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': f'Validation error: {str(e)}'
        }, status=400)
    
    except Exception as e:
        logger.exception(f"Exception in create_payment: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': 'Internal server error occurred'
        }, status=500)