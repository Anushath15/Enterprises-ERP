/**
 * Senthil Enterprises ERP - Access Denied Page
 */
export async function render() {
  return `
    <div class="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <div class="w-16 h-16 rounded-2xl bg-danger/10 flex items-center justify-center mb-5">
        <i data-lucide="shield-alert" class="w-8 h-8 text-danger"></i>
      </div>
      <h1 class="text-2xl font-bold text-text mb-2">Access Denied</h1>
      <p class="text-sm text-gray-500 mb-6 max-w-md">You do not have permission to view this page. Contact your administrator if you believe this is a mistake.</p>
      <a href="#/" class="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
        <i data-lucide="arrow-left" class="w-4 h-4 mr-2"></i> Back to Dashboard
      </a>
    </div>
  `;
}
