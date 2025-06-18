#!/usr/bin/env python3
"""
Test script to create orders in Square and verify they are created successfully.
This will help determine if order creation is working properly.
"""

import os
import sys
import json
import requests
from datetime import datetime
from pprint import pprint

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'qlub_backend.settings')

import django
django.setup()

from restaurants.models import Restaurant
from pos.pos_service import POSService

def test_order_creation():
    """Test creating orders in Square"""
    print("=" * 60)
    print("TESTING SQUARE ORDER CREATION")
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
        
        # Test 1: Create a simple test order
        print("\n" + "=" * 40)
        print("TEST 1: Create Simple Test Order")
        print("=" * 40)
        
        # Create test order data similar to what the frontend sends
        test_order_data = {
            "line_items": [
                {
                    "quantity": "2",
                    "catalog_object_id": "test-item-1",
                    "name": "Test Burger",
                    "base_price_money": {
                        "amount": 1299,  # $12.99
                        "currency": "USD"
                    }
                },
                {
                    "quantity": "1", 
                    "catalog_object_id": "test-item-2",
                    "name": "Test Fries",
                    "base_price_money": {
                        "amount": 499,  # $4.99
                        "currency": "USD"
                    }
                }
            ],
            "idempotency_key": f"test-order-{datetime.now().strftime('%Y%m%d-%H%M%S')}-{datetime.now().microsecond}",
            "restaurant_id": str(restaurant.id)
        }
        
        print("Creating order with data:")
        pprint(test_order_data)
        
        # Create the order
        result = pos_service.create(test_order_data)
        
        print(f"\n📋 Order Creation Result:")
        if result.get('success'):
            order = result.get('order', {})
            order_id = order.get('id', 'N/A')
            
            print(f"✅ Order created successfully!")
            print(f"   Order ID: {order_id}")
            print(f"   State: {order.get('state', 'N/A')}")
            print(f"   Source: {order.get('source', {}).get('name', 'N/A')}")
            print(f"   Created At: {order.get('created_at', 'N/A')}")
            print(f"   Location ID: {order.get('location_id', 'N/A')}")
            
            # Show line items
            line_items = order.get('line_items', [])
            if line_items:
                print(f"   Line Items ({len(line_items)}):")
                for item in line_items:
                    name = item.get('name', 'Unknown')
                    quantity = item.get('quantity', '0')
                    total_money = item.get('total_money', {})
                    amount = total_money.get('amount', 0)
                    currency = total_money.get('currency', 'USD')
                    print(f"     - {quantity}x {name}: ${amount/100:.2f} {currency}")
            
            # Show total
            total_money = order.get('total_money', {})
            if total_money:
                amount = total_money.get('amount', 0)
                currency = total_money.get('currency', 'USD')
                print(f"   Total: ${amount/100:.2f} {currency}")
            
            # Test 2: Try to retrieve the created order
            print("\n" + "=" * 40)
            print("TEST 2: Retrieve Created Order")
            print("=" * 40)
            
            if order_id and order_id != 'N/A':
                print(f"Attempting to retrieve order: {order_id}")
                
                get_result = pos_service.get(order_id=order_id)
                
                if get_result.get('success') or hasattr(get_result, 'order'):
                    print("✅ Successfully retrieved the created order!")
                    retrieved_order = get_result.get('order') if get_result.get('success') else get_result.order
                    
                    if hasattr(retrieved_order, '__dict__'):
                        retrieved_order = vars(retrieved_order)
                    
                    print(f"   Retrieved Order ID: {retrieved_order.get('id', 'N/A')}")
                    print(f"   Retrieved State: {retrieved_order.get('state', 'N/A')}")
                else:
                    print(f"❌ Failed to retrieve order: {get_result.get('error', 'Unknown error')}")
            
            # Test 3: Check if it appears in order search
            print("\n" + "=" * 40)
            print("TEST 3: Search for Created Order")
            print("=" * 40)
            
            try:
                # Search for recent orders to see if our order appears
                search_params = {
                    'location_ids': [restaurant.location_id] if restaurant.location_id else None,
                    'limit': 10,
                    'sort_field': 'CREATED_AT',
                    'sort_order': 'DESC'
                }
                
                search_params = {k: v for k, v in search_params.items() if v is not None}
                
                search_result = pos_service.search(**search_params)
                
                if search_result.get('success'):
                    orders = search_result.get('orders', [])
                    print(f"✅ Found {len(orders)} recent orders")
                    
                    # Check if our order is in the results
                    found_our_order = False
                    for search_order in orders:
                        if search_order.get('id') == order_id:
                            found_our_order = True
                            print(f"✅ Found our created order in search results!")
                            break
                    
                    if not found_our_order:
                        print(f"⚠️  Our order {order_id} was not found in recent orders search")
                        print("   This might be due to permissions or timing")
                
                else:
                    print(f"❌ Search failed: {search_result.get('error', 'Unknown error')}")
                    
            except Exception as search_error:
                print(f"⚠️  Search test failed: {str(search_error)}")
                print("   This might be due to permissions issues")
            
            return order_id
            
        else:
            print(f"❌ Order creation failed!")
            error = result.get('error', 'Unknown error')
            print(f"   Error: {error}")
            
            # Try to get more details about the error
            if isinstance(error, dict):
                print("   Error details:")
                pprint(error)
            
            return None
    
    except Exception as e:
        print(f"❌ Error during order creation test: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

def test_order_with_catalog_items():
    """Test creating an order with actual catalog items from Square"""
    print("\n" + "=" * 60)
    print("TESTING ORDER CREATION WITH REAL CATALOG ITEMS")
    print("=" * 60)
    
    try:
        restaurant = Restaurant.objects.filter(is_connected=True, access_token__isnull=False).first()
        if not restaurant:
            print("❌ No connected restaurants found!")
            return
        
        pos_service = POSService.for_restaurant(restaurant_id=str(restaurant.id))
        
        if not pos_service.is_authenticated():
            print("❌ Failed to authenticate")
            return
        
        # First, get catalog items
        print("📋 Fetching catalog items...")
        catalog_result = pos_service.get_catalog()
        
        if not catalog_result.get('success'):
            print(f"❌ Failed to get catalog: {catalog_result.get('error', 'Unknown error')}")
            return
        
        catalog_objects = catalog_result.get('objects', [])
        items = [obj for obj in catalog_objects if obj.get('type') == 'ITEM']
        
        if not items:
            print("❌ No catalog items found")
            return
        
        print(f"✅ Found {len(items)} catalog items")
        
        # Use the first item for testing
        test_item = items[0]
        item_variations = test_item.get('item_data', {}).get('variations', [])
        
        if not item_variations:
            print("❌ Test item has no variations")
            return
        
        test_variation = item_variations[0]
        variation_id = test_variation.get('id')
        item_name = test_item.get('item_data', {}).get('name', 'Unknown Item')
        
        print(f"📦 Using catalog item: {item_name}")
        print(f"   Item ID: {test_item.get('id')}")
        print(f"   Variation ID: {variation_id}")
        
        # Create order with real catalog item
        catalog_order_data = {
            "line_items": [
                {
                    "quantity": "1",
                    "catalog_object_id": variation_id,
                    "name": item_name
                }
            ],
            "idempotency_key": f"catalog-test-{datetime.now().strftime('%Y%m%d-%H%M%S')}-{datetime.now().microsecond}",
            "restaurant_id": str(restaurant.id)
        }
        
        print("\nCreating order with catalog item:")
        pprint(catalog_order_data)
        
        result = pos_service.create(catalog_order_data)
        
        if result.get('success'):
            order = result.get('order', {})
            order_id = order.get('id', 'N/A')
            
            print(f"✅ Catalog order created successfully!")
            print(f"   Order ID: {order_id}")
            print(f"   State: {order.get('state', 'N/A')}")
            
            return order_id
        else:
            print(f"❌ Catalog order creation failed: {result.get('error', 'Unknown error')}")
            return None
    
    except Exception as e:
        print(f"❌ Error during catalog order test: {str(e)}")
        return None

def test_minimal_order():
    """Test creating the most minimal order possible"""
    print("\n" + "=" * 60)
    print("TESTING MINIMAL ORDER CREATION")
    print("=" * 60)
    
    try:
        restaurant = Restaurant.objects.filter(is_connected=True, access_token__isnull=False).first()
        if not restaurant:
            print("❌ No connected restaurants found!")
            return
        
        pos_service = POSService.for_restaurant(restaurant_id=str(restaurant.id))
        
        if not pos_service.is_authenticated():
            print("❌ Failed to authenticate")
            return
        
        # Create the most minimal order possible
        minimal_order_data = {
            "line_items": [
                {
                    "quantity": "1",
                    "name": "Test Item",
                    "base_price_money": {
                        "amount": 100,  # $1.00
                        "currency": "USD"
                    }
                }
            ],
            "idempotency_key": f"minimal-{datetime.now().strftime('%Y%m%d-%H%M%S')}-{datetime.now().microsecond}"
        }
        
        print("Creating minimal order:")
        pprint(minimal_order_data)
        
        result = pos_service.create(minimal_order_data)
        
        if result.get('success'):
            order = result.get('order', {})
            order_id = order.get('id', 'N/A')
            
            print(f"✅ Minimal order created successfully!")
            print(f"   Order ID: {order_id}")
            
            return order_id
        else:
            print(f"❌ Minimal order creation failed: {result.get('error', 'Unknown error')}")
            return None
    
    except Exception as e:
        print(f"❌ Error during minimal order test: {str(e)}")
        return None

if __name__ == "__main__":
    print("🧪 TESTING ORDER CREATION FUNCTIONALITY")
    print("=" * 60)
    
    # Test 1: Regular order creation
    order_id_1 = test_order_creation()
    
    # Test 2: Order with catalog items
    order_id_2 = test_order_with_catalog_items()
    
    # Test 3: Minimal order
    order_id_3 = test_minimal_order()
    
    # Summary
    print("\n" + "=" * 60)
    print("FINAL SUMMARY")
    print("=" * 60)
    
    created_orders = []
    if order_id_1:
        created_orders.append(order_id_1)
    if order_id_2:
        created_orders.append(order_id_2)
    if order_id_3:
        created_orders.append(order_id_3)
    
    if created_orders:
        print(f"✅ Successfully created {len(created_orders)} orders:")
        for i, order_id in enumerate(created_orders, 1):
            print(f"   {i}. {order_id}")
        
        print("\n💡 NEXT STEPS:")
        print("1. Check if these orders appear in the Square dashboard")
        print("2. Look in 'Orders' section of Square Dashboard")
        print("3. Check different order states (Open, Completed, etc.)")
        print("4. Verify the location filter in Square Dashboard")
        
        print(f"\n📋 Order IDs to search for in Square Dashboard:")
        for order_id in created_orders:
            print(f"   - {order_id}")
    
    else:
        print("❌ No orders were successfully created")
        print("\n🔍 DEBUGGING STEPS:")
        print("1. Check authentication credentials")
        print("2. Verify location permissions")
        print("3. Check Square account settings")
        print("4. Review error messages above")