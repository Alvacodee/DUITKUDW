import React from 'react';

export default function PredictionCard({ onPredict, prediction, loading, darkMode }) {
  
  // Format Rupiah
  const formatRupiah = (num) => "Rp " + Math.abs(num).toLocaleString('id-ID');

  return (
    <div className={`relative overflow-hidden rounded-3xl p-8 shadow-2xl border transition-all duration-500 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-blue-100'}`}>
      
      {/* Background Decoration (Glow Effect) */}
      <div className={`absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none`}></div>
      <div className={`absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none`}></div>

      {/* HEADER */}
      <div className="relative z-10 text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-lg mb-4 animate-fade-in">
           <span>🤖</span> AI Financial Consultant
        </div>
        <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
          Proyeksi Pengeluaran Bulan Depan
        </h2>
        <p className={`mt-2 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          Biarkan algoritma membaca pola transaksimu untuk memprediksi masa depan.
        </p>
      </div>

      {/* CONTENT AREA */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[180px]">
        
        {loading ? (
          // LOADING STATE
          <div className="flex flex-col items-center animate-pulse">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-blue-500 font-bold">Sedang Menganalisis Data...</p>
            <p className="text-xs text-slate-400 mt-1">Membaca pola "Pengeluaran"...</p>
          </div>
        ) : prediction ? (
          // RESULT STATE
          <div className="text-center animate-fade-in-up w-full">
            
            <p className={`text-sm font-semibold uppercase tracking-wider mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Estimasi Total Pengeluaran
            </p>
            
            {/* Angka Besar Glowing */}
            <div className={`text-5xl md:text-6xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r ${
                prediction.status.includes("Naik") 
                ? 'from-red-400 to-orange-500 drop-shadow-red' // Merah jika naik
                : 'from-emerald-400 to-teal-500 drop-shadow-emerald' // Hijau jika turun
            }`}>
              {formatRupiah(prediction.prediction)}
            </div>

            {/* Badge Status */}
            <div className={`inline-block px-4 py-2 rounded-xl text-sm font-bold border mb-4 ${
                prediction.status.includes("Naik") 
                ? 'bg-red-500/10 border-red-500/20 text-red-500' 
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
            }`}>
              {prediction.status}
            </div>

            {/* Pesan Saran */}
            <div className={`p-4 rounded-xl text-sm max-w-lg mx-auto leading-relaxed border ${
                darkMode ? 'bg-slate-700/50 border-slate-600 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}>
              " {prediction.message} "
            </div>

            {/* Tombol Ramal Ulang */}
            <button 
              onClick={onPredict}
              className="mt-8 text-sm text-blue-500 hover:text-blue-400 underline decoration-dotted underline-offset-4"
            >
              Analisis Ulang
            </button>
          </div>
        ) : (
          // EMPTY STATE (BELUM RAMAL)
          <div className="flex flex-col items-center">
             <div className="text-6xl mb-4 grayscale opacity-50">🔮</div>
             <p className={`mb-6 text-sm ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
               Belum ada ramalan. Klik tombol di bawah.
             </p>
             <button
              onClick={onPredict}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-2xl font-bold shadow-xl shadow-blue-500/30 transition transform hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <span>✨</span> Ramal Sekarang
            </button>
          </div>
        )}
      </div>
    </div>
  );
}