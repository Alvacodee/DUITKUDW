import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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

    console.log(`[TrendChart ${mode}] Total Transaksi:`, transactions.length);
    console.log(`[TrendChart ${mode}] Filtered Expenses:`, expenses.length);
    if (expenses.length > 0) {
      console.log(`[TrendChart ${mode}] Sample Data:`, expenses[0]);
    }

    // Grouping Data
    const grouped = expenses.reduce((acc, curr) => {
      // Coba ambil tanggal dari berbagai kemungkinan field
      // Prioritas: t.date (input manual) -> t.created_at (database) -> t.CreatedAt (Go default)
      const rawDate = curr.date || curr.created_at || curr.CreatedAt;
      
      if (!rawDate) return acc;

      try {
        const dateObj = new Date(rawDate);
        
        // Cek apakah tanggal valid
        if (isNaN(dateObj.getTime())) {
          console.warn("Tanggal invalid ditemukan:", rawDate);
          return acc;
        }

        let key;
        if (mode === 'monthly') {
          // Format: YYYY-MM
          key = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
        } else {
          // Format: YYYY-MM-DD
          key = dateObj.toISOString().split('T')[0];
        }

        if (!acc[key]) acc[key] = 0;
        
        // Pastikan amount dibaca sebagai angka (handle jika string)
        acc[key] += Number(curr.amount);
      } catch (e) {
        console.error("Error processing item:", curr, e);
      }
      return acc;
    }, {});

    // Ubah ke Array
    const result = Object.keys(grouped).sort().map(key => {
      const dateObj = new Date(key + (mode === 'monthly' ? '-01' : ''));
      return {
        name: mode === 'monthly' 
          ? dateObj.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }) 
          : dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        total: grouped[key]
      };
    });

    console.log(`[TrendChart ${mode}] Final Data:`, result);
    return result;
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
                formatter={(value) => [`Rp ${value.toLocaleString('id-ID')}`, 'Total']}
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