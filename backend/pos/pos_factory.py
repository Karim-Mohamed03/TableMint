import os
from typing import Dict, Any

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
    def create_adapter(pos_type: str = None) -> POSAdapter:
        """
        Create and return a POS adapter based on the specified type.
        
        If no type is specified, it will use the POS_TYPE from environment variables.
        
        Args:
            pos_type: The type of POS adapter to create ('square' or 'clover').
                      If None, uses the POS_TYPE from environment variables.
            
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
            return SquareAdapter()
        elif pos_type == 'clover':
            return CloverAdapter()
        else:
            raise ValueError(f"Unsupported POS type: {pos_type}")
            
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
