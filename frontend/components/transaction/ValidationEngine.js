export const ValidationEngine = {
  Required: (field, customMsg) => (state, config) => {
    // Check header
    if (!state.header[field]) {
      // Check items if not in header? Usually required is for header or summary
      return customMsg || `${field} is required`;
    }
    return null;
  },
  
  Positive: (field, customMsg) => (state, config) => {
    let error = null;
    state.items.forEach((item, index) => {
      const val = parseFloat(item[field]);
      if (isNaN(val) || val <= 0) {
        error = customMsg || `Row ${index + 1}: ${field} must be greater than 0`;
      }
    });
    return error;
  },
  
  MinItems: (count = 1) => (state, config) => {
    if (!state.items || state.items.length < count) {
      return `Please add at least ${count} item(s) to the transaction`;
    }
    return null;
  }
};

export const runValidations = (state, config) => {
  const errors = [];
  if (config.validations && config.validations.length > 0) {
    config.validations.forEach(rule => {
      const err = rule(state, config);
      if (err) errors.push(err);
    });
  }
  return errors;
};
