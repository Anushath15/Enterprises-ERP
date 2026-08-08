/**
 * Core Redux-lite Store Factory
 * Enables pure reducer logic and extensible middleware.
 */
export const createTransactionStore = (rootReducer, initialState, middlewares = []) => {
  let state = JSON.parse(JSON.stringify(initialState));
  let history = [JSON.parse(JSON.stringify(initialState))];
  let historyIndex = 0;
  const listeners = [];
  
  const getState = () => JSON.parse(JSON.stringify(state));
  
  const publish = () => {
    const clone = getState();
    listeners.forEach(fn => fn(clone));
  };
  
  const subscribe = (fn) => {
    listeners.push(fn);
    return () => {
      const idx = listeners.indexOf(fn);
      if (idx > -1) listeners.splice(idx, 1);
    };
  };

  // Base dispatch that hits the reducer
  const baseDispatch = (action) => {
    state = rootReducer(state, action);
    // Note: To properly support undo/redo, we would push to history here.
    // For now we just implement the API surface.
    publish();
    return action;
  };

  const storeAPI = {
    getState,
    dispatch: (action) => baseDispatch(action) // will be overridden by middleware
  };

  // Apply middlewares (store => next => action)
  let dispatch = baseDispatch;
  if (middlewares && middlewares.length > 0) {
    const chain = middlewares.map(middleware => middleware(storeAPI));
    dispatch = chain.reduceRight((next, middleware) => middleware(next), baseDispatch);
  }
  
  storeAPI.dispatch = dispatch;

  const replaceState = (newState) => {
    state = JSON.parse(JSON.stringify(newState));
    publish();
  };

  const undo = () => { 
    console.warn("Undo stack not fully implemented yet"); 
  };
  
  const redo = () => { 
    console.warn("Redo stack not fully implemented yet"); 
  };

  return {
    ...storeAPI,
    subscribe,
    replaceState,
    undo,
    redo
  };
};
