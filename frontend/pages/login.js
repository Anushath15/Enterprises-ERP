import { NotificationService } from '../services/notificationService.js';
/**
 * Senthil Enterprises ERP - Login Page
 */
import { Card } from '../components/ui/cards.js';
import { TextInput, Checkbox } from '../components/ui/forms.js';
import { PrimaryButton } from '../components/ui/buttons.js';

export async function render() {
  const loginForm = `
    <div class="mb-6 text-center">
      <div class="w-12 h-12 rounded-xl bg-primary mx-auto flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
        <i data-lucide="zap" class="w-6 h-6 text-white"></i>
      </div>
      <h1 class="text-2xl font-bold text-text">Senthil Enterprises</h1>
      <p class="text-sm text-gray-500 mt-1">ERP System Login</p>
    </div>

    <form id="login-form">
      ${TextInput({
        label: 'Username',
        id: 'username',
        placeholder: 'Enter your username',
        required: true
      })}
      
      ${TextInput({
        label: 'Password',
        id: 'password',
        type: 'password',
        placeholder: 'Enter your password',
        required: true
      })}
      
      <div class="flex items-center justify-between mb-6">
        ${Checkbox({
          label: 'Remember me',
          id: 'remember',
          checked: true
        })}
        <a href="#" class="text-xs font-medium text-primary hover:text-primary/80 transition-colors">Forgot Password?</a>
      </div>

      ${PrimaryButton({
        label: 'Sign In',
        id: 'login-btn',
        type: 'submit',
        fullWidth: true
      })}
    </form>
    
    <div class="mt-8 text-center border-t border-border pt-6">
      <p class="text-xs text-gray-400">Offline Mode Available. Data syncs upon connection.</p>
    </div>
  `;

  return `
    <div class="min-h-screen bg-bg flex flex-col items-center justify-center p-4">
      <div class="w-full max-w-md">
        ${Card({
          children: loginForm
        })}
      </div>
    </div>
  `;
}

export function onMount(rootElement) {
  // Hide layout shell safely
  const sidebar = document.getElementById('sidebar-manager');
  const navbar = document.getElementById('top-navbar');

  // Adjust root padding since navbar is hidden
  const mainWrapper = document.querySelector('main');
  const originalPadding = mainWrapper ? mainWrapper.style.paddingTop : '';

  const hideShell = () => {
    if (sidebar) sidebar.style.display = 'none';
    if (navbar) navbar.style.display = 'none';
    if (mainWrapper) mainWrapper.style.paddingTop = '0';
  };

  const restoreShell = () => {
    if (sidebar) sidebar.style.display = '';
    if (navbar) navbar.style.display = '';
    if (mainWrapper) mainWrapper.style.paddingTop = originalPadding;
  };

  hideShell();

  if (window.lucide) window.lucide.createIcons();

  const form = document.getElementById('login-form');
  let handleSubmit = null;
  if (form) {
    handleSubmit = async (e) => {
      e.preventDefault();
      
      const btn = document.getElementById('login-btn');
      const originalText = btn.innerHTML;
      btn.innerHTML = '<span class="animate-pulse">Authenticating...</span>';
      btn.disabled = true;
      
      try {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        // Dynamically import DataProvider to avoid circular deps if any
        const { DataProvider } = await import('../services/dataProvider.js');
        const { LocalStorageService } = await import('../services/storage/localStorageService.js');
        
        const response = await DataProvider.login(username, password);
        
        // Save token and user details
        LocalStorageService.set('auth_token', response.access_token);
        LocalStorageService.set('auth_user', response.user);
        
        // Restore layout shell safely
        restoreShell();
        
        // Navigate to Dashboard
        window.location.hash = '#/';
      } catch (error) {
        btn.innerHTML = originalText;
        btn.disabled = false;
        // Simple error alert for now; could use Toast component
        NotificationService.error(error.message || 'Login failed');
      }
    };
    form.addEventListener('submit', handleSubmit);
  }

  return () => {
    restoreShell();
    if (form && handleSubmit) {
      form.removeEventListener('submit', handleSubmit);
    }
  };
}

