# Shared Cart Functionality Documentation

## Overview
The shared cart functionality allows users to split their bill and share payment links for remaining items. When someone clicks "Pay for specific items" and selects items to pay for themselves, they can generate a shareable link for the remaining unpaid items.

## How It Works

### 1. Cart Split Bill Flow
1. User goes to cart page (`/cart`)
2. User clicks "Split the bill" or "Pay for specific items"
3. In "Pay for specific items" modal:
   - User selects which items they want to pay for
   - User can adjust quantities for each selected item
   - User chooses between "Pay Only" or "Pay & Share"

### 2. Pay & Share Option
When user clicks "Pay & Share":
1. System calculates remaining items (items not selected or partially selected)
2. Shows ShareRemainingItems component with:
   - List of remaining items and quantities
   - Generated shareable link
   - Sharing options (WhatsApp, Email, Generic share)
   - Copy to clipboard functionality

### 3. Shareable Link Format
```
https://yourdomain.com/shared-cart?data=<encoded_data>
```

The encoded data contains:
```json
{
  "shareId": "unique_identifier",
  "remainingItems": [
    {
      "id": "item_id",
      "name": "Item Name",
      "price": 12.99,
      "quantity": 2,
      "options": "Size: Large",
      "description": "Item description"
    }
  ]
}
```

### 4. Shared Cart Page (`/shared-cart`)
When someone clicks the shared link:
1. Page parses the URL parameters to extract remaining items
2. Displays all remaining items with selection interface
3. User can:
   - Select which items they want to pay for
   - Adjust quantities (within available limits)
   - See total price for selected items
   - Add selected items to their cart and proceed to payment

### 5. Payment Flow
1. Selected items are added to the user's cart
2. User is redirected to `/cart` page
3. Normal payment process continues with Stripe integration

## Components

### CartItemSelectionModal
- Located: `/src/pages/components/CartItemSelectionModal.js`
- Purpose: Allows users to select specific items to pay for
- Features:
  - Item selection with quantity controls
  - "Pay Only" vs "Pay & Share" options
  - Integration with ShareRemainingItems component

### ShareRemainingItems
- Located: Inside `CartItemSelectionModal.js`
- Purpose: Generates and shares payment links for remaining items
- Features:
  - Payment link generation
  - WhatsApp, Email, and generic sharing
  - Copy to clipboard functionality
  - Remaining items summary

### SharedCartPage
- Located: `/src/pages/SharedCartPage.js`
- Purpose: Handles incoming shared payment links
- Features:
  - URL parameter parsing
  - Item selection interface
  - Quantity adjustment within available limits
  - Cart integration for payment

## URL Routes
- `/cart` - Main cart page with split bill options
- `/shared-cart?data=<encoded_data>` - Shared cart page for remaining items

## Backend Integration
Currently uses frontend-only implementation with URL parameters. For production, consider:
1. Creating backend endpoint to store share sessions
2. Using shorter, more secure share IDs
3. Adding expiration dates for shared links
4. Tracking payment status to prevent double-payment

## Usage Example

1. **User A** adds items to cart: 2x Pizza (£12 each), 1x Drink (£3)
2. **User A** clicks "Pay for specific items"
3. **User A** selects 1x Pizza (£12) to pay for themselves
4. **User A** clicks "Pay & Share"
5. **User A** shares link via WhatsApp: "There are remaining items worth £15.00 to pay for"
6. **User B** clicks the link and sees: 1x Pizza (£12), 1x Drink (£3)
7. **User B** selects both items and clicks "Add to Cart & Pay"
8. **User B** is redirected to cart page with selected items and completes payment

## Error Handling
- Invalid or missing URL parameters show error message
- Empty shared carts redirect to menu
- Loading states during data parsing
- Graceful fallback to main menu if errors occur

## Future Enhancements
1. Real-time synchronization of paid items
2. Multiple share sessions per order
3. Item-level payment tracking
4. Integration with restaurant POS systems
5. Push notifications for payment updates
