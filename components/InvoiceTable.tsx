
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
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : 'Client inconnu';
  };

  const sortedInvoices = useMemo(() => {
    return [...invoices].sort((a, b) => {
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
  }, [invoices, sortField, sortDirection, clients]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

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
    <div className="bg-white dark:bg-[#27354c] rounded-2xl shadow-xl overflow-hidden border border-slate-100 dark:border-white/5 transition-colors duration-300">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-900/50">
            <tr>
              <th className="px-6 py-5 text-[10px] font-bold uppercase text-slate-400 text-center">
                <div className="flex items-center justify-center space-x-1 cursor-pointer" onClick={() => handleSort('date')}>
                  <span>Date</span>
                  <i className={`fas ${getSortIcon('date')} text-slate-300 dark:text-slate-600 text-xs`}></i>
                </div>
              </th>
              <th className="px-6 py-5 text-[10px] font-bold uppercase text-slate-400">
                <div className="flex items-center space-x-1 cursor-pointer" onClick={() => handleSort('number')}>
                  <span>Numéro</span>
                  <i className={`fas ${getSortIcon('number')} text-slate-300 dark:text-slate-600 text-xs`}></i>
                </div>
              </th>
              <th className="px-6 py-5 text-[10px] font-bold uppercase text-slate-400">
                <div className="flex items-center space-x-1 cursor-pointer" onClick={() => handleSort('client')}>
                  <span>Client</span>
                  <i className={`fas ${getSortIcon('client')} text-slate-300 dark:text-slate-600 text-xs`}></i>
                </div>
              </th>
              <th className="px-6 py-5 text-[10px] font-bold uppercase text-slate-400">
                <div className="flex items-center space-x-1 cursor-pointer" onClick={() => handleSort('status')}>
                  <span>Statut</span>
                  <i className={`fas ${getSortIcon('status')} text-slate-300 dark:text-slate-600 text-xs`}></i>
                </div>
              </th>
              <th className="px-6 py-5 text-[10px] font-bold uppercase text-slate-400 text-right">
                <div className="flex items-center justify-end space-x-1 cursor-pointer" onClick={() => handleSort('total')}>
                  <span>Total TTC</span>
                  <i className={`fas ${getSortIcon('total')} text-slate-300 dark:text-slate-600 text-xs`}></i>
                </div>
              </th>
              <th className="px-6 py-5 text-[10px] font-bold uppercase text-slate-400 text-center">Paiements</th>
              <th className="px-6 py-5 text-[10px] font-bold uppercase text-slate-400 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-white/5">
            {sortedInvoices.map((invoice) => (
              <tr key={invoice.id} className="hover:bg-slate-50/30 dark:hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs text-center">{new Date(invoice.date).toLocaleDateString('fr-FR')}</td>
                <td className="px-6 py-4">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-1 rounded-[6px] text-xs">
                    {invoice.number}
                  </span>
                </td>
                <td className="px-6 py-4 text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase">{getClientName(invoice.clientId)}</td>
                <td className="px-6 py-4">
                  <span 
                    className="text-[9px] font-black uppercase px-2.5 py-1 rounded-[8px] inline-block shadow-sm"
                    style={getStatusStyle(invoice.status)}
                  >
                    {invoice.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right font-bold text-slate-800 dark:text-white text-xs">{invoice.grandTotal.toLocaleString()}</td>
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InvoiceTable;
