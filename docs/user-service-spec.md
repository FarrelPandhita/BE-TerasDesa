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

#### Contoh Invalid & Pesan Error
1. **Email Sudah Terdaftar:**
   ```json
   { "errors": "Email already exists" }
   ```
2. **Validasi Gagal (Misal: Password terlalu lemah):**
   ```json
   {
     "errors": [
       {
         "validation": "regex",
         "code": "invalid_string",
         "message": "Password must contain at least one letter, one number, and one special character",
         "path": ["password"]
       }
     ]
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

#### Contoh Invalid & Pesan Error
1. **Email atau Password Salah / Belum Terdaftar:**
   ```json
   { "errors": "Invalid email or password" }
   ```
2. **Format Email Salah (Zod Error):**
   ```json
   {
     "errors": [
       { "validation": "email", "code": "invalid_string", "message": "Invalid email", "path": ["email"] }
     ]
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

## 3. Login / Register via Google OAuth

**Endpoint**: `POST /api/v1/users/google-login`  
**Auth**: Public

### Deskripsi Usecase
Endpoint ini digunakan ketika pengguna menekan tombol "Sign In with Google" di Frontend aplikasi. Frontend akan meminta *Google ID Token* dari server Google (Firebase/GCP), kemudian mengirimkannya ke endpoint ini. Backend kita akan memvalidasi *Token* tersebut ke Google secara langsung. Jika email pengguna belum pernah terdaftar di TerasDesa, akun akan dibuatkan secara otomatis. Jika sudah pernah terdaftar, sesi akan diotorisasi dan user langsung mendapat token otentikasi.

### Request Body
```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZ..."
}
```

### Validation Rules
| Field | Rule |
|---|---|
| `idToken` | required (string) |

#### Contoh Invalid & Pesan Error
1. **Tidak Mengirimkan ID Token:**
   ```json
   { "errors": "Google ID Token is required" }
   ```
2. **ID Token Palsu / Kadaluarsa (Tertolak oleh Google):**
   ```json
   { "errors": "Invalid Google token" }
   ```

### Response `200`
```json
{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Backend Logic (SSO Linking)
1. Terima `idToken` dari body request.
2. Lakukan verifikasi kriptografi (*signature & audience*) `idToken` menggunakan library `google-auth-library`.
3. Jika gagal verifikasi → Lempar `401 Invalid Google token`.
4. Jika sukses, ektrak informasi `email`, `name`, `picture` milik Google Profile tersebut.
5. Coba cari user di tabes `users` berdasarkan `email`.
6. Jika **Belum Pernah Terdaftar** (Auto-Register):
   - Buat `username` acak secara algoritmik dari penggalan nama.
   - Lakukan `insert` akun baru ke database (menyimpan `googleId`, `profilePictureUrl`, dan field password dibiarkan *null* karena login via SSO terpusat).
7. Jika **Sudah Pernah Terdaftar** (Login Lanjutan):
   - Pastikan akun ini terkait dengan Google, jika sebelumnya user tersebut mendaftar manual via form (sehingga field `googleId` masih kosong), kita timpa/tautkan dengan meng-update `googleId`-nya saat ini.
8. Buat **JWT Token Internal TerasDesa** yang valid (mirip dengan endpoint manual login biasa) berisi muatan `{ userId, role }`.
9. Kembalikan token tersebut ke Frontend.

---

## 4. Get Current User

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
    "profilePictureUrl": "https://...supabase.co/.../profile.jpg",
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

## 4. Update Profile Picture

**Endpoint**: `PATCH /api/users/profile-picture`  
**Auth**: `Authorization: Bearer {token}`
**Content-Type**: `multipart/form-data`

### Request Body (form-data)
| Field | Tipe | Deskripsi |
|---|---|---|
| `image` | file | Foto profil (wajib, max 5MB, format: jpg/png/webp) |

#### Contoh Valid (Postman form-data)
```text
image : [File pas_foto.png]
```

#### Contoh Invalid & Pesan Error
1. **Tidak Melampirkan File (`image` kosong):**
   ```json
   { "errors": "File image is required" }
   ```
2. **File Terlalu Besar (> 5MB):**
   ```json
   { "errors": "File too large. Maximum size is 5MB" }
   ```
3. **Format File Salah (Misal: .gif atau gambar palsu):**
   ```json
   { "errors": "Invalid file type. Only JPG, PNG, and WEBP are allowed" }
   ```

### Response `200`
```json
{
  "data": {
    "profilePictureUrl": "https://...supabase.co/.../new_profile.jpg"
  }
}
```

### Backend Logic
1. Ambil `userId` dari token.
2. Ambil user lama untuk mendapatkan URL foto profile lama.
3. Upload foto baru ke Supabase bucket `profile-pictures`.
4. Update `profile_picture_url` di database.
5. Jika update DB berhasil, hapus file lama di Supabase (cleanup).
6. Jika update DB gagal, hapus file baru yang baru saja diupload (rollback).

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
