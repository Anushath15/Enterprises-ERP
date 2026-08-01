import { NotificationService } from '../services/notificationService.js';
/**
 * Senthil Enterprises ERP - Daily Closing (Accounting View)
 */
import { DataProvider } from '../services/dataProvider.js';
import { DraftManager } from '../services/draftManager.js';

export async function render() {
  const currentDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const invoices = DataProvider.getSalesInvoices() || [];
  const expenses = DataProvider.getExpenses() || [];
  
  const cashSales = invoices.filter(i => i.paymentMethod === 'Cash' || i.paymentMode === 'Cash').reduce((sum, i) => sum + (i.totalAmount || i.total || 0), 0);
  const upiSales = invoices.filter(i => (i.paymentMethod || i.paymentMode) === 'UPI').reduce((sum, i) => sum + (i.totalAmount || i.total || 0), 0);
  const cardSales = invoices.filter(i => (i.paymentMethod || i.paymentMode) === 'Card').reduce((sum, i) => sum + (i.totalAmount || i.total || 0), 0);
  const creditSales = invoices.filter(i => (i.paymentMethod || i.paymentMode) === 'Credit').reduce((sum, i) => sum + (i.totalAmount || i.total || 0), 0);
  
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const openingCash = Number(localStorage.getItem('erp_opening_cash') || 15000);
  
  // Advanced features placeholder
  const creditCollectionsCash = 0; 
  const supplierPaymentsCash = 0; 
  
  const expectedCash = openingCash + cashSales + creditCollectionsCash - totalExpenses - supplierPaymentsCash;
  const totalCollections = cashSales + upiSales + cardSales + creditCollectionsCash;

  return `
    <div class="p-6 max-w-[1400px] mx-auto fade-in pb-20">
      
      <!-- Accounting Header -->
      <div class="bg-white erp-card p-6 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center border-t-4 border-t-primary">
        <div>
          <h1 class="text-2xl font-bold text-text mb-1">Day Book & Cash Reconciliation</h1>
          <p class="text-sm text-gray-500 flex items-center gap-2">
            <span>Senthil Enterprises • Statement for ${currentDate}</span>
            <span class="w-1 h-1 rounded-full bg-gray-300"></span>
            <span id="live-clock" class="font-mono text-primary font-medium"></span>
          </p>
        </div>
        <div class="mt-4 md:mt-0 flex gap-3">
          <button id="dc-print-btn" class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg flex items-center gap-2">
            <i data-lucide="printer" class="w-4 h-4"></i> Print Statement
          </button>
        </div>
      </div>

      <!-- Closing Banner -->
      <div class="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3 shadow-sm">
        <i data-lucide="info" class="w-5 h-5 text-blue-500 shrink-0 mt-0.5"></i>
        <div>
          <h4 class="text-sm font-bold text-blue-900">End of Day Procedure</h4>
          <p class="text-sm text-blue-700 mt-1">Please verify all physical cash in the till matches the System Expected Cash. Any difference must be logged with remarks before closing the day.</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <!-- Left Pane: Ledger Book -->
        <div class="lg:col-span-8 space-y-6">
          <div class="erp-card bg-white overflow-hidden">
            <div class="bg-gray-50 border-b border-border px-6 py-4 flex justify-between items-center">
              <h3 class="font-semibold text-gray-700 flex items-center gap-2">
                <i data-lucide="book-open" class="w-4 h-4 text-primary"></i> 
                Cash Ledger Account
              </h3>
              <span class="status-badge status-info">System Calculated</span>
            </div>
            
            <table class="w-full text-sm">
              <thead>
                <tr>
                  <th class="w-1/2 text-left border-r border-border">Receipts (Cash In)</th>
                  <th class="w-1/2 text-left">Payments (Cash Out)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="p-0 align-top border-r border-border">
                    <div class="px-6 py-3 flex justify-between border-b border-gray-100">
                      <span class="text-gray-600">Opening Balance b/d</span>
                      <span class="font-medium text-text">₹${openingCash.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                    </div>
                    <div class="px-6 py-3 flex justify-between border-b border-gray-100 bg-green-50/30">
                      <span class="text-gray-600">Cash Sales</span>
                      <span class="font-medium text-success">₹${cashSales.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                    </div>
                    <div class="px-6 py-3 flex justify-between border-b border-gray-100 bg-green-50/30">
                      <span class="text-gray-600">Customer Collections (Cash)</span>
                      <span class="font-medium text-success">₹${creditCollectionsCash.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                    </div>
                    <div class="px-6 py-8"></div>
                  </td>
                  <td class="p-0 align-top">
                    <div class="px-6 py-3 flex justify-between border-b border-gray-100 bg-red-50/30">
                      <span class="text-gray-600">Total Expenses</span>
                      <span class="font-medium text-danger">₹${totalExpenses.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                    </div>
                    <div class="px-6 py-3 flex justify-between border-b border-gray-100 bg-red-50/30">
                      <span class="text-gray-600">Dealer Payments (Cash)</span>
                      <span class="font-medium text-danger">₹${supplierPaymentsCash.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                    </div>
                    <div class="px-6 py-3 flex justify-between border-b border-gray-100">
                      <span class="font-semibold text-gray-800">Closing Balance c/d (Expected)</span>
                      <span class="font-bold text-primary">₹${expectedCash.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                    </div>
                  </td>
                </tr>
              </tbody>
              <tfoot class="bg-gray-50 border-t border-border font-bold">
                <tr>
                  <td class="px-6 py-4 border-r border-border flex justify-between">
                    <span>Total</span>
                    <span>₹${(openingCash + cashSales + creditCollectionsCash).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                  </td>
                  <td class="px-6 py-4 flex justify-between">
                    <span>Total</span>
                    <span>₹${(totalExpenses + supplierPaymentsCash + expectedCash).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          
          <!-- Non-Cash Memo -->
          <div class="erp-card bg-white p-6">
            <h3 class="font-semibold text-gray-700 mb-4 border-b border-border pb-2">Non-Cash Transactions (Memo)</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="p-4 rounded-lg bg-indigo-50 border border-indigo-100 flex flex-col">
                <span class="text-xs font-semibold text-indigo-600 uppercase mb-1">UPI Sales</span>
                <span class="text-xl font-bold text-indigo-900">₹${upiSales.toLocaleString('en-IN')}</span>
              </div>
              <div class="p-4 rounded-lg bg-orange-50 border border-orange-100 flex flex-col">
                <span class="text-xs font-semibold text-orange-600 uppercase mb-1">Card Sales</span>
                <span class="text-xl font-bold text-orange-900">₹${cardSales.toLocaleString('en-IN')}</span>
              </div>
              <div class="p-4 rounded-lg bg-gray-50 border border-gray-200 flex flex-col">
                <span class="text-xs font-semibold text-gray-600 uppercase mb-1">Credit Sales (Unpaid)</span>
                <span class="text-xl font-bold text-gray-900">₹${creditSales.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Pane: Physical Reconciliation -->
        <div class="lg:col-span-4 space-y-6">
          <div class="erp-card bg-white overflow-hidden shadow-lg border-primary/20">
            <div class="bg-primary/5 border-b border-primary/10 px-6 py-4">
              <h3 class="font-semibold text-primary flex items-center gap-2">
                <i data-lucide="wallet" class="w-5 h-5"></i> Physical Cash Drawer
              </h3>
            </div>
            
            <form id="daily-closing-form" class="p-6 space-y-5">
              <div class="bg-gray-50 p-4 rounded-lg border border-border text-center">
                <p class="text-sm text-gray-500 font-medium mb-1">Expected Cash</p>
                <p class="text-3xl font-bold text-gray-800" id="system-expected-cash" data-value="${expectedCash}">₹${expectedCash.toLocaleString('en-IN')}</p>
              </div>

              <div class="bg-white p-4 rounded-lg border border-border">
                <p class="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2"><i data-lucide="clock" class="w-4 h-4"></i> Business Session</p>
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="text-xs text-gray-500">Open Time</label>
                    <input type="time" id="session-open" class="w-full px-3 py-2 border rounded-lg text-sm focus:border-primary focus:outline-none">
                  </div>
                  <div>
                    <label class="text-xs text-gray-500">Close Time</label>
                    <input type="time" id="session-close" class="w-full px-3 py-2 border rounded-lg text-sm focus:border-primary focus:outline-none">
                  </div>
                </div>
              </div>

              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Actual Cash Counted <span class="text-danger">*</span></label>
                <div class="relative">
                  <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                  <input type="number" id="actual-cash" class="w-full pl-9 pr-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-xl font-bold text-text focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all text-right" placeholder="0.00">
                </div>
              </div>

              <div class="flex justify-between items-center p-4 rounded-lg border bg-white" id="difference-container">
                <span class="text-sm font-semibold text-gray-600">Difference</span>
                <span id="cash-difference" class="text-xl font-bold text-gray-400">₹0.00</span>
              </div>

              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Closing Remarks</label>
                <textarea id="closing-remarks" rows="2" class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" placeholder="Note any short/excess reasons..."></textarea>
              </div>
            </form>
            
            <div class="px-6 py-4 bg-gray-50 border-t border-border">
              <button id="close-day-btn" class="w-full py-3 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary/90 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2">
                <i data-lucide="lock" class="w-5 h-5"></i> Lock & Close Day
              </button>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  `;
}

