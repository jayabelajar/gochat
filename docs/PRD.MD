# PRODUCT REQUIREMENTS DOCUMENT (PRD)
# GoChat — Community Communication Platform

**Document Version:** 1.0  
**Product Name:** GoChat  
**Product Type:** Real-Time Community Communication Platform  
**Platform:** Web Application  
**Status:** Initial Product Specification

---

# 1. Product Overview

## 1.1 Background

Komunikasi digital telah menjadi kebutuhan penting bagi komunitas, organisasi, tim pengembang, dan kelompok online. Platform komunikasi modern membutuhkan lebih dari sekadar pertukaran pesan, tetapi juga pengelolaan komunitas, ruang diskusi, kolaborasi, dan komunikasi real-time.

GoChat merupakan platform komunikasi berbasis web yang menggabungkan konsep server komunitas, channel diskusi, dan direct messaging dalam satu aplikasi.

GoChat terinspirasi dari konsep Discord dengan pendekatan antarmuka modern, modular, dan berorientasi pada pengalaman pengguna.

## 1.2 Product Vision

Membangun platform komunikasi real-time yang memungkinkan pengguna membuat komunitas, mengelola anggota, berinteraksi melalui channel, serta berkomunikasi secara pribadi dalam satu ekosistem.

## 1.3 Product Goals

1. Menyediakan komunikasi real-time menggunakan WebSocket.
2. Memungkinkan pengguna membuat dan mengelola komunitas.
3. Menyediakan sistem server dan channel.
4. Mendukung private messaging dan group messaging.
5. Mengimplementasikan role-based access control.
6. Menyediakan sistem online presence dan notification.
7. Membangun backend yang scalable menggunakan Golang.

## 1.4 Target Users

- Individual users.
- Online communities.
- Software development teams.
- Student organizations.
- Gaming communities.
- Professional groups.

---

# 2. Technology Stack

## 2.1 Frontend

| Technology | Purpose |
|---|---|
| Next.js (App Router) | Frontend framework |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| shadcn/ui | UI components |
| Zustand | Client state management |
| TanStack Query | Server state management |
| React Hook Form | Form management |
| Zod | Schema validation |
| Socket Client | WebSocket communication |
| Lucide React | Icon library |

## 2.2 Backend

| Technology | Purpose |
|---|---|
| Go | Core backend language |
| Gin | HTTP framework |
| coder/websocket | WebSocket communication |
| sqlc | Type-safe SQL generation |
| pgx | PostgreSQL driver |
| PostgreSQL | Primary database |
| Redis | Cache and presence |
| Redis Pub/Sub | Cross-instance event distribution |
| JWT | Authentication |
| Swagger/OpenAPI | API documentation |

## 2.3 Infrastructure

| Technology | Purpose |
|---|---|
| Docker | Containerization |
| Docker Compose | Local infrastructure |
| MinIO / S3 | File storage |
| GitHub Actions | CI/CD |
| Prometheus | Metrics collection |
| Grafana | Monitoring |
| k6 | Load testing |

## 2.4 Architecture Principles

- Modular Monolith.
- RESTful API.
- Event-driven real-time communication.
- Repository and service separation.
- Stateless HTTP authentication.
- Database transaction consistency.
- Scalable WebSocket connection management.

---

# 3. User Roles

GoChat memiliki beberapa jenis pengguna.

| Role | Description |
|---|---|
| Guest | Pengunjung yang belum login |
| User | Pengguna terdaftar |
| Server Owner | Pemilik komunitas |
| Server Admin | Administrator komunitas |
| Moderator | Pengelola aktivitas komunitas |
| Member | Anggota komunitas |

Role dan permission dapat dikonfigurasi pada tingkat server.

---

# 4. Functional Requirements

## 4.1 Authentication & Account Management

Features:
- User registration.
- User login.
- User logout.
- JWT access token.
- Refresh token rotation.
- Password hashing.
- Profile management.
- Avatar upload.
- Password change.
- Session management.

