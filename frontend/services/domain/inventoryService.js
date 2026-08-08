import { DataProvider } from '../dataProvider.js';

export const InventoryService = {
  // In-memory reserved stock (e.g. { 'PRD-001': 5 })
  reservedStock: {},

  reserve(productId, qty) {
    if (!this.reservedStock[productId]) {
      this.reservedStock[productId] = 0;
    }
    this.reservedStock[productId] += Number(qty);
  },

  release(productId, qty) {
    if (this.reservedStock[productId]) {
      this.reservedStock[productId] -= Number(qty);
      if (this.reservedStock[productId] < 0) this.reservedStock[productId] = 0;
    }
  },
  
  clearReservations() {
    this.reservedStock = {};
  },

  getAvailableStock(productId) {
    // Route through DataProvider completely
    const product = DataProvider.getProductById 
        ? DataProvider.getProductById(productId) 
        : DataProvider.getProducts().find(p => p.id === productId);
        
    if (!product) return 0;
    const reserved = this.reservedStock[productId] || 0;
    return product.stock - reserved;
  },
  
  checkAvailability(productId, requestedQty) {
    const available = this.getAvailableStock(productId);
    return {
      isAvailable: available >= requestedQty,
      availableQty: available,
      requestedQty: requestedQty
    };
  },
  
  adjust(productId, diff) {
    DataProvider.updateStock(productId, diff);
  },
  
  commit(productId, qtyToDeduct) {
    this.release(productId, qtyToDeduct);
    this.adjust(productId, -Number(qtyToDeduct));
  }
};
