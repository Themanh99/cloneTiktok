# ============================================
# Stage 1: Build (Image lớn ~800MB, có source code)
# ============================================
FROM node:18-alpine AS builder
WORKDIR /app

# Trick: Copy package*.json TRƯỚC, rồi mới install
# → Docker cache layer: nếu package.json không đổi, npm install sẽ skip
COPY package*.json ./
RUN npm ci
# npm ci thay vì npm install: ci = clean install
# - Xóa node_modules cũ
# - Install chính xác version trong package-lock.json
# - Nhanh hơn npm install trong CI/CD

COPY . .
RUN npx prisma generate
RUN npm run build

# ============================================
# Stage 2: Production (Image nhỏ ~200MB)
# ============================================
FROM node:18-alpine
WORKDIR /app

# Chỉ copy artifacts cần thiết, bỏ source code + dev dependencies
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

# Chạy migration trước khi start app
# prisma migrate deploy: chạy pending migrations (không tạo migration mới)
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]