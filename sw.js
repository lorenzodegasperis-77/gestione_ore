import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Clock, Calendar, BarChart3, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { it } from 'date-fns/locale';

// --- Componenti UI Mock (Simulando Shadcn/ui) ---
const Card = ({ children, className = "" }) => (
  <div className={`bg-white dark:bg-slate-900 rounded-xl shadow-sm border ${className}`}>{children}</div>
);

const CardHeader = ({ children, className = "" }) => (
  <div className={`p-4 border-b ${className}`}>{children}</div>
);

const CardContent = ({ children }) => <div className="p-6">{children}</div>;

// --- App Principale ---
export default function AnalisiOreApp() {
  // Stato per le sessioni (Dati Mock)
  const [sessions, setSessions] = useState([
    { id: 1, date: '2023-10-20', client: 'Q8', duration_minutes: 462, tags: ['Sviluppo'] },
    { id: 2, date: '2023-10-21', client: 'Shell', duration_minutes: 300, tags: ['Meeting'] },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    client: 'all'
  });

  // --- Logica di Calcolo ---
  const filteredSessions = useMemo(() => {
    return sessions.filter(s => {
      const date = new Date(s.date);
      const start = new Date(filters.startDate);
      const end = new Date(filters.endDate);
      const dateMatch = isWithinInterval(date, { start, end });
      const clientMatch = filters.client === 'all' || s.client === filters.client;
      return dateMatch && clientMatch;
    });
  }, [sessions, filters]);

  const totalMinutes = filteredSessions.reduce((sum, s) => sum + s.duration_minutes, 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalMins = totalMinutes % 60;
  
  const avgMinutes = filteredSessions.length > 0 ? totalMinutes / filteredSessions.length : 0;

  // --- Azioni ---
  const handleDelete = (id) => {
    setSessions(sessions.filter(s => s.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-slate-800">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-indigo-900 tracking-tight">Analisi Ore Lavorate</h1>
            <p className="text-slate-500">Monitoraggio performance e commesse</p>
          </div>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium transition-all shadow-lg shadow-indigo-200"
          >
            <Plus size={18} /> Nuova Sessione
          </button>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-l-4 border-l-indigo-500">
            <CardHeader className="bg-indigo-50/50">
              <h3 className="text-sm font-semibold text-indigo-900 uppercase tracking-wider">Ore Totali</h3>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black text-indigo-600">{totalHours}h {totalMins}m</div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-emerald-500">
            <CardHeader className="bg-emerald-50/50">
              <h3 className="text-sm font-semibold text-emerald-900 uppercase tracking-wider">Sessioni</h3>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black text-emerald-600">{filteredSessions.length}</div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-500">
            <CardHeader className="bg-amber-50/50">
              <h3 className="text-sm font-semibold text-amber-900 uppercase tracking-wider">Media Giornaliera</h3>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black text-amber-600">
                {Math.floor(avgMinutes / 60)}h {Math.round(avgMinutes % 60)}m
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista Sessioni */}
        <Card>
          <CardHeader className="flex justify-between items-center">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Clock size={20} className="text-indigo-600" /> Ultime Attività
            </h2>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                <tr>
                  <th className="p-4 font-semibold">Data</th>
                  <th className="p-4 font-semibold">Cliente</th>
                  <th className="p-4 font-semibold">Durata</th>
                  <th className="p-4 font-semibold text-right">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSessions.map(session => (
                  <tr key={session.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="p-4 font-medium">{format(new Date(session.date), 'dd MMM yyyy', { locale: it })}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-700 text-sm font-medium">
                        {session.client}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-indigo-700">
                      {Math.floor(session.duration_minutes / 60)}h {session.duration_minutes % 60}m
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => handleDelete(session.id)}
                        className="text-slate-400 hover:text-red-600 p-2 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredSessions.length === 0 && (
              <div className="p-10 text-center text-slate-400 italic">Nessuna sessione trovata per il periodo selezionato.</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
