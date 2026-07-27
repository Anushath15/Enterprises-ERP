/**
 * Senthil Enterprises ERP - Profile
 */
export async function render() {
  return `
    <div class="p-6 max-w-[800px] mx-auto fade-in">
      <div class="bg-white rounded-xl border border-border overflow-hidden">
        <div class="h-32 bg-primary/10"></div>
        <div class="px-6 pb-6 relative">
          <div class="w-24 h-24 rounded-full border-4 border-white bg-primary text-white flex items-center justify-center text-3xl font-bold -mt-12 mb-4 shadow-sm">
            A
          </div>
          <h1 class="text-2xl font-bold text-text">Admin User</h1>
          <p class="text-sm text-gray-500">Administrator</p>
          
          <div class="mt-6 pt-6 border-t border-border space-y-4">
            <div class="flex">
               <span class="w-32 text-sm text-gray-500">Username:</span>
               <span class="text-sm font-medium text-text">admin</span>
             </div>
             <div class="flex">
               <span class="w-32 text-sm text-gray-500">Contact:</span>
               <span class="text-sm font-medium text-text">+91 9999999999</span>
             </div>
             <div class="flex">
               <span class="w-32 text-sm text-gray-500">Account Type:</span>
               <span class="text-sm font-medium text-text">Full Access</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function onMount(rootElement) {
}
