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
- **WAJIB Menggunakan Style Default WiseButton (Dilarang Mengubah Ukuran/Dimensi Parsial)**:
  - Semua button di seluruh window (toolbar aksi, form dialog, footer Simpan/Batal, popup window, dialog konfirmasi & alert info) **WAJIB** menggunakan dan mewarisi style default dari `WiseButton` (`WiseButton.DEFAULT_STYLE`).
  - **DILARANG KERAS** melakukan override pada ukuran, tinggi (`height`/`minHeight`), padding, lebar (`minWidth`), maupun `borderRadius` secara sembarangan di tiap window atau tiap tombol (seperti `padding: '7px 14px'`, `padding: '8px 18px'`, `padding: '9px 30px'`, `borderRadius: '8px'`, dll.).
  - Jika memerlukan variasi warna (misalnya tombol Batal berwarna abu-abu atau tombol Hapus berwarna merah), **HANYA** tentukan properti `background` dan `color` saja (contoh: `style: { background: '#e2e8f0', color: '#334155' }`), biarkan seluruh dimensi, tinggi, padding, lebar, dan border radius mengikuti style default bawaan `WiseButton`.
  - Tombol yang berdampingan (seperti Simpan dan Batal) harus seragam dan konsisten memiliki ukuran yang sama persis mengikuti style default.
- **Border Radius Window 3px**: Border radius untuk seluruh window (termasuk popup dialog konfirmasi dan alert info card) **WAJIB** bernilai 3px (`border-radius: 3px;`).
- **WAJIB Border pada Semua Input Controls (DILARANG MENGHILANGKAN BORDER)**:
  - **DILARANG KERAS MENGHILANGKAN BORDER** (`border: none`, `border: 0`, `border-none`, `border-transparent`, `outline: none` tanpa border) pada seluruh input controls (`WiseTextBox`, `WiseComboBox`, `WiseDate`, `WiseDateRange`, `WiseNumericBox`, `WiseTextArea`, search input, dll.).
  - Seluruh input controls **WAJIB** memiliki border 1px solid yang jelas, tegas, dan kontras (`border: 1px solid #94a3b8` / `border border-slate-300`). Jangan pernah membuat input tanpa border/borderless.
  - **Flat Input Controls (Dilarang 3D / Shadow)**: DILARANG KERAS membuat input controls dengan efek 3D, inset shadow, drop shadow, atau bevel. Semua control input WAJIB dibuat flat dan bersih dengan border 1px yang jelas (solid flat border) tanpa shadow sama sekali (`shadow-none` / `boxShadow: 'none'`).

## 2. Form & Window Architecture
- **Sub-Records / Child Data Table Architecture**: Dilarang membuat form input inline di bawah data table untuk penambahan/pengeditan sub-records (misal: Dokumen, Pengalaman Kerja, Pendidikan, Riwayat Karir). Sediakan tombol aksi ("➕ Tambah", "✏️ Edit", "🗑️ Hapus") dan context menu di tabel yang memanggil form dialog terpisah melalui `this.openWindow(...)`.
- **DILARANG MENAMBAHKAN FRAME / HERO BANNER DI ATAS FORM ATAU WINDOW**: DILARANG KERAS menambahkan frame dekoratif, hero header banner, atau frame informasi/deskripsi di bagian atas window atau form kecuali diminta secara eksplisit oleh user. Window dan form harus langsung dimulai dengan konten fungsional utama (toolbar aksi, tab, filter, data table, atau layout input controls).
- **Input Tanggal**: Untuk seluruh input tanggal, WAJIB menggunakan kontrol `WiseDate` (bukan `WiseTextBox`).
- **Posisi Action Buttons (Save di Kiri, Cancel di Kanan)**:
  - Pada seluruh form dialog, edit window, popup window, dan action toolbar/footer:
    - Tombol **Simpan / Save / Konfirmasi** WAJIB diletakkan di sebelah **KIRI**.
    - Tombol **Batal / Cancel / Tutup** WAJIB diletakkan di sebelah **KANAN**.
    - Urutan penambahan kontrol (`addControl`): tombol Save/Simpan ditambahkan terlebih dahulu, kemudian tombol Cancel/Batal (`container.addControl(btnSave); container.addControl(btnCancel);`).
- **Dokumentasi Kontrol**: Untuk melihat panduan dan referensi lengkap penggunaan controls yang tersedia, selalu rujuk dokumentasi di root folder `/docs` (`docs/API_REFERENCE.md`, `docs/DEVELOPMENT_GUIDE.md`, dll.).

## 3. Internationalization & Multi-Language (i18n) Compliance
- **WAJIB Dukung Multi-Language (Current Active Language) di Setiap Elemen UI**: Setiap membuat form baru maupun merevisi form/window yang ada, **SELURUH** elemen antarmuka pengguna:
  - **Window Title** (`this.title = WiseI18n.t(...)`)
  - **Label** (`new WiseLabel(WiseI18n.t(...))`) — **DILARANG KERAS men-hardcode string langsung** seperti `new WiseLabel('Nama Lengkap')` atau `new WiseLabel('Cari:')`.
  - **Button** (`new WiseButton(WiseI18n.t(...))`)
  - **Placeholder Input** (`placeholder: WiseI18n.t(...)`)
  - **Data Table Header** (`columns: [{ key: '...', title: WiseI18n.t(...) }]`)
  - **Tab Title** (`tabs: [{ id: '...', title: WiseI18n.t(...) }]`)
  - **Filter Controls & ComboBox Options** (`label: WiseI18n.t(...)`, `placeholder: WiseI18n.t(...)`)
  - **Context Menu Items** (`dt.addContextMenu([{ id: '...', label: WiseI18n.t(...) }])`)
  - **Pesan Status, Dialog Notifikasi & Konfirmasi (`showInfo`)**
  **WAJIB** dibungkus dengan `WiseI18n.t(...)` dan seluruh teks/key wajib terdaftar dalam kamus terjemahan `WiseI18n.js` (mendukung `id`, `en`, `de`, `es`, `fr`, `ar`) agar UI selalu otomatis menyesuaikan dengan bahasa aktif (`currentLanguage`) yang dipilih pengguna di Pengaturan Desktop.
