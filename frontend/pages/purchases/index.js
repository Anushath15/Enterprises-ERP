import { Container, PageHeader } from '../../components/ui/designSystem.js';
import { render as renderLegacy, onMount as onMountLegacy } from '../purchases.js';

export async function render() {
  // For now, we will render the legacy purchases list, but we will redirect the "New Purchase Order" button to the new route.
  const legacyHtml = await renderLegacy();
  
  // We need to inject a script or modify the HTML to change the New button behavior, 
  // but since we are replacing purchases entirely eventually, let's just render the old one and override the button in onMount.
  return legacyHtml;
}

export function onMount(rootElement) {
  const cleanup = onMountLegacy(rootElement);

  // Override the "New Purchase Order" button to redirect to our new full-page form
  const newBtns = rootElement.querySelectorAll('button');
  newBtns.forEach(btn => {
    if (btn.textContent.includes('New Purchase Order')) {
      // Remove legacy click handler
      const clone = btn.cloneNode(true);
      btn.parentNode.replaceChild(clone, btn);
      clone.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.location.hash = '#/purchases/new';
      });
    }
  });

  return cleanup;
}
