import { POSProvider, Receipt, RestaurantPOSConfig } from './pos/types';
import { createPOSAdapter } from './pos/posFactory';

// In a real application, this would come from a database
// This is a mock for demonstration purposes
const restaurantPOSConfigs: Record<string, RestaurantPOSConfig> = {
  'rest-1': {
    restaurantId: 'rest-1',
    posProvider: POSProvider.SQUARE,
    apiCredentials: {
      apiKey: 'square-api-key-example',
    }
  },
  'rest-2': {
    restaurantId: 'rest-2',
    posProvider: POSProvider.TOAST,
    apiCredentials: {
      clientId: 'toast-client-id-example',
      clientSecret: 'toast-client-secret-example',
    }
  },
  'rest-3': {
    restaurantId: 'rest-3',
    posProvider: POSProvider.MICROS,
    apiCredentials: {
      apiEndpoint: 'https://micros-api.example.com',
      apiKey: 'micros-api-key-example',
      locationId: 'micros-location-id',
    }
  },
  'rest-4': {
    restaurantId: 'rest-4',
    posProvider: POSProvider.FOODICS,
    apiCredentials: {
      apiKey: 'foodics-api-key-example',
      businessId: 'foodics-business-id',
      apiBaseUrl: 'https://api.foodics.com/v5'
    }
  },
  'rest-5': {
    restaurantId: 'rest-5',
    posProvider: POSProvider.LOYVERSE,
    apiCredentials: {
      apiKey: 'loyverse-api-key-example',
      storeId: 'loyverse-store-id-example',
      apiBaseUrl: 'https://api.loyverse.com/v1.0'
    }
  }
};

/**
 * Main service to get receipt data for a table
 */
export class POSService {
  /**
   * Gets the restaurant POS configuration
   * In a real app, this would fetch from a database
   */
  private getRestaurantPOSConfig(restaurantId: string): RestaurantPOSConfig {
    const config = restaurantPOSConfigs[restaurantId];
    
    if (!config) {
      throw new Error(`No POS configuration found for restaurant: ${restaurantId}`);
    }
    
    return config;
  }
  
  /**
   * Gets the receipt data for a specific table
   */
  async getReceiptForTable(tableId: string, restaurantId: string): Promise<Receipt> {
    try {
      // 1. Get the restaurant's POS configuration
      const posConfig = this.getRestaurantPOSConfig(restaurantId);
      
      // 2. Create the appropriate POS adapter
      const posAdapter = createPOSAdapter(
        posConfig.posProvider, 
        posConfig.apiCredentials
      );
      
      // 3. Use the adapter to fetch the receipt
      return await posAdapter.getReceiptForTable(tableId, restaurantId);
    } catch (error) {
      console.error(`Error getting receipt for table ${tableId} in restaurant ${restaurantId}:`, error);
      throw error;
    }
  }
}