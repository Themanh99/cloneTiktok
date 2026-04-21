# 🏗️ Kiến Trúc Hệ Thống — TikTok Clone Backend

> **Nguồn gốc:** Tổng hợp từ [overview-project.md](./overview-project.md) và [detail-project.md](./detail-project.md)

---

## 1. System Architecture Overview

```mermaid
graph TB
    subgraph Clients["📱 Clients"]
        WEB[Web App<br/>Next.js]
        MOBILE[Mobile App<br/>React Native]
    end
    
    subgraph LB["🔀 Load Balancer"]
        NGINX[Nginx / Coolify<br/>SSL Termination]
    end
    
    subgraph Backend["🖥️ NestJS Backend (Docker Container)"]
        direction TB
        API[REST API Controllers]
        GUARD[JWT Auth Guard]
        WS_GW[WebSocket Gateway<br/>Socket.io]
        CRON[Scheduled Tasks<br/>@nestjs/schedule]
        
        subgraph Modules["📦 Modules"]
            AUTH[Auth Module]
            USER[User Module]
            VIDEO[Video Module]
            INTERACT[Interaction Module]
            COMMENT[Comment Module]
            SOUND[Sound Module]
            HASHTAG[Hashtag Module]
        end
        
        subgraph Services["⚙️ Shared Services"]
            PRISMA_SVC[Prisma Service]
            REDIS_SVC[Redis Service]
            STORAGE_SVC[Storage Service<br/>S3/Cloudinary]
        end
    end
    
    subgraph External["☁️ External Services"]
        DB[(PostgreSQL<br/>Supabase)]
        REDIS_EXT[(Redis<br/>Upstash)]
        S3_EXT[Object Storage<br/>S3/Cloudinary/R2]
        GOOGLE[Google OAuth]
    end
    
    WEB --> NGINX
    MOBILE --> NGINX
    NGINX --> API
    NGINX --> WS_GW
    
    API --> GUARD --> Modules
    Modules --> Services
    
    PRISMA_SVC --> DB
    REDIS_SVC --> REDIS_EXT
    STORAGE_SVC --> S3_EXT
    WS_GW --> REDIS_EXT
    CRON --> REDIS_SVC
    CRON --> PRISMA_SVC
    
    WEB -->|Direct Upload| S3_EXT
    MOBILE -->|Direct Upload| S3_EXT
    AUTH --> GOOGLE
```

---

## 2. NestJS Module Architecture

```mermaid
graph TD
    APP[AppModule]
    
    APP --> CONFIG[ConfigModule<br/>@nestjs/config]
    APP --> AUTH_M[AuthModule]
    APP --> USER_M[UserModule]
    APP --> VIDEO_M[VideoModule]
    APP --> INTERACT_M[InteractionModule]
    APP --> COMMENT_M[CommentModule]
    APP --> SOUND_M[SoundModule]
    APP --> HASHTAG_M[HashtagModule]
    
    subgraph SharedModules["🔗 Shared Modules"]
        PRISMA_M[PrismaModule<br/>Global]
        REDIS_M[RedisModule<br/>Global]
        STORAGE_M[StorageModule<br/>Global]
    end
    
    APP --> SharedModules
    
    AUTH_M --> PRISMA_M
    AUTH_M --> REDIS_M
    USER_M --> PRISMA_M
    USER_M --> STORAGE_M
    VIDEO_M --> PRISMA_M
    VIDEO_M --> REDIS_M
    VIDEO_M --> STORAGE_M
    COMMENT_M --> PRISMA_M
    COMMENT_M --> REDIS_M
    INTERACT_M --> PRISMA_M
    INTERACT_M --> REDIS_M
```

---

## 3. Luồng dữ liệu chính (Data Flows)

### 3.1 Video Upload Flow

```mermaid
sequenceDiagram
    participant C as 📱 Client
    participant API as 🖥️ NestJS
    participant S3 as ☁️ S3/Cloudinary
    participant DB as 🗄️ PostgreSQL
    
    C->>API: 1. GET /videos/presigned-url
    Note over API: Tạo Pre-signed URL<br/>(có thời hạn 15 phút)
    API-->>C: 2. Trả về { uploadUrl, fileKey }
    
    C->>S3: 3. PUT file video trực tiếp
    S3-->>C: 4. Upload thành công
    
    C->>API: 5. POST /videos { fileKey, title, hashtags, ... }
    Note over API: Xác thực fileKey,<br/>Parse hashtags,<br/>Tạo record DB
    API->>DB: 6. INSERT Video, VideoHashtag
    API-->>C: 7. Trả về Video object
    
    Note over S3: Cloudinary tự động<br/>convert MP4 → HLS (M3U8)
```

> [!IMPORTANT]
> Backend **KHÔNG nhận file video trực tiếp** để tránh:
> - Timeout (file video nặng)
> - Tiêu tốn bandwidth server
> - Tắc nghẽn khi nhiều user upload cùng lúc

### 3.2 Video View & Metrics Flow

```mermaid
sequenceDiagram
    participant C as 📱 Client
    participant API as 🖥️ NestJS
    participant Redis as ⚡ Redis
    participant DB as 🗄️ PostgreSQL
    participant Cron as ⏰ CronJob
    
    C->>API: POST /videos/:id/view
    API->>Redis: INCR video:{id}:views
    API-->>C: 200 OK (instant response)
    
    Note over Cron: Mỗi 5 phút
    Cron->>Redis: GETALL video:*:views
    Cron->>DB: Batch UPDATE viewCount
    Cron->>Redis: DEL video:*:views (reset)
```

