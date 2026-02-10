import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

export default function ExpenseChart({ transactions, darkMode }) {
  
  // Hitung Total & Grouping Data
  let totalExpense = 0;
  const processData = () => {
    if (!transactions) return [];
    const expenses = transactions.filter(t => t.type === 'Pengeluaran');
    
    // Hitung total sekalian
    totalExpense = expenses.reduce((acc, curr) => acc + Number(curr.amount), 0);

    const grouped = expenses.reduce((acc, curr) => {
      const cat = curr.category || 'Lainnya';
      if (!acc[cat]) acc[cat] = 0;
      acc[cat] += Number(curr.amount);
      return acc;
    }, {});

    return Object.keys(grouped).map(key => ({
      name: key,
      value: grouped[key]
    }));
  };

  const data = processData();
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

  return (
    <div className={`p-6 rounded-2xl shadow-lg border flex flex-col items-center justify-center relative overflow-hidden ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
      
      {/* Header dengan Ikon */}
      <h3 className={`font-bold text-lg mb-2 w-full text-center flex items-center justify-center gap-2 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
        Komposisi Pengeluaran
      </h3>
      <p className={`text-sm mb-6 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Berdasarkan kategori bulan ini</p>

      {data.length > 0 ? (
        <div className="w-full h-[250px] relative">
          {/* Teks di Tengah Donut */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
             <p className={`text-xs font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Total Keluar</p>
             <p className={`text-lg font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
               Rp {(totalExpense/1000).toFixed(0)}k
             </p>
          </div>

          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={90}
                paddingAngle={4}
                dataKey="value"
                cornerRadius={6}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke={darkMode ? '#1e293b' : '#fff'} strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => `Rp ${value.toLocaleString('id-ID')}`}
                contentStyle={{ backgroundColor: darkMode ? '#1e293b' : '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ fontWeight: 'bold' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-[250px] flex flex-col items-center justify-center text-slate-400 opacity-70">
          <span className="text-5xl mb-3 grayscale">🍩</span>
          <p font-medium>Belum ada data pengeluaran</p>
        </div>
      )}
    </div>
  );
}