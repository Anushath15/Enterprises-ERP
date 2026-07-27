/**
 * Senthil Enterprises ERP - DataProvider Abstraction
 * Routes all data requests to the active provider (Offline or API)
 */
import { OfflineDataProvider } from './offlineDataProvider.js';
import { ApiDataProvider } from './apiDataProvider.js';
import { config } from '../config/env.js';

export const DataProvider = config.API_MODE === 'online' 
  ? ApiDataProvider 
  : OfflineDataProvider;
