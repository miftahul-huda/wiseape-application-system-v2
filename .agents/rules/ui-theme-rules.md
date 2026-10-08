---
trigger: always_on
---

# UI Theme & Color Consistency Rules

## CRITICAL RULE: Selalu Gunakan CSS Variable Theme (Jangan Hardcode Warna)
Dalam seluruh form, window, frame, button, label, table, dan komponen UI di aplikasi Wise Application System (WAS):

1. **DILARANG KERAS menggunakan hardcoded HEX / RGB / HSL colors** untuk elemen bertema (seperti banner header, hero frames, action buttons, title accents, dll.). Misalnya:
   - ❌ `background: '#1e3a8a'` atau `background: '#047857'`
   - ❌ `color: '#2563eb'`
   - ❌ `linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)`

2. **WAJIB menggunakan CSS Theme Variables**:
   - ✅ `var(--accent)` untuk warna aksen utama aktif
   - ✅ `var(--accent-dark)` untuk warna aksen gelap / border / teks penegas
   - ✅ `linear-gradient(135deg, var(--accent-dark) 0%, var(--accent) 100%)` untuk hero banner, judul window, atau kartu utama
   - ✅ `var(--bg1)` dan `var(--bg2)` untuk background desktop/container
   - ✅ `color-mix(in srgb, var(--accent) 10%, white)` untuk highlight background lembut

3. **Komponen Form & Window**:
   - Semua window baru atau refaktor window (termasuk `WinEmployeeDetail`, `WinEmployeeEdit`, `WinEmployeeManagement`, dan modul HRIS lainnya) harus selalu mewarisi dan mengikuti tema aktif yang dipilih pengguna di desktop settings.
- Buat button tanpa border atau shadow. Just flat and simple button.
- **WAJIB Border pada Semua Input Controls (DILARANG MENGHILANGKAN BORDER)**:
  - **DILARANG KERAS MENGHILANGKAN BORDER** (`border: none`, `border: 0`, `border-none`, `border-transparent`, `outline: none` tanpa border) pada seluruh input controls (`WiseTextBox`, `WiseComboBox`, `WiseDate`, `WiseDateRange`, `WiseNumericBox`, `WiseTextArea`, search input, dll.).
  - Seluruh input controls **WAJIB** memiliki border 1px solid yang jelas, tegas, dan kontras (`border: 1px solid #94a3b8` / `border border-slate-300`). Jangan pernah membuat input tanpa border atau borderless.
  - **Flat Input Controls (Dilarang 3D / Shadow)**: DILARANG KERAS membuat input controls dengan efek 3D, inset shadow, drop shadow, atau bevel. Semua control input WAJIB dibuat flat dan bersih dengan border 1px yang jelas (solid flat border) tanpa shadow sama sekali (`shadow-none` / `boxShadow: 'none'`).
- Buat ukuran font mengikuti ukuran default, jangan diperkecil termasuk di tab, button, label, atau input.
- Dilarang membuat form input inline di bawah data table untuk sub-records. Gunakan tombol aksi / context menu pada tabel yang membuka form window/dialog tersendiri via `this.openWindow(...)`.
- **DILARANG MENAMBAHKAN FRAME / HERO BANNER DI ATAS FORM ATAU WINDOW**: DILARANG KERAS menambahkan frame dekoratif, hero header banner, atau frame informasi/deskripsi di bagian atas window atau form kecuali diminta secara eksplisit oleh user. Window dan form harus langsung dimulai dengan konten fungsional utama (toolbar aksi, tab, filter, data table, atau layout input controls).
- WAJIB menggunakan kontrol `WiseDate` untuk setiap field input tanggal.
- Selalu rujuk dokumentasi di root folder `/docs` (`docs/API_REFERENCE.md`, `docs/DEVELOPMENT_GUIDE.md`, dll.) untuk panduan penggunaan kontrol WAS.
- **WAJIB Dukung Multi-Language (Current Active Language) di Setiap Elemen UI**: Setiap membuat form baru maupun merevisi form/window yang ada, **SELURUH** elemen antarmuka pengguna:
  - **Window Title** (`this.title = WiseI18n.t(...)`)
  - **Label** (`new WiseLabel(WiseI18n.t(...))`)
  - **Button** (`new WiseButton(WiseI18n.t(...))`)
  - **Placeholder Input** (`placeholder: WiseI18n.t(...)`)
  - **Data Table Header** (`columns: [{ key: '...', title: WiseI18n.t(...) }]`)
  - **Tab Title** (`tabs: [{ id: '...', title: WiseI18n.t(...) }]`)
  - **Filter Controls & Context Menu** (`label: WiseI18n.t(...)`, `placeholder: WiseI18n.t(...)`)
  - **Pesan Status & Notifikasi Dialog**
  **WAJIB** dibungkus dengan `WiseI18n.t(...)` dan seluruh teks/key wajib terdaftar dalam kamus terjemahan `WiseI18n.js` (mendukung `id`, `en`, `de`, `es`, `fr`, `ar`) agar UI selalu otomatis menyesuaikan dengan bahasa aktif (`currentLanguage`) yang dipilih pengguna di Pengaturan Desktop.
- **DILARANG MEMBUAT FUNGSI `t(key)` LOKAL/SENDIRI DI DALAM FORM/WINDOW**: Dilarang keras membuat method atau helper `t(key)` / `this.t(key)` sendiri di dalam class window atau form. Selalu impor dan gunakan fungsi `WiseI18n.t(key)` secara langsung dari `WiseI18n.js` (`const WiseI18n = ...` lalu panggil `WiseI18n.t(...)`). Seluruh kode form/window yang masih memiliki fungsi `t(key)` sendiri harus dibersihkan.