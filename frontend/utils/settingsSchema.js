/**
 * Senthil Enterprises ERP - Settings Schema & Validation
 *
 * A single, canonical settings object stored under the `erp_settings` LocalStorage
 * key. Every setting lives here (no scattered keys). Existing fields consumed by
 * other modules (shopName, gstin, defaultTaxType, invoicePrefix, terms,
 * sessionOpen, sessionClose) are preserved.
 */

export const SETTINGS_DEFAULTS = {
  // Business Information
  shopName: 'Senthil Enterprises',
  tagline: 'Quality you can trust',
  address: '123 Main Road, Tiruchirappalli, Tamil Nadu 620001',
  ownerName: 'Senthil Kumar',
  gstin: '33AAAAA0000A1Z5',
  phone: '+91 9876543210',
  email: 'contact@senthilenterprises.com',

  // Invoice Settings
  invoicePrefix: 'INV-',
  invoiceNumberFormat: 'INV-{seq}',
  defaultTaxType: 'Exclusive',
  defaultGst: 18,
  roundOffMethod: 'nearest',
  autoInvoiceNumbering: true,
  showLogoOnInvoice: true,
  showGstinOnInvoice: true,
  showHsnCodeOnInvoice: true,
  showCustomerPhoneOnInvoice: true,
  showPaymentModeOnInvoice: true,
  showDiscountOnInvoice: true,
  autoPrintAfterSave: false,
  paperSize: 'A4',
  printCopies: 1,
  footerMessage: '',
  terms: '1. Goods once sold cannot be returned.\n2. Subject to jurisdiction.\n3. Payment due within 30 days.',

  // Inventory Settings
  lowStockThreshold: 10,
  defaultUnit: 'Nos',
  allowNegativeStock: false,
  autoUpdateStock: true,
  stockWarningColor: 'amber',

  // Backup Settings
  backupFrequency: 'daily',
  autoBackupEnabled: true,

  // Appearance
  theme: 'light',
  compactMode: false,
  fontSize: 'normal',
  sidebarCollapsed: false,

  // System / meta
  currency: 'INR',
  currencySymbol: '\u20B9',
  timeZone: 'Asia/Kolkata',
  dbVersion: '1',
  adminPassword: 'admin123',

  // Session state (read/written by daily_closing.js)
  sessionOpen: false,
  sessionClose: null
};

const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9]Z[0-9A-Z]$/;
const PHONE_RE = /^(?:\+91[\-\s]?)?[6-9]\d{9}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const REQUIRED_FIELDS = [
  'shopName',
  'ownerName',
  'address',
  'phone'
];

export const NUMERIC_FIELDS = new Set([
  'defaultGst',
  'lowStockThreshold',
  'printCopies'
]);

export const BOOLEAN_FIELDS = new Set([
  'autoInvoiceNumbering',
  'showLogoOnInvoice',
  'showGstinOnInvoice',
  'showHsnCodeOnInvoice',
  'showCustomerPhoneOnInvoice',
  'showPaymentModeOnInvoice',
  'showDiscountOnInvoice',
  'autoPrintAfterSave',
  'allowNegativeStock',
  'autoUpdateStock',
  'autoBackupEnabled',
  'compactMode',
  'sidebarCollapsed',
  'sessionOpen'
]);

export const SECTION_ORDER = [
  'business',
  'invoice',
  'inventory',
  'backup',
  'appearance',
  'about'
];

export const FIELD_SECTIONS = {
  business: ['shopName', 'tagline', 'address', 'ownerName', 'gstin', 'phone', 'email'],
  invoice: [
    'invoicePrefix', 'invoiceNumberFormat', 'defaultTaxType', 'defaultGst', 'roundOffMethod', 
    'autoInvoiceNumbering', 'showLogoOnInvoice', 'showGstinOnInvoice', 'showHsnCodeOnInvoice', 
    'showCustomerPhoneOnInvoice', 'showPaymentModeOnInvoice', 'showDiscountOnInvoice', 
    'autoPrintAfterSave', 'paperSize', 'printCopies', 'footerMessage', 'terms'
  ],
  inventory: ['lowStockThreshold', 'defaultUnit', 'allowNegativeStock', 'autoUpdateStock', 'stockWarningColor'],
  backup: ['backupFrequency', 'autoBackupEnabled', 'adminPassword'],
  appearance: ['theme', 'compactMode', 'fontSize', 'sidebarCollapsed'],
  about: []
};

