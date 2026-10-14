# Backup & restore database Wiseape

Folder ini berisi cadangan (plain `.sql`) semua database PostgreSQL Wiseape, serta skrip untuk
membuat dan memulihkannya.

| File | Database | Lokasi | Aplikasi |
|---|---|---|---|
| `wiseape-application-system.sql` | `wiseape-application-system` | server `34.101.207.44` | WAS API (user, menu, aplikasi, tema, background) |
| `wiseape-hris.sql` | `wiseape-hris` | server `34.101.207.44` | HRIS (karyawan, organisasi, rekrutmen, ...) |
| `wiseape-report-designer.sql` | `wiseape-report-designer` | server `34.101.207.44` | Report Designer (connection, report group, report) |
| `wise-utilities.sql` | `wise-utilities` | server `34.101.207.44` | Utilities (link Kong Manager / Kafka UI) dan Event Messaging (webhook per topic + riwayat pengiriman) |
| `kong.sql` | `kong` | container Docker `kong-db` | konfigurasi Kong (juga tersimpan di `../utilities/kong-gateway/kong.yml`) |

> **PENTING - file `.sql` berisi data sensitif dan tidak boleh masuk git.** Dump berisi email, hash dan
> salt password pengguna, data karyawan (NIK, rekening bank, gaji, NPWP, BPJS), dan password
> koneksi yang terenkripsi. Repo ini publik. `.gitignore` di folder ini mengabaikan `*.sql`; simpan
> dump di tempat yang aman (disk terenkripsi / penyimpanan privat), bukan di GitHub.
> Token sesi login (`wiseape_sessions`) sengaja **tidak** ikut di-dump.

## Membuat backup

Dibutuhkan `pg_dump` (client PostgreSQL; versinya harus sama atau lebih baru dari server, server
saat ini PostgreSQL 15) dan, untuk Kong, container `kong-db` yang sedang berjalan.

```bash
cd server/databases
./backup.sh              # semua database
./backup.sh hris         # satu saja: was | hris | report | utilities | kong
```

Alamat, nama database, user dan password dibaca dari file `.env` masing-masing aplikasi di
`server/applications/<Aplikasi>/.env` (tidak ada kredensial di skrip). Dump dibuat dengan
`--clean --if-exists --no-owner --no-privileges`, dan baris `SET transaction_timeout` (hanya dikenal
PostgreSQL 17) dibuang agar bisa di-restore ke PostgreSQL 13 ke atas.

## Memulihkan (restore)

Restore memakai `--clean --if-exists`: **tabel yang ada di dump di-DROP lalu dibuat ulang**
di database tujuan. Data yang ada di tabel itu akan hilang. Database tujuan harus sudah ada.

### Cara cepat (database yang sama)

```bash
cd server/databases
./restore.sh hris        # was | hris | report | utilities | kong
```
Skrip meminta konfirmasi, membaca tujuan dari `.env` aplikasi, dan berjalan dalam satu transaksi
(gagal sebagian = tidak ada yang berubah).

### Cara manual / ke server lain

1. Siapkan database kosong di server tujuan (butuh hak `CREATEDB`):
   ```bash
   createdb -h <host> -p 5432 -U <user> "wiseape-hris"
   ```
2. Restore:
   ```bash
   psql -h <host> -p 5432 -U <user> -d "wiseape-hris" \
        --set ON_ERROR_STOP=1 --single-transaction -f wiseape-hris.sql
   ```
   (`PGPASSWORD=... psql ...` atau `~/.pgpass` agar tidak ditanya password.)
3. Arahkan aplikasi ke database itu lewat `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`,
   `DB_PASSWORD` di `.env`-nya, lalu jalankan ulang server.
4. Periksa hasilnya, misalnya `select count(*) from employees where deleted_at is null;`.

Dump dibuat tanpa pemilik (`--no-owner`), jadi semua objek dimiliki user yang menjalankan restore.
Jika memakai user lain dari `nodeuser`, beri hak ke user aplikasi (`GRANT ALL ON ALL TABLES IN
SCHEMA public TO <user>;` dan sequences).

### Kong

Kong menyimpan konfigurasinya di database `kong` (container `kong-db`, volume `kong_data`).

```bash
cd server/utilities/kong-gateway
docker compose up -d kong-db
docker compose stop kong                 # jangan biarkan Kong menulis saat tabel diganti
cd ../../databases && ./restore.sh kong
cd ../utilities/kong-gateway && docker compose start kong
```
Alternatif yang lebih ringan: untuk Kong cukup muat ulang `../utilities/kong-gateway/kong.yml`
dengan decK (lihat README di folder itu) - tidak perlu `kong.sql`.

### Setelah restore

- **Restart server client** (`./stop.sh && ./start.sh`): server Express client menyimpan daftar menu
  dan aplikasi di memori.
- Semua pengguna harus **login ulang** (sesi tidak ikut di-backup).
- Report Designer: password koneksi database di `rd_connections` terenkripsi dengan
  `CONNECTION_SECRET` dari `.env` server Report Designer. Restore ke instalasi dengan
  `CONNECTION_SECRET` berbeda membuat password itu tidak bisa didekripsi - isi ulang password
  koneksinya lewat Report Designer.

## Hasil verifikasi backup ini

Kelima dump di-restore ke container PostgreSQL 15 sementara tanpa error, dan jumlah barisnya
dibandingkan dengan database asli (mis. `employees` 36 = 36, `wiseape_users` 11 = 11,
`wiseape_menus` 14 = 14, `kong.routes` 7 = 7).
