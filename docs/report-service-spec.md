# Report Service Specification

## Overview
Service ini mengelola laporan (aduan) warga kepada pihak desa.  
**File**: `src/services/report-service.ts`  
**Validation**: `src/validation/report-validation.ts`

---

## 1. Buat Laporan

**Endpoint**: `POST /api/v1/reports`  
**Auth**: `Authorization: Bearer {token}` (citizen only)
**Content-Type**: `multipart/form-data`

### Request Body (form-data)
| Field | Tipe | Deskripsi |
|---|---|---|
| `title` | string | Judul laporan |
| `description` | string | Detail kejadian |
| `location` | string | Lokasi kejadian |
| `project_id` | uuid (string) | ID proyek terkait (opsional) |
| `images` | file (maks 2) | Foto pendukung (opsional, maks 5MB per file, JPG/PNG/WebP) |

#### Contoh Valid (Postman form-data)
```text
title       : "Jalan tertutup longsor"
description : "Tolong segera ditangani karena jalan utama terputus."
location    : "Jalan AMD Raya"
image       : [File lampiran.jpg]
```

#### Contoh Invalid & Pesan Error
1. **File Terlalu Besar (> 5MB):**
   ```json
   { "errors": "File too large. Maximum size is 5MB" }
   ```
2. **Format File Salah (Misal: .pdf atau .mp4):**
   ```json
   { "errors": "Invalid file type. Only JPG, PNG, and WEBP are allowed" }
   ```
3. **Kolom Wajib Kosong (Misal title tidak diisi):**
   ```json
   {
     "errors": [
       {
         "code": "too_small",
         "minimum": 1,
         "type": "string",
         "inclusive": true,
         "exact": false,
         "message": "String must contain at least 1 character(s)",
         "path": ["title"]
       }
     ]
   }
   ```

### Validation Rules
| Field | Rule |
|---|---|
| `title` | required, min 1 karakter, max 200 karakter |
| `description` | required, min 1 karakter |
| `location` | required, min 1 karakter, max 200 karakter |
| `project_id` | opsional, harus berformat UUID jika diisi |

### Response `201`
```json
{
  "data": {
    "id": "uuid-laporan",
    "title": "Jalan tertutup longsor",
    "status": "diterima",
    "images": [
      "https://...supabase.co/storage/v1/object/public/report-photos/reports/img1.jpg"
    ],
    "createdAt": "2026-03-25T10:00:00.000Z"
  }
}
```

### Error Responses
| Status | Kondisi |
|---|---|
| 400 | Validasi gagal (ZodError) |
| 401 | Token tidak ada atau tidak valid |
| 404 | `project_id` diisi namun proyek tidak ditemukan atau sudah dihapus |

### Backend Logic
1. Ambil `userId` dari JWT token (via `AuthRequest`)
2. Validasi payload (Zod)
3. Jika `project_id` diisi, cek proyek ada dan tidak soft-deleted → 404 jika tidak
4. Jika ada file `image`, upload ke Supabase bucket `report-photos`.
5. Insert ke tabel `reports`. Jika gagal di tahap ini, hapus file yang sudah diupload ke Supabase (rollback).
6. Return data laporan beserta `imageUrl`.

---

## 2. List Laporan

**Endpoint**: `GET /api/v1/reports`  
**Auth**: `Authorization: Bearer {token}`

### Aturan Akses
| Role | Dapat Melihat |
|---|---|
| `admin` | Semua laporan dari seluruh warga |
| `citizen` | Hanya laporan milik sendiri |

### Query Parameters
| Param | Tipe | Default | Deskripsi |
|---|---|---|---|
| `status` | string | - | Filter: `diterima`, `diproses`, atau `selesai` |
| `page` | number | 1 | Halaman pagination |
| `limit` | number | 10 | Jumlah item per halaman (max 100) |

### Contoh Request
```
GET /api/v1/reports?status=diterima&page=1&limit=10
```

