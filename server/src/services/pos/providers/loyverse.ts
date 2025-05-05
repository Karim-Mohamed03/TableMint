import { POSAdapter, Receipt } from '../types';
import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Loyverse POS Adapter
 * 
 * Loyverse is a cloud-based POS system used by small to medium retailers, restaurants,
 * and cafes. It provides a REST API for accessing receipts, inventory, customers,
 * and other business data.
 */
export class LoyversePOSAdapter implements POSAdapter {
  private apiKey: string;
  private storeId: string;
  private apiBaseUrl: string;

  constructor(credentials: Record<string, string>) {
    // Use environment variables as default values, but allow override through credentials
    this.apiKey = credentials.apiKey || process.env.LOYVERSE_TOKEN || '';
    this.storeId = credentials.storeId || process.env.LOYVERSE_STORE_ID || '';
    this.apiBaseUrl = credentials.apiBaseUrl || 'https://api.loyverse.com/v1.0';
    
    if (!this.apiKey) {
      console.warn('Loyverse API key not provided. Please check your environment variables or credentials.');
    }
    
    if (!this.storeId) {
      console.warn('Loyverse Store ID not provided. Please check your environment variables or credentials.');
    }
  }

  /**
   * Maps Loyverse receipt data to our standardized Receipt format
   */
  private mapLoyverseReceiptToStandardFormat(loyverseReceipt: any, tableId: string, restaurantId: string): Receipt {
    const items = loyverseReceipt.line_items.map((item: any) => ({
      id: item.id,
      name: item.item_name,
      price: parseFloat(item.price),
      quantity: parseInt(item.quantity, 10),
      modifiers: item.modifiers?.map((mod: any) => ({
        id: mod.id,
        name: mod.name,
        price: parseFloat(mod.price)
      })) || []
    }));
    
    const subtotal = parseFloat(loyverseReceipt.subtotal);
    const tax = parseFloat(loyverseReceipt.total_tax);
    const total = parseFloat(loyverseReceipt.total_money);
    
    return {
      id: loyverseReceipt.receipt_number || `loyverse-receipt-${loyverseReceipt.id}`,
      tableId,
      restaurantId,
      items,
      subtotal,
      tax,
      total,
      status: loyverseReceipt.status === 'COMPLETED' ? 'paid' : 'open',
      createdAt: new Date(loyverseReceipt.created_at),
      updatedAt: new Date(loyverseReceipt.updated_at)
    };
  }

  async getReceiptForTable(tableId: string, restaurantId: string): Promise<Receipt> {
    console.log(`Fetching receipt from Loyverse for table ${tableId} in restaurant ${restaurantId}`);
    
    try {
      if (!this.apiKey || !this.storeId) {
        throw new Error('Loyverse API credentials not properly configured');
      }

      // Make the API call to Loyverse - only filter by store_id and status
      const response = await axios({
        method: 'GET',
        url: `${this.apiBaseUrl}/receipts`,
        params: {
          store_id: this.storeId,
          status: 'OPEN'
        },
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const receipts = response.data.receipts;
      
      // Check if we have any receipts
      if (!receipts || receipts.length === 0) {
        console.log(`No active receipts found for restaurant ${restaurantId}`);
        throw new Error(`No active receipts found`);
      }

      // Filter receipts by table reference (case-insensitive)
      const tableReference = `Table ${tableId}`.toLowerCase();
      const matchingReceipts = receipts.filter((receipt: any) => {
        const reference = (receipt.reference || '').toLowerCase();
        return reference.includes(tableReference);
      });

      if (matchingReceipts.length === 0) {
        console.log(`No active receipts found for table ${tableId}`);
        throw new Error(`No active receipt found for table ${tableId}`);
      }

      // Get the most recently updated receipt from matching receipts
      const latestReceipt = matchingReceipts.sort((a: any, b: any) => 
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      )[0];
      
      // Convert to our standard format
      return this.mapLoyverseReceiptToStandardFormat(latestReceipt, tableId, restaurantId);
    } catch (error) {
      console.error('Error fetching receipt from Loyverse:', error);
      
      // No more mock data - let the error propagate
      if (error instanceof Error) {
        throw new Error(`Failed to fetch receipt from Loyverse: ${error.message}`);
      } else {
        throw new Error('Failed to fetch receipt from Loyverse: Unknown error');
      }
    }
  }
}