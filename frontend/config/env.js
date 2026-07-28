/**
 * Senthil Enterprises ERP - Environment Configuration
 */
export const config = {
  // 'offline' routes to LocalStorage via OfflineDataProvider
  // 'online' routes to FastAPI via ApiDataProvider
  API_MODE: 'offline',
  
  // FastAPI Backend URL
  API_BASE_URL: 'http://localhost:8000/api/v1'
};

