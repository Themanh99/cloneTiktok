# TikTok Web

Ứng dụng gồm:

- Frontend: React, Vite
- Backend: NestJS
- PostgreSQL, Redis, RabbitMQ, MinIO
- Nginx Gateway
- Prometheus, Grafana

## Yêu cầu

- Git
- Docker Desktop
- Docker Compose

Node.js chỉ cần khi chạy frontend trực tiếp để phát triển.

## Chạy toàn bộ dự án

### 1. Clone và vào thư mục dự án

```powershell
git clone <repository-url>
cd tiktokweb
```

### 2. Tạo file môi trường

```powershell
Copy-Item backend\.env.microservices.example backend\.env
```

Nếu dùng Google đăng nhập, điền cùng một Client ID vào:

```env
# backend/.env
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com

# frontend-v2/.env
VITE_GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
```

Google OAuth không bắt buộc để chạy các chức năng còn lại.

### 3. Build và khởi động

Đảm bảo Docker Desktop đang chạy, sau đó:

```powershell
docker compose -f docker-compose.microservices.yml up -d --build
```

Kiểm tra:

```powershell
docker compose -f docker-compose.microservices.yml ps
```

Khi các service chính hiển thị `Up` hoặc `healthy`, mở:

- Website: http://localhost:3001
- API: http://localhost:3000/api
- Gateway: http://localhost:8080
- MinIO: http://localhost:9001 — `tiktok` / `tiktok123`
- RabbitMQ: http://localhost:15672 — `tiktok` / `tiktok123`
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3002 — `admin` / `admin`

Database migration và MinIO bucket được tạo tự động khi container khởi động.

## Làm việc với frontend

Để dùng Vite và tự cập nhật khi sửa code:

```powershell
docker compose -f docker-compose.microservices.yml stop frontend
cd frontend-v2
npm install
npm run dev
```

Frontend chạy tại http://localhost:3001. Backend và các service còn lại vẫn chạy bằng Docker.

Khi muốn quay lại frontend Docker:

```powershell
cd ..
docker compose -f docker-compose.microservices.yml up -d --build frontend
```

## Cập nhật container sau khi sửa code

Docker không tự cập nhật source code. Build lại service đã thay đổi:

```powershell
# Frontend
docker compose -f docker-compose.microservices.yml up -d --build frontend

# Backend
docker compose -f docker-compose.microservices.yml up -d --build api

# Toàn bộ
docker compose -f docker-compose.microservices.yml up -d --build
```

## Dừng dự án

```powershell
docker compose -f docker-compose.microservices.yml down
```

Xóa cả dữ liệu PostgreSQL, Redis, RabbitMQ, MinIO và Grafana:

```powershell
docker compose -f docker-compose.microservices.yml down -v
```

Không dùng `-v` nếu muốn giữ dữ liệu local.

## Xem log

```powershell
docker compose -f docker-compose.microservices.yml logs -f
docker compose -f docker-compose.microservices.yml logs -f api
docker compose -f docker-compose.microservices.yml logs -f frontend
```

Hướng dẫn chi tiết: [Local Microservices Lab](documentations/16-local-microservices-lab.md).
