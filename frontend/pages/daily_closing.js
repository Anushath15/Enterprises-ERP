/**
 * Senthil Enterprises ERP - Daily Closing
 */
import { KPICard } from '../components/ui/cards.js';
import { PrimaryButton } from '../components/ui/buttons.js';
import { DataProvider } from '../services/DataProvider.js';

export async function render() {
  const currentDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const invoices = DataProvider.getSalesInvoices() || [];
  const expenses = DataProvider.getExpenses() || [];
  
  const cashSales = invoices.filter(i => i.paymentMethod === 'Cash').reduce((sum, i) => sum + (i.total || 0), 0);
  const digitalSales = invoices.filter(i => i.paymentMethod === 'UPI' || i.paymentMethod === 'Card' || i.paymentMethod === 'Bank Transfer').reduce((sum, i) => sum + (i.total || 0), 0);
  const creditSales = invoices.filter(i => i.paymentMethod === 'Credit').reduce((sum, i) => sum + (i.total || 0), 0);
  
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const openingCash = 15000;
  
  const creditCollectionsCash = 0; // Placeholder for now
  const supplierPaymentsCash = 0; // Placeholder for now
  
  const expectedCash = openingCash + cashSales + creditCollectionsCash - totalExpenses - supplierPaymentsCash;
  const totalCollections = cashSales + digitalSales + creditCollectionsCash;

  return \`
    <div class="p-6 max-w-[1200px] mx-auto fade-in">
      <div class="flex items-center justify-between mb-8 pb-4 border-b border-border">
        <div>
          <h1 class="text-2xl font-bold text-text">Daily Closing & Cash Reconciliation</h1>
          <p class="text-sm text-gray-400 mt-1">End-of-day business closing by comparing system totals with physical cash.</p>
        </div>
        <div class="text-right">
          <p class="text-xs text-gray-400 font-medium uppercase tracking-wide">Business Date</p>
          <p class="text-lg font-semibold text-text">\${currentDate}</p>
        </div>
      </div>

      <!-- Quick Summary -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        \${KPICard({ title: 'Total Collections Today', value: '₹' + totalCollections.toLocaleString('en-IN'), iconSvg: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>', color: 'success' })}
        \${KPICard({ title: 'Total Sales Count', value: invoices.length + ' Invoices', iconSvg: '<path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"/>', color: 'primary' })}
        \${KPICard({ title: 'Total Expenses', value: '₹' + totalExpenses.toLocaleString('en-IN'), iconSvg: '<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"/>', color: 'danger' })}
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        <!-- Left Side: System Calculated Values -->
        <div class="space-y-6">
          <div class="bg-white rounded-xl border border-border overflow-hidden">
            <div class="p-4 border-b border-border bg-gray-50 flex items-center justify-between">
              <h3 class="font-semibold text-text">System Register (Calculated)</h3>
              <span class="text-xs text-gray-500 font-medium">Read-only</span>
            </div>
            <div class="p-5 space-y-4">
              <div class="flex justify-between items-center text-sm">
              <div class="flex justify-between items-center text-sm">
                <span class="text-gray-500">Opening Cash (from yesterday)</span>
                <span class="font-medium text-text">₹\${openingCash.toLocaleString('en-IN')}</span>
              </div>
              <div class="w-full h-px bg-border/50"></div>
              
              <div class="flex justify-between items-center text-sm">
                <span class="text-gray-500">Cash Sales</span>
                <span class="font-medium text-success">+ ₹\${cashSales.toLocaleString('en-IN')}</span>
              </div>
              <div class="flex justify-between items-center text-sm">
                <span class="text-gray-500">Credit Collections (Cash)</span>
                <span class="font-medium text-success">+ ₹\${creditCollectionsCash.toLocaleString('en-IN')}</span>
              </div>
              
              <div class="flex justify-between items-center text-sm pt-2">
                <span class="text-gray-500">UPI / Digital Sales</span>
                <span class="font-medium text-primary">₹\${digitalSales.toLocaleString('en-IN')}</span>
              </div>
              <div class="flex justify-between items-center text-sm">
                <span class="text-gray-500">Credit Sales (Unpaid)</span>
                <span class="font-medium text-warning">₹\${creditSales.toLocaleString('en-IN')}</span>
              </div>

              <div class="w-full h-px bg-border/50"></div>
              
              <div class="flex justify-between items-center text-sm">
                <span class="text-gray-500">Expenses</span>
                <span class="font-medium text-danger">- ₹\${totalExpenses.toLocaleString('en-IN')}</span>
              </div>
              <div class="flex justify-between items-center text-sm">
                <span class="text-gray-500">Supplier Payments (Cash)</span>
                <span class="font-medium text-danger">- ₹\${supplierPaymentsCash.toLocaleString('en-IN')}</span>
              </div>

            </div>
            <div class="p-5 bg-gray-50/50 border-t border-border flex justify-between items-center">
              <div>
                <p class="text-xs text-gray-500 uppercase tracking-wide font-medium">Expected Physical Cash</p>
                <p class="text-[10px] text-gray-400">Opening + Cash In - Cash Out</p>
              </div>
              <span class="text-xl font-bold text-primary" id="system-expected-cash" data-value="\${expectedCash}">₹\${expectedCash.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        <!-- Right Side: Physical Reconciliation Form -->
        <div class="space-y-6">
          <div class="bg-white rounded-xl border border-border p-6 shadow-sm">
            <h3 class="font-semibold text-text mb-4">Physical Cash Reconciliation</h3>
            
            <div class="space-y-5">
              <div>
                <label class="text-sm font-medium text-gray-600 block mb-1.5">Actual Cash in Drawer</label>
                <div class="relative">
                  <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
                  <input type="number" id="actual-cash" value="\${expectedCash}" class="w-full pl-9 pr-4 py-3 bg-gray-50 border border-border rounded-lg text-lg font-semibold text-text focus:outline-none focus:border-primary transition-colors">
                </div>
              </div>

              <div class="p-4 rounded-lg bg-gray-50 border border-border flex items-center justify-between" id="difference-box">
                <span class="text-sm font-medium text-gray-600">Difference (Short/Excess)</span>
                <span class="text-lg font-bold text-gray-400" id="difference-amount">₹0</span>
              </div>

              <div>
                <label class="text-sm font-medium text-gray-600 block mb-1.5">Closing Remarks / Notes</label>
                <textarea rows="3" placeholder="Add any notes about expenses or shortfalls..." class="w-full px-4 py-3 bg-gray-50 border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary"></textarea>
              </div>

              <div class="pt-4 border-t border-border">
                <button class="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-primary text-white text-base font-semibold rounded-lg hover:bg-primary/90 transition-colors shadow-sm">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/></svg>
                  Confirm & Close Day
                </button>
                <p class="text-center text-xs text-gray-400 mt-3">Once closed, today's transactions cannot be modified.</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `;
}

