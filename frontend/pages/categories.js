/**
 * Senthil Enterprises ERP - Category Management
 */
import { DataProvider } from '../services/dataProvider.js';

export async function render() {
  const categories = DataProvider.getCategories() || [];

  const renderRow = (cat) => {
    return `
    <tr class="row-hover cursor-pointer" data-id="${cat.id}" onclick="window.dispatchEvent(new CustomEvent('openCategoryDrawer', {detail: '${cat.id}'}))">
      <td class="px-4 py-3.5 font-semibold text-primary text-sm">${cat.id}</td>
      <td class="px-4 py-3.5 font-medium text-text">${cat.name}</td>
      <td class="px-4 py-3.5">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-success/10 text-success uppercase tracking-wider">Active</span>
      </td>
      <td class="px-4 py-3.5 text-right">
        <button class="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-gray-100" onclick="event.stopPropagation(); window.dispatchEvent(new CustomEvent('openCategoryDrawer', {detail: '${cat.id}'}))">
          <i data-lucide="edit-3" class="w-4 h-4 pointer-events-none"></i>
        </button>
      </td>
    </tr>
    `;
  };

  return `
    <div class="p-6 max-w-[900px] mx-auto fade-in pb-20">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-text">Category Management</h1>
          <p class="text-sm text-gray-400 mt-1">Manage product categories for inventory organization.</p>
        </div>
        <div class="flex items-center gap-2">
          <button onclick="window.dispatchEvent(new CustomEvent('openCategoryDrawer', {detail: null}))" class="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors">
            <i data-lucide="plus" class="w-4 h-4"></i>
            Add Category
          </button>
        </div>
      </div>

      <div class="bg-white rounded-xl border border-border p-4 mb-4 flex flex-wrap gap-3 items-center shadow-sm">
        <div class="relative flex-1 min-w-[200px]">
          <i data-lucide="search" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input type="text" id="cat-search" placeholder="Search categories..." class="w-full pl-10 pr-4 py-2 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors">
        </div>
        <span id="cat-count-label" class="text-xs text-gray-400">Showing ${categories.length} categories</span>
      </div>

      <div class="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
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
            ${categories.length > 0 ? categories.map(renderRow).join('') : '<tr><td colspan="4" class="px-4 py-8 text-center text-gray-400 text-sm">No categories found.</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Category Drawer -->
    <div id="cat-drawer-overlay" class="fixed inset-0 bg-black/40 z-[60] opacity-0 pointer-events-none transition-opacity duration-300"></div>
    <div id="cat-drawer" class="fixed right-0 top-0 h-full w-[400px] bg-white shadow-2xl z-[70] transform translate-x-full transition-transform duration-300 flex flex-col">
      <div class="px-6 py-4 border-b border-border flex justify-between items-center bg-gray-50/50">
        <h3 class="text-lg font-bold text-text flex items-center gap-2" id="cat-drawer-title">
          <i data-lucide="folder" class="w-5 h-5 text-primary"></i> Add Category
        </h3>
        <button class="close-cat-drawer text-gray-400 hover:text-danger hover:bg-danger/10 p-1.5 rounded-lg transition-colors">
          <i data-lucide="x" class="w-5 h-5 pointer-events-none"></i>
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-6 space-y-5">
        <input type="hidden" id="cat-id">
        <div>
          <label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Category Name <span class="text-danger">*</span></label>
          <input type="text" id="cat-name" class="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors" placeholder="e.g. Electronics">
        </div>
      </div>

      <div class="p-4 border-t border-border bg-gray-50/50 flex gap-3">
        <button class="close-cat-drawer flex-1 px-4 py-2 bg-white border border-border text-gray-600 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors">Cancel</button>
        <button id="btn-save-cat" class="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-2">
          <i data-lucide="save" class="w-4 h-4"></i> Save
        </button>
      </div>
    </div>
  `;
}

