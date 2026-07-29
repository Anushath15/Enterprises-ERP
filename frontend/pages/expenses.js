/**
 * Senthil Enterprises ERP - Expense Management
 * FIXES: E-001 no reload, E-002 showToast, E-003 no confirm, E-004 filters wired, E-005 dynamic largest category
 */
import { KPICard } from '../components/ui/cards.js';
import { DataProvider } from '../services/dataProvider.js';

const EXPENSE_CATEGORIES = ['Electricity', 'Water', 'Internet', 'Staff Salary', 'Labour', 'Transport', 'Loading & Unloading', 'Stationery', 'Tea & Snacks', 'Maintenance', 'Rent', 'Other'];

export async function render() {
  const expenses = DataProvider.getExpenses() || [];

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
        <button id="btn-open-expense-drawer" class="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors">
          <i data-lucide="plus" class="w-4 h-4"></i> Add Expense
        </button>
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
    <aside id="expense-form-drawer" class="fixed top-0 right-0 h-screen w-[480px] bg-white border-l border-border z-[70] shadow-2xl flex flex-col transform translate-x-full transition-transform duration-300">
      <div class="flex items-center justify-between px-6 py-4 border-b border-border bg-white">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-danger/10 rounded-lg text-danger">
            <i data-lucide="receipt" class="w-4 h-4"></i>
          </div>
          <h3 class="text-base font-bold text-text">Record Expense</h3>
        </div>
        <button class="close-expense-drawer p-1.5 rounded-lg text-gray-400 hover:text-danger hover:bg-danger/10 transition-colors">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>

      <div class="p-6 flex-1 overflow-y-auto space-y-5">
        <form id="expense-form" class="space-y-4">
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
    </aside>
  `;
}

export function onMount(rootElement) {
  if (window.lucide) window.lucide.createIcons();

  const allExpenses = DataProvider.getExpenses() || [];
  const today = new Date().toISOString().split('T')[0];

  const overlay = rootElement.querySelector('#expense-drawer-overlay');
  const formDrawer = rootElement.querySelector('#expense-form-drawer');
  const tbody = rootElement.querySelector('#expenses-tbody');
  const countLabel = rootElement.querySelector('#exp-count-label');

  // Set default date in form
  const dateInput = rootElement.querySelector('#exp-date');
  if (dateInput) dateInput.value = today;

  const closeAll = () => {
    overlay.classList.add('opacity-0', 'pointer-events-none');
    overlay.classList.remove('opacity-100');
    formDrawer.classList.add('translate-x-full');
  };

  const openForm = () => {
    const form = rootElement.querySelector('#expense-form');
    if (form) form.reset();
    if (dateInput) dateInput.value = today;
    overlay.classList.remove('opacity-0', 'pointer-events-none');
    overlay.classList.add('opacity-100');
    formDrawer.classList.remove('translate-x-full');
  };

  rootElement.querySelector('#btn-open-expense-drawer')?.addEventListener('click', openForm);
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

  return function cleanup() {
    window.removeEventListener('openExpenseDrawer', openForm);
  };
}
