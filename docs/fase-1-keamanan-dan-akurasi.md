# Fase 1 — Keamanan Auth & Akurasi Data

> **Tanggal:** 11 Oktober 2026
> **Tujuan:** menutup temuan P1 yang tersisa: pengambilalihan akun, brute force, manajemen sesi, kebijakan password, dan angka keuangan yang menyesatkan.
> **Referensi:** [audit-report.md](./audit-report.md) §8 Fase 1 · fase sebelumnya: [fase-0](./fase-0-perbaikan-kritis.md)

## Ringkasan perubahan

| ID | Masalah | Perbaikan |
|---|---|---|
| SEC-04 | Account pre-hijacking: penyerang mendaftar dengan email korban, lalu korban login Google dan masuk ke akun milik penyerang | Kolom `email_verified`. Saat login Google menemukan akun ber-password yang emailnya **belum** terverifikasi: email ditandai terverifikasi, password lama dinonaktifkan, semua sesi lama dicabut, dan user diberi tahu lewat toast. Ditambah alur **verifikasi email** setelah register. |
| SEC-06 | Tidak ada rate limiting; `/predict` bisa menghabiskan CPU | Rate limiter per IP (login, register, lupa/reset password, verifikasi email, tukar login code), per akun (login: 10/15 menit per username; lupa password: 3/jam per email), per user (`/predict`: 5/menit), dan batas konkurensi proses Python (`PREDICT_MAX_CONCURRENCY`, default 2 → 503 bila penuh) |
| SEC-09 · INC-03 | Kebijakan password hanya ditegakkan di frontend, dan aturan register berbeda dari reset | Satu kebijakan di backend (`auth.ValidatePassword`) untuk register **dan** reset: ≥8 karakter, huruf besar, huruf kecil, angka, simbol, maks 72 byte. Frontend memakai modul yang sama (`lib/passwordPolicy.js`) di form register dan reset. Username divalidasi 3–32 karakter `[A-Za-z0-9_.]`. |
| SEC-10 | JWT tidak bisa dicabut; reset password tidak mengakhiri sesi lama | Kolom `token_version` + claim `ver`. Reset password (dan pengamanan pre-hijacking) menaikkan versi sehingga semua JWT lama ditolak. `JWT_SECRET` < 32 karakter memunculkan peringatan saat startup. |
| SEC-11 | Reset token tersimpan plaintext di DB | Hanya hash SHA-256 yang disimpan (berlaku juga untuk token verifikasi email dan login code). Token 256-bit. |
| INC-01 | Login biasa dan Google menerbitkan JWT dengan claim & masa berlaku berbeda (7 hari vs 24 jam) | Satu penerbit `auth.IssueToken`: `sub` (string, sesuai RFC 7519), `username`, `ver`, `iat`, `exp` 7 hari. Token lama (tanpa `ver`, `sub` numerik) tetap diterima agar user tidak ter-logout massal. |
| BUG-03 | Saldo negatif tampil positif (`Math.abs`) | `lib/format.js` (`formatRupiah` mempertahankan tanda minus, `formatRupiahSigned` untuk selisih) dipakai di Dashboard dan Laporan |
| BUG-06 | Tren `flat` / gagal tampil sebagai "turun" hijau | `PredictionCard` memakai field `trend` eksplisit dengan tampilan netral untuk flat, data belum cukup, atau error. Pesan 429/503 dari server ditampilkan apa adanya. |
| CS-03 *(sebagian)* | Callback Google memakai raw `database/sql` | Diganti GORM (`findOrCreateGoogleUser`), sehingga `main.go` tidak lagi mengoper `*sql.DB` |

## Detail desain

### Perlindungan pre-hijacking (SEC-04)

```
Login Google (email terverifikasi oleh Google)
└─ cari user: LOWER(email) = email_google
   ├─ tidak ada            → buat user baru (email_verified = true, password = GOOGLE_AUTH_USER)
   ├─ ada, sudah verified  → login biasa
   └─ ada, BELUM verified  → email_verified = true
                             password      = GOOGLE_AUTH_USER   (password lama mati)
                             token_version = token_version + 1 (semua sesi lama dicabut)
                             → toast: "password lama dinonaktifkan… gunakan Lupa Password"
```

Email bisa menjadi terverifikasi lewat tiga jalan: login Google, klik link verifikasi (dikirim saat register, berlaku 24 jam), atau berhasil reset password (link dikirim ke email tersebut). Saat startup, akun yang dibuat lewat Google ditandai terverifikasi secara idempoten.

