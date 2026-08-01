import { NotificationService } from '../../services/notificationService.js';
import { TransactionActions } from './TransactionActions.js';
export const InventoryMiddleware = (config) => (store) => (next) => (action) => {
  if (!config.services || !config.services.inventory) {
    return next(action);
  }

  const inventoryService = config.services.inventory;

  // Intercept Adding an Item
  if (action.type === TransactionActions.ITEM_ADD) {
    const requestedQty = Number(action.payload.qty) || 1;
    const check = inventoryService.checkAvailability(action.payload.productId, requestedQty);
    
    if (!check.isAvailable) {
      if (window.showToast) {
        NotificationService.error(`Cannot add ${action.payload.name}. Only ${check.availableQty} in stock.`);
      }
      return; // Stop propagation
    }
    
    // Reserve the stock memory
    inventoryService.reserve(action.payload.productId, requestedQty);
    return next(action);
  }

  // Intercept Updating an Item's Quantity
  if (action.type === TransactionActions.ITEM_UPDATE) {
    if (action.payload.field === 'qty') {
      const state = store.getState();
      const item = state.items.find(i => i.id === action.payload.id);
      if (item) {
        const oldQty = Number(item.qty) || 0;
        const newQty = Number(action.payload.value) || 0;
        
        if (newQty <= 0) {
          if (window.showToast) {
            NotificationService.error(`Quantity must be > 0`);
          }
          action.payload.value = oldQty;
          return next(action);
        }
        
        // If decreasing qty, always allow and release stock
        if (newQty < oldQty) {
          inventoryService.release(item.productId, oldQty - newQty);
          return next(action);
        }
        
        // If increasing qty, check available difference
        const additionalQty = newQty - oldQty;
        const check = inventoryService.checkAvailability(item.productId, additionalQty);
        
        if (!check.isAvailable) {
           if (window.showToast) {
             NotificationService.error(`Cannot increase qty. Only ${check.availableQty} more available.`);
           }
           // Override the value back to oldQty to reject the change in UI
           action.payload.value = oldQty;
           next(action); // Let it propagate the old value to re-render UI
           return;
        }
        
        // Validation passed, reserve the extra
        inventoryService.reserve(item.productId, additionalQty);
        return next(action);
      }
    }
    return next(action);
  }

  // Intercept Removing an Item
  if (action.type === 'ITEM_REMOVE') {
    const state = store.getState();
    const item = state.items.find(i => i.id === action.payload.id);
    if (item) {
       inventoryService.release(item.productId, item.qty);
    }
    return next(action);
  }

  return next(action);
};