export function onMount(rootElement) {
  if (window.lucide) window.lucide.createIcons();

  const clockEl = document.getElementById('live-clock');
  let clockInterval;
  if (clockEl) {
    const updateClock = () => {
      clockEl.textContent = new Date().toLocaleTimeString('en-IN');
    };
    updateClock();
    clockInterval = setInterval(updateClock, 1000);
  }

  const expectedCashEl = document.getElementById('system-expected-cash');
  const actualCashInput = document.getElementById('actual-cash');
  const differenceEl = document.getElementById('cash-difference');
  const diffContainer = document.getElementById('difference-container');
  const closeBtn = document.getElementById('close-day-btn');
  const printBtn = document.getElementById('dc-print-btn');

  const formEl = document.getElementById('daily-closing-form');
  if (formEl) DraftManager.init('dailyClosing', formEl);

  const sessionOpenEl = document.getElementById('session-open');
  const sessionCloseEl = document.getElementById('session-close');
  if (sessionOpenEl && sessionCloseEl) {
     const settings = JSON.parse(localStorage.getItem('erp_settings') || '{}');
     sessionOpenEl.value = settings.sessionOpen || '09:00';
     sessionCloseEl.value = settings.sessionClose || '21:00';
  }

  if (printBtn) {
    printBtn.addEventListener('click', () => window.print());
  }

  if (expectedCashEl && actualCashInput && differenceEl) {
    const expected = Number(expectedCashEl.getAttribute('data-value') || 0);

    actualCashInput.addEventListener('input', (e) => {
      const actual = Number(e.target.value) || 0;
      const diff = actual - expected;
      
      differenceEl.textContent = (diff > 0 ? '+ ₹' : '- ₹') + Math.abs(diff).toLocaleString('en-IN', {minimumFractionDigits:2});
      
      if (diff > 0) {
        differenceEl.className = 'text-xl font-bold text-success';
        diffContainer.className = 'flex justify-between items-center p-4 rounded-lg border bg-green-50 border-green-200';
      } else if (diff < 0) {
        differenceEl.className = 'text-xl font-bold text-danger';
        diffContainer.className = 'flex justify-between items-center p-4 rounded-lg border bg-red-50 border-red-200';
      } else if (e.target.value !== '') {
        differenceEl.className = 'text-xl font-bold text-gray-700';
        diffContainer.className = 'flex justify-between items-center p-4 rounded-lg border bg-gray-50 border-gray-300';
      } else {
        differenceEl.className = 'text-xl font-bold text-gray-400';
        diffContainer.className = 'flex justify-between items-center p-4 rounded-lg border bg-white';
      }
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
       if(!actualCashInput.value) {
         NotificationService.error("Please enter the Actual Cash Counted before closing.");
         actualCashInput.focus();
         return;
       }
       const remarks = document.getElementById('closing-remarks').value;
       const nextOpeningCash = actualCashInput.value;
       
       if(window.confirm(`Are you sure you want to close the day? The Opening Cash for tomorrow will be set to ₹${nextOpeningCash}.`)) {
           localStorage.setItem('erp_opening_cash', nextOpeningCash);
           localStorage.setItem('erp_last_closed_date', new Date().toISOString().split('T')[0]);
           
           if (sessionOpenEl && sessionCloseEl) {
             const settings = JSON.parse(localStorage.getItem('erp_settings') || '{}');
             settings.sessionOpen = sessionOpenEl.value;
             settings.sessionClose = sessionCloseEl.value;
             localStorage.setItem('erp_settings', JSON.stringify(settings));
           }

           DraftManager.clearDraft('dailyClosing');
           NotificationService.success("Day Closed Successfully. System is locked until tomorrow.");
          setTimeout(() => {
            window.location.hash = '#/';
          }, 1500);
       }
    });
  }

  return function cleanup() {
    if (clockInterval) clearInterval(clockInterval);
  };
}
