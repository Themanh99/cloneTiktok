Tuyệt vời! Việc có kinh nghiệm với Next.js và NestJS sẽ là một lợi thế lớn. Tôi sẽ cập nhật lại kế hoạch ôn tập và danh sách câu hỏi để bao quát thêm hai framework mạnh mẽ này, đảm bảo bạn có đủ kiến thức chuyên sâu cần thiết cho một kỹ sư 3-4 năm kinh nghiệm.

---

### **Kế hoạch ôn tập Fullstack Developer Nâng Cao (Với Next.js & NestJS)**

**II. Frontend: ReactJS & Next.js (3-4 ngày)**

- **React Core (Ôn lại/Nắm vững):**
  - **Components:** Functional Components (ưu tiên), Class Components (biết).
  - **Props & State:** Cách quản lý và truyền dữ liệu.
  - **Lifecycle Hooks:** `useState`, `useEffect`, `useContext`, `useRef`, `useCallback`, `useMemo`. Hiểu sâu về cách chúng thay thế và cải thiện các lifecycle methods của Class Components.
  - **Conditional & List Rendering:** Tối ưu hiệu suất với `key`.
  - **Event Handling & Form Handling:** Các pattern phổ biến.
  - **Context API:** Sử dụng cho global state nhẹ.
  - **Performance Optimization:** `React.memo()`, `useCallback()`, `useMemo()`, Code Splitting (React.lazy, Suspense).
  - **Error Boundaries:** Cách xử lý lỗi trong cây component.
  - **Portals:** Khi nào và tại sao sử dụng.
- **Next.js (Chuyên sâu):**
  - **Client-Side Rendering (CSR) vs Server-Side Rendering (SSR) vs Static Site Generation (SSG) vs Incremental Static Regeneration (ISR):**
    - **Hiểu rõ:** Khi nào sử dụng từng loại, ưu nhược điểm, cách Next.js thực hiện.
    - **`getServerSideProps`:** Mục đích, cách hoạt động, thời điểm chạy.
    - **`getStaticProps`:** Mục đích, cách hoạt động, thời điểm chạy, `revalidate` (ISR).
    - **`getStaticPaths`:** Mục đích, cách hoạt động, `fallback` (true/false/blocking).
  - **File-system Routing:** Cách hoạt động, Dynamic Routes (`[id].js`), Catch-all Routes (`[[...slug]].js`).
  - **API Routes:** Cách tạo API endpoints trong Next.js, khi nào sử dụng thay vì một backend riêng biệt.
  - **Data Fetching:** Sử dụng `fetch` hoặc các thư viện như `SWR`, `React Query` với Next.js.
  - **Image Optimization (`next/image`):** Lợi ích, cách sử dụng.
  - **SEO:** Cách Next.js hỗ trợ SEO, `next/head`.
  - **Middlewares:** Cách hoạt động, các trường hợp sử dụng.
  - **Deployment:** Vercel, Node.js server.

**III. Backend: NestJS (3-4 ngày)**

- **REST API Concepts (Nâng cao):**
  - **HTTP Methods:** GET, POST, PUT, DELETE, PATCH, OPTIONS.
  - **HTTP Status Codes:** Hiểu rõ từng nhóm (2xx, 4xx, 5xx) và các code cụ thể (200, 201, 204, 400, 401, 403, 404, 409, 500).
  - **Idempotency:** Giải thích và cho ví dụ.
  - **API Versioning:** Cách thực hiện (URL, Header, Query Parameter).
  - **API Security:** CORS, CSRF, XSS, SQL Injection, JWT, OAuth2 (Flows).
  - **Rate Limiting, Throttling.**
- **NestJS (Chuyên sâu):**
  - **Kiến trúc:** Modules, Controllers, Providers (Services, Repositories), Injectables.
  - **Dependency Injection:** Cách NestJS sử dụng DI (Type-based, Custom Providers).
  - **Decorators:** `@Module`, `@Controller`, `@Injectable`, `@Get`, `@Post`, `@Body`, `@Param`, `@Query`, `@UseGuards`, `@UseInterceptors`, `@UseFilters`, `@UsePipes`. Hiểu mục đích của từng loại.
  - **Services & Repository Pattern:** Tách biệt logic kinh doanh và logic truy cập dữ liệu.
  - **Pipes:** Validation (class-validator, class-transformer), Transformation.
  - **Guards:** Authentication (JWT Guard), Authorization (Roles Guard).
  - **Interceptors:** Logging, Response Transformation, Caching.
  - **Filters:** Global exception handling.
  - **Custom Decorators:** Cách tạo các decorators tùy chỉnh.
  - **Database Integration:** TypeORM/Prisma (ORM), Mongoose (ODM).
  - **Testing:** Unit tests (JEST), E2E tests.
  - **Microservices:** (Nếu có kinh nghiệm) Gateway, Transport layers (TCP, Redis, Kafka, RabbitMQ).

