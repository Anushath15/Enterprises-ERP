export const NotificationService = {
  _show(message, type = 'success') {
    // If window.showToast is available, use it (assumes UI implementation)
    if (window.showToast) {
      window.showToast(message, type);
    } else {
      console.log(`[Notification ${type.toUpperCase()}]: ${message}`);
    }
  },
  
  success(message) {
    this._show(message, 'success');
  },
  
  error(message) {
    this._show(message, 'danger');
  },
  
  warning(message) {
    this._show(message, 'warning');
  },
  
  info(message) {
    this._show(message, 'info');
  },
  
  progress(message) {
    this._show(message, 'info');
  }
};
