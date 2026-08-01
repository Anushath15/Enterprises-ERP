/**
 * Senthil Enterprises ERP - Authentication Service
 * Manages session state, expiry, and role-based authorization.
 */
import { LocalStorageService } from './storage/localStorageService.js';
import { DataProvider } from './dataProvider.js';

export const ROLES = {
  admin: 'Administrator',
  manager: 'Manager',
  user: 'Sales User'
};

const ROLE_ALIASES = {
  'Administrator': 'admin',
  'Administrator (Full Access)': 'admin',
  'Admin': 'admin',
  'admin': 'admin',
  'Manager': 'manager',
  'Manager (Can edit, cannot delete)': 'manager',
  'manager': 'manager',
  'Sales User': 'user',
  'Sales User (Billing only)': 'user',
  'User': 'user',
  'user': 'user'
};

export const SESSION_TTL_DAYS = 7 * 24 * 60 * 60 * 1000;
export const SESSION_TTL_HOURS = 8 * 60 * 60 * 1000;

export const AuthService = {
  normalizeRole(role) {
    if (!role) return null;
    return ROLE_ALIASES[role] || role;
  },

  roleLabel(role) {
    const canonical = this.normalizeRole(role);
    return ROLES[canonical] || role || '';
  },

  getCurrentUser() {
    const user = LocalStorageService.get('auth_user');
    if (!user || !user.id) return null;
    return { ...user, role: this.normalizeRole(user.role) };
  },

  hasValidSession() {
    const token = LocalStorageService.get('auth_token');
    const user = LocalStorageService.get('auth_user');
    const expires = LocalStorageService.get('auth_expires_at');
    if (!token || !user || !user.id) return false;
    if (typeof expires !== 'number' || Date.now() >= expires) return false;
    return true;
  },

  hasRole(allowed) {
    if (!Array.isArray(allowed) || allowed.length === 0) return true;
    const user = this.getCurrentUser();
    if (!user || !user.role) return false;
    return allowed.includes(this.normalizeRole(user.role));
  },

  async login(username, password, remember = true) {
    const response = await DataProvider.login(username, password);
    if (!response || !response.access_token || !response.user) {
      throw new Error('Login failed. No session token returned.');
    }
    const ttl = remember ? SESSION_TTL_DAYS : SESSION_TTL_HOURS;
    LocalStorageService.set('auth_token', response.access_token);
    LocalStorageService.set('auth_user', response.user);
    LocalStorageService.set('auth_expires_at', Date.now() + ttl);
    window.dispatchEvent(new CustomEvent('auth:changed'));
    return response.user;
  },

  clearSession() {
    LocalStorageService.remove('auth_token');
    LocalStorageService.remove('auth_user');
    LocalStorageService.remove('auth_expires_at');
  },

  logout() {
    this.clearSession();
    window.dispatchEvent(new CustomEvent('auth:changed'));
    this.redirectToLogin();
  },

  redirectToLogin() {
    window.location.hash = '#/login';
  },

  async resetPassword(userId, newPassword) {
    return await DataProvider.resetUserPassword(userId, newPassword);
  }
};
