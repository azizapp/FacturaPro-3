
import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Invoice, Client, InvoiceStatus } from '../types';
import { summarizeInvoices } from '../services/geminiService';

interface DashboardProps {
  invoices: Invoice[];
  clients: Client[];
}

interface AiAnalysisResult {
  summary: string;
  insights: string[];
  recommendation: string;
}

const Dashboard: React.FC<DashboardProps> = ({ invoices, clients }) => {
  const [aiAnalysis, setAiAnalysis] = useState<AiAnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const totalHt = invoices.reduce((acc, inv) => acc + (inv.subtotal || 0), 0);
  const totalTva = invoices.reduce((acc, inv) => acc + (inv.tvaTotal || 0), 0);
  const totalTtc = invoices.reduce((acc, inv) => acc + (inv.grandTotal || 0), 0);
  
  const totalPaid = invoices.filter(i => i.status === InvoiceStatus.PAID).reduce((acc, inv) => acc + inv.grandTotal, 0);
  const pendingRevenue = totalTtc - totalPaid;

  const getMonthlyData = () => {
    const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc"];
    const currentYear = new Date().getFullYear();
    const data = [];

    for (let i = 0; i < 12; i++) {
      const count = invoices.filter(inv => {
        const invDate = new Date(inv.date);
        return invDate.getMonth() === i && invDate.getFullYear() === currentYear;
      }).length;

      data.push({
        name: monthNames[i],
        count: count
      });
    }
    return data;
  };

  const monthlyData = getMonthlyData();

  const handleRequestAnalysis = async () => {
    setAnalyzing(true);
    try {
      const result = await summarizeInvoices(invoices);
      setAiAnalysis(result);
    } catch (error) {
      console.error(error);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Chiffre d'Affaires HT" 
          value={`${totalHt.toLocaleString()} MAD`} 
          icon="fa-calculator" 
          color="bg-slate-700" 
          subtitle="Base imposable"
        />
        <StatCard 
          title="TVA Collectée (20%)" 
          value={`${totalTva.toLocaleString()} MAD`} 
          icon="fa-percentage" 
          color="bg-indigo-600" 
          subtitle="20% du montant HT"
        />
        <StatCard 
          title="Total Revenu TTC" 
          value={`${totalTtc.toLocaleString()} MAD`} 
          icon="fa-wallet" 
          color="bg-blue-600" 
          subtitle="Montant net à payer"
        />
        <StatCard 
          title="Reste à Recouvrer" 
          value={`${pendingRevenue.toLocaleString()} MAD`} 
          icon="fa-clock" 
          color="bg-rose-500" 
          subtitle="Factures non soldées"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[12px] border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center">
                <i className="fas fa-chart-line text-indigo-500 mr-3"></i>
                Évolution de l'activité ({new Date().getFullYear()})
              </h3>
              <p className="text-xs text-slate-400 mt-1">Volume mensuel de Janvier à Décembre</p>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} dy={15} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px' }}
                  cursor={{ stroke: '#4f46e5', strokeWidth: 1 }}
                  itemStyle={{ color: '#4f46e5', fontWeight: '800', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="count" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" animationDuration={1500} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 text-white p-8 rounded-[12px] shadow-2xl relative overflow-hidden flex flex-col min-h-[500px]">
          <div className="relative z-10 h-full flex flex-col">
            <div className="flex items-center space-x-4 mb-8">
              <div className="bg-indigo-500/20 w-12 h-12 rounded-[10px] flex items-center justify-center text-indigo-400 shadow-inner">
                <i className="fas fa-microchip text-2xl"></i>
              </div>
              <div>
                <h3 className="font-black text-xl leading-tight uppercase tracking-tighter">Diagnostic IA</h3>
                <p className="text-[10px] text-indigo-300 uppercase tracking-[0.2em] font-black opacity-70">Audit Live</p>
              </div>
            </div>
            
            <div className="flex-1 flex flex-col">
              {analyzing ? (
                <div className="flex flex-col items-center justify-center space-y-6 py-20">
                  <div className="w-16 h-16 border-4 border-white/5 border-t-indigo-500 rounded-full animate-spin"></div>
                  <p className="text-indigo-200 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Analyse...</p>
                </div>
              ) : aiAnalysis ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-6">
                  <div className="bg-indigo-500/10 border border-indigo-500/20 p-6 rounded-[12px]">
                     <p className="text-sm text-white font-medium leading-relaxed">{aiAnalysis.summary}</p>
                  </div>
                  <div className="space-y-3">
                     {aiAnalysis.insights.map((insight, idx) => (
                       <div key={idx} className="flex items-start space-x-4 text-xs">
                         <i className="fas fa-check text-emerald-400 mt-1"></i>
                         <p className="text-slate-300 leading-relaxed">{insight}</p>
                       </div>
                     ))}
                  </div>
                  <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-[12px]">
                     <p className="text-xs text-white leading-relaxed italic opacity-90">"{aiAnalysis.recommendation}"</p>
                  </div>
                  <button onClick={handleRequestAnalysis} className="w-full bg-white text-slate-900 font-black py-4 rounded-[10px] text-[10px] uppercase tracking-[0.2em] transition-all hover:bg-indigo-50">
                    Recalculer
                  </button>
                </div>
              ) : (
                <div className="text-center py-16 h-full flex flex-col justify-center">
                  <i className="fas fa-brain text-7xl text-indigo-500/10 mb-6"></i>
                  <h4 className="text-lg font-black text-white mb-4 uppercase tracking-tighter">IA Gemini</h4>
                  <p className="text-xs text-slate-400 leading-relaxed mb-12 px-6">Analyse de trésorerie et obligations TVA.</p>
                  <button onClick={handleRequestAnalysis} className="w-full bg-indigo-600 text-white font-black py-5 rounded-[10px] text-[10px] uppercase tracking-[0.3em]">
                    Démarrer l'Audit
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-[100px] -mr-40 -mt-40"></div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string, value: string, icon: string, color: string, subtitle?: string }> = ({ title, value, icon, color, subtitle }) => (
  <div className="bg-white p-7 rounded-[12px] border border-slate-200 shadow-sm flex items-center space-x-6 group hover:border-indigo-200 transition-all duration-300">
    <div className={`${color} w-14 h-14 rounded-[10px] flex items-center justify-center text-white shadow-lg`}>
      <i className={`fas ${icon} text-xl`}></i>
    </div>
    <div>
      <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{title}</p>
      <h4 className="text-lg font-black text-slate-800 tracking-tighter">{value}</h4>
      {subtitle && <p className="text-[9px] text-slate-400 font-medium italic mt-1">{subtitle}</p>}
    </div>
  </div>
);

export default Dashboard;
