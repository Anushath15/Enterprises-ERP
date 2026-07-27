/**
 * Senthil Enterprises ERP - About
 */
export async function render() {
  return `
    <div class="p-6 max-w-[800px] mx-auto fade-in">
      <div class="bg-white border border-border rounded-xl p-8 text-center shadow-sm">
        <div class="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"/></svg>
        </div>
        <h1 class="text-2xl font-bold text-text mb-2">Senthil Enterprises ERP</h1>
        <p class="text-gray-500 mb-6">Version 1.0 (Beta)</p>
        
        <p class="text-sm text-gray-600 mb-8 max-w-lg mx-auto">
          A custom-built, offline-first Enterprise Resource Planning system designed specifically for Hardware, Electrical, Plumbing, Sanitary, and Construction Materials retail businesses.
        </p>

        <div class="text-xs text-gray-400 space-y-1 border-t border-border pt-6">
          <p>&copy; 2026 Senthil Enterprises. All rights reserved.</p>
          <p>Built for speed, reliability, and local offline usage.</p>
        </div>
      </div>
    </div>
  `;
}

export function onMount(rootElement) {
}
