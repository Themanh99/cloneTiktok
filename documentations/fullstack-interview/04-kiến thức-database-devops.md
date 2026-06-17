# Kiến Thức DevOps, Tooling và Production Operations

File này là tài liệu canonical cho Git, Docker, CI/CD, deployment, observability, cloud/Kubernetes cơ bản và vận hành production. Mục tiêu là đọc để hiểu, biết trade-off và nói được trong phỏng vấn fullstack/backend.

Các phần liên quan:

- Database theory và migration chi tiết: `05-kiến thức master database.md`
- Backend runtime/cache/queue/rate limit: `06-backend-core-knowledge.md`
- Node.js/NestJS production readiness: `02-nodejs-NESTJS_MASTERY_GUIDE.md`

## 1. Git nâng cao

### 1.1 Git dùng để làm gì?

Git là hệ thống quản lý phiên bản phân tán. Git giúp team theo dõi thay đổi code, làm việc song song trên branch, review bằng pull request và rollback khi cần.

Cần nắm:

- Commit là snapshot thay đổi.
- Branch là con trỏ tới commit.
- Merge/rebase là cách đưa thay đổi từ nhánh này sang nhánh khác.
- Remote như GitHub/GitLab là nơi team chia sẻ repository.

Trong phỏng vấn, không chỉ nói biết `git add`, `git commit`, mà cần hiểu cách làm việc an toàn trong team.

### 1.2 Merge vs rebase

Merge đưa thay đổi từ branch này vào branch khác bằng merge commit.

Ưu điểm:

- Giữ lịch sử đúng như quá trình làm việc.
- An toàn cho branch đã push/shared.
- Ít rủi ro rewrite history.

Nhược điểm:

- History có thể nhiều merge commit.
- Log có thể khó đọc nếu branch nhỏ quá nhiều.

Rebase đặt lại commit của branch hiện tại lên đầu branch khác.

Ưu điểm:

- History tuyến tính, dễ đọc.
- Hợp với feature branch cá nhân trước khi mở PR.

Nhược điểm:

- Rewrite history.
- Nguy hiểm nếu rebase branch đã nhiều người dùng chung.

Câu trả lời:

> Em thường dùng rebase cho feature branch cá nhân để cập nhật với main và giữ history gọn. Với branch shared hoặc production, em tránh rewrite history và dùng merge/revert an toàn hơn.

### 1.3 Revert vs reset

`revert` tạo commit mới đảo ngược thay đổi của commit cũ.

Phù hợp:

- Branch đã push.
- Production/main branch.
- Cần rollback an toàn, giữ lịch sử.

`reset` di chuyển HEAD về commit khác.

Phù hợp:

- Dọn commit local chưa push.
- Chỉnh lịch sử cá nhân.

Nguy hiểm:

- `reset --hard` có thể làm mất thay đổi.
- Reset branch shared có thể làm team conflict.

Câu trả lời:

> Với main/production, em ưu tiên revert vì nó tạo commit rollback rõ ràng và không rewrite history. Reset chỉ dùng cho local branch hoặc khi team thống nhất rewrite history.

### 1.4 Pull request và code review

PR không chỉ để merge code. PR là nơi kiểm soát chất lượng:

- Correctness.
- Security.
- Maintainability.
- Test coverage.
- API contract.
- Migration/deployment risk.

Một PR tốt nên:

- Có scope nhỏ vừa phải.
- Có mô tả vấn đề và cách giải quyết.
- Có test hoặc lý do không cần test.
- Nêu migration/config change nếu có.
- Không trộn refactor lớn với feature.

## 2. Docker

### 2.1 Docker là gì?

Docker là nền tảng đóng gói ứng dụng và dependency vào container. Container giúp app chạy nhất quán giữa local, staging và production.

Khái niệm:

- Image: template bất biến chứa runtime, dependency, code.
- Container: instance đang chạy từ image.
- Dockerfile: file mô tả cách build image.
- Registry: nơi lưu image, ví dụ Docker Hub, ECR, GCR.

Câu trả lời:

> Docker giúp đóng gói app cùng runtime và dependency để chạy nhất quán ở nhiều môi trường. Image là artifact build ra, container là instance chạy từ image.

### 2.2 Image vs container

Image:

- Bất biến.
- Có layer.
- Được build từ Dockerfile.
- Push/pull qua registry.

Container:

- Runtime instance của image.
- Có filesystem/process/network riêng.
- Có thể start/stop/restart.

Ví dụ:

```text
Dockerfile -> docker build -> image
image -> docker run -> container
```

### 2.3 Dockerfile production

Dockerfile production nên:

