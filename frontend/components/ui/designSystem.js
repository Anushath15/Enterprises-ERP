/**
 * Senthil Enterprises ERP - RC3.2 Semantic Layout Engine
 * Strictly enforces design tokens and semantic containers.
 */

// ======================================
// 1. App Shell
// ======================================
export function AppLayout({ sidebarLinks, currentRoute, user, children, sidebarCollapsed }) {
  const isMobile = window.innerWidth < 768;
  const defaultDrawerState = isMobile ? '' : (sidebarCollapsed ? '' : 'drawer-open');
  
  return `
    <div class="sidebar-manager ${defaultDrawerState}" id="sidebar-manager">
      ${SidebarManager({ links: sidebarLinks, currentRoute, user })}
    </div>
    <div class="sidebar-overlay" id="sidebar-overlay" data-toggle-sidebar></div>
    <div class="main-wrapper" id="main-wrapper">
      ${TopNavbar({ title: 'Senthil ERP', user })}
      <main class="pt-[var(--header-height)] min-h-screen">
        <div id="page-root" class="w-full h-full">
          ${children || ''}
        </div>
      </main>
    </div>
  `;
}

export function updateSidebarActiveState() {
  const currentRoute = window.location.hash || '#/';
  document.querySelectorAll('.sidebar-link').forEach(link => {
    const route = link.getAttribute('data-route');
    if (!route) return;
    
    // Remove active styles
    link.classList.remove('active', 'text-primary', 'bg-blue-50');
    link.classList.add('text-gray-500', 'hover:text-text', 'hover:bg-gray-50');
    
    // Remove icon active styles
    const iconWrapper = link.querySelector('div');
    if (iconWrapper) {
      iconWrapper.classList.remove('text-primary');
      iconWrapper.classList.add('text-gray-400');
    }

    if (route === currentRoute) {
      // Add active styles
      link.classList.add('active', 'text-primary', 'bg-blue-50');
      link.classList.remove('text-gray-500', 'hover:text-text', 'hover:bg-gray-50');
      
      // Add icon active styles
      if (iconWrapper) {
        iconWrapper.classList.add('text-primary');
        iconWrapper.classList.remove('text-gray-400');
      }
    }
  });
}

export function SidebarManager({ links = [], currentRoute = '#/', user }) {
  const renderLinks = () => {
    return links.map(link => {
      const isActive = link.path === currentRoute;
      const activeClass = isActive ? 'active text-primary bg-blue-50' : 'text-gray-500 hover:text-text hover:bg-gray-50';
      const iconClass = isActive ? 'text-primary' : 'text-gray-400';
      
      return `
        <a href="${link.path}" data-route="${link.path}" class="sidebar-link ${activeClass} flex items-center px-3 py-2.5 mb-1 rounded-lg text-sm font-medium transition-colors">
          <div class="w-5 h-5 mr-3 ${iconClass} flex-shrink-0">${link.icon}</div>
          <span class="sidebar-label whitespace-nowrap overflow-hidden text-ellipsis">${link.label}</span>
        </a>
      `;
    }).join('');
  };

  return `
    <div class="flex flex-col h-full bg-white">
      <div class="h-[var(--header-height)] flex-none flex items-center px-6 border-b border-border">
        <div class="w-10 h-10 flex items-center justify-center mr-3 flex-shrink-0">
          <img src="assets/logo.png" alt="Senthil Enterprises" class="w-full h-full object-contain drop-shadow-sm" />
        </div>
        <div class="sidebar-label whitespace-nowrap overflow-hidden">
          <h1 class="text-sm font-bold text-text leading-tight">Senthil Enterprises</h1>
          <p class="text-[10px] text-gray-400 font-medium tracking-wide uppercase">System RC3.2</p>
        </div>
      </div>
      <nav class="flex-1 overflow-y-auto py-4 px-3">
        ${renderLinks()}
      </nav>
      <div class="p-4 border-t border-border flex-none sidebar-label">
        <div class="flex items-center px-2">
          <div class="w-2 h-2 rounded-full bg-success mr-2"></div>
          <span class="text-xs text-gray-400 font-medium">Local Setup</span>
        </div>
      </div>
    </div>
  `;
}

window.toggleSidebarDrawer = function() {
  const sidebar = document.getElementById('sidebar-manager');
  const overlay = document.getElementById('sidebar-overlay');
  if (sidebar && overlay) {
    sidebar.classList.toggle('drawer-open');
    overlay.classList.toggle('active');
  }
};

document.addEventListener('click', (e) => {
  if (e.target.closest('[data-toggle-sidebar]')) {
    window.toggleSidebarDrawer();
    return;
  }
  const closeBtn = e.target.closest('[data-close-modal]');
  if (closeBtn) {
    const modal = document.getElementById(closeBtn.getAttribute('data-close-modal'));
    if (modal) modal.classList.add('hidden');
  }
});

export function TopNavbar({ title, user }) {
  const name = (user && user.name) || 'User';
  const role = (user && user.roleLabel) || '';
  const initials = (user && user.initials) || 'U';
  return `
    <header class="h-[var(--header-height)] bg-white border-b border-border fixed top-0 right-0 left-0 z-40 flex items-center justify-between px-4 sm:px-6 transition-all duration-300" id="top-navbar">
      <div class="flex items-center gap-4">
        <button class="md:hidden p-2 -ml-2 rounded-lg text-gray-500 hover:bg-gray-100 focus:outline-none" data-toggle-sidebar>
          <i data-lucide="menu" class="w-5 h-5"></i>
        </button>
        <h2 class="text-lg font-semibold text-text truncate max-w-[200px] sm:max-w-md" id="navbar-title">${title}</h2>
      </div>
      <div class="flex items-center gap-3" id="navbar-user-area">
        <div class="flex items-center gap-3 pl-3">
          <div class="text-right hidden md:block">
            <p class="text-sm font-medium text-text leading-tight">${name}</p>
            <p class="text-[11px] text-gray-400">${role}</p>
          </div>
          <div class="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
            <span class="text-xs font-semibold text-primary">${initials}</span>
          </div>
        </div>
      </div>
    </header>
  `;
}

