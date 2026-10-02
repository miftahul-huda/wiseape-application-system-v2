# Wiseape Application System (WAS) — Project Guidelines & Rules

## 1. UI Styling and Theme Compliance
- **Selalu Ikuti Current Active Theme**: Jangan pernah men-hardcode warna solid (seperti `#1e3a8a`, `#047857`, `#2563eb`) pada komponen UI, hero banner, tombol, border, atau label accent.
- Gunakan selalu CSS Variables bawaan tema:
  - `var(--accent)` (warna aksen tema saat ini)
  - `var(--accent-dark)` (warna aksen gelap)
  - `linear-gradient(135deg, var(--accent-dark) 0%, var(--accent) 100%)` (untuk banner / frame utama)
  - `var(--bg1)`, `var(--bg2)` (warna latar belakang)
  - `color-mix(in srgb, var(--accent) 12%, white)` (untuk aksen lembut)
- **Ukuran Font Default**: Dilarang memperkecil ukuran font (`fontSize: 11`, `fontSize: 12`, `text-xs`). Semua tab, button, label, field header, dan input harus menggunakan ukuran font standar default (14px / `text-sm`).
- **Flat Button**: Buat button berpenampilan flat dan bersih tanpa border dan tanpa shadow sama sekali.
- **WAJIB Border pada Semua Input Controls (DILARANG MENGHILANGKAN BORDER)**:
  - **DILARANG KERAS MENGHILANGKAN BORDER** (`border: none`, `border: 0`, `border-none`, `border-transparent`, `outline: none` tanpa border) pada seluruh input controls (`WiseTextBox`, `WiseComboBox`, `WiseDate`, `WiseDateRange`, `WiseNumericBox`, `WiseTextArea`, search input, dll.).
  - Seluruh input controls **WAJIB** memiliki border 1px solid yang jelas, tegas, dan kontras (`border: 1px solid #94a3b8` / `border border-slate-300`). Jangan pernah membuat input tanpa border/borderless.
  - **Flat Input Controls (Dilarang 3D / Shadow)**: DILARANG KERAS membuat input controls dengan efek 3D, inset shadow, drop shadow, atau bevel. Semua control input WAJIB dibuat flat dan bersih dengan border 1px yang jelas (solid flat border) tanpa shadow sama sekali (`shadow-none` / `boxShadow: 'none'`).

## 2. Form & Window Architecture
- **Sub-Records / Child Data Table Architecture**: Dilarang membuat form input inline di bawah data table untuk penambahan/pengeditan sub-records (misal: Dokumen, Pengalaman Kerja, Pendidikan, Riwayat Karir). Sediakan tombol aksi ("➕ Tambah", "✏️ Edit", "🗑️ Hapus") dan context menu di tabel yang memanggil form dialog terpisah melalui `this.openWindow(...)`.
- **DILARANG MENAMBAHKAN FRAME / HERO BANNER DI ATAS FORM ATAU WINDOW**: DILARANG KERAS menambahkan frame dekoratif, hero header banner, atau frame informasi/deskripsi di bagian atas window atau form kecuali diminta secara eksplisit oleh user. Window dan form harus langsung dimulai dengan konten fungsional utama (toolbar aksi, tab, filter, data table, atau layout input controls).
- **Input Tanggal**: Untuk seluruh input tanggal, WAJIB menggunakan kontrol `WiseDate` (bukan `WiseTextBox`).
- **Dokumentasi Kontrol**: Untuk melihat panduan dan referensi lengkap penggunaan controls yang tersedia, selalu rujuk dokumentasi di root folder `/docs` (`docs/API_REFERENCE.md`, `docs/DEVELOPMENT_GUIDE.md`, dll.).

## 3. Internationalization & Multi-Language (i18n) Compliance
- **WAJIB Dukung Multi-Language (Current Active Language)**: Setiap membuat form, window, dialog, tombol aksi, label field, placeholder input, tab, filter table, atau pesan baru, seluruh teks/label **WAJIB** terdaftar dan didukung dalam kamus terjemahan `WiseI18n.js` (mendukung `id`, `en`, `de`, `es`, `fr`, `ar`) agar UI selalu otomatis menyesuaikan dengan bahasa aktif (`currentLanguage`) yang dipilih pengguna di Pengaturan Desktop.