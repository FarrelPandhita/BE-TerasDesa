# 🚀 Laporan Progress Pengembangan Backend TerasDesa

Dokumen ini disusun sebagai laporan *progress* pengembangan sistem *Backend* TerasDesa, mencakup arsitektur, pilihan teknologi, alur sistem, serta dokumentasi API sementara.

---

## 1. Arsitektur Infrastruktur & Kode
Proyek ini mengadopsi pola arsitektur **Monolithic REST API** dengan pendekatan **Layered Architecture (Controller - Service - Repository)** untuk memisahkan *concern* dan abstraksi logika.
- **Routing Layer**: Bertugas mendefinisikan *endpoint* URL aplikasi dan memasang konfigurasi *middleware* (`src/routes`).
- **Controller Layer**: Tempat gerbang lalu lintas data. Menerima *request* HTTP, melakukan validasi payload masuk, dan mengembalikan format *response* seragam standar JSON (`src/controllers`).
- **Service Layer**: Mengandung inti bisnis (core logic). Tidak bergantung pada request Express secara langsung, melainkan mengeksekusi logika berat dan komputasi murni (`src/services`).
- **Data Access Layer**: Menggunakan ORM (*Prisma Client*) sebagai perantara transaksi antara kode dengan sistem basis data relasional.

---

## 2. Teknologi yang Digunakan
Sistem ini menggunakan ekosistem *Node.js* modern yang sangat tangguh:
- **Core Runtime**: Node.js & TypeScript (sepenuhnya dikompilasi menggunakan sintaks *strict typing* modern).
- **Framework Web**: Express.js p5.
- **Database Utama**: MySQL (di-*host* dengan *Database terasdesa3*).
- **ORM & Database Toolkit**: Prisma v5.22.0 (Dipilih karena optimisasi generasi tipe data TS dan penggunaan protokol *JSON-native* pada *Engine*-nya).
- **Autentikasi & Keamanan**: 
  - `jsonwebtoken` dengan siklus hidup (*expiresIn*) 7 Hari.
  - `bcrypt` untuk enkripsi asimetris pada *password* pengguna.
  - `helmet` & `cors` untuk mengamankan respons *HTTP Headers* dan menangkal manipulasi eksekusi dari *Frontend*.
- **Validasi Data**: `Zod` (Validasi tingkat *runtime* yang secara proaktif menolak *request* kotor (*bad request*) agar tidak menembus *Service Layer*).
- **Deployment**: Mendukung *Containerization* melalui `Dockerfile` dan `docker-compose.yml` (Aplikasi terekspos di Port `3008` di mesin *Host*).

---

## 3. Flow Sistem (Alur Eksekusi API)
Berikut adalah *pipeline* eksekusi untuk setiap permintaan (request) yang masuk ke Backend:
1. **Client Request**: Klien (*Web/Mobile*) menembak *endpoint* secara HTTP/HTTPS.
2. **Security & Parser Middleware**: *Request* menembus `Helmet`, filter lintas *domain* (`CORS`), dan ekstrak tipe *Body* ukuran maksimum hingga 5MB.
3. **Authentication (Jika *Private*)**: 
   - Melewati balutan `authMiddleware` untuk validasi keaslian kunci rahasia (*JWT Secret*).
   - Menembus `roleGuard("admin")` khusus *endpoint* penciptaan Proyek.
4. **Validation**: *Controller* melempar *Payload* (isi *Request*) ke Skema `Zod`. Bila gagal, langsung memotong eksekusi menjadi `400 Bad Request`.
5. **Business Logic (Service)**: Fungsi di `Service` mengolah data dan terhubung ke MySQL lewat perantara Prisma.
6. **Error Catcher**: Jika `Service` membangkitkan `AppError(404, "Project not found")`, kode ditangkap otomatis melalui balutan utilitas pengecualian `asyncWrapper`.
7. **Response Out**: Dikembalikan dalam bentuk standar konsisten: `{ "data": ... }`.

---

## 4. Demo & Katalog API Utama

*Catatan: Modul 'Komentar', 'Laporan', dan 'Pie Chart' sengaja di-drop (dikeluarkan)* pada iterasi (sprint) kali ini untuk memprioritaskan penyelesaian inti Proyek Desa dan Metrik.*

**PORT API**: Dimuat berjalan pada `http://127.0.0.1:3008/api`

### 🏗️ Modul Projects (Proyek Desa)
`GET /projects`
- **Fungsi**: Mendapatkan daftar indeks seluruh proyek publik yang sedang dicanangkan desa lengkap dengan progresinya (*pagination ready*).

`GET /projects/:id`
- **Fungsi**: Mendapatkan rincian tajam proyek, termasuk *Fundings* (pendanaan), *Expenses* (pengeluaran), *Timelines* (peta jalan harian), dan *Updates*.

`POST /projects` *(Wajib Bawa JWT Admin)*
- **Fungsi**: Membuat gagasan proyek baru dari *Dashboard Internal Desa*.

### 📊 Modul Statistics (Beranda Publik)
`GET /statistics/dashboard`
- **Fungsi**: Titik temu *insight* dana agregasi keseluruhan desa.
- **Contoh Reponse**:
  ```json
  {
    "data": {
       "total_budget": "1314800000",
       "reports": { "total": 0, "unprocessed": 0 },
       "projects": { "total": 5, "active": 2, "finished": 3 }
    }
  }
  ```

### 👤 Modul Users & Auth
`POST /users/register`
- **Fungsi**: *On-boarding* Mendaftarkan warga baru (meminta kolom *username*, identitas *name*, surel *email*, *phone_number*, dan *password*).

`POST /users/login`
- **Fungsi**: Identifikasi aman yang mengembalikan *Access Token* JWT validitas 7 hari bagi Klien Frontend.