Requirements:
- Email harus unik.
- Password disimpan menggunakan Argon2id atau bcrypt.
- Endpoint terproteksi harus memvalidasi identitas pengguna.
- Refresh token dapat dicabut saat logout.

## 4.2 User Management

Features:
- View user profile.
- Search users.
- Update username.
- Update avatar.
- Update user bio.
- Online status.
- Last seen.
- Block and unblock users.

## 4.3 Server Management

Server merupakan ruang komunitas utama.

Features:
- Create server.
- Edit server information.
- Delete server.
- Upload server icon.
- Join server melalui invitation.
- Leave server.
- Manage server members.
- Transfer server ownership.
- View server information.

Server memiliki:
- Server name.
- Description.
- Server icon.
- Owner.
- Member list.
- Categories.
- Channels.
- Roles.

## 4.4 Channel Management

Channel merupakan ruang komunikasi dalam server.

Channel types:
- Text Channel.
- Voice Channel (future development).

Features:
- Create channel.
- Edit channel.
- Delete channel.
- Reorder channel.
- Create channel category.
- Assign channel permissions.
- Manage channel members.

Setiap channel text terhubung dengan satu server.

## 4.5 Real-Time Messaging

Merupakan fitur utama GoChat.

Features:
- Send message.
- Receive message.
- Edit message.
- Delete message.
- Reply to message.
- Message reactions.
- Message history.
- Message pagination.
- Mention users.
- Unread message counter.
- Read receipt.

Message statuses:
- Sent.
- Delivered.
- Read.

Setiap pesan memiliki:
- Message ID.
- Conversation ID atau Channel ID.
- Sender ID.
- Content.
- Message type.
- Timestamp.
- Optional reply reference.

## 4.6 Direct Messaging

Features:
- Start private conversation.
- Send private messages.
- View conversation history.
- Search conversations.
- Online status.
- Read receipts.
- Block user.

Group DM:
- Create group conversation.
- Add members.
- Remove members.
- Rename group.
- Group avatar.

## 4.7 Presence System

Features:
- Online.
- Idle.
- Do Not Disturb.
- Offline.
- Last seen.

Presence menggunakan Redis dengan TTL untuk membantu mendeteksi koneksi yang sudah tidak aktif.

## 4.8 Typing Indicator

Features:
- Detect user typing.
- Broadcast typing event.
- Automatically stop typing indicator.
- Support multiple users in one channel.

Typing events bersifat ephemeral dan tidak perlu disimpan sebagai pesan permanen.

## 4.9 Role & Permission Management

Default roles:
- Owner.
- Admin.
- Moderator.
- Member.

Permissions:
- Manage server.
- Manage channels.
- Manage members.
- Manage roles.
- Send messages.
- Delete messages.
- Manage messages.
- Create invitation.
- Kick members.
- Ban members.

Permission harus diperiksa di backend, bukan hanya disembunyikan pada frontend.

## 4.10 Notification System

Features:
- New direct message notification.
- User mention notification.
- Group invitation notification.
- Server invitation notification.
- Unread counter.
- Mark notification as read.

## 4.11 File Attachment

Features:
- Upload image.
- Upload document.
- Upload files.
- Preview supported images.
- Download attachment.
- File size validation.
- File type validation.

File disimpan pada object storage, sedangkan metadata disimpan di PostgreSQL.

---

# 5. Application Pages

## 5.1 Public Pages

| Page | Description |
|---|---|
| Landing Page | Product introduction |
| Login | User authentication |
| Register | Account registration |
| Invitation | Server invitation entry |
| 404 | Not found page |

## 5.2 Authenticated Application

| Page | Description |
|---|---|
| Home | User overview |
| Friends | Friend and user management |
| Direct Messages | Private conversations |
| Server Workspace | Main community interface |
| Server Settings | Server configuration |
| Channel Settings | Channel configuration |
| User Profile | Personal profile |
| User Settings | Account preferences |

## 5.3 Main Application Layout

The primary application layout consists of:

1. Server Sidebar — list of joined servers.
2. Channel Sidebar — categories and channels.
3. Main Content — active conversation.
4. Member Sidebar — server member list.
5. User Panel — profile and presence controls.