- Dùng multi-stage build.
- Dùng base image version cụ thể.
- Cài dependency bằng lockfile.
- Chỉ copy artifact cần thiết.
- Không chứa secret.
- Chạy bằng non-root user nếu có thể.
- Có `.dockerignore`.

Ví dụ Node.js:

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
USER node
CMD ["node", "dist/main.js"]
```

Vì sao multi-stage?

- Stage build có dev dependency, compiler, source code.
- Stage runner chỉ giữ artifact production.
- Image cuối nhỏ hơn, ít bề mặt tấn công hơn.

### 2.4 `.dockerignore`

`.dockerignore` giúp giảm build context.

Ví dụ:

```text
node_modules
dist
.git
.env
coverage
*.log
```

Nếu không có `.dockerignore`, Docker có thể gửi cả `node_modules`, `.git`, file log, secret vào build context, làm build chậm và rủi ro bảo mật.

### 2.5 Docker Compose

Docker Compose dùng để chạy nhiều service local/integration test.

Ví dụ:

```yaml
services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgres://postgres:postgres@db:5432/app
      REDIS_URL: redis://redis:6379
    depends_on:
      - db
      - redis

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: app
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine

volumes:
  postgres_data:
```

Điểm quan trọng:

- Trong container, `localhost` là chính container đó.
- API connect DB bằng hostname service `db`, không phải `localhost`.
- `depends_on` không đảm bảo DB ready hoàn toàn, chỉ đảm bảo container được start theo thứ tự.
- Production cần orchestration, secrets, monitoring, scaling; không bê nguyên compose local lên production nếu chưa đủ.

### 2.6 Lỗi Docker hay gặp

- Image quá nặng vì copy cả repo/dev dependency.
- Dùng `latest` tag làm build không reproducible.
- Copy `.env` hoặc secret vào image.
- Container start nhưng app chưa ready.
- Dùng `localhost` sai giữa container.
- Không set memory/CPU limit trong môi trường cần kiểm soát tài nguyên.
- Không handle graceful shutdown khi container bị stop.

## 3. CI/CD

### 3.1 CI/CD là gì?

CI - Continuous Integration: tự động kiểm tra code khi có thay đổi.

CD - Continuous Delivery/Deployment: tự động build, đóng gói, deploy hoặc chuẩn bị deploy artifact.

Mục tiêu:

- Phát hiện lỗi sớm.
- Build/deploy nhất quán.
- Giảm thao tác thủ công.
- Tăng khả năng rollback/release an toàn.

### 3.2 Pipeline cơ bản

Một pipeline backend/frontend thường có:

1. Checkout code.
2. Install dependency.
3. Lint.
4. Typecheck.
5. Unit test.
6. Build.
7. Integration/E2E test nếu có.
8. Build Docker image/artifact.
9. Security scan nếu cần.
10. Push artifact/image.
11. Deploy staging.
12. Smoke test.
13. Promote production.

Câu trả lời:

> Pipeline tốt không chỉ build được app, mà còn kiểm tra chất lượng trước khi deploy: lint, typecheck, test, build artifact, scan nếu cần, deploy staging, smoke test và có rollback strategy.

### 3.3 Artifact và reproducible build

Artifact là sản phẩm build dùng để deploy:

- Docker image.
- Static frontend build.
- Backend binary/package.

Nguyên tắc:

- Build một lần, deploy cùng artifact qua staging/production.
- Gắn version/tag rõ: commit SHA, semver, build number.
- Không build lại khác nhau cho từng môi trường nếu có thể.

Lợi ích:

- Biết chính xác production đang chạy code nào.
- Rollback dễ hơn.
- Debug release dễ hơn.

### 3.4 Migration trong CI/CD

Migration database là phần rủi ro vì rollback code không luôn rollback data/schema được.

Nguyên tắc:

- Migration phải được review trong PR.
- Migration nên backward-compatible nếu rolling deploy.
- Thay đổi phá vỡ schema nên tách nhiều bước.
- Có backup/restore plan cho migration nguy hiểm.
- Log migration version đã chạy.

Expand/contract pattern:

1. Add column/table mới, không phá code cũ.
2. Deploy code ghi cả field cũ và mới.
3. Backfill data.
4. Deploy code đọc field mới.
5. Drop field cũ sau khi chắc chắn an toàn.

### 3.5 Rollback

Rollback không chỉ là deploy image cũ.

Cần xem:

- Code rollback.
- Config rollback.
- Database schema có còn compatible không?
- Message/event schema có còn compatible không?
- Feature flag có thể tắt nhanh không?
- Có data đã ghi theo format mới không?

Câu trả lời:

> Em xem rollback như một phần của thiết kế release. Nếu deploy có migration hoặc event schema mới, phải đảm bảo backward compatibility hoặc có expand/contract. Feature flag giúp tắt tính năng nhanh mà không cần rollback toàn bộ service.

## 4. Deployment strategy

### 4.1 Rolling deployment

Rolling deployment thay từng instance cũ bằng instance mới.

Ưu điểm:

- Ít tốn tài nguyên.
- Không downtime nếu app hỗ trợ readiness/graceful shutdown.
- Phổ biến trong Kubernetes.

Nhược điểm:

- Trong một khoảng thời gian, version cũ và mới chạy song song.
- Cần backward compatibility giữa code/schema/API/event.
- Rollback không tức thì bằng blue-green.

### 4.2 Blue-green deployment

Blue-green chạy hai môi trường: blue đang nhận traffic, green là version mới. Sau khi green sẵn sàng, switch traffic sang green.

Ưu điểm:

- Rollback nhanh bằng switch traffic lại blue.
- Test green trước khi nhận traffic thật.

Nhược điểm:

- Tốn tài nguyên gần gấp đôi.
- Vẫn phải cẩn thận với database migration dùng chung.

### 4.3 Canary deployment

Canary đưa một phần nhỏ traffic sang version mới trước.

Ưu điểm:

- Giảm rủi ro release.
- Có thể quan sát metric trước khi rollout toàn bộ.

Nhược điểm:

- Cần routing/traffic splitting.
- Cần metric/alert tốt.
- Nếu bug chỉ xảy ra với nhóm user nhỏ, cần phân tích kỹ.

### 4.4 Feature flag

Feature flag cho phép deploy code nhưng bật/tắt tính năng bằng config.

Ưu điểm:

- Tắt nhanh tính năng lỗi.
- Release dần theo user/tenant/percentage.
- Tách deploy khỏi release.

Nhược điểm:

- Flag cũ không dọn sẽ thành technical debt.
- Logic phân nhánh nhiều làm code khó đọc.
- Cần quản lý quyền thay đổi flag production.

## 5. Observability

### 5.1 Observability là gì?

Observability là khả năng hiểu hệ thống đang hoạt động thế nào từ bên ngoài thông qua logs, metrics và traces.

Monitoring trả lời: hệ thống có đang ổn không?

Observability trả lời sâu hơn: vì sao hệ thống không ổn?

Ba trụ cột:

- Logs: sự kiện chi tiết.
- Metrics: số liệu đo lường theo thời gian.
- Traces: đường đi của request qua nhiều service/dependency.

### 5.2 Logging

Log production nên là structured log.

Ví dụ:

```json
{
  "level": "error",
  "message": "Create order failed",
  "requestId": "req_123",
  "userId": "user_42",
  "route": "POST /orders",
  "latencyMs": 843,
  "errorCode": "PAYMENT_TIMEOUT"
}
```

Log tốt cần:

- Request id/correlation id.
- User/tenant id nếu phù hợp.
- Route/action.
- Error code.
- Latency.
- Dependency liên quan.

Không log:

- Password.
- Access token/refresh token.
- Secret/API key.
- PII nhạy cảm nếu không cần.

Pitfall:

- Log chỉ là string không parse được.
- Không có request id nên không trace được một request.
- Log quá nhiều gây tốn chi phí và khó tìm.
- Log quá ít, production bug không debug được.

### 5.3 Metrics

Metrics là số liệu định lượng theo thời gian.

Metrics quan trọng cho API:

- RPS/throughput.
- Error rate.
- Latency p50/p95/p99.
- CPU/memory.
- DB connection pool active/idle/waiting.
- Slow query count.
- Cache hit rate.
- Queue lag.
- External dependency latency/error.

RED method cho service:

- Rate: request/second.
- Errors: error rate.
- Duration: latency.

USE method cho resource:

- Utilization: mức sử dụng CPU/memory/disk.
- Saturation: hàng đợi, pool waiting.
- Errors: lỗi resource.

Câu trả lời:

> Với API production, em luôn muốn nhìn p95/p99 latency, error rate, throughput, DB pool, slow query, cache hit rate và queue lag. Alert nên dựa trên symptom ảnh hưởng user như error rate/latency tăng, không chỉ CPU cao.

### 5.4 Tracing

Tracing theo dõi một request đi qua nhiều bước/service.

Ví dụ trace:

```text
POST /checkout                 1200ms
  auth guard                      15ms
  create order DB                 40ms
  payment provider              950ms
  publish order event            30ms
  serialize response              5ms
