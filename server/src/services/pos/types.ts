// Define the standard receipt interface that all POS systems will map to
export interface Receipt {
  id: string;
  tableId: string;
  restaurantId: string;
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  total: number;
  gratuity?: number;
  status: 'open' | 'closed' | 'paid';
  createdAt: Date;
  updatedAt: Date;
}

// Interface for receipt items
export interface ReceiptItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  modifiers?: ReceiptItemModifier[];
}

// Interface for item modifiers
export interface ReceiptItemModifier {
  id: string;
  name: string;
  price: number;
}

// Define the supported POS providers
export enum POSProvider {
  SQUARE = 'square',
  TOAST = 'toast',
  MICROS = 'micros',
  FOODICS = 'foodics',
  LOYVERSE = 'loyverse'
  // Add more as needed
}

// Interface that all POS adapters will implement
export interface POSAdapter {
  getReceiptForTable(tableId: string, restaurantId: string): Promise<Receipt>;
}

// Restaurant configuration for POS
export interface RestaurantPOSConfig {
  restaurantId: string;
  posProvider: POSProvider;
  apiCredentials: Record<string, string>;
}