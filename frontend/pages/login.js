export async function render() {
  const container = document.createElement('div');
  container.className = 'min-h-screen flex items-center justify-center bg-gray-50 p-4';
  
  const renderLoginForm = () => `
    <div class="max-w-md w-full bg-white rounded-xl shadow-lg border border-border p-8" id="auth-card">
      <div class="text-center mb-8">
        <h1 class="text-2xl font-bold text-text mb-2">Senthil Enterprises ERP</h1>
        <p class="text-gray-500 text-sm">Please log in to continue</p>
      </div>
      
      <form id="login-form" class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Username</label>
          <select id="login-username" class="w-full px-4 py-2 bg-gray-50 border border-border rounded-lg text-text focus:outline-none focus:border-primary">
            <option value="admin">Admin</option>
            <option value="cashier">Cashier</option>
            <option value="accountant">Accountant</option>
            <option value="storekeeper">Storekeeper</option>
          </select>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">PIN</label>
          <input type="password" id="login-pin" class="w-full px-4 py-2 bg-gray-50 border border-border rounded-lg text-text focus:outline-none focus:border-primary" placeholder="Enter PIN" required>
        </div>
        
        <button type="submit" class="w-full bg-primary text-white font-medium py-2.5 rounded-lg hover:bg-primary/90 transition-colors">
          Login
        </button>
      </form>
    </div>
  `;

  const renderChangePinForm = (username) => `
    <div class="max-w-md w-full bg-white rounded-xl shadow-lg border border-border p-8" id="auth-card">
      <div class="text-center mb-8">
        <h1 class="text-2xl font-bold text-text mb-2">Security Requirement</h1>
        <p class="text-gray-500 text-sm">You must set a new secure PIN before proceeding.</p>
      </div>
      
      <form id="change-pin-form" class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">New PIN</label>
          <input type="password" id="new-pin" class="w-full px-4 py-2 bg-gray-50 border border-border rounded-lg text-text focus:outline-none focus:border-primary" placeholder="Enter New PIN" required minlength="4">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Confirm New PIN</label>
          <input type="password" id="confirm-pin" class="w-full px-4 py-2 bg-gray-50 border border-border rounded-lg text-text focus:outline-none focus:border-primary" placeholder="Confirm New PIN" required minlength="4">
        </div>
        
        <button type="submit" class="w-full bg-primary text-white font-medium py-2.5 rounded-lg hover:bg-primary/90 transition-colors">
          Set New PIN
        </button>
      </form>
    </div>
  `;

  container.innerHTML = renderLoginForm();

  const attachLoginListeners = () => {
    const form = container.querySelector('#login-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = container.querySelector('#login-username').value;
      const pin = container.querySelector('#login-pin').value;
      
      if (!pin) {
        if (window.showToast) window.showToast('PIN is required', 'danger');
        return;
      }
      
      try {
        const success = await window.DataProvider.login(username, pin);
        if (success) {
          const authStr = localStorage.getItem('auth_user');
          const authUser = authStr ? JSON.parse(authStr) : null;
          
          if (authUser && authUser.requiresPinChange) {
             container.innerHTML = renderChangePinForm(username);
             attachChangePinListeners(username);
          } else {
             if (window.showToast) window.showToast('Login successful', 'success');
             window.location.hash = '#/';
          }
        } else {
          if (window.showToast) window.showToast('Invalid PIN', 'danger');
        }
      } catch (err) {
        if (window.showToast) window.showToast(err.message || 'Login failed', 'danger');
      }
    });
  };

  const attachChangePinListeners = (username) => {
    const form = container.querySelector('#change-pin-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const newPin = container.querySelector('#new-pin').value;
      const confirmPin = container.querySelector('#confirm-pin').value;
      
      if (newPin !== confirmPin) {
        if (window.showToast) window.showToast('PINs do not match', 'danger');
        return;
      }
      
      if (newPin.length < 4) {
        if (window.showToast) window.showToast('PIN must be at least 4 characters', 'danger');
        return;
      }

      try {
        await window.DataProvider.changePin(username, newPin);
        if (window.showToast) window.showToast('PIN updated successfully!', 'success');
        window.location.hash = '#/';
      } catch (err) {
        if (window.showToast) window.showToast(err.message || 'Failed to update PIN', 'danger');
      }
    });
  };

  attachLoginListeners();
  return container;
}
