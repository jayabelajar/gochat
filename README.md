# GoChat — Community Communication Platform

[![Go Version](https://img.shields.io/badge/Go-1.25+-00ADD8?style=flat&logo=go)](https://golang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16+-black?style=flat&logo=next.js)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat&logo=postgresql)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=flat&logo=redis)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat&logo=docker)](https://www.docker.com/)

GoChat is a real-time community communication platform inspired by Discord, built with a high-performance **Golang** backend and a modern **Next.js (App Router)** frontend.

---

## 🚀 Key Features

- **Authentication & Security:** JWT Access & Refresh token rotation, bcrypt password hashing, and user profile management.
- **Community Servers & Channels:** Create and manage servers, categories, text channels, and instant server invitation codes.
- **Real-Time WebSocket Engine:** Built with `coder/websocket`, supporting channel message broadcast, live typing indicators, and user presence synchronization (online, idle, dnd, offline).
- **Direct Messaging (DM) & Group DM:** 1-on-1 private messaging and conversation management.
- **Discord-Inspired Dark UI:** Dark-first color theme (`#111214`, `#1A1B1E`, `#17181B`, `#5865F2`), 5-panel layout (Server rail, Channel list, Chat view, Member sidebar, User status widget).
- **Resilience:** Graceful in-memory fallback when Redis is absent during local development, automatic database migration runner, and comprehensive test suite.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Backend** | Go 1.25+, Gin HTTP Framework, `coder/websocket`, `pgx/v5`, `go-redis/v9`, JWT |
| **Frontend** | Next.js (App Router), TypeScript, Tailwind CSS, Lucide React, Zustand |
| **Database & Cache** | PostgreSQL 16 (with UUID extensions), Redis 7 (Presence TTL & Pub/Sub) |
| **Infrastructure** | Docker, Docker Compose |

---

## 📁 Repository Structure

```
gochat/
├── backend/
│   ├── cmd/server/main.go          # HTTP & WebSocket Entry Point
│   ├── internal/
│   │   ├── config/                 # Environment & Config Loader
│   │   ├── database/               # PostgreSQL Connection Pool & Auto Migrator
│   │   ├── handler/                # REST & WS HTTP Handlers
│   │   ├── middleware/             # JWT & CORS Middlewares
│   │   ├── models/                 # Data Models & DTOs
│   │   ├── redis/                  # Redis Client with In-Memory Fallback
│   │   ├── repository/             # Database Repositories
│   │   ├── service/                # Business Logic Services
│   │   └── websocket/              # WebSocket Hub, Client Pump & Event Protocol
│   ├── migrations/                 # DDL SQL Schema (000001_init_schema.up.sql)
│   ├── go.mod & go.sum
│   └── Dockerfile
├── frontend/
│   ├── app/
│   │   ├── login/page.tsx          # Login Page
│   │   ├── register/page.tsx       # Registration Page
│   │   ├── page.tsx                # Main 5-Panel Workspace
│   │   ├── layout.tsx & globals.css
│   ├── components/                 # ServerSidebar, ChannelSidebar, ChatArea, MemberSidebar, Modals
│   ├── lib/                        # API Client & WebSocket Client
│   ├── stores/                     # Zustand Stores (authStore, chatStore)
│   ├── types/                      # TypeScript Interfaces
│   ├── package.json & pnpm-lock.yaml
│   └── Dockerfile
├── docker-compose.yml              # Complete Multi-Container Orchestration
├── .env.example                    # Sample Environment Variables
├── PRD.MD                          # Product Requirements Document
└── README.md
```

---

## ⚡ Quick Start

### Option 1: Run with Docker Compose (Recommended)

1. Clone the repository and copy `.env`:
   ```bash
   cp .env.example .env
   ```
2. Start all services:
   ```bash
   docker-compose up --build
   ```
3. Open in your browser:
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend API: [http://localhost:8080/health](http://localhost:8080/health)

---

### Option 2: Run Locally (Standalone)

#### 1. Backend Setup
```bash
cd backend
go mod download
go run ./cmd/server
```
*Note: The server will listen on port `8080`. If PostgreSQL or Redis are not reachable, the database gracefully informs you and Redis enters in-memory fallback mode.*

#### 2. Frontend Setup
```bash
cd frontend
pnpm install
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000).

---

## 🧪 Running Tests

### Backend Unit & Integration Tests
```bash
cd backend
go test -v ./internal/service ./internal/websocket
```

### Frontend Build & Typecheck
```bash
cd frontend
pnpm build
```

---

## 📡 WebSocket Event Protocol

Endpoint: `GET /ws?token=<JWT>`

| Event | Direction | Description |
|---|---|---|
| `message.create` | Server ➔ Client | Broadcast newly posted message |
| `message.update` | Server ➔ Client | Broadcast edited message |
| `message.delete` | Server ➔ Client | Broadcast deleted message ID |
| `typing.start` | Bidirectional | Notify that user is typing |
| `typing.stop` | Bidirectional | Notify that user stopped typing |
| `presence.online` | Server ➔ Client | User connected |
| `presence.offline` | Server ➔ Client | User disconnected |
| `subscribe` | Client ➔ Server | Subscribe to channel updates |
| `unsubscribe` | Client ➔ Server | Unsubscribe from channel |

---

## 📑 REST API Documentation

Prefix: `/api/v1`

### Authentication
- `POST /auth/register` — Register a new account
- `POST /auth/login` — Login with email and password
- `POST /auth/refresh` — Refresh access token using refresh token
- `POST /auth/logout` — Revoke session token
- `GET /auth/me` — Get current logged-in user profile

### Users
- `GET /users?q=...` — Search registered users
- `GET /users/:id` — Get user profile by ID
- `PATCH /users/me` — Update display name, bio, avatar, or status
- `POST /users/:id/block` — Block user
- `DELETE /users/:id/block` — Unblock user

### Servers & Channels
- `GET /servers` — List user's servers
- `POST /servers` — Create a new community server
- `POST /servers/join` — Join server with invite code
- `GET /servers/:id` — Get server details
- `DELETE /servers/:id` — Delete server (owner only)
- `POST /servers/:id/leave` — Leave server
- `GET /servers/:id/members` — Get server members with roles & presence
- `GET /servers/:id/channels` — Get channels for a server
- `POST /servers/:id/channels` — Create a new channel
- `GET /servers/:id/categories` — Get categories

### Messages & Reactions
- `GET /channels/:id/messages?limit=50&cursor=...` — Cursor-paginated message history
- `POST /channels/:id/messages` — Send channel message
- `PATCH /messages/:id` — Edit message content
- `DELETE /messages/:id` — Delete message
- `POST /messages/:id/reactions` — Add emoji reaction

### Direct Messages
- `GET /conversations` — List user's direct message conversations
- `POST /conversations` — Create or retrieve 1-on-1 conversation
- `GET /conversations/:id/messages` — Get direct conversation messages
- `POST /conversations/:id/messages` — Send direct message
