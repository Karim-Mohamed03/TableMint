"""
POS (Point of Sale) integration package.

This package implements the Adapter design pattern to provide a unified interface
for interacting with different POS systems like Square and Clover.
"""

from .pos_adapter import POSAdapter
from .square_adapter import SquareAdapter
from .clover_adapter import CloverAdapter
from .pos_factory import POSFactory
from .pos_service import POSService

__all__ = [
    'POSAdapter',
    'SquareAdapter',
    'CloverAdapter',
    'POSFactory',
    'POSService',
]
