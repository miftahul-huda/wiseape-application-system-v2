# Server Wiseape - daftar layanan & URL

Semua layanan di bawah ini berjalan di mesin lokal. Aplikasi client mengaksesnya **lewat Kong gateway**
(`http://localhost:8000`); URL asli (langsung ke port layanan) tetap bisa dipakai untuk debugging.

```
Browser ──► Kong proxy :8000 ──► /was      ──► WAS API          :4000
                             ├─► /hris     ──► HRIS API         :4001
                             ├─► /report   ──► Report API       :4002
                             ├─► /utilities──► Utilities API    :4003
                             ├─► /event-messaging ──► Event Messaging API :4004
                             ├─► /desktop  ──► Client Express   :3000
                             ├─► kafka-ui.localhost        ──► Kafka UI      :8085
                             └─► kong-manager.localhost    ──► Kong Manager  :8002
Aplikasi ──► Kafka broker localhost:9092        PostgreSQL 34.101.207.44:5432 (5 database, lihat bawah)
```

## 1. Layanan aplikasi

| Layanan | URL via Kong | URL asli | Folder | Menjalankan |
|---|---|---|---|---|
| **WAS API** (Wiseape Application System: user, menu, aplikasi, tema) | `http://localhost:8000/was` | `http://localhost:4000` | `applications/WiseapeApplicationSystem` | `./start.sh was` |
| **HRIS API** (karyawan, organisasi, rekrutmen) | `http://localhost:8000/hris` | `http://localhost:4001` | `applications/HRIS` | `./start.sh hris` |
| **Report Designer API** | `http://localhost:8000/report` | `http://localhost:4002` | `applications/ReportDesigner` | `./start.sh report` |
| **Utilities API** (link Kong/Kafka Manager) | `http://localhost:8000/utilities` | `http://localhost:4003` | `applications/Utilities` | `./start.sh utilities` |
| **Event Messaging API** (kirim pesan ke Kafka, consumer semua topic, webhook per topic) | `http://localhost:8000/event-messaging` | `http://localhost:4004` | `applications/EventMessagingApi` | `./start.sh events` |
| **Client** (Express: shell desktop + `/api/*` internal) | `http://localhost:8000/desktop` | `http://localhost:3000` | `../client` | `./start.sh client` |
| **Client dev** (Vite, hanya development) | - (tidak dilewatkan Kong) | `http://localhost:5173` | `../client` | `./start.sh vite` |

`./start.sh` (tanpa argumen) menjalankan semuanya, `./stop.sh` menghentikannya (lihat folder root).
Buka aplikasinya di **`http://localhost:3000`** (atau `5173` saat development), bukan `/desktop`:
route `/desktop` ada untuk proxy Vite dan hanya meneruskan path `/api/*` dan aset ke client Express.

Pemetaan path (Kong memakai `strip_path: true`, awalan route dibuang sebelum diteruskan):

| Via Kong | Diteruskan ke |
|---|---|
| `http://localhost:8000/was/api/apps` | `http://localhost:4000/api/apps` |
| `http://localhost:8000/hris/api/employees` | `http://localhost:4001/api/employees` |
| `http://localhost:8000/report/api/reports` | `http://localhost:4002/api/reports` |
| `http://localhost:8000/utilities/api/links` | `http://localhost:4003/api/links` |
| `http://localhost:8000/event-messaging/api/...` | `http://localhost:4004/api/...` |

Setiap API menjawab **`GET /`** dengan info server (nama, versi, status, uptime) dan `GET /api` untuk
indeks endpoint (kecuali WAS API, yang daftar resource-nya ada di jawaban `GET /`):

```bash
curl http://localhost:8000/was ; curl http://localhost:8000/hris
curl http://localhost:8000/report ; curl http://localhost:8000/utilities
```

### Event Messaging API  (`applications/EventMessagingApi`)

Menyimpan pesan ke topic Kafka lewat REST dan memanggil **webhook yang terdaftar untuk topic itu** setiap kali
sebuah pesan diterima (consumer berlangganan ke semua topic non-internal).

| Endpoint (via Kong) | Fungsi |
|---|---|
| `POST http://localhost:8000/event-messaging/api/messages` | kirim pesan ke topic apa pun `{topic, key?, payload, headers?}` |
| `POST http://localhost:8000/event-messaging/api/client-application-events` | kirim ke topic `CLIENT_APPLICATION_EVENT` `{application, event, data?}` |
| `GET/POST/PUT/DELETE .../event-messaging/api/webhooks` | kelola pemetaan topic -> URL webhook (juga lewat aplikasi **Event Message Manager**) |
| `POST .../event-messaging/api/webhooks/:id/test` | uji satu webhook |
| `GET .../event-messaging/api/deliveries`, `/topics`, `/health` | riwayat pengiriman, daftar topic Kafka, status |

Tabel di database `wise-utilities`: `event_topic_webhooks`, `event_webhook_deliveries`. Broker Kafka: `localhost:9092`.
Detail (tanda tangan `X-Event-Signature`, retry, batasan): [applications/EventMessagingApi/README.md](applications/EventMessagingApi/README.md).

## 2. Kong gateway  (`utilities/kong-gateway`)

Kong 3.9 mode database (PostgreSQL di container `kong-db`). Semua port dipublikasikan **hanya ke `127.0.0.1`**.

