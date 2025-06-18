import json
import stripe
import logging
import requests
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from django.db.models import Sum, Max
import os
from pathlib import Path
from dotenv import load_dotenv
from ..models import PhillyCheesesteakPayment
from pos.square_adapter import SquareAdapter

# Set up logger - use the 'payments' logger configured in settings.py
logger = logging.getLogger('payments')

# Get the base directory (backend folder)
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Load environment variables from .env file (not .env.example)
env_file = os.path.join(BASE_DIR, '.env')
load_dotenv(env_file)

stripe.api_key = os.getenv('STRIPE_SECRET_KEY')


@csrf_exempt
def create_payment_intent(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            # Calculate order amount - this may raise ValueError
            try:
                amount = calculate_order_amount(data.get('items', []))
            except ValueError as calc_error:
                logger.error(f"Failed to calculate order amount: {str(calc_error)}")
                return JsonResponse({
                    'error': f'Unable to calculate order amount: {str(calc_error)}'
                }, status=400)
            
            #Calculate application fee amount
            application_fee = int(round(amount * 0.02))
            
            # Create a PaymentIntent with the order amount and currency
            intent = stripe.PaymentIntent.create(
                amount=amount,
                currency='gbp',
                # In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional
                automatic_payment_methods={
                    'enabled': True,
                },
                stripe_account='acct_1Rab3QQBvc6fFqZ8',  # Stripe Connect account ID
                application_fee_amount=application_fee,  # Application fee in cents
            )
            return JsonResponse({
                'clientSecret': intent['client_secret']
            })
        except Exception as e:
            logger.error(f"Error creating payment intent: {str(e)}")
            return JsonResponse({'error': str(e)}, status=403)
    
    return JsonResponse({'error': 'Invalid request method'}, status=405)


def calculate_order_amount(items):
    try:
        # Method 1: Try to extract cart data from the request items
        # The frontend might pass the cart data in the items array
        if items and isinstance(items, list) and len(items) > 0:
            first_item = items[0]
            
            # Check if this is a cart object with total calculated
            if isinstance(first_item, dict):
                # Check for pre-calculated total amount in cents
                if 'total_amount_cents' in first_item:
                    logger.info(f"Using pre-calculated total: {first_item['total_amount_cents']} cents")
                    return first_item['total_amount_cents']
                
                # Check for cart structure with items array and tax
                if 'cart_items' in first_item and isinstance(first_item['cart_items'], list):
                    cart_items = first_item['cart_items']
                    subtotal = 0
                    
                    # Calculate subtotal from cart items
                    for item in cart_items:
                        if isinstance(item, dict) and 'price' in item and 'quantity' in item:
                            item_price = float(item['price'])  # Price in pounds
                            item_quantity = int(item['quantity'])
                            subtotal += item_price * item_quantity
                    
                    # Apply promo discount if present
                    promo_discount = first_item.get('promo_discount', 0)  # Percentage
                    if promo_discount > 0:
                        subtotal = subtotal * (1 - promo_discount / 100)
                    
                    # Get the actual tax amount from the cart data
                    tax_amount = first_item.get('tax', 0)  # Tax in pounds
                    if tax_amount is None:
                        logger.error("Tax amount not found in cart data")
                        raise ValueError("Tax amount not provided in cart data")
                    
                    total = subtotal + float(tax_amount)
                    
                    # Convert to cents and return
                    total_cents = int(round(total * 100))
                    logger.info(f"Calculated total: subtotal=£{subtotal:.2f}, tax=£{tax_amount:.2f}, total=£{total:.2f} ({total_cents} cents)")
                    return total_cents
                
                # Check for complete cart data with subtotal, tax, and total
                if 'subtotal' in first_item and 'tax' in first_item and 'total' in first_item:
                    total = float(first_item['total'])  # Total in pounds
                    total_cents = int(round(total * 100))
                    logger.info(f"Using cart total: £{total:.2f} ({total_cents} cents)")
                    return total_cents
                
                # Check for simple amount field (legacy support)
                if 'amount' in first_item:
                    amount = first_item['amount']
                    # If amount is already in cents, return as is
                    if isinstance(amount, (int, float)) and amount >= 100:
                        logger.info(f"Using legacy amount (cents): {int(amount)}")
                        return int(amount)
                    # If amount is in pounds, convert to cents
                    elif isinstance(amount, (int, float)) and amount > 0:
                        amount_cents = int(amount * 100)
                        logger.info(f"Using legacy amount (pounds): £{amount:.2f} ({amount_cents} cents)")
                        return amount_cents
        
        # Method 2: Fallback - try to parse as individual items with total_money
        if items and isinstance(items, list):
            total_amount = 0
            for item in items:
                if isinstance(item, dict):
                    # Handle Square-style line items
                    if 'base_price_money' in item and 'quantity' in item:
                        price_money = item['base_price_money']
                        if isinstance(price_money, dict) and 'amount' in price_money:
                            item_total = price_money['amount'] * int(item.get('quantity', 1))
                            total_amount += item_total
                    # Handle simple price/quantity items
                    elif 'price' in item and 'quantity' in item:
                        price = float(item['price'])  # Assume price in pounds
                        quantity = int(item['quantity'])
                        item_total = price * quantity * 100  # Convert to cents
                        total_amount += item_total
            
            if total_amount > 0:
                logger.info(f"Calculated from individual items: {total_amount} cents (£{total_amount/100:.2f})")
                return total_amount
        
        # No valid data found
        logger.error(f"Could not calculate order amount from items: {items}")
        raise ValueError("Unable to calculate order amount from provided data")
        
    except Exception as e:
        logger.error(f"Error calculating order amount: {str(e)}")
        raise ValueError(f"Failed to calculate order amount: {str(e)}")


@csrf_exempt
def record_philly_payment(request):
    """
    Endpoint to record successful payments to the Marwan's-Philly-Cheesesteak-Payments table
    All amounts are in cents
    Order should already exist - we only record the payment
    """
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            order_id = data.get('order_id')
            payment_id = data.get('payment_id')
            total_amount = data.get('amount')
            base_amount = data.get('base_amount')
            tip_amount = data.get('tip_amount')
            
            # Get total_money from the request data (passed from frontend)
            order_total_money = data.get('total_money', total_amount)  # Fallback to total_amount if not provided
            order_total_currency = data.get('total_currency', 'GBP')
            
            logger.info(f"Recording payment - Order ID: {order_id}, Payment ID: {payment_id}")
            if total_amount:
                logger.info(f"Amount: {total_amount} cents (${total_amount/100:.2f})")
            logger.debug(f"Payment details - Base: {base_amount} cents, Tip: {tip_amount} cents")
            if order_total_money:
                logger.debug(f"Order Total: {order_total_money} {order_total_currency}")
            
            # Get location ID from environment variables
            location_id = os.getenv('SQUARE_LOCATION_ID')
            
            # Validate required fields
            if not all([order_id, payment_id, total_amount, location_id]):
                missing = [f for f, v in {'order_id': order_id, 'payment_id': payment_id, 
                                          'total_amount': total_amount, 'location_id': location_id}.items() if not v]
                logger.warning(f"Missing required fields: {', '.join(missing)}")
                return JsonResponse({
                    'success': False,
                    'error': 'Missing required fields'
                }, status=400)
            
            # If base_amount and tip_amount are not provided, use total_amount as base_amount
            if base_amount is None and tip_amount is None:
                logger.info(f"No base_amount or tip_amount provided, setting base_amount={total_amount}, tip_amount=0")
                base_amount = total_amount
                tip_amount = 0
            # If only one is provided, calculate the other
            elif base_amount is None:
                base_amount = total_amount - tip_amount
                logger.info(f"Calculated base_amount: {base_amount} cents (total_amount - tip_amount)")
            elif tip_amount is None:
                tip_amount = total_amount - base_amount
                logger.info(f"Calculated tip_amount: {tip_amount} cents (total_amount - base_amount)")
                
            # Create payment record
            payment = PhillyCheesesteakPayment.objects.create(
                order_id=order_id,
                payment_id=payment_id,
                location_id=location_id,
                amount=total_amount,
                base_amount=base_amount,
                tip_amount=tip_amount,
                total_money=order_total_money,
                total_currency=order_total_currency
            )
            
            logger.info(f"Created PhillyCheesesteakPayment record with ID: {payment.id}")
            
            # Get the sum of base_amounts for this order
            order_base_sum = PhillyCheesesteakPayment.objects.filter(
                order_id=order_id
            ).aggregate(sum_base_amount=Sum('base_amount'))['sum_base_amount'] or 0
            
            logger.info(f"Current sum of base_amounts for order_id {order_id}: {order_base_sum} cents (${order_base_sum/100:.2f})")
            
            # Now try to create external payment in Square
            try:
                logger.info(f"Attempting to create external payment in Square for order_id: {order_id}")
                square_payment_result = create_square_external_payment(order_id, order_base_sum)
                logger.info(f"Square external payment result: {square_payment_result}")
            except Exception as e:
                logger.exception(f"Error creating external payment in Square: {str(e)}")
                square_payment_result = {
                    'success': False,
                    'error': f"Exception creating external payment: {str(e)}"
                }
            
            # Prepare the response
            response_data = {
                'success': True,
                'payment_id': payment.id,
                'base_amount': base_amount,
                'base_amount_formatted': f"${base_amount/100:.2f}",
                'tip_amount': tip_amount,
                'tip_amount_formatted': f"${tip_amount/100:.2f}",
                'total_amount': total_amount,
                'total_amount_formatted': f"${total_amount/100:.2f}",
                'order_total_money': order_total_money,
                'order_total_formatted': f"${order_total_money/100:.2f}" if order_total_money else None,
                'order_base_sum': order_base_sum,
                'order_base_sum_formatted': f"${order_base_sum/100:.2f}",
                'square_external_payment': square_payment_result
            }
            
            return JsonResponse(response_data)
            
        except Exception as e:
            logger.exception(f"Exception in record_philly_payment: {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)
            
    return JsonResponse({'error': 'Invalid request method'}, status=405)


def create_square_external_payment(order_id, base_sum):
    """
    Helper function to create an external payment in Square when base amounts match order total
    Gets the order total from the database instead of calling Square API
    Restaurant context is REQUIRED - this function should not be called without proper context
    """
    logger.info(f"=== CREATE SQUARE EXTERNAL PAYMENT START ===")
    logger.info(f"Order ID: {order_id}")
    logger.info(f"Base sum (cents): {base_sum} (${base_sum/100:.2f})")
    
    try:
        # Get the order total from the database instead of calling Square
        order_payment = PhillyCheesesteakPayment.objects.filter(
            order_id=order_id,
            total_money__isnull=False
        ).first()
        
        if not order_payment or order_payment.total_money is None:
            logger.warning(f"No payment record with total_money found for order_id: {order_id}")
            return {
                'success': False,
                'error': 'No payment record with order total found in database',
                'order_id': order_id
            }
        
        # Get the total amount from the database record
        order_total_amount = order_payment.total_money
        
        # Calculate the sum of all tip amounts for this order
        tip_sum = PhillyCheesesteakPayment.objects.filter(
            order_id=order_id
        ).aggregate(sum_tip_amount=Sum('tip_amount'))['sum_tip_amount'] or 0
        
        logger.info(f"Order total from database (cents): {order_total_amount} (${order_total_amount/100:.2f})")
        logger.info(f"Base sum (cents): {base_sum} (${base_sum/100:.2f})")
        logger.info(f"Total tips for this order (cents): {tip_sum} (${tip_sum/100:.2f})")
        
        # Check if the sum of base amounts matches the order total
        if base_sum != order_total_amount:
            logger.info(f"Sum of base amounts ({base_sum} cents) does not match order total ({order_total_amount} cents)")
            logger.info(f"Amounts in currency format: base_sum=${base_sum/100:.2f}, order_total=${order_total_amount/100:.2f}")
            return {
                'success': False,
                'error': 'Sum of base amounts does not match order total',
                'order_id': order_id,
                'base_sum': base_sum,
                'order_total': order_total_amount,
                'base_sum_formatted': f"${base_sum/100:.2f}",
                'order_total_formatted': f"${order_total_amount/100:.2f}",
                'match': False
            }
        
        # NOTE: This function should not be called without proper restaurant context.
        # The calling code should provide restaurant_id or table_token and pass it to this function.
        # For now, we return an error to indicate this needs to be fixed.
        logger.error("create_square_external_payment called without restaurant context - this needs to be updated")
        return {
            'success': False,
            'error': 'Restaurant context is required for external payment creation. This function needs restaurant_id or table_token parameter.',
            'order_id': order_id,
            'base_sum': base_sum,
            'order_total': order_total_amount,
            'match': True
        }
            
    except Exception as e:
        logger.exception(f"💥 Exception occurred while creating external payment: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }
    finally:
        logger.info(f"=== CREATE SQUARE EXTERNAL PAYMENT END ===\n")


@csrf_exempt
def get_order_base_sum(request, order_id=None):
    """
    Endpoint to retrieve the sum of all base_amount values for a specific order_id
    """
    if request.method == 'GET':
        if not order_id:
            logger.warning("Missing order_id parameter in GET request")
            return JsonResponse({
                'success': False,
                'error': 'Missing order_id parameter'
            }, status=400)
            
        try:
            logger.info(f"Getting sum of base_amounts for order_id: {order_id} (GET)")
            # Get the sum of base_amounts for the given order_id
            order_base_sum = PhillyCheesesteakPayment.objects.filter(
                order_id=order_id
            ).aggregate(sum_base_amount=Sum('base_amount'))['sum_base_amount'] or 0
            
            logger.info(f"Sum of base_amounts for order_id {order_id}: {order_base_sum}")
            
            return JsonResponse({
                'success': True,
                'order_id': order_id,
                'order_base_sum': order_base_sum
            })
            
        except Exception as e:
            logger.exception(f"Exception in get_order_base_sum (GET): {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)
    
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            order_id = data.get('order_id')
            
            if not order_id:
                logger.warning("Missing order_id parameter in POST request")
                return JsonResponse({
                    'success': False,
                    'error': 'Missing order_id parameter'
                }, status=400)
            
            logger.info(f"Getting sum of base_amounts for order_id: {order_id} (POST)")
            # Get the sum of base_amounts for the given order_id
            order_base_sum = PhillyCheesesteakPayment.objects.filter(
                order_id=order_id
            ).aggregate(sum_base_amount=Sum('base_amount'))['sum_base_amount'] or 0
            
            logger.info(f"Sum of base_amounts for order_id {order_id}: {order_base_sum}")
            
            return JsonResponse({
                'success': True,
                'order_id': order_id,
                'order_base_sum': order_base_sum
            })
            
        except Exception as e:
            logger.exception(f"Exception in get_order_base_sum (POST): {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)
    
    return JsonResponse({'error': 'Invalid request method'}, status=405)
