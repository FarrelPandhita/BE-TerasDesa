# Statistics Service Specification

## Overview
Service ini menyediakan data agregat untuk **Dashboard** dan **Pie Chart** admin.  
**File**: `src/services/statistics-service.ts`  
Semua query dijalankan dalam satu **Prisma `$transaction`** untuk efisiensi.

---

## 1. Dashboard Statistics

**Endpoint**: `GET /api/statistics/dashboard`  
**Auth**: Public

### Response `200`
```json
{
  "data": {
    "total_budget": "1314800000",
    "reports": {
      "total": 37,
      "unprocessed": 12
    },
    "projects": {
      "total": 28,
      "active": 5,
      "finished": 7
    }
  }
}
```

### Field Description
| Field | Deskripsi |
|---|---|
| `total_budget` | Sum `total_budget` seluruh proyek (sebagai string, BigInt-safe) |
| `reports.total` | Total semua laporan |
| `reports.unprocessed` | Laporan dengan status `diterima` (belum diproses) |
| `projects.total` | Total proyek (tidak termasuk soft-deleted) |
| `projects.active` | Proyek berstatus `berjalan` |
| `projects.finished` | Proyek berstatus `selesai` |

### Penggunaan di FE (Homepage)
```
Total Dana Terpakai: Rp 1.314.800.000
Total Anggaran: 28 | Proyek Aktif: 5 | Proyek Selesai: 7 | Laporan: 37
```

---

## 2. Reports Pie Chart Breakdown

**Endpoint**: `GET /api/statistics/reports-pie`  
**Auth**: Public

### Response `200`
```json
{
  "data": {
    "total": 37,
    "breakdown": [
      { "status": "diterima", "count": 9, "percentage": 25 },
      { "status": "diproses", "count": 9, "percentage": 25 },
      { "status": "selesai", "count": 19, "percentage": 51 }
    ]
  }
}
```

### Penggunaan di FE (Admin Dashboard)
Data ini digunakan untuk render Pie Chart / Progress Bar di halaman admin dengan segmentasi status.

### Backend Logic
1. Jalankan 3 `count()` query secara paralel dalam `$transaction`
2. Hitung total dan persentase tiap status
3. Persentase dihitung sebagai `Math.round((count / total) * 100)`

> Jika belum ada laporan sama sekali (`total = 0`), semua persentase akan bernilai `0`.
