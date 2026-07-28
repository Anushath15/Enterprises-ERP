/**
 * Senthil Enterprises ERP - Help & Support
 */
export async function render() {
  return `
    <div class="p-6 max-w-[800px] mx-auto fade-in">
      <div class="mb-6 border-b border-border pb-4">
        <h1 class="text-2xl font-bold text-text">Help & Support</h1>
        <p class="text-sm text-gray-400 mt-1">Frequently asked questions and system usage guide.</p>
      </div>

      <div class="space-y-4">
        <div class="bg-white border border-border rounded-lg p-5">
          <h3 class="font-semibold text-text mb-2">How does the Offline Mode work?</h3>
          <p class="text-sm text-gray-600">The ERP is designed to work completely offline. All data is saved to your local machine. If internet is lost, you can continue billing and managing inventory without interruption.</p>
        </div>
        <div class="bg-white border border-border rounded-lg p-5">
          <h3 class="font-semibold text-text mb-2">How to collect partial payments?</h3>
          <p class="text-sm text-gray-600">Go to Credit Management, click on the three dots next to a customer, and select "Payment Collection". You can enter partial amounts there.</p>
        </div>
        <div class="bg-white border border-border rounded-lg p-5">
          <h3 class="font-semibold text-text mb-2">My printer is not working, what to do?</h3>
          <p class="text-sm text-gray-600">Check if the thermal printer is connected via USB. Go to Settings > Printers to ensure the correct printer is selected. Try restarting the system if it still fails.</p>
        </div>
      </div>
    </div>
  `;
}

export function onMount(rootElement) {
}

