# Report Service Specification

## Overview
Service ini mengelola pengiriman dan pemrosesan **Laporan / Pengaduan Warga**.  
**File**: `src/services/report-service.ts`  
**Validation**: `src/validation/report-validation.ts`

---

## Alur Status Laporan

```
[Warga kirim] → diterima → diproses → selesai
```

---

## 1. Buat Laporan (Citizen)

**Endpoint**: `POST /api/reports`  
**Auth**: `Authorization: Bearer {citizen_token}`

### Request Body
```json
{
  "title": "Jalan Rusak Parah di Dusun 1",
  "description": "Ada jalan yang rusak parah, kondisi berlubang dan sering menyebabkan kecelakaan terutama saat malam hari.",
  "location": "Dusun Karanganyar, Desa Sukamaju",
  "project_id": "uuid-proyek-terkait",
  "is_anonymous": false,
  "is_secret": false
}
```

> `project_id` bersifat opsional. `is_anonymous` dan `is_secret` default ke `false`.

### Response `201`
```json
{
  "data": {
    "id": "uuid-laporan",
    "title": "Jalan Rusak Parah di Dusun 1",
    "status": "diterima",
    "createdAt": "2026-03-25T05:00:00.000Z"
  }
}
```

### Backend Logic
1. Validasi payload (Zod)
2. Jika `project_id` diisi, validasi bahwa proyek ada di DB → 404 jika tidak
3. Insert laporan dengan status awal `diterima`

---

## 2. Riwayat Laporan Saya (Citizen)

**Endpoint**: `GET /api/reports/me`  
**Auth**: `Authorization: Bearer {token}`

### Response `200`
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Jalan Rusak Parah",
      "status": "selesai",
      "location": "Dusun 1",
      "createdAt": "2026-03-24T..."
    }
  ]
}
```

---

## 3. List Semua Laporan

**Endpoint**: `GET /api/reports`  
**Auth**: `Authorization: Bearer {token}`

### Query Parameters
| Param | Nilai | Deskripsi |
|---|---|---|
| `status` | `diterima` / `diproses` / `selesai` | Filter status |
| `page` | number | Default: 1 |
| `limit` | number | Default: 10, max: 100 |

### Visibilitas
- **Admin**: melihat **semua** laporan dari semua user
- **Citizen**: hanya melihat laporan **milik sendiri**

### Response `200`
```json
{
  "data": {
    "items": [
      {
        "id": "uuid",
        "title": "Lampu Jalan Mati",
        "location": "RT 02/RW 03",
        "status": "diproses",
        "createdAt": "2026-03-23T...",
        "user": { "name": "Siti Aisyah", "username": "siti" },
        "project": { "id": "uuid", "title": "Lampu Jalan Desa" }
      }
    ],
    "total": 37,
    "page": 1,
    "limit": 10,
    "totalPages": 4
  }
}
```

---

## 4. Detail Laporan

**Endpoint**: `GET /api/reports/:id`  
**Auth**: `Authorization: Bearer {token}`

> Citizen hanya bisa mengakses laporan **miliknya sendiri**. Admin bisa mengakses semua.

### Response `200`
```json
{
  "data": {
    "id": "uuid",
    "title": "Jalan Rusak Parah",
    "description": "Kondisi berlubang...",
    "location": "Dusun Karanganyar",
    "status": "diproses",
    "createdAt": "2026-03-24T...",
    "updatedAt": "2026-03-25T...",
    "user": { "id": "uuid", "name": "Andi Santosa", "username": "andi", "phoneNumber": "..." },
    "project": { "id": "uuid", "title": "Pembangunan Jalan" },
    "verifier": { "id": "uuid-admin", "name": "Admin Desa" }
  }
}
```

---

## 5. Ubah Status Laporan (Admin)

**Endpoint**: `PATCH /api/reports/:id/status`  
**Auth**: `Authorization: Bearer {admin_token}`

### Request Body
```json
{
  "status": "diproses"
}
```

> Nilai valid: `diterima`, `diproses`, `selesai`

### Response `200`
```json
{
  "data": {
    "id": "uuid",
    "status": "diproses",
    "verifiedBy": "uuid-admin",
    "updatedAt": "2026-03-25T..."
  }
}
```

### Backend Logic
1. Validasi `status` enum (Zod)
2. Cek laporan ada → 404 jika tidak
3. Update `status` dan simpan `verifiedBy` dengan ID admin yang sedang login
