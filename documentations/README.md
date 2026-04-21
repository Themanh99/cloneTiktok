# 📚 TikTok Clone — Documentation Hub

> Tài liệu đầy đủ cho dự án TikTok Clone (NestJS + Next.js)

---

## 📖 Tài liệu tổng quan

| # | Tài liệu | Mô tả |
|---|----------|--------|
| 01 | [Tổng quan dự án](./01-tong-quan-du-an.md) | Vision, mục tiêu, scope, tính năng |
| 02 | [Tech Stack](./02-tech-stack.md) | Công nghệ sử dụng + lý do chọn |
| 03 | [Lộ trình Phases](./03-lo-trinh-phases.md) | Kế hoạch triển khai tổng quan |
| 04 | [ERD & Schema](./04-erd-va-schema.md) | Thiết kế Database + Prisma Schema |
| 05 | [Kiến trúc hệ thống](./05-kien-truc-he-thong.md) | System architecture + data flows |
| 06 | [Docker & Deployment](./06-docker-va-deployment.md) | Docker, Render.com, VPS migration |
| 07 | [Environment Variables](./07-environment-variables.md) | Biến môi trường + config guide |

---

## 🔨 Hướng dẫn triển khai chi tiết (Step-by-step)

| Phase | Tài liệu | Thời gian | Nội dung |
|-------|----------|-----------|----------|
| **1** | [Project Setup](./08-phase1-project-setup.md) | 3 ngày | Dependencies, Docker, Config, common/ |
| **2** | [Database & Prisma](./09-phase2-database-prisma.md) | 2 ngày | Schema 13 models, Migration, Seed, PrismaModule |
| **3** | [Auth Module](./10-phase3-auth-module.md) | 4 ngày | Register, Login, JWT, Refresh Token, Google SSO |
| **4** | [User & Follow](./11-phase4-user-follow.md) | 3 ngày | Profile, Follow/Unfollow, Transaction, Search |
| **5** | [Video & Feed](./12-phase5-video-feed.md) | 5 ngày | Upload, Pre-signed URL, Feed algorithm, CronJob |
| **6** | [Interaction & Realtime](./13-phase6-interaction-realtime.md) | 5 ngày | Like, Comment, WebSocket, Rate Limiting |
| **7** | [Frontend Next.js](./14-phase7-frontend.md) | 14 ngày | Pages, Components, Design System, HLS.js |
| **8** | [Deploy & Optimize](./15-phase8-deploy.md) | 4 ngày | Render.com, Load Test, Security, Domain |

**Tổng thời gian ước tính:** ~40 ngày (5-6 tuần)

---

## 📁 Tài liệu gốc (Reference)

| Tài liệu | Mô tả |
|----------|--------|
| [overview-project.md](./overview-project.md) | Bản kế hoạch gốc (raw notes) |
| [detail-project.md](./detail-project.md) | Chi tiết nguyên tắc thiết kế |
| [schema-sample.md](./schema-sample.md) | Prisma schema gốc |
| [ERD-diagram.md](./ERD-diagram.md) | ERD diagram (Mermaid) |

---

## 🏗️ Tech Stack

```
Backend:  NestJS + TypeScript + Prisma + PostgreSQL + Redis + Socket.io
Frontend: Next.js 15 + CSS Modules + SWR + Zustand + HLS.js
Deploy:   Render.com (→ VPS/Coolify sau này)
Services: Supabase (DB) + Upstash (Redis) + Cloudinary/S3 (Storage)
```
