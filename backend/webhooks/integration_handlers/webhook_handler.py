from abc import ABC, abstractmethod
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

class WebhookHandler(ABC):
    """Base abstract class for all webhook handlers"""
    
    @abstractmethod
    def validate_request(self, request):
        """Validate incoming webhook request"""
        pass
    
    @abstractmethod
    def process_event(self, event_type: str, payload: Dict[str, Any]):
        """Process the webhook event based on event type"""
        pass
    
    def handle_webhook(self, request):
        """Common webhook handling logic"""
        try:
            # Validate request first
            if not self.validate_request(request):
                return False, "Invalid webhook request"
            
            # Extract event data
            payload = self.parse_payload(request)
            event_type = self.get_event_type(payload)
            
            # Process the event
            success = self.process_event(event_type, payload)
            
            return success, "Webhook processed successfully" if success else "Failed to process webhook"
        except Exception as e:
            logger.exception(f"Error handling webhook: {str(e)}")
            return False, f"Error: {str(e)}"
    
    def parse_payload(self, request):
        """Default payload parsing method"""
        logger.debug(f"Parsing payload from request: {request}")
        return request.body if hasattr(request, 'body') else request.POST
        
    def get_event_type(self, payload):
        """Default method to extract event type from payload"""
        return payload.get('event_type')