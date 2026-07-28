/**
 * Senthil Enterprises ERP - 404 Page Controller
 */
export async function render() {
  return `
    <div class="flex flex-col items-center justify-center h-full p-20 text-center">
      <div class="text-6xl font-bold text-primary mb-4">404</div>
      <h1 class="text-2xl font-bold text-text mb-2">Page Not Found</h1>
      <p class="text-gray-500 max-w-md mx-auto mb-8">The page you are looking for does not exist or has been moved.</p>
      <a href="#/" class="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors">Return to Dashboard</a>
    </div>
  `;
}

export function onMount(rootElement) {}

