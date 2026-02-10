import React from 'react';
import { Link } from 'react-router-dom';

// --- KOMPONEN WRAPPER (Template Layout) ---
const LegalLayout = ({ title, lastUpdated, darkMode, children }) => (
  <div className={`min-h-screen py-12 px-6 lg:px-8 transition-colors duration-300 ${darkMode ? 'bg-slate-900 text-slate-300' : 'bg-slate-50 text-slate-600'}`}>
    <div className={`max-w-4xl mx-auto rounded-2xl shadow-sm border p-8 md:p-12 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
      <Link to="/" className="text-blue-500 hover:underline mb-8 inline-block font-medium">← Kembali ke Dashboard</Link>
      
      <div className="border-b pb-6 mb-8 border-slate-200 dark:border-slate-700">
        <h1 className={`text-3xl md:text-4xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{title}</h1>
        <p className="text-sm opacity-60">Terakhir diperbarui: {lastUpdated}</p>
      </div>

      <div className="space-y-8 leading-relaxed text-justify">
        {children}
      </div>
    </div>
  </div>
);

// --- 1. HALAMAN SYARAT LAYANAN (TERMS OF SERVICE) ---
export const TermsPage = ({ darkMode }) => (
  <LegalLayout title="Syarat & Ketentuan Layanan" lastUpdated="7 Februari 2026" darkMode={darkMode}>
    <section>
      <h3 className={`text-xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-slate-800'}`}>1. Penerimaan Syarat</h3>
      <p>
        Selamat datang di <strong>DuitKuDW</strong>. Dengan mengakses, mendaftar, atau menggunakan platform ini, Anda menyetujui untuk terikat oleh Syarat dan Ketentuan ini. 
        Jika Anda tidak setuju dengan bagian mana pun dari syarat ini, Anda dilarang menggunakan layanan kami.
      </p>
    </section>

    <section>
      <h3 className={`text-xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-slate-800'}`}>2. Sifat Layanan (Disclaimer)</h3>
      <p className="mb-4">
        DuitKuDW adalah aplikasi manajemen keuangan pribadi yang dilengkapi dengan fitur kecerdasan buatan (AI). Harap diperhatikan bahwa:
      </p>
      <ul className="list-disc pl-5 space-y-2">
        <li><strong>Bukan Penasihat Keuangan:</strong> Informasi dan prediksi yang dihasilkan oleh fitur "AI Forecast" hanya bersifat estimasi berdasarkan data historis. Hasil ini tidak boleh dianggap sebagai saran investasi profesional.</li>
        <li><strong>Tujuan Portofolio:</strong> Aplikasi ini dikembangkan sebagai proyek demonstrasi teknologi (Portofolio). Meskipun fungsional, mungkin terdapat bug atau ketidakakuratan data sewaktu-waktu.</li>
      </ul>
    </section>

    <section>
      <h3 className={`text-xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-slate-800'}`}>3. Akun Pengguna & Keamanan</h3>
      <p>
        Anda bertanggung jawab penuh untuk menjaga kerahasiaan kata sandi dan akun Anda. DuitKuDW tidak bertanggung jawab atas kerugian atau kerusakan yang timbul dari kegagalan Anda dalam menjaga keamanan akun. Kami berhak menangguhkan akun yang terindikasi melakukan aktivitas mencurigakan.
      </p>
    </section>

    <section>
      <h3 className={`text-xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-slate-800'}`}>4. Hak Kekayaan Intelektual</h3>
      <p>
        Seluruh kode sumber, desain antarmuka, logo, dan algoritma AI yang digunakan dalam aplikasi ini adalah hak kekayaan intelektual milik pengembang (Zahran Alvan), kecuali komponen pihak ketiga (library/framework) yang digunakan sesuai lisensinya masing-masing.
      </p>
    </section>
  </LegalLayout>
);

// --- 2. HALAMAN KEBIJAKAN PRIVASI (PRIVACY POLICY) ---
export const PrivacyPage = ({ darkMode }) => (
  <LegalLayout title="Kebijakan Privasi" lastUpdated="7 Februari 2026" darkMode={darkMode}>
    <section>
      <h3 className={`text-xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-slate-800'}`}>1. Informasi yang Kami Kumpulkan</h3>
      <p className="mb-3">Kami mengumpulkan dua jenis informasi untuk memberikan layanan terbaik:</p>
      <ul className="list-disc pl-5 space-y-2">
        <li><strong>Data Akun:</strong> Username dan password (yang dienkripsi) untuk keperluan autentikasi.</li>
        <li><strong>Data Transaksi:</strong> Catatan pemasukan dan pengeluaran yang Anda input secara sukarela ke dalam sistem database kami.</li>
        <li><strong>Data Lokal (Profil):</strong> Informasi profil seperti Nama Lengkap, Bio, dan Foto disimpan secara lokal di <em>Local Storage</em> browser Anda demi privasi maksimal.</li>
      </ul>
    </section>

    <section>
      <h3 className={`text-xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-slate-800'}`}>2. Penggunaan Data & AI</h3>
      <p>
        Data transaksi Anda diproses oleh algoritma <em>Machine Learning</em> (Python/Scikit-Learn) semata-mata untuk menghasilkan fitur prediksi keuangan (Forecast) pribadi Anda. 
        Kami <strong>tidak pernah</strong> menjual, menyewakan, atau membagikan data finansial Anda kepada pihak ketiga atau pengiklan.
      </p>
    </section>

    <section>
      <h3 className={`text-xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-slate-800'}`}>3. Penyimpanan & Keamanan</h3>
      <p>
        Kami menerapkan standar keamanan teknis yang wajar, termasuk penggunaan enkripsi Hash (Bcrypt) untuk password dan arsitektur Docker yang terisolasi. Namun, perlu diingat bahwa tidak ada metode transmisi data melalui internet yang 100% aman.
      </p>
    </section>
  </LegalLayout>
);

// --- 3. HALAMAN KEBIJAKAN PENGEMBALIAN (REFUND POLICY) ---
export const RefundPage = ({ darkMode }) => (
  <LegalLayout title="Kebijakan Pengembalian Dana" lastUpdated="7 Februari 2026" darkMode={darkMode}>
    <section>
      <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-xl mb-8">
        <p className="font-medium text-blue-500">Status Saat Ini: Layanan Gratis (Free Tier)</p>
      </div>
      
      <h3 className={`text-xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-slate-800'}`}>1. Layanan Bebas Biaya</h3>
      <p className="mb-6">
        Saat ini, DuitKuDW dioperasikan sebagai layanan <strong>Gratis (Free-to-Use)</strong> untuk tujuan demonstrasi dan portofolio. Tidak ada biaya berlangganan, biaya tersembunyi, atau pembelian dalam aplikasi (In-App Purchase) yang dikenakan kepada pengguna. Oleh karena itu, kebijakan pengembalian dana (refund) tidak berlaku karena tidak ada transaksi moneter yang terjadi.
      </p>
    </section>

    <section>
      <h3 className={`text-xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-slate-800'}`}>2. Ketentuan Masa Depan (Premium)</h3>
      <p>
        Jika di masa mendatang DuitKuDW meluncurkan fitur berbayar (Premium), ketentuan berikut akan berlaku:
      </p>
      <ul className="list-disc pl-5 space-y-2 mt-3">
        <li>Pelanggan berhak mengajukan pengembalian dana penuh dalam waktu 7 hari setelah pembayaran pertama jika layanan tidak berfungsi sebagaimana mestinya (kendala teknis mayor).</li>
        <li>Permintaan refund dapat diajukan melalui halaman "Hubungi Support".</li>
        <li>Kami berhak menolak pengajuan refund jika ditemukan indikasi penyalahgunaan layanan.</li>
      </ul>
    </section>
  </LegalLayout>
);