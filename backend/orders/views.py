from django.shortcuts import render

# Create your views here.
from django.http import JsonResponse
from .square_client import square_client, location_id

def get_table_order(request, table_id):
    # You’ll need logic to map table_id to Square's order or ticket reference
    try:
        result = square_client.orders.search_orders(
            body={
                "location_ids": [location_id],
                "query": {
                    "filter": {
                        "source_filter": {
                            "source_names": [f"table_{table_id}"]
                        }
                    }
                }
            }
        )

        if result.is_success():
            orders = result.body.get("orders", [])
            return JsonResponse({"orders": orders})
        else:
            return JsonResponse({"error": result.errors}, status=400)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
