import { NotificationService } from '../services/notificationService.js';
/**
 * Senthil Enterprises ERP - Category Management
 */
import { DataProvider } from '../services/dataProvider.js';

export async function render() {
  return `
    <div class="p-6 max-w-[900px] mx-auto fade-in pb-20">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-text">Category Management</h1>
          <p class="text-sm text-gray-400 mt-1">Manage product and expense categories.</p>
        </div>
        <div class="flex items-center gap-2">
          <button id="btn-add-cat" class="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors">
            <i data-lucide="plus" class="w-4 h-4"></i>
            Add Category
          </button>
        </div>
      </div>

      <!-- Tabs -->
      <div class="flex gap-4 border-b border-border mb-6">
        <button id="tab-product" class="px-4 py-2 text-sm font-semibold border-b-2 border-primary text-primary transition-colors">Product Categories</button>
        <button id="tab-expense" class="px-4 py-2 text-sm font-semibold border-b-2 border-transparent text-gray-500 hover:text-gray-700 transition-colors">Expense Categories</button>
      </div>

      <div class="bg-white rounded-xl border border-border p-4 mb-4 flex flex-wrap gap-3 items-center shadow-sm">
        <div class="relative flex-1 min-w-[200px]">
          <i data-lucide="search" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input type="text" id="cat-search" placeholder="Search categories..." class="w-full pl-10 pr-4 py-2 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors">
        </div>
        <span id="cat-count-label" class="text-xs text-gray-400">Showing 0 categories</span>
      </div>

      <div class="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
        <div class="overflow-x-auto w-full">
          <table class="w-full">
            <thead>
              <tr class="border-b border-border bg-gray-50/50">
                <th class="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Category ID</th>
                <th class="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Name</th>
                <th class="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Status</th>
                <th class="text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody id="cat-table-body" class="divide-y divide-border">
              <!-- Populated via JS -->
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Category Drawer -->
    <div id="cat-drawer-overlay" class="fixed inset-0 bg-black/40 z-[60] opacity-0 pointer-events-none transition-opacity duration-300"></div>
    <div id="cat-drawer" class="fixed right-0 top-0 h-full w-full sm:w-[400px] bg-white shadow-2xl z-[70] transform translate-x-full transition-transform duration-300 flex flex-col">
      <div class="px-6 py-4 border-b border-border flex justify-between items-center bg-gray-50/50 sticky top-0">
        <h3 class="text-lg font-bold text-text flex items-center gap-2" id="cat-drawer-title">
          <i data-lucide="folder" class="w-5 h-5 text-primary"></i> Add Category
        </h3>
        <button class="close-cat-drawer text-gray-400 hover:text-danger hover:bg-danger/10 p-1.5 rounded-lg transition-colors">
          <i data-lucide="x" class="w-5 h-5 pointer-events-none"></i>
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-6 space-y-5">
        <input type="hidden" id="cat-id">
        <input type="hidden" id="cat-type">
        <div>
          <label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Category Name <span class="text-danger">*</span></label>
          <input type="text" id="cat-name" class="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors" placeholder="e.g. Electronics">
        </div>
        <div class="flex items-center gap-2">
          <input type="checkbox" id="cat-active" class="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary">
          <label for="cat-active" class="text-sm font-medium text-gray-700">Active</label>
        </div>
      </div>

      <div class="p-4 border-t border-border bg-gray-50/50 flex gap-3 sticky bottom-0">
        <button class="close-cat-drawer flex-1 px-4 py-2 bg-white border border-border text-gray-600 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors">Cancel</button>
        <button id="btn-save-cat" class="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-2">
          <i data-lucide="save" class="w-4 h-4"></i> Save
        </button>
      </div>
    </div>
  `;
}

