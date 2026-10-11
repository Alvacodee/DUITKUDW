# Fase 2 — Refactor, Hardening Infra, Test & CI

> **Tanggal:** 11 Oktober 2026
> **Tujuan:** merapikan struktur kode (duplikasi, *god component*, config tersebar), menutup sisa bug P2, mengeraskan konfigurasi Docker/nginx, dan memasang test + CI agar regresi tertangkap otomatis.
> **Referensi:** [audit-report.md](./audit-report.md) §8 Fase 2 · sebelumnya: [fase-1](./fase-1-keamanan-dan-akurasi.md)

## Ringkasan perubahan

### Backend

| ID | Perbaikan |
|---|---|
| CS-05 · BUG-09 | `config/app.go`: semua konfigurasi dibaca sekali ke `config.App`. Di mode production (`GIN_MODE=release`), `FRONTEND_URL` **wajib** diisi (fail-fast); di development memakai default `http://localhost:5173` dengan peringatan. CORS, redirect Google, dan link email memakai nilai yang sama. |
| BUG-08 | Path `ml/predict.py` dicari di direktori kerja lalu di samping executable, dan bisa di-override dengan `ML_SCRIPT` / `PYTHON_BIN`. Timeout dan konkurensi bisa diatur lewat `PREDICT_TIMEOUT_SECONDS` / `PREDICT_MAX_CONCURRENCY`. |
| BUG-21 | DSN dibangun sebagai URL (`url.URL`), bukan `key=value`, sehingga password kosong atau berisi spasi/karakter khusus tidak merusak parsing. `DB_SSLMODE` dapat diatur. |
| CS-03 | Register/Login dipindah ke `handlers/auth.go`. Konvensinya: `handlers/` untuk semua alur autentikasi, `controllers/` untuk resource (transaksi, prediksi). |
| INC-02 | Konstanta `models.TypeIncome` / `TypeExpense`. Saat startup, data lama `expense`/`income` (huruf apa pun) dinormalisasi secara idempoten. Query AI hanya memakai nilai baku. |
| CS-12 *(sebagian)* | Index komposit `(user_id, date)` pada `transactions`. |
| CS-06 · BUG-19 | `predict.py` dipecah menjadi fungsi kecil (`load_daily_expenses`, `predict_linear`, `predict_holt_winters`, `predict`, `main`). Exception spesifik, exit code 1 saat error, tren `flat` untuk kemiringan nol, nilai negatif di-clip ke 0 (bukan angka arbitrer), dan penjumlahan tervektorisasi. |
| SEC-12 | CORS tanpa `Allow-Credentials` (auth memakai header, bukan cookie) dan allow-headers diperketat; header `X-Content-Type-Options`; `TRUSTED_PROXIES` dapat dikonfigurasi (`none` / daftar CIDR); database zona waktu di-embed (`time/tzdata`). |
| — | `gofmt` diterapkan ke seluruh backend. |

### Frontend

| ID | Perbaikan |
|---|---|
| CS-01 | Modul bersama: `lib/format.js`, `lib/date.js`, `lib/transactions.js` (tipe, ringkasan, filter bulan, `pctChange`, pengeluaran per kategori, urutan), `lib/csv.js`, `lib/insights.js`, `lib/storage.js`, `constants/categories.js`. Folder `utils/` digabung ke `lib/`. Tujuh salinan `formatRp`, empat salinan metadata kategori, dan dua implementasi ekspor CSV dihapus. |
| CS-02 | `App.jsx` turun dari ±430 menjadi ±190 baris dan hanya berisi auth, layout, dan routing. Data diurus `hooks/useTransactions` dan `hooks/usePrediction`; panggilan API lewat `api/client.js` (`apiRequest` + `ApiError`). Halaman diekstrak menjadi `DashboardPage`, `TransactionsPage` (state edit kini lokal di halaman), `BudgetPage`, `ForecastPage`. |
| BUG-11 | `SettingsPage` memakai `ThemeProvider` (tidak lagi punya state tema sendiri yang default-nya `dark`). |
| BUG-14 · INC-11 | Dashboard: kartu saldo menampilkan **arus kas bulan ini** (bukan metrik "dari pemasukan" yang tidak bermakna). Komponen `ChangeIndicator` dipakai bersama Dashboard & Laporan; warna mengikuti makna (pemasukan turun = merah, pengeluaran turun = hijau). Bila bulan lalu kosong, tampil "Belum ada data bulan lalu" alih-alih 0% (Laporan) atau 100% (Dashboard). |
| BUG-17 | Seluruh parsing tanggal memakai `parseDateKey` / `parseTxDate` (tanggal lokal), termasuk Laporan dan deadline Target. |
| INC-04 | Lupa/Reset Password, Verifikasi Email, Legal, dan Kontak dimigrasikan ke design token + komponen UI (`AuthCard`); prop `darkMode` dihapus dari seluruh aplikasi. |
| SEC-13 *(lebih awal dari jadwal)* | `lib/csv.js` menetralkan formula spreadsheet (`= + - @`), meng-quote semua sel, memakai tanggal ISO dan BOM UTF-8. |
| SEC-14 *(lebih awal dari jadwal)* | Anggaran dan target tabungan disimpan per user (`budgets_<user>`, `goals_<user>`). Data global versi lama dipindahkan sekali ke user pertama yang membukanya, lalu key lama dihapus. |
| INC-09 *(lebih awal dari jadwal)* | Opsi mata uang yang tidak berfungsi dihapus; versi aplikasi diambil dari `package.json` (`__APP_VERSION__`). |
| INC-10 *(lebih awal dari jadwal)* | Kebijakan Privasi diperbarui: menyebut email, data Google, dan data lokal per akun. |
| CS-07 | ESLint: `eslint-plugin-react` (`jsx-uses-vars`) menggantikan `varsIgnorePattern: '^[A-Z_]'` yang menyembunyikan import tak terpakai. Pola `set-state-in-effect` diperbaiki (data transaksi dikunci ke token pemiliknya). **Lint 0 error.** |
| CS-10 *(lebih awal dari jadwal)* | Dependensi tak terpakai dihapus: `@radix-ui/react-dropdown-menu`, `@radix-ui/react-scroll-area`, `autoprefixer`, `postcss`. |
| Dependensi | `npm audit fix`: 8 kerentanan *high* pada dependensi produksi (react-router, vite, rollup, postcss, dll) ditambal tanpa breaking change; vitest dinaikkan ke v4. **`npm audit`: 0 kerentanan.** |

