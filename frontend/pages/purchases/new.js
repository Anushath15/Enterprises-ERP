import { TransactionPage } from '../../components/transaction/TransactionPage.js';
import { PurchaseConfig } from './PurchaseConfig.js';

let page = null;

export async function render() {
  page = TransactionPage(PurchaseConfig);
  // Store page instance to access bindEvents later
  window.__activeTransactionPage = page;
  return await page.render();
}

export async function onMount(rootElement) {
  if (window.__activeTransactionPage) {
    await window.__activeTransactionPage.bindEvents(rootElement);
    delete window.__activeTransactionPage;
  }
  
  return function cleanup() {
    if (page) {
      page.teardown();
      page = null;
    }
  };
}