export function onMount(rootElement) {
  const actualCashInput = rootElement.querySelector('#actual-cash');
  const differenceAmount = rootElement.querySelector('#difference-amount');
  const differenceBox = rootElement.querySelector('#difference-box');
  const expectedCashEl = rootElement.querySelector('#system-expected-cash');
  const expectedCash = expectedCashEl ? parseFloat(expectedCashEl.dataset.value) : 0;

  if(actualCashInput) {
    actualCashInput.addEventListener('input', (e) => {
      const actual = parseFloat(e.target.value) || 0;
      const diff = actual - expectedCash;
      
      differenceAmount.textContent = (diff > 0 ? '+ ' : diff < 0 ? '- ' : '') + '₹' + Math.abs(diff).toLocaleString('en-IN');
      
      if (diff === 0) {
        differenceAmount.className = 'text-lg font-bold text-success';
        differenceBox.className = 'p-4 rounded-lg bg-success/5 border border-success/20 flex items-center justify-between';
      } else if (diff < 0) {
        differenceAmount.className = 'text-lg font-bold text-danger';
        differenceBox.className = 'p-4 rounded-lg bg-danger/5 border border-danger/20 flex items-center justify-between';
      } else {
        differenceAmount.className = 'text-lg font-bold text-warning';
        differenceBox.className = 'p-4 rounded-lg bg-warning/5 border border-warning/20 flex items-center justify-between';
      }
    });
    
    // trigger initial color state
    actualCashInput.dispatchEvent(new Event('input'));
  }
}
