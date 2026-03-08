import { Invoice, Client, Product, Company } from '../types';
import { db } from './database';
import { supabase } from './supabaseClient';

interface SyncStatus {
  isSyncing: boolean;
  lastSync: Date | null;
  error: string | null;
}

type SyncCallback = (data: { invoices: Invoice[]; clients: Client[]; products: Product[]; company: Company | null }) => void;

const CACHE_KEY = 'facturapro_data_cache';
const CACHE_TIMESTAMP_KEY = 'facturapro_cache_timestamp';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export class DataSyncService {
  private syncStatus: SyncStatus = {
    isSyncing: false,
    lastSync: null,
    error: null
  };
  private onSyncComplete: SyncCallback | null = null;

  setOnSyncComplete(callback: SyncCallback | null) {
    this.onSyncComplete = callback;
  }

  // Load cache from localStorage
  private loadCacheFromStorage(): { invoices: Invoice[]; clients: Client[]; products: Product[]; company: Company | null; timestamp: number } | null {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
      if (cached && timestamp) {
        return {
          ...JSON.parse(cached),
          timestamp: parseInt(timestamp, 10)
        };
      }
    } catch (e) {
      console.error('Error loading cache:', e);
    }
    return null;
  }

  // Save cache to localStorage with size limit handling
  private saveCacheToStorage(data: { invoices: Invoice[]; clients: Client[]; products: Product[]; company: Company | null }) {
    try {
      // Try to save full data first
      const serialized = JSON.stringify(data);
      
      // Check if data is too large (> 4MB to be safe)
      if (serialized.length > 4 * 1024 * 1024) {
        console.warn('Cache data too large, storing minimal data only');
        // Store only essential data (products and company, skip invoices)
        const minimalData = {
          invoices: [],
          clients: data.clients,
          products: data.products,
          company: data.company
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(minimalData));
      } else {
        localStorage.setItem(CACHE_KEY, serialized);
      }
      localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
    } catch (e) {
      console.error('Error saving cache:', e);
      // If quota exceeded, try to clear old cache and retry with minimal data
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        try {
          localStorage.removeItem(CACHE_KEY);
          const minimalData = {
            invoices: [],
            clients: data.clients.slice(0, 100), // Limit clients
            products: data.products,
            company: data.company
          };
          localStorage.setItem(CACHE_KEY, JSON.stringify(minimalData));
          localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
        } catch (e2) {
          console.error('Failed to save even minimal cache:', e2);
        }
      }
    }
  }

  private initPromise: Promise<{ invoices: Invoice[]; clients: Client[]; products: Product[]; company: Company | null }> | null = null;

  // Initialize - always fetches from Supabase, uses cache only as fallback
  async initializeWithCache(): Promise<{
    invoices: Invoice[];
    clients: Client[];
    products: Product[];
    company: Company | null;
  }> {
    // If already initializing, return the existing promise
    if (this.initPromise) {
      console.log('Initialization already in progress, waiting...');
      return this.initPromise;
    }
    
    // Always try to fetch fresh data from Supabase
    console.log('Fetching fresh data from Supabase...');
    
    // Create and store the promise to prevent duplicate requests
    this.initPromise = this.fetchFromSupabase().finally(() => {
      this.initPromise = null;
    });
    
    return this.initPromise;
  }

  // Quick load - returns cached data immediately (for fast UI), then refreshes in background
  async quickLoad(): Promise<{
    invoices: Invoice[];
    clients: Client[];
    products: Product[];
    company: Company | null;
  }> {
    const cached = this.loadCacheFromStorage();
    
    if (cached) {
      // Return cached data immediately
      console.log('Quick load from cache:', {
        invoices: cached.invoices.length,
        clients: cached.clients.length,
        products: cached.products.length
      });
      
      // Refresh in background (don't await)
      this.initializeWithCache().catch(console.error);
      
      return {
        invoices: cached.invoices,
        clients: cached.clients,
        products: cached.products,
        company: cached.company
      };
    }
    
    // No cache, must fetch
    return this.initializeWithCache();
  }

  // Fetch from Supabase with retry mechanism and longer timeout
  private async fetchFromSupabase(retryCount = 0): Promise<{
    invoices: Invoice[];
    clients: Client[];
    products: Product[];
    company: Company | null;
  }> {
    const MAX_RETRIES = 3;
    const TIMEOUT_MS = 15000; // Increased to 15 seconds
    
    try {
      console.log(`Attempt ${retryCount + 1}/${MAX_RETRIES} to fetch from Supabase`);
      
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error(`Fetch timeout after ${TIMEOUT_MS/1000} seconds`)), TIMEOUT_MS)
      );

      const dataPromise = Promise.all([
        db.getInvoices(),
        db.getClients(),
        db.getProducts(),
        db.getCompanySettings()
      ]);

      const [invoices, clients, products, company] = await Promise.race([
        dataPromise,
        timeoutPromise
      ]);

      // Save to localStorage
      this.saveCacheToStorage({ invoices, clients, products, company });

      console.log('✅ Data successfully fetched from Supabase:', { 
        invoices: invoices.length, 
        clients: clients.length, 
        products: products.length 
      });

      return { invoices, clients, products, company };
    } catch (error) {
      console.error(`❌ Attempt ${retryCount + 1} failed:`, error);
      
      if (retryCount < MAX_RETRIES - 1) {
        console.log(`🔁 Retrying in 2 seconds... (${retryCount + 1}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return this.fetchFromSupabase(retryCount + 1);
      }
      
      console.error('❌ All retry attempts failed');
      throw error;
    }
  }

  // Refresh data in background without blocking UI
  private async refreshInBackground(): Promise<void> {
    // Check if cache is still fresh (less than 5 minutes old)
    const cached = this.loadCacheFromStorage();
    if (cached && (Date.now() - cached.timestamp < 5 * 60 * 1000)) {
      return; // Cache is fresh, no need to refresh
    }
    
    // Fetch fresh data in background (only if not already fetching)
    if (this.syncStatus.isSyncing) {
      return;
    }
    
    this.syncStatus.isSyncing = true;
    this.fetchFromSupabase().then(data => {
      this.syncStatus.isSyncing = false;
      // Notify callback with fresh data
      if (this.onSyncComplete) {
        this.onSyncComplete(data);
      }
    }).catch(err => {
      this.syncStatus.isSyncing = false;
      console.error('Background refresh failed:', err);
    });
  }

  // Perform background refresh of data from Supabase
  async performBackgroundSync(): Promise<void> {
    if (this.syncStatus.isSyncing) {
      return;
    }

    this.syncStatus.isSyncing = true;
    this.syncStatus.error = null;

    try {
      // Fetch fresh data from Supabase
      const [invoices, clients, products, company] = await Promise.all([
        db.getInvoices(),
        db.getClients(),
        db.getProducts(),
        db.getCompanySettings()
      ]);

      this.syncStatus.lastSync = new Date();
      console.log('Background refresh completed:', { 
        invoices: invoices.length, 
        clients: clients.length, 
        products: products.length 
      });

      // Notify callback with fresh data
      if (this.onSyncComplete) {
        this.onSyncComplete({ invoices, clients, products, company });
      }
    } catch (error) {
      console.error('Background refresh error:', error);
      this.syncStatus.error = error instanceof Error ? error.message : 'Unknown error';
    } finally {
      this.syncStatus.isSyncing = false;
    }
  }

  // Get current sync status
  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  // Manual sync trigger
  async manualSync(): Promise<void> {
    await this.performBackgroundSync();
  }

  // Force refresh from Supabase
  async forceRefresh(): Promise<void> {
    await this.performBackgroundSync();
  }

  // Get cached data - now just returns empty data (legacy compatibility)
  getCachedData() {
    return { invoices: [], clients: [], products: [], company: null };
  }
}

// Export a singleton instance
export const dataSyncService = new DataSyncService();