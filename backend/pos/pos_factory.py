import os
from typing import Dict, Any, Optional
from .pos_adapter import POSAdapter
from .square_adapter import SquareAdapter
from .clover_adapter import CloverAdapter

class POSFactory:
    """
    Factory class for creating POS adapter instances.
    
    This factory determines which POS adapter to create based on configuration,
    allowing the application to work with different POS systems seamlessly.
    """
    
    @staticmethod
    def create_adapter(pos_type: str = None, restaurant_id: str = None, table_token: str = None) -> POSAdapter:
        """
        Create and return a POS adapter based on the specified type.
        
        If no type is specified, it will use the POS_TYPE from environment variables.
        
        Args:
            pos_type: The type of POS adapter to create ('square' or 'clover').
                      If None, uses the POS_TYPE from environment variables.
            restaurant_id: UUID of the restaurant to get credentials for
            table_token: Token of a table to look up restaurant through
            
        Returns:
            POSAdapter: An instance of a concrete POSAdapter implementation.
            
        Raises:
            ValueError: If the specified POS type is not supported.
        """
        # If no type provided, get from environment
        if pos_type is None:
            pos_type = os.environ.get('POS_TYPE', 'square').lower()
            
        # Create the appropriate adapter
        if pos_type == 'square':
            # Use restaurant-specific initialization if restaurant context is provided
            if restaurant_id or table_token:
                return SquareAdapter.from_restaurant_data(restaurant_id=restaurant_id, table_token=table_token)
            else:
                return SquareAdapter()
        elif pos_type == 'clover':
            return CloverAdapter()
        else:
            raise ValueError(f"Unsupported POS type: {pos_type}")

    @staticmethod
    def create_square_adapter_for_restaurant(restaurant_id: str = None, table_token: str = None) -> SquareAdapter:
        """
        Create a SquareAdapter specifically for a restaurant with its credentials.
        
        Args:
            restaurant_id: UUID of the restaurant
            table_token: Token of a table to look up restaurant through
            
        Returns:
            SquareAdapter: An instance configured with restaurant-specific credentials
        """
        return SquareAdapter.from_restaurant_data(restaurant_id=restaurant_id, table_token=table_token)
            
    @staticmethod
    def get_available_adapters() -> Dict[str, str]:
        """
        Get a list of available POS adapters.
        
        Returns:
            Dict: A dictionary mapping adapter types to their descriptions.
        """
        return {
            'square': 'Square POS System',
            'clover': 'Clover POS System'
        }
