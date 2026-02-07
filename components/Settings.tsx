
import React, { useState, useRef } from 'react';
import { Company } from '../types';

interface SettingsProps {
  company: Company;
  onUpdate: (company: Company) => void;
}

const Settings: React.FC<SettingsProps> = ({ company, onUpdate }) => {
  const [formData, setFormData] = useState<Company>(company);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
    alert('Paramètres enregistrés !');
  };

  const handleFileChange = (field: keyof Company) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData({ ...formData, [field]: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-5xl space-y-8 animate-in fade-in duration-500 pb-20">
      <h3 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Configuration</h3>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white p-8 rounded-[12px] shadow-sm border border-slate-200 space-y-8">
              <h4 className="text-[11px] font-black text-indigo-600 uppercase border-b pb-2">Identité</h4>
              <div onClick={() => logoInputRef.current?.click()} className="h-32 rounded-[12px] border-2 border-dashed border-slate-200 flex items-center justify-center cursor-pointer bg-slate-50 overflow-hidden">
                {formData.logo ? <img src={formData.logo} className="h-full object-contain" /> : <span className="text-xs text-slate-400">Logo</span>}
                <input type="file" ref={logoInputRef} className="hidden" onChange={handleFileChange('logo')} />
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-8 rounded-[12px] shadow-sm border border-slate-200 space-y-8">
               <h4 className="text-[11px] font-black text-orange-500 uppercase border-b pb-2">Général</h4>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="md:col-span-2 space-y-2">
                   <label className="text-[10px] font-bold text-slate-400 uppercase">Raison Sociale</label>
                   <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-[8px] px-5 py-4 text-sm font-bold outline-none" />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-bold text-slate-400 uppercase">ICE</label>
                   <input type="text" value={formData.siret} onChange={(e) => setFormData({...formData, siret: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-[8px] px-5 py-4 text-sm font-bold outline-none" />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-bold text-slate-400 uppercase">E-mail</label>
                   <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-[8px] px-5 py-4 text-sm font-bold outline-none" />
                 </div>
               </div>
            </div>

            <div className="bg-white p-8 rounded-[12px] shadow-sm border border-slate-200 space-y-6">
              <h4 className="text-[11px] font-black text-indigo-600 uppercase border-b pb-2">Numérotation</h4>
              <div className="grid grid-cols-2 gap-6">
                <input type="text" value={formData.invoice_prefix || ''} onChange={(e) => setFormData({...formData, invoice_prefix: e.target.value})} placeholder="Prefixe" className="w-full bg-slate-50 border border-slate-200 rounded-[8px] px-5 py-4 text-sm font-bold text-indigo-600 outline-none" />
                <input type="number" value={formData.invoice_start_number || 1} onChange={(e) => setFormData({...formData, invoice_start_number: parseInt(e.target.value) || 1})} className="w-full bg-slate-50 border border-slate-200 rounded-[8px] px-5 py-4 text-sm font-bold outline-none" />
              </div>
            </div>

            <div className="bg-white p-8 rounded-[12px] shadow-sm border border-slate-200 space-y-6">
              <h4 className="text-[11px] font-black text-emerald-600 uppercase border-b pb-2">Pied de Page</h4>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Texte du pied de page</label>
                <textarea 
                  value={formData.footer || ''} 
                  onChange={(e) => setFormData({...formData, footer: e.target.value})}
                  placeholder="Entrez le texte à afficher en bas de chaque facture"
                  className="w-full bg-slate-50 border border-slate-200 rounded-[8px] px-5 py-4 text-sm font-bold outline-none min-h-[100px] resize-none"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end"><button type="submit" className="bg-indigo-600 text-white px-12 py-4 rounded-[12px] text-[11px] font-black uppercase shadow-2xl hover:bg-indigo-700">Enregistrer</button></div>
      </form>
    </div>
  );
};

export default Settings;
