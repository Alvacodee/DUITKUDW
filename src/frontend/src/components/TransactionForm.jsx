import { useState, useEffect } from 'react';

export default function TransactionForm({ onSubmit, initialData, isEditMode, onCancel, darkMode }) {
  // State awal form
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0], // Default hari ini (YYYY-MM-DD)
    description: '',
    amount: '',
    category: 'Makan',
    type: 'Pengeluaran'
  });

  // EFFECT: ISI FORM SAAT EDIT MODE
  useEffect(() => {
    if (initialData) {
      // Ambil tanggal dari DB
      let formattedDate = new Date().toISOString().split('T')[0];
      
      const dateSrc = initialData.date || initialData.created_at || initialData.CreatedAt;
      
      if (dateSrc) {
          const d = new Date(dateSrc);
          // Validasi tanggal
          if (!isNaN(d.getTime())) {
              formattedDate = d.toISOString().split('T')[0];
          }
      }

      setFormData({
        date: formattedDate,
        description: initialData.description,
        amount: initialData.amount,
        category: initialData.category,
        type: initialData.type
      });
    }
  }, [initialData]);

  // HANDLER SUBMIT
  const handleSubmit = (e) => {
    e.preventDefault();
    // Validasi sederhana
    if (!formData.description || !formData.amount) {
        return alert("Harap isi keterangan dan jumlah uang!");
    }
    
    onSubmit(formData);
    
    // Reset form jika mode tambah (bukan edit)
    if (!isEditMode) {
      setFormData({ 
        date: new Date().toISOString().split('T')[0],
        description: '', 
        amount: '', 
        category: 'Makan', 
        type: 'Pengeluaran' 
      }); 
    }
  };

  // Class CSS reusable untuk Input & Label
  const inputClass = `w-full p-3 rounded-xl border outline-none transition focus:ring-2 focus:ring-blue-500 ${
    darkMode 
      ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' 
      : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
  }`;
  
  const labelClass = `block text-sm font-semibold mb-2 flex items-center gap-2 ${
    darkMode ? 'text-slate-300' : 'text-slate-700'
  }`;

  return (
    <div className={`p-6 rounded-2xl shadow-lg border h-full ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
      
      {/* HEADER FORM */}
      <h3 className={`font-bold text-lg mb-6 flex items-center gap-2 ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}> 
        {isEditMode ? 'Edit Transaksi' : 'Tambah Transaksi'}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* BARIS 1: TANGGAL & TIPE */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Tanggal */}
            <div>
                <label className={labelClass}> Tanggal</label>
                <input 
                    type="date" 
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className={inputClass}
                />
            </div>

            {/* Tipe (Pemasukan/Pengeluaran) */}
            <div>
                <label className={labelClass}> Jenis</label>
                <select 
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className={inputClass}
                >
                    <option value="Pengeluaran"> Pengeluaran</option>
                    <option value="Pemasukan"> Pemasukan</option>
                </select>
            </div>
        </div>

        {/* BARIS 2: KETERANGAN */}
        <div>
          <label className={labelClass}> Keterangan</label>
          <input 
            type="text" 
            placeholder="Contoh: Nasi Padang, Bensin, Gaji..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className={inputClass}
          />
        </div>

        {/* BARIS 3: NOMINAL & KATEGORI */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Jumlah Uang */}
            <div>
                <label className={labelClass}> Nominal (Rp)</label>
                <input 
                    type="number" 
                    placeholder="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                    className={inputClass}
                    min="0"
                />
            </div>

            {/* Kategori */}
            <div>
                <label className={labelClass}> Kategori</label>
                <select 
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className={inputClass}
                >
                    <option value="Makan">🍔 Makan & Minum</option>
                    <option value="Transport">🚗 Transportasi</option>
                    <option value="Belanja">🛍️ Belanja</option>
                    <option value="Hiburan">🎬 Hiburan</option>
                    <option value="Tagihan">⚡ Tagihan & Utilitas</option>
                    <option value="Kesehatan">💊 Kesehatan</option>
                    <option value="Pendidikan">📚 Pendidikan</option>
                    <option value="Gaji">💰 Gaji / Pendapatan</option>
                    <option value="Lainnya">📂 Lainnya</option>
                </select>
            </div>
        </div>

        {/* TOMBOL AKSI */}
        <div className="flex gap-3 pt-4">
          <button 
            type="submit" 
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl font-bold transition shadow-md active:scale-95 flex justify-center items-center gap-2"
          >
            {isEditMode ? '💾 Simpan Perubahan' : '➕ Simpan'}
          </button>
          
          {isEditMode && (
            <button 
              type="button" 
              onClick={onCancel}
              className={`px-5 rounded-xl font-medium transition ${darkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
            >
              Batal
            </button>
          )}
        </div>

      </form>
    </div>
  );
}