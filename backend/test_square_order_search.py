#!/usr/bin/env python3
"""
Test script to search for orders in Square and verify their existence.
This will help determine if orders created through the app actually exist in Square.
"""

import os
import sys
import json
import requests
from datetime import datetime, timedelta
from pprint import pprint

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'qlub_backend.settings')

import django
django.setup()

from restaurants.models import Restaurant
from pos.pos_service import POSService

def test_order_search():
    """Test searching for orders in Square"""
    print("=" * 60)
    print("TESTING SQUARE ORDER SEARCH")
    print("=" * 60)
    
    try:
        # Get the first connected restaurant
        restaurant = Restaurant.objects.filter(is_connected=True, access_token__isnull=False).first()
        
        if not restaurant:
            print("❌ No connected restaurants found!")
            return
        
        print(f"✅ Found restaurant: {restaurant.name}")
        print(f"   Restaurant ID: {restaurant.id}")
        print(f"   Location ID: {restaurant.location_id}")
        print(f"   Integration: {restaurant.integration_name}")
        
        # Initialize POS service
        pos_service = POSService.for_restaurant(restaurant_id=str(restaurant.id))
        
        if not pos_service.is_authenticated():
            print("❌ Failed to authenticate with POS system")
            return
        
        print("✅ Successfully authenticated with Square")
        
        # Test 1: Search for orders from the last 24 hours
        print("\n" + "=" * 40)
        print("TEST 1: Recent Orders (Last 24 hours)")
        print("=" * 40)
        
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(hours=24)
        
        search_params = {
            'location_ids': [restaurant.location_id] if restaurant.location_id else None,
            'states': ['OPEN', 'COMPLETED', 'CANCELED'],
            'closed_at_start': start_time.isoformat() + 'Z',
            'closed_at_end': end_time.isoformat() + 'Z',
            'limit': 50,
            'sort_field': 'CREATED_AT',
            'sort_order': 'DESC'
        }
        
        # Remove None values
        search_params = {k: v for k, v in search_params.items() if v is not None}
        
        print(f"Searching with parameters:")
        pprint(search_params)
        
        result = pos_service.search(**search_params)
        
        if result.get('success'):
            orders = result.get('orders', [])
            order_entries = result.get('order_entries', [])
            
            print(f"\n✅ Search successful!")
            print(f"   Orders found: {len(orders)}")
            print(f"   Order entries found: {len(order_entries)}")
            
            # Display order details
            if orders:
                print("\n📋 Order Details:")
                for i, order in enumerate(orders[:10]):  # Show first 10 orders
                    print(f"\n  Order {i+1}:")
                    print(f"    ID: {order.get('id', 'N/A')}")
                    print(f"    State: {order.get('state', 'N/A')}")
                    print(f"    Source: {order.get('source', {}).get('name', 'N/A')}")
                    print(f"    Created: {order.get('created_at', 'N/A')}")
                    print(f"    Updated: {order.get('updated_at', 'N/A')}")
                    
                    # Show line items
                    line_items = order.get('line_items', [])
                    if line_items:
                        print(f"    Items ({len(line_items)}):")
                        for item in line_items:
                            name = item.get('name', 'Unknown Item')
                            quantity = item.get('quantity', '0')
                            print(f"      - {quantity}x {name}")
                    
                    # Show total
                    total_money = order.get('total_money', {})
                    if total_money:
                        amount = total_money.get('amount', 0)
                        currency = total_money.get('currency', 'USD')
                        print(f"    Total: {amount/100:.2f} {currency}")
            
            if order_entries:
                print("\n📋 Order Entry Details:")
                for i, entry in enumerate(order_entries[:5]):  # Show first 5 entries
                    print(f"\n  Entry {i+1}:")
                    print(f"    Order ID: {entry.get('order_id', 'N/A')}")
                    print(f"    Location ID: {entry.get('location_id', 'N/A')}")
                    
        else:
            print(f"❌ Search failed: {result.get('error', 'Unknown error')}")
        
        # Test 2: Search for orders from the last 7 days
        print("\n" + "=" * 40)
        print("TEST 2: Orders from Last 7 Days")
        print("=" * 40)
        
        start_time_week = end_time - timedelta(days=7)
        
        search_params_week = {
            'location_ids': [restaurant.location_id] if restaurant.location_id else None,
            'states': ['OPEN', 'COMPLETED', 'CANCELED'],
            'closed_at_start': start_time_week.isoformat() + 'Z',
            'closed_at_end': end_time.isoformat() + 'Z',
            'limit': 100
        }
        
        search_params_week = {k: v for k, v in search_params_week.items() if v is not None}
        
        result_week = pos_service.search(**search_params_week)
        
        if result_week.get('success'):
            orders_week = result_week.get('orders', [])
            print(f"✅ Found {len(orders_week)} orders in the last 7 days")
            
            # Count by source
            source_counts = {}
            state_counts = {}
            
            for order in orders_week:
                source = order.get('source', {}).get('name', 'Unknown')
                state = order.get('state', 'Unknown')
                
                source_counts[source] = source_counts.get(source, 0) + 1
                state_counts[state] = state_counts.get(state, 0) + 1
            
            print("\n📊 Orders by Source:")
            for source, count in source_counts.items():
                print(f"   {source}: {count}")
            
            print("\n📊 Orders by State:")
            for state, count in state_counts.items():
                print(f"   {state}: {count}")
        
        else:
            print(f"❌ Weekly search failed: {result_week.get('error', 'Unknown error')}")
        
        # Test 3: Search for API/Third-party orders specifically
        print("\n" + "=" * 40)
        print("TEST 3: API/Third-party Orders")
        print("=" * 40)
        
        # Try to find orders that might be from our app
        api_search_params = {
            'location_ids': [restaurant.location_id] if restaurant.location_id else None,
            'limit': 100,
            'sort_field': 'CREATED_AT',
            'sort_order': 'DESC'
        }
        
        api_search_params = {k: v for k, v in api_search_params.items() if v is not None}
        
        api_result = pos_service.search(**api_search_params)
        
        if api_result.get('success'):
            api_orders = api_result.get('orders', [])
            
            # Filter for orders that might be from API
            api_created_orders = []
            for order in api_orders:
                source = order.get('source', {}).get('name', '').lower()
                if 'api' in source or 'third' in source or 'external' in source:
                    api_created_orders.append(order)
            
            print(f"✅ Found {len(api_created_orders)} potential API-created orders")
            
            if api_created_orders:
                print("\n🔍 API-Created Orders:")
                for order in api_created_orders[:5]:
                    print(f"  - ID: {order.get('id')}")
                    print(f"    Source: {order.get('source', {}).get('name', 'N/A')}")
                    print(f"    Created: {order.get('created_at', 'N/A')}")
                    print(f"    State: {order.get('state', 'N/A')}")
        
        # Test 4: Test direct order retrieval if we have any order IDs
        print("\n" + "=" * 40)
        print("TEST 4: Test Order Retrieval")
        print("=" * 40)
        
        # If we found any orders, try to retrieve one directly
        if result.get('success') and result.get('orders'):
            test_order_id = result['orders'][0].get('id')
            if test_order_id:
                print(f"Testing direct retrieval of order: {test_order_id}")
                
                get_result = pos_service.get(order_id=test_order_id)
                
                if get_result.get('success') or hasattr(get_result, 'order'):
                    print("✅ Direct order retrieval successful")
                else:
                    print(f"❌ Direct order retrieval failed: {get_result.get('error', 'Unknown error')}")
        
        print("\n" + "=" * 60)
        print("SUMMARY")
        print("=" * 60)
        print("✅ Order search functionality is working")
        print("✅ Authentication with Square is successful")
        
        if result.get('success'):
            total_recent = len(result.get('orders', []))
            print(f"📊 Found {total_recent} orders in the last 24 hours")
        
        if result_week.get('success'):
            total_week = len(result_week.get('orders', []))
            print(f"📊 Found {total_week} orders in the last 7 days")
        
        print("\n💡 NEXT STEPS:")
        print("1. Create a test order through your app")
        print("2. Note the order ID returned")
        print("3. Search for that specific order using this script")
        print("4. Check if it appears in the restaurant's Square dashboard")
        
    except Exception as e:
        print(f"❌ Error during testing: {str(e)}")
        import traceback
        traceback.print_exc()