| Apa | URL | Keterangan |
|---|---|---|
| Proxy HTTP | `http://localhost:8000` | semua route di atas |
| Proxy HTTPS | `https://localhost:8443` | sertifikat default Kong (self-signed) |
| Admin API | `http://localhost:8001` | kelola service/route; **jangan dibuka ke jaringan** |
| Kong Manager (UI), URL yang benar | `http://kong-manager.localhost:8000` | lewat proxy, header `X-Frame-Options` dihapus agar bisa di-embed |
| Kong Manager (UI), langsung | `http://localhost:8002` | halaman tampil, tetapi tidak bisa memanggil Admin API (CORS hanya mengizinkan origin `kong-manager.localhost:8000`) |
| Database Kong | container `kong-db` (`5432`, tidak dipublikasikan) | user `kong`, database `kong` |

Isi konfigurasi aktif (`utilities/kong-gateway/kong.yml`):

| Service Kong | Route | Upstream |
|---|---|---|
| `WASAPI` | path `/was` | `host.docker.internal:4000` |
| `HRISAPI` | path `/hris` | `host.docker.internal:4001` |
| `REPORTAPI` | path `/report` | `host.docker.internal:4002` |
| `UTILITIESAPI` | path `/utilities` | `host.docker.internal:4003` |
| `EVENTMESSAGINGAPI` | path `/event-messaging` | `host.docker.internal:4004` |
| `WISEDESKTOPAPI` | path `/desktop` | `host.docker.internal:3000` |
| `KONGMANAGER` | host `kong-manager.localhost` | `localhost:8002` (di dalam container Kong) |
| `KAFKAUI` | host `kafka-ui.localhost` | `host.docker.internal:8085` |

Upstream memakai `host.docker.internal` karena Kong berjalan di container (`localhost` di sana = container Kong).
Dua route berbasis host memakai plugin `response-transformer` yang menghapus `X-Frame-Options`
(agar Kong Manager dan Kafka UI bisa tampil di dalam window `WiseWebView`). `*.localhost` otomatis
mengarah ke 127.0.0.1 di Chrome dan Firefox.

```bash
cd server/utilities/kong-gateway
docker compose up -d                           # Kong + database
docker compose --profile tools run --rm deck   # muat kong.yml (idempotent; menghapus yang tidak ada di file)
```
Detail: [utilities/kong-gateway/README.md](utilities/kong-gateway/README.md).

## 3. Kafka  (`utilities/kafka`)

Apache Kafka 3.9 (satu broker, mode KRaft tanpa ZooKeeper) dan Kafka UI (kafbat). Container otomatis hidup lagi
(`restart: unless-stopped`); Docker Desktop harus ikut menyala saat login.

| Apa | URL | Keterangan |
|---|---|---|
| Kafka broker, dari mesin ini | `localhost:9092` | listener `EXTERNAL`, tanpa autentikasi, hanya `127.0.0.1` |
| Kafka broker, dari container lain | `kafka:29092` | listener `PLAINTEXT`; gabung ke jaringan Docker `kafka-net` |
| Controller KRaft | `kafka:9093` | internal, tidak dipublikasikan |
| Kafka UI, URL via Kong | `http://kafka-ui.localhost:8000` | dipakai aplikasi Utilities (di-embed) |
| Kafka UI, URL asli | `http://localhost:8085` | tampil langsung di tab browser; **tidak** bisa di-embed (`X-Frame-Options: DENY`) |

```bash
cd server/utilities/kafka && docker compose up -d     # start; docker compose ps -> kafka "healthy"
```
Detail: [utilities/kafka/README.md](utilities/kafka/README.md).

## 4. Database PostgreSQL

Server `34.101.207.44:5432` (user `nodeuser`; kredensial hanya di `.env` tiap aplikasi, tidak di repo).

| Database | Dipakai oleh |
|---|---|
| `wiseape-application-system` | WAS API (`applications/WiseapeApplicationSystem/.env`) |
| `wiseape-hris` | HRIS API (`applications/HRIS/.env`) |
| `wiseape-report-designer` | Report Designer API (`applications/ReportDesigner/.env`) |
| `wise-utilities` | Utilities API dan Event Messaging API (`applications/Utilities/.env`, `applications/EventMessagingApi/.env`) |
| `kong` | Kong, di container `kong-db` (bukan server di atas) |

Backup & restore: [databases/README.md](databases/README.md).

## 5. Alamat yang dipakai aplikasi client

Kode client mengarah ke Kong (default di kodenya; bisa ditimpa lewat `client/.env`):

| Variabel | Nilai | Dipakai oleh |
|---|---|---|
| `API_BASE_URL` | `http://localhost:8000/was` | repository WAS (menu, aplikasi, tema, login), server Express client |
| `HRIS_API_URL` | `http://localhost:8000/hris/api` | aplikasi HRIS (di browser nilai default di kode yang berlaku) |
| `REPORT_DESIGNER_API_URL` | `http://localhost:8000/report/api` | aplikasi Report Designer / Viewer |
| `UTILITIES_API_URL` | `http://localhost:8000/utilities/api` | aplikasi Utilities (Kong/Kafka Manager) |
| `EVENT_MESSAGING_API_URL` | `http://localhost:8000/event-messaging/api` | aplikasi Event Message Manager |
| `WAS_SERVER_URL` | `http://localhost:8000/desktop` | proxy Vite (`npm run dev:web`) |

Kong harus berjalan sebelum server client dijalankan (server client memuat daftar aplikasi dari WAS API lewat Kong).

## 6. Urutan menjalankan dari nol

```bash
# 1. infrastruktur Docker
(cd server/utilities/kong-gateway && docker compose up -d && docker compose --profile tools run --rm deck)
(cd server/utilities/kafka && docker compose up -d)

# 2. layanan aplikasi + client (menunggu port 4000..4004 siap sebelum client dijalankan)
./start.sh
```

Cek cepat:

```bash
curl http://localhost:8000/was/api/menus            # WAS API lewat Kong
curl -s localhost:8001 | head -c 80                 # Admin API Kong
docker compose -f server/utilities/kafka/docker-compose.yml ps
```
