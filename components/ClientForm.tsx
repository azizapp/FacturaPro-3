
import React, { useState, useEffect, useCallback } from 'react';
import { Client } from '../types';

interface ClientFormProps {
  initialClient?: Client;
  onSubmit: (client: Client) => void;
  onCancel: () => void;
  companyEmail?: string;
}

const InputWrapper: React.FC<{ label: string, children: React.ReactNode }> = ({ label, children }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</label>
    {children}
  </div>
);

const ClientForm: React.FC<ClientFormProps> = ({ initialClient, onSubmit, onCancel, companyEmail }) => {
  const [formData, setFormData] = useState<Partial<Client>>({
    name: '',
    manager: '',
    location: '',
    city: '',
    region: '',
    address: '',
    gsm1: '',
    gsm2: '',
    phone: '',
    email: '',
    gamme: '',
    user_email: companyEmail || '',
    is_blocked: false,
    balance: 0,
    ice: ''
  });

  useEffect(() => {
    const savedUserEmail = localStorage.getItem('user_email_preference');
    if (savedUserEmail && !initialClient) {
      setFormData(prev => ({ ...prev, user_email: savedUserEmail }));
    } else if (companyEmail && !initialClient) {
      setFormData(prev => ({ ...prev, user_email: companyEmail }));
    }
  }, [companyEmail, initialClient]);

  const handleInputChange = useCallback((field: keyof Client, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (field === 'user_email') {
      localStorage.setItem('user_email_preference', value);
    }
  }, []);

  useEffect(() => {
    if (initialClient) {
      setFormData(initialClient);
    }
  }, [initialClient]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return alert('Le nom du client est requis.');

    const client: Client = {
      id: initialClient?.id || crypto.randomUUID(),
      name: formData.name!,
      manager: formData.manager || '',
      location: formData.location || '',
      city: formData.city || '',
      region: formData.region || '',
      address: formData.address || '',
      gsm1: formData.gsm1 || '',
      gsm2: formData.gsm2 || '',
      phone: formData.phone || '',
      email: formData.email || '',
      gamme: formData.gamme || '',
      user_email: formData.user_email || '',
      is_blocked: formData.is_blocked || false,
      balance: formData.balance || 0,
      ice: formData.ice || '',
      created_at: initialClient?.created_at || new Date().toISOString()
    };

    onSubmit(client);
  };

  const renderInput = (field: keyof Client, value: any, props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input
      {...props}
      value={value || ''}
      onChange={(e) => handleInputChange(field, e.target.value)}
      className={`w-full bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/10 outline-none dark:text-slate-200 ${props.className || ''}`}
    />
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-500">
      <div className="flex items-center space-x-4 mb-4">
        <button 
          onClick={onCancel} 
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-[#27354c] border border-slate-200 dark:border-white/10 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 shadow-sm transition-all"
        >
          <i className="fas fa-arrow-left"></i>
        </button>
        <div>
          <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
            {initialClient ? 'Modifier le Client' : 'Nouveau Compte Client'}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium italic">Configuration complète conforme à la base de données centrale.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-[#27354c] p-8 rounded-[15px] shadow-sm border border-slate-200 dark:border-white/5 space-y-6">
            <h4 className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 border-b border-indigo-50 dark:border-white/5 pb-2 flex items-center">
              <i className="fas fa-id-card mr-2"></i> Identité & Responsables
            </h4>
            <div className="space-y-4">
              <InputWrapper label="Raison Sociale *">
                {renderInput('name', formData.name, {
                  type: "text",
                  placeholder: "Nom de l'entreprise",
                  required: true,
                  className: "font-bold text-slate-800 dark:text-white"
                })}
              </InputWrapper>
              <div className="grid grid-cols-2 gap-4">
                <InputWrapper label="Responsable (Manager)">
                  {renderInput('manager', formData.manager, {
                    type: "text",
                    placeholder: "Nom du responsable"
                  })}
                </InputWrapper>
                <InputWrapper label="Gamme / Type">
                  <select 
                    value={formData.gamme}
                    onChange={(e) => handleInputChange('gamme', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/10 outline-none appearance-none dark:text-slate-200"
                  >
                    <option value="">Sélectionner...</option>
                    <option value="Premium">Premium</option>
                    <option value="Standard">Standard</option>
                    <option value="Grossiste">Grossiste</option>
                  </select>
                </InputWrapper>
              </div>
              <InputWrapper label="E-mail Utilisateur (Interne)">
                {renderInput('user_email', formData.user_email, {
                  type: "email",
                  placeholder: "user@votreentreprise.com"
                })}
              </InputWrapper>
              <div className="flex items-center space-x-3 p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-white/5">
                <input 
                  type="checkbox" 
                  id="is_blocked"
                  checked={formData.is_blocked}
                  onChange={(e) => handleInputChange('is_blocked', e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 text-rose-500 focus:ring-rose-500"
                />
                <label htmlFor="is_blocked" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase cursor-pointer">Bloquer ce client</label>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#27354c] p-8 rounded-[15px] shadow-sm border border-slate-200 dark:border-white/5 space-y-6">
            <h4 className="text-xs font-black uppercase text-emerald-600 dark:text-emerald-400 border-b border-emerald-50 dark:border-white/5 pb-2 flex items-center">
              <i className="fas fa-phone-alt mr-2"></i> Coordonnées de Contact
            </h4>
            <div className="space-y-4">
              <InputWrapper label="E-mail Client">
                {renderInput('email', formData.email, {
                  type: "email",
                  placeholder: "contact@client.ma"
                })}
              </InputWrapper>
              <div className="grid grid-cols-2 gap-4">
                <InputWrapper label="Téléphone Fixe">
                  {renderInput('phone', formData.phone, {
                    type: "text",
                    placeholder: "05..."
                  })}
                </InputWrapper>
                <InputWrapper label="GSM 1 (Principal)">
                  {renderInput('gsm1', formData.gsm1, {
                    type: "text",
                    placeholder: "06..."
                  })}
                </InputWrapper>
              </div>
              <InputWrapper label="GSM 2 (Secondaire)">
                {renderInput('gsm2', formData.gsm2, {
                  type: "text",
                  placeholder: "07..."
                })}
              </InputWrapper>
              <InputWrapper label="ICE (Identifiant Commun de l'Entreprise)">
                {renderInput('ice', formData.ice, {
                  type: "text",
                  placeholder: "Ex: 000000000000000"
                })}
              </InputWrapper>
            </div>
          </div>

          <div className="bg-white dark:bg-[#27354c] p-8 rounded-[15px] shadow-sm border border-slate-200 dark:border-white/5 space-y-6 lg:col-span-2">
            <h4 className="text-xs font-black uppercase text-orange-500 dark:text-orange-400 border-b border-orange-50 dark:border-white/5 pb-2 flex items-center">
              <i className="fas fa-map-marked-alt mr-2"></i> Localisation Géographique
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <InputWrapper label="Adresse Complète">
                  {renderInput('address', formData.address, {
                    type: "text",
                    placeholder: "N°, Rue, Quartier..."
                  })}
                </InputWrapper>
              </div>
              <InputWrapper label="Ville">
                {renderInput('city', formData.city, {
                  type: "text",
                  placeholder: "Ex: Casablanca"
                })}
              </InputWrapper>
              <InputWrapper label="Région">
                {renderInput('region', formData.region, {
                  type: "text",
                  placeholder: "Ex: Casablanca-Settat"
                })}
              </InputWrapper>
              <div className="md:col-span-3">
                <InputWrapper label="Emplacement (Location / GPS)">
                  {renderInput('location', formData.location, {
                    type: "text",
                    placeholder: "Lien Google Maps ou Coordonnées"
                  })}
                </InputWrapper>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-8 border-t border-slate-100 dark:border-white/5">
          <button 
            type="button" 
            onClick={onCancel}
            className="px-10 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-slate-600 dark:hover:text-white transition-colors"
          >
            Abandonner
          </button>
          <button 
            type="submit"
            className="bg-indigo-600 text-white px-12 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-indigo-600/30 hover:bg-indigo-700 hover:-translate-y-1 transition-all flex items-center space-x-3"
          >
            <i className="fas fa-check-double text-xs"></i>
            <span>{initialClient ? 'Mettre à jour le compte' : 'Créer le compte client'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClientForm;
