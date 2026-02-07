import { Invoice, Client, Product, Company } from '../types';

interface JsonDatabase {
  invoices: Invoice[];
  clients: Client[];
  products: Product[];
  company: Company | null;
}

const DB_FILE = 'local_data.json';

export const jsonDatabase = {
  // Load data from localStorage
  loadData: (): JsonDatabase => {
    try {
      const data = localStorage.getItem(DB_FILE);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading data from JSON database:', error);
    }
    
    // Return default empty structure
    return {
      invoices: [],
      clients: [],
      products: [],
      company: null
    };
  },

  // Save data to localStorage
  saveData: (data: JsonDatabase): void => {
    try {
      localStorage.setItem(DB_FILE, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving data to JSON database:', error);
    }
  },

  // Get all data
  getAllData: (): JsonDatabase => {
    return jsonDatabase.loadData();
  },

  // Set all data
  setAllData: (data: JsonDatabase): void => {
    jsonDatabase.saveData(data);
  },

  // Individual getters
  getInvoices: (): Invoice[] => {
    const data = jsonDatabase.loadData();
    return data.invoices || [];
  },

  getClients: (): Client[] => {
    const data = jsonDatabase.loadData();
    return data.clients || [];
  },

  getProducts: (): Product[] => {
    const data = jsonDatabase.loadData();
    return data.products || [];
  },

  getCompany: (): Company | null => {
    const data = jsonDatabase.loadData();
    return data.company;
  },

  // Individual setters
  setInvoices: (invoices: Invoice[]): void => {
    const data = jsonDatabase.loadData();
    data.invoices = invoices;
    jsonDatabase.saveData(data);
  },

  setClients: (clients: Client[]): void => {
    const data = jsonDatabase.loadData();
    data.clients = clients;
    jsonDatabase.saveData(data);
  },

  setProducts: (products: Product[]): void => {
    const data = jsonDatabase.loadData();
    data.products = products;
    jsonDatabase.saveData(data);
  },

  setCompany: (company: Company | null): void => {
    const data = jsonDatabase.loadData();
    data.company = company;
    jsonDatabase.saveData(data);
  },

  // Clear all data
  clearAll: (): void => {
    localStorage.removeItem(DB_FILE);
  }
};