export function onMount(rootElement) {
  const __listeners = [];
  const _origAddEventListener = rootElement.addEventListener;
  rootElement.addEventListener = function(type, listener, options) {
    __listeners.push({ target: rootElement, type, listener, options });
    _origAddEventListener.call(rootElement, type, listener, options);
  };
  const _origWindowAdd = window.addEventListener;
  const _origDocAdd = document.addEventListener;
  const trackedWindowDoc = [];
  window.addEventListener = function(type, listener, options) {
     trackedWindowDoc.push({ target: window, type, listener, options });
     _origWindowAdd.call(window, type, listener, options);
  };
  document.addEventListener = function(type, listener, options) {
     trackedWindowDoc.push({ target: document, type, listener, options });
     _origDocAdd.call(document, type, listener, options);
  };
  
  if (window.lucide) window.lucide.createIcons();
  
  let currentTab = 'product'; // 'product' or 'expense'
  let currentData = [];

  const tbody = rootElement.querySelector('#cat-table-body');
  const searchInput = rootElement.querySelector('#cat-search');
  const countLabel = rootElement.querySelector('#cat-count-label');
  const tabProduct = rootElement.querySelector('#tab-product');
  const tabExpense = rootElement.querySelector('#tab-expense');

  const loadData = () => {
    currentData = currentTab === 'product' 
      ? (DataProvider.getCategories() || [])
      : (DataProvider.getExpenseCategories() || []);
    renderTable(currentData);
  };

  const renderTable = (data) => {
    countLabel.textContent = `Showing ${data.length} categories`;
    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="px-4 py-8 text-center text-gray-400 text-sm">No categories found.</td></tr>';
    } else {
      tbody.innerHTML = data.map(cat => {
        const isActive = cat.isActive !== false;
        const statusBadge = isActive 
          ? '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-success/10 text-success uppercase tracking-wider">Active</span>'
          : '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-500 uppercase tracking-wider">Inactive</span>';

        return `
          <tr class="row-hover cursor-pointer" data-id="${cat.id}" data-type="${currentTab}">
            <td class="px-4 py-3.5 font-semibold text-primary text-sm">${cat.id || '-'}</td>
            <td class="px-4 py-3.5 font-medium text-text">${cat.name}</td>
            <td class="px-4 py-3.5">${statusBadge}</td>
            <td class="px-4 py-3.5 text-right flex items-center justify-end gap-1">
              <button class="edit-cat-btn p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-gray-100" data-id="${cat.id}">
                <i data-lucide="edit-3" class="w-4 h-4 pointer-events-none"></i>
              </button>
              <button class="delete-cat-btn p-1.5 rounded-lg text-gray-400 hover:text-danger hover:bg-danger/10" data-id="${cat.id}">
                <i data-lucide="trash-2" class="w-4 h-4 pointer-events-none"></i>
              </button>
            </td>
          </tr>
        `;
      }).join('');
    }
    if (window.lucide) window.lucide.createIcons({ nodes: [tbody] });
  };

  const handleTableClick = (e) => {
    const editBtn = e.target.closest('.edit-cat-btn');
    const deleteBtn = e.target.closest('.delete-cat-btn');
    
    if (editBtn) {
      e.stopPropagation();
      openDrawer(editBtn.getAttribute('data-id'));
    } else if (deleteBtn) {
      e.stopPropagation();
      handleDelete(deleteBtn.getAttribute('data-id'));
    }
  };
  
  tbody.addEventListener('click', handleTableClick);

  const switchTab = (tab) => {
    currentTab = tab;
    if (tab === 'product') {
      tabProduct.className = "px-4 py-2 text-sm font-semibold border-b-2 border-primary text-primary transition-colors";
      tabExpense.className = "px-4 py-2 text-sm font-semibold border-b-2 border-transparent text-gray-500 hover:text-gray-700 transition-colors";
    } else {
      tabExpense.className = "px-4 py-2 text-sm font-semibold border-b-2 border-primary text-primary transition-colors";
      tabProduct.className = "px-4 py-2 text-sm font-semibold border-b-2 border-transparent text-gray-500 hover:text-gray-700 transition-colors";
    }
    searchInput.value = '';
    loadData();
  };

  const handleTabProduct = () => switchTab('product');
  const handleTabExpense = () => switchTab('expense');
  tabProduct.addEventListener('click', handleTabProduct);
  tabExpense.addEventListener('click', handleTabExpense);

  const handleSearch = (e) => {
    const q = e.target.value.toLowerCase().trim();
    const filtered = currentData.filter(c => c.name.toLowerCase().includes(q) || (c.id && c.id.toLowerCase().includes(q)));
    renderTable(filtered);
  };
  searchInput.addEventListener('input', handleSearch);

  // Drawer Logic
  const overlay = rootElement.querySelector('#cat-drawer-overlay');
  const drawer = rootElement.querySelector('#cat-drawer');
  
  const closeDrawer = () => {
    overlay.classList.add('opacity-0', 'pointer-events-none');
    overlay.classList.remove('opacity-100');
    drawer.classList.add('translate-x-full');
  };

  const closeBtns = rootElement.querySelectorAll('.close-cat-drawer');
  closeBtns.forEach(btn => btn.addEventListener('click', closeDrawer));
  overlay.addEventListener('click', closeDrawer);

  const openDrawer = (id = null) => {
    if (id) {
      const cat = currentData.find(c => c.id === id);
      if (cat) {
        rootElement.querySelector('#cat-id').value = cat.id;
        rootElement.querySelector('#cat-type').value = currentTab;
        rootElement.querySelector('#cat-name').value = cat.name;
        rootElement.querySelector('#cat-active').checked = cat.isActive !== false;
        rootElement.querySelector('#cat-drawer-title').innerHTML = '<i data-lucide="edit" class="w-5 h-5 text-primary"></i> Edit Category';
      }
    } else {
      rootElement.querySelector('#cat-id').value = '';
      rootElement.querySelector('#cat-type').value = currentTab;
      rootElement.querySelector('#cat-name').value = '';
      rootElement.querySelector('#cat-active').checked = true;
      rootElement.querySelector('#cat-drawer-title').innerHTML = '<i data-lucide="folder" class="w-5 h-5 text-primary"></i> Add Category';
    }
    
    if (window.lucide) window.lucide.createIcons();
    overlay.classList.remove('opacity-0', 'pointer-events-none');
    overlay.classList.add('opacity-100');
    drawer.classList.remove('translate-x-full');
  };

  const handleAddCat = () => openDrawer(null);
  const btnAddCat = rootElement.querySelector('#btn-add-cat');
  btnAddCat.addEventListener('click', handleAddCat);

  const handleSaveCat = () => {
    const id = rootElement.querySelector('#cat-id').value;
    const type = rootElement.querySelector('#cat-type').value;
    const name = rootElement.querySelector('#cat-name').value.trim();
    const isActive = rootElement.querySelector('#cat-active').checked;

    if (!name) {
      NotificationService.warning('Category name is required');
      return;
    }

    try {
      if (type === 'product') {
        DataProvider.saveCategory({ id: id || undefined, name, isActive });
      } else {
        DataProvider.saveExpenseCategory({ id: id || undefined, name, isActive });
      }
      
      NotificationService.success('Category saved successfully!');
      closeDrawer();
      loadData();
    } catch (err) {
      NotificationService.error(err.message);
    }
  };
  const btnSaveCat = rootElement.querySelector('#btn-save-cat');
  btnSaveCat.addEventListener('click', handleSaveCat);

  const handleDelete = (id) => {
    if (!id) return;
    const div = document.createElement('div');
    div.className = 'fixed inset-0 bg-black/50 z-[100] flex items-center justify-center';
    div.innerHTML = `
      <div class="bg-white p-6 rounded-xl shadow-xl max-w-sm w-full mx-4">
        <h3 class="text-lg font-bold text-text mb-2">Delete Category?</h3>
        <p class="text-sm text-gray-500 mb-6">This will soft-delete the category. Proceed?</p>
        <div class="flex justify-end gap-3">
          <button id="cancel-del" class="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
          <button id="confirm-del" class="px-4 py-2 text-sm text-white bg-danger rounded-lg hover:bg-danger/90">Delete</button>
        </div>
      </div>
    `;
    document.body.appendChild(div);

    div.querySelector('#cancel-del').onclick = () => div.remove();
    div.querySelector('#confirm-del').onclick = () => {
      try {
        if (currentTab === 'product') {
          DataProvider.deleteCategory(id);
        } else {
          DataProvider.deleteExpenseCategory(id);
        }
        NotificationService.success('Category deleted');
        loadData();
      } catch (e) {
        NotificationService.error(e.message);
      }
      div.remove();
    };
  };

  // Initial load
  loadData();

  return function cleanup() {
    __listeners.forEach(({target, type, listener, options}) => {
      target.removeEventListener(type, listener, options);
    });
    trackedWindowDoc.forEach(({target, type, listener, options}) => {
      target.removeEventListener(type, listener, options);
    });
    window.addEventListener = _origWindowAdd;
    document.addEventListener = _origDocAdd;

    tbody.removeEventListener('click', handleTableClick);
    tabProduct.removeEventListener('click', handleTabProduct);
    tabExpense.removeEventListener('click', handleTabExpense);
    searchInput.removeEventListener('input', handleSearch);
    closeBtns.forEach(btn => btn.removeEventListener('click', closeDrawer));
    overlay.removeEventListener('click', closeDrawer);
    btnAddCat.removeEventListener('click', handleAddCat);
    btnSaveCat.removeEventListener('click', handleSaveCat);
  };
}
