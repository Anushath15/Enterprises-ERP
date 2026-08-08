import { TransactionActions } from '../TransactionActions.js';
export const paymentReducer = (state = {}, action) => {
  switch (action.type) {
    case TransactionActions.PAYMENT_UPDATE:
      return { ...state, [action.payload.field]: action.payload.value };
    default:
      return state;
  }
};
