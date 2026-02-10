import { useState, useEffect } from 'react';

export default function CategoryBudgets({ transactions, darkMode }) {
  
  // STATE MANAGEMENT
  // Default Budget (Jika belum pernah diatur)
  const defaultBudgets = {
    "Makan": 1500000,
    "Transport": 500000,
    "Hiburan": 300000,
    "Tagihan": 1000000,
    "Belanja": 1000000,
    "Kesehatan": 500000,
    "Pendidikan": 500000,
    "Lainnya": 200000
  };

  // Load Budget dari LocalStorage saat awal buka
  const [budgets, setBudgets] = useState(() => {
    const saved = localStorage.getItem('user_budgets');
    return saved ? JSON.parse(saved) : defaultBudgets;
  });

  // State untuk Modal Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newLimit, setNewLimit] = useState(0);

  // LOGIC FUNCTIONS

  // Hitung pengeluaran per kategori
  const calculateSpending = (category) => {
    if (!transactions) return 0;
    return transactions
      .filter(t => t.type === 'Pengeluaran' && t.category === category)
      .reduce((total, t) => total + t.amount, 0);
  };

  // Buka Modal Edit
  const openEditModal = (category, currentLimit) => {
    setEditingCategory(category);
    setNewLimit(currentLimit);
    setIsModalOpen(true);
  };

  // Simpan Budget Baru
  const saveBudget = () => {
    const updatedBudgets = { ...budgets, [editingCategory]: newLimit };
    setBudgets(updatedBudgets);
    localStorage.setItem('user_budgets', JSON.stringify(updatedBudgets)); // Simpan ke browser
    setIsModalOpen(false);
  };

  // Helper Ikon Kategori
  const getCategoryIcon = (cat) => {
    switch (cat) {
      case 'Makan': return <span className="text-2xl">🍔</span>;
      case 'Transport': return <span className="text-2xl">🚗</span>;
      case 'Hiburan': return <span className="text-2xl">🎬</span>;
      case 'Tagihan': return <span className="text-2xl">⚡</span>;
      case 'Belanja': return <span className="text-2xl">🛍️</span>;
      case 'Kesehatan': return <span className="text-2xl">❤️</span>;
      case 'Pendidikan': return <span className="text-2xl">📚</span>;
      default: return <span className="text-2xl">📂</span>;
    }
  };

  // Hitung Total Keseluruhan
  const totalBudget = Object.values(budgets).reduce((a, b) => a + b, 0);
  const totalSpent = Object.keys(budgets).reduce((acc, cat) => acc + calculateSpending(cat), 0);
  const totalPercentage = Math.round((totalSpent / totalBudget) * 100);

  // RENDER JSX
  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* --- HEADER SUMMARY CARD --- */}
      <div className={`p-8 rounded-2xl shadow-xl border relative overflow-hidden ${darkMode ? 'bg-gradient-to-br from-blue-900 to-slate-900 border-slate-700' : 'bg-gradient-to-br from-blue-600 to-blue-500 border-blue-400 text-white'}`}>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h2 className={`text-lg font-medium opacity-90 ${darkMode ? 'text-blue-200' : 'text-blue-100'}`}>Total Anggaran Bulan Ini</h2>
            <div className="text-4xl font-bold mt-2">Rp {totalBudget.toLocaleString('id-ID')}</div>
            <p className="mt-2 text-sm opacity-80">
              Terpakai: Rp {totalSpent.toLocaleString('id-ID')} ({totalPercentage}%)
            </p>
          </div>
          
          {/* Circular Progress Indicator Besar */}
          <div className="flex items-center gap-4">
             <div className="text-right hidden md:block">
                <p className="text-sm font-bold">Status Keuangan</p>
                <p className={`text-xl ${totalPercentage > 100 ? 'text-red-300' : 'text-emerald-300'}`}>
                  {totalPercentage > 100 ? 'Over Budget!' : 'Aman Terkendali'}
                </p>
             </div>
             <div className={`w-20 h-20 rounded-full flex items-center justify-center border-4 ${totalPercentage > 80 ? 'border-red-400 bg-red-500/20' : 'border-emerald-400 bg-emerald-500/20'}`}>
                <span className="font-bold text-lg">{100 - totalPercentage < 0 ? 0 : 100 - totalPercentage}%</span>
             </div>
          </div>
        </div>
        
        {/* Dekorasi Background */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
      </div>


      {/* GRID KATEGORI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.keys(budgets).map((cat) => {
          const limit = budgets[cat];
          const used = calculateSpending(cat);
          const percentage = Math.min(Math.round((used / limit) * 100), 100);
          
          // Warna Progress Dinamis
          let color = 'bg-emerald-500';
          let textColor = 'text-emerald-500';
          if (percentage >= 100) { color = 'bg-rose-500'; textColor = 'text-rose-500'; }
          else if (percentage >= 75) { color = 'bg-yellow-500'; textColor = 'text-yellow-500'; }

          return (
            <div key={cat} className={`group relative p-5 rounded-2xl shadow-sm border transition-all hover:shadow-md hover:-translate-y-1 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              
              {/* Header Kartu */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${darkMode ? 'bg-slate-700' : 'bg-slate-50'}`}>
                    {getCategoryIcon(cat)}
                  </div>
                  <div>
                    <h3 className={`font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{cat}</h3>
                    <p className="text-xs text-slate-500">Limit: Rp {(limit/1000).toFixed(0)}k</p>
                  </div>
                </div>
                
                {/* Tombol Edit (Pensil) */}
                <button 
                  onClick={() => openEditModal(cat, limit)}
                  className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-400'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
                  </svg>
                </button>
              </div>

              {/* Angka Uang */}
              <div className="mb-3">
                <div className="flex justify-between items-end mb-1">
                   <span className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                     Rp {used.toLocaleString('id-ID')}
                   </span>
                   <span className={`text-xs font-bold ${textColor}`}>{percentage}%</span>
                </div>
                <p className="text-xs text-slate-500">Sisa: Rp {(limit - used).toLocaleString('id-ID')}</p>
              </div>

              {/* Progress Bar */}
              <div className={`w-full h-3 rounded-full overflow-hidden ${darkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
                <div 
                  className={`h-full rounded-full transition-all duration-700 ease-out ${color}`} 
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>

            </div>
          );
        })}
      </div>


      {/* MODAL POPUP EDIT BUDGET */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-md p-6 rounded-2xl shadow-2xl transform transition-all scale-100 ${darkMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-800'}`}>
            
            <h3 className="text-xl font-bold mb-4">Ubah Batas Anggaran</h3>
            <p className="text-sm text-slate-500 mb-6">
              Atur batas maksimal pengeluaran untuk kategori <span className="font-bold text-blue-500">{editingCategory}</span>.
            </p>

            <label className="block text-sm font-semibold mb-2">Nominal Batas (Rp)</label>
            <input 
              type="number" 
              value={newLimit}
              onChange={(e) => setNewLimit(Number(e.target.value))}
              className={`w-full p-3 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 mb-6 ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
              placeholder="Contoh: 500000"
            />

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className={`px-4 py-2 rounded-lg font-medium transition ${darkMode ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-100 text-slate-600'}`}
              >
                Batal
              </button>
              <button 
                onClick={saveBudget}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg transition transform active:scale-95"
              >
                Simpan
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}