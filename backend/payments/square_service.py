import uuid
import os
from typing import Dict, Optional, Any, List
from pathlib import Path

from dotenv import load_dotenv
from square import Square
from square.environment import SquareEnvironment

# Get the base directory (backend folder)
BASE_DIR = Path(__file__).resolve().parent.parent

# Load .env from the backend directory
load_dotenv(os.path.join(BASE_DIR, '.env'))


class SquarePaymentService:
    """Service for handling Square payment and order operations."""

    def __init__(self):
        # Initialize Square client with access token from .env file
        self.client = Square(
            token=os.environ.get('SQUARE_ACCESS_TOKEN'),
            environment=SquareEnvironment.SANDBOX
        )

    def create(
        self,
        source_id: str,
        amount: int,
        currency: str = "GBP",
        idempotency_key: Optional[str] = None,
        customer_id: Optional[str] = None,
        location_id: Optional[str] = None,
        reference_id: Optional[str] = None,
        note: Optional[str] = None,
        app_fee_amount: Optional[int] = None,
        autocomplete: bool = True,
    ) -> Dict[str, Any]:
        # Generate idempotency key if not provided
        if not idempotency_key:
            idempotency_key = str(uuid.uuid4())

        # Build the payload for payment creation
        payment_body: Dict[str, Any] = {
            "idempotency_key": idempotency_key,
            "amount_money": {"amount": amount, "currency": currency},
            "source_id": source_id,
            "autocomplete": autocomplete
        }

        # Optional fields
        if customer_id:
            payment_body["customer_id"] = customer_id
        if location_id:
            payment_body["location_id"] = location_id
        elif os.getenv('SQUARE_LOCATION_ID'):
            payment_body["location_id"] = os.getenv('SQUARE_LOCATION_ID')
        if reference_id:
            payment_body["reference_id"] = reference_id
        if note:
            payment_body["note"] = note
        if app_fee_amount is not None:
            payment_body["app_fee_money"] = {"amount": app_fee_amount, "currency": currency}

        try:
            # Call the Square Payments API
            result = self.client.payments.create(**payment_body)

            # Format the response
            response: Dict[str, Any] = {}
            if hasattr(result, 'payment'):
                response['payment'] = (
                    result.payment.dict() if hasattr(result.payment, 'dict') else result.payment
                )
            else:
                response = result

            return response

        except Exception as e:
            raise Exception(f"Failed to create payment: {e}")

    def search_orders(
        self,
        location_ids: List[str],
        closed_at_start: Optional[str] = None,
        closed_at_end: Optional[str] = None,
        states: Optional[List[str]] = None,
        customer_ids: Optional[List[str]] = None,
        sort_field: str = "CLOSED_AT",
        sort_order: str = "DESC",
        limit: int = 20,
        cursor: Optional[str] = None,
        return_entries: bool = True
    ) -> Dict[str, Any]:
        """
        Searches for orders using Square's Orders API.

        Must provide at least one location_id.

        Args:
            location_ids: List of Square location IDs to filter by.
            closed_at_start: ISO-8601 datetime string to filter orders closed after this time.
            closed_at_end: ISO-8601 datetime string to filter orders closed before this time.
            states: List of order state strings (e.g., ["COMPLETED"]).
            customer_ids: List of Square customer IDs to filter by.
            sort_field: Field to sort by (default: "CLOSED_AT").
            sort_order: "ASC" or "DESC" (default: "DESC").
            limit: Maximum number of records to return per page (1-1000).
            cursor: Pagination cursor from a previous response.
            return_entries: If True, returns "order_entries"; if False, returns "orders".

        Returns:
            A dict containing keys: "order_entries" or "orders", "cursor", and optional "errors".
        """
        # Build the filter and sort query
        query: Dict[str, Any] = {"filter": {}, "sort": {"sort_field": sort_field, "sort_order": sort_order}}

        if closed_at_start or closed_at_end:
            date_filter: Dict[str, Any] = {"closed_at": {}}
            if closed_at_start:
                date_filter["closed_at"]["start_at"] = closed_at_start
            if closed_at_end:
                date_filter["closed_at"]["end_at"] = closed_at_end
            query["filter"]["date_time_filter"] = date_filter

        if states:
            query["filter"]["state_filter"] = {"states": states}

        if customer_ids:
            query["filter"]["customer_filter"] = {"customer_ids": customer_ids}

        # Construct request body
        search_body: Dict[str, Any] = {
            "location_ids": location_ids,
            "query": query,
            "limit": limit,
            "return_entries": return_entries
        }
        if cursor:
            search_body["cursor"] = cursor

        try:
            result = self.client.orders.search(**search_body)
            # Prepare JSON-serializable response
            response: Dict[str, Any] = {}
            if return_entries and hasattr(result, 'order_entries'):
                response["order_entries"] = [
                    entry.dict() if hasattr(entry, 'dict') else entry
                    for entry in result.order_entries
                ]
            if not return_entries and hasattr(result, 'orders'):
                response["orders"] = [
                    order.dict() if hasattr(order, 'dict') else order
                    for order in result.orders
                ]
            if hasattr(result, 'cursor') and result.cursor:
                response["cursor"] = result.cursor
            if hasattr(result, 'errors') and result.errors:
                response["errors"] = [
                    error.dict() if hasattr(error, 'dict') else error
                    for error in result.errors
                ]
            return response

        except Exception as e:
            raise Exception(f"Failed to search orders: {e}")
