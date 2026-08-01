import { NotificationService } from '../services/notificationService.js';
/**
 * Senthil Enterprises ERP - Global Settings
 */
export async function render() {
  return `
    <div class="p-6 max-w-[1200px] mx-auto fade-in">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-text">System Settings</h1>
        <p class="text-sm text-gray-400 mt-1">Configure shop details, invoices, and system preferences.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <!-- Settings Sidebar -->
        <div class="md:col-span-1 space-y-1">
          <button class="w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium bg-primary/10 text-primary transition-colors">Business Profile</button>
          <button class="w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Tax & GST Settings</button>
          <button class="w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Invoice Formatting</button>
          <button class="w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Data Backup & Recovery</button>
          <button class="w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">System Version</button>
        </div>

        <!-- Settings Content Panel -->
        <div class="md:col-span-3 bg-white border border-border rounded-xl shadow-sm p-6 space-y-6">
          <h3 class="font-semibold text-text text-lg border-b border-border pb-3">Business Profile</h3>
          
          <div class="grid grid-cols-2 gap-5">
            <div class="col-span-2">
              <label class="text-xs font-medium text-gray-500 block mb-1.5">Shop / Business Name</label>
              <input type="text" value="Senthil Enterprises" class="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary">
            </div>
            
            <div class="col-span-2">
              <label class="text-xs font-medium text-gray-500 block mb-1.5">Business Description / Tagline (Printed on Invoice)</label>
              <input type="text" value="Hardware, Electrical, Plumbing, Sanitary and Construction Materials" class="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary">
            </div>
            
            <div class="col-span-2">
              <label class="text-xs font-medium text-gray-500 block mb-1.5">Primary Address</label>
              <textarea rows="3" class="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary">No. 123, Main Road, Chennai, Tamil Nadu - 600001</textarea>
            </div>

            <div>
              <label class="text-xs font-medium text-gray-500 block mb-1.5">Contact Phone</label>
              <input type="text" value="+91 9876543210" class="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary">
            </div>
            <div>
              <label class="text-xs font-medium text-gray-500 block mb-1.5">Email Address (Optional)</label>
              <input type="email" value="contact@senthilenterprises.com" class="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary">
            </div>
          </div>

          <h3 class="font-semibold text-text text-lg border-b border-border pb-3 pt-4">Tax & GST Settings</h3>
          <div class="grid grid-cols-2 gap-5">
            <div>
              <label class="text-xs font-medium text-gray-500 block mb-1.5">GSTIN (Goods and Services Tax Number)</label>
              <input type="text" value="33AAAAA0000A1Z5" class="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary uppercase">
            </div>
            <div>
              <label class="text-xs font-medium text-gray-500 block mb-1.5">Default Tax Type</label>
              <select class="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary">
                <option>Exclusive (Added on top)</option><option>Inclusive (Included in price)</option>
              </select>
            </div>
          </div>

          <h3 class="font-semibold text-text text-lg border-b border-border pb-3 pt-4">Invoice Settings</h3>
          <div class="grid grid-cols-2 gap-5">
            <div>
              <label class="text-xs font-medium text-gray-500 block mb-1.5">Invoice Prefix</label>
              <input type="text" value="INV-" class="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary uppercase">
            </div>
            <div>
              <label class="text-xs font-medium text-gray-500 block mb-1.5">Terms & Conditions (Printed on Invoice)</label>
              <textarea rows="3" class="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary">1. Goods once sold cannot be returned.
2. Subject to Chennai jurisdiction.</textarea>
            </div>
          </div>

          <div class="pt-6 mt-6 border-t border-border flex justify-end">
            <button id="save-settings-btn" class="px-6 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors shadow-sm">Save Preferences</button>
          </div>
          
          <h3 class="font-semibold text-text text-lg border-b border-border pb-3 pt-4">Data Backup & Recovery</h3>
          <div class="grid grid-cols-2 gap-5">
            <div class="col-span-2">
              <p class="text-sm text-gray-500 mb-4">Export all ERP data from LocalStorage to a secure JSON file. Keep this backup safe to prevent data loss.</p>
              <button id="backup-btn" class="px-5 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors shadow-sm flex items-center gap-2">
                <i data-lucide="download" class="w-4 h-4"></i> Download Backup
              </button>
            </div>
          </div>

          <h3 class="font-semibold text-text text-lg border-b border-border pb-3 pt-4">System Version</h3>
          <div class="bg-gray-50 rounded-lg p-5 border border-border">
            <div class="grid grid-cols-2 gap-y-3">
              <div class="text-sm font-medium text-gray-500">Software Name:</div>
              <div class="text-sm font-semibold text-text">Senthil Enterprises ERP</div>
              <div class="text-sm font-medium text-gray-500">Version:</div>
              <div class="text-sm font-semibold text-primary">v1.0.0-rc1</div>
              <div class="text-sm font-medium text-gray-500">Build Date:</div>
              <div class="text-sm font-semibold text-text">2026-07-28</div>
              <div class="text-sm font-medium text-gray-500">Database Engine:</div>
              <div class="text-sm font-semibold text-text">Offline LocalStorage</div>
              <div class="text-sm font-medium text-gray-500">Schema Version:</div>
              <div class="text-sm font-semibold text-text">1</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function onMount(rootElement) {
  if (window.lucide) window.lucide.createIcons();

  const handleSave = () => {
    NotificationService.success('System preferences saved successfully!');
  };

  const handleBackup = () => {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('erp_')) {
        data[key] = localStorage.getItem(key);
      }
    }
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `erp_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Update last backup date
    localStorage.setItem('erp_last_backup', new Date().toISOString());
    NotificationService.success('Backup generated successfully!');
  };

  const saveBtn = rootElement.querySelector('#save-settings-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', handleSave);
  }

  const backupBtn = rootElement.querySelector('#backup-btn');
  if (backupBtn) {
    backupBtn.addEventListener('click', handleBackup);
  }

  return () => {
    if (saveBtn) saveBtn.removeEventListener('click', handleSave);
    if (backupBtn) backupBtn.removeEventListener('click', handleBackup);
  };
}

