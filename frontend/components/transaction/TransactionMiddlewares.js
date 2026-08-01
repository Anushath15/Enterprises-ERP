import { NotificationService } from '../../services/notificationService.js';
import { TransactionActions } from './TransactionActions.js';
import { TransactionCalculator } from './TransactionCalculator.js';

export const CalculatorMiddleware = (config) => (store) => (next) => (action) => {
  // Pass the action down the chain first so state updates
  next(action);

  // If this action affects totals, compute and dispatch UPDATE_SUMMARY
  if (
    action.type.startsWith('ITEM_') ||
    action.type === 'UPDATE_DISCOUNT' ||
    action.type === 'UPDATE_ROUNDOFF' || 
    action.type === TransactionActions.RESET
  ) {
    const state = store.getState();
    const totals = TransactionCalculator.calculateDocument({
      items: state.items || [],
      discount: state.summary?.discount || 0,
      roundOff: state.summary?.roundOff || 0,
      priceField: config.pricing?.field || config.priceField || 'purchasePrice'
    });
    
    // Dispatch to update summary without triggering an infinite loop
    next({ type: 'UPDATE_SUMMARY', payload: totals });
  }
};

import { runValidations } from './ValidationEngine.js';

export const SaveMiddleware = (config) => (store) => (next) => async (action) => {
  if (action.type === 'REQUEST_SAVE') {
    const state = store.getState();
    
    // 1. beforeValidate hook
    if (config.hooks?.beforeValidate) {
      await config.hooks.beforeValidate(state, config);
    }

    // 2. runValidations
    const errors = runValidations(state, config);
    
    // 3. afterValidate hook
    if (config.hooks?.afterValidate) {
      await config.hooks.afterValidate(state, config, errors);
    }

    if (errors && errors.length > 0) {
      NotificationService.error(errors[0]);
      return; // Stop propagation
    }
    
    // 4. beforeSave hook
    let stateToSave = state;
    if (config.hooks?.beforeSave) {
      stateToSave = await config.hooks.beforeSave(state, config) || state;
    }

    // 5. Save (Pass to module-specific save handler, or config.onSave if still used)
    let result = null;
    if (config.onSave) {
      try {
        result = await config.onSave(stateToSave, store);
      } catch (err) {
        NotificationService.error('Save failed: ' + err.message);
        return;
      }
    }
    
    // 6. afterSave hook
    if (config.hooks?.afterSave) {
      await config.hooks.afterSave(stateToSave, config, result);
    }
    
    // 7. afterCommit hook (if any post-db actions are needed)
    if (config.hooks?.afterCommit) {
      await config.hooks.afterCommit(stateToSave, config, result);
    }

  } else {
    next(action);
  }
};
