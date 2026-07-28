/**
 * Senthil Enterprises ERP - Navigation Components
 * Purpose: Pagination and Tabs.
 */

/**
 * Pagination
 * @param {Object} props - { currentPage, totalPages, totalItems, itemsPerPage }
 */
export function Pagination({ currentPage = 1, totalPages = 1, totalItems = 0, itemsPerPage = 10 }) {
  const startItem = ((currentPage - 1) * itemsPerPage) + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return `
    <div class="flex items-center justify-between px-6 py-3 border-t border-border bg-white">
      <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p class="text-sm text-gray-700">
            Showing <span class="font-medium">${totalItems > 0 ? startItem : 0}</span> to <span class="font-medium">${endItem}</span> of <span class="font-medium">${totalItems}</span> results
          </p>
        </div>
        <div>
          <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            <button class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-border bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 focus:z-10 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}">
              <span class="sr-only">Previous</span>
              <i data-lucide="chevron-left" class="h-4 w-4"></i>
            </button>
            
            <!-- Page 1 (Always shown) -->
            <button class="relative inline-flex items-center px-4 py-2 border border-border bg-white text-sm font-medium ${currentPage === 1 ? 'text-primary bg-primary/5 z-10 border-primary' : 'text-gray-700 hover:bg-gray-50'}">1</button>
            
            ${totalPages > 1 ? `
              <button class="relative inline-flex items-center px-4 py-2 border border-border bg-white text-sm font-medium ${currentPage === 2 ? 'text-primary bg-primary/5 z-10 border-primary' : 'text-gray-700 hover:bg-gray-50'}">2</button>
            ` : ''}

            <!-- Ellipsis if many pages -->
            ${totalPages > 3 ? `<span class="relative inline-flex items-center px-4 py-2 border border-border bg-white text-sm font-medium text-gray-700">...</span>` : ''}

            <button class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-border bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 focus:z-10 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}">
              <span class="sr-only">Next</span>
              <i data-lucide="chevron-right" class="h-4 w-4"></i>
            </button>
          </nav>
        </div>
      </div>
    </div>
  `;
}

/**
 * Tabs
 * @param {Object} props - { tabs, activeId }
 * tabs: Array of { id, label }
 */
export function Tabs({ tabs = [], activeId = '' }) {
  const renderTabs = tabs.map(tab => {
    const isActive = tab.id === activeId;
    const activeClass = isActive 
      ? 'border-primary text-primary' 
      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300';
    
    return `
      <button class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeClass}" id="tab-${tab.id}">
        ${tab.label}
      </button>
    `;
  }).join('');

  return `
    <div class="border-b border-border">
      <nav class="-mb-px flex space-x-8 px-6" aria-label="Tabs">
        ${renderTabs}
      </nav>
    </div>
  `;
}

