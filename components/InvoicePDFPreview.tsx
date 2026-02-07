
import React, { useState } from 'react';
import { Invoice, Company, Client, InvoiceStatus } from '../types';

interface InvoicePDFPreviewProps {
  invoices: Invoice[];
  company: Company;
  onClose: () => void;
  clients: Client[];
}

const InvoicePDFPreview: React.FC<InvoicePDFPreviewProps> = ({ invoices, company, onClose, clients }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsApp = async () => {
    if (invoices.length === 0) return;
    const element = document.querySelector('.printable-container');
    if (!element) return;
    setIsSharing(true);
    const firstInvoice = invoices[0];
    const firstClient = clients.find(c => c.id === firstInvoice.clientId);
    const phone = (firstClient?.gsm1 || firstClient?.phone || "").replace(/\s+/g, '');
    const filename = invoices.length === 1 ? `Facture_${invoices[0].number}.pdf` : `Export_Factures_${new Date().getTime()}.pdf`;
    const opt = {
      margin: 0,
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    try {
      // @ts-ignore
      const pdfBlob = await html2pdf().from(element).set(opt).output('blob');
      if (navigator.canShare && navigator.canShare({ files: [new File([pdfBlob], filename, { type: 'application/pdf' })] })) {
        const file = new File([pdfBlob], filename, { type: 'application/pdf' });
        await navigator.share({
          files: [file],
          title: 'Facture ' + (invoices.length === 1 ? invoices[0].number : ''),
          text: `Bonjour, veuillez trouver ci-joint votre facture de la part de ${company.name}.`,
        });
      } else {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(pdfBlob);
        link.download = filename;
        link.click();
        const message = encodeURIComponent(`Bonjour, voici votre facture "${filename}" en pièce jointe.`);
        window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
      }
    } catch (error) {
      console.error("Erreur partage WhatsApp:", error);
    } finally {
      setIsSharing(false);
    }
  };

  const handleDownload = async () => {
    const element = document.querySelector('.printable-container');
    if (!element) return;
    setIsDownloading(true);
    const filename = invoices.length === 1 ? `Facture_${invoices[0].number}.pdf` : `Export_Factures_${new Date().getTime()}.pdf`;
    const opt = {
      margin: 0,
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    try {
      // @ts-ignore
      await html2pdf().from(element).set(opt).save();
    } catch (error) {
      console.error("Erreur PDF:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md print:bg-white print:p-0 overflow-hidden print:overflow-visible font-sans text-slate-900">
      <div className="bg-white w-full max-w-6xl h-[95vh] rounded-[16px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 print:h-auto print:w-full print:shadow-none print:rounded-none print:static print:block relative">
        
        {/* Barre d'outils (Masquée à l'impression) */}
        <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0 print:hidden relative z-20">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <i className="fas fa-file-pdf text-xl"></i>
            </div>
            <div>
              <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight">Exportation PDF</h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{invoices.length} document(s) prêt(s)</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button type="button" onClick={handleWhatsApp} disabled={isSharing} className="px-6 py-3 bg-[#25D366] hover:bg-[#1ebd59] text-white rounded-xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center disabled:opacity-50">
              {isSharing ? <i className="fas fa-circle-notch animate-spin mr-2"></i> : <i className="fab fa-whatsapp mr-2 text-lg"></i>}
              Partager
            </button>
            <button type="button" onClick={handleDownload} disabled={isDownloading} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center disabled:opacity-50">
              {isDownloading ? <i className="fas fa-circle-notch animate-spin mr-2"></i> : <i className="fas fa-download mr-2"></i>}
              Télécharger
            </button>
            <button onClick={handlePrint} className="px-6 py-3 bg-white border border-slate-200 rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-slate-50 transition-colors">
              <i className="fas fa-print mr-2"></i>Imprimer
            </button>
            <button onClick={onClose} className="px-6 py-3 bg-slate-100 rounded-xl font-bold text-[11px] uppercase tracking-widest text-slate-400 hover:bg-slate-200 transition-colors">
              Fermer
            </button>
          </div>
        </div>

        {/* Zone de prévisualisation */}
        <div className="flex-1 overflow-y-auto bg-slate-100 p-10 custom-scrollbar print:p-0 print:bg-white print:overflow-visible">
          <div className="printable-container mx-auto print:w-full">
            {invoices.map((invoice, index) => {
              const client = clients.find(c => c.id === invoice.clientId);
              const totalQty = invoice.items.reduce((sum, item) => sum + item.quantity, 0);
              
              return (
                <div 
                  key={invoice.id} 
                  className={`printable-sheet mx-auto bg-white p-[15mm] shadow-2xl print:shadow-none print:p-[10mm] print:m-0 w-[210mm] min-h-[297mm] flex flex-col relative overflow-hidden ${index < invoices.length - 1 ? 'mb-10' : ''}`}
                  style={{ pageBreakAfter: 'always' }}
                >
                  
                  {/* Filigrane d'arrière-plan (Logo central) */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none z-0">
                    {company.logo ? (
                      <img src={company.logo} className="w-[120mm] h-[120mm] object-contain" alt="Watermark" />
                    ) : (
                      <div className="text-[100mm] font-black italic select-none">AP</div>
                    )}
                  </div>

                  <div className="relative z-10 flex flex-col h-full">
                    
                    {/* Header: Logo & Client Box */}
                    <div className="flex justify-between items-start mb-16">
                      <div className="w-[220px]">
                        {company.logo ? (
                          <img src={company.logo} className="w-full object-contain" alt="Apollo Eyewear" />
                        ) : (
                          <div className="text-4xl font-black text-[#1a2b5e] italic leading-none">APOLLO<br/><span className="text-xs tracking-[0.4em] font-normal not-italic opacity-60">EYEWEAR</span></div>
                        )}
                      </div>
                      
                      <div className="w-[450px] border border-slate-300 rounded-[24px] p-8 text-[#1a2b5e]">
                        <h2 className="text-2xl font-black mb-4">Client: {client?.name}</h2>
                        <div className="text-lg space-y-2 font-medium opacity-90">
                          <p>{client?.address || "Adresse non spécifiée"}</p>
                          <p>{client?.city && `${client.city}`}</p>
                          <p>ICE: {client?.gsm1 || "003158315000038"}</p>
                        </div>
                      </div>
                    </div>

                    {/* Titre Facture */}
                    <div className="mb-12">
                      <h1 className="text-4xl font-black text-[#1a2b5e] mb-10">Facture N° : {invoice.number}</h1>
                      <div className="flex space-x-12 text-2xl font-medium text-[#1a2b5e]">
                        <p>Ville: <span className="capitalize">{client?.city || company.city || "oujda"}</span></p>
                        <p>Date: {new Date(invoice.date).toLocaleDateString('fr-FR')}</p>
                      </div>
                    </div>

                    {/* Tableau des produits */}
                    <div className="mb-12 flex-1">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-[#f4f7fe]">
                            <th className="py-4 px-6 text-left text-[14px] font-black text-[#1a2b5e] border-b border-slate-200">Référence Produit</th>
                            <th className="py-4 px-6 text-center text-[14px] font-black text-[#1a2b5e] border-b border-slate-200">Prix Unitaire</th>
                            <th className="py-4 px-6 text-center text-[14px] font-black text-[#1a2b5e] border-b border-slate-200">Quantité</th>
                            <th className="py-4 px-6 text-right text-[14px] font-black text-[#1a2b5e] border-b border-slate-200">Prix Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {invoice.items.map((item, idx) => (
                            <tr key={idx}>
                              <td className="py-4 px-6 text-[14px] font-medium text-[#1a2b5e] uppercase">{item.productName}</td>
                              <td className="py-4 px-6 text-[14px] font-medium text-[#1a2b5e] text-center">{item.price.toLocaleString()}</td>
                              <td className="py-4 px-6 text-[14px] font-medium text-[#1a2b5e] text-center">{item.quantity}</td>
                              <td className="py-4 px-6 text-[14px] font-medium text-[#1a2b5e] text-right">MAD {((item.price * item.quantity) * (1 - item.discount / 100)).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                            </tr>
                          ))}
                          {/* Lignes vides pour compléter le visuel si nécessaire */}
                          {[...Array(Math.max(0, 5 - invoice.items.length))].map((_, i) => (
                            <tr key={`empty-${i}`} className="h-10">
                              <td className="border-b border-slate-50"></td>
                              <td className="border-b border-slate-50"></td>
                              <td className="border-b border-slate-50"></td>
                              <td className="border-b border-slate-50"></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Section Pied de Document (Notes & Totaux) */}
                    <div className="flex justify-between items-start mt-auto mb-16 pt-8">
                      <div className="space-y-6 max-w-md">
                        <p className="text-xl font-medium text-[#1a2b5e]">Quantité demandée: <span className="ml-4">{totalQty}</span></p>
                        <div className="space-y-2">
                          <p className="text-xl font-medium text-[#1a2b5e]">Remarques:</p>
                          <p className="text-lg text-slate-500 font-medium min-h-[40px] italic">{invoice.notes || "S/O"}</p>
                        </div>
                        <p className="text-xl font-medium text-[#1a2b5e]">Modalité de paiement : <span className="ml-4">Cheque</span></p>
                        
                        {/* Cachet & Signature */}
                        <div className="mt-12 pt-8 relative">
                          {company.signature ? (
                            <img src={company.signature} className="h-40 object-contain ml-8 mix-blend-multiply opacity-90" alt="Cachet & Signature" />
                          ) : (
                            <div className="w-56 h-32 border border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-300 text-xs">Cachet & Signature</div>
                          )}
                        </div>
                      </div>

                      <div className="w-[320px]">
                        <table className="w-full border-collapse">
                          <tbody>
                            <tr>
                              <td className="py-3 px-6 text-xl font-medium text-[#1a2b5e] bg-[#f4f7fe]/50 border-b border-white">Montant HT</td>
                              <td className="py-3 px-6 text-xl font-medium text-[#1a2b5e] bg-[#f4f7fe]/50 border-b border-white text-right">MAD {invoice.subtotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                            </tr>
                            <tr>
                              <td className="py-3 px-6 text-xl font-medium text-[#1a2b5e] bg-slate-100 border-b border-white">Remise %</td>
                              <td className="py-3 px-6 text-xl font-medium text-[#1a2b5e] bg-slate-100 border-b border-white text-right">MAD {invoice.discountAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                            </tr>
                            <tr>
                              <td className="py-3 px-6 text-xl font-medium text-[#1a2b5e] bg-[#f4f7fe]/50 border-b border-white">TVA 20%</td>
                              <td className="py-3 px-6 text-xl font-medium text-[#1a2b5e] bg-[#f4f7fe]/50 border-b border-white text-right">MAD {invoice.tvaTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                            </tr>
                            <tr>
                              <td className="py-6 px-6 text-xl font-black text-[#1a2b5e] bg-[#dbe8ff]">Montant Total TTC</td>
                              <td className="py-6 px-6 text-xl font-black text-[#1a2b5e] bg-[#dbe8ff] text-right">MAD {invoice.grandTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Footer Contact */}
                    <div className="border-t border-slate-200 pt-10 text-center">
                      <div className="flex justify-center items-center space-x-10 text-[13px] font-medium text-[#1a2b5e] mb-3">
                        <p>Tel: {company.phone || "+212 6 88 88 90 04"}</p>
                        <p>Email: <span className="lowercase">{company.email || "Contact@apolloeyewear.ma"}</span></p>
                        <p>Website : <span className="lowercase underline">www.apolloeyewear.ma</span></p>
                      </div>
                      <div className="flex justify-center items-center space-x-10 text-[13px] font-medium text-[#1a2b5e]">
                        <p>ICE: {company.siret || "003035634000069"}</p>
                        <p>RC: 40941</p>
                        <p>IF: 52401661</p>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: A4; margin: 0; }
          body { margin: 0 !important; padding: 0 !important; background: white !important; }
          body * { visibility: hidden !important; }
          .printable-container, .printable-container * { visibility: visible !important; }
          .printable-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          .printable-sheet {
            page-break-after: always !important;
            box-shadow: none !important;
            border: none !important;
            width: 100% !important;
            min-height: 297mm !important;
            -webkit-print-color-adjust: exact;
          }
        }
      `}} />
    </div>
  );
};

export default InvoicePDFPreview;
