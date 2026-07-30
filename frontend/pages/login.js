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
  // Hide layout shell (Sidebar/Navbar) on Login page
  document.getElementById('sidebar-root').style.display = 'none';
  document.getElementById('navbar-root').style.display = 'none';
  if (window.lucide) window.lucide.createIcons();
  
  // Adjust root padding since navbar is hidden
  const pageRoot = document.getElementById('page-root');
  const originalClasses = pageRoot.className;
  pageRoot.className = ''; // Remove default pt-16 ml-64 classes for full screen login

  const form = document.getElementById('login-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
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
        
        // Restore layout shell
        document.getElementById('sidebar-root').style.display = 'flex';
        document.getElementById('navbar-root').style.display = 'flex';
        pageRoot.className = originalClasses; // Restore padding
        
        // Navigate to Dashboard
        window.location.hash = '#/';
      } catch (error) {
        btn.innerHTML = originalText;
        btn.disabled = false;
        // Simple error alert for now; could use Toast component
        window.showToast(error.message || 'Login failed', 'danger');
      }
    });
  }
}

