/**
 * Senthil Enterprises ERP - Expense Management
 */
import { PrimaryButton } from '../components/ui/buttons.js';
import { KPICard } from '../components/ui/cards.js';
import { DataProvider } from '../services/DataProvider.js';

export async function render() {
  const expenses = DataProvider.getExpenses() || [];

  const renderRow = (exp) => {
    let methodBadge = 'primary';
    if (exp.method === 'UPI') methodBadge = 'warning';
    
    return \`
    <tr class="row-hover cursor-pointer" onclick="window.dispatchEvent(new CustomEvent('openExpenseDrawer'))">
      <td class="px-4 py-3.5 text-sm text-gray-500">\${exp.date || '-'}</td>
      <td class="px-4 py-3.5">
        <span class="font-medium text-text text-sm">\${exp.category || '-'}</span>
      </td>
      <td class="px-4 py-3.5 text-sm text-gray-600 max-w-xs truncate">\${exp.description || '-'}</td>
      <td class="px-4 py-3.5 text-center">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-\${methodBadge}/10 text-\${methodBadge} uppercase tracking-wider">\${exp.method || 'Cash'}</span>
      </td>
      <td class="px-4 py-3.5 text-right font-semibold text-danger">₹\${(exp.amount || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
      <td class="px-4 py-3.5 text-right">
        <div class="flex items-center justify-end gap-1">
          <button class="p-1.5 rounded-lg text-gray-400 hover:text-danger hover:bg-danger/10" onclick="event.stopPropagation(); window.dispatchEvent(new CustomEvent('deleteExpense', {detail: '\${exp.id}'}));">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>
          </button>
        </div>
      </td>
    </tr>
    \`;
  };

  return \`
    <div class="p-6 max-w-[1600px] mx-auto fade-in">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-text">Expense Management</h1>
          <p class="text-sm text-gray-400 mt-1">Record, categorize, and track daily shop expenses.</p>
        </div>
        <div class="flex items-center gap-2">
          <button onclick="window.dispatchEvent(new CustomEvent('openExpenseDrawer'))" class="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors btn-primary">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
            Add Expense
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        \${KPICard({ title: 'Total Expenses', value: '₹' + expenses.reduce((sum, e) => sum + (e.amount || 0), 0).toLocaleString('en-IN'), iconSvg: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>', color: 'danger' })}
        \${KPICard({ title: 'Transactions', value: expenses.length.toString(), iconSvg: '<path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"/>', color: 'primary' })}
        \${KPICard({ title: 'Largest Category', value: 'Utilities', iconSvg: '<path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z"/><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z"/>', color: 'warning' })}
        \${KPICard({ title: 'Pending Approvals', value: '0', iconSvg: '<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>', color: 'success' })}
      </div>

      <div class="bg-white rounded-xl border border-border overflow-hidden">
        <div class="p-4 border-b border-border flex items-center justify-between bg-gray-50/50">
          <div class="flex gap-2">
            <select class="text-sm border border-border rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-primary">
              <option>All Time</option>
            </select>
            <select class="text-sm border border-border rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-primary">
              <option>All Categories</option>
              <option>Tea & Snacks</option>
              <option>Transport</option>
              <option>Utilities</option>
              <option>Maintenance</option>
              <option>Salary/Wages</option>
            </select>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm min-w-[1000px]">
            <thead>
              <tr class="border-b border-border bg-gray-50/60 text-left">
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Date</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Category</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Description</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide text-center">Payment Method</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide text-right">Amount</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              \${expenses.length > 0 ? expenses.map(renderRow).join('') : '<tr><td colspan="6" class="px-4 py-8 text-center text-gray-500">No expenses found.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Right Drawer Overlay -->
    <div id="expense-drawer-overlay" class="overlay fixed inset-0 bg-black/30 z-[60] opacity-0 pointer-events-none transition-opacity duration-200"></div>
    
    <!-- Add Expense Drawer -->
    <aside id="expense-form-drawer" class="drawer translate-x-full fixed top-0 right-0 h-screen w-[500px] bg-white border-l border-border z-[70] overflow-y-auto shadow-2xl transition-transform duration-250 flex flex-col">
      <div class="flex items-center justify-between px-6 h-16 border-b border-border sticky top-0 bg-white z-10 shrink-0">
        <h3 class="text-base font-semibold text-text">Record Expense</h3>
        <button class="close-expense-drawer p-1.5 rounded-md hover:bg-gray-100">
          <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      <div class="p-6 flex-1 overflow-y-auto space-y-5">
        <form id="expense-form" class="space-y-4">
          <div>
            <label class="text-xs font-medium text-gray-500 block mb-1.5">Date *</label>
            <input type="date" id="exp-date" required class="w-full px-3 py-2.5 bg-gray-50 border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary">
          </div>
          
          <div>
            <label class="text-xs font-medium text-gray-500 block mb-1.5">Category *</label>
            <select id="exp-category" required class="w-full px-3 py-2.5 bg-gray-50 border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary">
              <option>Tea & Snacks</option>
              <option>Transport</option>
              <option>Utilities</option>
              <option>Maintenance</option>
              <option>Salary/Wages</option>
              <option>Other</option>
            </select>
          </div>

          <div>
            <label class="text-xs font-medium text-gray-500 block mb-1.5">Amount *</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
              <input type="number" id="exp-amount" required min="0.01" step="0.01" placeholder="0.00" class="w-full pl-8 pr-3 py-2.5 bg-gray-50 border border-border rounded-lg text-sm font-semibold text-text focus:outline-none focus:border-primary">
            </div>
          </div>

          <div>
            <label class="text-xs font-medium text-gray-500 block mb-1.5">Payment Method *</label>
            <div class="grid grid-cols-3 gap-2">
              <label class="cursor-pointer">
                <input type="radio" name="paymethod" value="Cash" class="peer sr-only" checked>
                <div class="px-3 py-2 text-center text-xs font-medium border border-border rounded-lg peer-checked:bg-primary/10 peer-checked:border-primary peer-checked:text-primary hover:bg-gray-50 transition-colors">Cash</div>
              </label>
              <label class="cursor-pointer">
                <input type="radio" name="paymethod" value="UPI" class="peer sr-only">
                <div class="px-3 py-2 text-center text-xs font-medium border border-border rounded-lg peer-checked:bg-primary/10 peer-checked:border-primary peer-checked:text-primary hover:bg-gray-50 transition-colors">UPI</div>
              </label>
              <label class="cursor-pointer">
                <input type="radio" name="paymethod" value="Bank" class="peer sr-only">
                <div class="px-3 py-2 text-center text-xs font-medium border border-border rounded-lg peer-checked:bg-primary/10 peer-checked:border-primary peer-checked:text-primary hover:bg-gray-50 transition-colors">Bank</div>
              </label>
            </div>
          </div>

          <div>
            <label class="text-xs font-medium text-gray-500 block mb-1.5">Description / Notes</label>
            <textarea id="exp-desc" rows="3" placeholder="Describe the expense..." class="w-full px-3 py-2 bg-gray-50 border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary"></textarea>
          </div>
        </form>
      </div>
      
      <div class="p-4 border-t border-border bg-gray-50 flex items-center justify-end gap-3 sticky bottom-0">
        <button class="close-expense-drawer px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-border rounded-lg hover:bg-gray-50">Cancel</button>
        <button id="btn-save-expense" class="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90">Save Expense</button>
      </div>
    </aside>
  \`;
}

export function onMount(rootElement) {
  document.getElementById('sidebar-root').style.display = 'flex';
  document.getElementById('navbar-root').style.display = 'flex';

  const overlay = rootElement.querySelector('#expense-drawer-overlay');
  const formDrawer = rootElement.querySelector('#expense-form-drawer');
  const closeBtns = rootElement.querySelectorAll('.close-expense-drawer');

  const today = new Date().toISOString().split('T')[0];
  const dateInput = rootElement.querySelector('#exp-date');
  if (dateInput) dateInput.value = today;

  const closeAll = () => {
    overlay.classList.add('opacity-0', 'pointer-events-none');
    overlay.classList.remove('opacity-100');
    formDrawer.classList.add('translate-x-full');
  };

  const openForm = () => {
    closeAll();
    const form = rootElement.querySelector('#expense-form');
    if (form) form.reset();
    if (dateInput) dateInput.value = today;
    
    overlay.classList.remove('opacity-0', 'pointer-events-none');
    overlay.classList.add('opacity-100');
    formDrawer.classList.remove('translate-x-full');
  };

  window.addEventListener('openExpenseDrawer', openForm);
  closeBtns.forEach(btn => btn.addEventListener('click', closeAll));
  overlay.addEventListener('click', closeAll);

  window.addEventListener('deleteExpense', (e) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      import('../services/DataProvider.js').then(({ DataProvider }) => {
        DataProvider.deleteExpense(e.detail);
        window.location.reload();
      });
    }
  });

  const saveBtn = rootElement.querySelector('#btn-save-expense');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const form = rootElement.querySelector('#expense-form');
      if (!form.reportValidity()) return;

      const methodRadio = rootElement.querySelector('input[name="paymethod"]:checked');

      const expense = {
        date: rootElement.querySelector('#exp-date').value,
        category: rootElement.querySelector('#exp-category').value,
        amount: Number(rootElement.querySelector('#exp-amount').value),
        method: methodRadio ? methodRadio.value : 'Cash',
        description: rootElement.querySelector('#exp-desc').value
      };

      import('../services/DataProvider.js').then(({ DataProvider }) => {
        try {
          DataProvider.saveExpense(expense);
          window.location.reload();
        } catch (err) {
          alert(err.message);
        }
      });
    });
  }
}
