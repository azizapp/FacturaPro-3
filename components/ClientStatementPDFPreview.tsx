import React, { useState } from 'react';
import { Invoice, Client, Company } from '../types';

interface ClientStatementPDFPreviewProps {
  client: Client;
  invoices: Invoice[];
  company: Company;
  onClose: () => void;
}

const ClientStatementPDFPreview: React.FC<ClientStatementPDFPreviewProps> = ({ client, invoices, company, onClose }) => {
  const [isPrinting, setIsPrinting] = useState(false);

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

  const handlePrint = async () => {
    const element = document.querySelector('.statement-printable-container');
    if (!element) return;
    setIsPrinting(true);

    const filename = `Releve_Compte_${client.name.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`;
    const opt = {
      margin: 0,
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: 'avoid-all', avoid: ['.statement-printable-container'] }
    };

    try {
      // @ts-ignore
      const pdfBlob = await html2pdf()
        .from(element)
        .set(opt)
        .toPdf()
        .get('pdf')
        .then((pdf: any) => {
          // Cleanup extra blank pages
          const totalPages = pdf.internal.getNumberOfPages();
          for (let i = totalPages; i > 1; i--) {
            pdf.deletePage(i);
          }
          return pdf.output('bloburl');
        });

      // Hidden iframe print
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      iframe.src = pdfBlob;

      iframe.onload = () => {
        setIsPrinting(false);
        setTimeout(() => {
          if (iframe.contentWindow) {
            iframe.contentWindow.onbeforeunload = () => null;
            iframe.contentWindow.onafterprint = () => {
              setTimeout(() => document.body.removeChild(iframe), 500);
            };
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
          }
        }, 300);
      };

      document.body.appendChild(iframe);

    } catch (error) {
      console.error("Erreur Impression Relevé:", error);
      setIsPrinting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md overflow-hidden print:overflow-visible font-sans text-slate-900 statement-modal-wrapper">
      <div className="bg-white w-full max-w-5xl h-[95vh] rounded-[15px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 print:h-auto print:w-full print:shadow-none print:rounded-none print:static print:block relative">

        {/* Barra d'outils */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0 print:hidden relative z-20">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-md">
              <i className="fas fa-file-invoice-dollar text-lg"></i>
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Relevé de Compte</h4>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{client.name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-black text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center disabled:opacity-50"
            >
              <i className="fas fa-print mr-2"></i>
              {isPrinting ? 'Préparation...' : 'Imprimer'}
            </button>
            <button onClick={onClose} className="px-4 py-2 bg-slate-100 rounded-lg font-bold text-[10px] uppercase tracking-widest text-slate-400 hover:bg-slate-200 transition-colors">
              Fermer
            </button>
          </div>
        </div>

        {/* Zone de prévisualisation */}
        <div className="flex-1 overflow-y-auto bg-slate-100 p-6 custom-scrollbar print:p-0 print:bg-white print:overflow-visible flex flex-col items-center">
          <div className="statement-printable-container bg-white p-[10mm] shadow-xl print:shadow-none print:p-[10mm] print:m-0 w-[210mm] min-h-[297mm] flex flex-col relative overflow-hidden" style={{ boxSizing: 'border-box' }}>

            {/* Header: Logo & Title */}
            <div className="flex justify-between items-start mb-8">
              <div className="w-[200px]">
                {company.logo ? (
                  <img src={company.logo} className="w-full object-contain" alt="Logo" />
                ) : (
                  <div className="text-2xl font-black text-[#1a2b5e] italic leading-tight">
                    {company.name}
                  </div>
                )}
              </div>
              <div className="text-right">
                <h2 className="text-2xl font-black text-indigo-600 mb-1 uppercase tracking-tighter">Relevé de Compte</h2>
                <p className="text-[11px] font-bold text-slate-800">Date: {new Date().toLocaleDateString('fr-FR')}</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Document d'analyse</p>
              </div>
            </div>

            {/* Client Info Bar */}
            <div className="flex justify-between items-center bg-[#f4f7fe]/60 border border-slate-100 p-4 rounded-xl mb-8">
              <div>
                <p className="text-[9px] font-black uppercase text-indigo-400 tracking-widest mb-1">Client</p>
                <p className="text-base font-black text-[#1a2b5e] uppercase">{client.name}</p>
                <p className="text-[10px] font-medium text-slate-500 mt-0.5">{client.address || "Adresse non spécifiée"} {client.city ? `- ${client.city}` : ""}</p>
              </div>
              <div className="text-right pr-2">
                <p className="text-[9px] font-black uppercase text-indigo-400 tracking-widest mb-1">Solde Débiteur</p>
                <p className="text-2xl font-black text-[#1a2b5e] tracking-tight">{balance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} <span className="text-[10px] text-slate-500">MAD</span></p>
              </div>
            </div>

            {/* Invoices History */}
            <div className="mb-6">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 border-b border-slate-100 pb-2">
                <i className="fas fa-file-invoice mr-2 text-indigo-400"></i> Facturations
              </h4>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="py-2 px-3 text-[9px] font-black text-slate-400 uppercase tracking-widest rounded-tl-lg">Date</th>
                    <th className="py-2 px-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Réf.</th>
                    <th className="py-2 px-3 text-center text-[9px] font-black text-slate-400 uppercase tracking-widest">Pièces</th>
                    <th className="py-2 px-3 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest">Débit TTC</th>
                    <th className="py-2 px-3 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest">Réglé</th>
                    <th className="py-2 px-3 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest rounded-tr-lg">Solde</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {invoices.map((inv) => {
                    const paid = (inv.payments || []).reduce((s, p) => s + p.amount, 0);
                    const qty = inv.items.reduce((s, i) => s + i.quantity, 0);
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50 border-b border-slate-100">
                        <td className="py-2.5 px-3 text-[10px] text-slate-500">{new Date(inv.date).toLocaleDateString('fr-FR')}</td>
                        <td className="py-2.5 px-3 font-bold text-[11px] text-[#1a2b5e] uppercase">{inv.number}</td>
                        <td className="py-2.5 px-3 text-center text-[10px] font-bold text-slate-500">{qty}</td>
                        <td className="py-2.5 px-3 text-right text-[11px] font-bold text-slate-700">{inv.grandTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                        <td className="py-2.5 px-3 text-right text-[11px] font-bold text-emerald-600">{paid.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                        <td className="py-2.5 px-3 text-right text-[11px] font-black text-rose-500 bg-rose-50/20">{(inv.grandTotal - paid).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Payments History */}
            <div className="mb-8">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 border-b border-slate-100 pb-2">
                <i className="fas fa-money-check-alt mr-2 text-emerald-400"></i> Règlements
              </h4>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="py-2 px-3 text-[9px] font-black text-slate-400 uppercase tracking-widest rounded-tl-lg">Date</th>
                    <th className="py-2 px-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Facture</th>
                    <th className="py-2 px-3 text-center text-[9px] font-black text-slate-400 uppercase tracking-widest">Mode</th>
                    <th className="py-2 px-3 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest rounded-tr-lg">Montant</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {payments.map((p, idx) => (
                    <tr key={idx} className="border-b border-slate-100">
                      <td className="py-2.5 px-3 text-[10px] text-slate-500">{new Date(p.date).toLocaleDateString('fr-FR')}</td>
                      <td className="py-2.5 px-3 font-bold text-[11px] text-indigo-600 uppercase">{p.invoiceNumber}</td>
                      <td className="py-2.5 px-3 text-center text-[9px] font-bold text-slate-500 uppercase tracking-widest">{p.method}</td>
                      <td className="py-2.5 px-3 text-right text-[11px] font-black text-emerald-600">+{p.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                  {payments.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-[10px] text-slate-400 italic">Aucun règlement enregistré.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex-1"></div>

            {/* Summary Footer */}
            <div className="mt-8 flex justify-end border-t-2 border-[#1a2b5e] pt-4">
              <div className="w-[300px] space-y-2">
                <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  <span>Unités Facturées</span>
                  <span className="text-[#1a2b5e]">{totalPieces}</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  <span>Total Débit</span>
                  <span className="text-[#1a2b5e]">{totalInvoiced.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-2">
                  <span>Total Règlements</span>
                  <span className="text-emerald-600">{totalCollected.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-[11px] font-black uppercase text-[#1a2b5e] tracking-widest">Reste à Recouvrer</span>
                  <span className="text-lg font-black text-rose-600 tracking-tight">{balance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100 text-[9px] text-slate-300 uppercase tracking-[0.2em] text-center font-bold">
              {company.footer || "Relevé produit par FacturaPro."}
            </div>

          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          @page { size: A4 portrait; margin: 0; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body > * { visibility: hidden !important; }
          .statement-modal-wrapper, .statement-modal-wrapper * { visibility: visible !important; }
          .statement-modal-wrapper { position: absolute !important; left: 0; top: 0; width: 100%; display: block !important; margin: 0; padding: 0; background: white; z-index: 999999; }
          .print\\:hidden, .bg-slate-900\\/80, .backdrop-blur-md { display: none !important; }
        }
      `}} />
    </div>
  );
};

export default ClientStatementPDFPreview;
