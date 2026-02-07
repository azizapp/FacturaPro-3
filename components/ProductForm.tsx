
import React, { useState } from 'react';
import { Product } from '../types';

interface ProductFormProps {
  onSubmit: (product: Product) => void;
  onCancel: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    reference: '',
    category: 'Montures',
    description: '',
    price: 0,
    unit: 'Unité',
    tvaRate: 20
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return alert('Le nom du produit est requis.');

    const newProduct: Product = {
      id: crypto.randomUUID(),
      name: formData.name,
      description: formData.description,
      price: formData.price,
      unit: formData.unit,
    };

    onSubmit(newProduct);
  };

  const categories = ['Montures', 'Verres', 'Lentilles', 'Accessoires', 'Services', 'Solaire'];
  const units = ['Unité', 'Paire', 'Boîte', 'Heure', 'Forfait'];

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-500">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <button 
            onClick={onCancel} 
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-[#27354c] border border-slate-200 dark:border-white/10 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"
          >
            <i className="fas fa-arrow-left"></i>
          </button>
          <div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Nouveau Produit / Service</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Ajoutez un article à votre catalogue pour facturer plus rapidement.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white dark:bg-[#27354c] p-10 rounded-3xl shadow-sm border border-slate-200 dark:border-white/5 space-y-8">
            <div className="space-y-6">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400 border-b border-indigo-50 dark:border-white/5 pb-2">Informations Générales</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Nom de l'article *</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Ray-Ban Aviator Classic"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-slate-800 dark:text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Référence / SKU</label>
                  <input 
                    type="text" 
                    placeholder="RB-3025"
                    value={formData.reference}
                    onChange={(e) => setFormData({...formData, reference: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Catégorie</label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium appearance-none dark:text-slate-200"
                  >
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Description</label>
                  <textarea 
                    rows={4}
                    placeholder="Détails techniques, coloris, spécificités..."
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none dark:text-slate-200"
                  ></textarea>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white dark:bg-[#27354c] p-10 rounded-3xl shadow-sm border border-slate-200 dark:border-white/5 space-y-8">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-orange-500 dark:text-orange-400 border-b border-orange-50 dark:border-white/5 pb-2">Tarification</h4>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Prix de vente HT</label>
                <div className="relative">
                  <input 
                    type="number" 
                    placeholder="0.00"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                    className="w-full bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-5 text-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all font-black text-slate-800 dark:text-white"
                  />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">MAD</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Unité</label>
                <select 
                  value={formData.unit}
                  onChange={(e) => setFormData({...formData, unit: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-slate-200"
                >
                  {units.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <button 
              type="submit" 
              className="w-full bg-orange-500 text-white py-5 rounded-2xl font-black shadow-xl shadow-orange-500/20 hover:bg-orange-600 transition-all flex items-center justify-center space-x-3"
            >
              <i className="fas fa-save text-lg"></i>
              <span>ENREGISTRER L'ARTICLE</span>
            </button>
            <button 
              type="button"
              onClick={onCancel}
              className="w-full bg-white dark:bg-[#27354c] text-slate-500 dark:text-slate-400 py-4 rounded-2xl font-bold border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-sm"
            >
              Annuler
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;
