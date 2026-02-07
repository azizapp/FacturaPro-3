
import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Invoice, Client, InvoiceStatus } from '../types';
import { summarizeInvoices } from '../services/geminiService';
import { useAppContext } from '../context/AppContext';

interface DashboardProps {
  invoices: Invoice[];
  clients: Client[];
}

const Dashboard: React.FC<DashboardProps> = ({ invoices, clients }) => {
  const { theme } = useAppContext();
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const stats = useMemo(() => {
    const totalTtc = invoices.reduce((acc, inv) => acc + (inv.grandTotal || 0), 0);
    const totalPaid = invoices.reduce((acc, inv) => acc + (inv.payments?.reduce((sum, p) => sum + p.amount, 0) || 0), 0);
    const pending = totalTtc - totalPaid;
    return { totalTtc, totalPaid, pending };
  }, [invoices]);

  const monthlyData = useMemo(() => {
    const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
    const currentYear = new Date().getFullYear();
    return monthNames.map((name, i) => {
      const amount = invoices
        .filter(inv => {
          const d = new Date(inv.date);
          return d.getMonth() === i && d.getFullYear() === currentYear;
        })
        .reduce((sum, inv) => sum + inv.grandTotal, 0);
      return { name, amount };
    });
  }, [invoices]);

  const handleAiAnalysis = async () => {
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

  const isDark = theme === 'dark';

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Metrics Row - Compact & Aesthetic */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Chiffre d'Affaires" value={stats.totalTtc} icon="fa-chart-line" color="indigo" theme={theme} />
        <MetricCard title="Total Encaissé" value={stats.totalPaid} icon="fa-wallet" color="emerald" theme={theme} />
        <MetricCard title="Reste à Recouvrer" value={stats.pending} icon="fa-clock-rotate-left" color="rose" theme={theme} />
        <MetricCard title="Nombre de Clients" value={clients.length} icon="fa-users" color="blue" isCurrency={false} theme={theme} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-[24px] border border-slate-200 dark:border-white/5 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-black uppercase tracking-widest dark:text-white flex items-center">
              <span className="w-1 h-4 bg-indigo-500 rounded-full mr-2"></span>
              Performance Annuelle
            </h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#1e293b' : '#f1f5f9'} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} tickFormatter={(v) => `${v/1000}k`} />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: isDark ? '#0f172a' : '#fff'}}
                  itemStyle={{fontWeight: 'bold', color: '#6366f1', fontSize: '12px'}}
                />
                <Area type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={3} fill="url(#colorAmt)" animationDuration={1500} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Sidebar - Slightly more compact */}
        <div className="bg-[#27354c] rounded-[24px] p-6 text-white shadow-xl relative overflow-hidden flex flex-col border border-white/5">
          <div className="relative z-10 flex-1">
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10">
                <i className="fas fa-sparkles text-indigo-400 text-lg"></i>
              </div>
              <h3 className="font-black text-lg tracking-tight uppercase italic">Analyste <span className="text-indigo-400">Pro</span></h3>
            </div>

            {analyzing ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="w-10 h-10 border-3 border-white/20 border-t-indigo-500 rounded-full animate-spin"></div>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 italic">Analyse en cours...</p>
              </div>
            ) : aiAnalysis ? (
              <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2">
                <p className="text-xs font-medium leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5">{aiAnalysis.summary}</p>
                <ul className="space-y-2">
                  {aiAnalysis.insights.slice(0, 3).map((item: string, i: number) => (
                    <li key={i} className="flex items-start text-[10px] font-medium">
                      <i className="fas fa-circle-check mt-1 mr-2 text-indigo-400 text-[8px]"></i>
                      <span className="opacity-80">{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="p-4 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                  <p className="text-[8px] font-black uppercase mb-1 tracking-widest text-indigo-300">Recommandation</p>
                  <p className="text-[11px] italic font-bold text-slate-200">"{aiAnalysis.recommendation}"</p>
                </div>
                <button onClick={handleAiAnalysis} className="w-full bg-indigo-600 text-white font-black py-3 rounded-xl text-[10px] uppercase tracking-widest hover:bg-indigo-500 transition-all">
                  Actualiser
                </button>
              </div>
            ) : (
              <div className="text-center py-8 flex flex-col items-center">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                   <i className="fas fa-brain text-3xl opacity-20"></i>
                </div>
                <p className="text-[10px] font-medium mb-6 opacity-60 uppercase tracking-widest">Lancez l'intelligence artificielle</p>
                <button onClick={handleAiAnalysis} className="w-full bg-white text-slate-900 font-black py-3 rounded-xl text-[10px] uppercase tracking-widest shadow-lg hover:bg-slate-100 transition-all">
                  Analyser les données
                </button>
              </div>
            )}
          </div>
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-500/5 rounded-full blur-3xl"></div>
        </div>
      </div>
    </div>
  );
};

const MetricCard: React.FC<{title: string, value: number, icon: string, color: string, isCurrency?: boolean, theme?: string}> = ({title, value, icon, color, isCurrency = true, theme}) => {
  const colorMap: any = {
    indigo: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-[20px] border border-slate-200 dark:border-white/5 shadow-sm group hover:-translate-y-1 hover:shadow-md transition-all duration-300">
      <div className="flex items-center space-x-3">
        {/* Icon & Value on the same row */}
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${colorMap[color]}`}>
          <i className={`fas ${icon} text-sm`}></i>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-lg font-black text-slate-900 dark:text-white tracking-tight truncate">
            {isCurrency ? value.toLocaleString() : value}
            {isCurrency && <span className="text-[9px] ml-1 opacity-40 font-bold uppercase">MAD</span>}
          </h4>
        </div>
      </div>
      {/* Label below */}
      <div className="mt-2 pl-0.5">
        <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500">
          {title}
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
