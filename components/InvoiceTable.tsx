
import React, { useState, useMemo } from 'react';
import { Invoice, Client, InvoiceStatus } from '../types';

interface InvoiceTableProps {
  invoices: Invoice[];
  clients: Client[];
  onViewInvoice: (id: string) => void;
  onAddPayment: (id: string) => void;
  onDeleteInvoice: (id: string) => void;
  onEditInvoice: (id: string) => void;
  onPdfInvoice: (id: string) => void;
}

type SortField = 'date' | 'number' | 'client' | 'status' | 'total';
type SortDirection = 'asc' | 'desc';

const InvoiceTable: React.FC<InvoiceTableProps> = ({ 
  invoices, 
  clients, 
  onViewInvoice, 
  onAddPayment, 
  onDeleteInvoice, 
  onEditInvoice, 
  onPdfInvoice 
}) => {
  const [sortField, setSortField] = useState<SortField>('number');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [showFilters, setShowFilters] = useState(true);

  const getDateRange = (filter: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let start = new Date(today);
    let end = new Date(today);
    end.setHours(23, 59, 59, 999);

    switch (filter) {
      case 'today':
        break;
      case 'week':
        start.setDate(today.getDate() - today.getDay());
        end.setDate(today.getDate() + (6 - today.getDay()));
        end.setHours(23, 59, 59, 999);
        break;
      case 'lastWeek':
        start.setDate(today.getDate() - today.getDay() - 7);
        end.setDate(today.getDate() - today.getDay() - 1);
        end.setHours(23, 59, 59, 999);
        break;
      case 'month':
        start.setDate(1);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'lastMonth':
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'year':
        start = new Date(today.getFullYear(), 0, 1);
        end = new Date(today.getFullYear(), 11, 31);
        end.setHours(23, 59, 59, 999);
        break;
      default:
        return null;
    }

    return { start, end };
  };

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : 'Client inconnu';
  };

  const filteredAndSortedInvoices = useMemo(() => {
    let filtered = [...invoices];

    // Filter by search term (name or invoice number)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(inv => {
        const clientName = getClientName(inv.clientId).toLowerCase();
        const invoiceNumber = String(inv.number).toLowerCase();
        return clientName.includes(term) || invoiceNumber.includes(term);
      });
    }

    // Filter by status
    if (selectedStatus) {
      filtered = filtered.filter(inv => inv.status === selectedStatus);
    }

    // Filter by date range
    if (dateFilter && dateFilter !== 'custom') {
      // Fix: Use 'dateFilter' state variable instead of undefined 'filter'
      const range = getDateRange(dateFilter);
      if (range) {
        filtered = filtered.filter(inv => {
          const invDate = new Date(inv.date);
          return invDate >= range.start && invDate <= range.end;
        });
      }
    } else if (dateFilter === 'custom') {
      if (dateFrom) {
        const fromDate = new Date(dateFrom);
        filtered = filtered.filter(inv => new Date(inv.date) >= fromDate);
      }
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        filtered = filtered.filter(inv => new Date(inv.date) <= toDate);
      }
    }

    // Sort
    return filtered.sort((a, b) => {
      let aValue: string | number | Date = '';
      let bValue: string | number | Date = '';

      switch (sortField) {
        case 'date':
          aValue = new Date(a.date);
          bValue = new Date(b.date);
          break;
        case 'number':
          aValue = a.number;
          bValue = b.number;
          break;
        case 'client':
          aValue = getClientName(a.clientId).toLowerCase();
          bValue = getClientName(b.clientId).toLowerCase();
          break;
        case 'status':
          aValue = a.status.toLowerCase();
          bValue = b.status.toLowerCase();
          break;
        case 'total':
          aValue = a.grandTotal;
          bValue = b.grandTotal;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [invoices, sortField, sortDirection, clients, selectedStatus, searchTerm, dateFilter, dateFrom, dateTo]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedStatus('');
    setDateFilter('');
    setDateFrom('');
    setDateTo('');
  };

  const hasActiveFilters = searchTerm || selectedStatus || dateFilter;

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  };

  const getStatusStyle = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('brouillon') || s === 'draft') {
      return { 
        color: '#F54927', 
        backgroundColor: 'rgba(245, 73, 39, 0.1)',
        border: '1px solid rgba(245, 73, 39, 0.2)'
      };
    }
    if (s.includes('partielle') || s === 'partial') {
      return { 
        color: '#EAB308', 
        backgroundColor: 'rgba(234, 179, 8, 0.15)',
        border: '1px solid rgba(234, 179, 8, 0.3)'
      };
    }
    if (s.includes('payée') || s === 'paid') {
      return { 
        color: '#10B981', 
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        border: '1px solid rgba(16, 185, 129, 0.2)'
      };
    }
    return { 
      color: '#64748b', 
      backgroundColor: 'rgba(100, 116, 139, 0.1)',
      border: '1px solid rgba(100, 116, 139, 0.2)'
    };
  };

  return (
    <div className="bg-white dark:bg-[#27354c] rounded-2xl shadow-xl overflow-hidden border border-slate-100 dark:border-white/5 transition-colors duration-300 flex flex-col h-full">
      {/* Filter Header */}
      <div className="border-b border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/20">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors text-sm font-medium"
          >
            <i className={`fas fa-filter text-xs transition-transform ${showFilters ? 'rotate-0' : ''}`}></i>
            <span>Filtres {hasActiveFilters && `(${Object.values({searchTerm, selectedStatus, dateFilter}).filter(v => v).length})`}</span>
            <i className={`fas fa-chevron-${showFilters ? 'up' : 'down'} text-xs transition-transform`}></i>
          </button>
          
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <i className="fas fa-redo mr-1"></i> Réinitialiser
            </button>
          )}
        </div>

        {showFilters && (
          <div className="px-4 pb-4 pt-2 space-y-4 border-t border-slate-200 dark:border-white/5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
              {/* Search Field */}
              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">Recherche</label>
                <div className="relative">
                  <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 text-xs"></i>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Nom du client ou numéro de facture..."
                    className="w-full pl-8 pr-2 py-1.5 border border-slate-300 dark:border-slate-600 dark:bg-slate-800 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                  />
                </div>
              </div>

              {/* Status Dropdown */}
              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">Statut</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 dark:bg-slate-800 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
                >
                  <option value="">Tous</option>
                  {Object.values(InvoiceStatus).map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              {dateFilter !== 'custom' ? (
                /* Date Dropdown */
                <div className="flex flex-col space-y-1.5">
                  <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">Date</label>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 dark:bg-slate-800 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
                  >
                    <option value="">Tous</option>
                    <option value="today">Aujourd'hui</option>
                    <option value="week">Cette semaine</option>
                    <option value="lastWeek">Semaine dernière</option>
                    <option value="month">Ce mois</option>
                    <option value="lastMonth">Mois dernier</option>
                    <option value="year">Cette année</option>
                    <option value="custom">Entre deux dates</option>
                  </select>
                </div>
              ) : (
                /* Date From */
                <div className="flex flex-col space-y-1.5">
                  <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">Du</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 dark:bg-slate-800 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
                  />
                </div>
              )}

              {dateFilter === 'custom' && (
                /* Date To */
                <div className="flex flex-col space-y-1.5">
                  <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">Au</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 dark:bg-slate-800 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Results Count */}
      {hasActiveFilters && (
        <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 border-b border-slate-200 dark:border-white/5 text-xs text-indigo-600 dark:text-indigo-400">
          <i className="fas fa-info-circle mr-2"></i>
          {filteredAndSortedInvoices.length} facture{filteredAndSortedInvoices.length !== 1 ? 's' : ''} correspond{filteredAndSortedInvoices.length !== 1 ? 'ent' : ''} aux critères
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-900/50 sticky top-0">
            <tr>
              <th className="px-6 py-5 text-[10px] font-bold uppercase text-slate-400 text-center">
                <div className="flex items-center justify-center space-x-1 cursor-pointer" onClick={() => handleSort('date')}>
                  <span>Date</span>
                  <i className={`fas ${sortField === 'date' ? (sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down') : 'fa-sort'} text-slate-300 dark:text-slate-600 text-xs`}></i>
                </div>
              </th>
              <th className="px-6 py-5 text-[10px] font-bold uppercase text-slate-400">
                <div className="flex items-center space-x-1 cursor-pointer" onClick={() => handleSort('number')}>
                  <span>Numéro</span>
                  <i className={`fas ${sortField === 'number' ? (sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down') : 'fa-sort'} text-slate-300 dark:text-slate-600 text-xs`}></i>
                </div>
              </th>
              <th className="px-6 py-5 text-[10px] font-bold uppercase text-slate-400">
                <div className="flex items-center space-x-1 cursor-pointer" onClick={() => handleSort('client')}>
                  <span>Client</span>
                  <i className={`fas ${sortField === 'client' ? (sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down') : 'fa-sort'} text-slate-300 dark:text-slate-600 text-xs`}></i>
                </div>
              </th>
              <th className="px-6 py-5 text-[10px] font-bold uppercase text-slate-400">
                <div className="flex items-center space-x-1 cursor-pointer" onClick={() => handleSort('status')}>
                  <span>Statut</span>
                  <i className={`fas ${sortField === 'status' ? (sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down') : 'fa-sort'} text-slate-300 dark:text-slate-600 text-xs`}></i>
                </div>
              </th>
              <th className="px-6 py-5 text-[10px] font-bold uppercase text-slate-400 text-right">
                <div className="flex items-center justify-end space-x-1 cursor-pointer" onClick={() => handleSort('total')}>
                  <span>Total TTC</span>
                  <i className={`fas ${sortField === 'total' ? (sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down') : 'fa-sort'} text-slate-300 dark:text-slate-600 text-xs`}></i>
                </div>
              </th>
              <th className="px-6 py-5 text-[10px] font-bold uppercase text-slate-400 text-center">Paiements</th>
              <th className="px-6 py-5 text-[10px] font-bold uppercase text-slate-400 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-white/5">
            {filteredAndSortedInvoices.length > 0 ? (
              filteredAndSortedInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-slate-50/30 dark:hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs text-center">{new Date(invoice.date).toLocaleDateString('fr-FR')}</td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-1 rounded-[6px] text-xs">
                      {invoice.number}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[11px] font-bold text-slate-700 dark:text-slate-200">{getClientName(invoice.clientId)}</td>
                  <td className="px-6 py-4">
                    <span 
                      className="text-[9px] font-black uppercase px-2.5 py-1 rounded-[8px] inline-block shadow-sm"
                      style={getStatusStyle(invoice.status)}
                    >
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-slate-800 dark:text-white text-xs">{invoice.grandTotal.toLocaleString('fr-FR')}</td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => onAddPayment(invoice.id)}
                      className="w-8 h-8 rounded-[8px] text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/20 hover:text-emerald-600 transition-all"
                      title="Ajouter un paiement"
                    >
                      <i className="fas fa-money-bill-wave text-xs"></i>
                    </button>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <button 
                        onClick={() => onViewInvoice(invoice.id)} 
                        className="w-8 h-8 rounded-[8px] text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 hover:text-indigo-600 transition-all"
                        title="Voir détails"
                      >
                        <i className="far fa-eye text-xs"></i>
                      </button>
                      <button 
                        onClick={() => onEditInvoice(invoice.id)} 
                        className="w-8 h-8 rounded-[8px] text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-indigo-600 transition-all"
                        title="Modifier"
                      >
                        <i className="fas fa-edit text-xs"></i>
                      </button>
                      <button 
                        onClick={() => onPdfInvoice(invoice.id)} 
                        className="w-8 h-8 rounded-[8px] text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 hover:text-indigo-600 transition-all"
                        title="Exporter PDF"
                      >
                        <i className="fas fa-file-pdf text-xs"></i>
                      </button>
                      <button 
                        onClick={() => onDeleteInvoice(invoice.id)} 
                        className="w-8 h-8 rounded-[8px] text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/20 hover:text-rose-600 transition-all"
                        title="Supprimer"
                      >
                        <i className="fas fa-trash text-xs"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                  <i className="fas fa-inbox text-2xl mb-2 block opacity-50"></i>
                  Aucune facture ne correspond à vos critères de filtre
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InvoiceTable;