### Infrastruktur (SEC-12, INC-05)

| File | Perubahan |
|---|---|
| `src/backend/Dockerfile` | Multi-stage: binary Go statis → runtime `python:3.13-slim`. `uv` di-pin `0.9.10`, `GIN_MODE=release`, **user non-root** (uid 10001). Image tidak lagi membawa toolchain Go. |
| `src/frontend/nginx.conf` + `nginx-security-headers.conf` | CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `server_tokens off`; aset ber-hash di-cache 1 tahun, `index.html` `no-cache`. |
| `docker-compose.yml` | Port Postgres hanya terikat ke `127.0.0.1`; `GIN_MODE=release`, `TRUSTED_PROXIES=none`, `DB_SSLMODE`; `ALLOW_ORIGIN` (tidak pernah dibaca) dan kunci `version` yang usang dihapus. |
| `.env.example` | Ditulis ulang dengan placeholder dan penjelasan setiap variabel. Versi lama yang dihapus di `e0be93a` sudah diperiksa: isinya placeholder, bukan kredensial asli. |
| `.github/workflows/ci.yml` | Job **backend** (gofmt, vet, unit + integration test dengan service PostgreSQL, unit test Python via uv), **frontend** (lint, test, build), **docker** (build kedua image + `nginx -t`). |

## Test yang ditambahkan

| Lokasi | Isi |
|---|---|
| `config/database_test.go` | DSN dari field (password berkarakter khusus), password kosong (BUG-21), `TimeZone` tidak ter-encode, prioritas `DATABASE_URL` |
| `ml/test_predict.py` | 12 test: pengisian hari kosong, tipe lama, tanggal tidak valid, tren naik/turun/flat, clip negatif, Holt-Winters, exit code |
| `src/frontend/src/lib/lib.test.js` | 22 test: format rupiah bertanda, kebijakan password (sama dengan backend), tanggal lokal, filter bulan lintas tahun, `pctChange`, CSV injection, storage per user & migrasi data lama |

## Verifikasi

| Uji | Hasil |
|---|:-:|
| `gofmt`, `go vet`, `go test ./...` (termasuk integration test PostgreSQL) | ✅ |
| `python -m unittest` (predict.py) | ✅ 12/12 |
| `eslint .` · `vitest run` · `vite build` | ✅ 0 error · 22/22 · ✅ |
| `docker build` backend & frontend, `nginx -t`, cek header via `curl` | ✅ |
| Backend di **container** berjalan sebagai `uid=10001(app)` | ✅ |
| Smoke test E2E 32 skenario terhadap **backend di container** (termasuk prediksi Python di image baru) | ✅ 32/32 |
| Normalisasi `expense`/`INCOME` → `Pengeluaran`/`Pemasukan` setelah restart | ✅ |
| Smoke test UI di browser (login, dashboard dengan saldo negatif, transaksi, laporan, anggaran, forecast, pengaturan, toggle tema, privasi, lupa/reset password) | ✅ |
| `npm audit` | ✅ 0 kerentanan |

### Bug yang ditemukan oleh verifikasi fase ini

Pengujian image Docker menemukan bug dari perubahan fase ini sendiri: DSN baru meng-encode `TimeZone=Asia/Jakarta` menjadi `Asia%2FJakarta`, sedangkan driver GORM membaca nilai itu dari DSN mentah memakai regex, sehingga backend gagal start. Bug ini diperbaiki sebelum commit dan dikunci dengan unit test.

## Catatan

- **Trusted proxy di Koyeb:** bila `TRUSTED_PROXIES` kosong, header `X-Forwarded-For` dipercaya dari mana pun (perilaku default Gin) dan backend mencetak peringatan. Akibatnya rate limit *per IP* bisa diakali dengan memalsukan header, sementara rate limit *per akun/user* dari Fase 1 tetap berlaku. Isi `TRUSTED_PROXIES` dengan rentang IP proxy platform bila diketahui.
- **Deploy:** `GIN_MODE=release` sekarang di-set di image backend, jadi `FRONTEND_URL` wajib ada di environment deploy (sudah dipakai di Koyeb sebelumnya).
- **CSP** mengizinkan `connect-src https:` (backend production & Formspree) dan `http://localhost:*` (backend lokal di port mana pun — diperbarui di [tindak lanjut](./tindakan-manual.md)).
