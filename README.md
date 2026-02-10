# DuitKuDW - Personal Finance Tracker with Adaptive AI

![DUITKUDW Banner](./finance-tracker/frontend/src/assets/banner.png)

**DuitKuDW** adalah aplikasi pencatatan keuangan yang dirancang untuk membantu pengguna terutama mahasiswa mengelola keuangan pribadi. Aplikasi ini tidak hanya mencatat transaksi, tetapi juga dilengkapi dengan **AI Financial Consultant** yang mampu memprediksi pengeluaran bulan depan menggunakan algoritma *Machine Learning* yang adaptif.

---

## ✨ Fitur Utama

### 🚀 Core Features
* **Dashboard Interaktif:** Ringkasan saldo, pemasukan, dan pengeluaran dengan grafik visual.
* **Manajemen Transaksi:** CRUD (Create, Read, Update, Delete) transaksi harian.
* **Budgeting:** Atur batas pengeluaran per kategori (Makan, Transport, dll) dengan indikator warna peringatan.
* **Smart Tips:** Saran finansial dinamis berdasarkan kategori pengeluaran terbesar.
* **Profil Pengguna:** Kustomisasi data diri dan foto profil.

### 🤖 AI Intelligence (Hybrid Model)
Fitur unggulan proyek ini adalah sistem prediksi yang "berevolusi" sesuai jumlah data:
1.  **Fase Awal (< 60 Hari Data):** Menggunakan **Weighted Linear Regression**. Fokus pada tren jangka pendek (harian) dan memberikan bobot lebih pada transaksi terbaru (*recency bias*).
2.  **Fase Matang (>= 60 Hari Data):** Otomatis beralih ke **Holt-Winters Exponential Smoothing**. Mampu mendeteksi pola musiman (*seasonality*), seperti siklus gajian atau tagihan bulanan berulang.

---

## 🛠️ Tech Stack

### Frontend
* **Framework:** React.js (Vite)
* **Styling:** Tailwind CSS
* **Routing:** React Router DOM
* **Charts:** Recharts
* **Icons:** Heroicons

### Backend
* **Language:** Go (Golang)
* **Framework:** Gin Gonic
* **ORM:** GORM
* **Database:** PostgreSQL
* **Auth:** JWT (JSON Web Token)

### Artificial Intelligence
* **Language:** Python 3
* **Communication:** Go `os/exec` (Subprocess)
* **Libraries:**
    * `pandas` (Data Manipulation)
    * `scikit-learn` (Linear Regression)
    * `statsmodels` (Holt-Winters / Time Series Analysis)
    * `numpy` (Math)

---

## 📂 Struktur Proyek

```bash
finance-tracker/
├── backend/
│   ├── Dockerfile  
│   ├── config/         # Konfigurasi DB
│   ├── controllers/    # Logic Handler (Go)
│   ├── models/         # Struct Database (GORM)
│   ├── ml/             # Python AI Scripts
│   │   └── predict.py  # Script Hybrid AI
│   ├── main.go         # Entry Point
│   └── ...
└── frontend/
    ├── src/
    │   ├── Dockerfile
    │   ├── components/ # Reusable UI Components
    │   ├── pages/      # Halaman Utama
    │   ├── App.jsx     # Main Router & Language Logic
    │   └── ...
```