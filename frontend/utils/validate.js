export const VALIDATORS = {
  GSTIN: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]$/,
  PHONE: /^(\+91[\s-]?)?[6-9][0-9]{9}$/,
  PIN: /^[1-9][0-9]{5}$/,
  PAN: /^[A-Z]{5}[0-9]{4}[A-Z]$/
};

export const rules = {
  required(value, label = 'This field') {
    return value === undefined || value === null || String(value).trim() === ''
      ? `${label} is required.`
      : null;
  },
  maxLength(value, max, label = 'This field') {
    return String(value ?? '').length > max
      ? `${label} must be ${max} characters or less.`
      : null;
  },
  number(value, label = 'This field') {
    return value !== '' && value !== undefined && value !== null && Number.isNaN(Number(value))
      ? `${label} must be a valid number.`
      : null;
  },
  positive(value, label = 'This field') {
    return Number(value) <= 0 ? `${label} must be greater than 0.` : null;
  },
  nonNegative(value, label = 'This field') {
    return Number(value) < 0 ? `${label} cannot be negative.` : null;
  },
  max(value, max, label = 'This field') {
    return Number(value) > max ? `${label} cannot exceed ${max}.` : null;
  },
  gstin(value, label = 'GST number') {
    return value && !VALIDATORS.GSTIN.test(String(value).trim().toUpperCase())
      ? `${label} is not a valid GSTIN.`
      : null;
  },
  phone(value, label = 'Phone number') {
    return value && !VALIDATORS.PHONE.test(String(value).trim())
      ? `${label} must be a valid 10-digit mobile number (e.g. +91 9876543210).`
      : null;
  },
  pin(value, label = 'PIN code') {
    return value && !VALIDATORS.PIN.test(String(value).trim())
      ? `${label} must be a valid 6-digit PIN.`
      : null;
  },
  pan(value, label = 'PAN number') {
    return value && !VALIDATORS.PAN.test(String(value).trim().toUpperCase())
      ? `${label} must be a valid 10-character PAN.`
      : null;
  }
};

export const setFieldError = (el, message) => {
  if (!el || !el.id) return;
  const wrap = el.closest('div');
  let errEl = wrap ? wrap.querySelector(`[data-error-for="${el.id}"]`) : null;
  if (!errEl && wrap) {
    errEl = document.createElement('p');
    errEl.setAttribute('data-error-for', el.id);
    errEl.className = 'mt-1.5 text-xs text-danger';
    wrap.appendChild(errEl);
  }
  if (errEl) errEl.textContent = message || '';
  el.classList.toggle('border-danger', Boolean(message));
};

export const validateForm = (entries) => {
  let first = null;
  entries.forEach(({ el, check }) => {
    if (!el) return;
    const err = check ? check(el.value) : null;
    setFieldError(el, err || '');
    if (err && !first) first = err;
  });
  return first;
};

export const transactionValidations = (desc) => {
  const priceField = desc.priceField || 'price';
  const priceLabel = desc.priceLabel || 'Price';
  return [
    (state) => {
      if (!state.header[desc.entityIdField]) return `${desc.entityLabel} is required.`;
      if (!state.header.date) return 'Date is required.';
      if (!state.items || state.items.length === 0) return 'At least one product is required.';
      return null;
    },
    (state) => {
      if (!state.items || state.items.length === 0) return null;
      for (let i = 0; i < state.items.length; i++) {
        const item = state.items[i];
        if (Number(item.qty) <= 0) return `Row ${i + 1}: Quantity must be greater than 0.`;
        if (Number(item[priceField]) <= 0) return `Row ${i + 1}: ${priceLabel} must be greater than 0.`;
        if (Number(item.gst) < 0 || Number(item.gst) > 100) return `Row ${i + 1}: GST % must be between 0 and 100.`;
      }
      return null;
    }
  ];
};