### Response `200`
```json
{
  "data": {
    "items": [
      {
        "id": "uuid-laporan",
        "title": "Jalan berlubang di depan SD Negeri 1",
        "location": "Jl. Merdeka No. 5, Dusun Karanganyar",
        "status": "diterima",
        "createdAt": "2026-03-25T10:00:00.000Z",
        "updatedAt": "2026-03-25T10:00:00.000Z",
        "images": ["https://...supabase.co/storage/v1/object/public/report-photos/reports/img1.jpg"],
        "user": { "name": "Budi Santoso", "username": "budisantoso" },
        "project": { "id": "uuid-proyek", "title": "Pembangunan Jalan Desa" }
      }
    ],
    "total": 5,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

### Error Responses
| Status | Kondisi |
|---|---|
| 401 | Token tidak ada atau tidak valid |

---

## 3. Detail Laporan

**Endpoint**: `GET /api/v1/reports/:id`  
**Auth**: `Authorization: Bearer {token}`

### Aturan Akses
Citizen hanya boleh mengakses laporan milik sendiri. Admin dapat mengakses semua laporan.

### Response `200`
```json
{
  "data": {
    "id": "uuid-laporan",
    "title": "Jalan berlubang di depan SD Negeri 1",
    "description": "Terdapat lubang besar di jalan utama...",
    "location": "Jl. Merdeka No. 5, Dusun Karanganyar",
    "status": "diproses",
    "createdAt": "2026-03-25T10:00:00.000Z",
    "updatedAt": "2026-03-26T08:00:00.000Z",
    "user": {
      "id": "uuid-user",
      "name": "Budi Santoso",
      "username": "budisantoso",
      "phoneNumber": "081234567890"
    },
    "project": { "id": "uuid-proyek", "title": "Pembangunan Jalan Desa" },
    "verifier": { "id": "uuid-admin", "name": "Admin Desa" }
  }
}
```

### Error Responses
| Status | Kondisi |
|---|---|
| 401 | Token tidak ada atau tidak valid |
| 403 | Citizen mencoba mengakses laporan milik warga lain |
| 404 | Laporan tidak ditemukan |

### Backend Logic
1. Query laporan berdasarkan `id` dengan `include: { user, project, verifier }`
2. Jika tidak ditemukan → 404
3. Jika bukan admin dan `report.userId != requestingUserId` → 403
4. Return data laporan (field internal `userId` tidak disertakan dalam response)

---

## 4. Riwayat Laporan Saya

**Endpoint**: `GET /api/v1/reports/me`  
**Auth**: `Authorization: Bearer {token}`

### Response `200`
```json
{
  "data": [
    {
      "id": "uuid-laporan",
      "title": "Jalan berlubang di depan SD Negeri 1",
      "status": "diterima",
      "location": "Jl. Merdeka No. 5",
      "createdAt": "2026-03-25T10:00:00.000Z"
    }
  ]
}
```

### Backend Logic
1. Ambil `userId` dari JWT token
2. Query `report.findMany` dengan `where: { userId }` dan `orderBy: createdAt desc`
3. Return array ringkas laporan milik user tersebut

> Endpoint ini berbeda dari `GET /api/v1/reports` karena tidak menerima query params dan selalu hanya mengembalikan laporan milik token yang sedang login.

---

## 5. Update Status Laporan (Admin)

**Endpoint**: `PATCH /api/v1/reports/:id/status`  
**Auth**: `Authorization: Bearer {admin_token}`

### Request Body
#### Contoh Valid (JSON)
```json
{
  "status": "diproses"
}
```

#### Contoh Invalid & Pesan Error
**Status Typo / Tidak Sesuai Enum:**
```json
// Request Body
{ "status": "dibatalkan" }

// Response Error 400
{
  "errors": [
    {
      "received": "dibatalkan",
      "code": "invalid_enum_value",
      "options": ["diterima", "diproses", "selesai"],
      "message": "Invalid enum value. Expected 'diterima' | 'diproses' | 'selesai', received 'dibatalkan'",
      "path": ["status"]
    }
  ]
}
```

### Validation Rules
| Field | Rule |
|---|---|
| `status` | required, salah satu dari: `diterima`, `diproses`, `selesai` |

### Response `200`
```json
{
  "data": {
    "id": "uuid-laporan",
    "status": "diproses",
    "verifiedBy": "uuid-admin",
    "updatedAt": "2026-03-26T08:00:00.000Z"
  }
}
```

### Error Responses
| Status | Kondisi |
|---|---|
| 400 | Validasi gagal atau nilai status tidak valid |
| 401 | Token tidak ada atau tidak valid |
| 403 | User bukan admin |
| 404 | Laporan tidak ditemukan |

### Backend Logic
1. Cek laporan ada → 404 jika tidak
2. Update field `status` dan `verifiedBy` (diisi dengan `userId` admin yang melakukan perubahan)
3. Return `id`, `status`, `verifiedBy`, dan `updatedAt`

---

## Status Alur Laporan

```
diterima  -->  diproses  -->  selesai
```

| Status | Keterangan |
|---|---|
| `diterima` | Laporan baru masuk, belum ditindaklanjuti |
| `diproses` | Admin sedang meninjau atau menindaklanjuti laporan |
| `selesai` | Laporan telah selesai diproses oleh admin |