export function initNavbarResizeLogic() {
  const adjustNavbar = () => {
    const navbar = document.getElementById('top-navbar');
    const sidebar = document.getElementById('sidebar-manager');
    if (navbar && sidebar && window.innerWidth >= 768) {
      navbar.style.left = sidebar.offsetWidth + 'px';
    } else if (navbar) {
      navbar.style.left = '0px';
    }
  };
  window.addEventListener('resize', adjustNavbar);
  setTimeout(adjustNavbar, 50);
}

// ======================================
// 2. Structural Primitives (Stage 1)
// ======================================
export function Container({ children }) {
  return `<div class="responsive-page-container fade-in">${children}</div>`;
}

export function Section({ children }) {
  return `<section class="mb-[var(--spacing-md)]">${children}</section>`;
}

export function PageHeader({ title, subtitle, actionsHtml = '' }) {
  return `
    <div class="flex flex-wrap items-center justify-between gap-[var(--spacing-sm)] mb-[var(--spacing-md)]">
      <div>
        <h1 class="text-2xl font-bold text-text">${title}</h1>
        ${subtitle ? `<p class="text-sm text-gray-400 mt-1">${subtitle}</p>` : ''}
      </div>
      <div class="flex flex-wrap items-center gap-[var(--spacing-xs)]">
        ${actionsHtml}
      </div>
    </div>
  `;
}

export function Toolbar({ children }) {
  return `<div class="responsive-toolbar">${children}</div>`;
}

// ======================================
// 3. Grid & Layout Primitives
// ======================================
export function Stack({ children, spacing = 'md' }) {
  const spaceClass = {
    'xs': 'gap-[var(--spacing-xs)]',
    'sm': 'gap-[var(--spacing-sm)]',
    'md': 'gap-[var(--spacing-md)]',
    'lg': 'gap-[var(--spacing-lg)]'
  }[spacing] || 'gap-[var(--spacing-md)]';
  
  return `<div class="flex flex-col ${spaceClass}">${children}</div>`;
}

export function Inline({ children, align = 'center', justify = 'between', wrap = true }) {
  const wrapClass = wrap ? 'flex-wrap' : 'flex-nowrap';
  return `<div class="flex items-${align} justify-${justify} ${wrapClass} gap-[var(--spacing-sm)]">${children}</div>`;
}

export function KPIGrid({ children }) {
  return `<div class="responsive-grid">${children}</div>`;
}

export function CardGrid({ children }) {
  return `<div class="grid-auto-fit">${children}</div>`;
}

export function FormGrid({ children }) {
  return `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[var(--spacing-md)]">${children}</div>`;
}

// ======================================
// 4. Data Display Primitives
// ======================================
export function TableWrapper({ headers, rowsHtml, tbodyId = '' }) {
  const thead = headers.map(h => `<th class="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">${h}</th>`).join('');
  const tbodyAttr = tbodyId ? `id="${tbodyId}"` : '';
  return `
    <div class="responsive-table-container fade-in shadow-sm">
      <table class="responsive-table w-full">
        <thead><tr class="border-b border-border bg-gray-50/50">${thead}</tr></thead>
        <tbody ${tbodyAttr} class="divide-y divide-border">
          ${rowsHtml || ''}
        </tbody>
      </table>
    </div>
  `;
}

export function EmptyState({ icon = 'folder-open', title = 'No Data Found', subtitle = 'Try adjusting your filters or creating a new record.' }) {
  return `
    <div class="empty-state py-12 flex flex-col items-center justify-center text-center bg-white rounded-[var(--radius-md)] border border-border shadow-sm">
      <div class="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
        <i data-lucide="${icon}" class="w-8 h-8 text-gray-400"></i>
      </div>
      <h3 class="text-lg font-medium text-gray-900">${title}</h3>
      <p class="text-sm text-gray-500 mt-1 max-w-sm">${subtitle}</p>
    </div>
  `;
}

export function LoadingState() {
  return `
    <div class="py-12 flex flex-col items-center justify-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <p class="text-sm text-gray-500 mt-4">Loading data...</p>
    </div>
  `;
}

// ======================================
// 5. Complex Shells
// ======================================
export function ModalShell({ id, title, bodyHtml, footerHtml, widthClass = 'max-w-4xl' }) {
  return `
    <div class="responsive-modal-overlay hidden" id="${id}">
      <div class="responsive-modal ${widthClass} fade-in">
        <div class="responsive-modal-header bg-white border-b border-border px-6 py-4 flex justify-between items-center sticky top-0 z-20">
          <h3 class="text-lg font-semibold text-text">${title}</h3>
          <button type="button" class="text-gray-400 hover:text-gray-600 rounded-lg p-1.5 hover:bg-gray-100 transition-colors" data-close-modal="${id}">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>
        <div class="responsive-modal-body bg-gray-50/50 p-6 overflow-y-auto flex-1">
          ${bodyHtml}
        </div>
        <div class="responsive-modal-footer bg-white border-t border-border px-6 py-4 flex justify-end gap-[var(--spacing-sm)] sticky bottom-0 z-20">
          ${footerHtml}
        </div>
      </div>
    </div>
  `;
}
