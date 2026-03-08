import { Invoice, Client, Product, Company } from '../types';
import { jsonDatabase } from './jsonDatabase';
import { db } from './database';
import { getDbMode, supabase } from './supabaseClient';

interface SyncStatus {
  isSyncing: boolean;
  lastSync: Date | null;
  error: string | null;
}

export class DataSyncService {
  private syncStatus: SyncStatus = {
    isSyncing: false,
    lastSync: null,
    error: null
  };

  // Initialize with cached data and start background sync
  async initializeWithCache(): Promise<{
    invoices: Invoice[];
    clients: Client[];
    products: Product[];
    company: Company | null;
  }> {
    // Load cached data for immediate display
    const cachedData = jsonDatabase.getAllData();

    // Start background sync in parallel
    this.performBackgroundSync();

    return {
      invoices: cachedData.invoices,
      clients: cachedData.clients,
      products: cachedData.products,
      company: cachedData.company
    };
  }

  // Perform background sync of data
  async performBackgroundSync(): Promise<void> {
    if (this.syncStatus.isSyncing || getDbMode() === 'local') {
      return;
    }

    this.syncStatus.isSyncing = true;
    this.syncStatus.error = null;

    try {
      // Fetch fresh data from main source
      const [invs, cls, prods, comp] = await Promise.all([
        db.getInvoices(),
        db.getClients(),
        db.getProducts(),
        db.getCompanySettings()
      ]);

      // Update JSON cache with fresh data
      jsonDatabase.setAllData({
        invoices: invs,
        clients: cls,
        products: prods,
        company: comp
      });

      this.syncStatus.lastSync = new Date();
      console.log('Data synced successfully');
    } catch (error) {
      console.error('Background sync error:', error);
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

  // Update specific data and sync to both sources
  async updateInvoices(invoices: Invoice[]): Promise<void> {
    // Update local cache immediately for UI responsiveness
    jsonDatabase.setInvoices(invoices);

    // In a real implementation, we would also update the remote database
    // For now, we'll just keep the cache updated
  }

  async updateClients(clients: Client[]): Promise<void> {
    // Update local cache immediately for UI responsiveness
    jsonDatabase.setClients(clients);
  }

  async updateProducts(products: Product[]): Promise<void> {
    // Update local cache immediately for UI responsiveness
    jsonDatabase.setProducts(products);
  }

  async updateCompany(company: Company | null): Promise<void> {
    // Update local cache immediately for UI responsiveness
    jsonDatabase.setCompany(company);
  }

  // Add a single item and sync
  async addInvoice(invoice: Invoice): Promise<void> {
    const currentInvoices = jsonDatabase.getInvoices();
    const updatedInvoices = [...currentInvoices, invoice];
    jsonDatabase.setInvoices(updatedInvoices);
  }

  async addClient(client: Client): Promise<void> {
    const currentClients = jsonDatabase.getClients();
    const updatedClients = [...currentClients, client];
    jsonDatabase.setClients(updatedClients);
  }

  async addProduct(product: Product): Promise<void> {
    const currentProducts = jsonDatabase.getProducts();
    const updatedProducts = [...currentProducts, product];
    jsonDatabase.setProducts(updatedProducts);
  }

  async updateProduct(product: Product): Promise<void> {
    const currentProducts = jsonDatabase.getProducts();
    const updatedProducts = currentProducts.map(p => p.id === product.id ? product : p);
    jsonDatabase.setProducts(updatedProducts);
  }

  // Delete operations
  async deleteInvoice(id: string): Promise<void> {
    const currentInvoices = jsonDatabase.getInvoices();
    const updatedInvoices = currentInvoices.filter(inv => inv.id !== id);
    jsonDatabase.setInvoices(updatedInvoices);
  }

  async deleteClient(id: string): Promise<void> {
    const currentClients = jsonDatabase.getClients();
    const updatedClients = currentClients.filter(cli => cli.id !== id);
    jsonDatabase.setClients(updatedClients);
  }

  async deleteProduct(id: string): Promise<void> {
    const currentProducts = jsonDatabase.getProducts();
    const updatedProducts = currentProducts.filter(prod => prod.id !== id);
    jsonDatabase.setProducts(updatedProducts);
  }

  // Get data from cache (fast)
  getCachedData() {
    return jsonDatabase.getAllData();
  }

  // Force refresh from remote and update cache
  async forceRefresh(): Promise<void> {
    await this.performBackgroundSync();
  }

  // Sync local data to Supabase when coming back online
  async syncLocalToSupabase(): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    try {
      // Get all local data
      const localData = jsonDatabase.getAllData();
      
      // Sync clients
      for (const client of localData.clients) {
        try {
          const { error } = await supabase
            .from('customers')
            .upsert([{
              id: client.id,
              name: client.name,
              address: client.address,
              city: client.city,
              gsm1: client.gsm1,
              gsm2: client.gsm2,
              phone: client.phone,
              email: client.email,
              ice: client.ice,
              is_blocked: client.is_blocked,
              created_at: client.created_at
            }]);
          if (error) errors.push(`Client ${client.name}: ${error.message}`);
        } catch (e) {
          errors.push(`Client ${client.name}: ${e instanceof Error ? e.message : 'Unknown error'}`);
        }
      }

      // Sync products
      for (const product of localData.products) {
        try {
          const { error } = await supabase
            .from('products')
            .upsert([{
              id: product.id,
              name: product.name,
              description: product.description,
              price: product.price,
              unit: product.unit
            }]);
          if (error) errors.push(`Product ${product.name}: ${error.message}`);
        } catch (e) {
          errors.push(`Product ${product.name}: ${e instanceof Error ? e.message : 'Unknown error'}`);
        }
      }

      // Sync invoices
      for (const invoice of localData.invoices) {
        try {
          // First upsert the invoice
          const { error: invError } = await supabase
            .from('invoices')
            .upsert([{
              id: invoice.id,
              number: invoice.number,
              date: invoice.date,
              due_date: invoice.dueDate,
              po_number: invoice.poNumber,
              customer_id: invoice.clientId,
              status: invoice.status,
              notes: invoice.notes,
              subtotal: invoice.subtotal,
              tva_total: invoice.tvaTotal,
              discount_amount: invoice.discountAmount,
              adjustment_amount: invoice.adjustmentAmount,
              grand_total: invoice.grandTotal
            }]);
          if (invError) {
            errors.push(`Invoice ${invoice.number}: ${invError.message}`);
            continue;
          }

          // Then sync invoice items
          for (const item of invoice.items) {
            const { error: itemError } = await supabase
              .from('invoice_items')
              .upsert([{
                invoice_id: invoice.id,
                product_id: item.productId,
                product_name: item.productName,
                quantity: item.quantity,
                price: item.price,
                tva_rate: item.tvaRate,
                discount: item.discount
              }]);
            if (itemError) errors.push(`Invoice item ${item.productName}: ${itemError.message}`);
          }

          // Sync payments
          if (invoice.payments) {
            for (const payment of invoice.payments) {
              const { error: payError } = await supabase
                .from('payments')
                .upsert([{
                  id: payment.id,
                  invoice_id: invoice.id,
                  amount: payment.amount,
                  date: payment.date,
                  method: payment.method,
                  check_image: payment.checkImage,
                  note: payment.note
                }]);
              if (payError) errors.push(`Payment: ${payError.message}`);
            }
          }
        } catch (e) {
          errors.push(`Invoice ${invoice.number}: ${e instanceof Error ? e.message : 'Unknown error'}`);
        }
      }

      // Sync company settings
      if (localData.company) {
        try {
          const { error } = await supabase
            .from('Factur_settings')
            .upsert([{
              id: localData.company.id,
              name: localData.company.name,
              address: localData.company.address,
              email: localData.company.email,
              phone: localData.company.phone,
              siret: localData.company.siret,
              logo: localData.company.logo,
              city: localData.company.city,
              country: localData.company.country,
              footer: localData.company.footer,
              signature: localData.company.signature,
              icons: localData.company.icons,
              remarques: localData.company.remarques,
              invoice_prefix: localData.company.invoice_prefix,
              invoice_start_number: localData.company.invoice_start_number
            }]);
          if (error) errors.push(`Company settings: ${error.message}`);
        } catch (e) {
          errors.push(`Company settings: ${e instanceof Error ? e.message : 'Unknown error'}`);
        }
      }

      return { success: errors.length === 0, errors };
    } catch (error) {
      return { 
        success: false, 
        errors: [error instanceof Error ? error.message : 'Unknown sync error'] 
      };
    }
  }
}

// Export a singleton instance
export const dataSyncService = new DataSyncService();