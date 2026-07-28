/**
 * Senthil Enterprises ERP - About
 */
export async function render() {
  return `
    <div class="p-6 max-w-[800px] mx-auto fade-in">
      <div class="bg-white border border-border rounded-xl p-8 text-center shadow-sm">
        <div class="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
          <i data-lucide="building-2" class="w-8 h-8 text-primary"></i>
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
  if (window.lucide) window.lucide.createIcons();
}

