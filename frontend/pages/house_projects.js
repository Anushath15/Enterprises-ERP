import { NotificationService } from '../services/notificationService.js';
/**
 * Senthil Enterprises ERP - House Projects
 */
import { PrimaryButton } from '../components/ui/buttons.js';
import { KPICard } from '../components/ui/cards.js';
import { DataProvider } from '../services/dataProvider.js';
import { DraftManager } from '../services/draftManager.js';
import { escapeHtml } from '../utils/escapeHtml.js';

export async function render() {
  const projects = DataProvider.getProjects() || [];

  const renderRow = (prj) => {
    let statusColor = 'primary';
    if (prj.status === 'Planned' || prj.status === 'On Hold') statusColor = 'warning';
    if (prj.status === 'Completed') statusColor = 'success';
    
    // Calculate values based on project ledger
    const materialCost = Array.isArray(prj.invoices) 
      ? prj.invoices.reduce((sum, invId) => {
          const inv = DataProvider.getSalesInvoices().find(i => i.id === invId);
          if (!inv) return sum;
          let cost = 0;
          (inv.items || []).forEach(item => {
             const p = DataProvider.getProductById(item.productId);
             const unitCost = p ? Number(p.avgCost || p.buyingPrice || 0) : 0;
             cost += unitCost * Number(item.qty || 0);
          });
          return sum + cost;
        }, 0)
      : 0;

    const expenses = Number(prj.expenses || 0);
    const labour = Number(prj.labour || 0);
    const totalCost = materialCost + expenses + labour;
    const advance = Number(prj.advance || 0);
    const profit = Number(prj.budget || 0) - totalCost;

    return `
    <tr class="row-hover cursor-pointer" data-project-row="${escapeHtml(prj.id)}">
      <td class="px-4 py-4 text-left">
        <input type="checkbox" class="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary">
      </td>
      <td class="px-4 py-4">
        <p class="text-sm font-bold text-text">${escapeHtml(prj.title || 'Unnamed Site')}</p>
        <p class="text-xs text-gray-500 font-medium">${escapeHtml(prj.phase || 'Phase 1 - Foundation')}</p>
      </td>
      <td class="px-4 py-4 text-sm text-gray-700">${escapeHtml(prj.customer || '-')}</td>
      <td class="px-4 py-4 text-right">
        <p class="text-sm font-bold text-text">₹${Number(prj.budget || 0).toLocaleString('en-IN')}</p>
        <p class="text-[10px] text-green-600 font-semibold uppercase">Adv: ₹${advance.toLocaleString('en-IN')}</p>
      </td>
      <td class="px-4 py-4 text-right">
        <p class="text-sm font-bold text-danger">₹${totalCost.toLocaleString('en-IN')}</p>
        <p class="text-[10px] text-gray-500 uppercase">Mat + Lab + Exp</p>
      </td>
      <td class="px-4 py-4 text-center">
        <div class="flex flex-col items-center gap-1.5">
           <span class="status-badge status-${statusColor}">${escapeHtml(prj.status || 'Planned')}</span>
           <div class="w-full bg-gray-200 rounded-full h-1.5 mt-1">
             <div class="bg-${statusColor} h-1.5 rounded-full" style="width: ${Number(prj.completion || 0)}%"></div>
           </div>
        </div>
      </td>
      <td class="px-4 py-4 text-center">
        <button class="project-delete-btn p-1.5 rounded-lg text-gray-400 hover:text-danger hover:bg-danger/10 transition-colors" data-id="${escapeHtml(prj.id)}">
          <i data-lucide="trash-2" class="w-4 h-4 pointer-events-none"></i>
        </button>
      </td>
    </tr>
    `;
  };

  return `
    <div class="p-6 max-w-[1600px] mx-auto fade-in pb-20">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-text">Site & House Projects</h1>
          <p class="text-sm text-gray-500 mt-1">Manage project phases, isolated sub-ledgers, and site expenses.</p>
        </div>
        <div class="flex items-center gap-2">
          ${PrimaryButton({ label: 'New Project', id: 'btn-add-project', iconSvg: '<i data-lucide="hard-hat" class="w-4 h-4"></i>' })}
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div class="fade-in fade-in-d1">
          ${KPICard({ title: 'Active Sites', value: projects.filter(p=>p.status!=='Completed').length.toString(), iconSvg: '<i data-lucide="home" class="w-5 h-5"></i>', color: 'primary' })}
        </div>
        <div class="fade-in fade-in-d1">
          ${KPICard({ title: 'Total Projected Value', value: '₹' + projects.reduce((sum, p) => sum + Number(p.budget||0), 0).toLocaleString('en-IN'), iconSvg: '<i data-lucide="pie-chart" class="w-5 h-5"></i>', color: 'success' })}
        </div>
        <div class="fade-in fade-in-d2">
          ${KPICard({ title: 'Advances Collected', value: '₹' + projects.reduce((sum, p) => sum + Number(p.advance||0), 0).toLocaleString('en-IN'), iconSvg: '<i data-lucide="wallet" class="w-5 h-5"></i>', color: 'warning' })}
        </div>
        <div class="fade-in fade-in-d2">
          ${KPICard({ title: 'Total Site Expenses', value: '₹' + projects.reduce((sum, p) => sum + Number(p.expenses||0) + Number(p.labour||0), 0).toLocaleString('en-IN'), iconSvg: '<i data-lucide="trending-down" class="w-5 h-5"></i>', color: 'danger' })}
        </div>
      </div>

      <div class="erp-card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[1000px]">
            <thead>
              <tr>
                <th class="w-10"></th>
                <th class="text-left">Site Name & Phase</th>
                <th class="text-left">Customer / Owner</th>
                <th class="text-right">Projected Budget</th>
                <th class="text-right">Total Cost Incurred</th>
                <th class="text-center">Progress</th>
                <th class="text-center">Actions</th>
              </tr>
            </thead>
            <tbody id="projects-tbody">
              ${projects.length > 0 ? projects.map(renderRow).join('') : '<tr><td colspan="7" class="px-4 py-12 text-center text-gray-400 text-sm"><div class="flex flex-col items-center gap-2"><i data-lucide="hard-hat" class="w-8 h-8 text-gray-300"></i><p>No active sites found. Click "New Project" to get started.</p></div></td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Drawer Overlay -->
    <div id="project-drawer-overlay" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 opacity-0 pointer-events-none transition-opacity duration-300"></div>
    
    <!-- Drawer -->
    <aside id="project-form-drawer" class="fixed top-0 right-0 h-screen w-full md:w-[900px] lg:w-[1100px] bg-gray-50 border-l border-border z-[60] drawer-exit flex flex-col shadow-2xl">
      <div class="flex items-center justify-between px-6 py-4 bg-white border-b border-border shadow-sm z-10">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-primary/10 rounded-lg text-primary">
            <i data-lucide="hard-hat" class="w-5 h-5"></i>
          </div>
          <h3 class="text-lg font-bold text-text" id="drawer-title">New Project Profile</h3>
        </div>
        <button class="close-project-drawer p-2 rounded-lg text-gray-400 hover:text-danger hover:bg-danger/10 transition-colors">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>

      <!-- Tabs -->
      <div class="bg-white px-6 border-b border-border flex gap-6" id="project-tabs">
        <button class="p-tab-btn active px-1 py-3 text-sm font-semibold border-b-2 border-primary text-primary" data-target="tab-overview">Site Overview</button>
        <button class="p-tab-btn px-1 py-3 text-sm font-semibold border-b-2 border-transparent text-gray-500 hover:text-gray-700" data-target="tab-financials">Financials & Costs</button>
        <button class="p-tab-btn px-1 py-3 text-sm font-semibold border-b-2 border-transparent text-gray-500 hover:text-gray-700 hidden" data-target="tab-subledger">Material Sub-Ledger</button>
      </div>
      
      <div class="p-6 flex-1 overflow-y-auto">
        <form id="project-form">
          <input type="hidden" id="prj-id">
          
          <!-- TAB: OVERVIEW -->
          <div id="tab-overview" class="p-tab-content space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div class="space-y-6">
                  <!-- Basic Info -->
                  <div class="bg-white p-5 rounded-xl border border-border shadow-sm">
                    <h4 class="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2"><i data-lucide="map-pin" class="w-4 h-4 text-primary"></i> Site Information</h4>
                    <div class="space-y-4">
                      <div><label class="text-xs font-semibold text-gray-600 block mb-1">Site Name *</label><input type="text" id="prj-title" required class="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"></div>
                      <div>
                        <label class="text-xs font-semibold text-gray-600 block mb-1">Current Phase</label>
                        <select id="prj-phase" class="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary">
                          <option>Phase 1 - Foundation & Excavation</option>
                          <option>Phase 2 - Framing & Roofing</option>
                          <option>Phase 3 - Plumbing & Electrical Rough-in</option>
                          <option>Phase 4 - Interior Finishes & Flooring</option>
                          <option>Phase 5 - Final Inspection & Handover</option>
                        </select>
                      </div>
                      <div><label class="text-xs font-semibold text-gray-600 block mb-1">Customer (Owner) *</label>
                         <select id="prj-customer" required class="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary">
                           <option value="">Select Customer...</option>
                           ${DataProvider.getCustomers().map(c => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.name)} (${escapeHtml(c.id)})</option>`).join('')}
                         </select>
                      </div>
                      <div><label class="text-xs font-semibold text-gray-600 block mb-1">Site Address</label><textarea id="prj-address" rows="2" class="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"></textarea></div>
                    </div>
                  </div>
               </div>
  
               <div class="space-y-6">
                  <!-- Progress & Status -->
                  <div class="bg-white p-5 rounded-xl border border-border shadow-sm">
                    <h4 class="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2"><i data-lucide="activity" class="w-4 h-4 text-primary"></i> Progress & Tracking</h4>
                    <div class="space-y-4">
                      <div class="grid grid-cols-2 gap-4">
                        <div><label class="text-xs font-semibold text-gray-600 block mb-1">Status</label>
                          <select id="prj-status" class="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary">
                            <option>Planned</option><option>In Progress</option><option>On Hold</option><option>Completed</option>
                          </select>
                        </div>
                        <div><label class="text-xs font-semibold text-gray-600 block mb-1">Completion %</label><input type="number" id="prj-completion" value="0" min="0" max="100" class="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"></div>
                      </div>
                      <div class="grid grid-cols-2 gap-4">
                        <div><label class="text-xs font-semibold text-gray-600 block mb-1">Start Date</label><input type="date" id="prj-start" class="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"></div>
                        <div><label class="text-xs font-semibold text-gray-600 block mb-1">End Date</label><input type="date" id="prj-end" class="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"></div>
                      </div>
                    </div>
                  </div>
  
                  <!-- Stakeholders -->
                  <div class="bg-white p-5 rounded-xl border border-border shadow-sm">
                    <h4 class="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2"><i class="w-4 h-4 text-primary" data-lucide="users"></i> Stakeholders</h4>
                    <div class="grid grid-cols-2 gap-4">
                      <div><label class="text-xs font-semibold text-gray-600 block mb-1">Engineer / Architect</label><input type="text" id="prj-engineer" class="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"></div>
                      <div><label class="text-xs font-semibold text-gray-600 block mb-1">Main Contractor</label><input type="text" id="prj-contractor" class="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"></div>
                      <div><label class="text-xs font-semibold text-gray-600 block mb-1">Electrician</label><input type="text" id="prj-electrician" class="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"></div>
                      <div><label class="text-xs font-semibold text-gray-600 block mb-1">Plumber</label><input type="text" id="prj-plumber" class="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"></div>
                    </div>
                  </div>
               </div>
            </div>
          </div>

          <!-- TAB: FINANCIALS -->
          <div id="tab-financials" class="p-tab-content hidden space-y-6">
            <div class="bg-white p-5 rounded-xl border border-border shadow-sm">
              <h4 class="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2"><i data-lucide="calculator" class="w-4 h-4 text-primary"></i> Budgeting & Site Expenses</h4>
              <p class="text-xs text-gray-500 mb-6 border-b border-border pb-4">Record estimated budget and direct site expenses (labour, misc) separate from retail material purchases.</p>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div class="space-y-5">
                  <div><label class="text-xs font-semibold text-gray-600 block mb-1">Estimated Budget (₹) *</label><input type="number" id="prj-budget" required class="w-full px-4 py-3 border rounded-lg text-lg bg-green-50/30 text-green-700 font-bold focus:ring-2 focus:ring-green-500/20 focus:border-green-500"></div>
                  <div><label class="text-xs font-semibold text-gray-600 block mb-1">Advance Received (₹)</label><input type="number" id="prj-advance" class="w-full px-4 py-3 border rounded-lg text-lg font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary"></div>
                </div>
                <div class="space-y-5">
                  <div><label class="text-xs font-semibold text-gray-600 block mb-1">Total Manual Labour Cost (₹)</label><input type="number" id="prj-labour" value="0" class="w-full px-4 py-3 border rounded-lg text-lg text-danger font-bold bg-red-50/30 focus:ring-2 focus:ring-red-500/20 focus:border-red-500"></div>
                  <div><label class="text-xs font-semibold text-gray-600 block mb-1">Other Site Expenses (₹)</label><input type="number" id="prj-expenses" value="0" class="w-full px-4 py-3 border rounded-lg text-lg text-danger font-bold bg-red-50/30 focus:ring-2 focus:ring-red-500/20 focus:border-red-500"></div>
                </div>
              </div>
            </div>
            
            <div class="bg-white p-5 rounded-xl border border-border shadow-sm h-full flex flex-col">
              <h4 class="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2"><i data-lucide="sticky-note" class="w-4 h-4 text-primary"></i> Project Notes & Agreements</h4>
              <textarea id="prj-notes" rows="4" class="w-full flex-1 px-4 py-3 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none bg-yellow-50/30" placeholder="Type special requirements, agreed terms, or issues..."></textarea>
            </div>
          </div>
          
          <!-- TAB: SUBLEDGER (Read Only) -->
          <div id="tab-subledger" class="p-tab-content hidden space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="p-4 bg-indigo-50 border border-indigo-100 rounded-xl shadow-sm"><p class="text-xs text-indigo-600 font-bold uppercase tracking-wider">Total Material Invoiced</p><p class="text-2xl font-bold text-indigo-900 mt-1" id="lbl-mat-cost">₹0</p></div>
              <div class="p-4 bg-red-50 border border-red-100 rounded-xl shadow-sm"><p class="text-xs text-danger font-bold uppercase tracking-wider">Site Expenses + Labour</p><p class="text-2xl font-bold text-red-900 mt-1" id="lbl-site-exp">₹0</p></div>
              <div class="p-4 bg-green-50 border border-green-100 rounded-xl shadow-sm"><p class="text-xs text-green-600 font-bold uppercase tracking-wider">Est. Net Profit</p><p class="text-2xl font-bold text-green-900 mt-1" id="lbl-profit">₹0</p></div>
            </div>
            
            <div class="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
              <div class="px-5 py-4 bg-gray-50 border-b border-border flex justify-between items-center">
                <h4 class="font-bold text-sm text-gray-800 flex items-center gap-2"><i data-lucide="file-text" class="w-4 h-4 text-primary"></i> Material Supply Ledger</h4>
                <span class="text-xs text-gray-500 font-medium">Invoices generated for this site</span>
              </div>
              <div class="max-h-80 overflow-y-auto">
                <table class="w-full text-sm">
                  <thead class="bg-white sticky top-0 shadow-sm"><tr><th class="p-3 text-left">Date</th><th class="p-3 text-left">Invoice No</th><th class="p-3 text-right">Material Cost</th></tr></thead>
                  <tbody id="prj-history-tbody"></tbody>
                </table>
              </div>
            </div>
          </div>
          
        </form>
      </div>
      
      <div class="p-5 bg-white border-t border-border shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] flex items-center justify-end gap-3 sticky bottom-0 z-10">
        <button type="button" class="close-project-drawer px-5 py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
        <button id="save-prj-btn" type="button" class="px-6 py-2.5 text-sm font-bold text-white bg-primary rounded-lg hover:bg-primary/90 transition-all shadow-md hover:shadow-lg flex items-center gap-2">
          <i data-lucide="save" class="w-4 h-4"></i> Save Project Configuration
        </button>
      </div>
    </aside>
  `;
}

export function onMount() {
  if (window.lucide) window.lucide.createIcons();
  const allProjects = DataProvider.getProjects();

  const overlay = document.getElementById('project-drawer-overlay');
  const drawer = document.getElementById('project-form-drawer');
  
  const closeAll = () => {
    overlay.classList.remove('opacity-100');
    overlay.classList.add('opacity-0', 'pointer-events-none');
    drawer.classList.remove('drawer-enter-active');
    drawer.classList.add('drawer-exit-active');
  };

  // Tab switching logic
  const tabBtns = document.querySelectorAll('.p-tab-btn');
  const tabContents = document.querySelectorAll('.p-tab-content');
  const handleTabClick = (e) => {
    e.preventDefault();
    const target = e.currentTarget.getAttribute('data-target');
    
    tabBtns.forEach(b => {
      b.classList.remove('active', 'border-primary', 'text-primary');
      b.classList.add('border-transparent', 'text-gray-500');
    });
    e.currentTarget.classList.add('active', 'border-primary', 'text-primary');
    e.currentTarget.classList.remove('border-transparent', 'text-gray-500');
    
    tabContents.forEach(c => c.classList.add('hidden'));
    document.getElementById(target).classList.remove('hidden');
  };
  tabBtns.forEach(btn => btn.addEventListener('click', handleTabClick));

  const openForm = (id = null) => {
    const title = document.getElementById('drawer-title');
    const form = document.getElementById('project-form');
    form.reset();
    document.getElementById('prj-id').value = '';
    
    // Reset to first tab
    document.querySelector('.p-tab-btn[data-target="tab-overview"]').click();
    const ledgerTabBtn = document.querySelector('.p-tab-btn[data-target="tab-subledger"]');
    
    if (id) {
      title.textContent = 'Edit Project Profile';
      ledgerTabBtn.classList.remove('hidden');
      
      import('../services/dataProvider.js').then(({ DataProvider }) => {
        const p = DataProvider.getProjects().find(proj => proj.id === id);
        if (p) {
          document.getElementById('prj-id').value = p.id;
          document.getElementById('prj-title').value = p.title || '';
          document.getElementById('prj-phase').value = p.phase || 'Phase 1 - Foundation & Excavation';
          
          const custSelect = document.getElementById('prj-customer');
          if (p.customer) {
            Array.from(custSelect.options).forEach(opt => {
              if (opt.text.includes(p.customer) || opt.value === p.customer) opt.selected = true;
            });
          }
          
          document.getElementById('prj-address').value = p.address || '';
          document.getElementById('prj-status').value = p.status || 'Planned';
          document.getElementById('prj-completion').value = p.completion || 0;
          document.getElementById('prj-engineer').value = p.engineer || '';
          document.getElementById('prj-contractor').value = p.contractor || '';
          document.getElementById('prj-electrician').value = p.electrician || '';
          document.getElementById('prj-plumber').value = p.plumber || '';
          
          document.getElementById('prj-budget').value = p.budget || 0;
          document.getElementById('prj-advance').value = p.advance || 0;
          document.getElementById('prj-labour').value = p.labour || 0;
          document.getElementById('prj-expenses').value = p.expenses || 0;
          document.getElementById('prj-start').value = p.start || '';
          document.getElementById('prj-end').value = p.end || '';
          document.getElementById('prj-notes').value = p.notes || '';
          
          // Calculate ledger metrics
          const materialCost = Array.isArray(p.invoices) 
            ? p.invoices.reduce((sum, invId) => {
                const inv = DataProvider.getSalesInvoices().find(i => i.id === invId);
                if (!inv) return sum;
                let cost = 0;
                (inv.items || []).forEach(item => {
                   const prod = DataProvider.getProductById(item.productId);
                   const unitCost = prod ? Number(prod.avgCost || prod.buyingPrice || 0) : 0;
                   cost += unitCost * Number(item.qty || 0);
                });
                return sum + cost;
              }, 0)
            : 0;

          document.getElementById('lbl-mat-cost').textContent = '₹' + materialCost.toLocaleString('en-IN');
          document.getElementById('lbl-site-exp').textContent = '₹' + (Number(p.labour||0) + Number(p.expenses||0)).toLocaleString('en-IN');
          document.getElementById('lbl-profit').textContent = '₹' + (Number(p.budget||0) - materialCost - Number(p.labour||0) - Number(p.expenses||0)).toLocaleString('en-IN');
          
          const tbody = document.getElementById('prj-history-tbody');
          if (Array.isArray(p.invoices) && p.invoices.length > 0) {
             tbody.innerHTML = p.invoices.map(invId => {
                const inv = DataProvider.getSalesInvoices().find(i => i.id === invId);
                let invCost = 0;
                (inv.items || []).forEach(item => {
                   const prod = DataProvider.getProductById(item.productId);
                   const unitCost = prod ? Number(prod.avgCost || prod.buyingPrice || 0) : 0;
                   invCost += unitCost * Number(item.qty || 0);
                });
                return `
                  <tr class="border-b border-gray-100 hover:bg-gray-50">
                    <td class="p-3 font-medium text-gray-700">${escapeHtml(inv.date ? inv.date.split('T')[0] : '-')}</td>
                    <td class="p-3 text-primary font-bold">#${escapeHtml(inv.id)}</td>
                    <td class="p-3 text-right font-bold text-gray-800">₹${Number(invCost).toLocaleString('en-IN')}</td>
                  </tr>
                `;
             }).join('');
          } else {
             tbody.innerHTML = '<tr><td colspan="3" class="p-6 text-center text-gray-400">No material invoices issued for this site yet.</td></tr>';
          }
        }
      });
    } else {
      title.textContent = 'New Project Profile';
      ledgerTabBtn.classList.add('hidden');
    }
    
    overlay.classList.remove('opacity-0', 'pointer-events-none');
    overlay.classList.add('opacity-100');
    drawer.classList.remove('drawer-exit-active', 'drawer-exit');
    drawer.classList.add('drawer-enter-active');
  };

  const handleNewProject = () => openForm();
  const addBtn = document.getElementById('btn-add-project');
  if (addBtn) addBtn.addEventListener('click', handleNewProject);
  
  const handleOpenProjectDrawer = (e) => openForm(e.detail);
  window.addEventListener('openProjectDrawer', handleOpenProjectDrawer);

  const handleRowClick = (e) => {
    const delBtn = e.target.closest('.project-delete-btn');
    if (delBtn) {
      const delId = delBtn.getAttribute('data-id');
      if (delId) window.dispatchEvent(new CustomEvent('deleteProject', { detail: delId }));
      return;
    }
    if (e.target.closest('input[type="checkbox"]')) return;
    const row = e.target.closest('[data-project-row]');
    if (!row) return;
    const id = row.getAttribute('data-project-row');
    if (id) window.dispatchEvent(new CustomEvent('openProjectDrawer', { detail: id }));
  };
  const projectsTbody = document.getElementById('projects-tbody');
  if (projectsTbody) projectsTbody.addEventListener('click', handleRowClick);

  const handleDeleteProject = (e) => {
    if (!window.confirm('Delete this project? This cannot be undone.')) return;
    try {
      DataProvider.deleteProject(e.detail);
      const row = document.querySelector(`#projects-tbody tr[data-project-row="${e.detail}"]`);
      if (row) { row.style.transition = 'opacity 0.3s'; row.style.opacity = '0'; setTimeout(() => row.remove(), 300); }
      NotificationService.success('Project deleted.');
    } catch(err) {
      NotificationService.error(err.message);
    }
  };
  window.addEventListener('deleteProject', handleDeleteProject);

  const closeBtns = document.querySelectorAll('.close-project-drawer');
  const handleCloseClick = () => closeAll();
  closeBtns.forEach(b => b.addEventListener('click', handleCloseClick));
  overlay.addEventListener('click', handleCloseClick);

  // Initialize Draft Recovery
  const formEl = document.getElementById('project-form');
  if (formEl) DraftManager.init('project', formEl);

  const saveBtn = document.getElementById('save-prj-btn');
  const handleSaveProject = () => {
    const form = document.getElementById('project-form');
    if (!form.reportValidity()) return;
    
    try {
      const prjSelect = document.getElementById('prj-customer');
      const custName = prjSelect.options[prjSelect.selectedIndex]?.text.split(' (')[0] || '';
      const project = {
        id: document.getElementById('prj-id').value || null,
        title: document.getElementById('prj-title').value,
        phase: document.getElementById('prj-phase').value,
        customer: custName,
        address: document.getElementById('prj-address').value,
        status: document.getElementById('prj-status').value,
        completion: Number(document.getElementById('prj-completion').value || 0),
        engineer: document.getElementById('prj-engineer').value,
        contractor: document.getElementById('prj-contractor').value,
        electrician: document.getElementById('prj-electrician').value,
        plumber: document.getElementById('prj-plumber').value,
        budget: Number(document.getElementById('prj-budget').value || 0),
        advance: Number(document.getElementById('prj-advance').value || 0),
        labour: Number(document.getElementById('prj-labour').value || 0),
        expenses: Number(document.getElementById('prj-expenses').value || 0),
        start: document.getElementById('prj-start').value,
        end: document.getElementById('prj-end').value,
        notes: document.getElementById('prj-notes').value
      };

      // Preserve invoices array on edit
      if (project.id) {
        const existing = allProjects.find(p => p.id === project.id);
        project.invoices = existing?.invoices || [];
      } else {
        project.invoices = [];
      }

      const saved = DataProvider.saveProject(project);
      DraftManager.clearDraft('project');
      closeAll();
      NotificationService.success('Project saved!');

      // In-place tbody refresh
      const freshProjects = DataProvider.getProjects();
      const tbody = document.getElementById('projects-tbody');
      if (tbody) {
        if (freshProjects.length === 0) {
          tbody.innerHTML = '<tr><td colspan="7" class="px-4 py-12 text-center text-gray-400 text-sm">No active sites found.</td></tr>';
        } else {
          tbody.innerHTML = freshProjects.map(prj => {
            let sc = 'primary';
            if (prj.status === 'Planned' || prj.status === 'On Hold') sc = 'warning';
            if (prj.status === 'Completed') sc = 'success';
            const materialCost = Array.isArray(prj.invoices)
              ? prj.invoices.reduce((sum, invId) => {
                  const inv = DataProvider.getSalesInvoices().find(i => i.id === invId);
                  return sum + (inv ? Number(inv.totalAmount || 0) : 0);
                }, 0) : 0;
            const totalCost = materialCost + Number(prj.labour || 0) + Number(prj.expenses || 0);
            return `<tr class="row-hover cursor-pointer" data-project-row="${escapeHtml(prj.id)}">
              <td class="px-4 py-4 text-left"><input type="checkbox" class="w-4 h-4 rounded border-gray-300 text-primary"></td>
              <td class="px-4 py-4"><p class="text-sm font-bold text-text">${escapeHtml(prj.title || 'Unnamed Site')}</p><p class="text-xs text-gray-500">${escapeHtml(prj.phase || '')}</p></td>
              <td class="px-4 py-4 text-sm text-gray-700">${escapeHtml(prj.customer || '-')}</td>
              <td class="px-4 py-4 text-right"><p class="text-sm font-bold text-text">₹${Number(prj.budget || 0).toLocaleString('en-IN')}</p><p class="text-[10px] text-green-600 font-semibold uppercase">Adv: ₹${Number(prj.advance || 0).toLocaleString('en-IN')}</p></td>
              <td class="px-4 py-4 text-right"><p class="text-sm font-bold text-danger">₹${totalCost.toLocaleString('en-IN')}</p><p class="text-[10px] text-gray-500 uppercase">Mat + Lab + Exp</p></td>
              <td class="px-4 py-4 text-center"><span class="status-badge status-${sc}">${escapeHtml(prj.status || 'Planned')}</span></td>
              <td class="px-4 py-4 text-center"><button class="project-delete-btn p-1.5 rounded-lg text-gray-400 hover:text-danger hover:bg-danger/10" data-id="${escapeHtml(prj.id)}"><i data-lucide="trash-2" class="w-4 h-4 pointer-events-none"></i></button></td>
            </tr>`;
          }).join('');
        }
        if (window.lucide) window.lucide.createIcons({ nodes: [tbody] });
      }
    } catch (err) {
      NotificationService.error(err.message);
    }
  };
  if (saveBtn) saveBtn.addEventListener('click', handleSaveProject);

  return function cleanup() {
    window.removeEventListener('openProjectDrawer', handleOpenProjectDrawer);
    window.removeEventListener('deleteProject', handleDeleteProject);
    tabBtns.forEach(btn => btn.removeEventListener('click', handleTabClick));
    if (projectsTbody) projectsTbody.removeEventListener('click', handleRowClick);
    if (addBtn) addBtn.removeEventListener('click', handleNewProject);
    if (saveBtn) saveBtn.removeEventListener('click', handleSaveProject);
    closeBtns.forEach(b => b.removeEventListener('click', handleCloseClick));
    overlay.removeEventListener('click', handleCloseClick);
  };
}
