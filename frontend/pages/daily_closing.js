import { NotificationService } from '../services/notificationService.js';
/**
 * Senthil Enterprises ERP - Daily Closing (Accounting View)
 * AUDIT-H04: cash collections from recorded credit payments now reconcile.
 * AUDIT-H05: uses local-date helpers so the day boundary is IST-correct.
 */
import { DataProvider } from '../services/dataProvider.js';
import { DraftManager } from '../services/draftManager.js';
import { todayISO } from '../utils/dateUtils.js';

export async function render() {
  const currentDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const todayStr = todayISO(); // DC-VAR-SHADOW FIX: renamed to todayStr so it does not shadow the imported fn
  const invoices = (DataProvider.getSalesInvoices() || []).filter(i => (i.date || '').startsWith(todayStr));
  const expenses = (DataProvider.getExpenses() || []).filter(e => (e.date || '').startsWith(todayStr));
  
  const getPaid = (i) => Number(i.amountPaid ?? i.totalAmount ?? i.total ?? 0);
  
  const cashSales = invoices.filter(i => i.paymentMethod === 'Cash' || i.paymentMode === 'Cash').reduce((sum, i) => sum + getPaid(i), 0);
  const upiSales = invoices.filter(i => (i.paymentMethod || i.paymentMode) === 'UPI').reduce((sum, i) => sum + getPaid(i), 0);
  const cardSales = invoices.filter(i => (i.paymentMethod || i.paymentMode) === 'Card').reduce((sum, i) => sum + getPaid(i), 0);
  const creditSales = invoices.filter(i => (i.paymentMethod || i.paymentMode) === 'Credit').reduce((sum, i) => sum + (i.totalAmount || i.total || 0), 0);
  
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  // AUDIT-H03: a corrupt/empty stored value must never produce NaN expected cash
  const rawOpeningCash = localStorage.getItem('erp_opening_cash');
  
  if (rawOpeningCash === null || rawOpeningCash === '') {
    return `
      <div class="p-4 max-w-[500px] mx-auto fade-in mt-10" id="missing-cash-view">
        <div class="bg-white erp-card p-6 border-t-4 border-t-primary shadow-sm text-center">
          <div class="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <i data-lucide="wallet" class="w-8 h-8"></i>
          </div>
          <h2 class="text-xl font-bold text-text mb-2">Morning Opening Cash</h2>
          <p class="text-gray-500 mb-6">Please enter the physical cash amount present in the drawer at the start of the day.</p>
          <input type="number" id="opening-cash-input" class="erp-input w-full text-center text-xl font-bold mb-4" placeholder="Enter Amount (₹)">
          <button id="set-opening-cash-btn" class="w-full bg-primary hover:bg-secondary text-white py-3 rounded-lg font-bold flex justify-center items-center gap-2 transition-colors">
            <i data-lucide="check-circle" class="w-5 h-5"></i> Set Opening Cash
          </button>
        </div>
      </div>
    `;
  }
  
  const parsedOpeningCash = Number(rawOpeningCash);
  const openingCash = Number.isFinite(parsedOpeningCash) ? parsedOpeningCash : 0;
  
  // AUDIT-H04: real same-day cash collections recorded via Credit Management
  const creditCollectionsCash = (DataProvider.getCreditPayments() || [])
    .filter(p => (p.date || '').startsWith(todayStr) && (p.method || 'Cash') === 'Cash')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const supplierPaymentsCash = 0; 
  
  const expectedCash = openingCash + cashSales + creditCollectionsCash - totalExpenses - supplierPaymentsCash;
  const totalCollections = cashSales + upiSales + cardSales + creditCollectionsCash;
  
  const cashIn = creditCollectionsCash;
  const cashOut = supplierPaymentsCash;

  return `
    <div class="p-4 max-w-[1000px] mx-auto fade-in">
      
      <!-- Header -->
      <div class="bg-white erp-card p-4 mb-4 flex justify-between items-center border-t-4 border-t-primary shadow-sm">
        <div>
          <h1 class="text-xl font-bold text-text mb-1">Daily Closing Dashboard</h1>
          <p class="text-xs text-gray-500 flex items-center gap-2">
            <span>Statement for ${currentDate}</span>
            <span class="w-1 h-1 rounded-full bg-gray-300"></span>
            <span id="live-clock" class="font-mono text-primary font-medium"></span>
          </p>
        </div>
        <button id="dc-print-btn" class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors">
          <i data-lucide="printer" class="w-4 h-4"></i> Print Statement
        </button>
      </div>

      <!-- Main Dashboard Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        <!-- Left: Financial Summary -->
        <div class="bg-white erp-card p-5 shadow-sm space-y-3">
          <h3 class="font-bold text-gray-700 border-b border-border pb-2 mb-3 text-sm flex items-center gap-2">
            <i data-lucide="bar-chart-2" class="w-4 h-4 text-primary"></i> Daily Summary
          </h3>
          
          <div class="flex justify-between items-center text-sm">
            <span class="text-gray-600 font-medium">Opening Cash</span>
            <span class="font-bold text-text">₹${openingCash.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
          </div>
          
          <div class="flex justify-between items-center text-sm bg-green-50/50 p-2 rounded">
            <span class="text-gray-600 font-medium">Cash Sales</span>
            <span class="font-bold text-success">₹${cashSales.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
          </div>
          
          <div class="flex justify-between items-center text-sm p-2">
            <span class="text-gray-600 font-medium">UPI / Card Sales</span>
            <span class="font-bold text-indigo-600">₹${(upiSales + cardSales).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
          </div>
          
          <div class="flex justify-between items-center text-sm p-2">
            <span class="text-gray-600 font-medium">Credit Sales (Unpaid)</span>
            <span class="font-bold text-warning">₹${creditSales.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
          </div>
          
          <div class="flex justify-between items-center text-sm bg-red-50/50 p-2 rounded">
            <span class="text-gray-600 font-medium">Expenses</span>
            <span class="font-bold text-danger">₹${totalExpenses.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
          </div>
          
          <div class="flex justify-between items-center text-sm p-2">
            <span class="text-gray-600 font-medium">Cash In (Credit Collections)</span>
            <span class="font-bold text-success">₹${cashIn.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
          </div>
          
          <div class="flex justify-between items-center text-sm p-2">
            <span class="text-gray-600 font-medium">Cash Out (Dealer Pymt)</span>
            <span class="font-bold text-danger">₹${cashOut.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
          </div>
        </div>

        <!-- Right: Reconciliation & Close -->
        <div class="bg-white erp-card p-5 shadow-sm border border-primary/20 flex flex-col justify-between">
          <div>
            <h3 class="font-bold text-primary border-b border-primary/10 pb-2 mb-4 text-sm flex items-center gap-2">
              <i data-lucide="wallet" class="w-4 h-4"></i> Cash Reconciliation
            </h3>
            
            <form id="daily-closing-form" class="space-y-4">
              <div class="bg-gray-50 p-3 rounded-lg border border-border flex justify-between items-center">
                <span class="text-sm font-bold text-gray-700">Expected Cash</span>
                <span class="text-2xl font-bold text-gray-900" id="system-expected-cash" data-value="${expectedCash}">₹${expectedCash.toLocaleString('en-IN')}</span>
              </div>

              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">Actual Cash Counted <span class="text-danger">*</span></label>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                  <input type="number" id="actual-cash" class="w-full pl-8 pr-3 py-2 bg-white border-2 border-gray-300 rounded-lg text-lg font-bold text-text focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all text-right" placeholder="0.00">
                </div>
              </div>

              <div class="flex justify-between items-center p-3 rounded-lg border bg-white shadow-sm" id="difference-container">
                <span class="text-sm font-bold text-gray-600">Difference</span>
                <span id="cash-difference" class="text-lg font-bold text-gray-400">₹0.00</span>
              </div>
              <div id="difference-status" class="text-xs font-bold text-center h-4"></div>

              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">Notes / Remarks</label>
                <textarea id="closing-remarks" rows="2" class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" placeholder="Enter reason for shortage/excess..."></textarea>
              </div>
            </form>
          </div>
          
          <div class="mt-4 pt-4 border-t border-border">
            <button id="close-day-btn" class="w-full py-3 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary/90 transition-all shadow-md flex items-center justify-center gap-2">
              <i data-lucide="lock" class="w-5 h-5"></i> Close Day
            </button>
          </div>
        </div>
        
      </div>
    </div>
  `;
}

