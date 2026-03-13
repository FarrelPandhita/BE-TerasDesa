
# User API Specification — TerasDesa

## Overview

API ini mengelola **autentikasi dan profil pengguna** pada sistem TerasDesa.

Sistem mendukung dua metode login:

- **Email + Password**
- **Google OAuth**

Password disimpan menggunakan **bcrypt hashing**.

---

# User Model

```
User
-----
id (UUID)
username
name
email
phone_number
password_hash (nullable for OAuth users)
google_id (nullable)
role
created_at
updated_at
deleted_at
```

Role yang tersedia:

```
admin
citizen
```

Default role saat register:

```
citizen
```

---

# 1. Register User (Email + Password)

Membuat akun pengguna baru menggunakan email dan password.

## Endpoint

```
POST /api/users
```

## Request Body

```json
{
  "username": "budisantoso",
  "name": "Budi Santoso",
  "email": "budi@mail.com",
  "phone_number": "081234567890",
  "password": "Pass123!"
}
```

## Validation Rules

```
username    : required, max 80 chars
name        : required, max 120 chars
phone_number: required, min 5, max 20 chars
email       : valid email
password    : minimum 6 characters
              must contain letter
              must contain number
              must contain symbol
```

## Backend Flow

```
validate request (zod)
↓
check email already exists
↓
hash password using bcrypt
↓
generate uuid for user id
↓
insert user using prisma
↓
return response
```

## Response Success

```json
{
  "data": {
    "id": "uuid",
    "username": "budisantoso",
    "name": "Budi Santoso",
    "email": "budi@mail.com",
    "phone_number": "081234567890",
    "role": "citizen"
  }
}
```

---

# 2. Login User (Email + Password)

Melakukan autentikasi menggunakan email dan password.

## Endpoint

```
POST /api/users/login
```

## Request Body

```json
{
  "email": "budi@mail.com",
  "password": "Pass123!"
}
```

## Backend Flow

```
find user by email
↓
compare password with bcrypt
↓
generate authentication token
↓
return token
```

## Response Success

```json
{
  "data": {
    "token": "jwt_token"
  }
}
```

---

# 3. Login / Register with Google OAuth

Menggunakan akun Google untuk login atau membuat akun baru.

Jika email belum terdaftar, sistem akan otomatis membuat akun baru.

## Endpoint

```
POST /api/users/oauth/google
```

## Request Body

Frontend akan mengirim:

```json
{
  "id_token": "google_id_token"
}
```

Token ini diperoleh dari **Google OAuth SDK di frontend**.

## Backend Flow

```
verify id_token using Google API
↓
extract user info (email, name, google_id)
↓
check if user already exists by email
↓
if exists → login
if not exists → create new user
↓
generate authentication token
↓
return token
```

## Response Success

```json
{
  "data": {
    "token": "jwt_token"
  }
}
```

---

# 4. Get Current User Profile

Mengambil profil user yang sedang login.

## Endpoint

```
GET /api/users/current
```

## Headers

```
Authorization: Bearer {token}
```

## Response

```json
{
  "data": {
    "id": "uuid",
    "name": "Budi Santoso",
    "email":note "budi@mail.com",
    "role": "citizen"
  }
}
```

---

# 5. Update User Profile

Memperbarui profil pengguna.

## Endpoint

```
PATCH /api/users/current
```

## Request Body

```json
{
  "name": "Budi Updated"
}
```

## Response

```json
{
  "data": {
    "id": "uuid",
    "name": "Budi Updated",
    "email": "budi@mail.com"
  }
}
```

---

# 6. Delete User (Soft Delete)

Menghapus akun pengguna menggunakan **soft delete**.

## Endpoint

```
DELETE /api/users/current
```

## Backend Flow

```
verify token
↓
set deleted_at timestamp
↓
user dianggap tidak aktif
```

---

# Security Notes

## Password Hashing

Password disimpan menggunakan **bcrypt**.

Contoh implementasi:

```javascript
bcrypt.hash(password, 10)
```

Password **tidak pernah disimpan dalam bentuk plaintext**.

---





# Future Improvements

Fitur yang dapat ditambahkan di masa depan:

```
JWT refresh token
rate limiting
email verification
password reset
```