### 3.3 Realtime Comment Flow

```mermaid
sequenceDiagram
    participant A as 📱 User A
    participant API as 🖥️ NestJS
    participant DB as 🗄️ PostgreSQL
    participant WS as 📡 Socket.io
    participant Redis as ⚡ Redis
    participant B as 📱 User B
    participant CC as 📱 User C
    
    Note over B,CC: Đang xem video-123<br/>Đã join room "video-123"
    
    A->>API: POST /videos/123/comments { content }
    
    Note over API,Redis: Rate Limit Check
    API->>Redis: Check spam (5 comments/min)
    
    API->>DB: INSERT Comment
    API->>WS: server.to("video-123")<br/>.emit("new_comment", data)
    
    WS-->>B: Nhận comment mới
    WS-->>CC: Nhận comment mới
    
    API-->>A: 201 Created { comment }
```

### 3.4 Feed Algorithm Flow

```mermaid
flowchart TD
    REQ[Client request Feed] --> TYPE{Feed Type?}
    
    TYPE -->|For You| FY[For You Algorithm]
    TYPE -->|Following| FL[Following Feed]
    
    FY --> CACHE{Redis Cache?}
    CACHE -->|Hit| RETURN[Return cached feed]
    CACHE -->|Miss| CALC[Calculate Feed]
    
    CALC --> QUERY["Query Videos:<br/>- Mới nhất<br/>- High engagement<br/>- Chưa xem"]
    QUERY --> RANK["Rank bởi:<br/>- viewCount<br/>- likeCount<br/>- completionRate<br/>- createdAt"]
    RANK --> STORE[Cache vào Redis<br/>TTL: 5 phút]
    STORE --> RETURN
    
    FL --> FOLLOW_Q["Query Videos từ<br/>users đang follow"]
    FOLLOW_Q --> CURSOR[Cursor-based<br/>Pagination]
    CURSOR --> RETURN
```

---

## 4. Socket.io Architecture

```mermaid
graph TB
    subgraph Clients["📱 Clients"]
        C1[User A]
        C2[User B]
        C3[User C]
    end
    
    subgraph Servers["🖥️ NestJS Instances"]
        S1[Server 1]
        S2[Server 2]
    end
    
    subgraph Redis_PubSub["⚡ Redis PubSub (Adapter)"]
        R[Redis]
    end
    
    C1 -->|WS| S1
    C2 -->|WS| S1
    C3 -->|WS| S2
    
    S1 <-->|Pub/Sub| R
    S2 <-->|Pub/Sub| R
    
    Note1[User A comment trên S1<br/>→ Redis broadcast<br/>→ S2 gửi cho User C]
```

> [!NOTE]
> Redis Adapter cho Socket.io cho phép scale horizontal.
> Khi chạy nhiều server instances, mọi event đều được đồng bộ qua Redis Pub/Sub.

---

## 5. Folder Structure (Đề xuất)

```
src/
├── main.ts
├── app.module.ts
│
├── common/                    # Shared utilities
│   ├── decorators/            # Custom decorators (@CurrentUser, ...)
│   ├── filters/               # Exception filters (Global)
│   ├── guards/                # Auth guards (JwtGuard, ...)
│   ├── interceptors/          # Response interceptors
│   ├── pipes/                 # Validation pipes
│   └── dto/                   # Shared DTOs
│
├── config/                    # Configuration module
│   └── config.module.ts
│
├── prisma/                    # Prisma service (Global)
│   ├── prisma.module.ts
│   └── prisma.service.ts
│
├── redis/                     # Redis service (Global)
│   ├── redis.module.ts
│   └── redis.service.ts
│
├── storage/                   # S3/Cloudinary service (Global)
│   ├── storage.module.ts
│   └── storage.service.ts
│
├── auth/                      # Auth module
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── strategies/            # Passport strategies
│   │   ├── jwt.strategy.ts
│   │   └── google.strategy.ts
│   └── dto/
│
├── user/                      # User module
│   ├── user.module.ts
│   ├── user.controller.ts
│   ├── user.service.ts
│   └── dto/
│
├── video/                     # Video module
│   ├── video.module.ts
│   ├── video.controller.ts
│   ├── video.service.ts
│   ├── feed.service.ts        # Feed algorithm
│   └── dto/
│
├── interaction/               # Like, Bookmark, Share
│   ├── interaction.module.ts
│   ├── interaction.controller.ts
│   ├── interaction.service.ts
│   └── dto/
│
├── comment/                   # Comment module (+ WebSocket)
│   ├── comment.module.ts
│   ├── comment.controller.ts
│   ├── comment.service.ts
│   ├── comment.gateway.ts     # Socket.io Gateway
│   └── dto/
│
├── sound/                     # Sound module
│   ├── sound.module.ts
│   ├── sound.controller.ts
│   ├── sound.service.ts
│   └── dto/
│
├── hashtag/                   # Hashtag module
│   ├── hashtag.module.ts
│   ├── hashtag.controller.ts
│   ├── hashtag.service.ts
│   └── dto/
│
└── tasks/                     # Scheduled tasks
    ├── tasks.module.ts
    └── tasks.service.ts       # CronJob: Redis → DB batch
```

---

## 6. Liên kết

| Tài liệu | Link |
|-----------|------|
| Tech Stack | [02-tech-stack.md](./02-tech-stack.md) |
| ERD & Schema | [04-erd-va-schema.md](./04-erd-va-schema.md) |
| Docker & Deploy | [06-docker-va-deployment.md](./06-docker-va-deployment.md) |
