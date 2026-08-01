/**
 * Base Transaction Configuration Schema.
 * Every transaction module must adhere to this structure.
 */
export const TransactionSchema = {
  moduleName: '',
  entityType: '', // 'customer' | 'supplier' | 'warehouse'
  entityIdField: '',
  entityLabel: '',
  
  theme: {
    primary: 'text-gray-600',
    bg: 'bg-gray-600',
    border: 'border-gray-600'
  },
  
  pricing: {
    field: 'price' // which field represents the base price (e.g. 'salesPrice', 'purchasePrice')
  },
  
  columns: [], // Array of column definitions with renderers
  
  validations: [], // Array of validation rule functions
  
  plugins: [], // Array of plugins (each can inject middlewares, columns, validations)
  
  middlewares: [], // Custom middlewares
  
  hooks: {
    beforeLoad: async (config) => {},
    afterLoad: async (state, config) => {},
    beforeValidate: async (state, config) => {},
    afterValidate: async (state, config, errors) => {},
    beforeSave: async (state, config) => state,
    afterSave: async (state, config, result) => {},
    beforeDelete: async (state, config) => {},
    afterDelete: async (state, config) => {},
    beforeUndo: async (state, config) => {},
    afterUndo: async (state, config) => {},
  },
  
  reducer: (state, action) => state // Optional custom reducer
};

export const mergeConfig = (baseConfig) => {
  // Deep clone schema
  const config = JSON.parse(JSON.stringify(TransactionSchema));
  
  // We can't safely JSON.stringify functions, so we manually merge primitives and functions
  Object.assign(config.theme, baseConfig.theme || {});
  Object.assign(config.pricing, baseConfig.pricing || {});
  config.moduleName = baseConfig.moduleName || '';
  config.entityType = baseConfig.entityType || '';
  config.entityIdField = baseConfig.entityIdField || '';
  config.entityLabel = baseConfig.entityLabel || '';
  
  config.columns = baseConfig.columns || [];
  config.validations = baseConfig.validations || [];
  config.plugins = baseConfig.plugins || [];
  config.middlewares = baseConfig.middlewares || [];
  config.reducer = baseConfig.reducer || ((state, action) => state);
  
  // Merge hooks
  if (baseConfig.hooks) {
    Object.assign(config.hooks, baseConfig.hooks);
  }
  
  // Process plugins (non-mutating injection)
  config.plugins.forEach(plugin => {
    if (plugin.middlewares) config.middlewares.push(...plugin.middlewares);
    if (plugin.validations) config.validations.push(...plugin.validations);
    if (plugin.columns) config.columns.push(...plugin.columns);
    if (plugin.hooks) {
      Object.keys(plugin.hooks).forEach(hookName => {
        // Compose hooks
        const existingHook = config.hooks[hookName];
        const pluginHook = plugin.hooks[hookName];
        config.hooks[hookName] = async (...args) => {
          await existingHook(...args);
          return await pluginHook(...args);
        };
      });
    }
  });
  
  return config;
};