**IV. Databases (1-2 ngày)** - (Giữ nguyên phần này)

- **MySQL (SQL Database):** Cấu trúc bảng, Khóa chính, Khóa ngoại, SELECT, INSERT, UPDATE, DELETE, JOINs, Indexes, Views, Stored Procedures, Transactions, Stored Procedures.
- **MongoDB (NoSQL Database):** Document, Collections, CRUD, Aggregation Framework, Indexing, Replica Set, Sharding (concepts).
- **Redis (Cache/Message Broker):** Lý do sử dụng, Kiểu dữ liệu, Caching patterns, Pub/Sub.

**V. DevOps & Tooling (1-2 ngày)** - (Giữ nguyên phần này)

- **Git:** clone, add, commit, push, pull, Branching strategies, Merge, Rebase, Resolve conflicts, Stash.
- **Docker:** Dockerfile, Image, Container, Docker Compose.
- **Linux:** Lệnh cơ bản, Permissions, Process management.
- **CI/CD (Concepts):** Continuous Integration, Continuous Delivery/Deployment, Các công cụ phổ biến.
- **ELK Stack (Concepts):** Elasticsearch, Logstash, Kibana, Centralized Logging, Monitoring.

---

### **Danh sách câu hỏi phỏng vấn Fullstack Developer Nâng Cao (4 năm kinh nghiệm)**

**I. Câu hỏi chung và Behavioral (Hành vi):** (Giữ nguyên phần này)

1.  Hãy giới thiệu về bản thân bạn và kinh nghiệm làm việc.
2.  Điểm mạnh và điểm yếu của bạn là gì?
3.  Bạn mong muốn gì ở công việc này và công ty chúng tôi?
4.  Tại sao bạn lại rời bỏ công việc cũ/tìm kiếm công việc mới?
5.  Bạn xử lý thế nào khi có mâu thuẫn trong team hoặc với cấp trên?
6.  Bạn đã bao giờ gặp phải một deadline gấp rút chưa? Bạn đã làm gì để hoàn thành nó?
7.  Hãy kể về một dự án khó khăn nhất bạn từng làm và cách bạn vượt qua nó.
8.  Bạn có kinh nghiệm làm việc với quy trình Agile/Scrum không?
9.  Bạn hình dung về 5 năm tới của mình như thế nào?
10. Bạn có câu hỏi nào cho chúng tôi không?

**III. Câu hỏi về Next.js & ReactJS (Bổ sung sâu hơn):**

1.  **React Hooks:**
    - Giải thích chi tiết sự khác biệt và trường hợp sử dụng của `useCallback` và `useMemo`. Khi nào việc sử dụng chúng có thể gây hại nhiều hơn có lợi?
    - Làm thế nào bạn quản lý các side effects phức tạp (ví dụ: subscriptions, data fetching với cleanup) trong `useEffect`?
    - Bạn sẽ sử dụng `useReducer` thay vì `useState` trong trường hợp nào? Cho ví dụ.
    - Cách bạn triển khai **custom Hooks** để tái sử dụng logic trong các component.
2.  **Performance Optimization trong React:**
    - Ngoài `React.memo`, `useCallback`, `useMemo`, bạn có những chiến lược nào khác để tối ưu hóa hiệu suất render của một ứng dụng React lớn? (VD: Virtualized Lists, Debouncing/Throttling events).
    - Giải thích về **Code Splitting/Lazy Loading** trong React và cách nó cải thiện trải nghiệm người dùng.
    - Cách bạn **profiling hiệu suất** của một ứng dụng React (React Dev Tools Profiler).
