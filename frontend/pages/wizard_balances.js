/**
 * Senthil Enterprises ERP - Opening Balance Wizard
 * Rapid entry for initial Customer and Dealer balances.
 */
import { DataProvider } from '../services/dataProvider.js';

export async function render() {
  return `
    <div class="p-6 max-w-5xl mx-auto">
      <div class="bg-white rounded-xl border border-border shadow-sm flex flex-col h-[calc(100vh-120px)]">
        
        <!-- Header -->
        <div class="p-5 border-b border-border flex items-center justify-between bg-gray-50/50 rounded-t-xl shrink-0">
          <div>
            <h2 class="text-xl font-bold text-text flex items-center gap-2">
              <i data-lucide="scale" class="w-6 h-6 text-primary"></i> Opening Balances
            </h2>
            <p class="text-sm text-gray-500 mt-1">Initialize ledgers for your Customers and Dealers.</p>
          </div>
          <div class="flex bg-white rounded-lg border border-border p-1" id="wizard-tabs">
            <button class="px-4 py-1.5 text-sm font-semibold rounded-md transition-colors bg-primary text-white" data-tab="customers">Customers</button>
            <button class="px-4 py-1.5 text-sm font-semibold rounded-md transition-colors text-gray-500 hover:text-text" data-tab="dealers">Dealers</button>
          </div>
        </div>

        <!-- Form Area -->
        <div class="flex-1 overflow-auto p-6" id="wizard-form-area">
          <div class="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Name <span class="text-danger">*</span></label>
              <input type="text" id="ob-name" class="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" placeholder="e.g. Ramesh Constructions">
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Phone</label>
              <input type="text" id="ob-phone" class="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" placeholder="10-digit number">
            </div>
            <div class="col-span-2">
              <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Address</label>
              <input type="text" id="ob-address" class="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" placeholder="Full address">
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Opening Outstanding (₹)</label>
              <input type="number" min="0" step="0.01" id="ob-outstanding" class="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" placeholder="Current due amount" value="0">
            </div>
            <div id="limit-container">
              <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Credit Limit (₹)</label>
              <input type="number" min="0" step="1000" id="ob-limit" class="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" placeholder="Max allowed credit" value="50000">
            </div>
          </div>
          
          <button id="btn-add-ob" class="bg-primary text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors w-full flex justify-center items-center gap-2">
            <i data-lucide="plus" class="w-4 h-4"></i> Add Entry
          </button>
          
          <hr class="my-6 border-border">
          
          <h3 class="text-sm font-bold text-text mb-3 flex items-center gap-2">
            <i data-lucide="list" class="w-4 h-4 text-gray-400"></i> Added <span id="list-title">Customers</span>
          </h3>
          
          <div class="border border-border rounded-lg overflow-hidden">
            <table class="w-full text-left border-collapse">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-2 text-xs font-semibold text-gray-500 uppercase border-b border-border">Name</th>
                  <th class="px-4 py-2 text-xs font-semibold text-gray-500 uppercase border-b border-border">Phone</th>
                  <th class="px-4 py-2 text-xs font-semibold text-gray-500 uppercase border-b border-border text-right">Outstanding</th>
                </tr>
              </thead>
              <tbody id="ob-tbody" class="divide-y divide-border bg-white">
                <!-- Rendered dynamically -->
              </tbody>
            </table>
          </div>
        </div>
        
      </div>
    </div>
  `;
}

export function onMount(rootElement) {
  let currentTab = 'customers';
  
  const tabs = rootElement.querySelectorAll('#wizard-tabs button');
  const tbody = rootElement.querySelector('#ob-tbody');
  const limitContainer = rootElement.querySelector('#limit-container');
  const listTitle = rootElement.querySelector('#list-title');
  
  const nameInp = rootElement.querySelector('#ob-name');
  const phoneInp = rootElement.querySelector('#ob-phone');
  const addrInp = rootElement.querySelector('#ob-address');
  const outInp = rootElement.querySelector('#ob-outstanding');
  const limitInp = rootElement.querySelector('#ob-limit');
  
  const renderList = () => {
    const list = currentTab === 'customers' ? DataProvider.getCustomers() : DataProvider.getDealers();
    
    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="3" class="px-4 py-4 text-center text-sm text-gray-400">No ${currentTab} added yet.</td></tr>`;
      return;
    }
    
    // Sort newest first
    const sorted = [...list].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    tbody.innerHTML = sorted.map(item => `
      <tr>
        <td class="px-4 py-2 text-sm font-medium text-text">${item.name}</td>
        <td class="px-4 py-2 text-sm text-gray-500">${item.phone || '-'}</td>
        <td class="px-4 py-2 text-sm font-bold text-danger text-right">₹${Number(item.outstanding || 0).toLocaleString('en-IN')}</td>
      </tr>
    `).join('');
  };
  
  const switchTab = (tab) => {
    currentTab = tab;
    tabs.forEach(t => {
      const isAct = t.getAttribute('data-tab') === tab;
      t.className = isAct 
        ? "px-4 py-1.5 text-sm font-semibold rounded-md transition-colors bg-primary text-white" 
        : "px-4 py-1.5 text-sm font-semibold rounded-md transition-colors text-gray-500 hover:text-text";
    });
    
    listTitle.textContent = tab === 'customers' ? 'Customers' : 'Dealers';
    limitContainer.style.display = tab === 'customers' ? 'block' : 'none';
    
    // Reset form
    nameInp.value = '';
    phoneInp.value = '';
    addrInp.value = '';
    outInp.value = '0';
    limitInp.value = '50000';
    
    renderList();
  };
  
  tabs.forEach(t => t.addEventListener('click', () => switchTab(t.getAttribute('data-tab'))));
  
  rootElement.querySelector('#btn-add-ob').addEventListener('click', () => {
    const name = nameInp.value.trim();
    if (!name) {
      window.showToast('Name is required.', 'warning');
      return;
    }
    
    const obj = {
      name,
      phone: phoneInp.value.trim(),
      address: addrInp.value.trim(),
      outstanding: parseFloat(outInp.value) || 0,
      isActive: true
    };
    
    try {
      if (currentTab === 'customers') {
        obj.type = 'Retail'; // default
        obj.creditLimit = parseFloat(limitInp.value) || 0;
        DataProvider.saveCustomer(obj);
      } else {
        obj.category = 'General'; // default
        obj.creditPeriod = 30; // default
        DataProvider.saveDealer(obj);
      }
      
      window.showToast(`${currentTab === 'customers' ? 'Customer' : 'Dealer'} added!`, 'success');
      
      nameInp.value = '';
      phoneInp.value = '';
      addrInp.value = '';
      outInp.value = '0';
      nameInp.focus();
      
      renderList();
      
    } catch (e) {
      window.showToast(e.message, 'danger');
    }
  });
  
  renderList();
  
  if (window.lucide) window.lucide.createIcons({ nodes: [rootElement] });
}