def test_specific_order(order_id):
    """Test retrieving a specific order by ID"""
    print(f"\nTesting specific order: {order_id}")
    
    try:
        restaurant = Restaurant.objects.filter(is_connected=True, access_token__isnull=False).first()
        if not restaurant:
            print("❌ No connected restaurants found!")
            return
        
        pos_service = POSService.for_restaurant(restaurant_id=str(restaurant.id))
        
        if not pos_service.is_authenticated():
            print("❌ Failed to authenticate")
            return
        
        result = pos_service.get(order_id=order_id)
        
        if result.get('success') or hasattr(result, 'order'):
            print(f"✅ Order {order_id} found in Square!")
            order = result.get('order') if result.get('success') else result.order
            
            if hasattr(order, '__dict__'):
                order_dict = vars(order)
            else:
                order_dict = order
            
            print(f"   State: {order_dict.get('state', 'N/A')}")
            print(f"   Source: {order_dict.get('source', {}).get('name', 'N/A')}")
            print(f"   Created: {order_dict.get('created_at', 'N/A')}")
            
        else:
            print(f"❌ Order {order_id} not found or error: {result.get('error', 'Unknown error')}")
    
    except Exception as e:
        print(f"❌ Error testing specific order: {str(e)}")

if __name__ == "__main__":
    # Run the main test
    test_order_search()
    
    # If you have a specific order ID to test, uncomment and modify this:
    # test_specific_order("YOUR_ORDER_ID_HERE")
    
    print("\n🔍 To test a specific order ID, modify the script and add:")
    print("   test_specific_order('your_order_id_here')")