
import React from 'react';
import { Invoice, Client, Company } from '../types';

interface ClientStatementPDFPreviewProps {
  client: Client;
  invoices: Invoice[];
  company: Company;
  onClose: () => void;
}

const ClientStatementPDFPreview: React.FC<ClientStatementPDFPreviewProps> = ({ client, invoices, company, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const payments = invoices.flatMap(inv => 
    (inv.payments || []).map(p => ({
      ...p,
      invoiceNumber: inv.number
    }))
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalPieces = invoices.reduce((sum, inv) => sum + inv.items.reduce((s, item) => s + item.quantity, 0), 0);
  const balance = totalInvoiced - totalCollected;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md print:bg-white print:p-0 overflow-hidden print:overflow-visible">
      <div className="bg-white w-full max-w-5xl h-[95vh] rounded-[15px] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 duration-300 print:h-auto print:w-full print:shadow-none print:rounded-none print:static print:block">
        
        {/* Header - Hidden on Print */}
        <div className="p-5 bg-slate-900 flex items-center justify-between text-white shrink-0 print:hidden">
          <div className="flex items-center space-x-4 ml-4">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white">
              <i className="fas fa-file-invoice-dollar text-xl"></i>
            </div>
            <div>
              <span className="font-black text-sm uppercase tracking-widest">Relevé de Compte</span>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{client.name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={handlePrint}
              className="px-8 py-2.5 bg-orange-600 hover:bg-orange-700 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center space-x-2"
            >
              <i className="fas fa-print"></i>
              <span>Imprimer Rapport</span>
            </button>
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors ml-2">
              <i className="fas fa-times text-lg text-slate-400"></i>
            </button>
          </div>
        </div>

        {/* Scrollable Preview Area */}
        <div className="flex-1 overflow-y-auto p-12 bg-slate-100 custom-scrollbar print:p-0 print:bg-white print:overflow-visible">
          {/* THE PRINTABLE SHEET */}
          <div className="printable-sheet mx-auto bg-white p-[15mm] shadow-2xl border border-slate-200 print:border-none print:shadow-none print:p-8 print:m-0 w-full max-w-[900px] font-sans text-slate-900 print:max-w-none rounded-[15px]">
            
            {/* Header */}
            <div className="flex justify-between items-start mb-16">
              <div className="space-y-4">
                {company.logo ? (
                  <img src={company.logo} className="w-24 h-24 object-contain" alt="Logo" />
                ) : (
                  <div className="w-24 h-24 bg-slate-900 rounded-[30px] flex items-center justify-center text-white font-black text-3xl">
                    {company.name.charAt(0)}
                  </div>
                )}
                <div className="text-left">
                  <h1 className="text-2xl font-black uppercase tracking-tighter">{company.name}</h1>
                  <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">{company.address}{company.city ? `, ${company.city}` : ''}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">SIRET: {company.siret}</p>
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-4xl font-black text-indigo-600 mb-2 uppercase tracking-tighter">RELEVÉ DE COMPTE</h2>
                <div className="space-y-1">
                  <p className="text-sm font-black text-slate-800">Généré le: {new Date().toLocaleDateString('fr-FR')}</p>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest italic">Document d'analyse comptable</p>
                </div>
              </div>
            </div>

            {/* Account Summary Bar */}
            <div className="bg-slate-50 rounded-[40px] p-10 mb-16 flex justify-between items-center border border-slate-100 print:bg-white print:border-slate-200">
               <div className="text-left">
                 <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-2">Situation du Client</p>
                 <p className="text-2xl font-black text-slate-800 uppercase tracking-tight">{client.name}</p>
                 <p className="text-sm text-slate-500 mt-1 italic">{client.address}</p>
               </div>
               <div className="text-right bg-white p-6 rounded-3xl border border-slate-100 shadow-sm print:shadow-none">
                 <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-2">Solde Débiteur</p>
                 <p className="text-4xl font-black text-rose-600 tracking-tighter">{balance.toLocaleString()} <span className="text-sm">MAD</span></p>
               </div>
            </div>

            {/* Invoices History */}
            <div className="mb-12">
              <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600 border-b-2 border-indigo-50 pb-3 mb-6 flex items-center">
                <i className="fas fa-file-invoice mr-3"></i> Historique des Facturations (Ventes)
              </h4>
              <table className="w-full text-left mb-8 border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th className="py-4 px-4 text-[9px] font-black uppercase tracking-widest rounded-tl-xl text-left">Date</th>
                    <th className="py-4 px-4 text-[9px] font-black uppercase tracking-widest text-left">Réf. Facture</th>
                    <th className="py-4 px-4 text-center text-[9px] font-black uppercase tracking-widest">Pièces</th>
                    <th className="py-4 px-4 text-right text-[9px] font-black uppercase tracking-widest">Débit (TTC)</th>
                    <th className="py-4 px-4 text-right text-[9px] font-black uppercase tracking-widest">Réglé</th>
                    <th className="py-4 px-4 text-right text-[9px] font-black uppercase tracking-widest rounded-tr-xl">Solde</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium">
                  {invoices.map((inv) => {
                    const paid = (inv.payments || []).reduce((s, p) => s + p.amount, 0);
                    const qty = inv.items.reduce((s, i) => s + i.quantity, 0);
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-4 text-slate-500 text-left">{new Date(inv.date).toLocaleDateString('fr-FR')}</td>
                        <td className="py-4 px-4 font-black text-slate-800 uppercase text-left">{inv.number}</td>
                        <td className="py-4 px-4 text-center font-black text-slate-600">{qty}</td>
                        <td className="py-4 px-4 text-right font-black">{inv.grandTotal.toLocaleString()}</td>
                        <td className="py-4 px-4 text-right font-black text-emerald-600">{paid.toLocaleString()}</td>
                        <td className="py-4 px-4 text-right font-black text-rose-500 bg-rose-50/30 print:bg-white">{ (inv.grandTotal - paid).toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Payments History */}
            <div className="mb-16">
              <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-600 border-b-2 border-emerald-50 pb-3 mb-6 flex items-center">
                <i className="fas fa-receipt mr-3"></i> Historique des Règlements (Encaissements)
              </h4>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th className="py-4 px-4 text-[9px] font-black uppercase tracking-widest rounded-tl-xl text-left">Date Encaissement</th>
                    <th className="py-4 px-4 text-[9px] font-black uppercase tracking-widest text-left">Facture Concernée</th>
                    <th className="py-4 px-4 text-[9px] font-black uppercase tracking-widest text-left">Mode</th>
                    <th className="py-4 px-4 text-right text-[9px] font-black uppercase tracking-widest rounded-tr-xl">Crédit (MAD)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium">
                  {payments.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-4 text-slate-500 text-left">{new Date(p.date).toLocaleDateString('fr-FR')}</td>
                      <td className="py-4 px-4 font-black text-indigo-600 uppercase text-left">{p.invoiceNumber}</td>
                      <td className="py-4 px-4 uppercase text-[10px] font-black text-slate-400 tracking-widest text-left">{p.method}</td>
                      <td className="py-4 px-4 text-right font-black text-emerald-600">+{p.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                  {payments.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-slate-400 italic">Aucun mouvement de règlement enregistré sur la période.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Relevé Totals Summary */}
            <div className="flex justify-end pt-12 border-t-4 border-slate-900">
              <div className="w-80 space-y-4">
                <div className="flex justify-between text-[11px] font-black text-slate-400 uppercase tracking-widest">
                  <span>Volume Total (Pièces)</span>
                  <span className="text-slate-800">{totalPieces} UNITÉS</span>
                </div>
                <div className="flex justify-between text-[11px] font-black text-slate-400 uppercase tracking-widest">
                  <span>Cumul Facturé TTC</span>
                  <span className="text-slate-800">{totalInvoiced.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-4">
                  <span>Cumul Encaissé</span>
                  <span className="text-emerald-600">{totalCollected.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-[11px] font-black uppercase text-slate-900 tracking-[0.2em]">Reste à Recouvrer</span>
                  <span className="text-4xl font-black text-indigo-600 tracking-tighter">{balance.toLocaleString()} <span className="text-sm">MAD</span></span>
                </div>
              </div>
            </div>

            <div className="mt-24 pt-12 border-t border-slate-100 text-[10px] text-slate-300 uppercase tracking-[0.4em] text-center leading-loose font-medium">
              {company.footer || `Ce relevé est certifié conforme par FacturaPro - ${new Date().toLocaleDateString('fr-FR')} <br />Merci de nous signaler tout écart sous 48h.`}
            </div>
          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: A4; margin: 0; }
          body { margin: 0 !important; padding: 0 !important; background: white !important; }
          body * { visibility: hidden !important; }
          .printable-sheet, .printable-sheet * { visibility: visible !important; }
          .printable-sheet {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 10mm !important;
            display: block !important;
            background: white !important;
            box-shadow: none !important;
            border: none !important;
            -webkit-print-color-adjust: exact;
          }
          /* Ink saving optimizations */
          .printable-sheet, .printable-sheet * {
            background: white !important;
            color: black !important;
            border-color: #ccc !important;
          }
          .bg-slate-900, .bg-slate-50, .bg-indigo-600, .bg-indigo-50, .bg-emerald-500, .bg-rose-600, .bg-rose-50\/30, .bg-white\/10, .bg-slate-100, .bg-slate-200, .bg-emerald-600, .bg-orange-600, .bg-orange-500, .bg-emerald-500\/20 {
            background: white !important;
            color: black !important;
          }
          .text-white, .text-indigo-600, .text-emerald-600, .text-rose-500, .text-rose-600 {
            color: black !important;
          }
          .border, .border-slate-100, .border-slate-200, .border-b, .border-t, .border-slate-50 {
            border-color: #ccc !important;
          }
          .shadow-2xl, .shadow-sm, .shadow-lg, .shadow-xl {
            box-shadow: none !important;
          }
          .bg-gradient-to-r, .from-indigo-500, .to-purple-600 {
            background: white !important;
          }
        }
      `}} />
    </div>
  );
};

export default ClientStatementPDFPreview;
