# Project Service Specification

## Overview
Service ini mengelola seluruh data **Proyek Desa**: pembuatan, update progress, dan detail proyek.  
**File**: `src/services/project-service.ts`  
**Validation**: `src/validation/project-validation.ts`

---

## 1. List Proyek

**Endpoint**: `GET /api/projects`  
**Auth**: Public

### Query Parameters
| Param | Tipe | Default | Deskripsi |
|---|---|---|---|
| `search` | string | - | Filter berdasarkan judul proyek |
| `tahun` | string (YYYY) | - | Filter berdasarkan tahun mulai proyek |
| `page` | number | 1 | Halaman pagination |
| `limit` | number | 10 | Jumlah item per halaman (max 100) |

### Contoh Request
```
GET /api/projects?search=jalan&tahun=2026&page=1&limit=10
```

### Response `200`
```json
{
  "data": {
    "items": [
      {
        "id": "uuid",
        "title": "Pembangunan Jalan Desa Sukamaju",
        "location": "Dusun Karanganyar",
        "totalBudget": "120000000",
        "status": "berjalan",
        "progress": 65,
        "startDate": "2026-01-12T00:00:00.000Z",
        "endDate": "2026-03-30T00:00:00.000Z"
      }
    ],
    "total": 12,
    "page": 1,
    "limit": 10,
    "totalPages": 2
  }
}
```

> **Note**: `totalBudget` dikembalikan sebagai `string` karena menggunakan tipe `BigInt` di DB (JSON tidak mendukung BigInt).

---

## 2. Detail Proyek

**Endpoint**: `GET /api/projects/:id`  
**Auth**: Public

### Response `200`
```json
{
  "data": {
    "id": "uuid",
    "title": "Pembangunan Jalan Desa Sukamaju",
    "description": "...",
    "location": "Dusun Karanganyar, Desa Sukamaju",
    "totalBudget": "120000000",
    "status": "berjalan",
    "progress": 65,
    "startDate": "2026-01-12T00:00:00.000Z",
    "endDate": "2026-03-30T00:00:00.000Z",
    "timelines": [
      { "stageName": "Perencanaan Proyek", "stageDate": "2026-01-02", "status": "selesai" }
    ],
    "expenses": [
      { "expenseName": "Material Jalan", "amount": "60000000", "percentage": "50.00" }
    ],
    "updates": [
      { "progress": 65, "description": "Memasuki tahap pengecoran...", "createdAt": "..." }
    ],
    "comments": [
      {
        "id": "uuid",
        "comment": "Semoga cepat selesai",
        "isAnonymous": false,
        "author": { "id": "uuid", "name": "Bayu Nugroho", "username": "bayu" }
      },
      {
        "id": "uuid2",
        "comment": "Semangat!",
        "isAnonymous": true,
        "author": "S***"
      }
    ]
  }
}
```

---

## 3. Buat Proyek (Admin)

**Endpoint**: `POST /api/projects`  
**Auth**: `Authorization: Bearer {admin_token}`

### Request Body
#### Contoh Valid (JSON)
```json
{
  "title": "Pembangunan Jalan Desa Sukamaju",
  "description": "Pembangunan jalan di Dusun Karanganyar...",
  "location": "Dusun Karanganyar, Desa Sukamaju",
  "total_budget": 120000000,
  "start_date": "2026-01-12",
  "end_date": "2026-03-30",
  "status": "berjalan",
  "timeline": [
    { "stage_name": "Perencanaan Proyek", "stage_date": "2026-01-02", "status": "selesai" },
    { "stage_name": "Pengadaan Material", "stage_date": "2026-01-15", "status": "selesai" },
    { "stage_name": "Pembangunan Tahap 1", "stage_date": "2026-02-01", "status": "diproses" },
    { "stage_name": "Finishing", "stage_date": "2026-03-30", "status": "belum" }
  ],
  "expenses": [
    { "expense_name": "Material Jalan", "amount": 60000000, "percentage": 50 },
    { "expense_name": "Tenaga Kerja", "amount": 30000000, "percentage": 25 },
    { "expense_name": "Biaya Operasional", "amount": 18000000, "percentage": 15 },
    { "expense_name": "Administrasi", "amount": 12000000, "percentage": 10 }
  ]
}
```

#### Contoh Invalid & Pesan Error
1. **Tipe Data Salah (Misal: `total_budget` dikirim sebagai tipe String alih-alih Number):**
   ```json
   {
     "errors": [
       { "code": "invalid_type", "expected": "number", "received": "string", "path": ["total_budget"], "message": "Expected number, received string" }
     ]
   }
   ```
2. **Format Tanggal Bukan Format Baku ISO:**
   ```json
   {
     "errors": [
       { "validation": "regex", "code": "invalid_string", "message": "start_date must be a valid date (YYYY-MM-DD)", "path": ["start_date"] }
     ]
   }
   ```

### Response `201`
```json
{
  "data": {
    "id": "uuid-proyek",
    "title": "Pembangunan Jalan Desa Sukamaju"
  }
}
```

### Backend Logic
1. Validasi payload (Zod)
2. Mulai **Prisma Transaction**:
   - Insert record ke tabel `projects`
   - `createMany` ke tabel `project_timeline` (jika ada)
   - `createMany` ke tabel `detail_pengeluaran_anggaran` (jika ada)
3. Return `id` dan `title` proyek yang baru dibuat

> Timeline dan expenses bersifat **opsional** (default ke array kosong).

---

## 4. Update Progress Proyek (Admin)

**Endpoint**: `POST /api/projects/:id/updates`  
**Auth**: `Authorization: Bearer {admin_token}`

### Request Body
#### Contoh Valid (JSON)
```json
{
  "progress": 65,
  "description": "Saat ini pekerjaan memasuki tahap pengecoran bagian tengah jalan sepanjang 150 meter."
}
```

#### Contoh Invalid & Pesan Error
1. **Progress Lebih Dari 100%:**
   ```json
   // Request Body: { "progress": 150, "description": "..." }

   // Response Error 400
   {
     "errors": [
       { "code": "too_big", "maximum": 100, "type": "number", "inclusive": true, "exact": false, "message": "Number must be less than or equal to 100", "path": ["progress"] }
     ]
   }
   ```

### Response `200`
```json
{
  "data": {
    "message": "Progress updated successfully"
  }
}
```

### Backend Logic
1. Validasi `progress` (integer, 0–100)
2. Cek proyek ada → 404 jika tidak
3. **Prisma Transaction**:
   - Insert log ke `project_updates`
   - Update `progress` di tabel `projects`
   - Jika `progress >= 100`, set `status` menjadi `"selesai"`
