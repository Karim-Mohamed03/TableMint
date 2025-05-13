from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Any


class POSAdapter(ABC):
    """
    Abstract base class for Point of Sale (POS) system adapters.
    
    This interface defines common operations that all POS adapters must implement,
    allowing the service layer to work with any POS system without knowing
    implementation details.
    """
    
    @abstractmethod
    def authenticate(self) -> bool:
        """
        Authenticate with the POS system.
        
        Returns:
            bool: True if authentication is successful, False otherwise.
        """
        pass
        
    @abstractmethod
    def create_order(self, order_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new order in the POS system.
        
        Args:
            order_data: Dictionary containing order details.
            
        Returns:
            Dict: Response from the POS system with order details.
        """
        pass
        
    @abstractmethod
    def retrieve_order(self, order_id: str) -> Dict[str, Any]:
        """
        Retrieve a specific order from the POS system.
        
        Args:
            order_id: The ID of the order to retrieve.
            
        Returns:
            Dict: Order details from the POS system.
        """
        pass
        
    @abstractmethod
    def search_orders(self, **kwargs) -> Dict[str, Any]:
        """
        Search for orders in the POS system based on provided criteria.
        
        Args:
            **kwargs: Search parameters specific to the POS system.
            
        Returns:
            Dict: Search results containing matching orders.
        """
        pass
        
    @abstractmethod
    def add_item_to_order(self, order_id: str, item_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Add an item to an existing order.
        
        Args:
            order_id: The ID of the order to modify.
            item_data: Dictionary containing item details.
            
        Returns:
            Dict: Updated order details.
        """
        pass
        
    @abstractmethod
    def process_payment(self, payment_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process a payment for an order.
        
        Args:
            payment_data: Dictionary containing payment details.
            
        Returns:
            Dict: Payment processing result.
        """
        pass
        
    @abstractmethod
    def get_all_orders(self) -> Dict[str, Any]:
        """
        Fetch all orders from the POS system without filtering.
        
        Returns:
            Dict: All orders or error details.
        """
        pass
        
    @abstractmethod
    def list_locations(self) -> Dict[str, Any]:
        """
        List all locations available for this POS account.
        
        Returns:
            Dict: Location information or error details.
        """
        pass
