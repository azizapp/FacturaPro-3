
import React, { useState, useEffect, useCallback } from 'react';
import Dashboard from './components/Dashboard';
import InvoiceList from './components/InvoiceList';
import InvoiceForm from './components/InvoiceForm';
import ClientList from './components/ClientList';
import ClientForm from './components/ClientForm';
import ProductList from './components/ProductList';
import ProductForm from './components/ProductForm';
import Settings from './components/Settings';
import InvoiceTable from './components/InvoiceTable';
import PaymentPage from './components/PaymentPage';
import InvoiceDetailView from './components/InvoiceDetailView';
import PaymentModal from './components/PaymentModal';
import InvoicePDFPreview from './components/InvoicePDFPreview';
import ClientStatementPDFPreview from './components/ClientStatementPDFPreview';
import DeleteConfirmationModal from './components/DeleteConfirmationModal';
import { db } from './services/supabaseMock';
import { dataSyncService } from './services/dataSyncService';
import { Invoice, Client, Product, Company, Payment, InvoiceStatus } from './types';

const App: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeView, setActiveView] = useState<'dashboard' | 'invoices' | 'ledger' | 'clients' | 'products' | 'payments' | 'settings' | 'invoice-detail' | 'client-form' | 'invoice-form' | 'product-form'>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  
  const [showInvoicePdf, setShowInvoicePdf] = useState<string | string[] | null>(null);
  const [showClientStatementPdf, setShowClientStatementPdf] = useState<string | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState<string | null>(null);
  
  const [itemToDelete, setItemToDelete] = useState<{ id: string, type: 'invoice' | 'client' | 'payment', invoiceId?: string } | null>(null);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setSidebarCollapsed(true);
      else setSidebarCollapsed(false);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const initializeApp = async () => {
    setIsLoading(true);
    try {
      const cachedData = await dataSyncService.initializeWithCache();
      setInvoices(cachedData.invoices);
      setClients(cachedData.clients);
      setProducts(cachedData.products);
      if (cachedData.company) setCompany(cachedData.company);
      else setCompany({
        id: '1', name: 'Ma Société', address: '123 Rue de la Paix',
        email: 'contact@example.com', phone: '0123456789', siret: '12345678901234',
        city: 'Paris', country: 'France'
      });
    } catch (error) {
      console.error("Error initializing app:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { initializeApp(); }, []);

  const handleAddInvoice = (invoice: Invoice) => {
    setInvoices(prev => [invoice, ...prev]);
    setActiveView('invoices');
    db.addInvoice(invoice).catch(e => console.error("Sync Error:", e));
    dataSyncService.addInvoice(invoice);
  };

  const handleUpdateInvoice = (invoice: Invoice) => {
    setInvoices(prev => prev.map(inv => inv.id === invoice.id ? invoice : inv));
    setActiveView('invoices');
    db.updateInvoice(invoice).catch(e => console.error("Sync Error:", e));
    dataSyncService.updateInvoices([...invoices.filter(i => i.id !== invoice.id), invoice]);
  };

  const handlePaymentAdded = (invoiceId: string, payment: Payment) => {
    setInvoices(prev => prev.map(inv => {
      if (inv.id === invoiceId) {
        const updatedPayments = [...(inv.payments || []), payment];
        const totalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);
        let newStatus = inv.status;
        if (totalPaid >= inv.grandTotal) newStatus = InvoiceStatus.PAID;
        else if (totalPaid > 0) newStatus = InvoiceStatus.PARTIAL;
        return { ...inv, payments: updatedPayments, status: newStatus };
      }
      return inv;
    }));
    db.addPayment(invoiceId, payment).catch(e => console.error("Payment Sync Error:", e));
  };

  const handleDeletePayment = (invoiceId: string, paymentId: string) => {
    setInvoices(prev => {
      const newInvoices = prev.map(inv => {
        if (inv.id === invoiceId) {
          const updatedPayments = (inv.payments || []).filter(p => p.id !== paymentId);
          const totalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);
          
          let newStatus = inv.status;
          if (totalPaid >= inv.grandTotal) {
            newStatus = InvoiceStatus.PAID;
          } else if (totalPaid > 0) {
            newStatus = InvoiceStatus.PARTIAL;
          } else {
            newStatus = InvoiceStatus.SENT; 
          }
          
          return { ...inv, payments: updatedPayments, status: newStatus };
        }
        return inv;
      });
      return [...newInvoices];
    });
    
    db.deletePayment(invoiceId, paymentId).catch(e => console.error("Payment Delete Error:", e));
  };

  const handleConfirmDelete = () => {
    if (!itemToDelete) return;
    const { id, type, invoiceId } = itemToDelete;

    if (type === 'invoice') {
      setInvoices(prev => prev.filter(inv => inv.id !== id));
      if (selectedInvoiceId === id && activeView === 'invoice-detail') setActiveView('invoices');
      db.deleteInvoice(id).catch(e => console.error("Delete Error:", e));
      dataSyncService.deleteInvoice(id);
    } else if (type === 'client') {
      setClients(prev => prev.filter(c => c.id !== id));
      db.deleteClient(id).catch(e => console.error("Delete Error:", e));
      dataSyncService.deleteClient(id);
    } else if (type === 'payment' && invoiceId) {
      handleDeletePayment(invoiceId, id);
    }
    setItemToDelete(null);
  };

  const handleAddClient = (client: Client) => {
    setClients(prev => [...prev, client]);
    setActiveView('clients');
    db.addClient(client).catch(e => console.error("Sync Error:", e));
    dataSyncService.addClient(client);
  };

  const handleUpdateClient = (client: Client) => {
    setClients(prev => prev.map(c => c.id === client.id ? client : c));
    setActiveView('clients');
    db.updateClient(client).catch(e => console.error("Sync Error:", e));
  };

  const handleAddProduct = (product: Product) => {
    setProducts(prev => [...prev, product]);
    setActiveView('products');
    db.addProduct(product).catch(e => console.error("Sync Error:", e));
    dataSyncService.addProduct(product);
  };

  const handleUpdateCompany = (newCompany: Company) => {
    setCompany(newCompany);
    db.updateCompanySettings(newCompany).catch(e => console.error("Sync Error:", e));
    dataSyncService.updateCompany(newCompany);
  };

  const renderContent = () => {
    if (isLoading || !company) return <div className="flex items-center justify-center h-full"><i className="fas fa-circle-notch animate-spin text-indigo-600 text-3xl"></i></div>;

    switch (activeView) {
      case 'dashboard': return <Dashboard invoices={invoices} clients={clients} />;
      case 'invoices':
        return (
          <div className="space-y-6">
            <div className="flex justify-end">
              <button onClick={() => { setSelectedInvoiceId(null); setActiveView('invoice-form'); }} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 shadow-lg transition-all">
                <i className="fas fa-plus mr-2"></i> Nouvelle Facture
              </button>
            </div>
            <InvoiceTable invoices={invoices} clients={clients} 
              onViewInvoice={(id) => { setSelectedInvoiceId(id); setActiveView('invoice-detail'); }}
              onAddPayment={(id) => setShowPaymentModal(id)}
              onDeleteInvoice={(id) => setItemToDelete({ id, type: 'invoice' })}
              onEditInvoice={(id) => { setSelectedInvoiceId(id); setActiveView('invoice-form'); }}
              onPdfInvoice={(idOrIds) => setShowInvoicePdf(idOrIds)}
            />
          </div>
        );
      case 'ledger': 
        return <InvoiceList 
          invoices={invoices} 
          clients={clients} 
          company={company} 
          onRefresh={() => dataSyncService.forceRefresh()} 
          onExportStatement={(clientId) => setShowClientStatementPdf(clientId)} 
          initialClientId={selectedClientId || undefined} 
          onDeletePayment={(invId, payId) => setItemToDelete({ id: payId, type: 'payment', invoiceId: invId })}
        />;
      case 'clients': return <ClientList clients={clients} invoices={invoices} onAddClient={() => { setSelectedClientId(null); setActiveView('client-form'); }} onEditClient={(id) => { setSelectedClientId(id); setActiveView('client-form'); }} onDeleteClient={(id) => setItemToDelete({ id, type: 'client' })} onViewHistory={(id) => { setSelectedClientId(id); setActiveView('ledger'); }} />;
      case 'products': return <ProductList products={products} onAddProduct={() => { setSelectedProductId(null); setActiveView('product-form'); }} />;
      case 'payments': return <PaymentPage invoices={invoices} clients={clients} onPaymentAdded={handlePaymentAdded} />;
      case 'settings': return <Settings company={company} onUpdate={handleUpdateCompany} />;
      case 'invoice-detail':
        const inv = invoices.find(i => i.id === selectedInvoiceId);
        const cli = clients.find(c => c.id === inv?.clientId);
        return inv && cli ? <InvoiceDetailView invoice={inv} client={cli} company={company} onBack={() => setActiveView('invoices')} onAddPayment={(id) => setShowPaymentModal(id)} onPdf={(id) => setShowInvoicePdf(id)} onDelete={(id) => setItemToDelete({ id, type: 'invoice' })} /> : <div className="p-8 text-center text-slate-500">Facture non trouvée</div>;
      case 'client-form': return <ClientForm initialClient={clients.find(c => c.id === selectedClientId)} onSubmit={selectedClientId ? handleUpdateClient : handleAddClient} onCancel={() => setActiveView('clients')} companyEmail={company?.email} />;
      case 'invoice-form': return <InvoiceForm clients={clients} products={products} company={company} invoices={invoices} initialInvoice={invoices.find(i => i.id === selectedInvoiceId)} onSubmit={selectedInvoiceId ? handleUpdateInvoice : handleAddInvoice} onCancel={() => setActiveView('invoices')} />;
      case 'product-form': return <ProductForm onSubmit={handleAddProduct} onCancel={() => setActiveView('products')} />;
      default: return <Dashboard invoices={invoices} clients={clients} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-[13px]">
      <div className={`${sidebarCollapsed ? 'w-20' : 'w-64'} bg-slate-900 text-white flex flex-col shrink-0 transition-all duration-300 ease-in-out`}>
        <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center"><i className="fas fa-file-invoice text-xl"></i></div>
          {!sidebarCollapsed && <span className="text-xl font-black tracking-tighter italic">FACTURAPRO</span>}
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          <NavItem icon="fa-th-large" label="Tableau de bord" active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} collapsed={sidebarCollapsed} />
          <NavItem icon="fa-file-invoice" label="Factures" active={activeView === 'invoices' || activeView === 'invoice-detail' || activeView === 'invoice-form'} onClick={() => setActiveView('invoices')} collapsed={sidebarCollapsed} />
          <NavItem icon="fa-book" label="Grand Livre" active={activeView === 'ledger'} onClick={() => setActiveView('ledger')} collapsed={sidebarCollapsed} />
          <NavItem icon="fa-users" label="Clients" active={activeView === 'clients' || activeView === 'client-form'} onClick={() => setActiveView('clients')} collapsed={sidebarCollapsed} />
          <NavItem icon="fa-boxes" label="Produits" active={activeView === 'products' || activeView === 'product-form'} onClick={() => setActiveView('products')} collapsed={sidebarCollapsed} />
          <NavItem icon="fa-money-bill-wave" label="Paiements" active={activeView === 'payments'} onClick={() => setActiveView('payments')} collapsed={sidebarCollapsed} />
          <NavItem icon="fa-cog" label="Paramètres" active={activeView === 'settings'} onClick={() => setActiveView('settings')} collapsed={sidebarCollapsed} />
        </nav>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center space-x-4">
            <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200"><i className={`fas ${sidebarCollapsed ? 'fa-arrow-right' : 'fa-arrow-left'}`}></i></button>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest">{activeView.replace('-', ' ')}</h2>
          </div>
          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg">{company?.name.charAt(0) || 'P'}</div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50">{renderContent()}</main>
      </div>

      {showInvoicePdf && company && <InvoicePDFPreview invoices={invoices.filter(inv => Array.isArray(showInvoicePdf) ? showInvoicePdf.includes(inv.id) : inv.id === showInvoicePdf)} company={company} clients={clients} onClose={() => setShowInvoicePdf(null)} />}
      {showClientStatementPdf && company && <ClientStatementPDFPreview client={clients.find(c => c.id === showClientStatementPdf)!} invoices={invoices.filter(i => i.clientId === showClientStatementPdf)} company={company} onClose={() => setShowClientStatementPdf(null)} />}
      {showPaymentModal && <PaymentModal invoice={invoices.find(i => i.id === showPaymentModal)!} onClose={() => setShowPaymentModal(null)} onPaymentAdded={handlePaymentAdded} />}
      <DeleteConfirmationModal 
        isOpen={!!itemToDelete} 
        title={itemToDelete?.type === 'payment' ? 'Supprimer le Règlement' : (itemToDelete?.type === 'invoice' ? 'Supprimer la Facture' : 'Supprimer le Client')} 
        message="Cette action est irréversible." 
        onConfirm={handleConfirmDelete} 
        onCancel={() => setItemToDelete(null)} 
      />
    </div>
  );
};

const NavItem: React.FC<{ icon: string, label: string, active: boolean, onClick: () => void, collapsed: boolean }> = ({ icon, label, active, onClick, collapsed }) => (
  <button onClick={onClick} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
    <i className={`fas ${icon} w-5`}></i>
    {!collapsed && <span>{label}</span>}
  </button>
);

export default App;
