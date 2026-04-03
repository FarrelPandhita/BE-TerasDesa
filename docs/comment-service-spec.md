# Comment Service Specification

## Overview
Service ini mengelola komentar warga terhadap proyek desa.  
**File**: `src/services/comment-service.ts`  
**Validation**: `src/validation/comment-validation.ts`

---

## 1. List Komentar Proyek

**Endpoint**: `GET /api/v1/projects/:id/comments`  
**Auth**: Public

### Contoh Request
```
GET /api/v1/projects/uuid-proyek/comments
```

### Response `200`
```json
{
  "data": [
    {
      "id": "uuid-komentar",
      "comment": "Semoga cepat selesai dan hasilnya bagus",
      "isAnonymous": false,
      "createdAt": "2026-03-25T10:00:00.000Z",
      "author": {
        "id": "uuid-user",
        "name": "Budi Santoso",
        "username": "budisantoso"
      }
    },
    {
      "id": "uuid-komentar-2",
      "comment": "Kapan selesainya?",
      "isAnonymous": true,
      "createdAt": "2026-03-24T08:30:00.000Z",
      "author": "B***"
    }
  ]
}
```

### Catatan Field `author`
| Kondisi | Nilai `author` |
|---|---|
| `isAnonymous: false` | Object `{ id, name, username }` |
| `isAnonymous: true` | String berupa nama tersamar, contoh `"B***"` |

### Error Responses
| Status | Kondisi |
|---|---|
| 404 | Proyek tidak ditemukan atau sudah dihapus (`deletedAt != null`) |

### Backend Logic
1. Cek proyek ada dan tidak soft-deleted → 404 jika tidak
2. Query `comment.findMany` dengan `orderBy: createdAt desc` dan `include: user`
3. Map tiap komentar: jika `isAnonymous`, panggil `maskName()` untuk menyamarkan nama
4. Fungsi `maskName(name)` mengembalikan `name.charAt(0) + "***"` (contoh: `"Budi"` → `"B***"`)

---

## 2. Tambah Komentar

**Endpoint**: `POST /api/v1/projects/:id/comments`  
**Auth**: `Authorization: Bearer {token}` (citizen atau admin)

### Request Body
#### Contoh Valid (JSON)
```json
{
  "comment": "Semoga proyek ini bisa selesai tepat waktu.",
  "is_anonymous": false
}
```

#### Contoh Invalid & Pesan Error
1. **Komentar Kosong:**
   ```json
   // Request Body
   { "comment": "", "is_anonymous": false }

   // Response Error 400
   {
     "errors": [
       { "validation": "too_small", "code": "too_small", "message": "String must contain at least 1 character(s)", "path": ["comment"] }
     ]
   }
   ```

### Validation Rules
| Field | Rule |
|---|---|
| `comment` | required, min 1 karakter, max 2000 karakter |
| `is_anonymous` | boolean, default `false` |

### Response `201`
```json
{
  "data": {
    "id": "uuid-komentar",
    "comment": "Semoga proyek ini bisa selesai tepat waktu.",
    "isAnonymous": false,
    "createdAt": "2026-03-25T10:00:00.000Z"
  }
}
```

### Error Responses
| Status | Kondisi |
|---|---|
| 400 | Validasi gagal (ZodError) |
| 401 | Token tidak ada atau tidak valid |
| 404 | Proyek tidak ditemukan atau sudah dihapus |

### Backend Logic
1. Ambil `userId` dari JWT token (via `AuthRequest`)
2. Validasi payload (Zod)
3. Cek proyek ada dan tidak soft-deleted → 404 jika tidak
4. Generate UUID untuk `id` komentar
5. Insert ke tabel `comments` dengan `userId`, `projectId`, `comment`, dan `isAnonymous`
6. Return data komentar yang baru dibuat (tanpa relasi user)

> Field `is_anonymous` pada request body dipetakan ke kolom `is_anonymous` di DB. Penyamaran nama hanya berlaku saat data dibaca (GET), bukan saat simpan.
