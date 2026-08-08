import { TransactionPage } from '../../components/transaction/TransactionPage.js';
import { SalesConfig } from './SalesConfig.js';

let page = null;

export async function render() {
  page = TransactionPage(SalesConfig);
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
