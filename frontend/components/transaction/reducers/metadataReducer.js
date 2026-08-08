import { TransactionActions } from '../TransactionActions.js';
export const metadataReducer = (state = {}, action) => {
  switch (action.type) {
    case 'MARK_DIRTY':
      return { ...state, dirty: true, updatedAt: new Date().toISOString() };
    case 'CLEAR_DIRTY':
      return { ...state, dirty: false };
    case TransactionActions.RESET:
      return { dirty: false, draftVersion: 1, createdAt: null, updatedAt: null };
    default:
      // Any action other than UPDATE_SUMMARY or internal saves implies a modification that should dirty the state.
      // But actually, it's safer to explicitly dispatch MARK_DIRTY or have the baseReducer set it if certain sub-trees changed.
      return state;
  }
};
