import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { parseTxDate, toDateKey } from '../utils/date';

export default function TrendChart({ transactions, darkMode, mode = 'daily' }) {
  
  // FUNGSI PROSES DATA
  const processData = () => {
    // Cek Data Mentah
    if (!transactions || !Array.isArray(transactions)) return [];

    // Filter Pengeluaran (Lebih Robust/Kuat)
    // Kita terima: "Pengeluaran", "pengeluaran", "expense", "Expense"
    const expenses = transactions.filter(t => {
      const type = t.type ? t.type.toLowerCase() : '';
      return type === 'pengeluaran' || type === 'expense';
    });

    // Grouping Data per hari / per bulan (pakai tanggal lokal agar tidak bergeser zona waktu)
    const grouped = expenses.reduce((acc, curr) => {
      const dateObj = parseTxDate(curr);
      if (!dateObj) return acc;

      const key = mode === 'monthly'
        ? toDateKey(dateObj).slice(0, 7) // YYYY-MM
        : toDateKey(dateObj);            // YYYY-MM-DD

      acc[key] = (acc[key] || 0) + Number(curr.amount || 0);
      return acc;
    }, {});

    // Ubah ke Array (key YYYY-MM[-DD] bisa diurutkan secara string)
    return Object.keys(grouped).sort().map(key => {
      const [y, m, d] = key.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d || 1);
      return {
        name: mode === 'monthly' 
          ? dateObj.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }) 
          : dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        total: grouped[key]
      };
    });
  };

  const data = processData();

  return (
    <div className={`p-6 rounded-xl shadow-lg flex flex-col items-center transition-colors ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
      
      <h2 className={`text-xl font-semibold mb-6 border-b pb-2 w-full ${darkMode ? 'text-slate-200 border-slate-700' : 'text-slate-700'}`}>
        Pengeluaran {mode === 'monthly' ? 'Bulanan' : 'Harian'}
      </h2>

      {data.length > 0 ? (
        <div className="w-full h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`colorTotal${mode}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={mode === 'monthly' ? "#8b5cf6" : "#3b82f6"} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={mode === 'monthly' ? "#8b5cf6" : "#3b82f6"} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? "#334155" : "#e2e8f0"} />
              <XAxis dataKey="name" tick={{ fill: darkMode ? '#94a3b8' : '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: darkMode ? '#94a3b8' : '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
              <Tooltip 
                contentStyle={{ backgroundColor: darkMode ? '#1e293b' : '#fff', borderRadius: '8px', border: 'none' }} 
                itemStyle={{ color: mode === 'monthly' ? '#8b5cf6' : '#3b82f6' }}
                formatter={(value) => [`Rp ${Number(value).toLocaleString('id-ID')}`, 'Total']}
              />
              <Area type="monotone" dataKey="total" stroke={mode === 'monthly' ? "#8b5cf6" : "#3b82f6"} strokeWidth={3} fill={`url(#colorTotal${mode})`} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-[300px] w-full flex flex-col items-center justify-center text-slate-400 gap-2 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
          <span className="text-4xl">📉</span>
          <p>Belum ada data history pengeluaran</p>
        </div>
      )}
    </div>
  );
}