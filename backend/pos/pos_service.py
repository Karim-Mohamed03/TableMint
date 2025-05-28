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
        
    def get(self, order_id: str) -> Dict[str, Any]:
        """
        Retrieve a specific order from the POS system.
        
        Args:
            order_id: The ID of the order to retrieve.
            
        Returns:
            Dict: Order details from the POS system.
        """
        return self.adapter.get(order_id)
        
    def search(self, **kwargs) -> Dict[str, Any]:
        """
        Search for orders in the POS system based on provided criteria.
        
        Args:
            **kwargs: Search parameters for the POS system.
            
        Returns:
            Dict: Search results containing matching orders.
        """
        return self.adapter.search(**kwargs)
        
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
        
    def get_catalog(self) -> Dict[str, Any]:
        """
        Fetch catalog items and categories from the POS system.
        
        Returns:
            Dict: Catalog data including items and categories or error details.
        """
        return self.adapter.get_catalog()
        
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
        return self.adapter.get_inventory(catalog_object_id=catalog_object_id, location_ids=location_ids, cursor=cursor)
        
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
        return self.adapter.batch_retrieve_inventory_counts(
            catalog_object_ids=catalog_object_ids, 
            location_ids=location_ids, 
            cursor=cursor
        )
        
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
        return self.adapter.batch_create_changes(
            idempotency_key=idempotency_key,
            changes=changes,
            ignore_unchanged_counts=ignore_unchanged_counts
        )
