import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer({ darkMode }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={`w-full py-10 border-t transition-colors duration-300 mt-auto ${
      darkMode 
        ? 'bg-slate-900 border-slate-800 text-slate-500'
        : 'bg-white border-slate-200 text-slate-500'
    }`}>
      
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 md:gap-0">

          {/* BAGIAN KIRI */}
          <div className="flex flex-col items-center md:items-start gap-1">
            <h3 className="font-bold text-sm tracking-widest uppercase mb-1">
              <span className="text-blue-500">DUITKUDW</span>
            </h3>
            <p className="text-xs opacity-80">
              &copy; {currentYear} Hak cipta dilindungi undang-undang.
            </p>
          </div>

          {/* BAGIAN KANAN: Ubah <a> menjadi <Link> */}
          <div className="flex flex-wrap justify-center md:justify-end items-center gap-x-8 gap-y-2 text-xs font-medium">
            
            <Link to="/terms" className="hover:text-blue-500 transition-colors duration-200">
              Syarat Layanan
            </Link>
            
            <Link to="/privacy" className="hover:text-blue-500 transition-colors duration-200">
              Kebijakan Privasi
            </Link>
            
            <Link to="/refund" className="hover:text-blue-500 transition-colors duration-200">
              Kebijakan Pengembalian
            </Link>
            
            <Link to="/contact" className="hover:text-blue-500 transition-colors duration-200">
              Hubungi Support
            </Link>
            
            <a href="mailto:duitkudw.official@gmail.com" className={`ml-2 transition-colors duration-200 hover:text-blue-500 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              duitkudw.official@gmail.com
            </a>
          </div>

        </div>
      </div>
    </footer> 
  );
}