3.  **Next.js Specific:**
    - **Giải thích chi tiết về SSR, SSG, ISR, và CSR trong Next.js.** Nêu một trường hợp sử dụng cụ thể cho từng loại và lý do lựa chọn.
      - Khi nào bạn bắt buộc phải dùng `getServerSideProps` thay vì `getStaticProps`?
      - Giải thích tham số `revalidate` trong `getStaticProps` và cách nó hoạt động với **Incremental Static Regeneration**.
      - Giải thích `fallback: true`, `fallback: false`, `fallback: 'blocking'` trong `getStaticPaths`.
    - Làm thế nào để tạo **API Routes** trong Next.js? Khi nào bạn nên sử dụng API Routes của Next.js thay vì một backend riêng biệt (NestJS/FastAPI)?
    - Giải thích lợi ích của **Image Optimization (`next/image`)** và cách nó hoạt động.
    - Bạn sẽ làm gì để tối ưu **SEO** cho một ứng dụng Next.js? (next/head, sitemap, robots.txt).
    - Cách bạn xử lý **Authentication và Authorization** trong một ứng dụng Next.js (client-side và server-side).
    - Giải thích về **Middlewares trong Next.js 12+** và các trường hợp sử dụng của chúng.
    - Bạn sẽ triển khai **CSS-in-JS (Styled Components) hoặc Tailwind CSS** trong một dự án Next.js như thế nào?
    - Cách bạn cấu hình và sử dụng **data fetching libraries (SWR/React Query)** với Next.js.
    - **Error Handling** trong Next.js: `_error.js`, `_app.js`.
    - **Deployment của Next.js:** Các tùy chọn và cân nhắc khi deploy lên Vercel, hoặc một Node.js server tùy chỉnh.

**IV. Câu hỏi về NestJS (Chuyên sâu):**

1.  **Dependency Injection trong NestJS:**
    - Giải thích chi tiết về cơ chế DI của NestJS. Sự khác biệt giữa Provider types (class, value, factory, alias) và khi nào dùng mỗi loại.
    - Làm thế nào bạn sẽ xử lý các **dependencies có phạm vi (scoped dependencies)** (Request, Transient, Singleton)?
2.  **Modules, Controllers, Providers:**
    - Giải thích vai trò và mối quan hệ của Module, Controller, và Provider trong NestJS.
    - Làm thế nào để **cấu trúc một ứng dụng NestJS lớn** với nhiều Modules?
3.  **Pipes, Guards, Interceptors, Filters:**
    - Giải thích mục đích, thứ tự thực thi, và các trường hợp sử dụng cụ thể cho từng loại.
    - Hãy cho ví dụ về một **Custom Pipe** để chuyển đổi dữ liệu đầu vào.
    - Hãy cho ví dụ về một **Custom Guard** để kiểm tra quyền truy cập dựa trên vai trò người dùng.
    - Hãy cho ví dụ về một **Custom Interceptor** để log request/response hoặc cache dữ liệu.
    - Hãy cho ví dụ về một **Custom Exception Filter** để xử lý một loại lỗi cụ thể.
4.  **Validation:**
    - NestJS sử dụng thư viện nào cho validation? Cách bạn áp dụng validation cho request body, query parameters, và path parameters.
    - Làm thế nào để tạo **custom validation rules** với `class-validator`?
5.  **Authentication & Authorization:**
    - Giải thích các bước để triển khai **JWT Authentication** trong NestJS (Passport, Strategies).
    - Làm thế nào để triển khai **Role-based Authorization** sử dụng Guards và Custom Decorators?
6.  **Database Interaction:**
    - Bạn đã sử dụng **TypeORM/Prisma/Mongoose** với NestJS như thế nào? Nêu ưu nhược điểm của ORM/ODM.
    - Cách bạn xử lý **database migrations** trong một dự án NestJS (với TypeORM chẳng hạn).
7.  **Testing trong NestJS:**
    - Cách bạn viết **Unit Tests** cho Services và Controllers.
    - Cách bạn viết **E2E Tests** cho các API endpoints.
8.  **Microservices (Nếu có kinh nghiệm):**
    - Giải thích khái niệm Microservices trong NestJS.
    - Bạn đã sử dụng loại **Transport layer** nào (TCP, Redis, Kafka, RabbitMQ) và tại sao?
    - Làm thế nào để xây dựng một **API Gateway** với NestJS?

