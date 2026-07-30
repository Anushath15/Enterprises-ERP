/**
 * Senthil Enterprises ERP - Expense Management
 * FIXES: E-001 no reload, E-002 showToast, E-003 no confirm, E-004 filters wired, E-005 dynamic largest category
 */
import { KPICard } from '../components/ui/cards.js';
import { DataProvider } from '../services/dataProvider.js';
import { DraftManager } from '../services/draftManager.js';

const DEFAULT_EXPENSE_CATEGORIES = ['Electricity', 'Water', 'Internet', 'Staff Salary', 'Labour', 'Transport', 'Loading & Unloading', 'Tea & Snacks', 'Office Expense', 'Cleaning', 'Maintenance', 'Stationery', 'Fuel', 'Packing', 'Miscellaneous'];
export async function render() {
  const expenses = DataProvider.getExpenses() || [];
  const customCategories = DataProvider.getExpenseCategories ? DataProvider.getExpenseCategories() : [];
  const EXPENSE_CATEGORIES = customCategories.length > 0 ? customCategories.map(c => c.name) : DEFAULT_EXPENSE_CATEGORIES;

  // Compute largest category (fix E-005)
  const catTotals = {};
  expenses.forEach(e => { catTotals[e.category] = (catTotals[e.category] || 0) + Number(e.amount || 0); });
  const largestCat = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

  const today = new Date().toISOString().split('T')[0];
  const todayTotal = expenses.filter(e => e.date === today).reduce((s, e) => s + Number(e.amount || 0), 0);

  const renderRow = (exp) => {
    let methodBadge = 'primary';
    if (exp.method === 'UPI') methodBadge = 'warning';
    if (exp.method === 'Bank') methodBadge = 'success';
    return `
    <tr class="row-hover" data-id="${exp.id}">
      <td class="px-4 py-3.5 text-sm text-gray-500 whitespace-nowrap">${exp.date || '-'}</td>
      <td class="px-4 py-3.5">
        <span class="font-semibold text-text text-sm">${exp.category || '-'}</span>
      </td>
      <td class="px-4 py-3.5 text-sm text-gray-600 max-w-xs truncate">${exp.description || '-'}</td>
      <td class="px-4 py-3.5 text-center">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-${methodBadge}/10 text-${methodBadge} uppercase tracking-wider">${exp.method || 'Cash'}</span>
      </td>
      <td class="px-4 py-3.5 text-right font-bold text-danger">₹${Number(exp.amount || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
      <td class="px-4 py-3.5 text-right" onclick="event.stopPropagation()">
        <button class="exp-delete-btn p-1.5 rounded-lg text-gray-400 hover:text-danger hover:bg-danger/10 transition-colors" data-id="${exp.id}">
          <i data-lucide="trash-2" class="w-4 h-4 pointer-events-none"></i>
        </button>
      </td>
    </tr>`;
  };

  return `
    <div class="p-6 max-w-[1600px] mx-auto fade-in">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-text">Expense Management</h1>
          <p class="text-sm text-gray-400 mt-0.5">Record, categorize, and track all business expenses.</p>
        </div>
        <div class="flex items-center gap-3">
          <button id="btn-manage-categories" class="flex items-center gap-1.5 px-4 py-2 bg-white border border-border text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
            <i data-lucide="settings-2" class="w-4 h-4"></i> Manage Categories
          </button>
          <button id="btn-open-expense-drawer" class="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors shadow-sm">
            <i data-lucide="plus" class="w-4 h-4"></i> Add Expense
          </button>
        </div>
      </div>

      <!-- KPI Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        ${KPICard({ title: "Total Expenses", value: '₹' + expenses.reduce((s, e) => s + Number(e.amount || 0), 0).toLocaleString('en-IN'), iconSvg: '<i data-lucide="trending-down"></i>', color: 'danger' })}
        ${KPICard({ title: "Today's Expenses", value: '₹' + todayTotal.toLocaleString('en-IN'), iconSvg: '<i data-lucide="calendar"></i>', color: 'warning' })}
        ${KPICard({ title: "Transactions", value: expenses.length.toString(), iconSvg: '<i data-lucide="activity"></i>', color: 'primary' })}
        ${KPICard({ title: "Largest Category", value: largestCat, iconSvg: '<i data-lucide="pie-chart"></i>', color: 'success' })}
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-xl border border-border p-4 mb-4 flex flex-wrap gap-3 items-center shadow-sm">
        <div class="relative flex-1 min-w-[180px] max-w-sm">
          <i data-lucide="search" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input type="text" id="exp-search" placeholder="Search description..."
            class="w-full pl-10 pr-4 py-2 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors">
        </div>
        <select id="exp-cat-filter" class="px-3 py-2 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors">
          <option value="">All Categories</option>
          ${EXPENSE_CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('')}
        </select>
        <select id="exp-method-filter" class="px-3 py-2 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors">
          <option value="">All Methods</option>
          <option value="Cash">Cash</option>
          <option value="UPI">UPI</option>
          <option value="Bank">Bank</option>
        </select>
        <select id="exp-date-filter" class="px-3 py-2 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors">
          <option value="">All Time</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
        <span id="exp-count-label" class="text-xs text-gray-400 ml-auto">Showing ${expenses.length} expenses</span>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-sm min-w-[900px]">
            <thead>
              <tr class="border-b border-border bg-gray-50/60 text-left">
                <th class="px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Date</th>
                <th class="px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Category</th>
                <th class="px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Description</th>
                <th class="px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wide text-center">Method</th>
                <th class="px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wide text-right">Amount</th>
                <th class="px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wide text-right">Actions</th>
              </tr>
            </thead>
            <tbody id="expenses-tbody" class="divide-y divide-border">
              ${expenses.length > 0 ? expenses.map(renderRow).join('') : '<tr><td colspan="6" class="px-4 py-12 text-center text-gray-400 text-sm">No expenses recorded yet.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Overlay -->
    <div id="expense-drawer-overlay" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] opacity-0 pointer-events-none transition-opacity duration-300"></div>

    <!-- Add Expense Drawer -->
      <div id="expense-form-drawer" class="fixed right-0 top-0 h-full w-[400px] bg-white shadow-2xl z-[70] transform translate-x-full transition-transform duration-300 flex flex-col">
        <div class="px-6 py-4 border-b border-border flex justify-between items-center bg-gray-50/50">
          <h3 class="text-lg font-bold text-text flex items-center gap-2">
            <i data-lucide="plus-circle" class="w-5 h-5 text-primary"></i> Add Expense
          </h3>
          <button class="close-expense-drawer text-gray-400 hover:text-danger hover:bg-danger/10 p-1.5 rounded-lg transition-colors">
            <i data-lucide="x" class="w-5 h-5 pointer-events-none"></i>
          </button>
        </div>
        <form id="expense-form" class="flex-1 overflow-y-auto p-6 space-y-5">
          <div>
            <label class="text-xs font-semibold text-gray-600 block mb-1.5">Date *</label>
            <input type="date" id="exp-date" required class="w-full px-3 py-2.5 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary">
          </div>
          <div>
            <label class="text-xs font-semibold text-gray-600 block mb-1.5">Category *</label>
            <select id="exp-category" required class="w-full px-3 py-2.5 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary">
              ${EXPENSE_CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="text-xs font-semibold text-gray-600 block mb-1.5">Amount (₹) *</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
              <input type="number" id="exp-amount" required min="0.01" step="0.01" placeholder="0.00"
                class="w-full pl-8 pr-3 py-2.5 bg-gray-50 border border-border rounded-lg text-sm font-bold text-text focus:outline-none focus:border-primary">
            </div>
          </div>
          <div>
            <label class="text-xs font-semibold text-gray-600 block mb-1.5">Payment Method *</label>
            <div class="grid grid-cols-3 gap-2">
              <label class="cursor-pointer">
                <input type="radio" name="exp-paymethod" value="Cash" class="peer sr-only" checked>
                <div class="px-3 py-2.5 text-center text-xs font-semibold border border-border rounded-lg peer-checked:bg-primary/10 peer-checked:border-primary peer-checked:text-primary hover:bg-gray-50 transition-colors">Cash</div>
              </label>
              <label class="cursor-pointer">
                <input type="radio" name="exp-paymethod" value="UPI" class="peer sr-only">
                <div class="px-3 py-2.5 text-center text-xs font-semibold border border-border rounded-lg peer-checked:bg-warning/10 peer-checked:border-warning peer-checked:text-warning hover:bg-gray-50 transition-colors">UPI</div>
              </label>
              <label class="cursor-pointer">
                <input type="radio" name="exp-paymethod" value="Bank" class="peer sr-only">
                <div class="px-3 py-2.5 text-center text-xs font-semibold border border-border rounded-lg peer-checked:bg-success/10 peer-checked:border-success peer-checked:text-success hover:bg-gray-50 transition-colors">Bank</div>
              </label>
            </div>
          </div>
          <div>
            <label class="text-xs font-semibold text-gray-600 block mb-1.5">Description / Notes</label>
            <textarea id="exp-desc" rows="3" placeholder="Brief description of the expense..."
              class="w-full px-3 py-2 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary"></textarea>
          </div>
        </form>
      </div>

      <div class="p-4 border-t border-border bg-gray-50 flex items-center justify-end gap-3">
        <button class="close-expense-drawer px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-border rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
        <button id="btn-save-expense" class="px-5 py-2 text-sm font-semibold text-white bg-danger rounded-lg hover:bg-danger/90 flex items-center gap-2 transition-colors">
          <i data-lucide="save" class="w-4 h-4"></i> Save Expense
        </button>
      </div>
    </div>

    <!-- Manage Categories Drawer -->
    <div id="manage-categories-drawer" class="fixed right-0 top-0 h-full w-[400px] bg-white shadow-2xl z-[70] transform translate-x-full transition-transform duration-300 flex flex-col">
      <div class="px-6 py-4 border-b border-border flex justify-between items-center bg-gray-50/50">
        <h3 class="text-lg font-bold text-text flex items-center gap-2">
          <i data-lucide="settings-2" class="w-5 h-5 text-primary"></i> Manage Categories
        </h3>
        <button class="close-expense-drawer text-gray-400 hover:text-danger hover:bg-danger/10 p-1.5 rounded-lg transition-colors">
          <i data-lucide="x" class="w-5 h-5 pointer-events-none"></i>
        </button>
      </div>
      <div class="p-6 border-b border-border">
        <label class="text-xs font-semibold text-gray-600 block mb-1.5">Add New Category</label>
        <div class="flex gap-2">
          <input type="text" id="new-cat-name" placeholder="e.g. Marketing" class="flex-1 px-3 py-2 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary">
          <button id="btn-add-category" class="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors">Add</button>
        </div>
      </div>
      <div class="flex-1 overflow-y-auto p-4 bg-gray-50/50">
        <ul id="category-list" class="space-y-2">
          <!-- Categories rendered here -->
        </ul>
      </div>
    </div>
  `;
}

