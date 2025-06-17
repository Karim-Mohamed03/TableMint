from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
import json

def add_cors_headers(response):
    """Add CORS headers to response for payment endpoints"""
    response['Access-Control-Allow-Origin'] = 'https://test-app-fawn-phi.vercel.app'
    response['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
    response['Access-Control-Allow-Credentials'] = 'true'
    return response

@csrf_exempt
def send_email_receipt(request):
    """Send email receipt to customer with payment details."""
    # Handle OPTIONS request for CORS preflight
    if request.method == 'OPTIONS':
        response = JsonResponse({'status': 'ok'})
        return add_cors_headers(response)
    
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            # Extract required fields
            email = data.get('email')
            payment_id = data.get('payment_id')
            order_id = data.get('order_id')
            total_amount = data.get('total_amount')
            base_amount = data.get('base_amount')
            tip_amount = data.get('tip_amount')
            status = data.get('status')
            
            # Validate required fields
            if not email or not payment_id:
                response = JsonResponse({
                    'success': False,
                    'error': 'Email and payment ID are required'
                }, status=400)
                return add_cors_headers(response)
            
            # Format currency amounts
            def format_currency(amount):
                if amount is None:
                    return '£0.00'
                return f"£{amount / 100:.2f}"
            
            # Prepare email content
            subject = f"Receipt for Payment {payment_id[:8]}..."
            
            # Create email context
            context = {
                'payment_id': payment_id,
                'order_id': order_id,
                'total_amount': format_currency(total_amount),
                'base_amount': format_currency(base_amount),
                'tip_amount': format_currency(tip_amount),
                'status': status.title() if status else 'Completed',
                'restaurant_name': 'Marwan\'s Philly Cheesesteak'
            }
            
            # Create email body with better formatting
            email_body = f"""Dear Customer,

            Thank you for your payment at {context['restaurant_name']}!

            PAYMENT RECEIPT
            ===============

            Payment Details:
            • Payment ID: {context['payment_id']}
            • Order ID: {context['order_id']}
            • Status: {context['status']}

            Amount Breakdown:
            • Base Amount: {context['base_amount']}
            • Tip Amount: {context['tip_amount']}
            • Total Amount: {context['total_amount']}

            We appreciate your business and hope you enjoyed your meal!

            Best regards,
            The {context['restaurant_name']} Team

            ---
            This is an automated receipt. Please do not reply to this email.
            """
            
            # Send email
            try:
                send_mail(
                    subject=subject,
                    message=email_body,
                    from_email="tablemint01@gmail.com",
                    recipient_list=[email],
                    fail_silently=False,
                )
                
                response = JsonResponse({
                    'success': True,
                    'message': 'Receipt sent successfully'
                })
                return add_cors_headers(response)
                
            except Exception as email_error:
                print(f"Email sending error: {str(email_error)}")
                response = JsonResponse({
                    'success': False,
                    'error': 'Failed to send email. Please check your email configuration.'
                }, status=500)
                return add_cors_headers(response)
            
        except json.JSONDecodeError:
            response = JsonResponse({
                'success': False,
                'error': 'Invalid JSON data'
            }, status=400)
            return add_cors_headers(response)
        except Exception as e:
            print(f"Email receipt error: {str(e)}")
            response = JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)
            return add_cors_headers(response)
    
    response = JsonResponse({'error': 'Invalid request method'}, status=405)
    return add_cors_headers(response)
