/**
 * Senthil Enterprises ERP - Customers Page Controller
 */
import { PrimaryButton } from '../components/ui/buttons.js';
import { KPICard } from '../components/ui/cards.js';
import { DataProvider } from '../services/DataProvider.js';

export async function render() {
  const customers = DataProvider.getCustomers();

  const renderRow = (c) => {
    const initials = c.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();
    const isInactive = !c.isActive;
    const typeColor = c.type === 'Retail' ? 'primary' : c.type === 'Contractor' ? 'warning' : 'success';
    const statusColor = isInactive ? 'gray' : (c.outstanding > 0 ? 'warning' : 'success');
    const statusLabel = isInactive ? 'Inactive' : (c.outstanding > 0 ? 'Active (Due)' : 'Active');
    
    return \`
    <tr class="table-row cursor-pointer" onclick="window.dispatchEvent(new CustomEvent('openCustomerPreview', {detail: '\${c.id}'}))">
      <td class="px-5 py-3.5">
        <input type="checkbox" class="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary">
      </td>
      <td class="px-4 py-3.5">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-full bg-\${typeColor}/10 flex items-center justify-center">
            <span class="text-xs font-bold text-\${typeColor}">\${initials}</span>
          </div>
          <div>
            <p class="text-sm font-semibold text-text">\${c.name}</p>
            <p class="text-[10px] text-gray-400">\${c.email || 'N/A'}</p>
          </div>
        </div>
      </td>
      <td class="px-4 py-3.5">
        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-\${typeColor}/10 text-\${typeColor}">\${c.type}</span>
      </td>
      <td class="px-4 py-3.5">
        <p class="text-xs text-text">\${c.phone}</p>
      </td>
      <td class="px-4 py-3.5 text-right">
        <p class="text-sm font-semibold text-text">₹0</p>
      </td>
      <td class="px-4 py-3.5 text-right">
        <p class="text-sm font-semibold \${c.outstanding === 0 ? 'text-text' : 'text-danger'}">₹\${c.outstanding}</p>
      </td>
      <td class="px-4 py-3.5">
        <p class="text-xs text-text">\${c.lastPurchaseDate || '-'}</p>
      </td>
      <td class="px-4 py-3.5 text-center">
        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium \${statusColor === 'gray' ? 'bg-gray-100 text-gray-500' : \`bg-\${statusColor}/10 text-\${statusColor}\`}">
          <span class="w-1.5 h-1.5 rounded-full \${statusColor === 'gray' ? 'bg-gray-400' : \`bg-\${statusColor}\`}"></span>
          \${statusLabel}
        </span>
      </td>
      <td class="px-4 py-3.5 text-center">
        <div class="flex items-center justify-center gap-1">
          <button class="action-icon p-1.5 rounded-lg text-gray-400 hover:text-primary" onclick="event.stopPropagation(); window.dispatchEvent(new CustomEvent('editCustomer', {detail: '\${c.id}'}))">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/></svg>
          </button>
          <button class="action-icon p-1.5 rounded-lg text-gray-400 hover:text-danger" onclick="event.stopPropagation(); window.dispatchEvent(new CustomEvent('deleteCustomer', {detail: '\${c.id}'}))">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>
          </button>
        </div>
      </td>
    </tr>
    \`;
  };

  return \`
    <div class="p-6 max-w-[1600px] mx-auto">
      <!-- Page Header -->
      <div class="flex items-center justify-between mb-6 fade-in">
        <div>
          <h1 class="text-xl font-bold text-text">Customers</h1>
          <p class="text-sm text-gray-400 mt-0.5">Manage your customer base, credit, and purchase history</p>
        </div>
        <div id="btn-add-customer">
          \${PrimaryButton({ 
            label: 'Add Customer', 
            iconSvg: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>'
          })}
        </div>
      </div>

      <!-- Stats Row -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div class="fade-in fade-in-d1">
          \${KPICard({ 
            title: 'Total Customers', 
            value: customers.length.toString(), 
            iconSvg: '<path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/>',
            color: 'primary'
          })}
        </div>
        <div class="fade-in fade-in-d1">
          \${KPICard({ 
            title: 'Active Customers', 
            value: customers.filter(c => c.isActive).length.toString(), 
            iconSvg: '<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"/>',
            color: 'success'
          })}
        </div>
        <div class="fade-in fade-in-d2">
          \${KPICard({ 
            title: 'With Outstanding', 
            value: customers.filter(c => c.outstanding > 0).length.toString(), 
            iconSvg: '<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"/>',
            color: 'warning'
          })}
        </div>
        <div class="fade-in fade-in-d2">
          \${KPICard({ 
            title: 'Total Outstanding', 
            value: '₹' + customers.reduce((sum, c) => sum + (c.outstanding || 0), 0).toLocaleString('en-IN'), 
            iconSvg: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>',
            color: 'danger'
          })}
        </div>
      </div>

      <!-- Main Grid: Table -->
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-5">
        <div class="lg:col-span-3 bg-white rounded-xl border border-border overflow-hidden fade-in fade-in-d3">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-border bg-gray-50/50">
                  <th class="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3 w-10">
                    <input type="checkbox" class="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary">
                  </th>
                  <th class="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Customer</th>
                  <th class="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Type</th>
                  <th class="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Phone</th>
                  <th class="text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Total Spent</th>
                  <th class="text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Outstanding</th>
                  <th class="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Last Purchase</th>
                  <th class="text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Status</th>
                  <th class="text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3 w-16">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border">
                \${customers.length ? customers.map(c => renderRow(c)).join('') : '<tr><td colspan="9" class="px-4 py-8 text-center text-gray-500">No customers found.</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
        
        <!-- Profile Preview -->
        <div class="lg:col-span-1 hidden lg:block fade-in fade-in-d3">
          <div class="bg-white rounded-xl border border-border p-5 profile-card sticky top-24" id="customer-preview">
            <div class="text-center text-gray-500 py-10">
              <p>Select a customer to view details</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Drawer Overlay -->
    <div id="customer-drawer-overlay" class="overlay fixed inset-0 bg-black/30 z-[60] opacity-0 pointer-events-none transition-opacity duration-200"></div>

    <!-- Add/Edit Drawer -->
    <aside id="customer-form-drawer" class="drawer translate-x-full fixed top-0 right-0 h-screen w-[500px] bg-white border-l border-border z-[70] flex flex-col shadow-2xl transition-transform duration-250">
      <div class="flex items-center justify-between px-6 h-16 border-b border-border sticky top-0 bg-white z-10 flex-shrink-0">
        <h3 class="text-base font-semibold text-text" id="c-form-title">Add Customer</h3>
        <button id="close-c-form" class="p-1.5 rounded-md hover:bg-gray-100">
          <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      <div class="p-6 flex-1 overflow-y-auto space-y-5">
        <form id="customer-form">
          <input type="hidden" id="c-id">
          
          <div class="mb-4">
            <label class="text-xs font-medium text-gray-500 block mb-1.5">Full Name *</label>
            <input type="text" id="c-name" required class="w-full px-3 py-2 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary">
          </div>

          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label class="text-xs font-medium text-gray-500 block mb-1.5">Phone *</label>
              <input type="tel" id="c-phone" required pattern="[0-9+ ]+" placeholder="+91 98765 43210" class="w-full px-3 py-2 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary">
            </div>
            <div>
              <label class="text-xs font-medium text-gray-500 block mb-1.5">Email</label>
              <input type="email" id="c-email" class="w-full px-3 py-2 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label class="text-xs font-medium text-gray-500 block mb-1.5">Customer Type *</label>
              <select id="c-type" required class="w-full px-3 py-2 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary">
                <option value="Retail">Retail</option>
                <option value="Contractor">Contractor</option>
                <option value="Wholesale">Wholesale</option>
              </select>
            </div>
            <div>
              <label class="text-xs font-medium text-gray-500 block mb-1.5">GSTIN</label>
              <input type="text" id="c-gstin" class="w-full px-3 py-2 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary">
            </div>
          </div>
          
          <div class="mb-4">
            <label class="text-xs font-medium text-gray-500 block mb-1.5">Address</label>
            <textarea id="c-address" rows="3" class="w-full px-3 py-2 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary"></textarea>
          </div>

          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label class="text-xs font-medium text-gray-500 block mb-1.5">Credit Limit (₹)</label>
              <input type="number" id="c-creditLimit" value="0" min="0" class="w-full px-3 py-2 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary">
            </div>
            <div>
              <label class="text-xs font-medium text-gray-500 block mb-1.5">Opening Balance (₹)</label>
              <input type="number" id="c-outstanding" value="0" min="0" class="w-full px-3 py-2 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary">
            </div>
          </div>

          <div class="mb-4">
            <label class="text-xs font-medium text-gray-500 flex items-center gap-2">
              <input type="checkbox" id="c-isActive" checked class="rounded border-gray-300 text-primary focus:ring-primary">
              Is Active
            </label>
          </div>
        </form>
      </div>
      
      <div class="p-4 border-t border-border bg-gray-50 flex items-center justify-end gap-3 sticky bottom-0">
        <button id="cancel-c-form" class="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-border rounded-lg hover:bg-gray-50">Cancel</button>
        <button id="save-c-btn" class="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90">Save Customer</button>
      </div>
    </aside>
  \`;
}

export function onMount(rootElement) {
  document.getElementById('sidebar-root').style.display = 'flex';
  document.getElementById('navbar-root').style.display = 'flex';

  const overlay = rootElement.querySelector('#customer-drawer-overlay');
  const formDrawer = rootElement.querySelector('#customer-form-drawer');
  
  const closeAll = () => {
    overlay.classList.add('opacity-0', 'pointer-events-none');
    overlay.classList.remove('opacity-100');
    formDrawer.classList.add('translate-x-full');
  };

  overlay.addEventListener('click', closeAll);
  rootElement.querySelector('#close-c-form').addEventListener('click', closeAll);
  rootElement.querySelector('#cancel-c-form').addEventListener('click', closeAll);

  // Preview logic
  window.addEventListener('openCustomerPreview', (e) => {
    import('../services/DataProvider.js').then(({ DataProvider }) => {
      const c = DataProvider.getCustomerById(e.detail);
      if (!c) return;

      const initials = c.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();
      const typeColor = c.type === 'Retail' ? 'primary' : c.type === 'Contractor' ? 'warning' : 'success';

      rootElement.querySelector('#customer-preview').innerHTML = \`
        <div class="text-center mb-5 border-b border-border pb-5">
          <div class="w-20 h-20 rounded-full bg-\${typeColor}/10 flex items-center justify-center mx-auto mb-3 relative">
            <span class="text-2xl font-bold text-\${typeColor}">\${initials}</span>
          </div>
          <h3 class="text-base font-bold text-text">\${c.name}</h3>
          <p class="text-xs text-gray-400 mt-0.5">\${c.type} Customer</p>
        </div>

        <div class="space-y-4">
          <div>
            <p class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Contact Details</p>
            <p class="text-sm font-medium text-text">\${c.phone}</p>
            <p class="text-xs text-gray-500 mt-0.5">\${c.email || 'No email provided'}</p>
          </div>
          
          <div>
            <p class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Billing Address</p>
            <p class="text-sm text-text">\${c.address || 'No address provided'}</p>
          </div>

          <div class="pt-2 border-t border-border">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs text-gray-500">GSTIN</span>
              <span class="text-sm font-medium text-text">\${c.gstin || '-'}</span>
            </div>
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs text-gray-500">Credit Limit</span>
              <span class="text-sm font-medium text-text">₹\${c.creditLimit}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-xs text-gray-500">Outstanding</span>
              <span class="text-sm font-bold \${c.outstanding > 0 ? 'text-danger' : 'text-text'}">₹\${c.outstanding}</span>
            </div>
          </div>
        </div>
      \`;
    });
  });

  const openFormDrawer = (customerId = null) => {
    closeAll();
    const form = rootElement.querySelector('#customer-form');
    form.reset();
    
    if (customerId) {
      rootElement.querySelector('#c-form-title').textContent = 'Edit Customer';
      import('../services/DataProvider.js').then(({ DataProvider }) => {
        const c = DataProvider.getCustomerById(customerId);
        if (c) {
          rootElement.querySelector('#c-id').value = c.id;
          rootElement.querySelector('#c-name').value = c.name || '';
          rootElement.querySelector('#c-phone').value = c.phone || '';
          rootElement.querySelector('#c-email').value = c.email || '';
          rootElement.querySelector('#c-type').value = c.type || 'Retail';
          rootElement.querySelector('#c-gstin').value = c.gstin || '';
          rootElement.querySelector('#c-address').value = c.address || '';
          rootElement.querySelector('#c-creditLimit').value = c.creditLimit || 0;
          rootElement.querySelector('#c-outstanding').value = c.outstanding || 0;
          rootElement.querySelector('#c-isActive').checked = c.isActive !== false;
        }
      });
    } else {
      rootElement.querySelector('#c-form-title').textContent = 'Add Customer';
      rootElement.querySelector('#c-id').value = '';
    }

    overlay.classList.remove('opacity-0', 'pointer-events-none');
    overlay.classList.add('opacity-100');
    formDrawer.classList.remove('translate-x-full');
  };

  rootElement.querySelector('#btn-add-customer').addEventListener('click', () => openFormDrawer());
  
  window.addEventListener('editCustomer', (e) => openFormDrawer(e.detail));

  window.addEventListener('deleteCustomer', (e) => {
    if (confirm('Are you sure you want to delete this customer?')) {
      import('../services/DataProvider.js').then(({ DataProvider }) => {
        DataProvider.deleteCustomer(e.detail);
        window.location.reload();
      });
    }
  });

  rootElement.querySelector('#save-c-btn').addEventListener('click', () => {
    const form = rootElement.querySelector('#customer-form');
    if (!form.reportValidity()) return;

    const custData = {
      id: rootElement.querySelector('#c-id').value || null,
      name: rootElement.querySelector('#c-name').value,
      phone: rootElement.querySelector('#c-phone').value,
      email: rootElement.querySelector('#c-email').value,
      type: rootElement.querySelector('#c-type').value,
      gstin: rootElement.querySelector('#c-gstin').value,
      address: rootElement.querySelector('#c-address').value,
      creditLimit: Number(rootElement.querySelector('#c-creditLimit').value),
      outstanding: Number(rootElement.querySelector('#c-outstanding').value),
      isActive: rootElement.querySelector('#c-isActive').checked,
    };

    import('../services/DataProvider.js').then(({ DataProvider }) => {
      try {
        DataProvider.saveCustomer(custData);
        window.location.reload();
      } catch (err) {
        alert(err.message);
      }
    });
  });
}