**V. Câu hỏi về Databases (Nâng cao):**

1.  **MySQL:**
    - Giải thích chi tiết về các cấp độ **Isolation Levels** trong Transaction của SQL và tác động của chúng (Read Uncommitted, Read Committed, Repeatable Read, Serializable).
    - Sự khác biệt giữa **Clustered Index và Non-Clustered Index**?
    - Bạn sẽ thiết kế **Database Schema** cho một ứng dụng có mối quan hệ phức tạp (ví dụ: many-to-many với các thuộc tính trên bảng trung gian) như thế nào?
    - **Stored Procedures và Triggers:** Ưu nhược điểm, khi nào sử dụng.
2.  **MongoDB:**
    - Giải thích về **Aggregation Pipeline** và cho một ví dụ phức tạp (ví dụ: nhóm dữ liệu, tính toán trung bình, lọc).
    - Bạn sẽ thiết kế **Schema cho MongoDB** như thế nào (Embedded vs Referenced Documents) và khi nào sử dụng từng loại?
    - Giải thích về **Replica Sets và Sharding** trong MongoDB. Khi nào cần chúng?
    - **Transactions trong MongoDB:** Hiện tại có hỗ trợ không? Hạn chế là gì?
3.  **Redis:**
    - Giải thích các trường hợp sử dụng khác của Redis ngoài caching (ví dụ: **Pub/Sub, Distributed Locks, Leaderboards**).
    - Làm thế nào để xử lý **Cache Invalidation**?
    - **Redis persistence** (RDB, AOF): Mục đích và sự khác biệt.

**VI. Câu hỏi về DevOps & Tooling (Nâng cao):**

1.  **Git:**
    - Làm thế nào để **rollback một commit** đã push lên remote?
    - Giải thích về **Git Hooks** và cách bạn có thể sử dụng chúng.
    - Bạn đã từng sử dụng **submodules hoặc subtrees** trong Git chưa?
2.  **Docker:**
    - **Docker Volumes và Bind Mounts:** Sự khác biệt và khi nào sử dụng.
    - **Docker Networking:** Các chế độ mạng của Docker (bridge, host, none) và khi nào sử dụng chúng.
    - **Docker Swarm hoặc Kubernetes (concepts):** Nếu có kinh nghiệm, hãy nói về orchestration.
    - Cách bạn tối ưu **kích thước Docker image** cho ứng dụng của mình.
    - Làm thế nào để **debug một ứng dụng đang chạy trong Docker container**?
3.  **CI/CD:**
    - Bạn sẽ thiết kế một **CI/CD pipeline** cho một ứng dụng Fullstack (Next.js + NestJS) như thế nào? Các giai đoạn chính là gì?
    - Làm thế nào để tích hợp **automated testing** vào pipeline CI/CD?
    - **Blue/Green Deployment và Canary Deployment:** Giải thích và ưu nhược điểm.
4.  **Monitoring & Logging:**
    - Ngoài ELK Stack, bạn có kinh nghiệm với các công cụ monitoring/logging nào khác không?
    - Cách bạn sẽ thiết lập **alerts** cho ứng dụng của mình khi có sự cố.
    - **Distributed Tracing:** Nếu có kinh nghiệm (Jaeger, Zipkin).
5.  **Cloud Platforms (AWS/GCP/Azure):**
    - Bạn đã sử dụng những dịch vụ nào trên các nền tảng đám mây? (VD: EC2, S3, RDS, Lambda, EKS, App Engine, Cloud Run).
    - Cách bạn sẽ **deploy và scale** một ứng dụng Fullstack lên cloud.

---

**Lời khuyên cuối cùng:**

- **Không cần phải biết TẤT CẢ:** Danh sách này rất dài để đảm bảo độ bao quát. Nhà tuyển dụng không mong đợi bạn biết mọi thứ, nhưng họ sẽ đánh giá cao chiều sâu kiến thức ở những phần bạn tuyên bố biết.
- **Điểm mạnh:** Tập trung ôn kỹ những phần bạn tự tin nhất và có kinh nghiệm thực tế. Chuẩn bị những ví dụ cụ thể từ các dự án của bạn để minh họa câu trả lời.
- **Khuyết điểm:** Đối với những phần bạn chưa mạnh, hãy thành thật nói rằng bạn có kiến thức cơ bản hoặc quan tâm và sẵn sàng học hỏi.
- **Thực hành Coding Challenge:** Luôn chuẩn bị cho một bài test coding nhỏ hoặc giải quyết một bài toán thuật toán trên bảng trắng (whiteboard coding).
- **Kiểm tra kiến thức:** Sau khi ôn tập, hãy tự đặt câu hỏi hoặc nhờ bạn bè phỏng vấn thử để kiểm tra lại kiến thức.

