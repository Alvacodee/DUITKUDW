import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function ContactPage({ darkMode }) {
  const FORMSPREE_ID = "xvzbokrq"; 

  const [state, setState] = useState({
    submitting: false,
    succeeded: false,
    error: null
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setState({ ...state, submitting: true });

    const formData = new FormData(e.target);
    
    try {
      const response = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        setState({ submitting: false, succeeded: true, error: null });
        e.target.reset(); // Kosongkan form
      } else {
        const data = await response.json();
        throw new Error(data.error || "Gagal mengirim pesan.");
      }
    } catch (err) {
      setState({ submitting: false, succeeded: false, error: err.message });
    }
  };

  return (
    <div className={`min-h-screen py-12 px-6 lg:px-8 flex items-center justify-center transition-colors duration-300 ${darkMode ? 'bg-slate-900 text-slate-300' : 'bg-slate-50 text-slate-600'}`}>
      <div className={`w-full max-w-lg rounded-2xl shadow-lg border p-8 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        
        <Link to="/" className="text-blue-500 hover:underline mb-6 inline-block">← Kembali ke Dashboard</Link>
        
        <h1 className={`text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Hubungi Support</h1>
        <p className="mb-8 opacity-70">Punya pertanyaan atau masukan? Kirim pesan kepada kami.</p>

        {state.succeeded ? (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 p-6 rounded-xl text-center animate-fade-in">
            <span className="text-4xl block mb-2">✅</span>
            <h3 className="font-bold text-lg">Pesan Terkirim!</h3>
            <p className="text-sm mt-1">Silakan cek email Anda dalam 1x24 jam untuk balasan dari tim kami.</p>
            <button onClick={() => setState({ ...state, succeeded: false })} className="mt-4 text-sm underline hover:text-emerald-400">Kirim pesan lagi</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Tampilkan Error jika gagal */}
            {state.error && (
              <div className="bg-red-500/10 text-red-500 p-3 rounded-lg text-sm text-center">
                {state.error}
              </div>
            )}

            <div>
              <label className="block text-sm font-bold mb-2">Nama Lengkap</label>
              <input 
                type="text" 
                name="name" // Name wajib ada untuk Formspree
                required 
                className={`w-full p-3 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} 
                placeholder="Masukkan nama Anda" 
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">Email</label>
              <input 
                type="email" 
                name="email" // Name wajib ada untuk Formspree
                required 
                className={`w-full p-3 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} 
                placeholder="email@contoh.com" 
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">Pesan</label>
              <textarea 
                name="message" // Name wajib ada untuk Formspree
                required 
                rows="4" 
                className={`w-full p-3 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} 
                placeholder="Tulis pesan Anda di sini..."
              ></textarea>
            </div>
            
            <button 
              type="submit" 
              disabled={state.submitting}
              className={`w-full font-bold py-3 rounded-lg transition-all shadow-lg ${state.submitting ? 'bg-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:scale-95 text-white shadow-blue-500/30'}`}
            >
              {state.submitting ? 'Mengirim...' : 'Kirim Pesan'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}