# DuitKuDW - Personal Finance Tracker with Adaptive AI

![DUITKUDW Banner](./src/frontend/src/assets/banner.png)

**DuitKuDW** adalah aplikasi pencatatan keuangan yang dirancang untuk membantu pengguna, terutama mahasiswa, mengelola keuangan pribadi. Selain mencatat transaksi, aplikasi ini dilengkapi **AI Financial Consultant** yang memprediksi pengeluaran 30 hari ke depan dengan model *Machine Learning* adaptif.

---

## Fitur Utama

### Core Features
* **Dashboard Interaktif:** saldo, pemasukan, pengeluaran, arus kas bulan ini, dan grafik tren harian/bulanan.
* **Manajemen Transaksi:** tambah, ubah, hapus, cari, filter, urutkan, dan ekspor CSV.
* **Anggaran:** batas pengeluaran bulanan per kategori dengan indikator warna peringatan.
* **Laporan Keuangan:** ringkasan 6 bulan, perbandingan dengan bulan lalu, dan kategori terbesar.
* **Target Tabungan:** target dengan deadline dan progres.
* **Smart Tips:** saran berdasarkan kategori pengeluaran terbesar.
* **Akun:** registrasi dengan verifikasi email, login Google, lupa/reset password, profil, serta tema terang/gelap.

> Anggaran, target tabungan, dan profil disimpan di *localStorage* browser (terpisah per akun), tidak di server.

### AI Intelligence (Hybrid Model)
Sistem prediksi yang "berevolusi" sesuai jumlah data:
1. **Fase Awal (< 60 hari data):** **Weighted Linear Regression**, dengan bobot lebih besar pada transaksi terbaru (*recency bias*).
2. **Fase Matang (≥ 60 hari data):** **Holt-Winters Exponential Smoothing** dengan musiman 30 hari, sehingga bisa membaca pola seperti siklus gajian atau tagihan bulanan. Bila model gagal di-fit, prediksi kembali ke rata-rata harian.

---

## Tech Stack

| Bagian | Teknologi |
|---|---|
| **Frontend** | React 19 (Vite 7), Tailwind CSS v4, komponen Radix UI (pola shadcn/ui), React Router 7, Recharts, lucide-react, sonner |
| **Backend** | Go 1.25, Gin, GORM, PostgreSQL, JWT (HS256), Google OAuth2, gomail |
| **AI / ML** | Python 3.13 (dikelola `uv`), pandas, numpy, scikit-learn, statsmodels — dipanggil dari Go lewat `os/exec` |
| **Infra** | Docker (backend multi-stage non-root, frontend nginx), docker-compose, GitHub Actions CI |

### Keamanan
* Password di-hash dengan bcrypt; kebijakan password yang sama di frontend dan backend.
* JWT dengan versi token: reset password mencabut semua sesi lama.
* Login Google memakai `state` acak dan kode login sekali pakai; JWT tidak pernah muncul di URL.
* Token sekali pakai (reset, verifikasi, login) disimpan sebagai hash SHA-256.
* Rate limiting per IP, per akun, dan per user; batas proses AI yang berjalan bersamaan.
* Security header (CSP dan lainnya) di nginx; ekspor CSV aman dari formula injection.

Detail audit dan perbaikannya ada di [`docs/`](./docs/README.md).

---

## Menjalankan Aplikasi

### Dengan Docker (paling mudah)

```bash
cp .env.example .env     # lalu isi nilainya (minimal JWT_SECRET & POSTGRES_PASSWORD)
docker compose up --build
```

* Frontend: http://localhost:5173
* Backend: http://localhost:8080

### Tanpa Docker (development)

**Backend** (butuh Go 1.25, [uv](https://docs.astral.sh/uv/), PostgreSQL):

```bash
cd src/backend
uv sync                  # virtualenv Python untuk ML di src/backend/.venv
export JWT_SECRET=$(openssl rand -hex 32) DB_PASSWORD=... FRONTEND_URL=http://localhost:5173
go run .
```

**Frontend** (butuh Node 20+):

```bash
cd src/frontend
npm install
VITE_API_URL=http://localhost:8080 npm run dev
```

Daftar lengkap environment variable ada di [`.env.example`](./.env.example).

### Test

```bash
# Backend (integration test butuh PostgreSQL; tanpa TEST_DATABASE_URL test tsb di-skip)
cd src/backend
TEST_DATABASE_URL=postgres://user:pass@localhost:5432/test_db?sslmode=disable go test ./...
uv run python -m unittest discover -s ml

# Frontend
cd src/frontend
npm run lint && npm test && npm run build
```

Semua test di atas juga dijalankan otomatis oleh GitHub Actions ([`.github/workflows/ci.yml`](./.github/workflows/ci.yml)).

---

## Struktur Proyek

```text
.
├── docker-compose.yml
├── .env.example
├── docs/                      # Laporan audit & dokumentasi perbaikan per fase
└── src/
    ├── backend/
    │   ├── main.go            # Entry point: config, router, rate limit
    │   ├── auth/              # Penerbitan/validasi JWT, kebijakan password
    │   ├── config/            # Konfigurasi env (app.go) & koneksi/migrasi DB
    │   ├── controllers/       # Transaksi & prediksi AI
    │   ├── handlers/          # Register, login, Google OAuth, verifikasi email, reset password
    │   ├── middleware/        # RequireAuth, rate limiter
    │   ├── models/            # Model GORM
    │   ├── ml/predict.py      # Model AI hybrid (+ test_predict.py)
    │   └── Dockerfile
    └── frontend/
        ├── src/
        │   ├── App.jsx        # Auth, layout, routing
        │   ├── api/           # Klien HTTP ke backend
        │   ├── hooks/         # useTransactions, usePrediction
        │   ├── pages/         # Halaman (Dashboard, Transaksi, Laporan, dst)
        │   ├── components/    # Komponen fitur & ui/ (Radix/shadcn)
        │   ├── lib/           # Format, tanggal, transaksi, CSV, storage (+ test)
        │   ├── constants/     # Metadata kategori
        │   └── theme/         # ThemeProvider (terang/gelap)
        ├── nginx.conf
        └── Dockerfile
```