---

# 6. WebSocket Event Protocol

GoChat menggunakan WebSocket sebagai komunikasi real-time.

## 6.1 Connection

Endpoint:

`/ws`

Authentication:
- JWT validation during connection establishment.
- Validate user identity.
- Manage active connections.
- Handle reconnect and disconnect.

## 6.2 Event Types

### Message Events
- message.create
- message.update
- message.delete
- message.delivered
- message.read

### Presence Events
- presence.update
- presence.online
- presence.offline

### Typing Events
- typing.start
- typing.stop

### Notification Events
- notification.create
- notification.read

### Channel Events
- channel.member.join
- channel.member.leave

## 6.3 Example Message Payload

```json
{
  "event": "message.create",
  "data": {
    "id": "message-uuid",
    "channel_id": "channel-uuid",
    "sender_id": "user-uuid",
    "content": "Hello GoChat!",
    "created_at": "2026-11-03T10:00:00Z"
  }
}
```

All events must be validated and authorized by the backend.

---

# 7. Database Design

Primary entities:

| Table | Purpose |
|---|---|
| users | User accounts |
| user_sessions | Authentication sessions |
| servers | Community information |
| server_members | Server membership |
| roles | Server roles |
| permissions | Permission definitions |
| role_permissions | Role permission mapping |
| categories | Channel categories |
| channels | Server channels |
| channel_messages | Text channel messages |
| conversations | Direct and group conversations |
| conversation_members | Conversation membership |
| direct_messages | Private messages |
| message_reactions | Message reactions |
| attachments | File metadata |
| invitations | Server invitations |
| notifications | User notifications |
| user_blocks | Blocked users |

Database principles:
- UUID primary keys.
- Foreign key constraints.
- Appropriate database indexes.
- UTC timestamps.
- Transaction management.
- Soft deletion where appropriate.
- Cursor-based pagination for message history.

---

# 8. API Requirements

REST API prefix:

`/api/v1`

## Authentication

- POST /auth/register
- POST /auth/login
- POST /auth/refresh
- POST /auth/logout
- GET /auth/me

## Users

- GET /users
- GET /users/:id
- PATCH /users/me
- POST /users/:id/block
- DELETE /users/:id/block

## Servers

- GET /servers
- POST /servers
- GET /servers/:id
- PATCH /servers/:id
- DELETE /servers/:id
- POST /servers/:id/join
- POST /servers/:id/leave

## Channels

- GET /servers/:id/channels
- POST /servers/:id/channels
- GET /channels/:id
- PATCH /channels/:id
- DELETE /channels/:id

## Messages

- GET /channels/:id/messages
- POST /channels/:id/messages
- PATCH /messages/:id
- DELETE /messages/:id
- POST /messages/:id/reactions

## Direct Messages

- GET /conversations
- POST /conversations
- GET /conversations/:id/messages
- POST /conversations/:id/messages

All protected endpoints require authentication and resource-level authorization.

---

# 9. Non-Functional Requirements

## Performance
- Efficient WebSocket connection handling.
- Indexed database queries.
- Cursor-based message pagination.
- Redis caching for frequently accessed data.
- Avoid unnecessary database queries.
- Monitor message delivery latency.

## Security
- JWT authentication.
- Secure password hashing.
- Authorization and RBAC.
- Input validation.
- Rate limiting.
- CORS configuration.
- WebSocket origin validation.
- Protection against unauthorized channel access.
- File upload validation.

## Reliability
- Automatic reconnection.
- Duplicate message protection using idempotency keys.
- Graceful shutdown.
- Database transaction consistency.
- Redis connection recovery.
- Persistent message storage.

## Scalability
- Modular backend architecture.
- Multiple WebSocket server support.
- Redis Pub/Sub for cross-instance communication.
- Stateless API services.
- Horizontal scaling readiness.

---

# 10. UI/UX Direction

## Design Concept

Modern dark interface inspired by Discord, Linear, and contemporary developer tools.