export function onMount(rootElement) {
  if (window.lucide) window.lucide.createIcons();
  
  let allCategories = DataProvider.getCategories() || [];

  const tbody = rootElement.querySelector('#cat-table-body');
  const searchInput = rootElement.querySelector('#cat-search');
  const countLabel = rootElement.querySelector('#cat-count-label');

  const renderTable = (data) => {
    countLabel.textContent = \`Showing \${data.length} categories\`;
    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="px-4 py-8 text-center text-gray-400 text-sm">No categories found.</td></tr>';
    } else {
      tbody.innerHTML = data.map(cat => \`
        <tr class="row-hover cursor-pointer" data-id="\${cat.id}" onclick="window.dispatchEvent(new CustomEvent('openCategoryDrawer', {detail: '\${cat.id}'}))">
          <td class="px-4 py-3.5 font-semibold text-primary text-sm">\${cat.id}</td>
          <td class="px-4 py-3.5 font-medium text-text">\${cat.name}</td>
          <td class="px-4 py-3.5">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-success/10 text-success uppercase tracking-wider">Active</span>
          </td>
          <td class="px-4 py-3.5 text-right">
            <button class="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-gray-100" onclick="event.stopPropagation(); window.dispatchEvent(new CustomEvent('openCategoryDrawer', {detail: '\${cat.id}'}))">
              <i data-lucide="edit-3" class="w-4 h-4 pointer-events-none"></i>
            </button>
          </td>
        </tr>
      \`).join('');
    }
    if (window.lucide) window.lucide.createIcons();
  };

  searchInput.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase().trim();
    const filtered = allCategories.filter(c => c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q));
    renderTable(filtered);
  });

  // Drawer Logic
  const overlay = rootElement.querySelector('#cat-drawer-overlay');
  const drawer = rootElement.querySelector('#cat-drawer');
  
  const closeDrawer = () => {
    overlay.classList.add('opacity-0', 'pointer-events-none');
    overlay.classList.remove('opacity-100');
    drawer.classList.add('translate-x-full');
  };

  rootElement.querySelectorAll('.close-cat-drawer').forEach(btn => btn.addEventListener('click', closeDrawer));
  overlay.addEventListener('click', closeDrawer);

  const openDrawer = (e) => {
    const id = e?.detail;
    if (id) {
      const cat = allCategories.find(c => c.id === id);
      if (cat) {
        rootElement.querySelector('#cat-id').value = cat.id;
        rootElement.querySelector('#cat-name').value = cat.name;
        rootElement.querySelector('#cat-drawer-title').innerHTML = '<i data-lucide="edit" class="w-5 h-5 text-primary"></i> Edit Category';
      }
    } else {
      rootElement.querySelector('#cat-id').value = '';
      rootElement.querySelector('#cat-name').value = '';
      rootElement.querySelector('#cat-drawer-title').innerHTML = '<i data-lucide="folder" class="w-5 h-5 text-primary"></i> Add Category';
    }
    
    if (window.lucide) window.lucide.createIcons();
    overlay.classList.remove('opacity-0', 'pointer-events-none');
    overlay.classList.add('opacity-100');
    drawer.classList.remove('translate-x-full');
  };

  window.addEventListener('openCategoryDrawer', openDrawer);

  rootElement.querySelector('#btn-save-cat').addEventListener('click', () => {
    const id = rootElement.querySelector('#cat-id').value;
    const name = rootElement.querySelector('#cat-name').value.trim();

    if (!name) {
      window.showToast('Category name is required', 'warning');
      return;
    }

    try {
      DataProvider.saveCategory({ id: id || undefined, name });
      window.showToast('Category saved successfully!', 'success');
      closeDrawer();
      allCategories = DataProvider.getCategories() || [];
      renderTable(allCategories);
      searchInput.value = '';
    } catch (err) {
      window.showToast(err.message, 'danger');
    }
  });

  return function cleanup() {
    window.removeEventListener('openCategoryDrawer', openDrawer);
  };
}