export function onMount(rootElement) {
  const __listeners = [];
  const safeRootAdd = (type, listener, options) => {
    __listeners.push({ target: rootElement, type, listener, options });
    rootElement.addEventListener(type, listener, options);
  };
  const trackedWindowDoc = [];
  const safeWindowAdd = (type, listener, options) => {
    trackedWindowDoc.push({ target: window, type, listener, options });
    window.addEventListener(type, listener, options);
  };
  const safeDocAdd = (type, listener, options) => {
    trackedWindowDoc.push({ target: document, type, listener, options });
    document.addEventListener(type, listener, options);
  };
  
  if (window.lucide) window.lucide.createIcons();

  const missingCashBtn = document.getElementById('set-opening-cash-btn');
  if (missingCashBtn) {
    missingCashBtn.addEventListener('click', () => {
      const inputVal = document.getElementById('opening-cash-input').value;
      const num = Number(inputVal);
      if (!inputVal || !Number.isFinite(num) || num < 0) {
        NotificationService.error('Please enter a valid positive amount.');
        return;
      }
      localStorage.setItem('erp_opening_cash', String(num));
      window.dispatchEvent(new CustomEvent('app:refresh'));
    });
    return () => {
       // cleanup managed by unmount anyway
    };
  }

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
     try {
       const settings = JSON.parse(localStorage.getItem('erp_settings') || '{}');
       sessionOpenEl.value = settings.sessionOpen || '09:00';
       sessionCloseEl.value = settings.sessionClose || '21:00';
     } catch(e) {
       console.error("Failed to parse erp_settings", e);
     }
  }

  const handlePrint = () => window.print();
  if (printBtn) {
    printBtn.addEventListener('click', handlePrint);
  }

  if (expectedCashEl && actualCashInput && differenceEl) {
    const expected = Number(expectedCashEl.getAttribute('data-value') || 0);

    const handleActualCashInput = (e) => {
      const actual = Number(e.target.value) || 0;
      const diff = actual - expected;
      
      const diffStatusEl = document.getElementById('difference-status');
      
      differenceEl.textContent = (diff > 0 ? '+ ₹' : (diff < 0 ? '- ₹' : '₹')) + Math.abs(diff).toLocaleString('en-IN', {minimumFractionDigits:2});
      
      if (diff > 0) {
        differenceEl.className = 'text-lg font-bold text-success';
        diffContainer.className = 'flex justify-between items-center p-3 rounded-lg border bg-green-50 border-green-200 shadow-sm';
        if (diffStatusEl) {
          diffStatusEl.textContent = 'EXCESS CASH DETECTED';
          diffStatusEl.className = 'text-xs font-bold text-center h-4 text-success mt-2';
        }
      } else if (diff < 0) {
        differenceEl.className = 'text-lg font-bold text-danger';
        diffContainer.className = 'flex justify-between items-center p-3 rounded-lg border bg-red-50 border-red-200 shadow-sm';
        if (diffStatusEl) {
          diffStatusEl.textContent = 'CASH SHORTAGE DETECTED';
          diffStatusEl.className = 'text-xs font-bold text-center h-4 text-danger mt-2';
        }
      } else if (e.target.value !== '') {
        differenceEl.className = 'text-lg font-bold text-primary';
        diffContainer.className = 'flex justify-between items-center p-3 rounded-lg border bg-blue-50 border-blue-200 shadow-sm';
        if (diffStatusEl) {
          diffStatusEl.textContent = 'PERFECT MATCH';
          diffStatusEl.className = 'text-xs font-bold text-center h-4 text-primary mt-2';
        }
      } else {
        differenceEl.className = 'text-lg font-bold text-gray-400';
        diffContainer.className = 'flex justify-between items-center p-3 rounded-lg border bg-white shadow-sm';
        if (diffStatusEl) {
          diffStatusEl.textContent = '';
        }
      }
    };
    actualCashInput.addEventListener('input', handleActualCashInput);
  }

  if (closeBtn) {
  const handleCloseDay = () => {
       const rawCashVal = (actualCashInput.value || '').trim();
       if (!rawCashVal) {
         NotificationService.error('Please enter the Actual Cash Counted before closing.');
         actualCashInput.focus();
         return;
       }
       // AUDIT-H03: reject NaN (e.g. 'e', 'abc') and negative values
       const actualCashNum = Number(rawCashVal);
       if (!Number.isFinite(actualCashNum) || actualCashNum < 0) {
         NotificationService.error('Please enter a valid positive number for the cash amount.');
         actualCashInput.focus();
         return;
       }
       const remarks = document.getElementById('closing-remarks').value;
       const nextOpeningCash = String(actualCashNum); // always use the cleaned numeric string
       const expectedAmount = Number(expectedCashEl.getAttribute('data-value') || 0);
       
       if(window.confirm(`Are you sure you want to close the day? The Opening Cash for tomorrow will be set to ₹${nextOpeningCash}.`)) {
           const rawCurrent = localStorage.getItem('erp_opening_cash');
           const currentOpeningCash = Number(rawCurrent) || 0;
           localStorage.setItem('erp_opening_cash', nextOpeningCash);
           localStorage.setItem('erp_last_closed_date', todayISO());
           
           // P1B-03: Persist closing history
           const closingRecord = {
             id: 'CLS-' + Date.now(),
             date: todayISO(),
             openingCash: currentOpeningCash,
             expectedCash: expectedAmount,
             actualCash: actualCashNum,
             difference: actualCashNum - expectedAmount,
             remarks: remarks,
             closedBy: 'admin',
             createdAt: new Date().toISOString()
           };
           
           try {
             const closings = JSON.parse(localStorage.getItem('erp_daily_closings') || '[]');
             closings.push(closingRecord);
             localStorage.setItem('erp_daily_closings', JSON.stringify(closings));
           } catch (e) {
             console.error('Failed to save closing record', e);
           }
           
           if (sessionOpenEl && sessionCloseEl) {
             try {
               const settings = JSON.parse(localStorage.getItem('erp_settings') || '{}');
               settings.sessionOpen = sessionOpenEl.value;
               settings.sessionClose = sessionCloseEl.value;
               localStorage.setItem('erp_settings', JSON.stringify(settings));
             } catch (e) {
               console.error("Failed to parse settings", e);
             }
           }

           DraftManager.clearDraft('dailyClosing');
           NotificationService.success("Day Closed Successfully. System is locked until tomorrow.");
          setTimeout(() => {
            window.location.hash = '#/';
          }, 1500);
       }
    };
    closeBtn.addEventListener('click', handleCloseDay);
  }

  return function cleanup() {
    __listeners.forEach(({target, type, listener, options}) => {
      target.removeEventListener(type, listener, options);
    });
    trackedWindowDoc.forEach(({target, type, listener, options}) => {
      target.removeEventListener(type, listener, options);
    });
    

    if (clockInterval) clearInterval(clockInterval);
  };
}
