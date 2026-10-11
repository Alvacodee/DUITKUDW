# Fase 3 — Penyempurnaan & Konsistensi

> **Tanggal:** 11 Oktober 2026
> **Tujuan:** menutup sisa temuan P3 (kebersihan kode, konsistensi API & UI, dokumentasi) dan mencatat rekomendasi arsitektur yang belum dikerjakan.
> **Referensi:** [audit-report.md](./audit-report.md) §8 Fase 3 · sebelumnya: [fase-2](./fase-2-refactor-dan-hardening.md)

Beberapa item yang awalnya dijadwalkan di Fase 3 sudah selesai lebih awal di Fase 2: SEC-13, SEC-14, BUG-17, BUG-19, CS-10, INC-09, INC-10, INC-11. Lihat dokumen Fase 2.

## Ringkasan perubahan

| ID | Masalah | Perbaikan |
|---|---|---|
| SEC-15 | Field `Password` bertag `json:"password"` sehingga hash bisa bocor bila objek `User` diserialisasi | `json:"-"` |
| CS-09 | Kode mati / scaffolding | Dihapus: `src/backend/main.py` ("Hello from backend!"), `src/frontend/src/App.css` (tidak di-import). README backend yang kosong kini berisi dokumentasi endpoint & konfigurasi; README frontend diisi; deskripsi `pyproject.toml` diperbaiki. |
| CS-11 | Logging `fmt.Println` | Diganti `log` (timestamp, ke stderr) di semua handler |
| CS-12 | `GET /transactions` tanpa paginasi; input tanpa batas panjang | Paginasi opsional `?limit=&offset=` (maks 500 per halaman; tanpa `limit` tetap mengembalikan semua data karena grafik & laporan butuh seluruh data). Deskripsi maks 200 karakter, kategori maks 50 karakter. |
| INC-06 | README tidak sesuai kode (path banner, struktur `finance-tracker/`, "Heroicons", tanpa cara menjalankan) | README ditulis ulang: fitur terkini, tech stack aktual, ringkasan keamanan, cara menjalankan (Docker & manual), cara test, struktur folder |
| INC-07 | FAQ AI menyebut "Linear Regression bulanan" & "minimal 10 transaksi" | Teks FAQ disesuaikan dengan `predict.py`: model hibrid harian, ambang 60 hari, minimal 2 transaksi, arti tren naik/turun/flat |
| INC-08 | Format & bahasa respons API tidak seragam | Error selalu `{"error": "..."}` dalam Bahasa Indonesia (pesan "Unauthorized" diganti); create transaksi → **201 Created**; delete → `{"message": "Transaksi dihapus"}` (sebelumnya `{"data": true}`); `model_used` dari Python kini diteruskan |
| INC-12 | Dua ekspor CSV dengan nama file & format tanggal berbeda; hapus data lokal tanpa konfirmasi | Satu fungsi ekspor (nama `DUITKUDW_Transaksi_<tanggal>.csv`, tanggal ISO); penghapusan data lokal di Pengaturan memakai dialog konfirmasi |
| INC-13 | "Mahasiswa" di-hardcode di sidebar; line ending campuran | Sidebar menampilkan Role/Jurusan dari halaman Profil (tidak tampil bila kosong); `.gitattributes` (`* text=auto eol=lf`) — semua file di index sudah LF sehingga tidak ada diff renormalisasi |

## Rekomendasi arsitektur (belum dikerjakan)

Item 15 di rencana audit bersifat **pertimbangan**, bukan perbaikan bug, dan butuh keputusan produk. Item ini sengaja tidak dikerjakan otomatis:

1. **Pindahkan anggaran, target tabungan, dan profil ke backend.** Saat ini data tersebut ada di *localStorage* (sudah terpisah per akun sejak Fase 2), sehingga tidak tersinkron antarperangkat dan hilang bila browser dibersihkan. Langkahnya: tabel `budgets`, `goals`, `profiles` plus endpoint CRUD; data lokal yang ada dimigrasikan dengan sekali upload saat login.
2. **Prediksi AI tanpa subprocess per request.** Setiap `/predict` masih memuat pandas/statsmodels dari nol (±1–3 detik). Opsinya: (a) cache hasil per user yang di-invalidate saat transaksi berubah, (b) worker Python persisten (FastAPI kecil / antrian), atau (c) job terjadwal harian.
3. **Rate limiter & login code untuk multi-instance.** Rate limiter masih in-memory; bila backend di-scale ke beberapa instance di Koyeb, pindahkan ke Redis. Login code sudah di DB sehingga aman.
4. **Kolom `date` bertipe `DATE`.** Saat ini disimpan sebagai string `YYYY-MM-DD` yang sudah tervalidasi dan ter-index. Migrasi tipe kolom perlu skrip migrasi eksplisit (bukan `AutoMigrate`), jadi ditunda.
5. **Code splitting frontend.** Bundle utama ±900 KB (Recharts + Radix). Halaman bisa di-*lazy load* dengan `React.lazy` per route.

## Verifikasi

| Uji | Hasil |
|---|:-:|
| `gofmt`, `go vet`, `go test ./...` (unit + integration PostgreSQL) | ✅ |
| ESLint · Vitest · build | ✅ 0 error · 22/22 · ✅ |
| Smoke test E2E 32 skenario (create kini 201) | ✅ 32/32 |
| Paginasi `?limit=3&offset=1` → 3 item | ✅ |
| Respons transaksi tidak berisi `password` | ✅ |
| Deskripsi > 200 karakter → 400 | ✅ |
| GitHub Actions CI (commit Fase 2 `756dd39`) | ✅ lulus |
