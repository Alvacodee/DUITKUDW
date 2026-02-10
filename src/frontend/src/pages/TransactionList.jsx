import React, { useState } from 'react';

export default function TransactionList({ transactions, onEdit, onDelete, editId, darkMode }) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // STATE MODAL DELETE
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  // PAGINATION
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const sortedTransactions = [...transactions].sort((a, b) => b.ID - a.ID);
  const currentItems = sortedTransactions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(transactions.length / itemsPerPage);

  const nextPage = () => { if (currentPage < totalPages) setCurrentPage(currentPage + 1); };
  const prevPage = () => { if (currentPage > 1) setCurrentPage(currentPage - 1); };

  // DELETE HANDLER
  
  // Klik Tombol Sampah -> Buka Modal
  const initiateDelete = (id) => {
    setDeleteTargetId(id);
    setIsDeleteModalOpen(true);
  };

  // Klik "Ya, Hapus" di Modal -> Panggil API -> Tutup Modal
  const confirmDelete = () => {
    if (deleteTargetId) {
      onDelete(deleteTargetId); // Panggil fungsi dari App.jsx
      setIsDeleteModalOpen(false);
      setDeleteTargetId(null);
    }
  };

  // Klik "Batal" -> Tutup Modal
  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setDeleteTargetId(null);
  };

  // HELPER EMOJI
  const getCategoryEmoji = (cat) => {
    const map = {
        'Makan': '🍔', 'Transport': '🚗', 'Belanja': '🛍️',
        'Hiburan': '🎬', 'Tagihan': '⚡', 'Kesehatan': '💊',
        'Pendidikan': '📚', 'Gaji': '💰', 'Lainnya': '📂'
    };
    return map[cat] || '📂';
  };

  const handleExport = () => {
    if (!transactions || transactions.length === 0) { alert("Belum ada data!"); return; }
    const headers = ["Tanggal,Keterangan,Kategori,Tipe,Jumlah"];
    const rows = transactions.map(t => {
      const dateSrc = t.date || t.created_at || t.CreatedAt;
      const date = dateSrc ? new Date(dateSrc).toLocaleDateString('id-ID') : '-';
      const cleanDesc = t.description ? `"${t.description.replace(/"/g, '""')}"` : '""';
      return `${date},${cleanDesc},${t.category},${t.type},${t.amount}`;
    });
    const csvContent = [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Laporan_Keuangan_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`rounded-2xl shadow-lg overflow-hidden border transition-colors ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
      
      {/* HEADER */}
      <div className={`p-5 border-b flex flex-col sm:flex-row justify-between items-center gap-4 ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-blue-50/50 border-blue-100'}`}>
        <h2 className={`text-lg font-bold flex items-center gap-2 ${darkMode ? 'text-blue-400' : 'text-blue-800'}`}>
            Riwayat Transaksi
        </h2>
        <div className="flex items-center gap-3">
          <button onClick={handleExport} className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm active:scale-95 ${darkMode ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-white'}`}>
            📂 Export Excel
          </button>
          <span className={`text-sm px-4 py-2 rounded-xl font-medium ${darkMode ? 'bg-slate-700 text-blue-300' : 'bg-blue-100 text-blue-600'}`}>
            Total: {transactions.length}
          </span>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className={`text-xs uppercase tracking-wider ${darkMode ? 'bg-slate-700/50 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
            <tr>
              <th className="p-5 font-semibold">Tanggal</th>
              <th className="p-5 font-semibold">Keterangan</th>
              <th className="p-5 font-semibold">Kategori</th>
              <th className="p-5 font-semibold text-right">Jumlah</th>
              <th className="p-5 font-semibold text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${darkMode ? 'divide-slate-700' : 'divide-slate-100'}`}>
            {currentItems.length > 0 ? (
              currentItems.map((t) => {
                 const dateSrc = t.date || t.created_at || t.CreatedAt;
                 let validDate = '-';
                 if (dateSrc) {
                    const d = new Date(dateSrc);
                    if(!isNaN(d.getTime())) validDate = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
                 }
                 
                 return (
                <tr key={t.ID} className={`transition duration-150 ${editId === t.ID ? (darkMode ? 'bg-yellow-900/20' : 'bg-yellow-50') : (darkMode ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50')}`}>
                  <td className={`p-5 text-sm whitespace-nowrap ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{validDate}</td>
                  <td className={`p-5 font-medium ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{t.description}</td>
                  <td className="p-5">
                    <span className={`inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full font-medium ${darkMode ? 'bg-slate-700 text-slate-300 border border-slate-600' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
                        <span>{getCategoryEmoji(t.category)}</span>
                        {t.category}
                    </span>
                  </td>
                  <td className={`p-5 text-right font-bold whitespace-nowrap ${t.type === 'Pemasukan' ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {t.type === 'Pemasukan' ? '+ ' : '- '}Rp {t.amount.toLocaleString('id-ID')}
                  </td>

                  <td className="p-5 text-center">
                    <div className="flex justify-center items-center gap-3">
                      
                      {/* TOMBOL EDIT */}
                      <button 
                          onClick={() => onEdit(t)} 
                          className={`group p-2.5 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 ${
                              darkMode 
                              ? 'bg-blue-900/30 text-blue-400 hover:bg-blue-800/50 border border-blue-800' 
                              : 'bg-white text-blue-600 hover:bg-blue-50 border border-slate-200'
                          }`} 
                          title="Edit Transaksi"
                      >
                          {/* Ikon Pensil SVG */}
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 group-hover:scale-110 transition-transform">
                              <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32L19.513 8.2Z" />
                          </svg>
                      </button>

                      {/* TOMBOL DELETE */}
                      <button 
                          onClick={() => initiateDelete(t.ID)} 
                          className={`group p-2.5 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 ${
                              darkMode 
                              ? 'bg-red-900/30 text-red-400 hover:bg-red-800/50 border border-red-800' 
                              : 'bg-white text-red-600 hover:bg-red-50 border border-slate-200'
                          }`} 
                          title="Hapus Transaksi"
                      >
                          {/* Ikon Sampah SVG */}
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 group-hover:scale-110 transition-transform">
                              <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.498 1.45 47.653 47.653 0 0 0-7.612-1.298v-.578a2.25 2.25 0 0 0-2.25-2.25h-1.5a2.25 2.25 0 0 0-2.25 2.25v.578a47.6 47.6 0 0 0-7.612 1.298.75.75 0 1 1-.498-1.45 48.805 48.805 0 0 1 3.878-.512V4.478a3.75 3.75 0 0 1 3.75-3.75h1.5a3.75 3.75 0 0 1 3.75 3.75ZM4.5 9.75a.75.75 0 0 1 .75-.75h13.5a.75.75 0 0 1 .75.75v10.138c0 .52-.424.939-.944.939H5.444A.939.939 0 0 1 4.5 19.888V9.75Z" clipRule="evenodd" />
                          </svg>
                      </button>

                    </div>
                  </td>
                </tr>
              )})
            ) : (
              <tr>
                <td colSpan="5" className="p-10">
                  {/* Bungkus konten dengan div agar colSpan td tetap jalan */}
                  <div className="flex flex-col items-center justify-center gap-2 text-center text-slate-400 italic">
                    <span className="text-3xl grayscale">📭</span>
                    <p>Belum ada transaksi di halaman ini.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* FOOTER PAGINATION */}
      {transactions.length > itemsPerPage && (
        <div className={`p-4 border-t flex justify-between items-center ${darkMode ? 'border-slate-700 bg-slate-800/50' : 'border-slate-100 bg-white'}`}>
          <button onClick={prevPage} disabled={currentPage === 1} className={`px-4 py-2 rounded-xl text-sm font-medium transition ${currentPage === 1 ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-700 text-slate-400' : 'hover:bg-blue-100 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400'}`}>← Sebelumnya</button>
          <span className={`text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Halaman {currentPage} / {totalPages}</span>
          <button onClick={nextPage} disabled={currentPage === totalPages} className={`px-4 py-2 rounded-xl text-sm font-medium transition ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-700 text-slate-400' : 'hover:bg-blue-100 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400'}`}>Selanjutnya →</button>
        </div>
      )}


      {/* MODAL KONFIRMASI DELETE YANG CANTIK */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
            {/* Backdrop Gelap dengan Blur */}
            <div 
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
                onClick={cancelDelete}
            ></div>

            {/* Konten Modal */}
            <div className={`relative w-full max-w-sm transform overflow-hidden rounded-2xl p-6 text-left align-middle shadow-2xl transition-all scale-100 ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
                
                {/* Ikon Peringatan */}
                <div className="flex justify-center mb-5">
                    <div className="p-4 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </div>
                </div>

                {/* Teks Konfirmasi */}
                <h3 className={`text-xl font-bold text-center mb-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                    Hapus Transaksi?
                </h3>
                <p className={`text-sm text-center mb-6 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Tindakan ini tidak dapat dibatalkan. Data transaksi akan hilang selamanya dari catatanmu.
                </p>

                {/* Tombol Aksi */}
                <div className="flex gap-3">
                    <button
                        onClick={cancelDelete}
                        className={`flex-1 px-4 py-2.5 rounded-xl font-semibold transition ${darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                        Batal
                    </button>
                    <button
                        onClick={confirmDelete}
                        className="flex-1 px-4 py-2.5 rounded-xl font-semibold bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-500/30 transition transform active:scale-95"
                    >
                        Ya, Hapus
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}