### Rate limiter

`middleware/ratelimit.go` berisi fixed-window di memori. Pendekatan ini cukup untuk satu instance backend. Bila backend di-scale ke beberapa instance, limiter perlu dipindah ke Redis. Batas per IP bergantung pada `c.ClientIP()`; konfigurasi trusted proxy dikerjakan di Fase 2 (SEC-12).

| Endpoint | Per IP | Per akun / user |
|---|---|---|
| `POST /login` | 20 / menit | 10 / 15 menit per username |
| `POST /register` | 10 / jam | — |
| `POST /forgot-password` | 10 / 15 menit | 3 / jam per email (dilewati diam-diam, respons tetap seragam) |
| `POST /reset-password`, `POST /verify-email` | 10 / 15 menit | — |
| `POST /auth/google/exchange` | 20 / menit | — |
| `GET /predict` | — | 5 / menit per user + maks 2 proses Python bersamaan |

## File yang diubah

| Area | File |
|---|---|
| Paket baru `auth` | `auth/token.go` (IssueToken, ParseToken, CheckSecret, RandomToken, HashToken), `auth/policy.go` (ValidatePassword, ValidateUsername) |
| Model | `models/users.go` (`EmailVerified`, `TokenVersion`, `VerifyToken`, `VerifyTokenExpiry`, konstanta `GoogleOnlyPassword`) |
| Middleware | `middleware/requireAuth.go` (cek `ver`), `middleware/ratelimit.go` (baru) |
| Handler | `controllers/authController.go`, `handlers/password.go` (verifikasi email, hash token, template email aman/escape), `handlers/googleAuth.go`, `controllers/aiController.go` (slot konkurensi) |
| Startup | `main.go` (rate limit, route `/verify-email`), `config/database.go` (backfill `email_verified`) |
| Frontend | `lib/passwordPolicy.js`, `lib/format.js`, `pages/VerifyEmail.jsx` (baru), `components/AuthForm.jsx`, `pages/ResetPassword.jsx`, `components/PredictionCard.jsx`, `pages/DashboardStats.jsx`, `pages/ReportPage.jsx`, `App.jsx` |

## Verifikasi

| Uji | Hasil |
|---|:-:|
| `go build`, `go vet` | ✅ |
| Unit test `auth` (token baru & lama, alg=none, secret salah, expired, kebijakan password/username) | ✅ |
| Unit test `middleware` (rate limiter) | ✅ |
| Integration test `handlers` terhadap PostgreSQL (user Google baru, pengambilalihan akun belum terverifikasi, akun terverifikasi tidak diubah) | ✅ 3/3 |
| Smoke test E2E (Fase 0 + 15 skenario Fase 1) | ✅ 32/32 |
| `npm run build` | ✅ |
| ESLint | 6 error lama dari file redesign (dijadwalkan Fase 2), tidak ada error baru |

Skenario E2E Fase 1 yang lolos: password lemah ditolak saat register/reset · verifikasi email sukses & sekali pakai · reset dengan nilai hash (bukan token) gagal · JWT lama → 401 setelah reset · login password lama gagal, password baru berhasil · login ke-11 untuk satu akun → 429 · `/predict` ke-6 dalam semenit → 429.

Integration test dijalankan dengan `TEST_DATABASE_URL=… go test ./handlers/`; tanpa env tersebut test otomatis di-skip.

## Catatan & tindakan manual

- 👤 **`JWT_SECRET` terlalu pendek.** `.env` lokal berisi secret 14 karakter. Ganti dengan minimal 32 karakter acak (`openssl rand -hex 32`) di semua environment, termasuk Koyeb. Mengganti secret akan me-logout semua user satu kali.
- 👤 **SMTP wajib terkonfigurasi** agar email verifikasi dan reset terkirim. Kegagalan kirim hanya dicatat di log dan tidak menggagalkan registrasi.
- **Dampak ke user lama:** user yang mendaftar via form (email belum terverifikasi) lalu login dengan Google akan kehilangan password lamanya (diberi tahu lewat toast). Ini disengaja, karena dari sisi server akun tersebut tidak bisa dibedakan dari akun yang didaftarkan penyerang. User bisa membuat password baru lewat "Lupa Password".
- **Reset token lama** yang dibuat sebelum deploy (plaintext) otomatis tidak berlaku lagi. Masa berlakunya memang hanya 1 jam.
- **Belum ada "kirim ulang email verifikasi".** Alternatifnya, reset password juga memverifikasi email.