export const ROUND_OFF_OPTIONS = [
  { value: 'nearest', label: 'Nearest (standard)' },
  { value: 'up', label: 'Round Up' },
  { value: 'down', label: 'Round Down' },
  { value: 'none', label: 'No Rounding' }
];

export const THEME_OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'auto', label: 'System Default' }
];

export const FONT_SIZE_OPTIONS = [
  { value: 'small', label: 'Small' },
  { value: 'normal', label: 'Normal' },
  { value: 'large', label: 'Large' }
];

export function isRequired(field) {
  return REQUIRED_FIELDS.indexOf(field) !== -1;
}

export function sanitizeSettings(settings) {
  const clean = Object.assign({}, SETTINGS_DEFAULTS, settings || {});
  Object.keys(clean).forEach((key) => {
    if (BOOLEAN_FIELDS.has(key)) {
      clean[key] = clean[key] === true || clean[key] === 'true';
    } else if (NUMERIC_FIELDS.has(key)) {
      const raw = parseFloat(clean[key]);
      clean[key] = isNaN(raw) ? SETTINGS_DEFAULTS[key] : raw;
    } else if (typeof clean[key] === 'string') {
      clean[key] = clean[key];
    }
  });
  return clean;
}

export function validateField(field, value) {
  if (isRequired(field) && (value === undefined || value === null || String(value).trim() === '')) {
    return 'This field is required';
  }

  const str = value === undefined || value === null ? '' : String(value);

  switch (field) {
    case 'gstin':
      if (str && !GSTIN_RE.test(str)) return 'Invalid GSTIN format';
      return null;
    case 'phone':
      if (str && !PHONE_RE.test(str)) return 'Enter a valid phone number';
      return null;
    case 'email':
      if (str && !EMAIL_RE.test(str)) return 'Enter a valid email address';
      return null;
    case 'defaultGst':
      if (str !== '' && (isNaN(value) || Number(value) < 0 || Number(value) > 100)) {
        return 'Tax rate must be between 0 and 100';
      }
      return null;
    case 'lowStockThreshold':
      if (str !== '' && (isNaN(value) || Number(value) < 0)) {
        return 'Threshold must be 0 or more';
      }
      return null;
    default:
      return null;
  }
}

export function validateSettings(settings) {
  const errors = {};
  let valid = true;

  Object.keys(SETTINGS_DEFAULTS).forEach((field) => {
    const error = validateField(field, settings ? settings[field] : SETTINGS_DEFAULTS[field]);
    if (error) {
      errors[field] = error;
      valid = false;
    }
  });

  return { valid, errors };
}

export function getFieldLabel(field) {
  const labels = {
    shopName: 'Shop Name',
    tagline: 'Tagline',
    address: 'Address',
    ownerName: 'Owner Name',
    gstin: 'GSTIN',
    phone: 'Phone',
    email: 'Email',
    invoicePrefix: 'Invoice Prefix',
    invoiceNumberFormat: 'Invoice Number Format',
    defaultTaxType: 'Default Tax Type',
    defaultGst: 'Default GST Rate',
    roundOffMethod: 'Round Off Method',
    autoInvoiceNumbering: 'Auto Invoice Numbering',
    showLogoOnInvoice: 'Show Logo on Invoice',
    showGstinOnInvoice: 'Show GSTIN',
    showHsnCodeOnInvoice: 'Show HSN Code',
    showCustomerPhoneOnInvoice: 'Show Customer Phone',
    showPaymentModeOnInvoice: 'Show Payment Mode',
    showDiscountOnInvoice: 'Show Discount',
    autoPrintAfterSave: 'Auto Print After Save',
    paperSize: 'Paper Size',
    printCopies: 'Number of Copies',
    footerMessage: 'Footer Message',
    terms: 'Terms & Conditions',
    lowStockThreshold: 'Low Stock Threshold',
    defaultUnit: 'Default Unit',
    allowNegativeStock: 'Allow Negative Stock',
    autoUpdateStock: 'Auto Update Stock',
    stockWarningColor: 'Stock Warning Color',
    backupFrequency: 'Backup Frequency',
    autoBackupEnabled: 'Auto Backup Enabled',
    adminPassword: 'Admin Password (DB Reset)',
    theme: 'Theme',
    compactMode: 'Compact Mode',
    fontSize: 'Font Size',
    sidebarCollapsed: 'Collapse Sidebar by Default',
    currency: 'Currency',
    currencySymbol: 'Currency Symbol',
    timeZone: 'Time Zone',
    dbVersion: 'Database Version'
  };
  return labels[field] || field;
}
