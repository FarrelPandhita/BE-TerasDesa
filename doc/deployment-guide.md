# Panduan Deployment ke VPS (Docker)

## Persiapan yang Sudah Disiapkan di Codebase

| File | Keterangan |
|---|---|
| `Dockerfile` | Multi-stage build: compile TS, generate Prisma, jalankan dist/ |
| `docker-compose.yml` | Konfigurasi container sesuai spesifikasi DevOps |
| `.dockerignore` | Mengecualikan node_modules, dist, dan .env dari build context |
| `.env.production` | Template environment variable untuk production |
| `GET /health` | Endpoint health check yang mengembalikan `{ status: "ok" }` |

---

## Langkah 1 — Push Kode ke Git

Pastikan semua file sudah di-commit dan di-push ke repository (GitHub/GitLab):

```bash
git add .
git commit -m "feat: add Docker deployment files"
git push origin main
```

---

## Langkah 2 — Masuk ke VPS

```bash
ssh farrel@proxy.bccdev.id -p 11050
# Password: yBY3I4liFhQuQ9zA
```

---

## Langkah 3 — Clone Repository ke VPS

```bash
git clone <URL_REPOSITORY_KAMU> farrel-app
cd farrel-app
```

Ganti `<URL_REPOSITORY_KAMU>` dengan URL repository GitHub/GitLab kamu.

---

## Langkah 4 — Buat File .env di VPS

```bash
cp .env.production .env
nano .env
```

Isi file `.env` sebagai berikut (sesuai kredensial dari DevOps):

```env
PORT=3008
DATABASE_URL="mysql://farrel:5auqwZIhLER5h%2FLG@127.0.0.1:3306/farrel_db"
JWT_SECRET="isi-dengan-string-random-panjang-minimal-32-karakter"
FRONTEND_URL="https://be-internship.bccdev.id"
GOOGLE_CLIENT_ID=""
```

> **Catatan penting**: Password database mengandung karakter `/`. Di dalam `DATABASE_URL` (format URL), karakter `/` harus ditulis sebagai `%2F`. Jika tidak, Prisma tidak bisa terkoneksi ke database.

Simpan dengan `Ctrl+O`, keluar dengan `Ctrl+X`.

---

## Langkah 5 — Setup Database (Jalankan Prisma Migration)

Sebelum menjalankan container, skema database harus disiapkan.
Ada dua cara:

**Cara A — Dari dalam container sementara (direkomendasikan):**
```bash
docker compose run --rm farrel_be npx prisma db push
```

**Cara B — Langsung di VPS jika Node.js tersedia:**
```bash
npm ci
npx prisma db push
```

---

## Langkah 6 — Build dan Jalankan Container

```bash
docker compose up -d --build
```

Container akan di-build dan berjalan di background.

---

## Langkah 7 — Verifikasi

**Cek status container:**
```bash
docker compose ps
```

Output yang diharapkan menunjukkan `farrel_be` dengan status `running`.

**Cek log container:**
```bash
docker compose logs -f farrel_be
```

Cari baris: `[TerasDesa] API running on port 3008`

**Test health endpoint dari dalam VPS:**
```bash
curl http://127.0.0.1:3008/health
```

Expected response:
```json
{ "status": "ok", "timestamp": "2026-03-27T06:00:00.000Z" }
```

**Test endpoint API:**
```bash
curl http://127.0.0.1:3008/api/statistics/dashboard
```

**Test via base URL publik (setelah reverse proxy dikonfigurasi DevOps):**
```
https://be-internship.bccdev.id/farrel/api/statistics/dashboard
```

---

## Perintah Berguna Lainnya

| Perintah | Fungsi |
|---|---|
| `docker compose stop` | Hentikan container |
| `docker compose start` | Mulai ulang container |
| `docker compose down` | Hentikan dan hapus container |
| `docker compose up -d --build` | Rebuild + restart (saat ada update kode) |
| `docker compose logs -f` | Lihat log real-time |
| `docker exec -it farrel_be sh` | Masuk ke dalam container |

---

## Update Kode (Deploy Ulang)

Setiap kali ada perubahan kode, jalankan di VPS:

```bash
cd farrel-app
git pull origin main
docker compose up -d --build
```

---

## Catatan Penting

- Jangan gunakan port **3001–3015** untuk service tambahan (instruksi DevOps).
- Database sudah tersedia, tidak perlu menjalankan container DB sendiri.
- Network `mariadb_network` sudah disiapkan DevOps, container kita tinggal join.
- Base path publik: `https://be-internship.bccdev.id/farrel` — semua endpoint dapat diakses dari sana (misal: `https://be-internship.bccdev.id/farrel/api/projects`).
