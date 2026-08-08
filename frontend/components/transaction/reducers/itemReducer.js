import { TransactionActions } from '../TransactionActions.js';
export const itemReducer = (state = [], action) => {
  switch (action.type) {
    case TransactionActions.ITEM_ADD:
      return [...state, action.payload];
      
    case TransactionActions.ITEM_UPDATE:
      return state.map(item => 
        item.id === action.payload.id 
          ? { ...item, [action.payload.field]: action.payload.value }
          : item
      );
      
    case 'ITEM_REMOVE':
      return state.filter(item => item.id !== action.payload.id);
      
    case TransactionActions.ITEM_DELETE:
      return state.filter((_, idx) => idx !== action.payload.index);
      
    default:
      return state;
  }
};