```

Lợi ích:

- Biết bottleneck nằm ở đâu.
- Debug microservices/external dependency dễ hơn.
- Thấy request path thực tế.

Không có tracing, team dễ đoán sai nguyên nhân, ví dụ tưởng DB chậm nhưng thật ra payment provider mất 950ms.

### 5.5 Alerting

Alert tốt phải actionable.

Nên alert:

- Error rate vượt ngưỡng.
- p95/p99 latency tăng mạnh.
- Queue lag tăng liên tục.
- DB connection waiting cao.
- Disk gần đầy.
- Service restart liên tục.

Không nên:

- Alert quá nhạy gây noise.
- Alert metric không ai xử lý được.
- Chỉ alert CPU mà không liên hệ impact user.

## 6. Cloud basics

### 6.1 Các thành phần cloud thường gặp

Cần hiểu concept:

- Compute: VM, container, serverless.
- Load balancer: phân phối traffic.
- Object storage: lưu file/media/static asset.
- Managed database: PostgreSQL/MySQL managed.
- Cache: Redis/Memcached managed.
- Queue/event: SQS/PubSub/Kafka managed.
- CDN: phân phối static/media gần user.
- IAM: quản lý quyền.
- Secret manager: lưu secret.
- VPC/networking: network isolation.

Không cần thuộc tên mọi service, nhưng phải biết vai trò và trade-off.

### 6.2 Managed service trade-off

Ưu điểm:

- Giảm gánh nặng vận hành.
- Backup/patching/monitoring tốt hơn nếu dùng đúng.
- Team tập trung vào product.

Nhược điểm:

- Chi phí.
- Vendor lock-in.
- Ít quyền kiểm soát thấp tầng.
- Cần hiểu giới hạn của service.

Câu trả lời:

> Với team nhỏ hoặc sản phẩm cần đi nhanh, em ưu tiên managed service cho database, cache, queue nếu chi phí chấp nhận được. Nhưng vẫn phải hiểu limit, backup, scaling, network và monitoring, không coi managed service là không cần vận hành.

## 7. Kubernetes basics

### 7.1 Kubernetes là gì?

Kubernetes là nền tảng orchestration container. Nó giúp deploy, scale, restart, service discovery và rolling update cho containerized applications.

Khái niệm chính:

- Pod: đơn vị chạy container.
- Deployment: quản lý replica và rollout.
- Service: endpoint ổn định để truy cập pod.
- Ingress: route traffic từ ngoài vào service.
- ConfigMap: config không nhạy cảm.
- Secret: secret/config nhạy cảm.
- HPA: autoscale replica.

### 7.2 Pod và Deployment

Pod là đơn vị nhỏ nhất Kubernetes schedule. Một pod có thể chứa một hoặc nhiều container, nhưng thường một app container chính.

Deployment quản lý:

- Số replica.
- Rolling update.
- Rollback.
- Self-healing khi pod chết.

Câu trả lời:

> Pod là nơi container chạy. Deployment đảm bảo luôn có số pod mong muốn và quản lý rolling update/rollback.

### 7.3 Service và Ingress

Pod có IP thay đổi, nên cần Service làm endpoint ổn định.

Ingress định tuyến HTTP/HTTPS từ bên ngoài vào service.

Ví dụ flow:

```text
Client
-> Ingress
-> Service
-> Pod
```

### 7.4 Readiness vs liveness probe

Readiness trả lời: pod đã sẵn sàng nhận traffic chưa?

Nếu readiness fail, pod bị tháo khỏi service endpoint nhưng không nhất thiết bị restart.

Liveness trả lời: app còn sống hay bị treo?

Nếu liveness fail, Kubernetes restart container.

Sai lầm hay gặp:

- Dùng liveness check phụ thuộc DB. Khi DB chập chờn, toàn bộ pod restart hàng loạt.
- Không có readiness, traffic vào pod khi app chưa warm up xong.
- Probe quá nhạy làm restart loop.

Câu trả lời:

> Readiness dùng để quyết định pod có nhận traffic không. Liveness dùng để quyết định pod có cần restart không. Em không để liveness phụ thuộc quá nhiều vào DB/external service để tránh restart hàng loạt khi dependency chập chờn.

### 7.5 HPA

HPA - Horizontal Pod Autoscaler - scale số replica theo metric như CPU, memory hoặc custom metric.

Cần chú ý:

- App phải stateless để scale ngang dễ.
- Scale API không có nghĩa DB/cache/queue chịu được load tăng.
- Metric CPU không phải lúc nào cũng tốt nhất; có thể cần RPS, queue lag, latency.
- Scale có độ trễ, không giải quyết spike quá đột ngột nếu không có buffer/backpressure.

## 8. Security và secrets

### 8.1 Secret management

Secret gồm:

- DB password.
- API key.
- JWT secret/private key.
- OAuth client secret.
- Payment provider key.

Nguyên tắc:

- Không commit secret vào Git.
- Không copy `.env` vào Docker image.
- Dùng secret manager hoặc secret injection.
- Rotate secret khi bị lộ hoặc định kỳ.
- Giới hạn quyền truy cập theo least privilege.
- Audit ai truy cập secret production.

### 8.2 Environment strategy

Môi trường thường có:

- Local.
- CI/test.
- Staging.
- Production.

Config nên:

- Tách theo environment.
- Validate khi app start.
- Không hardcode trong code.
- Có default an toàn cho local, nhưng production phải explicit.

Ví dụ app nên fail fast nếu thiếu config quan trọng:

```text
Missing required env DATABASE_URL
```

### 8.3 Secret rotation

Quy trình rotation:

1. Tạo secret mới.
2. Deploy app chấp nhận secret mới, nếu cần chấp nhận cả secret cũ trong giai đoạn chuyển.
3. Chuyển producer/client sang secret mới.
4. Thu hồi secret cũ.
5. Audit xem còn service nào dùng secret cũ không.

Pitfall:

- Rotate JWT secret làm tất cả user logout nếu không hỗ trợ key rotation.
- Đổi DB password nhưng worker/service phụ chưa update.
- Secret cũ vẫn còn trong log/CI artifact.

## 9. Production incident và rollback

### 9.1 Khi production lỗi, xử lý thế nào?

Thứ tự thực tế:

1. Xác định impact: bao nhiêu user, endpoint nào, error/latency thế nào.
2. Mitigate trước: rollback, tắt feature flag, scale, block traffic xấu.
3. Điều tra nguyên nhân bằng logs/metrics/traces.
4. Fix lâu dài.
5. Postmortem: timeline, root cause, action items.

Câu trả lời:

> Khi incident, em ưu tiên giảm impact trước thay vì debug quá lâu. Nếu release mới gây lỗi, rollback hoặc tắt feature flag. Sau khi hệ thống ổn, em mới phân tích root cause và thêm action item như test, alert, runbook để tránh lặp lại.

### 9.2 Runbook

Runbook là hướng dẫn thao tác khi có sự cố.

Nên có:

- Cách rollback.
- Cách kiểm tra logs/metrics.
- Cách restart service an toàn.
- Cách kiểm tra DB/queue/cache.
- Contact owner.
- Link dashboard.

Runbook giúp người trực incident không phải nhớ mọi thứ trong lúc áp lực.

## 10. Câu hỏi phỏng vấn hay gặp

### Docker image production nên tối ưu thế nào?

Dùng multi-stage build, base image version cụ thể, cài dependency bằng lockfile, chỉ copy artifact cần thiết, có `.dockerignore`, không copy secret, chạy non-root nếu có thể, image nhỏ và reproducible.

### Docker Compose dùng khi nào?

Docker Compose phù hợp cho local development hoặc integration test nhiều service như API, DB, Redis. Production cần orchestration, secrets, health check, autoscaling, monitoring nên không nên bê nguyên compose local lên production nếu chưa đủ.

### CI/CD pipeline nên có gì?

Lint, typecheck, test, build, build artifact/image, security scan nếu cần, deploy staging, smoke test, promote production và rollback plan. Với database migration cần backward compatibility và review kỹ.

### Rolling, blue-green, canary khác nhau thế nào?

Rolling thay dần instance cũ bằng mới, tiết kiệm tài nguyên nhưng có giai đoạn chạy song song hai version. Blue-green chạy hai môi trường và switch traffic, rollback nhanh nhưng tốn tài nguyên. Canary đưa một phần nhỏ traffic sang version mới để quan sát metric trước khi rollout toàn bộ.

### Monitoring API production cần nhìn gì?

RPS, error rate, latency p95/p99, CPU/memory, DB connection pool, slow query, cache hit rate, queue lag, external dependency latency/error. Alert nên dựa vào impact user như error/latency tăng.

### Readiness khác liveness thế nào?

Readiness quyết định pod có nhận traffic không. Liveness quyết định pod có bị restart không. Readiness có thể phụ thuộc dependency cần thiết, nhưng liveness không nên quá phụ thuộc DB/external service để tránh restart hàng loạt.

### Làm sao quản lý secret an toàn?

Không commit secret, không copy vào image, dùng secret manager/injection, giới hạn quyền, audit access, rotate secret và có quy trình rotation không làm downtime.
