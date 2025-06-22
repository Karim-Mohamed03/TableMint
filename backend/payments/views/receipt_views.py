from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.core.mail import EmailMessage
from django.conf import settings
import json
from .pdf_receipt import generate_pdf_receipt
from orders.models import Order

@csrf_exempt
def send_email_receipt(request):
    """Send email receipt to customer with payment details and PDF attachment."""
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
            order_items = data.get('items', [])  # Get items directly from request data
            
            # Validate required fields
            if not email or not payment_id:
                return JsonResponse({
                    'success': False,
                    'error': 'Email and payment ID are required'
                }, status=400)
            
            # Generate PDF receipt
            pdf_content = generate_pdf_receipt({
                'payment_id': payment_id,
                'order_id': order_id,
                'total_amount': total_amount,
                'base_amount': base_amount,
                'tip_amount': tip_amount,
                'status': status
            }, order_items)
            
            # Prepare email
            subject = f"Receipt for Payment {payment_id[:8]}..."
            message = "Thank you for your payment! Please find your receipt attached."
            
            # Create email with PDF attachment
            email_message = EmailMessage(
                subject=subject,
                body=message,
                from_email="tablemint01@gmail.com",
                to=[email]
            )
            
            # Attach PDF
            email_message.attach(
                f'receipt_{payment_id[:8]}.pdf',
                pdf_content,
                'application/pdf'
            )
            
            # Send email
            try:
                email_message.send(fail_silently=False)
                
                return JsonResponse({
                    'success': True,
                    'message': 'Receipt sent successfully'
                })
                
            except Exception as email_error:
                print(f"Email sending error: {str(email_error)}")
                return JsonResponse({
                    'success': False,
                    'error': 'Failed to send email. Please check your email configuration.'
                }, status=500)
            
        except json.JSONDecodeError:
            return JsonResponse({
                'success': False,
                'error': 'Invalid JSON data'
            }, status=400)
        except Exception as e:
            print(f"Email receipt error: {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)
    
    return JsonResponse({'error': 'Invalid request method'}, status=405)