Design characteristics:
- Dark-first design.
- Clean and minimal layout.
- Compact navigation.
- Clear visual hierarchy.
- Rounded components.
- Subtle borders.
- Consistent spacing.
- Responsive layout.

## Color Direction

| Element | Color |
|---|---|
| Main Background | #111214 |
| Secondary Background | #1A1B1E |
| Sidebar | #17181B |
| Primary Accent | #5865F2 |
| Text Primary | #F2F3F5 |
| Text Secondary | #949BA4 |
| Success | #23A55A |
| Danger | #F23F43 |

## UX Principles
- Real-time interactions without page refresh.
- Optimistic UI for message sending.
- Loading and empty states.
- Clear connection status.
- Accessible keyboard navigation.
- Responsive desktop and mobile layouts.

---

# 11. Development Scope

## Phase 1 — Foundation

- Project initialization.
- Frontend setup.
- Backend setup.
- PostgreSQL configuration.
- Docker Compose.
- Authentication.
- User profile.

## Phase 2 — Community Management

- Server creation.
- Server invitation.
- Server membership.
- Channel management.
- Category management.

## Phase 3 — Real-Time Messaging

- WebSocket implementation.
- WebSocket Hub.
- Private channel messaging.
- Message persistence.
- Message history.
- Typing indicator.
- Online presence.

## Phase 4 — Social Features

- Direct messages.
- Group messages.
- Reactions.
- Replies.
- Read receipts.
- Notification system.

## Phase 5 — Community Management Advanced

- Role management.
- Permission management.
- Member moderation.
- Block and ban.
- Audit logs.

## Phase 6 — Production Readiness

- Unit testing.
- Integration testing.
- WebSocket testing.
- Load testing with k6.
- Redis integration.
- Monitoring.
- CI/CD.
- VPS deployment.

---

# 12. Out of Scope (Initial Version)

The following features are excluded from the initial release:

- Voice channel.
- Video calls.
- Screen sharing.
- End-to-end encryption.
- Native mobile applications.
- AI chatbot.
- Payment and subscription.
- Complex server discovery and recommendation.

These features may be considered in future versions.

---

# 13. Success Metrics

The project will be evaluated through:

| Metric | Evaluation |
|---|---|
| Authentication | Registration and login work correctly |
| Messaging | Real-time message delivery |
| Persistence | Messages remain available after reconnect |
| Presence | Online/offline state synchronization |
| Authorization | Unauthorized access is rejected |
| Reliability | Reconnection and duplicate handling |
| Performance | WebSocket load testing |
| Code Quality | Unit and integration test coverage |
| Deployment | Reproducible Docker deployment |

Performance targets must be established through controlled benchmarking rather than assumed.

---

# 14. Future Roadmap

## Version 1.0
- Authentication.
- Server and channel.
- Real-time text messaging.
- Direct messaging.
- Presence.
- Basic roles and permissions.

## Version 1.1
- File attachments.
- Reactions.
- Reply messages.
- Notification improvements.
- Advanced moderation.

## Version 2.0
- Voice channels using WebRTC and LiveKit.
- Video communication.
- Screen sharing.
- Multiple backend instances.
- Advanced monitoring.

---

# 15. Definition of Done

A feature is considered complete when:

1. Functional requirements are implemented.
2. Backend validation and authorization are implemented.
3. Relevant unit tests pass.
4. Integration tests pass where applicable.
5. API documentation is updated.
6. Frontend loading, error, and empty states are implemented.
7. No critical security issue remains.
8. Feature is documented in the repository.

---

# 16. Final Product Direction

GoChat is a real-time community communication platform built with a modern web frontend and a high-performance Go backend.

The initial product focuses on text-based communication, community management, and real-time interaction.

The architecture starts as a modular monolith to keep development manageable while maintaining a clear path toward distributed backend infrastructure.

**Core Technology:**
- Frontend: Next.js + TypeScript.
- Backend: Golang + Gin.
- Database: PostgreSQL.
- Real-time: WebSocket.
- Cache & Messaging: Redis.
- Infrastructure: Docker.

**Product Positioning:**

"One platform for communities to connect, communicate, and collaborate in real time."