# Fase 0 — Perbaikan Kritis

> **Tanggal:** 11 Oktober 2026
> **Tujuan:** menutup temuan P0 dan celah auth paling berbahaya yang masih terbuka setelah sinkronisasi dengan `origin/main`.
> **Referensi:** [audit-report.md](./audit-report.md) §8 Fase 0

## Konteks: sinkronisasi sebelum Fase 0

Saat fase ini dimulai, branch lokal tertinggal 6 commit dari `origin/main` (`66b5ba1`…`150aeed`). Commit-commit tersebut sudah memperbaiki sebagian temuan audit, sementara redesign UI lokal belum di-commit dan bentrok di 11 file frontend. Penyelesaiannya:

1. Redesign UI disimpan sebagai commit `4d93203` di branch `wip/ui-redesign`.
2. `main` di-fast-forward ke `origin/main`.
3. Branch redesign di-merge (`e1f3dae`). Untuk file yang bentrok, versi redesign dipakai sebagai basis, lalu perbaikan dari remote diporting ke dalamnya. Daftar lengkapnya ada di pesan commit merge.

Dengan merge tersebut, temuan **BUG-01** (route publik hilang) dan **BUG-02** (register tanpa email) ikut tertutup.

## Ringkasan perubahan Fase 0

| ID | Masalah | Perbaikan |
|---|---|---|
| SEC-03 | JWT dikirim lewat query string redirect Google (`/?token=…`) sehingga tercatat di riwayat browser dan access log | Diganti dengan **kode login sekali pakai** (lihat di bawah) |
| BUG-20 *(baru)* | Callback Google mencari user dengan `email = $1` (case-sensitive), padahal register dan lupa-password memakai lowercase | Lookup memakai `LOWER(email) = $1` |
| — | Error di callback Google tampil sebagai halaman teks polos di domain backend | Error setelah validasi state di-redirect ke frontend sebagai `#login_error=…` dan ditampilkan lewat toast |
| SEC-01 / SEC-16 | Arsip zip berisi salinan source (termasuk password lama) | `*.zip` ditambahkan ke `.gitignore` |

## Desain: kode login sekali pakai

```
Browser ──► GET /auth/google/login ──► Google
Google  ──► GET /auth/google/callback?state&code
            backend: validasi state, ambil profil, cari/buat user,
                     buat kode acak 256-bit, simpan SHA-256-nya di tabel login_codes (TTL 2 menit)
        ◄── 303 FRONTEND_URL/#login_code=<kode>
Frontend: baca fragment, hapus dari URL, POST /auth/google/exchange {code}
            backend: DELETE ... WHERE code_hash=? AND expires_at>now() RETURNING *
                     (atomik → kode hanya bisa dipakai sekali), terbitkan JWT
        ◄── 200 {token, username}
```

**Alasan desain:**
- **Fragment (`#`) bukan query (`?`)**: browser tidak pernah mengirim fragment ke server mana pun, sehingga kode tidak tercatat di access log Koyeb, nginx, atau CDN.
- **Hanya hash yang disimpan**: kebocoran tabel `login_codes` tidak membocorkan kode yang masih aktif.
- **`DELETE … RETURNING`**: pengecekan dan penghapusan dalam satu statement mencegah race condition ketika kode yang sama dipakai dua kali bersamaan.
- **Disimpan di DB, bukan di memori**: tetap berfungsi bila backend berjalan lebih dari satu instance.
- **Frontend**: fragment dibaca sekali saat modul dimuat dan promise penukaran di-memoize, jadi aman terhadap effect ganda React StrictMode.

## File yang diubah

| File | Perubahan |
|---|---|
| `src/backend/models/login_code.go` | Model baru `LoginCode` (tabel `login_codes`) |
| `src/backend/config/database.go` | `AutoMigrate` menyertakan `LoginCode` |
| `src/backend/handlers/googleAuth.go` | `issueLoginCode`, `ExchangeLoginCode`, `redirectToFrontend`/`redirectLoginError`, lookup email case-insensitive |
| `src/backend/main.go` | Route `POST /auth/google/exchange` |
| `src/frontend/src/App.jsx` | Membaca `#login_code` / `#login_error`, menukar kode via POST; alur `?token=` lama dihapus |
| `.gitignore` | `*.zip` |

## Verifikasi

Diuji terhadap **cluster PostgreSQL 18 sementara** (dibuat dari binary lokal di direktori scratchpad, port 55432, terpisah dari service Postgres milik pemilik repo; dihapus setelah verifikasi). Backend dijalankan dengan `GIN_MODE=release`.

| Uji | Hasil |
|---|:-:|
| `go build ./...`, `go vet ./...` | ✅ |
| `npm run build` | ✅ |
| Smoke test E2E (17 kasus: register, login, CRUD transaksi, validasi input, prediksi AI, lupa password) | ✅ 17/17 |
| Login code valid → JWT + username | ✅ |
| Login code dipakai ulang → 401 | ✅ |
| Login code kedaluwarsa → 401 | ✅ |

Alur penuh Google OAuth (redirect ke Google) tidak bisa diuji otomatis tanpa kredensial OAuth. Bagian setelah callback diuji dengan menyisipkan kode langsung ke tabel `login_codes`.

## Catatan & tindakan manual

- 👤 **Rotasi password database (SEC-01).** Password lama tetap ada di riwayat git (`9787a54` dan sebelumnya). Saat verifikasi, password tersebut ternyata **tidak berlaku** di PostgreSQL lokal, tetapi tetap perlu dipastikan tidak dipakai di environment lain. Membersihkan riwayat git (`git filter-repo`) adalah operasi destruktif yang mengubah semua hash commit, jadi tidak dilakukan otomatis.
- **Kompatibilitas deploy.** Frontend dan backend harus di-deploy bersamaan: frontend lama mengharapkan `?token=`, sedangkan backend baru mengirim `#login_code=`.
- **Temuan baru dari verifikasi (BUG-21, dikerjakan di Fase 2).** Bila `DB_PASSWORD` kosong, DSN key-value `password= dbname=…` di-parse salah sehingga nama database hilang dan koneksi gagal.