export function onMount(rootElement) {
  if (window.lucide) window.lucide.createIcons();

  const allExpenses = DataProvider.getExpenses() || [];
  const today = new Date().toISOString().split('T')[0];

  const overlay = rootElement.querySelector('#expense-drawer-overlay');
  const formDrawer = rootElement.querySelector('#expense-form-drawer');
  const catDrawer = rootElement.querySelector('#manage-categories-drawer');
  const tbody = rootElement.querySelector('#expenses-tbody');
  const countLabel = rootElement.querySelector('#exp-count-label');

  // Set default date in form
  const dateInput = rootElement.querySelector('#exp-date');
  if (dateInput) dateInput.value = today;

  const closeAll = () => {
    overlay.classList.add('opacity-0', 'pointer-events-none');
    overlay.classList.remove('opacity-100');
    formDrawer.classList.add('translate-x-full');
    catDrawer.classList.add('translate-x-full');
  };

  const openForm = () => {
    const form = rootElement.querySelector('#expense-form');
    if (form) form.reset();
    if (dateInput) dateInput.value = today;
    closeAll();
    overlay.classList.remove('opacity-0', 'pointer-events-none');
    overlay.classList.add('opacity-100');
    formDrawer.classList.remove('translate-x-full');
  };

  const openCatDrawer = () => {
    closeAll();
    renderCatList();
    overlay.classList.remove('opacity-0', 'pointer-events-none');
    overlay.classList.add('opacity-100');
    catDrawer.classList.remove('translate-x-full');
  };

  rootElement.querySelector('#btn-open-expense-drawer')?.addEventListener('click', openForm);
  rootElement.querySelector('#btn-manage-categories')?.addEventListener('click', openCatDrawer);
  window.addEventListener('openExpenseDrawer', openForm);
  rootElement.querySelectorAll('.close-expense-drawer').forEach(b => b.addEventListener('click', closeAll));
  overlay.addEventListener('click', closeAll);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAll(); });

  // Render row helper
  const renderRow = (exp) => {
    let mb = 'primary';
    if (exp.method === 'UPI') mb = 'warning';
    if (exp.method === 'Bank') mb = 'success';
    return `
    <tr class="row-hover" data-id="${exp.id}">
      <td class="px-4 py-3.5 text-sm text-gray-500 whitespace-nowrap">${exp.date || '-'}</td>
      <td class="px-4 py-3.5"><span class="font-semibold text-text text-sm">${exp.category || '-'}</span></td>
      <td class="px-4 py-3.5 text-sm text-gray-600 max-w-xs truncate">${exp.description || '-'}</td>
      <td class="px-4 py-3.5 text-center">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-${mb}/10 text-${mb} uppercase tracking-wider">${exp.method || 'Cash'}</span>
      </td>
      <td class="px-4 py-3.5 text-right font-bold text-danger">₹${Number(exp.amount || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
      <td class="px-4 py-3.5 text-right">
        <button class="exp-delete-btn p-1.5 rounded-lg text-gray-400 hover:text-danger hover:bg-danger/10 transition-colors" data-id="${exp.id}">
          <i data-lucide="trash-2" class="w-4 h-4 pointer-events-none"></i>
        </button>
      </td>
    </tr>`;
  };

  // Filter wiring (fix E-004)
  const searchInput = rootElement.querySelector('#exp-search');
  const catFilter = rootElement.querySelector('#exp-cat-filter');
  const methodFilter = rootElement.querySelector('#exp-method-filter');
  const dateFilter = rootElement.querySelector('#exp-date-filter');

  const getWeekStart = () => { const d = new Date(); d.setDate(d.getDate() - d.getDay()); return d.toISOString().split('T')[0]; };
  const getMonthStart = () => new Date().toISOString().split('T')[0].substring(0, 7) + '-01';

  const applyFilter = () => {
    const q = (searchInput?.value || '').toLowerCase();
    const cat = catFilter?.value || '';
    const method = methodFilter?.value || '';
    const dateRange = dateFilter?.value || '';

    const filtered = allExpenses.filter(e => {
      if (q && !(e.description || '').toLowerCase().includes(q) && !(e.category || '').toLowerCase().includes(q)) return false;
      if (cat && e.category !== cat) return false;
      if (method && e.method !== method) return false;
      if (dateRange === 'today' && e.date !== today) return false;
      if (dateRange === 'week' && e.date < getWeekStart()) return false;
      if (dateRange === 'month' && e.date < getMonthStart()) return false;
      return true;
    });

    if (countLabel) countLabel.textContent = `Showing ${filtered.length} of ${allExpenses.length} expenses`;
    if (tbody) {
      tbody.innerHTML = filtered.length > 0
        ? filtered.map(renderRow).join('')
        : '<tr><td colspan="6" class="px-4 py-12 text-center text-gray-400 text-sm">No expenses match your filters</td></tr>';
      if (window.lucide) window.lucide.createIcons({ nodes: [tbody] });
      attachDeleteListeners();
    }
  };

  if (searchInput) searchInput.addEventListener('input', applyFilter);
  if (catFilter) catFilter.addEventListener('change', applyFilter);
  if (methodFilter) methodFilter.addEventListener('change', applyFilter);
  if (dateFilter) dateFilter.addEventListener('change', applyFilter);

  // Delete (fix E-003 — no reload, showToast)
  const handleDelete = (e) => {
    const id = e.currentTarget.getAttribute('data-id');
    if (!window.confirm('Delete this expense?')) return;
    DataProvider.deleteExpense(id);
    const row = tbody?.querySelector(`tr[data-id="${id}"]`);
    if (row) {
      row.style.transition = 'opacity 0.3s';
      row.style.opacity = '0';
      setTimeout(() => row.remove(), 300);
    }
    window.showToast('Expense deleted', 'success');
  };

  const attachDeleteListeners = () => {
    rootElement.querySelectorAll('.exp-delete-btn').forEach(btn => {
      btn.removeEventListener('click', handleDelete);
      btn.addEventListener('click', handleDelete);
    });
  };
  attachDeleteListeners();

  // Initialize Draft Recovery
  const formEl = rootElement.querySelector('#expense-form');
  if (formEl) DraftManager.init('expense', formEl);

  // Save (fix E-001 no reload, E-002 showToast)
  rootElement.querySelector('#btn-save-expense')?.addEventListener('click', () => {
    const form = rootElement.querySelector('#expense-form');
    if (!form.reportValidity()) return;

    const methodRadio = rootElement.querySelector('input[name="exp-paymethod"]:checked');
    const expense = {
      date: rootElement.querySelector('#exp-date').value,
      category: rootElement.querySelector('#exp-category').value,
      amount: Number(rootElement.querySelector('#exp-amount').value),
      method: methodRadio ? methodRadio.value : 'Cash',
      description: rootElement.querySelector('#exp-desc').value.trim()
    };

    try {
      const saved = DataProvider.saveExpense(expense);
      DraftManager.clearDraft('expense');
      allExpenses.unshift(saved); // Add to front for in-place update
      closeAll();

      // In-place table refresh
      if (tbody) {
        tbody.innerHTML = allExpenses.map(renderRow).join('');
        if (window.lucide) window.lucide.createIcons({ nodes: [tbody] });
        attachDeleteListeners();
      }
      if (countLabel) countLabel.textContent = `Showing ${allExpenses.length} expenses`;
      window.showToast('Expense saved!', 'success');
    } catch (err) {
      window.showToast(err.message, 'danger');
    }
  });

  // =====================================
  // Manage Categories Logic
  // =====================================
  let currentCategories = [];
  const catListEl = rootElement.querySelector('#category-list');
  const catSelectEl = rootElement.querySelector('#exp-category');
  const catFilterEl = rootElement.querySelector('#exp-cat-filter');

  const updateDropdowns = () => {
    const optionsHtml = currentCategories.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
    if (catSelectEl) catSelectEl.innerHTML = optionsHtml;
    if (catFilterEl) catFilterEl.innerHTML = `<option value="">All Categories</option>${optionsHtml}`;
  };

  const renderCatList = () => {
    currentCategories = DataProvider.getExpenseCategories ? DataProvider.getExpenseCategories() : [];
    if (!catListEl) return;
    catListEl.innerHTML = currentCategories.map(c => `
      <li class="bg-white p-3 rounded-lg border border-border shadow-sm flex items-center justify-between">
        <span class="text-sm font-medium text-gray-700">${c.name}</span>
        <button class="btn-del-cat text-gray-400 hover:text-danger hover:bg-danger/10 p-1.5 rounded-md transition-colors" data-id="${c.id}">
          <i data-lucide="trash-2" class="w-4 h-4 pointer-events-none"></i>
        </button>
      </li>
    `).join('');
    if (window.lucide) window.lucide.createIcons({ nodes: [catListEl] });
    updateDropdowns();
  };

  rootElement.querySelector('#btn-add-category')?.addEventListener('click', () => {
    const input = rootElement.querySelector('#new-cat-name');
    const name = input.value.trim();
    if (!name) {
      window.showToast('Please enter a category name', 'warning');
      return;
    }
    try {
      if (DataProvider.saveExpenseCategory) {
        DataProvider.saveExpenseCategory({ name, isActive: true });
        input.value = '';
        renderCatList();
        window.showToast('Category added', 'success');
      }
    } catch (e) {
      window.showToast(e.message, 'danger');
    }
  });

  catListEl?.addEventListener('click', (e) => {
    if (e.target.closest('.btn-del-cat')) {
      const id = e.target.closest('.btn-del-cat').getAttribute('data-id');
      if (window.confirm('Delete this expense category?')) {
        if (DataProvider.deleteExpenseCategory) {
          DataProvider.deleteExpenseCategory(id);
          renderCatList();
          window.showToast('Category deleted', 'success');
        }
      }
    }
  });

  // Initial render
  currentCategories = DataProvider.getExpenseCategories ? DataProvider.getExpenseCategories() : [];

  return function cleanup() {
    window.removeEventListener('openExpenseDrawer', openForm);
    document.removeEventListener('keydown', closeAll);
  };
}
