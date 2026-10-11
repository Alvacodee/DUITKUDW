import { Link } from 'react-router-dom';

// --- KOMPONEN WRAPPER (Template Layout) ---
const LegalLayout = ({ title, lastUpdated, children }) => (
  <div className="px-4 py-10 sm:px-6 animate-fade-in">
    <article className="mx-auto max-w-4xl rounded-2xl border bg-card p-8 text-muted-foreground shadow-sm md:p-12">
      <Link to="/" className="mb-8 inline-block text-sm font-medium text-primary hover:underline">← Kembali</Link>

      <header className="mb-8 border-b pb-6">
        <h1 className="mb-3 text-3xl font-bold text-foreground md:text-4xl">{title}</h1>
        <p className="text-sm">Terakhir diperbarui: {lastUpdated}</p>
      </header>

      <div className="space-y-8 leading-relaxed">
        {children}
      </div>
    </article>
  </div>
);

const Heading = ({ children }) => <h3 className="mb-3 text-xl font-bold text-foreground">{children}</h3>;

// --- 1. HALAMAN SYARAT LAYANAN (TERMS OF SERVICE) ---
export const TermsPage = () => (
  <LegalLayout title="Syarat & Ketentuan Layanan" lastUpdated="7 Februari 2026">
    <section>
      <Heading>1. Penerimaan Syarat</Heading>
      <p>
        Selamat datang di <strong className="text-foreground">DuitKuDW</strong>. Dengan mengakses, mendaftar, atau menggunakan platform ini, Anda menyetujui untuk terikat oleh Syarat dan Ketentuan ini. 
        Jika Anda tidak setuju dengan bagian mana pun dari syarat ini, Anda dilarang menggunakan layanan kami.
      </p>
    </section>

    <section>
      <Heading>2. Sifat Layanan (Disclaimer)</Heading>
      <p className="mb-4">
        DuitKuDW adalah aplikasi manajemen keuangan pribadi yang dilengkapi dengan fitur kecerdasan buatan (AI). Harap diperhatikan bahwa:
      </p>
      <ul className="list-disc pl-5 space-y-2">
        <li><strong className="text-foreground">Bukan Penasihat Keuangan:</strong> Informasi dan prediksi yang dihasilkan oleh fitur "AI Forecast" hanya bersifat estimasi berdasarkan data historis. Hasil ini tidak boleh dianggap sebagai saran investasi profesional.</li>
        <li><strong className="text-foreground">Tujuan Portofolio:</strong> Aplikasi ini dikembangkan sebagai proyek demonstrasi teknologi (Portofolio). Meskipun fungsional, mungkin terdapat bug atau ketidakakuratan data sewaktu-waktu.</li>
      </ul>
    </section>

    <section>
      <Heading>3. Akun Pengguna & Keamanan</Heading>
      <p>
        Anda bertanggung jawab penuh untuk menjaga kerahasiaan kata sandi dan akun Anda. DuitKuDW tidak bertanggung jawab atas kerugian atau kerusakan yang timbul dari kegagalan Anda dalam menjaga keamanan akun. Kami berhak menangguhkan akun yang terindikasi melakukan aktivitas mencurigakan.
      </p>
    </section>

    <section>
      <Heading>4. Hak Kekayaan Intelektual</Heading>
      <p>
        Seluruh kode sumber, desain antarmuka, logo, dan algoritma AI yang digunakan dalam aplikasi ini adalah hak kekayaan intelektual milik pengembang (Zahran Alvan), kecuali komponen pihak ketiga (library/framework) yang digunakan sesuai lisensinya masing-masing.
      </p>
    </section>
  </LegalLayout>
);

// --- 2. HALAMAN KEBIJAKAN PRIVASI (PRIVACY POLICY) ---
export const PrivacyPage = () => (
  <LegalLayout title="Kebijakan Privasi" lastUpdated="11 Oktober 2026">
    <section>
      <Heading>1. Informasi yang Kami Kumpulkan</Heading>
      <ul className="list-disc pl-5 space-y-2">
        <li><strong className="text-foreground">Data Akun:</strong> username, alamat email, dan password (disimpan sebagai hash bcrypt, bukan teks asli). Jika Anda masuk dengan Google, kami menerima alamat email dan nama dari akun Google Anda untuk membuat username.</li>
        <li><strong className="text-foreground">Data Transaksi:</strong> catatan pemasukan dan pengeluaran yang Anda input ke dalam database kami.</li>
        <li><strong className="text-foreground">Data Lokal di Browser:</strong> profil (nama lengkap, bio, foto), batas anggaran, dan target tabungan disimpan di <em>Local Storage</em> browser Anda — tidak dikirim ke server — dan dipisahkan per akun.</li>
      </ul>
    </section>

    <section>
      <Heading>2. Penggunaan Data & AI</Heading>
      <p>
        Email dipakai untuk verifikasi akun dan pengiriman link reset password. Data transaksi diproses oleh algoritma <em>Machine Learning</em> (Python/Scikit-Learn/Statsmodels) semata-mata untuk menghasilkan prediksi keuangan pribadi Anda.
        Kami <strong className="text-foreground">tidak pernah</strong> menjual, menyewakan, atau membagikan data finansial Anda kepada pihak ketiga atau pengiklan.
      </p>
    </section>

    <section>
      <Heading>3. Penyimpanan & Keamanan</Heading>
      <p>
        Kami menerapkan standar keamanan teknis yang wajar, termasuk hash bcrypt untuk password, token sekali pakai yang disimpan dalam bentuk hash, pembatasan percobaan login, dan sesi yang otomatis dicabut setelah reset password. Namun, perlu diingat bahwa tidak ada metode transmisi data melalui internet yang 100% aman.
      </p>
    </section>
  </LegalLayout>
);

// --- 3. HALAMAN KEBIJAKAN PENGEMBALIAN (REFUND POLICY) ---
export const RefundPage = () => (
  <LegalLayout title="Kebijakan Pengembalian Dana" lastUpdated="7 Februari 2026">
    <section>
      <div className="mb-8 rounded-xl border border-primary/20 bg-primary/10 p-6">
        <p className="font-medium text-primary">Status Saat Ini: Layanan Gratis (Free Tier)</p>
      </div>
      
      <Heading>1. Layanan Bebas Biaya</Heading>
      <p className="mb-6">
        Saat ini, DuitKuDW dioperasikan sebagai layanan <strong className="text-foreground">Gratis (Free-to-Use)</strong> untuk tujuan demonstrasi dan portofolio. Tidak ada biaya berlangganan, biaya tersembunyi, atau pembelian dalam aplikasi (In-App Purchase) yang dikenakan kepada pengguna. Oleh karena itu, kebijakan pengembalian dana (refund) tidak berlaku karena tidak ada transaksi moneter yang terjadi.
      </p>
    </section>

    <section>
      <Heading>2. Ketentuan Masa Depan (Premium)</Heading>
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