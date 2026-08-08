import { TransactionActions } from '../TransactionActions.js';
import { itemReducer } from './itemReducer.js';
import { entityReducer } from './entityReducer.js';
import { paymentReducer } from './paymentReducer.js';
import { metadataReducer } from './metadataReducer.js';

export const baseReducer = (state, action) => {
  if (action.type === TransactionActions.RESET) {
    return action.payload; // expect payload to be the full initial state
  }
  
  if (action.type === 'UPDATE_SUMMARY') {
    return { ...state, summary: action.payload };
  }

  const nextState = {
    ...state,
    header: entityReducer(state.header, action),
    items: itemReducer(state.items, action),
    payment: paymentReducer(state.payment, action),
    metadata: metadataReducer(state.metadata, action)
  };

  // If a data-mutating action occurred, mark dirty automatically unless it's a specific action
  if (!['UPDATE_SUMMARY', 'MARK_DIRTY', 'CLEAR_DIRTY'].includes(action.type)) {
    nextState.metadata = metadataReducer(nextState.metadata, { type: 'MARK_DIRTY' });
  }

  return nextState;
};
