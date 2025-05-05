import express from 'express';
import { POSService } from '../services/posService';

const router = express.Router();
const posService = new POSService();

/**
 * Get the current receipt for a table
 */
router.get('/:restaurantId/tables/:tableId/receipt', async (req, res) => {
  try {
    const { restaurantId, tableId } = req.params;
    
    console.log(`Fetching receipt for table ${tableId} in restaurant ${restaurantId}`);
    
    const receipt = await posService.getReceiptForTable(tableId, restaurantId);
    
    res.json({ success: true, data: receipt });
  } catch (error) {
    console.error('Error fetching receipt:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch receipt'
    });
  }
});

/**
 * Get all tables for a restaurant (this would be implemented based on your data model)
 */
router.get('/:restaurantId/tables', (_req, res) => {
  // This is a placeholder - in a real app, you would fetch tables from a database
  res.json({
    success: true,
    data: {
      tables: [
        { id: 'table-1', name: 'Table 1', status: 'occupied' },
        { id: 'table-2', name: 'Table 2', status: 'available' },
        { id: 'table-3', name: 'Table 3', status: 'occupied' }
      ]
    }
  });
});

export default router;