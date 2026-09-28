# Wiseape HRIS Microservice REST API Backend

Aplikasi mikroservis REST API Human Resource Information System (HRIS) berbasis **Node.js**, **Express**, **Sequelize ORM**, dan **PostgreSQL**.

Layanan ini dirancang modular untuk mengelola siklus hidup data karyawan secara lengkap, mencakup:
1. **Data Pribadi (Personal Information)**
2. **Data Pekerjaan (Employment Details)**
3. **Data Kompensasi & Keuangan (Compensation & Payroll)**
4. **Dokumen & Legalitas (Documents & Compliance / Upload)**
5. **Riwayat Pekerjaan di Organisasi Sebelumnya (Work Experience)**
6. **Riwayat Pendidikan (Education History)**
7. **Riwayat Karir & Organisasi Internal (Career History & Rewards)**

---

## 🗄️ Konfigurasi Database PostgreSQL

- **Host**: `34.101.207.44`
- **Port**: `5432`
- **Database**: `wiseape-hris`
- **Username**: `nodeuser`
- **Dialect**: `postgres` (Sequelize v6)

File konfigurasi tersimpan di [.env](file:///Users/mhuda/Works/Projects/Wiseape/wiseape-client-new/server/applications/HRIS/.env).

---

## 📂 Struktur Direktori Proyek

```
server/applications/HRIS/
├── .env                         # Konfigurasi environment (Host, DB, Port, dll)
├── .env.example                 # Template konfigurasi environment
├── app.js                       # Entrypoint aplikasi Express mikroservis
├── package.json                 # Dependency & command scripts
├── uploads/                     # Direktori penyimpanan dokumen digital
│   └── documents/               # File scan KTP, KK, NPWP, Kontrak, Sertifikat, dll
└── src/
    ├── config/
    │   └── database.js          # Koneksi Sequelize ke PostgreSQL
    ├── middleware/
    │   ├── upload.js            # Multer file upload (PDF, JPG, PNG, DOCX)
    │   └── errorHandler.js      # Global error handling (Sequelize & HTTP)
    ├── models/
    │   ├── index.js             # Definisi asosiasi relasi antar model
    │   ├── Employee.js          # Model utama Data Pribadi, Pekerjaan & Kompensasi
    │   ├── EmployeeDocument.js  # Model Dokumen & Legalitas
    │   ├── WorkExperience.js    # Model Riwayat Pekerjaan Sebelumnya
    │   ├── EducationHistory.js  # Model Riwayat Pendidikan
    │   └── CareerHistory.js     # Model Riwayat Karir Internal, Promosi, Mutasi
    ├── controllers/
    │   ├── employeeController.js
    │   ├── documentController.js
    │   ├── workExperienceController.js
    │   ├── educationController.js
    │   └── careerHistoryController.js
    ├── routes/
    │   ├── index.js             # Root router API
    │   ├── employeeRoutes.js    # Endpoint karyawan & sub-routes
    │   ├── documentRoutes.js    # Endpoint dokumen fisik & download
    │   ├── workExperienceRoutes.js
    │   ├── educationRoutes.js
    │   └── careerHistoryRoutes.js
    ├── utils/
    │   ├── responseHelper.js    # Standarisasi JSON response API
    │   └── tenureCalculator.js  # Kalkulator masa kerja otomatis
    └── scripts/
        ├── syncDb.js            # Sinkronisasi schema model ke PostgreSQL
        ├── seed.js              # Seeder data realistis karyawan Indonesia
        └── testApi.js           # Automated end-to-end integration test
```

---

## 🚀 Menjalankan Aplikasi

Jalankan perintah berikut di direktori `server/applications/HRIS/`:

```bash
# 1. Install dependencies
npm install

# 2. Sinkronisasi tabel ke PostgreSQL
npm run sync

# 3. Isi database dengan data awal realistis
npm run seed

# 4. Jalankan pengujian otomatis seluruh endpoint REST API
npm run test

# 5. Jalankan server dalam mode development (auto-reload)
npm run dev

# 6. Jalankan server dalam mode production
npm start
```

Server default berjalan di `http://localhost:4001`.

---

## 📡 Daftar Lengkap REST API Endpoints

### 1. Data Karyawan (Employees)

| Method | Endpoint | Keterangan |
|---|---|---|
| `GET` | `/api/employees` | Mengambil seluruh karyawan (mendukung pagination, search, filter dept/job/status/location, sorting) |
| `GET` | `/api/employees/statistics` | Statistik ringkasan (total, aktif, nonaktif, breakdown per departemen & level) |
| `GET` | `/api/employees/:id` | Mengambil data karyawan lengkap beserta seluruh relasi (ID numerik atau NIK) |
| `POST` | `/api/employees` | Membuat data karyawan baru (bisa nested bersama riwayat pekerjaan & pendidikan) |
| `PUT` | `/api/employees/:id` | Memperbarui data karyawan (pribadi, pekerjaan, atau kompensasi) |
| `PATCH` | `/api/employees/:id/deactivate` | Menonaktifkan karyawan (`is_active: false`, status `Nonaktif`/`Resign`/`PHK`) |
| `PATCH` | `/api/employees/:id/activate` | Mengaktifkan kembali karyawan |
| `DELETE` | `/api/employees/:id` | Menghapus data karyawan (`?force=true` untuk hard delete, default soft delete) |

#### Parameter Query `GET /api/employees`:
- `page`: nomor halaman (default: `1`)
- `limit`: jumlah baris per halaman (default: `10`)
- `search`: kata kunci pencarian (mencari nama lengkap, nama panggilan, NIK, nomor telepon, email, departemen, jabatan)
- `department`: filter departemen (e.g. `Technology`, `Human Resources`)
- `jobTitle`: filter jabatan
- `jobLevel`: filter level jabatan (`Staff`, `Supervisor`, `Manager`, dll.)
- `employmentStatus`: filter status (`Karyawan Tetap`, `Kontrak/PKWT`, `Magang`)
- `workLocation`: filter lokasi kerja (`Kantor Pusat`, `Kantor Cabang`, `Remote`, `Hybrid`)
- `isActive`: filter status aktif (`true` / `false`)
- `sortBy`: kolom pengurutan (`id`, `fullName`, `nik`, `joinDate`, `basicSalary`, dll.)
- `sortOrder`: `ASC` atau `DESC`
- `withDetails`: `true` untuk memuat seluruh relasi dokumen, pendidikan, & pengalaman

---

### 2. Dokumen & Legalitas (Documents & Compliance)

| Method | Endpoint | Format | Keterangan |
|---|---|---|---|
| `GET` | `/api/employees/:employeeId/documents` | JSON | Mengambil daftar berkas/dokumen karyawan |
| `POST` | `/api/employees/:employeeId/documents` | `multipart/form-data` | Upload berkas dokumen (KTP, KK, NPWP, Kontrak, Sertifikat, Ijazah, dll) |
| `GET` | `/api/documents/:id` | JSON | Detail metadata dokumen |
| `GET` | `/api/documents/:id/download` | Binary | Mengunduh / membuka file fisik dokumen |
| `PUT` | `/api/documents/:id` | JSON | Memperbarui metadata dokumen |
| `DELETE` | `/api/documents/:id` | JSON | Menghapus record dan file fisik dokumen dari server |

---

### 3. Riwayat Pekerjaan Sebelumnya (Work Experience)

| Method | Endpoint | Keterangan |
|---|---|---|
| `GET` | `/api/employees/:employeeId/work-experiences` | Mengambil seluruh riwayat pekerjaan di organisasi sebelumnya |
| `POST` | `/api/employees/:employeeId/work-experiences` | Menambahkan riwayat pekerjaan sebelumnya |
| `GET` | `/api/work-experiences/:id` | Mengambil satu riwayat pekerjaan |
| `PUT` | `/api/work-experiences/:id` | Memperbarui data riwayat pekerjaan |
| `DELETE` | `/api/work-experiences/:id` | Menghapus data riwayat pekerjaan |

---

### 4. Riwayat Pendidikan (Education History)

| Method | Endpoint | Keterangan |
|---|---|---|
| `GET` | `/api/employees/:employeeId/education` | Mengambil seluruh riwayat pendidikan karyawan |
| `POST` | `/api/employees/:employeeId/education` | Menambahkan data riwayat pendidikan |
| `GET` | `/api/education/:id` | Mengambil satu riwayat pendidikan |
| `PUT` | `/api/education/:id` | Memperbarui data riwayat pendidikan |
| `DELETE` | `/api/education/:id` | Menghapus data riwayat pendidikan |

---

### 5. Riwayat Karir & Organisasi Internal (Career History & Rewards)

| Method | Endpoint | Keterangan |
|---|---|---|
| `GET` | `/api/employees/:employeeId/career-history` | Riwayat promosi, demosi, rotasi, penyesuaian gaji, penghargaan, dan catatan disiplin |
| `POST` | `/api/employees/:employeeId/career-history` | Menambahkan catatan mutasi/promosi/gaji (bisa auto-update profil utama via `applyToEmployee: true`) |
| `GET` | `/api/career-history/:id` | Mengambil detail riwayat karir internal |
| `PUT` | `/api/career-history/:id` | Memperbarui riwayat karir |
| `DELETE` | `/api/career-history/:id` | Menghapus riwayat karir |

---

## 📋 Contoh Payload Request & Response

### Contoh: Tambah Karyawan Baru (`POST /api/employees`)
```json
{
  "fullName": "Ahmad Fauzi, S.Kom.",
  "nickname": "Fauzi",
  "birthPlace": "Jakarta",
  "birthDate": "1995-07-15",
  "gender": "Laki-laki",
  "religion": "Islam",
  "currentAddress": "Jl. Fatmawati No. 20, Jakarta Selatan",
  "idCardAddress": "Jl. Fatmawati No. 20, Jakarta Selatan",
  "phoneNumber": "081234567899",
  "personalEmail": "ahmad.fauzi@example.com",
  
  "emergencyContactName": "Nurul Hidayah",
  "emergencyContactRelation": "Istri",
  "emergencyContactPhone": "081299887766",

  "nik": "EMP-2024-055",
  "jobTitle": "Backend Engineer",
  "jobLevel": "Staff",
  "department": "Technology",
  "division": "Core Banking",
  "employmentStatus": "Karyawan Tetap",
  "joinDate": "2024-01-10",
  "managerId": 1,
  "workLocation": "Kantor Pusat",

  "bankName": "BCA",
  "bankAccountNumber": "8720192837",
  "bankAccountHolder": "Ahmad Fauzi",
  "basicSalary": 12000000,
  "allowancePosition": 1500000,
  "allowanceTransport": 1000000,
  "allowanceMeal": 1000000,
  "taxStatus": "K/1",
  "npwp": "09.876.543.2-011.000",
  "bpjsKesehatan": "0001928374651",
  "bpjsKetenagakerjaan": "18273645192",

  "workExperiences": [
    {
      "companyName": "PT Bukalapak.com Tbk",
      "position": "Junior Backend Developer",
      "startDate": "2021-03-01",
      "endDate": "2023-12-31",
      "description": "Mengembangkan API REST microservices dan event streaming dengan Kafka."
    }
  ],
  "educationHistories": [
    {
      "institutionName": "Universitas Indonesia",
      "degree": "S1",
      "major": "Ilmu Komputer",
      "startDate": "2014-08-01",
      "graduationDate": "2018-09-01",
      "gpa": 3.75,
      "description": "Lulus dengan predikat Sangat Memuaskan."
    }
  ]
}
```

### Contoh Format Response Standar
```json
{
  "success": true,
  "message": "Data detail karyawan berhasil diambil",
  "data": {
    "id": 1,
    "fullName": "Bambang Sudarmono, S.Kom., M.M.",
    "nik": "EMP-2020-001",
    "jobTitle": "Head of Information Technology",
    "department": "Technology",
    "employmentStatus": "Karyawan Tetap",
    "tenure": {
      "years": 6,
      "months": 8,
      "days": 13,
      "formatted": "6 Tahun 8 Bulan 13 Hari"
    },
    "totalSalary": 37500000,
    "documents": [...],
    "workExperiences": [...],
    "educationHistories": [...],
    "careerHistories": [...]
  }
}
```
