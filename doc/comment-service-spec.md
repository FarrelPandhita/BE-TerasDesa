# Comment Service Specification

## Overview
Service ini mengelola **Komentar Warga** pada halaman detail proyek, dengan dukungan mode anonim.  
**File**: `src/services/comment-service.ts`  
**Validation**: `src/validation/comment-validation.ts`

---

## 1. List Komentar Proyek

**Endpoint**: `GET /api/projects/:id/comments`  
**Auth**: Public

### Contoh Request
```
GET /api/projects/uuid-proyek/comments
```

### Response `200`
```json
{
  "data": [
    {
      "id": "uuid1",
      "comment": "Semoga proyek cepat selesai",
      "isAnonymous": false,
      "createdAt": "2026-03-25T...",
      "author": {
        "id": "uuid-user",
        "name": "Bayu Nugroho",
        "username": "bayu"
      }
    },
    {
      "id": "uuid2",
      "comment": "Semoga proses pembangunan terus diperbaharui di website ini",
      "isAnonymous": true,
      "createdAt": "2026-03-24T...",
      "author": "S***"
    }
  ]
}
```

### Aturan Masking Anonim
- Jika `isAnonymous = true`: field `author` berupa **string** format `"InitialHuruf***"` (contoh: `"S***"`)
- Jika `isAnonymous = false`: field `author` berupa **object** dengan `id`, `name`, dan `username`

---

## 2. Tulis Komentar

**Endpoint**: `POST /api/projects/:id/comments`  
**Auth**: `Authorization: Bearer {token}` (Citizen atau Admin)

### Request Body
```json
{
  "comment": "Semoga proyek ini cepat selesai dan bermanfaat bagi warga sekitar",
  "is_anonymous": false
}
```

### Validation Rules
| Field | Rule |
|---|---|
| `comment` | required, max 2000 chars |
| `is_anonymous` | boolean, default `false` |

### Response `201`
```json
{
  "data": {
    "id": "uuid-komentar",
    "comment": "Semoga proyek ini cepat selesai...",
    "isAnonymous": false,
    "createdAt": "2026-03-25T..."
  }
}
```

### Backend Logic
1. Validasi payload (Zod)
2. Cek proyek ada dan tidak di-soft-delete → 404 jika tidak
3. Insert komentar dengan `userId` dari JWT, `is_anonymous` sesuai request

### Error Responses
| Status | Kondisi |
|---|---|
| 400 | Validasi gagal |
| 401 | Token tidak ada / tidak valid |
| 404 | Proyek tidak ditemukan |

---

##  Use Case

### UC-1: Warga ingin berkomentar tanpa identitas
1. Login → dapatkan token
2. `POST /api/projects/:id/comments` dengan `is_anonymous: true`
3. Komentar tersimpan dengan `userId` asli di DB, tetapi nama ditampilkan sebagai `"N***"` ke publik

### UC-2: Warga ingin melihat komentar tanpa login
1. `GET /api/projects/:id/comments` — tidak perlu token
2. Response berisi semua komentar, dengan nama author anonim sudah disamarkan
