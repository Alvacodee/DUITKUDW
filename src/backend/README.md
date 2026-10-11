# DuitKuDW — Backend

API Go (Gin + GORM + PostgreSQL) dengan modul prediksi pengeluaran berbasis Python.

## Endpoint

| Method | Path | Auth | Keterangan |
|---|---|:-:|---|
| POST | `/register` | — | `{username, email, password}`; mengirim email verifikasi |
| POST | `/login` | — | `{username, password}` → `{token, username}` |
| POST | `/verify-email` | — | `{token}` dari link email |
| POST | `/forgot-password` | — | `{email}`; respons selalu seragam |
| POST | `/reset-password` | — | `{token, new_password}`; mencabut semua sesi lama |
| GET | `/auth/google/login` | — | Redirect ke Google |
| GET | `/auth/google/callback` | — | Redirect ke `FRONTEND_URL/#login_code=…` |
| POST | `/auth/google/exchange` | — | `{code}` → `{token, username}` (kode sekali pakai, 2 menit) |
| GET | `/transactions` | ✅ | `?limit=&offset=` opsional (maks 500 per halaman) |
| POST | `/transactions` | ✅ | `{date: YYYY-MM-DD, description, amount, category, type: Pemasukan\|Pengeluaran}` → 201 |
| PUT | `/transactions/:id` | ✅ | Sama dengan POST |
| DELETE | `/transactions/:id` | ✅ | |
| GET | `/predict` | ✅ | Prediksi 30 hari; maks 5/menit per user |

Error selalu berbentuk `{"error": "pesan"}`. Endpoint yang dibatasi mengembalikan **429** dengan header `Retry-After`.

## Konfigurasi

Lihat [`../../.env.example`](../../.env.example). Variabel penting:

| Variabel | Default | Keterangan |
|---|---|---|
| `JWT_SECRET` | *(wajib)* | Minimal 32 karakter acak |
| `FRONTEND_URL` | `http://localhost:5173` (dev) | Wajib bila `GIN_MODE=release` |
| `DATABASE_URL` | — | Bila kosong, DSN disusun dari `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SSLMODE` |
| `TRUSTED_PROXIES` | *(percaya semua)* | IP/CIDR reverse proxy, atau `none` |
| `PYTHON_BIN`, `ML_SCRIPT` | otomatis | `.venv` di samping `ml/` lalu `python3`/`python` |
| `PREDICT_TIMEOUT_SECONDS`, `PREDICT_MAX_CONCURRENCY` | `60`, `2` | |

## Menjalankan & test

```bash
uv sync                 # dependensi Python ML
go run .
go test ./...           # TEST_DATABASE_URL=… untuk integration test
uv run python -m unittest discover -s ml
```

Skema database dibuat otomatis (`AutoMigrate`) saat startup, beserta perbaikan data idempoten (normalisasi tipe transaksi lama dan flag verifikasi email akun Google).
