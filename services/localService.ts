
import { Invoice, Client, Product, InvoiceStatus, Payment, Company } from "../types";
import { jsonDatabase } from "./jsonDatabase";

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

export const localDb = {
    // --- Company Settings ---
    getCompanySettings: async (): Promise<Company | null> => {
        return jsonDatabase.getCompany();
    },

    updateCompanySettings: async (company: Company): Promise<void> => {
        jsonDatabase.setCompany(company);
    },

    // --- Clients ---
    getClients: async (): Promise<Client[]> => {
        return jsonDatabase.getClients();
    },

    addClient: async (client: Client): Promise<Client> => {
        const newClient = { ...client, id: client.id || generateId(), created_at: new Date().toISOString() };
        const clients = jsonDatabase.getClients();
        jsonDatabase.setClients([...clients, newClient]);
        return newClient;
    },

    updateClient: async (client: Client): Promise<Client> => {
        const clients = jsonDatabase.getClients();
        const updatedClients = clients.map(c => c.id === client.id ? client : c);
        jsonDatabase.setClients(updatedClients);
        return client;
    },

    deleteClient: async (id: string): Promise<void> => {
        const clients = jsonDatabase.getClients();
        jsonDatabase.setClients(clients.filter(c => c.id !== id));
    },

    // --- Products ---
    getProducts: async (): Promise<Product[]> => {
        return jsonDatabase.getProducts();
    },

    addProduct: async (product: Product): Promise<Product> => {
        const newProduct = { ...product, id: product.id || generateId() };
        const products = jsonDatabase.getProducts();
        jsonDatabase.setProducts([...products, newProduct]);
        return newProduct;
    },

    updateProduct: async (product: Product): Promise<void> => {
        const products = jsonDatabase.getProducts();
        const index = products.findIndex(p => p.id === product.id);
        if (index !== -1) {
            products[index] = product;
            jsonDatabase.setProducts(products);
        }
    },

    deleteProduct: async (id: string): Promise<void> => {
        const products = jsonDatabase.getProducts();
        jsonDatabase.setProducts(products.filter(p => p.id !== id));
    },

    // --- Invoices ---
    getInvoices: async (): Promise<Invoice[]> => {
        return jsonDatabase.getInvoices();
    },

    addInvoice: async (invoice: Invoice): Promise<Invoice> => {
        const newInvoice = { ...invoice, id: invoice.id || generateId() };
        const invoices = jsonDatabase.getInvoices();
        jsonDatabase.setInvoices([newInvoice, ...invoices]);
        return newInvoice;
    },

    updateInvoice: async (invoice: Invoice): Promise<Invoice> => {
        const invoices = jsonDatabase.getInvoices();
        const updatedInvoices = invoices.map(inv => inv.id === invoice.id ? invoice : inv);
        jsonDatabase.setInvoices(updatedInvoices);
        return invoice;
    },

    deleteInvoice: async (id: string): Promise<void> => {
        const invoices = jsonDatabase.getInvoices();
        jsonDatabase.setInvoices(invoices.filter(inv => inv.id !== id));
    },

    addPayment: async (invoiceId: string, payment: Payment) => {
        const invoices = jsonDatabase.getInvoices();
        const updatedInvoices = invoices.map(inv => {
            if (inv.id === invoiceId) {
                const updatedPayments = [...(inv.payments || []), { ...payment, id: payment.id || generateId() }];
                return { ...inv, payments: updatedPayments };
            }
            return inv;
        });
        jsonDatabase.setInvoices(updatedInvoices);
        await localDb.recalculateInvoiceStatus(invoiceId);
    },

    deletePayment: async (invoiceId: string, paymentId: string) => {
        const invoices = jsonDatabase.getInvoices();
        const updatedInvoices = invoices.map(inv => {
            if (inv.id === invoiceId) {
                const updatedPayments = (inv.payments || []).filter(p => p.id !== paymentId);
                return { ...inv, payments: updatedPayments };
            }
            return inv;
        });
        jsonDatabase.setInvoices(updatedInvoices);
        await localDb.recalculateInvoiceStatus(invoiceId);
    },

    recalculateInvoiceStatus: async (invoiceId: string) => {
        const invoices = jsonDatabase.getInvoices();
        const updatedInvoices = invoices.map(inv => {
            if (inv.id === invoiceId) {
                const totalPaid = (inv.payments || []).reduce((sum, p) => sum + p.amount, 0);
                let newStatus = InvoiceStatus.SENT;
                if (totalPaid >= inv.grandTotal) {
                    newStatus = InvoiceStatus.PAID;
                } else if (totalPaid > 0) {
                    newStatus = InvoiceStatus.PARTIAL;
                } else {
                    newStatus = InvoiceStatus.DRAFT;
                }
                return { ...inv, status: newStatus };
            }
            return inv;
        });
        jsonDatabase.setInvoices(updatedInvoices);
    }
};
