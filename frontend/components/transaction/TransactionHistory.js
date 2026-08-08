export const TransactionHistory = (config) => (store) => (next) => (action) => {
  const prevState = store.getState();
  
  // Pass the action down the chain
  const result = next(action);
  
  const nextState = store.getState();
  
  // Log the transaction state transition
  // We filter out some highly repetitive UI actions like SET_DRAFT
  if (action.type !== 'SET_DRAFT' && action.type !== 'CALCULATE_TOTALS') {
    const time = new Date().toISOString().split('T')[1].slice(0, 12);
    // Debug logs removed for production
  }
  
  return result;
};