- **Notifikasi `this.showInfo(...)` & Dialog WAJIB Menggunakan `WiseI18n.t(...)`**:
  - **DILARANG KERAS men-hardcode teks bahasa Indonesia atau string literal** pada pemanggilan dialog notifikasi (contoh SALAH: `this.showInfo('Berhasil', 'Data tersimpan', 'success')`).
  - Seluruh parameter judul dan isi pesan pada `this.showInfo` **WAJIB** menggunakan `WiseI18n.t(...)`:
    `this.showInfo(WiseI18n.t('SUCCESS_TITLE'), WiseI18n.t('DATA_SAVED_SUCCESS'), 'success')`
    `this.showInfo(WiseI18n.t('CONFIRMATION_TITLE'), WiseI18n.t('DELETE_CONFIRMATION_MSG'), 'warning')`
    `this.showInfo(WiseI18n.t('VALIDATION_ERROR'), WiseI18n.t('FIELD_REQUIRED_MSG'), 'error')`
  - **DILARANG MENGGUNAKAN browser native `alert(...)` atau `confirm(...)`**: Selalu gunakan `this.showInfo(...)` atau dialog framework WAS dengan key terjemahan `WiseI18n.t(...)`.
- **Context Menu Items WAJIB Internationalization**:
  - Seluruh item pada context menu data table (`dt.addContextMenu([...])`) **WAJIB** menggunakan `WiseI18n.t(...)` pada properti `label` (contoh: `{ id: 'edit', label: WiseI18n.t('EDIT_DOKUMEN_MENU'), onClick: ... }`).
  - **DILARANG KERAS men-hardcode string literal** pada context menu seperti `label: 'Edit Dokumen'`, `label: 'Hapus Dokumen'`, `label: 'Edit Pengalaman'`, `label: 'Hapus Riwayat Karir'`, dsb.
- **WAJIB Mendaftarkan Lengkap ke 6 Bahasa di `WiseI18n.js`**:
  - Setiap kali menambahkan key baru di `WiseI18n.t('KEY_NAME')`, key tersebut **WAJIB LANGSUNG DIDAFTARKAN** ke kamus terjemahan `WiseI18n.js` untuk **SELURUH 6 BAHASA**: Indonesian (`id`), English (`en`), German (`de`), Spanish (`es`), French (`fr`), dan Arabic (`ar`). Jangan hanya mendaftarkan sebagian bahasa.
- **DILARANG MEMBUAT FUNGSI `t(key)` LOKAL/SENDIRI DI DALAM FORM/WINDOW**: Dilarang keras membuat method atau helper `t(key)` / `this.t(key)` sendiri di dalam class window atau form. Selalu gunakan fungsi `WiseI18n.t(key)` secara langsung dari `WiseI18n.js` (`const WiseI18n = ...` lalu panggil `WiseI18n.t(...)`). Seluruh kode form/window yang masih memiliki fungsi `t(key)` sendiri harus dibersihkan.

## 4. Dialog & Notification Rules (showInfo & this.confirm)
- **DILARANG KERAS MENGGUNAKAN Browser Native `alert(...)` atau `window.alert(...)`**:
  - Selalu gunakan `this.showInfo(title, message, type)`.
  - Type yang didukung: `'information'`, `'success'`, `'warning'`, atau `'error'`.
  - Parameter judul dan pesan **WAJIB** menggunakan `WiseI18n.t(...)`:
    ```javascript
    this.showInfo(WiseI18n.t('BERHASIL'), WiseI18n.t('DATA_SAVED_SUCCESS'), 'success');
    this.showInfo(WiseI18n.t('PERINGATAN'), WiseI18n.t('PILIH_BARIS_DATA_TERLEBIH_DAHULU'), 'warning');
    this.showInfo(WiseI18n.t('ERROR'), err.message, 'error');
    ```
- **DILARANG KERAS MENGGUNAKAN Browser Native `confirm(...)` atau `window.confirm(...)`**:
  - Selalu gunakan `await this.confirm(title, message, options)`.
  - Fungsi ini menampilkan modal popup custom window WAS dengan tombol Batal dan Konfirmasi dan mengembalikan `Promise<boolean>` (`true` jika disetujui, `false` jika dibatalkan/ditutup).
  - Judul, pesan, dan teks tombol konfirmasi **WAJIB** menggunakan `WiseI18n.t(...)`:
    ```javascript
    const confirmed = await this.confirm(
      WiseI18n.t('KONFIRMASI_HAPUS'),
      `${WiseI18n.t('APAKAH_ANDA_YAKIN_INGIN_MENGHAPUS')} "${item.name}"? ${WiseI18n.t('TINDAKAN_INI_TIDAK_DAPAT_DIBATALKAN')}`,
      { type: 'danger', confirmText: WiseI18n.t('HAPUS_3') }
    );
    if (!confirmed) return;
    ```