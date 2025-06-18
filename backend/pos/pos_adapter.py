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
    def create(self, order_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new order in the POS system.
        
        Args:
            order_data: Dictionary containing order details.
            
        Returns:
            Dict: Response from the POS system with order details.
        """
        pass
        
    @abstractmethod
    def get(self, order_id: str) -> Dict[str, Any]:
        """
        Retrieve a specific order from the POS system.
        
        Args:
            order_id: The ID of the order to retrieve.
            
        Returns:
            Dict: Order details from the POS system.
        """
        pass
        
    @abstractmethod
    def search(self, **kwargs) -> Dict[str, Any]:
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
    
    @abstractmethod
    def get_catalog(self) -> Dict[str, Any]:
        """
        Fetch catalog items and categories from the POS system.
        
        Returns:
            Dict: Catalog data including items and categories or error details.
        """
        pass
        
    @abstractmethod
    def get_inventory(self, catalog_object_id: str, location_ids: Optional[List[str]] = None, cursor: Optional[str] = None) -> Dict[str, Any]:
        """
        Get inventory counts for a specific catalog object.
        
        Args:
            catalog_object_id: The ID of the catalog object to retrieve inventory for.
            location_ids: Optional list of location IDs to filter by.
            cursor: Optional pagination cursor for retrieving additional results.
            
        Returns:
            Dict: Response with inventory counts or error details.
        """
        pass
        
    @abstractmethod
    def batch_retrieve_inventory_counts(self, catalog_object_ids: List[str], location_ids: Optional[List[str]] = None, cursor: Optional[str] = None) -> Dict[str, Any]:
        """
        Batch retrieve inventory counts for multiple catalog objects.
        
        Args:
            catalog_object_ids: List of catalog object IDs to retrieve inventory for.
            location_ids: Optional list of location IDs to filter by.
            cursor: Optional pagination cursor for retrieving additional results.
            
        Returns:
            Dict: Response with inventory counts or error details.
        """
        pass
        
    @abstractmethod
    def batch_create_changes(self, idempotency_key: str, changes: List[Dict[str, Any]], ignore_unchanged_counts: Optional[bool] = None) -> Dict[str, Any]:
        """
        Batch create inventory changes.
        
        Args:
            idempotency_key: Unique key to prevent duplicate processing.
            changes: List of inventory changes to apply.
            ignore_unchanged_counts: Optional flag to ignore unchanged counts.
            
        Returns:
            Dict: Response with created changes or error details.
        """
        pass
        
    @abstractmethod
    def update_order_to_paid(self, order_id: str, amount: int, tip_amount: int = 0, source: str = "stripe") -> Dict[str, Any]:
        """
        Update an order to 'COMPLETED' state and create an external payment record.
        This should be called after successful payment processing to mark the order as paid.
        
        Args:
            order_id: The order ID to update
            amount: Payment amount in smallest currency unit (cents for GBP) 
            tip_amount: Tip amount in smallest currency unit (default: 0)
            source: Name of the external payment source (default: "stripe")
            
        Returns:
            Dict: Update result including updated order details or error information
        """
        pass
