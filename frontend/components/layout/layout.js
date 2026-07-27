/**
 * Senthil Enterprises ERP - Layout Components
 * Purpose: Reusable application shell components (Sidebar, Navbar, Breadcrumb, Footer)
 */

/**
 * Main Sidebar Navigation
 * @param {Object} props - { links, currentRoute, user }
 */
export function Sidebar({ links = [], currentRoute = '#/dashboard' }) {
  // Navigation mapping to ensure exact icon fidelity based on route
  const renderLinks = () => {
    return links.map(link => {
      const isActive = link.path === currentRoute;
      const activeClass = isActive ? 'active text-primary' : 'text-gray-500 hover:text-text';
      const iconClass = isActive ? 'text-primary' : 'text-gray-400';
      
      return `
        <a href="${link.path}" class="sidebar-link ${activeClass} flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors">
          <div class="w-5 h-5 mr-3 ${iconClass}">${link.icon}</div>
          ${link.label}
        </a>
      `;
    }).join('');
  };

  return `
    <aside class="fixed left-0 top-0 h-screen w-64 bg-white border-r border-border z-50 flex flex-col">
      <!-- Logo Area -->
      <div class="h-16 flex items-center px-6 border-b border-border">
        <div class="w-8 h-8 rounded-lg bg-primary flex items-center justify-center mr-3">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
        </div>
        <div>
          <h1 class="text-sm font-bold text-text leading-tight">Senthil Enterprises</h1>
          <p class="text-[10px] text-gray-400 font-medium tracking-wide uppercase">ERP System</p>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        ${renderLinks()}
      </nav>

      <!-- Sidebar Footer -->
      <div class="p-4 border-t border-border">
        <div class="flex items-center px-2">
          <div class="w-2 h-2 rounded-full bg-success mr-2"></div>
          <span class="text-xs text-gray-400 font-medium">System Online</span>
        </div>
      </div>
    </aside>
  `;
}

/**
 * Top Navbar
 * @param {Object} props - { title, date, userInitials, userName, role }
 */
export function Navbar({ title = 'Dashboard', date = '', userInitials = 'SK', userName = 'Senthil Kumar', role = 'Store Manager' }) {
  return `
    <header class="h-16 bg-white border-b border-border fixed top-0 right-0 left-64 z-40 flex items-center justify-between px-6 transition-all duration-300">
      <!-- Left: Breadcrumb / Page Title -->
      <div class="flex items-center">
        <h2 class="text-lg font-semibold text-text">${title}</h2>
        ${date ? `
          <span class="mx-3 text-gray-300">|</span>
          <span class="text-sm text-gray-400">${date}</span>
        ` : ''}
      </div>

      <!-- Right: Actions -->
      <div class="flex items-center gap-4">
        <!-- Global Search -->
        <div class="relative hidden sm:block">
          <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
          </svg>
          <input type="text" placeholder="Search invoices, products, customers..." 
            class="search-input w-64 md:w-80 pl-10 pr-4 py-2 bg-gray-50 border border-border rounded-lg text-sm text-text placeholder-gray-400 focus:outline-none focus:border-primary transition-all">
          <kbd class="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-gray-400 bg-white px-1.5 py-0.5 rounded border border-border hidden lg:block">Ctrl K</kbd>
        </div>

        <!-- Notifications -->
        <button class="relative p-2 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200">
          <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"/>
          </svg>
          <span class="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full notification-dot"></span>
        </button>

        <!-- User Profile -->
        <div class="flex items-center gap-3 pl-4 border-l border-border cursor-pointer">
          <div class="text-right hidden md:block">
            <p class="text-sm font-medium text-text">${userName}</p>
            <p class="text-xs text-gray-400">${role}</p>
          </div>
          <div class="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
            <span class="text-sm font-semibold text-primary">${userInitials}</span>
          </div>
        </div>
      </div>
    </header>
  `;
}

/**
 * Breadcrumb
 * @param {Array} paths - Array of objects { label, url }
 */
export function Breadcrumb({ paths = [] }) {
  const items = paths.map((path, idx) => {
    const isLast = idx === paths.length - 1;
    if (isLast) {
      return `<span class="text-sm font-medium text-text">${path.label}</span>`;
    }
    return `
      <a href="${path.url}" class="text-sm font-medium text-gray-400 hover:text-primary transition-colors">${path.label}</a>
      <span class="mx-2 text-gray-300">/</span>
    `;
  }).join('');

  return `<nav class="flex items-center mb-4">${items}</nav>`;
}
