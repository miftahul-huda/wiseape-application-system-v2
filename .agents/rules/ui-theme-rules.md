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
- **Flat Input Controls (Dilarang 3D / Shadow)**: DILARANG KERAS membuat input controls (WiseTextBox, WiseComboBox, WiseTextArea, WiseDate, WiseNumericBox, dll.) dengan efek 3D, inset shadow, drop shadow, atau bevel. Semua control input WAJIB dibuat flat dan bersih dengan border 1px yang jelas (solid flat border) tanpa shadow sama sekali (`shadow-none` / `boxShadow: 'none'`).
- Buat ukuran font mengikuti ukuran default, jangan diperkecil termasuk di tab, button, label, atau input.
- Dilarang membuat form input inline di bawah data table untuk sub-records. Gunakan tombol aksi / context menu pada tabel yang membuka form window/dialog tersendiri via `this.openWindow(...)`.
- Setiap membuat Window jangan ditambahkan Frame informasi jika tidak diminta.
- WAJIB menggunakan kontrol `WiseDate` untuk setiap field input tanggal.
- Selalu rujuk dokumentasi di root folder `/docs` (`docs/API_REFERENCE.md`, `docs/DEVELOPMENT_GUIDE.md`, dll.) untuk panduan penggunaan kontrol WAS.