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
- **WAJIB Border pada Semua Input Controls (DILARANG MENGHILANGKAN BORDER)**:
  - **DILARANG KERAS MENGHILANGKAN BORDER** (`border: none`, `border: 0`, `border-none`, `border-transparent`, `outline: none` tanpa border) pada seluruh input controls (`WiseTextBox`, `WiseComboBox`, `WiseDate`, `WiseDateRange`, `WiseNumericBox`, `WiseTextArea`, search input, dll.).
  - Seluruh input controls **WAJIB** memiliki border 1px solid yang jelas, tegas, dan kontras (`border: 1px solid #94a3b8` / `border border-slate-300`). Jangan pernah membuat input tanpa border/borderless.
  - **Flat Input Controls (Dilarang 3D / Shadow)**: DILARANG KERAS membuat input controls dengan efek 3D, inset shadow, drop shadow, atau bevel. Semua control input WAJIB dibuat flat dan bersih dengan border 1px yang jelas (solid flat border) tanpa shadow sama sekali (`shadow-none` / `boxShadow: 'none'`).

## 2. Form & Window Architecture
- **Sub-Records / Child Data Table Architecture**: Dilarang membuat form input inline di bawah data table untuk penambahan/pengeditan sub-records (misal: Dokumen, Pengalaman Kerja, Pendidikan, Riwayat Karir). Sediakan tombol aksi ("➕ Tambah", "✏️ Edit", "🗑️ Hapus") dan context menu di tabel yang memanggil form dialog terpisah melalui `this.openWindow(...)`.
- **DataTable pada Form Input / Edit Wajib Header Grey & Navigasi Grey**:
  - Setiap `WiseDataTable` yang berada di dalam window/form input atau edit (misalnya tab sub-record di `WinEmployeeEdit`: Dokumen, Pengalaman, Pendidikan, Karir, Keluarga) **WAJIB** memakai `headerStyle` dengan warna grey, bukan header default berwarna aksen tema: `new WiseDataTable({ id: '...', pageSize: 6, headerStyle: { background: '#e2e8f0', color: '#334155' } })`.
  - Gunakan satu konstanta bersama per file (contoh: `const GREY_TABLE_HEADER = { background: '#e2e8f0', color: '#334155' };`), jangan menulis ulang nilai warna di tiap tabel.
  - `headerStyle` otomatis menghilangkan garis pemisah antara header dan baris, serta mewarnai tombol halaman aktif pada navigasi/pager (atas dan bawah) dengan warna grey yang sama. Jangan menambahkan garis atau warna aksen lain pada header maupun navigasi tabel tersebut.
  - Aturan ini khusus untuk DataTable di form input/edit. DataTable pada window daftar/manajemen (misalnya `WinEmployeeManagement`) tetap memakai header default tema.
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
- **WiseIconMenu (Icon Menu / Toolbar Icon) WAJIB Internationalization**:
  - Setiap `new WiseIconMenu(...)` **WAJIB** membungkus **label (argumen pertama)** dan **`description`** dengan `WiseI18n.t('KEY_SIMBOLIK')`, contoh: `new WiseIconMenu(WiseI18n.t('MENU_EMPLOYEE_ADD'), { id: 'btnMenuAdd', icon: ..., description: WiseI18n.t('MENU_EMPLOYEE_ADD_DESC'), onClick: ... })`.
  - **DILARANG KERAS** menulis teks literal (misalnya `'Add Employee'`, `'Karyawan Baru'`) langsung di `WiseIconMenu`. Label dan description tidak boleh dicampur bahasa (satu Inggris, satu Indonesia); keduanya harus berupa key i18n.
  - Semua key (label dan `_DESC`) wajib terdaftar lengkap di kamus `WiseI18n.js` untuk seluruh bahasa yang didukung (`id`, `en`, `de`, `es`, `fr`, `ar`).
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

## 5. Checklist Wajib Saat Membuat Service / Aplikasi Baru
Membuat service backend, aplikasi client, tabel/database, atau infrastruktur Docker baru **BELUM SELESAI** sebelum
semua poin yang relevan di bawah dikerjakan dan **diverifikasi sungguhan** (jalankan, `curl`, restore) — bukan hanya "kode sudah ditulis".
Daftar layanan, port, dan URL ada di `server/README.md` (sumber kebenaran; selalu perbarui).

