# Testing Usage Guide

Dokumen ini memberikan panduan teknis mengenai eksekusi sistem pengujian terotomatisasi (*Integration Test* dan *Unit Test*) untuk Backend TerasDesa, yang dibangun menggunakan kerangka kerja **Jest** dan **Supertest**.

---

## 1. Persiapan Sebelum Pengujian (Wajib Dibaca)

Sistem testing kita dirancang untuk secara otomatis menghapus dan membuat ulang data di tabel setiap kali dijalankan. Tujuannya adalah memastikan setiap skenario pengujian selalu dimulai dari kondisi database yang benar-benar netral.

Agar data asli pengunjung atau data *development* Anda tidak ikut terhapus tanpa sengaja, terapkan *best practice* keamanan berikut sebelum Anda mencoba menjalankan `npm test`:

1. **Buat Database Baru:** Silakan buka aplikasi database manager Anda (misal: phpMyAdmin, DBeaver, dll) dan buatlah sebuah database baru. Anda bisa memberi nama `terasdesa_test`.
2. **Arahkan `.env` ke Database Baru:** Buka file `.env` yang ada di proyek ini, temukan variabel `DATABASE_URL`, lalu ubah URL-nya agar menunjuk ke database testing. 
   *(Contoh: `DATABASE_URL="mysql://root:@localhost:3306/terasdesa_test"`)*
3. **Lakukan Migrasi Prisma:** Karena database `terasdesa_test` ini masih kosong tanpa tabel, jalankan perintah `npx prisma db push` di terminal. Prisma akan otomatis menduplikasi seluruh struktur tabel Anda ke sana.

Jika langkah di atas sudah selesai, pengujian Anda dijamin **100% aman** dan siap untuk dieksekusi.

---

## 2. Cara Menjalankan Pengujian

Buka terminal pada direktori akar proyek (`BE-TerasDesa-SprintFour`) dan gunakan salah satu perintah berikut sesuai kebutuhan:

### A. Eksekusi Seluruh Rangkaian Pengujian (Standard Mode)
Perintah ini merupakan standar wajib yang harus diverifikasi sebelum melakukan integrasi kode (Pull Request/Push) atau proses *deployment* ke server produksi.

```bash
npm test
```
> **Catatan**: Perintah ini menjalankan instruksi `jest --runInBand`. Flag ini diinstruksikan agar Jest mengeksekusi setiap file pengujian secara sekuensial (berurutan). Hal ini merupakan mitigasi terukur untuk mencegah *race condition* (tabrakan modifikasi data) pada satu database rasional yang sama.

### B. Eksekusi Pengujian Spesifik
Untuk efisiensi waktu saat mengembangkan fitur tertentu, pengujian dapat difokuskan pada satu file saja.

```bash
npx jest tests/report.test.ts --runInBand
npx jest tests/user.test.ts --runInBand
npx jest tests/project.test.ts --runInBand
```

### C. Eksekusi dengan Mode Verbose (Detail Output)
Mode ini menyediakan output yang mendetail dan menjelaskan status pass/fail dari setiap fungsi yang sedang diuji.

```bash
npx jest --verbose --runInBand
```

---

## 3. Struktur dan Cakupan Pengujian

Seluruh file pengujian berlokasi terpusat pada direktori `tests/` dan harus menggunakan ekstensi penamaan `.test.ts`.

| File Pengujian | Cakupan Fitur Utama (Coverage Area) |
|---|---|
| `user.test.ts` | Pendaftaran pengguna, Autentikasi (Log In), Validasi duplikasi identitas, dan pengambilan profil autentikasi mandiri. |
| `project.test.ts` | Pembuatan entri proyek (otorisasi tingkat Admin), validasi Role-Based Access Control (RBAC), serta pemanggilan daftar dan detail proyek untuk akses publik. |
| `report.test.ts` | Manajemen laporan warga, RBAC Logic, dan update status oleh Admin. |
| `comment.test.ts` | Submisi komentar standar dan anonim, verifikasi penyensoran (masking) identitas pengunjung anonim, dan agregasi data komentar. |
| `statistics.test.ts` | Endpoint agregasi publik (*Dashboard Count* dan visualisasi proporsi status), serta endpoint *Health Check* ketersediaan sistem. |
| `test-util.ts` | *Fungsi Utilitas (Bukan test suite)*. Modul ini menyediakan fungsi bantuan (*helper*) untuk menghasilkan kredensial token pengujian, simulasi pengguna buatan, serta rutin pembersihan data relasional (Database Tear-down). |

---

## 4. FAQ

### Q: Mengapa history data manual saya di dalam database hilang setelah menjalankan pengujian?
**A:** File *test suite* kami dirancang untuk membongkar pasang *(Teardown)* data sisa (*cleanupTestData()*) di setiap kali selesainya pengujian. Ini diberlakukan agar setiap lapisan skenario berbasis dari dasar yang netral dan murni ("*Zero-state isolation*"). Inilah alasan  mengapa tidak boleh memakai Database utama/Production untuk keperluan pengujian.

### Q: Apakah direktori Jest dan `tests/` perlu di-deploy ke server produksi?
**A:** Direktori source dapat disalin melalui repositori, namun **DILARANG KERAS** melaksanakan eksekusi `npm test` di dalam terminal maupun pada fase *build* server Produksi. Rutin *Testing* idealnya hanya berjalan di dalam lingkungan *Continuous Integration (CI)* otomatis (seperti GitHub Actions) atau komputer para Developer itu sendiri.
