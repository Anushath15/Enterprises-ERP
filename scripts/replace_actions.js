const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'frontend/components/transaction/EntityLookup.js',
  'frontend/components/transaction/InventoryMiddleware.js',
  'frontend/components/transaction/TransactionAutosave.js',
  'frontend/components/transaction/TransactionFooter.js',
  'frontend/components/transaction/TransactionMiddlewares.js',
  'frontend/components/transaction/TransactionRow.js',
  'frontend/components/transaction/TransactionSearch.js',
  'frontend/components/transaction/TransactionTable.js',
  'frontend/components/transaction/reducers/baseReducer.js',
  'frontend/components/transaction/reducers/entityReducer.js',
  'frontend/components/transaction/reducers/itemReducer.js',
  'frontend/components/transaction/reducers/metadataReducer.js',
  'frontend/components/transaction/reducers/paymentReducer.js',
  'frontend/pages/purchases/PurchaseConfig.js',
  'frontend/pages/sales/SalesConfig.js'
];

const actions = [
  'ITEM_ADD', 'ITEM_UPDATE', 'ITEM_DELETE', 'UNDO_DELETE',
  'HEADER_UPDATE', 'PAYMENT_UPDATE', 'CALCULATE_TOTALS',
  'CLEAR_DRAFT', 'RESET', 'SET_DRAFT'
];

for (const file of filesToUpdate) {
  const fullPath = path.join(__dirname, '..', file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Check if we need to add import
    const needsImport = actions.some(action => content.includes(`'${action}'`) || content.includes(`"${action}"`));
    
    if (needsImport && !content.includes('TransactionActions')) {
      // Add import at the top
      let importPath = '';
      if (file.includes('reducers/')) {
        importPath = '../TransactionActions.js';
      } else if (file.includes('pages/')) {
        importPath = '../../components/transaction/TransactionActions.js';
      } else {
        importPath = './TransactionActions.js';
      }
      
      const importStmt = `import { TransactionActions } from '${importPath}';\n`;
      content = importStmt + content;
    }
    
    actions.forEach(action => {
      const regex1 = new RegExp(`'${action}'`, 'g');
      const regex2 = new RegExp(`"${action}"`, 'g');
      content = content.replace(regex1, `TransactionActions.${action}`);
      content = content.replace(regex2, `TransactionActions.${action}`);
    });
    
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Updated ${file}`);
  }
}
