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

  // Save cache to localStorage
  private saveCacheToStorage(data: { invoices: Invoice[]; clients: Client[]; products: Product[]; company: Company | null }) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
    } catch (e) {
      console.error('Error saving cache:', e);
    }
  }

  // Initialize - returns cached data immediately, fetches fresh data in background
  async initializeWithCache(): Promise<{
    invoices: Invoice[];
    clients: Client[];
    products: Product[];
    company: Company | null;
  }> {
    // Load from localStorage first
    const cached = this.loadCacheFromStorage();
    
    // If we have cached data, return it immediately
    if (cached) {
      console.log('Using cached data from localStorage:', {
        invoices: cached.invoices.length,
        clients: cached.clients.length,
        products: cached.products.length
      });
      
      // Fetch fresh data in background (non-blocking)
      this.refreshInBackground();
      
      return {
        invoices: cached.invoices,
        clients: cached.clients,
        products: cached.products,
        company: cached.company
      };
    }
    
    // No cache - must fetch from Supabase
    return this.fetchFromSupabase();
  }

  // Fetch from Supabase with timeout
  private async fetchFromSupabase(): Promise<{
    invoices: Invoice[];
    clients: Client[];
    products: Product[];
    company: Company | null;
  }> {
    try {
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Fetch timeout')), 5000)
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

      console.log('Data fetched from Supabase:', { 
        invoices: invoices.length, 
        clients: clients.length, 
        products: products.length 
      });

      return { invoices, clients, products, company };
    } catch (error) {
      console.error('Error fetching from Supabase:', error);
      return { invoices: [], clients: [], products: [], company: null };
    }
  }

  // Refresh data in background without blocking UI
  private async refreshInBackground(): Promise<void> {
    // Check if cache is still fresh (less than 1 minute old)
    const cached = this.loadCacheFromStorage();
    if (cached && (Date.now() - cached.timestamp < 60000)) {
      return; // Cache is fresh, no need to refresh
    }
    
    // Fetch fresh data in background
    this.fetchFromSupabase().then(data => {
      // Notify callback with fresh data
      if (this.onSyncComplete) {
        this.onSyncComplete(data);
      }
    }).catch(console.error);
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