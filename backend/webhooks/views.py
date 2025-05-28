import logging
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from .integration_handlers import SquareWebhookHandler, CloverWebhookHandler


logger = logging.getLogger(__name__)

@csrf_exempt
@require_POST
@api_view(['POST'])
def square_webhook(request):
    """Endpoint for Square webhooks"""
    handler = SquareWebhookHandler()
    success, message = handler.handle_webhook(request)
    
    if success:
        return JsonResponse({"status": "success", "message": message}, status=200)
    else:
        return JsonResponse({"status": "error", "message": message}, status=400)


@csrf_exempt
@require_POST
@api_view(['POST'])
@permission_classes([AllowAny])
def clover_webhook(request):
    logger.info("Received Clover webhook")

    print(request.body)
    success = True
    message = "Clover webhook processed successfully"
    # """Endpoint for Clover webhooks"""
    # handler = CloverWebhookHandler()
    # success, message = handler.handle_webhook(request)
    
    if success:
        return JsonResponse({"status": "success", "message": message}, status=200)
    else:
        return JsonResponse({"status": "error", "message": message}, status=400)