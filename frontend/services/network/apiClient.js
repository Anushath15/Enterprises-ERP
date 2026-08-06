/**
 * Senthil Enterprises ERP - API Client
 * Centralized fetch wrapper for JWT Authorization and Error Handling
 */
import { config } from '../../config/env.js';
import { LocalStorageService } from '../storage/localStorageService.js';

class ApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  // Token logic removed

  _handleError(status, data) {
    let message = 'An unexpected error occurred.';
    
    if (data && data.error && data.error.message) {
      message = data.error.message;
    } else if (data && data.message) {
      message = data.message;
    }

    if (status === 401) {
      // Auth removed. If we hit 401, just throw error.
      throw new Error('Unauthorized request.');
    }
    
    if (status === 403) {
      throw new Error('You do not have permission to perform this action.');
    }
    
    throw new Error(message);
  }

  async _request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    try {
      const response = await fetch(url, { ...options, headers });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        this._handleError(response.status, data);
      }

      // Unpack StandardResponse if it matches the pattern
      if (data && data.success !== undefined && data.data !== undefined) {
        return data.data;
      }

      return data;
    } catch (error) {
      // Let caller handle toast notifications via UI layer, just propagate
      throw error;
    }
  }

  async get(endpoint, params = null) {
    let queryString = '';
    if (params) {
      const searchParams = new URLSearchParams();
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          searchParams.append(key, params[key]);
        }
      });
      queryString = `?${searchParams.toString()}`;
    }
    return this._request(`${endpoint}${queryString}`, { method: 'GET' });
  }

  async post(endpoint, body) {
    return this._request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  async put(endpoint, body) {
    return this._request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  }

  async delete(endpoint) {
    return this._request(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient(config.API_BASE_URL);

