import { TransactionActions } from '../TransactionActions.js';
export const entityReducer = (state = {}, action) => {
  switch (action.type) {
    case TransactionActions.HEADER_UPDATE:
      return { ...state, [action.payload.field]: action.payload.value };
    default:
      return state;
  }
};
