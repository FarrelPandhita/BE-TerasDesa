# User Service Specification

## Overview
Service ini mengelola autentikasi dan profil pengguna TerasDesa.  
**File**: `src/services/user-service.ts`  
**Validation**: `src/validation/user-validation.ts`

---

## 1. Register User

**Endpoint**: `POST /api/users`  
**Auth**: Public

### Request Body
```json
{
  "username": "budisantoso",
  "name": "Budi Santoso",
  "email": "budi@mail.com",
  "phone_number": "081234567890",
  "password": "Pass123!"
}
```

### Validation Rules
| Field | Rule |
|---|---|
| `username` | required, max 80 chars |
| `name` | required, max 120 chars |
| `phone_number` | min 5, max 20 chars |
| `email` | valid email format |
| `password` | min 6 chars, mengandung huruf, angka, dan simbol |

### Response `201`
```json
{
  "data": {
    "id": "uuid",
    "username": "budisantoso",
    "name": "Budi Santoso",
    "email": "budi@mail.com",
    "phoneNumber": "081234567890",
    "role": "citizen"
  }
}
```

### Error Responses
| Status | Kondisi |
|---|---|
| 400 | Validasi gagal (ZodError) |
| 409 | Email sudah terdaftar |

### Backend Logic
1. Parse & validasi payload (Zod)
2. Cek apakah email sudah terdaftar → throw 409 jika ada
3. Hash password dengan bcrypt (salt 10)
4. Generate UUID untuk `id`
5. Insert ke tabel `users` via Prisma
6. Return data user (tanpa `passwordHash`)

---

## 2. Login User

**Endpoint**: `POST /api/users/login`  
**Auth**: Public

### Request Body
```json
{
  "email": "budi@mail.com",
  "password": "Pass123!"
}
```

### Response `200`
```json
{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Error Responses
| Status | Kondisi |
|---|---|
| 400 | Validasi gagal |
| 401 | Email atau password salah (pesan generik) |

### Backend Logic
1. Cari user berdasarkan email
2. Jika tidak ditemukan atau tidak punya `passwordHash` → 401 (generic)
3. Compare password dengan bcrypt
4. Jika tidak cocok → 401 (generic)
5. Generate JWT dengan payload `{ userId, role }`, expire `1d`
6. Return token

> **Security Note**: Pesan error sengaja dibuat generik ("Invalid email or password") untuk mencegah *email enumeration attack*.

---

## 3. Get Current User

**Endpoint**: `GET /api/users/current`  
**Auth**: `Authorization: Bearer {token}`

### Response `200`
```json
{
  "data": {
    "id": "uuid",
    "username": "budisantoso",
    "name": "Budi Santoso",
    "email": "budi@mail.com",
    "phoneNumber": "081234567890",
    "role": "citizen"
  }
}
```

### Error Responses
| Status | Kondisi |
|---|---|
| 401 | Token tidak ada / tidak valid / expired |
| 404 | User tidak ditemukan di DB |

### Cara FE Menggunakan
```typescript
// axios instance dengan interceptor (lihat api-plan.md)
const user = await apiClient.get('/users/current')
```

---

## JWT Token Payload
Token yang dihasilkan menyimpan:
```json
{
  "userId": "uuid-user",
  "role": "citizen",
  "iat": 1711000000,
  "exp": 1711086400
}
```
`role` di dalam token memungkinkan RBAC tanpa perlu lookup DB tambahan.
