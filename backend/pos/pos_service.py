from typing import Dict, List, Optional, Any

from .pos_adapter import POSAdapter
from .pos_factory import POSFactory


class POSService:
    """
    Service layer for interacting with POS systems.
    
    This service uses dependency injection to work with any POS adapter,
    allowing the application to switch between different POS systems without
    changing the service implementation.
    """
    
    def __init__(self, adapter: Optional[POSAdapter] = None, pos_type: Optional[str] = None):
        """
        Initialize the POS service with a specific adapter.
        
        Args:
            adapter: A concrete POSAdapter implementation. If None, one will be created
                    using the POSFactory based on the pos_type or environment configuration.
            pos_type: The type of POS adapter to create if adapter is None.
        """
        if adapter:
            self.adapter = adapter
        else:
            self.adapter = POSFactory.create_adapter(pos_type)
            
    def create(self, order_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new order in the POS system.
        
        Args:
            order_data: Dictionary containing order details.
            
        Returns:
            Dict: Response from the POS system with order details.
        """
        return self.adapter.create(order_data)
        
    def retrieve(self, order_id: str) -> Dict[str, Any]:
        """
        Retrieve a specific order from the POS system.
        
        Args:
            order_id: The ID of the order to retrieve.
            
        Returns:
            Dict: Order details from the POS system.
        """
        return self.adapter.retrieve_order(order_id)
        
    def search_orders(self, **kwargs) -> Dict[str, Any]:
        """
        Search for orders in the POS system based on provided criteria.
        
        Args:
            **kwargs: Search parameters for the POS system.
            
        Returns:
            Dict: Search results containing matching orders.
        """
        return self.adapter.search_orders(**kwargs)
        
    def add_item_to_order(self, order_id: str, item_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Add an item to an existing order.
        
        Args:
            order_id: The ID of the order to modify.
            item_data: Dictionary containing item details.
            
        Returns:
            Dict: Updated order details.
        """
        return self.adapter.add_item_to_order(order_id, item_data)
        
    def process_payment(self, payment_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process a payment for an order.
        
        Args:
            payment_data: Dictionary containing payment details.
            
        Returns:
            Dict: Payment processing result.
        """
        return self.adapter.process_payment(payment_data)
        
    def is_authenticated(self) -> bool:
        """
        Check if the adapter is properly authenticated with the POS system.
        
        Returns:
            bool: True if authenticated, False otherwise.
        """
        return self.adapter.authenticate()
        
    def get_all_orders(self) -> Dict[str, Any]:
        """
        Fetch all orders from the POS system without filtering.
        
        Returns:
            Dict: All orders or error details.
        """
        return self.adapter.get_all_orders()
        
    def list_locations(self) -> Dict[str, Any]:
        """
        List all locations available for this POS account.
        
        Returns:
            Dict: Location information or error details.
        """
        return self.adapter.list_locations()
