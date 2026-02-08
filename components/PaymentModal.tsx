
import React, { useState } from 'react';
import { Invoice, Payment, PaymentMethod } from '../types';

interface PaymentModalProps {
  invoice: Invoice;
  onClose: () => void;
  onPaymentAdded: (invoiceId: string, payment: Payment) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ invoice, onClose, onPaymentAdded }) => {
  const calculatePaid = (inv: Invoice) => (inv.payments || []).reduce((s, p) => s + p.amount, 0);
  const remaining = invoice.grandTotal - calculatePaid(invoice);

  const [amount, setAmount] = useState<number>(remaining);
  const [method, setMethod] = useState<PaymentMethod>(PaymentMethod.CHECK);
  const [note, setNote] = useState('');

  const handleSave = () => {
    if (amount <= 0 || amount > remaining) return alert("Montant invalide");
    
    const newPayment: Payment = {
      id: crypto.randomUUID(),
      invoiceId: invoice.id,
      amount,
      date: new Date().toISOString(),
      method,
      note: note || `Règlement - ${method}`
    };
    
    onPaymentAdded(invoice.id, newPayment);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-[15px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <h4 className="text-lg font-bold text-slate-800 uppercase tracking-tight">Encaissement Rapide</h4>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-slate-200 text-slate-400"><i className="fas fa-times"></i></button>
        </div>

        <div className="p-8 space-y-6">
          <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
            <p className="text-xs text-indigo-800">Facture: <span className="font-bold">{invoice.number}</span></p>
            <p className="text-xs text-indigo-800">Reste à payer: <span className="font-black">{remaining.toLocaleString()} MAD</span></p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-slate-400">Montant</label>
              <input type="number" value={amount} onChange={(e) => setAmount(parseFloat(e.target.value) || 0)} className="w-full bg-slate-50 border border-slate-200 rounded-[8px] px-4 py-3 text-lg font-bold text-indigo-600 outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-slate-400">Mode</label>
              <select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)} className="w-full bg-slate-50 border border-slate-200 rounded-[8px] px-4 py-3 text-sm font-bold outline-none">
                <option value={PaymentMethod.CHECK}>Chèque</option>
                <option value={PaymentMethod.CASH}>Espèces</option>
                <option value={PaymentMethod.TRANSFER}>Virement</option>
              </select>
            </div>
          </div>
          <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optionnel)" className="w-full bg-slate-50 border border-slate-200 rounded-[8px] px-4 py-3 text-sm outline-none" />
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 text-[10px] font-black text-slate-400 uppercase">Annuler</button>
          <button onClick={handleSave} className="flex-[2] bg-indigo-600 text-white px-8 py-3 rounded-[8px] text-[10px] font-black uppercase shadow-xl hover:bg-indigo-700">Confirmer</button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
