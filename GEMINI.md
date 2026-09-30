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
- **Flat Button & Flat Controls**: Buat button berpenampilan flat dan bersih tanpa border dan tanpa shadow sama sekali.
- **Flat Input Controls (Dilarang 3D / Shadow)**: DILARANG KERAS membuat input controls (WiseTextBox, WiseComboBox, WiseTextArea, WiseDate, WiseNumericBox, dll.) dengan efek 3D, inset shadow, drop shadow, atau bevel. Semua control input WAJIB dibuat flat dan bersih dengan border 1px yang jelas (solid flat border) tanpa shadow sama sekali (`shadow-none` / `boxShadow: 'none'`).

## 2. Form & Window Architecture
- Sub-window / dialog form (seperti detail, edit, tambah) harus dipanggil langsung via `this.openWindow(ChildWindowClass, params)` dari window induk, bukan membuat aplikasi terpisah `WiseApplication` kecuali diminta secara eksplisit.
- Window detail data harus menggunakan kontrol display/read-only (`WiseLabel`) untuk nilai field, bukan kontrol input (`WiseTextBox`).
- Window edit data menggunakan form input controls lengkap dengan tombol simpan & validasi.
- **Sub-Records / Child Data Table Architecture**: Dilarang membuat form input inline di bawah data table untuk penambahan/pengeditan sub-records (misal: Dokumen, Pengalaman Kerja, Pendidikan, Riwayat Karir). Sediakan tombol aksi ("➕ Tambah", "✏️ Edit", "🗑️ Hapus") dan context menu di tabel yang memanggil form dialog terpisah melalui `this.openWindow(...)`.
- Setiap membuat Window jangan ditambahkan Frame informasi jika tidak diminta.
- **Input Tanggal**: Untuk seluruh input tanggal, WAJIB menggunakan kontrol `WiseDate` (bukan `WiseTextBox`).
- **Dokumentasi Kontrol**: Untuk melihat panduan dan referensi lengkap penggunaan controls yang tersedia, selalu rujuk dokumentasi di root folder `/docs` (`docs/API_REFERENCE.md`, `docs/DEVELOPMENT_GUIDE.md`, dll.).