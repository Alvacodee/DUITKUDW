import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function AIExplainer({ darkMode }) {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  // DATA FAQ (Tanpa Ikon)
  const faqData = [
    {
      question: "Kenapa saya harus menggunakan DUITKUDW daripada aplikasi lainnya?",
      answer: "DUITKUDW dirancang dengan filosofi 'No-Nonsense'. Berbeda dengan aplikasi lain yang penuh iklan atau fitur rumit, kami fokus pada kecepatan, privasi, dan kecerdasan. Fitur AI kami belajar dari pola pengeluaranmu untuk mencegah kebocoran anggaran sebelum terjadi."
    },
    {
      question: "Apakah data diri dan keuangan saya aman?",
      answer: "Keamanan adalah prioritas. (1) Password dienkripsi satu arah (Bcrypt). (2) Data Profil disimpan LOKAL di browser Anda (Local Storage), bukan di server kami. (3) Arsitektur Docker yang terisolasi mencegah akses tidak sah."
    },
    {
      question: "Bagaimana cara kerja model AI ini?",
      answer: "Kami menggunakan pendekatan Hybrid. Saat data sedikit (< 60 hari), sistem menggunakan 'Weighted Linear Regression' untuk membaca tren pendek. Saat data cukup, sistem otomatis beralih ke 'Holt-Winters Exponential Smoothing' untuk mendeteksi pola musiman."
    },
    {
      question: "Cara kerja Weighted Linear Regression",
      answer: "Algoritma ini menarik garis tren pengeluaran, tetapi memberikan 'bobot' lebih besar pada data terbaru. Artinya, pengeluaran minggu lalu dianggap lebih relevan untuk prediksi daripada pengeluaran 3 bulan lalu, membuat sistem lebih responsif terhadap perubahan gaya hidup."
    },
    {
      question: "Cara Kerja Holt-Winters",
      answer: "Algoritma ini memecah data menjadi 3 komponen: Level (rata-rata), Trend (naik/turun), dan Seasonality (pola berulang). Ia bisa memprediksi siklus bulanan, seperti tagihan rutin atau kebiasaan belanja akhir pekan, dengan sangat akurat."
    },
    {
      question: "Kenapa tidak menggunakan algoritma ARIMA",
      answer: "ARIMA membutuhkan data yang 'stasioner' (stabil). Data keuangan pribadi manusia sangat fluktuatif dan tidak stabil. Holt-Winters jauh lebih tangguh (robust) dalam menangani data yang bergejolak dan memiliki pola musiman kuat seperti gaji bulanan."
    },
    {
      question: "Kenapa tidak menggunakan algoritma LSTM?",
      answer: "Prinsip efisiensi. LSTM (Deep Learning) butuh ribuan data agar akurat. Untuk data keuangan personal yang jumlahnya ratusan, LSTM akan mengalami 'Overfitting' (menghafal data). Menggunakan metode statistik seperti Holt-Winters di sini lebih cepat, ringan, dan justru lebih akurat untuk skala data kecil-menengah."
    }
  ];

  return (
    <div className="w-full max-w-3xl mx-auto mt-6">
      
      {/* Container FAQ */}
      <div className="flex flex-col gap-4">
        {faqData.map((item, index) => {
          const isOpen = openIndex === index;
          
          return (
            <div 
              key={index}
              className={`rounded-lg border transition-all duration-200 overflow-hidden ${
                darkMode 
                  ? 'bg-slate-800 border-slate-700' 
                  : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <button
                onClick={() => toggleAccordion(index)}
                className="w-full flex items-center justify-between p-5 text-left focus:outline-none"
              >
                <span className={`font-semibold text-sm md:text-base ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                  {item.question}
                </span>
                
                {/* Ikon Chevron */}
                <div className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                  {isOpen ? (
                    <ChevronUp size={20} className={darkMode ? 'text-slate-400' : 'text-slate-500'} />
                  ) : (
                    <ChevronDown size={20} className={darkMode ? 'text-slate-400' : 'text-slate-500'} />
                  )}
                </div>
              </button>

              {/* Konten Jawaban (Animasi Slide) */}
              <div 
                className={`transition-all duration-300 ease-in-out ${
                  isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className={`px-5 pb-5 text-sm leading-relaxed border-t ${
                  darkMode 
                    ? 'text-slate-400 border-slate-700' 
                    : 'text-slate-600 border-slate-100'
                }`}>
                  <div className="pt-4">
                    {item.answer}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
    </div>
  );
}