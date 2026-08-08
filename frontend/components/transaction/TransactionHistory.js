export const TransactionHistory = (config) => (store) => (next) => (action) => {
  const prevState = store.getState();
  
  // Pass the action down the chain
  const result = next(action);
  
  const nextState = store.getState();
  
  // Log the transaction state transition
  // We filter out some highly repetitive UI actions like SET_DRAFT
  if (action.type !== 'SET_DRAFT' && action.type !== 'CALCULATE_TOTALS') {
    const time = new Date().toISOString().split('T')[1].slice(0, 12);
    console.groupCollapsed(`[TXN] ${time} ${action.type}`);
    console.log('%cAction', 'color: #03A9F4; font-weight: bold', action);
    console.log('%cPrev State', 'color: #9E9E9E; font-weight: bold', prevState);
    console.log('%cNext State', 'color: #4CAF50; font-weight: bold', nextState);
    console.groupEnd();
  }
  
  return result;
};