### 5.1 Service backend baru (`server/applications/<Nama>`)
- [ ] **Port**: pakai port kosong berikutnya, jangan bentrok (terpakai: client 3000, WAS 4000, HRIS 4001, Report 4002, Utilities 4003, EventMessaging 4004, Vite 5173, Kong 8000/8001/8002/8443, Kafka 9092, Kafka UI 8085). Hindari "bad ports" fetch (mis. 5060, 6000, 6665-6669, 10080).
- [ ] **Konvensi**: Express + cors + morgan + dotenv; `npm run dev` = `node --watch --env-file=.env app.js` dan `npm start`; respons `{success, data}` / `{success:false, message}`; `GET /` mengembalikan JSON info server (service, name, description, version, status, environment, port, startedAt, uptimeSeconds, timestamp, endpoints) dan `GET /api` indeks endpoint; graceful shutdown. Contoh: `server/applications/Utilities`.
- [ ] **Rahasia**: kredensial hanya di `.env` (di-ignore git) + `.env.example` berisi placeholder. **Dilarang** password default di kode, mencetak/menampilkan password, atau meng-commit `.env`.
- [ ] **Kong**: tambahkan service + route di `server/utilities/kong-gateway/kong.yml` (upstream `host.docker.internal:<port>`, `strip_path: true`, path `/<awalan>`), lalu `cd server/utilities/kong-gateway && docker compose --profile tools run --rm deck gateway diff /config/kong.yml --kong-addr http://kong:8001` (periksa: hanya penambahan), lalu jalankan tanpa `gateway diff` untuk menerapkan. Uji `curl http://localhost:8000/<awalan>`. Perbarui tabel di `server/utilities/kong-gateway/README.md`. Jangan mengubah/menghapus route lain; menghapus `X-Frame-Options` atau membuka port Kong ke jaringan butuh persetujuan eksplisit user.
- [ ] **`start.sh` dan `stop.sh`** (root): tambahkan target (`run` + `wait_port` + teks usage + daftar port di `stop.sh`).
- [ ] **Database**: tabel dibuat otomatis saat start (idempotent, aman dijalankan berulang). Jika memakai **database baru atau tabel baru**, lihat 5.3.
- [ ] **Dokumentasi**: `README.md` di folder service (endpoint, variabel env tanpa nilai rahasia, cara menjalankan) dan perbarui `server/README.md` (tabel layanan, peta Kong, tabel database, variabel client, urutan start).
- [ ] **Uji sungguhan lalu bersihkan**: jalankan service, uji tiap endpoint dengan `curl` termasuk kasus error, hapus data uji yang dibuat (baris DB, topic Kafka, dll.). **Hentikan hanya proses yang Anda mulai sendiri** (pakai PID/port) — **DILARANG `pkill -f app.js`** atau pola serupa, karena mematikan server user yang sedang berjalan. Setelah selesai, pastikan server user masih hidup (`lsof -i :<port>`).

### 5.2 Aplikasi client baru (`client/applications/<Grup>/App<Nama>.js`)
- [ ] **Registrasi di WAS** (otomatis saat WAS API start, jangan minta user menjalankan SQL): tambah aplikasi di `server/applications/WiseapeApplicationSystem/src/models/appsModel.js` (daftar seed di `ensureAdminAppSeeded` **dan** `FALLBACK_APPS`) serta menu di `menusModel.js` (seed di `ensureAdminMenuSeeded` **dan** `FALLBACK_MENUS`). Tentukan `show_in_taskbar` (aplikasi pendukung/utilitas = `false`, tetap muncul di Launchpad). Memuat ulang menu butuh restart server client (Express menyimpan menu di memori).
- [ ] **Repository API**: base URL default lewat Kong (`http://localhost:8000/<awalan>/api`), bisa ditimpa env (`<NAMA>_API_URL`); tambahkan ke `client/.env.example` dan tabel variabel di `server/README.md`. Jangan menulis URL `localhost:<port>` langsung ke service.
- [ ] **Kontrol/komponen baru** di `client/system/controls/`: daftarkan di `client/index.html` (tag script), `client/src/runtime/wise.js` (export), dan dokumentasikan di `docs/API_REFERENCE.md`.
- [ ] **Aturan UI/i18n** pada Bagian 1-4 (semua teks `WiseI18n.t`, 6 bahasa, `label:` pada input, header DataTable grey di form input, dst.) dan `README.md` aplikasi.
- [ ] `cd client && npx vite build` harus lolos; jelaskan ke user bahwa UI belum diuji visual jika Anda tidak bisa membuka browser.

### 5.3 Database / tabel baru
- [ ] **Backup**: database baru → tambahkan ke `server/databases/backup.sh` (fungsi `dump_app <label> <folder>` + baris `case`) dan `restore.sh`, serta tabel di `server/databases/README.md`. Tabel baru di database yang sudah ada → jalankan ulang `./backup.sh <label>`.
- [ ] **Verifikasi restore** ke container PostgreSQL sementara dengan versi **sama dengan server (15)** (`docker run -d --name pg15-restore-test -e POSTGRES_PASSWORD=test postgres:15`), `psql --set ON_ERROR_STOP=1 --single-transaction -f <dump>.sql`, bandingkan jumlah baris, lalu hapus container uji.
- [ ] **`*.sql` TIDAK BOLEH di-commit** (repo publik; dump berisi PII, hash password, kredensial terenkripsi). `server/databases/.gitignore` sudah mengabaikannya. Kecualikan data kredensial hidup (mis. `--exclude-table-data=wiseape_sessions`).

### 5.4 Infrastruktur Docker baru (`server/utilities/<nama>`)
- [ ] `restart: unless-stopped`; port dipublikasikan hanya ke `127.0.0.1` jika tanpa autentikasi; image di-pin versinya; volume bernama untuk data.
- [ ] README (alamat, start/stop, uji cepat), tambahkan ke `server/README.md`, dan jika punya UI web yang perlu tampil di aplikasi: route Kong berbasis host (lihat 5.1) dengan persetujuan user.

### 5.5 Sebelum commit / push
- [ ] Periksa `git diff --cached --name-only`: tidak ada `.env`, `*.sql`, `node_modules`, atau password. Tidak push langsung ke `main` kecuali user memintanya; jika diminta, push ke `main`.
- [ ] Laporkan jujur: apa yang sudah diuji, apa yang belum (mis. UI tidak dilihat di browser, driver tanpa instance uji), dan efek samping (restart yang dibutuhkan).
