import { POSAdapter, POSProvider } from './types';
import { SquarePOSAdapter } from './providers/square';
import { ToastPOSAdapter } from './providers/toast';
import { MicrosPOSAdapter } from './providers/micros';
import { FoodicsPOSAdapter } from './providers/foodics';

/**
 * Creates the appropriate POS adapter based on the provider type
 */
export function createPOSAdapter(provider: POSProvider, credentials: Record<string, string>): POSAdapter {
  switch (provider) {
    case POSProvider.SQUARE:
      return new SquarePOSAdapter(credentials);
    case POSProvider.TOAST:
      return new ToastPOSAdapter(credentials);
    case POSProvider.MICROS:
      return new MicrosPOSAdapter(credentials);
    case POSProvider.FOODICS:
      return new FoodicsPOSAdapter(credentials);
    default:
      throw new Error(`Unsupported POS provider: ${provider}`);
  }
}