## 💡 TIPS PHỎNG VẤN — Chi Tiết

### 1. Trước buổi phỏng vấn

- **Research công ty:** Stack công nghệ, scale (bao nhiêu user), các blog kỹ thuật họ đăng
- **Review dự án của mình:** Nhớ lại số liệu cụ thể, quyết định kỹ thuật đã làm
- **Chuẩn bị câu hỏi ngược:** "Tech stack chính hiện tại?", "Team size và quy trình CI/CD?", "Thách thức kỹ thuật lớn nhất hiện tại?"

### 2. Cách trả lời câu hỏi kỹ thuật

**Dùng framework STAR (Situation → Task → Action → Result):**

> _"Tại dự án X, hệ thống bị chậm khi có 10k record [Situation]. Tôi cần tối ưu không đụng đến BE [Task]. Tôi implement virtualization với TanStack Virtual, chỉ render 20 rows visible [Action]. Kết quả: từ 8s render xuống 200ms [Result]."_

### 3. Khi không biết câu trả lời

❌ Đừng im lặng hoặc nói "Em không biết".  
✅ Nói: _"Tôi chưa làm trực tiếp với X, nhưng tôi hiểu concept là... Cách tôi sẽ tiếp cận là..."_

### 4. System Design Interview — Cách tiếp cận

Khi được hỏi "Thiết kế hệ thống Y":

1. **Clarify requirements:** "Bao nhiêu user? Chức năng nào ưu tiên?"
2. **Estimate scale:** "100k DAU → ~1000 RPS"
3. **High-level design:** Vẽ các thành phần chính
4. **Deep dive:** Chọn 1-2 phần phức tạp nhất để đi sâu
5. **Identify bottlenecks:** "Phần này có thể fail ở đâu?"

### 5. Câu hỏi hay bị hỏi nhất

**Behavioral:**

- _"Kể về lần conflict với team member?"_ → Tập trung vào communication, không đổ lỗi
- _"Thành tựu kỹ thuật tự hào nhất?"_ → Có số liệu, có impact rõ ràng
- _"Điểm yếu của bạn?"_ → Nói điểm yếu thật nhưng đang cải thiện

**Technical:**

- _"React re-render hoạt động thế nào?"_ → Virtual DOM, reconciliation, fiber
- _"Giải thích CORS?"_ → Same-origin policy, preflight request, headers
- _"JWT vs Session?"_ → JWT: stateless, phù hợp microservices; Session: stateful, dễ revoke
- _"SQL vs NoSQL khi nào?"_
- _"Giải thích async/await?"_

### 6. Keywords cần nhắc tự nhiên

Dù chỉ biết cơ bản, cố nhắc: `Redis`, `Kafka/RabbitMQ`, `Docker`, `Microservices`, `WebSocket`, `CI/CD`, `Horizontal Scaling`.

### 7. Mẹo lương

- Đừng báo mức lương kỳ vọng trước — "Tôi muốn nghe range của công ty trước"
- Nếu bị ép → báo cao hơn 20-30% mức thực muốn
- Negotiate bằng market data, không bằng "tôi cần tiền"

### 8. Câu hỏi System Design thực tế hay gặp

| Đề                     | Điểm cần nhắc                                                   |
| ---------------------- | --------------------------------------------------------------- |
| Thiết kế TikTok Feed   | CDN cho video, Redis cache feed, Kafka event, ML recommendation |
| Thiết kế Chat App      | WebSocket, Redis Pub/Sub, message persistence, read receipts    |
| Thiết kế URL Shortener | Unique ID generation, Redis cache, DB index, rate limiting      |
| Thiết kế Flash Sale    | Rate limit, Redis lock, Kafka queue, optimistic UI              |
| Thiết kế Auth System   | JWT + Refresh token, Redis session, OAuth2, rate limit login    |
