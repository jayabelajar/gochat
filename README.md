# GoChat — Real-Time Engineering & Community Communication Platform

[![Go Version](https://img.shields.io/badge/Go-1.25+-00ADD8?style=flat-square&logo=go)](https://golang.org/)
[![Next.js Version](https://img.shields.io/badge/Next.js-16+-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=flat-square&logo=redis)](https://redis.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

> **GoChat** adalah platform komunikasi komunitas real-time modern yang dirancang khusus untuk tim pengembang, organisasi perangkat lunak, dan komunitas daring. Menggabungkan arsitektur backend berkecepatan tinggi menggunakan **Golang** dengan antarmuka web modern bergaya Discord/Linear berbasis **Next.js 16 (App Router)** dan **Tailwind CSS**.

---

## 📸 Tampilan Antarmuka (UI Preview)

### 1. Landing Page (`/`)
Halaman pengenalan platform yang komprehensif, mencakup rincian performa latensi P99 WebSocket, fitur engineering, diagram arsitektur modular monolith, paket harga transparan, dan FAQ interaktif.

### 2. Workspace & Real-Time Chat (`/app`)
- **Server Rail**: Navigasi multi-komunitas dengan animasi server pill aktif, tombol cepat *Direct Messages*, dan pembuat komunitas.
- **Channel Sidebar**: Pengelompokan channel teks per kategori, topic bar, dan integrasi panel audio/voice.
- **Chat Timeline**: Pengiriman pesan instan (optimistic UI), indikator kehadiran *"User is typing..."*, dukungan reaksi emoji (🚀, 🔥, 👍), penyuntingan inline, dan attachment snippet kode.
- **Member Sidebar**: Pengelompokan anggota komunitas secara real-time berdasarkan status kehadiran (*Online*, *Idle*, *Do Not Disturb*, *Offline*).
- **User Popover Panel**: Konfigurasi profil, tag keahlian engineering, dan pemilih status kehadiran langsung.
- **Responsif di Semua Perangkat**: Dukungan penuh untuk layar Mobile, Tablet, dan Desktop melalui slide-out drawers dan touch-friendly controls.

### 3. Autentikasi Pengguna
- **Login (`/login`)**: Autentikasi aman berbasis JWT Access Token & Refresh Token.
- **Registrasi (`/register`)**: Pembuatan akun baru dengan validasi username handle dan hashing bcrypt.
- **Reset Password (`/reset-password`)**: Pembaruan kata sandi akun secara mandiri.

---

## 🏛️ Arsitektur Sistem

```
+---------------------------------------------------------------------------------+
|                                 CLIENT CLIENTS                                  |
|         Next.js App Router  /  TypeScript  /  Tailwind CSS  /  Zustand          |
+---------------------------------------+-----------------------------------------+
                                        |  REST API (/api/v1) & WebSocket (/ws)
                                        v
+---------------------------------------------------------------------------------+
|                              GOCHAT BACKEND (Go 1.25+)                          |
|  [ Gin HTTP Engine ] <---> [ WebSocket Hub ] <---> [ Auth / JWT & RBAC Guard ]   |
|         |                          |                           |                |
|         v                          v                           v                |
|  [ Repository Layer ] <---> [ Service Layer ] <-----> [ Event Broadcaster ]     |
+---------+--------------------------+---------------------------+----------------+
          |                          |                           |
          v                          |                           v
+-----------------------+            |            +-------------------------------+
|     PostgreSQL 16     |            +----------->|            Redis 7            |
| 18 Relational Tables  |                         |  Pub/Sub Cross-Nodes Broadcast|
| UUID Keys / Migrator  |                         |  User Presence TTL Heartbeat  |
+-----------------------+                         +-------------------------------+
```

---

## 🛠️ Tech Stack & Ekosistem

| Layer | Komponen & Pustaka | Keterangan |
|---|---|---|
| **Backend** | Go (v1.25+), Gin Web Framework | High-throughput HTTP routing, middleware pipeline |
| **Real-Time** | `coder/websocket` | Standard RFC 6455 WebSocket dengan zero-allocation reader loop |
| **Database** | PostgreSQL 16, `pgx/v5` | Database relasional dengan UUID extension dan indeks optimal |
| **Caching & PubSub** | Redis 7, `go-redis/v9` | Distribusi event lintas instance dan status kehadiran berbasis TTL |
| **Frontend** | Next.js 16 (App Router), React 19 | Server-side rendering dan static prerendering dengan Turbopack |
| **State Management** | Zustand | Global stores untuk autentikasi, chat channels, dan WebSocket events |
| **Styling** | Tailwind CSS, Lucide Icons | Discord-inspired dark palette (`#111214`, `#17181B`, `#222327`, `#5865F2`) |
| **DevOps & Deploy** | Docker, Docker Compose | Orkestrasi kontainer dengan auto-migration schema |

---

## 📂 Struktur Repositori

```
gochat/
├── backend/
│   ├── cmd/server/main.go          # Entrypoint HTTP Server & WebSocket Gateway
│   ├── internal/
│   │   ├── config/                 # Parser environment variable
│   │   ├── database/               # Driver pgxpool & migrasi otomatis SQL
│   │   ├── handler/                # REST API & WebSocket Controller
│   │   ├── middleware/             # JWT Guard & CORS Middleware
│   │   ├── models/                 # Struct data 18 entitas basis data
│   │   ├── redis/                  # Redis Client dengan graceful in-memory fallback
│   │   ├── repository/             # Data access layer PostgreSQL
│   │   ├── service/                # Business logic layer
│   │   └── websocket/              # WebSocket Hub, event pump, dan protocol
│   ├── migrations/                 # DDL PostgreSQL (000001_init_schema.up.sql)
│   ├── go.mod & go.sum
│   └── Dockerfile
├── frontend/
│   ├── app/
│   │   ├── page.tsx                # Professional Landing Page
│   │   ├── app/page.tsx            # Interactive 5-Panel Real-Time Workspace
│   │   ├── login/page.tsx          # Login Page
│   │   ├── register/page.tsx       # Registration Page
│   │   ├── reset-password/page.tsx # Reset Password Page
│   │   ├── layout.tsx & globals.css
│   ├── components/                 # Modals (CreateServer, JoinServer, CreateChannel)
│   ├── lib/                        # API fetcher & WebSocket singleton client
│   ├── stores/                     # Zustand authStore & chatStore
│   ├── types/                      # TypeScript data definitions
│   ├── package.json & pnpm-lock.yaml
│   └── Dockerfile
├── docker-compose.yml              # Orkestrasi Docker (PostgreSQL, Redis, Backend, Frontend)
├── .env.example                    # Template variabel lingkungan
├── PRD.MD                          # Dokumen Spesifikasi Produk (PRD)
└── README.md                       # Dokumentasi Utama
```

---

## 🚀 Panduan Memulai Cepat (Quick Start)

### Opsi 1: Menggunakan Docker Compose (Direkomendasikan)

1. Salin template variabel lingkungan:
   ```bash
   cp .env.example .env
   ```
2. Jalankan seluruh layanan:
   ```bash
   docker compose up -d --build
   ```
3. Akses aplikasi:
   - **Frontend Web**: [http://localhost:3000](http://localhost:3000)
   - **Backend API Health Check**: [http://localhost:8080/health](http://localhost:8080/health)

---

### Opsi 2: Menjalankan Mandiri di Lokal (Standalone)

#### 1. Jalankan Basis Data (PostgreSQL & Redis)
```bash
docker compose up -d postgres redis
```

#### 2. Menjalankan Backend Go
```bash
cd backend
go mod download
go run ./cmd/server
```
*Backend akan berjalan di port `8080` dan secara otomatis mengaplikasikan skema migrasi database.*

#### 3. Menjalankan Frontend Next.js
```bash
cd frontend
pnpm install
pnpm dev
```
*Buka browser di [http://localhost:3000](http://localhost:3000).*

---

## 🧪 Pengujian & Verifikasi

### Pengujian Unit Backend (Go)
```bash
cd backend
go test -v ./internal/service ./internal/websocket
```

### Build & Typecheck Frontend (Next.js)
```bash
cd frontend
pnpm build
```

---

## 📡 Protokol Event WebSocket (`/ws`)

Koneksi dibuat via: `GET /ws?token=<JWT_ACCESS_TOKEN>`

| Event | Arah | Keterangan |
|---|---|---|
| `message.create` | Server ➔ Client | Broadcast pesan baru di channel atau DM |
| `message.update` | Server ➔ Client | Pembaruan isi pesan yang diedit |
| `message.delete` | Server ➔ Client | Pemberitahuan ID pesan yang dihapus |
| `typing.start` | Dua arah | Indikator pengguna sedang mengetik |
| `typing.stop` | Dua arah | Indikator pengguna berhenti mengetik |
| `presence.online` | Server ➔ Client | Status pengguna menjadi Online |
| `presence.offline` | Server ➔ Client | Status pengguna menjadi Offline |
| `subscribe` | Client ➔ Server | Berlangganan event pada channel tertentu |
| `unsubscribe` | Client ➔ Server | Berhenti berlangganan channel |

---

## 📑 Spesifikasi REST API (`/api/v1`)

### 🔐 Autentikasi
- `POST /auth/register` — Mendaftarkan akun baru
- `POST /auth/login` — Masuk dan mendapatkan pasangan JWT token
- `POST /auth/refresh` — Memperbarui access token
- `POST /auth/logout` — Mencabut session token
- `POST /auth/reset-password` — Mereset kata sandi akun
- `GET /auth/me` — Mengambil profil pengguna yang sedang login

### 👥 Pengguna
- `GET /users?q=...` — Pencarian pengguna
- `GET /users/:id` — Detail profil pengguna
- `PATCH /users/me` — Memperbarui profil, avatar, bio, atau status kehadiran
- `POST /users/:id/block` — Memblokir pengguna
- `DELETE /users/:id/block` — Membuka blokir pengguna

### 🏢 Server Komunitas & Channel
- `GET /servers` — Daftar server yang diikuti
- `POST /servers` — Membuat server komunitas baru
- `POST /servers/join` — Bergabung ke server menggunakan kode undangan
- `GET /servers/:id` — Detail server
- `DELETE /servers/:id` — Menghapus server (khusus pemilik)
- `POST /servers/:id/leave` — Keluar dari server
- `GET /servers/:id/members` — Daftar anggota server beserta status kehadiran & peran
- `GET /servers/:id/channels` — Daftar channel dalam server
- `POST /servers/:id/channels` — Membuat channel teks baru

### 💬 Percakapan & Pesan
- `GET /channels/:id/messages?limit=50&cursor=...` — Riwayat pesan berbasis cursor
- `POST /channels/:id/messages` — Mengirim pesan ke channel
- `PATCH /messages/:id` — Mengedit pesan
- `DELETE /messages/:id` — Menghapus pesan
- `POST /messages/:id/reactions` — Memberikan reaksi emoji
- `GET /conversations` — Daftar percakapan pribadi (Direct Messages)
- `POST /conversations` — Membuat atau membuka percakapan 1-on-1
- `GET /conversations/:id/messages` — Mengambil pesan dalam percakapan pribadi
- `POST /conversations/:id/messages` — Mengirim pesan langsung

---

## 📜 Lisensi
Didistribusikan di bawah lisensi **MIT**. Silakan gunakan, kembangkan, dan modifikasi sesuai kebutuhan proyek atau komunitas Anda.
