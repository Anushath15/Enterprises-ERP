import { baseReducer } from '../../components/transaction/reducers/baseReducer.js';

/**
 * Purchases Reducer
 * Currently wraps the standard base transaction reducer.
 * If purchases ever needs highly custom state logic (like landing costs),
 * it can be intercepted here before or after calling baseReducer.
 */
export const purchaseReducer = (state, action) => {
  // Pass through to the generic base reducer which handles ITEM_ADD, HEADER_UPDATE, etc.
  return baseReducer(state, action);
};
