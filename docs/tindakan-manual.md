# Tindak Lanjut Manual & Setup Lokal

> **Tanggal:** 11 Oktober 2026
> **Konteks:** tindakan yang di akhir Fase 3 ditandai 👤 (butuh pemilik repo). Fokusnya membuat aplikasi **berjalan tanpa error di lokal**; deployment production (Koyeb + Supabase) sengaja tidak diaktifkan karena proyek ini untuk portofolio.

## 1. Password database lama dihapus dari riwayat git (SEC-01)

Password yang dulu ter-hardcode di `src/backend/config/database.go` ada di 2 commit dan di tag `v1.0`, pada repo GitHub **publik**.

| Langkah | Hasil |
|---|---|
| Backup | `git bundle --all` dibuat sebelum rewrite (di direktori sementara, di luar repo) |
| Rewrite | `git filter-repo --replace-text` pada *mirror clone* terpisah; password diganti `***REMOVED***` |
| Verifikasi | 0 commit & 0 file di seluruh riwayat yang masih memuat password; isi `main` identik dengan sebelum rewrite; jumlah commit tetap 20 |
| Publikasi | `git push --force` untuk `main` dan tag `v1.0` |
| Dokumentasi | Semua hash commit di `docs/` diperbarui ke hash baru |

**Sisa risiko:** GitHub masih bisa menyajikan commit lama bila seseorang mengetahui SHA-nya (cache objek). Untuk menghapusnya permanen, ajukan permintaan ke GitHub Support ("remove cached views / sensitive data"). Password tersebut sudah dicek **tidak dipakai** di `.env` lokal (DB, SMTP, Google, JWT), dan ditolak oleh PostgreSQL lokal.

> Hash commit berubah. Clone lain dari repo ini (bila ada) perlu di-clone ulang atau `git fetch && git reset --hard origin/main`.

## 2. `JWT_SECRET` diganti (SEC-10)

`JWT_SECRET` di `.env` lokal (sebelumnya 14 karakter) diganti nilai acak 64 karakter hex (256 bit). Akibatnya semua sesi login lokal yang lama berakhir satu kali.

## 3. Konflik port di komputer lokal

`docker compose up` sebelumnya akan **gagal** di komputer ini karena port host sudah dipakai:

| Port | Dipakai oleh | Solusi |
|---|---|---|
| 5432 | PostgreSQL 18 (service Windows) | Port host DB compose kini default **5433** (`DB_HOST_PORT`) |
| 8080 | `AgentService.exe` | Port host backend dapat diatur (`BACKEND_PORT`); di `.env` lokal = **8081** |
| 5173 | Service worker PWA proyek lain (CafePOS) yang terdaftar di Chrome untuk origin `localhost:5173` — semua request ke origin itu dicegat sehingga yang tampil aplikasi lain | Port host frontend dapat diatur (`FRONTEND_PORT`); di `.env` lokal = **5174** |

Perubahan pendukung: `docker-compose.yml` memakai `${DB_HOST_PORT:-5433}`, `${BACKEND_PORT:-8080}`, `${FRONTEND_PORT:-5173}`; CSP nginx mengizinkan `connect-src http://localhost:*` agar backend lokal di port mana pun bisa dipanggil.

## 4. Email tanpa SMTP: `MAIL_MODE=log`

Saat diperiksa, `SMTP_EMAIL`/`SMTP_PASSWORD` di `.env` masih berupa placeholder (login ke `smtp.gmail.com` diputus server), jadi email verifikasi & reset password tidak pernah terkirim.

Ditambahkan `MAIL_MODE` (default `smtp`). Dengan `MAIL_MODE=log`, email tidak dikirim dan **link verifikasi / reset password dicetak ke log backend**:

```bash
docker logs finance_backend 2>&1 | grep MAIL_MODE
# 📧 [MAIL_MODE=log] Untuk: kamu@example.com | Verifikasi Email - DuitKuDW | Link: http://localhost:5174/verify-email?token=...
```

Backend menampilkan peringatan saat start bila mode ini aktif, karena link di log bisa dipakai siapa pun yang membaca log. **Jangan dipakai di server publik.**

Untuk mengirim email sungguhan: buat *App Password* di akun Google (Keamanan → Verifikasi 2 langkah → Sandi aplikasi), isi `SMTP_EMAIL` (alamat Gmail) dan `SMTP_PASSWORD` (16 huruf), lalu set `MAIL_MODE=smtp`.

## 5. Ringkasan `.env` lokal

| Variabel | Nilai | Catatan |
|---|---|---|
| `JWT_SECRET` | 64 karakter acak | baru |
| `BACKEND_PORT` / `VITE_API_URL` | `8081` / `http://localhost:8081` | 8080 dipakai `AgentService.exe` |
| `FRONTEND_PORT` / `FRONTEND_URL` | `5174` / `http://localhost:5174` | 5173 dipakai service worker CafePOS |
| `DB_HOST_PORT` | `5433` | 5432 dipakai PostgreSQL Windows |
| `GOOGLE_REDIRECT_URL` | `http://localhost:8081/auth/google/callback` | lihat catatan di bawah |
| `MAIL_MODE` | `log` | SMTP belum dikonfigurasi |
| `ALLOW_ORIGIN` | *(dihapus)* | tidak pernah dibaca kode |

Salinan `.env` sebelum perubahan disimpan di direktori sementara sesi (di luar repo).

**Login Google lokal:** karena backend sekarang di port 8081, tambahkan `http://localhost:8081/auth/google/callback` ke *Authorized redirect URIs* OAuth Client di Google Cloud Console. Bila tidak, login dengan username/password tetap berfungsi penuh.

## 6. Verifikasi

| Uji | Hasil |
|---|:-:|
| `docker compose up --build` dengan `.env` lokal (project terpisah, volume baru) | ✅ ketiga container sehat |
| Smoke test E2E 32 skenario terhadap stack tersebut | ✅ 32/32 |
| UI via frontend container (build produksi + nginx + CSP): registrasi → verifikasi email lewat link di log → login → dashboard → tambah 3 transaksi → prediksi AI | ✅, 0 pelanggaran CSP |
| `docker compose up` **project bawaan** dengan volume database lama (`duitkudw_db_data`) | ✅ kredensial cocok, migrasi otomatis jalan, API & frontend merespons |

## Menjalankan di lokal

```bash
docker compose up -d --build     # http://localhost:5174 (frontend), http://localhost:8081 (API)
docker logs -f finance_backend   # log backend, termasuk link email (MAIL_MODE=log)
docker compose down              # berhenti (data tetap di volume)
```
