const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const EXCEL_PATH = path.resolve(__dirname, '../../Tally_Export.xlsx');
const OUTPUT_PATH = path.resolve(__dirname, '../frontend/data/products.json');

// Classification Rules
const categorizeProduct = (name) => {
  const upperName = name.toUpperCase();
  
  if (upperName.includes('PIPE') || upperName.includes('PVC') || upperName.includes('CPVC') || upperName.includes('ELBOW') || upperName.includes('TEE') || upperName.includes('NIPPLE') || upperName.includes('COUPLER') || upperName.includes('VALVE') || upperName.includes('REDUCER') || upperName.includes('PLUMBING') || upperName.includes('BEND')) {
    return { category: 'Plumbing', gst: 18, unit: 'Nos', minStock: 10, hsn: '3917' };
  }
  
  if (upperName.includes('WIRE') || upperName.includes('SWITCH') || upperName.includes('MCB') || upperName.includes('LED') || upperName.includes('BULB') || upperName.includes('CABLE') || upperName.includes('SOCKET') || upperName.includes('PLUG') || upperName.includes('ELECTRICAL')) {
    return { category: 'Electrical', gst: 18, unit: 'Nos', minStock: 10, hsn: '8544' };
  }
  
  if (upperName.includes('PAINT') || upperName.includes('BRUSH') || upperName.includes('THINNER') || upperName.includes('PRIMER') || upperName.includes('ROLLER')) {
    return { category: 'Paint', gst: 18, unit: 'Ltr', minStock: 5, hsn: '3209' };
  }
  
  if (upperName.includes('CEMENT') || upperName.includes('SAND') || upperName.includes('STEEL') || upperName.includes('TMT') || upperName.includes('BRICK')) {
    return { category: 'Building Material', gst: 28, unit: 'Bags', minStock: 50, hsn: '2523' };
  }
  
  if (upperName.includes('SCREW') || upperName.includes('BOLT') || upperName.includes('NUT') || upperName.includes('NAIL') || upperName.includes('HINGE') || upperName.includes('HANDLE') || upperName.includes('LOCK')) {
    return { category: 'Hardware', gst: 18, unit: 'Pkt', minStock: 5, hsn: '7318' };
  }
  
  if (upperName.includes('TOOLS') || upperName.includes('HAMMER') || upperName.includes('DRILL') || upperName.includes('CUTTER') || upperName.includes('BLADE')) {
    return { category: 'Tools', gst: 18, unit: 'Nos', minStock: 2, hsn: '8205' };
  }
  
  return { category: 'Uncategorized', gst: 18, unit: 'Nos', minStock: 5, hsn: '0000' };
};

function main() {
  console.log('--- Senthil Enterprises ERP Pilot Importer ---');
  console.log(`Reading Master File: ${EXCEL_PATH}`);
  
  if (!fs.existsSync(EXCEL_PATH)) {
    console.error('ERROR: Tally_Export.xlsx not found at the specified path.');
    process.exit(1);
  }

  const workbook = xlsx.readFile(EXCEL_PATH);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawData = xlsx.utils.sheet_to_json(sheet);
  
  let imported = 0;
  let skipped = 0;
  let duplicates = 0;
  let invalidPrices = 0;
  let missingNames = 0;
  let warnings = 0;
  
  const products = [];
  const seenNames = new Set();
  
  let skuCounter = 1;
  
  for (let row of rawData) {
    if (row.TYPE !== 'STOCKITEM') {
      skipped++;
      continue; // Skip Units, StockGroups, Currencies etc.
    }
    
    const name = row['NAME'];
    const priceStr = row['STANDARDPRICELIST.LIST.RATE'] || row['STANDARDCOSTLIST.LIST.RATE'] || '';
    const hsnStr = row['HSNDETAILS.LIST.HSNCODE'] || '';
    const unitStr = row['BASEUNITS'] || 'Nos';
    
    if (!name) {
      missingNames++;
      continue;
    }
    
    if (seenNames.has(name.toLowerCase())) {
      duplicates++;
      continue;
    }
    
    // Parse price like "90.00/Nos" => 90.00
    let price = 0;
    if (priceStr) {
      const match = priceStr.match(/^([\d\.]+)/);
      if (match) price = parseFloat(match[1]);
    }
    
    if (isNaN(price) || price <= 0) {
      invalidPrices++;
      warnings++;
      // Import anyway but log warning
    }
    
    const classification = categorizeProduct(name);
    
    const sku = `SE${String(skuCounter).padStart(6, '0')}`;
    skuCounter++;
    
    const product = {
      id: `PRD-${sku}`,
      sku: sku,
      barcode: sku,
      name: name,
      category: classification.category,
      price: isNaN(price) ? 0 : price,
      buyingPrice: 0, // Will be set via opening stock wizard
      stock: 0,
      minStock: classification.minStock,
      unit: unitStr || classification.unit,
      gst: classification.gst,
      hsn: hsnStr || classification.hsn,
      status: 'Out of Stock',
      statusBadge: 'danger',
      supplier: 'Opening Balance',
      brand: '',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1
    };
    
    products.push(product);
    seenNames.add(name.toLowerCase());
    imported++;
  }
  
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(products, null, 2));
  
  console.log('\n--- IMPORT REPORT ---');
  console.log(`Parsed STOCKITEM rows:  ${imported + duplicates + missingNames}`);
  console.log(`Successfully Imported:  ${imported}`);
  console.log(`Skipped Non-Items:      ${skipped}`);
  console.log(`Duplicates:             ${duplicates}`);
  console.log(`Zero/Invalid Prices:    ${invalidPrices}`);
  console.log(`Missing Names:          ${missingNames}`);
  console.log(`Warnings:               ${warnings}`);
  console.log(`\nSuccess! Wrote ${imported} products to ${OUTPUT_PATH}`);
}

main();
