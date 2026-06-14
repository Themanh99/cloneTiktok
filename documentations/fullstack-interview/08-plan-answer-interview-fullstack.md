Chào bạn, đây là bản tổng hợp ĐẦY ĐỦ NHẤT, kết hợp toàn bộ chiến thuật phỏng vấn, phân tích dự án từ CV của bạn và các câu hỏi kỹ thuật chuyên sâu (Frontend, Backend, Database, Kiến trúc).

Toàn bộ được định dạng chuẩn Markdown. Bạn chỉ cần copy khối văn bản dưới đây dán vào Notion, Obsidian, Word hoặc in ra để học.
(người ta có thể hỏi thêm: nếu không dùng cách trên thì còn cách nào khác không ? hay so sánh cách này cách kia và chọn cách nào trade-offs ) bạn hãy trả lời cho tôi theo gợi ý trên từ sau trở đi

---

# 🚀 TỔNG HỢP KIẾN THỨC PHỎNG VẤN - CHU THẾ MẠNH (FULLSTACK / FRONTEND LEAD)

💡 **CHIẾN THUẬT CỐT LÕI (MÔ HÌNH STAR)**
Khi trả lời bất kỳ câu hỏi nào về kinh nghiệm, luôn giữ trong đầu cấu trúc này:

- **S (Situation) & T (Task):** Vấn đề là gì? (1-2 câu).
- **A (Action - Quan trọng nhất):** Dùng công nghệ/kỹ thuật gì để giải quyết? (3-4 câu).
- **R (Result):** Kết quả đạt được (Tốc độ tăng, code gọn hơn, team làm việc tốt hơn...).
- _Lưu ý: Học thuộc các **từ khóa in đậm**, không học vẹt từng chữ._

---

## PHẦN 1: MỞ ĐẦU - GIỚI THIỆU BẢN THÂN (ELEVATOR PITCH)

"Chào anh/chị, em là Mạnh. Em có hơn 4 năm kinh nghiệm làm Software Engineer, chuyên sâu về Fullstack với **ReactJS và Node.js**. Phần lớn thời gian em làm việc tại FPT Software, tham gia các dự án lớn cho khách hàng Nhật Bản, Hàn Quốc và Hong Kong.
Thế mạnh của em không chỉ ở việc code frontend mượt mà hay xây dựng API backend tối ưu, mà em còn có kinh nghiệm áp dụng các kiến trúc hiện đại như **BFF, Micro-frontend**. Trong dự án gần nhất, em đã đảm nhận vai trò **Frontend Lead**, phân tích yêu cầu, quản lý task và review code cho team. Mục tiêu ngắn hạn của em là đóng góp chuyên môn sâu cho dự án công ty, và mục tiêu dài hạn là phát triển lên vị trí **Technical Leader**. Đó là lý do em apply vào vị trí này."

---

## PHẦN 2: CÂU HỎI TỪ KINH NGHIỆM DỰ ÁN TRONG CV

### 1. Dự án Financial Middleware (Xử lý dữ liệu lớn)

**Câu hỏi:** _Làm sao em hiển thị mượt mà 10.000 dòng dữ liệu và xuất file Excel lớn mà trình duyệt không bị crash?_
**Trả lời:**

- **Về hiển thị:** "Thay vì render toàn bộ 10.000 DOM nodes cùng lúc gây đơ trình duyệt, em áp dụng kỹ thuật **Virtualization (Windowing)**. Tức là chỉ render những dòng dữ liệu đang hiển thị trong khung nhìn (viewport) của người dùng. Kèm theo đó là xử lý phân trang (Pagination) từ API."
- **Về xuất file Excel:** "Nếu file quá lớn, em chuyển logic xuống Backend (Node.js/Express). Backend query data từ DB và dùng kỹ thuật **Stream** để ghi data vào file dần dần thay vì nạp hết vào RAM. Nếu data cực khủng, em thiết kế dạng **Background Job**, xử lý ngầm và gửi Notification/Email cho user kèm link tải khi file đã sẵn sàng."

### 2. Dự án Accounting Web Application (Xử lý UI phức tạp)

**Câu hỏi:** _Hệ thống tính toán realtime phức tạp trên frontend (nhập số tiền tự động tính), em xử lý thế nào để không giật lag?_
**Trả lời:**
"Em kết hợp 2 kỹ thuật:

1.  Sử dụng **Debounce/Throttle** để tránh việc hàm tính toán bị gọi liên tục mỗi lần gõ phím. Nó chỉ chạy khi user dừng gõ hoặc nhấn Enter/Tab.
2.  Tối ưu state bằng **Redux**. Em chia nhỏ UI, dùng `React.memo` và select đúng state cần thiết từ store, đảm bảo chỉ những ô dữ liệu liên quan bị thay đổi mới re-render, giữ cho form luôn mượt."

---

## PHẦN 3: FRONTEND CHUYÊN SÂU (NÂNG CAO)

### 1. Xử lý Form lớn, nhiều input (Data-driven UI & Redux)

**Câu hỏi:** _Nếu có một form rất lớn, nhiều trường dữ liệu, em thiết kế và quản lý state như thế nào?_
**Trả lời:**
"Thay vì hard-code từng thẻ input, em áp dụng hướng **Data-driven UI**.

- **Về UI:** Em định nghĩa cấu trúc form bằng một mảng JSON Object (gồm `name, type, validation, defaultValue...`). Sau đó map mảng này để render ra các Component tương ứng. Cách này giúp tái sử dụng code và cực kỳ dễ mở rộng.
- **Về State:** Với form lớn, dùng `useState` ở component cha sẽ gây re-render toàn bộ form. Em đưa data quản lý bằng **Redux** (hoặc React Hook Form). Mỗi khi người dùng gõ, em dispatch action cập nhật đúng field đó vào Global Store. Các component con dùng `useSelector` lấy đúng data của nó, kết hợp `React.memo` để triệt tiêu re-render thừa."

### 2. Thiết lập Common Components (Modal, Toast)

**Câu hỏi:** _Em xây dựng các component dùng chung như Modal, Toast ra sao?_
**Trả lời:**
"Nguyên tắc của em là tách biệt logic và UI, quản lý tập trung:

- **Với Modal:** Em sử dụng **React Portal** để render DOM của Modal ra ngoài vùng `root` (thường gắn thẳng vào `body`). Việc này giải quyết dứt điểm các lỗi về `z-index` hay `overflow: hidden` bị CSS của component cha đè lên. State đóng/mở em đưa vào Redux/Context để có thể gọi ở bất cứ file nào.
- **Với Toast:** Em tạo một mảng `toasts` lưu trong Redux. Mỗi lần cần thông báo, gọi hàm `addToast()`. Component `<ToastContainer />` đặt ở App root sẽ lắng nghe mảng này và render. Em dùng `setTimeout` trong logic action để tự động remove toast sau vài giây."

### 3. Thiết lập Routing & Authentication

**Câu hỏi:** _Em quản lý Route và quyền truy cập (Role-based) ở Frontend thế nào?_
**Trả lời:**
"Em định nghĩa các route tập trung trong một file config. Để bảo mật, em xây dựng các **Higher-Order Components (HOC)** như `<PrivateRoute>` hay `<RoleRoute>`.
Khi user truy cập, Component sẽ check Access Token. Nếu có, check tiếp Role (RBAC) của user từ Redux xem có quyền vào Route đó không. Nếu không có quyền -> đá ra trang 403. Nếu hết hạn Token -> dùng Axios Interceptors gọi API Refresh Token ngầm, nếu thất bại mới đẩy về trang Login."

### 4. Tối ưu hiệu năng (Code Splitting & Prefetch)

**Câu hỏi:** _Bundle size quá lớn làm trang load chậm, em giải quyết ra sao?_
**Trả lời:**

- **Code Splitting:** Em dùng **`React.lazy()` và `<Suspense>`** (hoặc Dynamic Imports trong Next.js) để chia nhỏ bundle JS. Các component nặng hoặc các Page ít dùng chỉ được tải về khi user thực sự truy cập vào trang đó.
- **Prefetching:** Để tăng trải nghiệm, em prefetch dữ liệu. Với Next.js em tận dụng thẻ `<Link>`. Với React thuần, em kết hợp **React Query**, khi user `hover` chuột vào nút bấm chuyển trang, em trigger gọi API ngầm. Đến khi họ click thì data đã nằm sẵn trong Cache, giao diện hiện ra ngay lập tức.

---

## PHẦN 3B: BACKEND CHUYÊN SÂU (BỔ SUNG CHO MIDDLE-SENIOR)

### 1. RESTful API Design & Best Practices

**Câu hỏi:** _Em thiết kế RESTful API theo chuẩn nào? Phân biệt PUT vs PATCH?_
**Trả lời:**
"Em tuân thủ các convention chuẩn:

- **URL dạng danh từ số nhiều:** `/api/v1/users`, `/api/v1/orders/{id}/items` (nested resource).
- **HTTP Methods đúng ngữ nghĩa:** `GET` (đọc), `POST` (tạo mới), `PUT` (thay thế toàn bộ resource), `PATCH` (cập nhật 1 phần), `DELETE` (xóa).
- **PUT vs PATCH:** `PUT /users/1` gửi **toàn bộ** object user để thay thế. `PATCH /users/1` chỉ gửi field cần sửa (VD: `{ "name": "Mạnh" }`). Thực tế em dùng `PATCH` nhiều hơn vì ít data truyền đi.
- **Status Code chuẩn:** `200` OK, `201` Created, `204` No Content (delete), `400` Bad Request, `401` Unauthorized, `403` Forbidden, `404` Not Found, `409` Conflict, `422` Unprocessable Entity, `429` Too Many Requests, `500` Internal Server Error.
- **Response format thống nhất:** `{ "success": true, "data": {...}, "meta": { "page": 1, "total": 100 } }` cho list. Error: `{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "..." } }`
- **Versioning:** Em dùng URL prefix `/api/v1/`, `/api/v2/` để không breaking change cho client cũ."

### 2. Authentication & Authorization chuyên sâu

**Câu hỏi:** _Giải thích flow JWT Authentication đầy đủ. Access Token hết hạn thì sao?_
**Trả lời:**
"Flow đầy đủ:

1. User login → BE verify password (bcrypt hash compare) → Tạo **Access Token** (ngắn hạn, 15-30 phút) + **Refresh Token** (dài hạn, 7-30 ngày).
2. Access Token lưu trong **memory/variable** (KHÔNG lưu localStorage vì dễ bị XSS). Refresh Token lưu trong **httpOnly cookie** (không đọc được bằng JS).
3. Mỗi request, FE gửi Access Token qua header `Authorization: Bearer <token>`.
4. Khi Access Token hết hạn (BE trả 401), FE dùng **Axios Interceptor** tự động gọi `/api/auth/refresh` gửi Refresh Token lên.
5. BE verify Refresh Token → Trả về Access Token mới. Nếu Refresh Token cũng hết hạn → Đẩy user về Login.

**Về Authorization (RBAC):**

- Em lưu `role` trong JWT payload: `{ "userId": 1, "role": "admin" }`.
- BE dùng **Guard/Middleware** check role trước khi vào Controller. VD: `@Roles('admin')` decorator trong NestJS.
- FE dùng HOC `<RoleRoute allowedRoles={['admin']}>` để ẩn/hiện route."

### 3. Caching & Memory Store (Redis vs Memcached)

**Câu hỏi:** _Hệ thống chậm, em áp dụng Cache ở đâu? Phân biệt Redis và Memcached?_
**Trả lời:**
"Em thiết kế cache đa tầng (**Multi-tier Caching**):

1. **Client-side (Browser):** Cấu hình HTTP Cache Headers (`Cache-Control`, `ETag`) cho static assets. Sử dụng **React Query / SWR** ở Frontend để lưu cache API responses trong memory, giảm thiểu request trùng lặp.
2. **Gateway Cache (CDN):** Sử dụng Cloudflare/CloudFront để cache các static resources và các API responses mang tính chất tĩnh (public và ít thay đổi).
3. **Application Cache (Backend Store):** Sử dụng **Redis** làm cache layer phân tán.
4. **Database Cache:** Tận dụng Buffer Pool (MySQL) hoặc Shared Buffers (PostgreSQL).

**So sánh Redis và Memcached:**

- **Data Structures:** Memcached chỉ hỗ trợ kiểu dữ liệu Key-Value đơn giản (chuỗi string, giới hạn key 250 bytes, value 1MB). **Redis** hỗ trợ đa dạng kiểu dữ liệu: Strings, Lists, Hashes, Sets, Sorted Sets (ZSET - rất mạnh cho leaderboards), Bitmaps, HyperLogLogs.
- **Persistence (Tính bền vững):** Memcached chạy hoàn toàn trên RAM, mất điện/restart là mất sạch data. **Redis** hỗ trợ ghi dữ liệu xuống đĩa cứng qua 2 cơ chế: **RDB** (Snapshot định kỳ) và **AOF** (Append Only File - log lại mọi lệnh ghi).
- **Architecture & Performance:** Memcached có kiến trúc **Multi-threaded**, tận dụng tốt CPU nhiều nhân cho các tác vụ key-value thuần túy. **Redis** có kiến trúc **Single-threaded** cho nhân xử lý lệnh (event loop đơn luồng, tránh overhead do context switching và lock tranh chấp), nhưng từ bản 6.0 trở đi đã hỗ trợ multi-threaded cho I/O socket network.
- **Scale & High Availability:** Redis hỗ trợ **Replication** (Master-Slave), **Redis Sentinel** (tự động failover khi Master sập), và **Redis Cluster** (phân tán dữ liệu tự động qua sharding 16384 hash slots). Memcached không hỗ trợ replication gốc, việc scale thường phải xử lý ở phía client (Consistent Hashing).

_Lựa chọn:_ Em luôn ưu tiên **Redis** cho các hệ thống hiện đại nhờ tính linh hoạt của cấu trúc dữ liệu, khả năng bền vững và hệ sinh thái cluster mạnh mẽ."

**Câu hỏi:** _Hãy giải thích các lỗi kinh điển khi dùng Cache và cách em xử lý: Cache Penetration, Cache Avalanche, Cache Breakdown?_
**Trả lời:**
"- **Cache Penetration (Thủng Cache):** Khi user request liên tục các key **không tồn tại** cả trong Cache lẫn DB (ví dụ: hacker spam `GET /users/-9999`). Hệ thống sẽ luôn miss cache và chọc thẳng xuống DB gây quá tải.

- _Cách xử lý:_
  1. **Cache Null Value:** Lưu key đó vào Redis với value là `null` hoặc chuỗi rỗng kèm TTL cực ngắn (1-2 phút).
  2. **Bloom Filter:** Dùng cấu trúc dữ liệu Bloom Filter đứng trước cache để kiểm tra nhanh xem key có khả năng tồn tại trong DB không. Nếu Bloom Filter bảo 'không', chặn luôn không cho đi tiếp.

* **Cache Avalanche (Tuyết lở):** Khi một lượng lớn key trong cache hết hạn (**expire**) cùng một thời điểm, hoặc khi server Redis bị sập đột ngột. Toàn bộ traffic sẽ dồn dập đổ xuống DB cùng lúc làm DB bị 'đơ' hoặc crash.
  - _Cách xử lý:_
    1. **Randomize TTL (Jitter):** Thêm một khoảng thời gian ngẫu nhiên (ví dụ: 5 phút + random 0 đến 60 giây) vào TTL của từng key để tránh việc chúng hết hạn cùng lúc.
    2. **High Availability:** Triển khai Redis Cluster / Sentinel để đảm bảo tính sẵn sàng cao, tránh single point of failure.
    3. **Circuit Breaker:** Sử dụng cơ chế ngắt mạch (như Hystrix/Resilience4j hoặc thư viện node-resilience) giới hạn traffic xuống DB khi quá tải.
* **Cache Breakdown / Cache Stampede:** Khi một key cực kỳ hot (ví dụ: thông tin khuyến mãi đang được triệu người truy cập) vừa hết hạn, hàng vạn request đồng thời bị 'miss' cache và cùng chọc xuống DB để đọc dữ liệu và ghi lại vào cache.
  - _Cách xử lý:_
    1. **Mutex Lock (Single Flight / Semaphore):** Dùng lock (như `redlock` hoặc lock local) chỉ cho phép **1 request duy nhất** đi xuống DB lấy data và ghi lại vào cache, các request khác phải chờ hoặc trả về dữ liệu cũ tạm thời (Stale-while-revalidate).
    2. **Bỏ TTL cho Hot Keys:** Set các key này không bao giờ hết hạn, và sử dụng một background worker để cập nhật dữ liệu ngầm tuần tự."

**Câu hỏi:** _Redis có các cơ chế Eviction (thu hồi bộ nhớ) nào khi bị đầy RAM?_
**Trả lời:**
"Khi RAM của Redis chạm ngưỡng `maxmemory`, nó sẽ kích hoạt policy cấu hình sẵn để giải phóng bộ nhớ:

1. **noeviction (Mặc định):** Trả về lỗi khi có lệnh ghi mới (lệnh đọc vẫn bình thường). An toàn nhất nhưng làm gián đoạn ghi dữ liệu.
2. **allkeys-lru (Least Recently Used):** Loại bỏ key ít được truy cập gần đây nhất trong toàn bộ database. Thường dùng nhất.
3. **volatile-lru:** Chỉ loại bỏ các key ít được truy cập gần đây nhất trong số các key có set TTL (hết hạn).
4. **allkeys-lfu (Least Frequently Used):** Loại bỏ các key có tần suất truy cập thấp nhất.
5. **volatile-lfu:** Chỉ loại bỏ các key ít tần suất truy cập nhất trong số các key có set TTL.
6. **volatile-ttl:** Loại bỏ key có thời gian sống (TTL) còn lại ngắn nhất."

### 4. Message Queue & Asynchronous Processing

**Câu hỏi:** _Khi nào em dùng Message Queue? Cho ví dụ thực tế._
**Trả lời:**
"Em dùng Message Queue (RabbitMQ, Bull/BullMQ với Redis, hoặc AWS SQS) khi:

1. **Tác vụ nặng không cần response ngay:** Gửi email, generate PDF/Excel, resize ảnh → User submit → API trả `202 Accepted` ngay → Worker xử lý ngầm → Notify user khi xong.

2. **Decoupling services:** Service A (Order) không gọi trực tiếp Service B (Inventory). Thay vào đó publish event `OrderCreated` vào Queue → Service B subscribe và xử lý. Nếu B bị down, message nằm trong Queue chờ B recover.

3. **Rate limiting / Throttling:** Hệ thống thanh toán chỉ cho phép 100 request/s → Đẩy vào Queue, Worker lấy ra xử lý tuần tự.

**Ví dụ thực tế trong dự án Financial Middleware:**
Export Excel 50.000 dòng → API nhận request → Đẩy job vào BullMQ → Worker query DB theo batch (mỗi lần 5000 dòng) → Stream ghi file → Upload S3 → Gửi notification cho user kèm link download."

### 5. Error Handling & Logging

**Câu hỏi:** _Em xử lý lỗi và logging trong hệ thống production thế nào?_
**Trả lời:**
"**Error Handling:**

- BE: Em tạo **Global Exception Filter** (NestJS) hoặc Error Middleware (Express). Mọi error đều đi qua đây, format response chuẩn và log lại.
- Phân biệt: **Operational Error** (4xx - lỗi do user input, xử lý được) vs **Programmer Error** (5xx - bug, cần fix code).
- Custom Error Classes: `ValidationError`, `NotFoundError`, `UnauthorizedError` kế thừa từ `BaseError`.

**Logging:**

- Dùng **Winston** hoặc **Pino** (nhanh hơn 5x Winston).
- Log levels: `error` → `warn` → `info` → `debug`. Production chỉ bật `info` trở lên.
- Mỗi request gắn **Correlation ID** (UUID) để trace log xuyên suốt từ FE → BFF → Microservice.
- Log đẩy về **ELK Stack** (Elasticsearch + Logstash + Kibana) hoặc Datadog để search, visualize, alert."

### 6. Security Best Practices

**Câu hỏi:** _Em bảo mật API và ứng dụng web thế nào?_
**Trả lời:**
"Em áp dụng nhiều lớp bảo vệ:

1. **Input Validation:** Validate ở cả FE (UX) và BE (bắt buộc). Dùng `class-validator` (NestJS), Zod/Yup. **Whitelist** input, KHÔNG blacklist.
2. **SQL Injection:** KHÔNG bao giờ nối chuỗi SQL thủ công. Luôn dùng **Parameterized Queries** hoặc ORM (TypeORM, Prisma).
3. **XSS (Cross-Site Scripting):** Escape HTML output. React đã auto-escape nhưng cẩn thận `dangerouslySetInnerHTML`. Set header `Content-Security-Policy`.
4. **CSRF:** Dùng **CSRF Token** cho form submit. Hoặc dùng `SameSite=Strict` cookie.
5. **Rate Limiting:** Dùng `express-rate-limit` hoặc Redis-based limiter: 100 requests/IP/phút cho API, 5 requests/IP/phút cho login.
6. **CORS:** Config chặt, chỉ cho phép domain cụ thể, KHÔNG dùng `origin: '*'` ở production.
7. **Sensitive Data:** Hash password bằng **bcrypt** (salt rounds >= 10). KHÔNG log password, token, credit card.
8. **Helmet.js:** Set security headers tự động (X-Frame-Options, X-Content-Type-Options, etc.)."

### 7. Rate Limiting & DDoS Protection

**Câu hỏi:** _Hệ thống bị spam request, em xử lý thế nào?_
**Trả lời:**
"Em áp dụng **multi-layer protection:**

- **Layer 1 - CDN/WAF:** Cloudflare hoặc AWS WAF chặn bot, DDoS ở edge trước khi request đến server.
- **Layer 2 - Nginx:** Limit connection per IP (`limit_conn`), limit request rate (`limit_req`).
- **Layer 3 - Application:** Em dùng **Sliding Window Rate Limiter** với Redis. Ví dụ: Key = `rate:user:{userId}:{endpoint}`, value = count, TTL = 60s. Vượt threshold → Trả `429 Too Many Requests`.
- **Layer 4 - Specific:** Login endpoint: 5 lần sai → Lock 15 phút. OTP: 3 lần sai → Block. API key: Quota theo plan (Free: 1000/ngày, Pro: 50000/ngày)."

### 8. Database Transaction & Concurrency

**Câu hỏi:** _Giải thích Isolation Levels. Khi nào dùng Pessimistic vs Optimistic Locking?_
**Trả lời:**
"**4 Isolation Levels (từ lỏng → chặt):**

1. `READ UNCOMMITTED` → Đọc data chưa commit (dirty read). Hầu như không dùng.
2. `READ COMMITTED` → Chỉ đọc data đã commit. **Default của PostgreSQL.** Tránh dirty read nhưng có thể non-repeatable read.
3. `REPEATABLE READ` → **Default của MySQL.** Đảm bảo đọc lại cùng row cho cùng 1 kết quả trong transaction.
4. `SERIALIZABLE` → Chặt nhất, như chạy tuần tự. Chậm nhất, dùng cho financial.

**Pessimistic Locking:** Lock row khi đọc (`SELECT ... FOR UPDATE`). Dùng khi **xác suất xung đột CAO** (VD: 2 người cùng mua 1 vé cuối cùng). Nhược: Giảm throughput.
**Optimistic Locking:** Thêm cột `version`. Khi update, check `WHERE version = old_version`. Nếu version đã thay đổi → Retry. Dùng khi **xác suất xung đột THẤP** (VD: edit profile)."

---

## PHẦN 4: KIẾN TRÚC, BACKEND & DATABASE

### 1. Kiến trúc Micro Front-end & BFF

**Câu hỏi:** _Micro-frontend và BFF có tác dụng gì trong các dự án em đã làm?_
**Trả lời:**

- **Micro Front-end:** Dùng _Webpack Module Federation_, em chia app lớn thành các app nhỏ. Lợi ích lớn nhất là các team có thể **phát triển và deploy độc lập** không dẫm chân lên nhau, codebase nhỏ gọn dễ maintain.
- **BFF (Backend-for-Frontend):** Là một Node.js server đứng giữa FE và Microservices. Thay vì FE phải gọi 4-5 API khác nhau rồi tự gộp data, BFF sẽ đứng ra gọi các API đó, xử lý logic, format lại cấu trúc JSON chuẩn xác rồi trả về cho FE trong **1 request duy nhất**. Việc này giảm tải cho trình duyệt và tăng bảo mật hệ thống.

### 2. Next.js vs ReactJS

**Câu hỏi:** _Tại sao em chọn Next.js cho dự án CMS/Blockchain thay vì ReactJS thuần?_
**Trả lời:**
"ReactJS thuần (CSR) phù hợp cho tool nội bộ. Nhưng với dự án cần SEO, tốc độ Load trang đầu (First Contentful Paint) nhanh, em chọn **Next.js**. Nó hỗ trợ **SSR (Server-Side Rendering)** giúp render HTML từ server, tốt cho bot Google. Hơn nữa Next.js có API Routes giúp em code được vài tính năng backend nhẹ nhàng ngay trên cùng 1 repo."

### 3. NestJS vs ExpressJS

**Câu hỏi:** _Em đã dùng cả NestJS và ExpressJS, em đánh giá 2 thằng này thế nào?_
**Trả lời:**
"**ExpressJS** nhẹ, setup nhanh, hợp với microservices nhỏ. Nhưng nhược điểm là không có cấu trúc chuẩn, dự án to dễ thành code rác.
**NestJS** giải quyết việc đó bằng kiến trúc chuẩn doanh nghiệp (giống Spring Boot). Nó ép chuẩn dùng TypeScript, OOP và đặc biệt là **Dependency Injection (DI)**. Code được chia Module, Controller, Service rất rõ ràng. Với các dự án scale lớn, NestJS giúp team maintain và mở rộng cực kỳ nhàn."

### 4. Advanced Relational & Document Databases (MySQL vs MongoDB)

**Câu hỏi:** _So sánh chi tiết MySQL và MongoDB. Khi nào em chọn thằng nào cho dự án?_
**Trả lời:**
"Đây là hai trường phái cơ sở dữ liệu khác nhau:

- **MySQL (Relational Database - RDBMS):**
  - _Mô hình:_ Lưu dữ liệu dưới dạng bảng (Tables), hàng (Rows), cột (Columns). Schema cố định và nghiêm ngặt.
  - _Quan hệ:_ Hỗ trợ khóa ngoại (`FOREIGN KEY`) và các phép `JOIN` phức tạp cực tốt.
  - _Tính chất:_ Tuân thủ nghiêm ngặt **ACID** (Atomicity, Consistency, Isolation, Durability) - cực kỳ quan trọng cho các giao dịch tài chính, kế toán.
  - _Nhược điểm:_ Khó scale ngang (Horizontal Scaling) hơn, việc thay đổi schema (migration) trên bảng lớn hàng chục triệu dòng rất rủi ro.
- **MongoDB (Document-oriented NoSQL):**
  - _Mô hình:_ Lưu dữ liệu dưới dạng tài liệu JSON/BSON linh hoạt. Schema-less (mỗi document trong cùng collection có thể có cấu trúc khác nhau).
  - _Quan hệ:_ Không hỗ trợ JOIN mạnh như SQL (có `$lookup` nhưng performance không cao bằng). Thay vào đó, dữ liệu thường được lưu theo dạng lồng nhau (**Embedding / Denormalization**).
  - _Tính chất:_ Tuân thủ định lý CAP (thường ưu tiên Partition tolerance và Consistency hoặc Availability). Tốc độ đọc/ghi cực nhanh với lượng dữ liệu lớn phi cấu trúc. Dễ dàng scale ngang nhờ cơ chế Sharding tích hợp sẵn.
  - _Nhược điểm:_ Không phù hợp cho các dữ liệu có mối quan hệ chằng chi tiết, hoặc các nghiệp vụ tài chính đòi hỏi tính toàn vẹn cao.

_Nguyên tắc lựa chọn:_ Em chọn **MySQL** khi làm các phân hệ tài chính, đơn hàng, hóa đơn, hoặc dữ liệu có cấu trúc ổn định, cần ACID. Em chọn **MongoDB** khi làm các tính năng như Log hệ thống, Thông báo (Notifications), Chat history, Giỏ hàng, hoặc các thông tin sản phẩm có thuộc tính động thay đổi liên tục."

**Câu hỏi:** _Kiến trúc Index trong MySQL hoạt động thế nào? Sự khác nhau giữa B+Tree Index và Hash Index? Left-most Prefix Rule là gì?_
**Trả lời:**
"- **B+Tree Index (Mặc định trong InnoDB):**

- Dữ liệu index được tổ chức dưới dạng cây tự cân bằng. Các node lá (leaf nodes) chứa dữ liệu thực tế (hoặc con trỏ trỏ tới dữ liệu) và được liên kết với nhau bằng danh sách liên kết đôi (doubly-linked list).
- _Ưu điểm:_ Hỗ trợ cực tốt cho các truy vấn so sánh bằng (`=`), so sánh khoảng (`<`, `>`, `BETWEEN`), sắp xếp (`ORDER BY`), và tìm kiếm tiền tố (`LIKE 'abc%'`).

* **Hash Index:**
  - Sử dụng một hàm băm (hash function) để map giá trị cột thành địa chỉ dòng.
  - _Ưu điểm:_ Truy vấn so sánh bằng (`=`) cực nhanh với độ phức tạp $O(1)$.
  - _Nhược điểm:_ Không hỗ trợ truy vấn khoảng (range query), không hỗ trợ sắp xếp và không hỗ trợ tìm kiếm khớp một phần.
* **Left-most Prefix Rule (Quy tắc tiền tố bên trái nhất):**
  - Khi tạo một Composite Index (Index tổ hợp nhiều cột), ví dụ `INDEX(col_a, col_b, col_c)`. Optimizer của MySQL chỉ sử dụng index này nếu câu lệnh `WHERE` chứa cột ngoài cùng bên trái trước.
  - Các trường hợp được dùng index: `WHERE col_a = 1`, `WHERE col_a = 1 AND col_b = 2`, `WHERE col_a = 1 AND col_b = 2 AND col_c = 3`.
  - Các trường hợp **KHÔNG** dùng được index (hoặc chỉ dùng được một phần nhỏ): `WHERE col_b = 2`, `WHERE col_b = 2 AND col_c = 3`. Do đó, thứ tự đặt cột khi tạo composite index cực kỳ quan trọng."

**Câu hỏi:** _Cách em đọc và phân tích một Execution Plan trong MySQL để tối ưu truy vấn?_
**Trả lời:**
"Em sử dụng lệnh `EXPLAIN` hoặc `EXPLAIN ANALYZE` (MySQL 8.0) trước câu truy vấn SQL để xem Optimizer dự định chạy thế nào. Các trường quan trọng cần phân tích:

1. **type (Kiểu liên kết):** Cho biết MySQL quét bảng bằng cách nào. Thứ tự hiệu năng từ tốt đến tệ:
   - `const/system`: Truy vấn lấy ra 1 dòng duy nhất qua Primary Key hoặc Unique Index (Tốt nhất).
   - `eq_ref`: Đọc một dòng từ bảng này cho mỗi dòng từ bảng trước trong phép JOIN qua unique index.
   - `ref`: Đọc các dòng khớp giá trị qua non-unique index.
   - `range`: Quét index trong một khoảng giá trị (`WHERE id > 100`, `WHERE col IN (...)`).
   - `index`: Quét toàn bộ cây index (Full Index Scan) - vẫn tốt hơn quét bảng vật lý.
   - `ALL`: Quét toàn bộ bảng vật lý (Full Table Scan) - Cần tránh bằng mọi giá để không gây nghẽn I/O.
2. **possible_keys & key:** `possible_keys` là các index MySQL có thể dùng, `key` là index MySQL **thực tế chọn**. Nếu `key` là `NULL`, nghĩa là truy vấn không dùng index.
3. **rows:** Số lượng dòng dự kiến MySQL phải đọc để ra kết quả. Số này càng nhỏ càng tốt.
4. **Extra:** Chứa thông tin bổ sung cực kỳ quan trọng:
   - `Using index (Covering Index)`: Chỉ cần đọc dữ liệu trên cây Index, không cần chọc xuống đĩa đọc bảng vật lý (Hiệu năng cực cao).
   - `Using filesort`: MySQL phải thực hiện sắp xếp dữ liệu ngoài bộ nhớ (Rất chậm, cần tối ưu bằng cách thêm index cho cột `ORDER BY`).
   - `Using temporary`: MySQL phải tạo bảng tạm (thường do `GROUP BY` hoặc `DISTINCT` không tối ưu, rất tốn tài nguyên)."

**Câu hỏi:** _Làm thế nào để thiết kế Schema và tối ưu hiệu năng trong MongoDB? Kỹ thuật Sharding và Replication hoạt động thế nào?_
**Trả lời:**
"- **Thiết kế Schema (Embedded vs Referenced):**

- **Embedding (Denormalization - Nhúng dữ liệu):** Lưu các document liên quan vào trong cùng một document cha dưới dạng mảng hoặc sub-document.
  - _Khi nào dùng:_ Mối quan hệ 1:1 hoặc 1:N nơi N là hữu hạn và nhỏ (ví dụ: 1 User có vài địa chỉ). Dữ liệu con ít khi cập nhật độc lập và thường được đọc cùng lúc với document cha.
- **Referencing (Normalization - Tham chiếu):** Lưu `_id` của document liên quan ở document khác (giống khóa ngoại).
  - _Khi nào dùng:_ Mối quan hệ 1:N nơi N tăng trưởng vô hạn (ví dụ: 1 tác giả có hàng vạn bài viết) hoặc khi dữ liệu con được cập nhật liên tục và dùng chung bởi nhiều document khác.

* **Tối ưu hóa Aggregation Pipeline:**
  - Quy tắc vàng: **Filter early, Project late**. Luôn đưa `$match` và `$limit` lên đầu pipeline để lọc bớt data sớm, tận dụng được Index. Dùng `$project` ở cuối để chỉ trả về các field cần thiết.
* **Replication (Bảo đảm tính sẵn sàng cao - HA):**
  - MongoDB sử dụng **Replica Set** gồm 1 node Primary (nhận mọi lệnh Write và mặc định cả Read) và nhiều node Secondary (đồng bộ dữ liệu bất đồng bộ từ Primary qua `oplog`). Nếu node Primary sập, các node Secondary sẽ tự động bầu chọn (election) một node lên làm Primary mới.
* **Sharding (Mở rộng theo chiều ngang - Horizontal Scaling):**
  - Khi dung lượng data vượt quá khả năng lưu trữ của một server đơn lẻ, MongoDB phân chia dữ liệu sang nhiều cluster nhỏ (Shards) dựa trên một trường dữ liệu gọi là **Shard Key**. Cần chọn Shard Key có **cardinality cao** (độ phân tán lớn, ví dụ: `userId`) để dữ liệu được chia đều vào các Shard, tránh tạo ra 'hot shard' (một shard bị quá tải còn các shard khác rảnh)."

---

## PHẦN 5: LEADERSHIP & CÂU HỎI HÀNH VI

### 1. Kỹ năng Code Review (Dự án Digital Adoption)

**Câu hỏi:** _Là Frontend Lead, tiêu chí review code của em cho team là gì?_
**Trả lời:**
"Em review dựa trên 3 tiêu chí:

1.  **Business Logic:** Code có cover đủ các luồng yêu cầu và edge cases (trường hợp ngoại lệ) không.
2.  **Clean Code & Convention:** Phải tuân thủ Eslint/Prettier, đặt tên biến có ý nghĩa, không lặp code (DRY).
3.  **Performance:** Check xem code có gây re-render vô tội vạ không (có cần dùng `useMemo`, `useCallback` không), có quên cleanup sự kiện trong `useEffect` gây memory leak không."

### 2. Điểm yếu và cách khắc phục

**Câu hỏi:** _Điểm yếu của em là gì?_
**Trả lời:**
"Làm outsourcing ở FPT, ban đầu em hay bị đuối khi phải **Context Switching (chuyển đổi bối cảnh)** giữa nhiều dự án và tech-stack liên tục. Nhưng em đã khắc phục bằng cách rèn luyện thói quen tự học nhanh, luôn đọc và viết tài liệu (Documentation) rõ ràng trước khi code. Giờ đây, việc thích nghi nhanh với một codebase mới lại trở thành điểm mạnh lớn nhất của em." _(Lưu ý: Có thể khéo léo nhắc thêm việc mình chủ động thi chứng chỉ Udacity và tiếng Anh để tự nâng cao bản thân)._

---

## PHẦN 5B: DESIGN PATTERNS & KỸ THUẬT THỰC TẾ

### 1. Design Patterns hay dùng trong dự án thực tế

**Câu hỏi:** _Em đã áp dụng Design Pattern nào trong dự án thực tế?_
**Trả lời:**

**Backend:**

- **Repository Pattern:** Tách logic truy vấn DB ra khỏi Service. Service gọi `userRepository.findById(id)` thay vì viết SQL trực tiếp. Dễ swap DB hoặc mock khi test.
- **Strategy Pattern:** Hệ thống thanh toán có nhiều phương thức (VNPay, Momo, Stripe). Em tạo interface `PaymentStrategy` với method `pay()`. Mỗi provider implement riêng. Controller chỉ gọi `strategy.pay()` mà không cần `if/else`.
- **Factory Pattern:** Tạo object phức tạp. VD: `NotificationFactory.create('email')` trả về EmailNotification, `create('sms')` trả về SmsNotification.
- **Observer/Event Pattern:** Khi user đặt hàng thành công, emit event `OrderCreated` → Các listener tự xử lý: gửi email, trừ kho, log audit. Không cần OrderService phải biết về EmailService.
- **Singleton Pattern:** Database connection pool, Logger instance, Config manager - chỉ tạo 1 lần dùng xuyên suốt app.
- **Middleware/Chain of Responsibility:** Request đi qua chuỗi: Auth → RateLimit → Validation → Controller. Mỗi middleware chỉ lo 1 việc.

**Frontend:**

- **Compound Component Pattern:** `<Select> <Select.Option /> <Select.Option /> </Select>` - component cha chia sẻ state nội bộ với con qua Context.
- **Render Props / Custom Hooks:** Tách logic tái sử dụng ra hook: `useDebounce`, `usePagination`, `useAuth`.
- **Container/Presentational:** Component "thông minh" (có logic, fetch data) bọc Component "ngu" (chỉ nhận props render UI).
- **HOC (Higher-Order Component):** `withAuth(Component)` - wrap component với logic check authentication.

### 2. Tối ưu SQL nâng cao (Thực tế dự án)

**Câu hỏi:** _Cho ví dụ thực tế em đã tối ưu query SQL chậm?_
**Trả lời:**

**Case 1 - Slow Query Report (Financial Middleware):**
"Có 1 báo cáo giao dịch query bảng 5 triệu dòng, load mất 12 giây. Em xử lý:

1. Chạy `EXPLAIN ANALYZE` → Phát hiện Full Table Scan trên cột `created_at` và `status`.
2. Tạo **Composite Index** `(status, created_at)` → Giảm xuống 200ms.
3. Thêm điều kiện `WHERE created_at >= '2024-01-01'` thay vì lấy hết → Giới hạn range scan.
4. Bỏ `SELECT *`, chỉ lấy columns cần thiết → Giảm I/O."

**Case 2 - N+1 Query:**
"Liệt kê 100 orders kèm thông tin user. Code ban đầu: Query 1 lần lấy orders, rồi loop 100 lần query user → 101 queries. Fix: Dùng `JOIN` hoặc ORM `include/eager loading` → 1-2 queries."

**Case 3 - Pagination trên bảng lớn:**
"Bảng 10M rows, `OFFSET 9000000 LIMIT 20` cực chậm vì DB vẫn phải đếm qua 9M rows. Fix: Chuyển sang **Keyset/Cursor Pagination**: `WHERE id > :lastId ORDER BY id LIMIT 20`. Tốc độ O(1) thay vì O(n)."

**Case 4 - Deadlock:**
"2 transaction cùng lock 2 bảng theo thứ tự ngược nhau → Deadlock. Fix: Đảm bảo tất cả transaction lock bảng theo **cùng một thứ tự**. Set `lock_wait_timeout` hợp lý."

### 3. Tối ưu hiệu năng Backend (Load & Scalability)

**Câu hỏi:** _API chậm, em debug và tối ưu thế nào?_
**Trả lời:**
"Em debug theo thứ tự:

1. **Đo trước, tối ưu sau.** Dùng APM tool (Datadog, New Relic) hoặc `console.time()` để tìm bottleneck chính xác.
2. **Database là thủ phạm #1:** 80% API chậm do query chậm. Check slow query log, thêm Index, tối ưu JOIN.
3. **Caching:** Data ít thay đổi (config, danh mục) → Cache Redis TTL 5-30 phút.
4. **Connection Pooling:** Không tạo DB connection mỗi request. Dùng pool (min: 5, max: 20).
5. **Async processing:** Tác vụ nặng (gửi email, generate file) → Đẩy vào Queue xử lý ngầm.
6. **Horizontal Scaling:** Load Balancer (Nginx) phân tải request vào nhiều instance Node.js."

### 4. Frontend Performance nâng cao

**Câu hỏi:** _Ngoài Code Splitting, em còn tối ưu FE bằng cách nào?_
**Trả lời:**

- **Image Optimization:** Dùng `next/image` (auto resize, lazy load, WebP). Ảnh tĩnh dùng CDN.
- **Web Vitals:** Theo dõi LCP (<2.5s), FID (<100ms), CLS (<0.1). Dùng Lighthouse CI trong pipeline.
- **Memo hóa đúng cách:** `React.memo` cho component nhận props ổn định. `useMemo` cho tính toán nặng. `useCallback` cho function truyền xuống child. **Không memo tràn lan** - chỉ khi đo thấy bottleneck.
- **Virtualization:** Bảng >1000 dòng → Dùng `react-virtualized` hoặc `@tanstack/virtual`. Chỉ render ~20 row trong viewport.
- **Debounce search:** User gõ tìm kiếm → Debounce 300ms → Gọi API 1 lần thay vì mỗi keystroke.
- **Skeleton Loading:** Thay vì spinner, hiện skeleton giống layout thật → Giảm perceived loading time.
- **Bundle Analyzer:** Chạy `webpack-bundle-analyzer` tìm thư viện nặng. VD: Import `lodash/get` thay vì cả `lodash` (giảm 70KB).

### 5. System Design cơ bản (Hay hỏi Middle-Senior)

**Câu hỏi:** _Thiết kế hệ thống URL Shortener (bit.ly)?_
**Trả lời:**
"**Yêu cầu:** Tạo short URL, redirect, tracking clicks.

- **API:** `POST /shorten { url }` → trả `{ shortCode }`. `GET /:code` → redirect 301.
- **Short code generation:** Base62 encode auto-increment ID hoặc hash MD5 lấy 7 ký tự đầu. Check collision trong DB.
- **Database:** Table `urls(id, short_code, original_url, click_count, created_at)`. Index trên `short_code`.
- **Caching:** Hot URLs (truy cập nhiều) cache trong Redis. `GET /:code` → Check Redis trước → Miss thì query DB.
- **Scale:** Read-heavy → thêm Read Replica. Rất nhiều write → Sharding theo hash short_code."

**Câu hỏi:** _Thiết kế hệ thống Notification (Push, Email, SMS)?_
**Trả lời:**
"**Architecture:**

1. Service A (Order, Payment...) publish event vào **Message Queue** (RabbitMQ/Kafka).
2. **Notification Service** subscribe, quyết định channel (push/email/sms) dựa trên user preference.
3. Mỗi channel có **Provider Adapter** (Strategy Pattern): SendGrid cho email, Firebase cho push, Twilio cho SMS.
4. Retry failed notifications (exponential backoff: 1s, 2s, 4s, max 3 lần).
5. Lưu log notification vào DB để user xem lại history."

### 6. Docker, Containerization & DevOps

**Câu hỏi:** _Dockerfile của một dự án Node.js được viết và tối ưu hóa như thế nào để chạy trên Production?_
**Trả lời:**
"Để viết một Dockerfile tối ưu trên Production, em áp dụng các best practices sau:

1. **Sử dụng Base Image nhẹ và an toàn:** Dùng `node:18-alpine` hoặc distroless images thay vì `node:18` (bản đầy đủ). Nó giúp giảm kích thước image từ ~1GB xuống ~150MB, đồng thời giảm thiểu các lỗ hổng bảo mật (vulnerabilities).
2. **Tận dụng Layer Caching:** Copy `package.json` and `package-lock.json` trước, sau đó chạy `npm ci` (hoặc `npm install`), rồi mới copy toàn bộ source code sau. Điều này giúp Docker giữ lại cache của phần dependencies, không phải tải lại mỗi khi có thay đổi code nhỏ.
3. **Multi-stage Build:** Chia quá trình build thành 2 giai đoạn:
   - _Stage 1 (Build):_ Dùng full image để cài đặt devDependencies và build TypeScript thành Javascript.
   - _Stage 2 (Production Run):_ Chỉ dùng alpine image sạch, copy file JS đã build và thư mục `node_modules` (chỉ cài production dependencies) sang.
4. **Không chạy dưới quyền root:** Sử dụng user mặc định `USER node` của image để chạy app, hạn chế rủi ro bảo mật leo thang đặc quyền.
5. **Sử dụng `.dockerignore`:** Loại bỏ `node_modules`, `.git`, logs, tests, build artifacts khỏi Docker context khi build.

_Ví dụ Dockerfile tối ưu cho NestJS:_

````dockerfile
# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN npm prune --production # Xóa devDependencies

# Stage 2: Runner
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]
```"

**Câu hỏi:** _Em đã thiết lập và quản lý CI/CD pipeline thế nào? Phân biệt các chiến lược deploy: Rolling, Blue-Green, Canary?_
**Trả lời:**
"Em đã xây dựng pipeline CI/CD tự động bằng **GitHub Actions** kết hợp với AWS. Quy trình hoạt động:
1. **Code Commit / Pull Request:** Dev push code lên branch `develop` hoặc tạo PR vào `main`.
2. **CI Stage (Lint & Test & Build):**
   * Trigger GitHub Runner chạy ESLint kiểm tra code convention.
   * Chạy Unit Tests, Integration Tests. Kiểm tra coverage (phải > 80% mới pass).
   * Docker build image với tag là Commit SHA để kiểm tra lỗi build.
3. **CD Stage - Deploy Staging:** Khi merge code vào `develop`, pipeline tự động build Docker Image → push lên AWS ECR (Elastic Container Registry) → trigger AWS ECS cập nhật Service chạy trên môi trường Staging.
4. **CD Stage - Deploy Production:** Khi merge vào `main`, pipeline chạy kiểm tra tương tự. Sau đó dừng lại chờ **Manual Approval** từ Tech Lead/PM. Khi được duyệt, image được deploy lên cluster Production.

**So sánh các chiến lược Deployment:**
- **Rolling Update (Mặc định của Kubernetes/ECS):** Thay thế dần các container cũ bằng các container mới. Ví dụ: Chạy 4 container, tắt 1 cái cũ, bật 1 cái mới, lặp lại.
  * *Ưu điểm:* Tiết kiệm tài nguyên (không cần mua thêm server khi deploy).
  * *Nhược điểm:* Trong quá trình deploy, người dùng có thể gặp trạng thái không đồng nhất (nửa cũ nửa mới). Nếu lỗi xảy ra, việc rollback sẽ mất thời gian.
- **Blue-Green Deployment:** Tạo ra 2 môi trường giống hệt nhau: Blue (đang chạy production) và Green (phiên bản mới). Ta deploy lên Green, kiểm thử ok, rồi chuyển hướng Router/Load Balancer 100% traffic sang Green.
  * *Ưu điểm:* Zero-downtime, rollback lập tức (chỉ cần switch router ngược lại).
  * *Nhược điểm:* Tốn gấp đôi chi phí tài nguyên phần cứng trong quá trình deploy.
- **Canary Deployment:** Deploy phiên bản mới lên một nhóm nhỏ container (~5-10% traffic). Theo dõi log, tỷ lệ lỗi, phản hồi người dùng. Nếu ổn định mới rollout 100% traffic cho toàn bộ hệ thống.
  * *Ưu điểm:* Cực kỳ an toàn, phát hiện lỗi sớm trên production mà không ảnh hưởng tới số đông user."

### 7. WebSocket, Real-time & Event-driven Architecture

**Câu hỏi:** _So sánh WebSocket, Server-Sent Events (SSE), và Long Polling. Khi nào chọn cái nào?_
**Trả lời:**
"Đây là 3 giải pháp truyền thông tin thời gian thực giữa Client và Server:
1. **WebSocket:**
   * *Hoạt động:* Khởi đầu bằng HTTP handshake, sau đó nâng cấp (upgrade) lên giao thức TCP song công (Full-duplex). Kết nối được giữ mở vĩnh viễn. Cả Client và Server đều có thể chủ động push message bất kỳ lúc nào.
   * *Ưu điểm:* Độ trễ cực thấp, overhead rất nhỏ sau khi kết nối được thiết lập.
   * *Khi nào dùng:* Cho ứng dụng chat, game online nhiều người chơi, bảng vẽ chung (collaborative tools), trading platform.
2. **Server-Sent Events (SSE):**
   * *Hoạt động:* Kết nối HTTP đơn công (Half-duplex) kéo dài, chỉ chạy một chiều từ Server truyền về Client. Sử dụng định dạng dữ liệu chuẩn text/event-stream.
   * *Ưu điểm:* Chạy trên giao thức HTTP chuẩn nên đi qua được mọi firewall/proxy, tự động hỗ trợ reconnection, nhẹ hơn WebSocket.
   * *Khi nào dùng:* Cho luồng tin tức cập nhật liên tục (news feed), đồ thị realtime, thông báo đẩy (push notifications), tiến trình upload file dài hạn ở server.
3. **Long Polling:**
   * *Hoạt động:* Client gửi request HTTP lên server, server giữ request đó mở cho tới khi có data mới hoặc timeout. Client nhận response xong lập tức gửi request mới tiếp theo.
   * *Nhược điểm:* Quá nhiều overhead thiết lập kết nối HTTP liên tục, tốn tài nguyên server. Chỉ dùng làm phương án dự phòng (fallback)."

**Câu hỏi:** _Làm thế nào để Scale hệ thống WebSocket chạy trên nhiều instance Backend?_
**Trả lời:**
"WebSocket là kết nối có trạng thái (Stateful), client kết nối trực tiếp với 1 instance cụ thể qua socket TCP. Nếu ta scale ra 3 instance backend sau một Load Balancer:
- **Vấn đề 1 (Handshake):** Giai đoạn HTTP Handshake nâng cấp kết nối yêu cầu Client phải gửi nhiều request liên tục đến cùng một instance backend.
  * *Giải quyết:* Cấu hình **Sticky Sessions (Session Affinity)** trên Load Balancer (ví dụ: Nginx hoặc AWS ALB) để mọi request từ một client IP luôn đi vào một instance duy nhất.
- **Vấn đề 2 (Broadcast / Communication):** Client A kết nối tới Instance 1. Client B kết nối tới Instance 2. Khi A gửi tin nhắn cho B, Instance 1 làm sao gửi cho B được khi B không nằm trên Instance 1?
  * *Giải quyết:* Sử dụng một **Redis Pub/Sub Adapter** ở giữa (ví dụ: `socket.io-redis`). Khi Instance 1 nhận tin nhắn từ A, nó sẽ publish event lên Redis channel. Tất cả các instance khác subscribe channel này, nhận được event và Instance 2 sẽ đẩy message trực tiếp xuống cho B. Điều này giúp hệ thống scale ngang vô hạn."

**Câu hỏi:** _Em thiết kế cơ chế Authentication và xử lý đứt kết nối (Reconnection) cho WebSocket như thế nào?_
**Trả lời:**
"- **Authentication:**
  * Vì WebSocket bắt đầu bằng HTTP request (handshake), cách tốt nhất là xác thực trong giai đoạn handshake này. Ta có thể gửi Access Token qua Cookie (nếu cùng domain) hoặc gửi token qua query parameter (ví dụ: `ws://api.domain.com?token=JWT_TOKEN`).
  * Một phương án bảo mật khác (tránh log query param) là sau khi handshake thành công, Client phải gửi một message 'xác thực' đầu tiên chứa token trong vòng 5 giây. Nếu quá 5 giây mà không nhận được hoặc token không hợp lệ, server sẽ chủ động đóng kết nối.
- **Heartbeat (Ping-Pong):**
  * Để phát hiện các kết nối 'chết lâm sàng' (zombie connections - client ngắt mạng đột ngột nhưng server vẫn nghĩ còn sống), ta cấu hình cơ chế gửi tin nhắn Ping định kỳ (ví dụ: 25 giây/lần). Nếu Client không phản hồi Pong trong thời gian quy định, Server sẽ close socket để giải phóng RAM.
- **Reconnection & Sync State:**
  * Phía Client, cấu hình tự động kết nối lại khi mất mạng bằng thuật toán **Exponential Backoff** kết hợp với **Jitter** (ngẫu nhiên hóa thời gian chờ) để tránh hàng vạn client cùng reconnect một lúc làm sập server khi server mới recover.
  * Khi reconnect thành công, Client phải gửi lên thông tin ID của message cuối cùng nhận được (last message timestamp) để Server truy vấn từ database và gửi bù lại những tin nhắn bị bỏ lỡ trong thời gian mất kết nối."

### 8. Nguyên tắc thiết kế OOP & SOLID (Trong Javascript/TypeScript)

**Câu hỏi:** _Trình bày 4 tính chất cơ bản của OOP và cách áp dụng chúng trong Javascript/TypeScript?_
**Trả lời:**
"1. **Tính đóng gói (Encapsulation):** Che giấu thông tin nội bộ của đối tượng, chỉ cho phép tương tác qua các phương thức public.
   * *Áp dụng:* Trong TypeScript, em dùng access modifiers `private`, `protected`, `public`. Trong ES6+ JavaScript, em dùng ký tự `#` đứng trước tên biến/phương thức để tạo private fields thực sự (ví dụ: `#balance`).
2. **Tính kế thừa (Inheritance):** Cho phép một class con tái sử dụng lại các thuộc tính và phương thức từ class cha.
   * *Áp dụng:* Sử dụng từ khóa `extends` và hàm `super()` trong class con để gọi constructor của class cha.
3. **Tính đa hình (Polymorphism):** Cho phép các đối tượng khác nhau phản hồi cùng một phương thức theo các cách khác nhau.
   * *Áp dụng:*
     * **Method Overriding (Ghi đè):** Class con định nghĩa lại method của class cha để tùy biến logic.
     * **Interface Implementation:** Nhiều class khác nhau cùng implement một `interface` nhưng có logic xử lý riêng (ví dụ: class `SmsSender` và `EmailSender` cùng implement interface `NotificationSender`).
4. **Tính trừu tượng (Abstraction):** Tập trung vào những gì đối tượng làm thay vì cách nó làm. Hạn chế phơi bày chi tiết cài đặt phức tạp.
   * *Áp dụng:* Sử dụng `abstract class` hoặc `interface` để định nghĩa bộ khung (blueprint) cho các class con kế thừa."

**Câu hỏi:** _Giải thích các nguyên lý SOLID kèm ví dụ thực tế trong dự án Node.js/TypeScript?_
**Trả lời:**
"- **S - Single Responsibility Principle (Đơn nhiệm):** Một class chỉ nên chịu một trách nhiệm duy nhất.
  * *Ví dụ:* Tách class `UserController` (nhận request) khỏi class `UserService` (xử lý logic nghiệp vụ) và class `UserRepository` (truy vấn DB). Tránh việc nhồi nhét cả logic gửi email hay log lỗi vào trong `UserController`.
- **O - Open/Closed Principle (Mở/Đóng):** Lớp phần mềm nên mở rộng cho việc kế thừa nhưng đóng cho việc sửa đổi trực tiếp.
  * *Ví dụ:* Khi viết module thanh toán. Thay vì viết hàm chứa chuỗi `if (type === 'stripe') { ... } else if (type === 'paypal') { ... }`. Em tạo một interface `PaymentGateway` và mỗi cổng thanh toán là một class implement interface này. Khi thêm cổng mới (như Momo), chỉ cần tạo class mới mà không cần sửa code cũ.
- **L - Liskov Substitution Principle (Thay thế Liskov):** Lớp con phải có thể thay thế lớp cha mà không làm thay đổi tính đúng đắn của chương trình.
  * *Ví dụ:* Nếu class `Bird` có method `fly()`, nhưng class `Ostrich` (Đà điểu) kế thừa `Bird` mà không bay được và ném ra lỗi `CannotFlyException`, tức là ta đã vi phạm nguyên lý này. Cách sửa: Tách `fly()` ra một interface `Flyable`.
- **I - Interface Segregation Principle (Phân tách Interface):** Thà tạo nhiều interface nhỏ, chuyên biệt hơn là tạo một interface lớn chứa nhiều method thừa.
  * *Ví dụ:* Thay vì tạo interface `SmartDevice` có `print()`, `scan()`, `fax()`, ta nên chia thành `Printer` với `print()`, `Scanner` với `scan()`. Một máy in thường chỉ cần implement interface `Printer`.
- **D - Dependency Inversion Principle (Đảo ngược phụ thuộc):** Các module cấp cao không nên phụ thuộc vào các module cấp thấp, cả hai nên phụ thuộc vào abstractions (interfaces/abstract classes).
  * *Ví dụ:* `UserService` không nên khởi tạo trực tiếp instance `MySQLRepository` bằng từ khóa `new`. Thay vào đó, nó nên phụ thuộc vào interface `UserRepository`. Việc cung cấp instance thực tế sẽ do một container quản lý (như **Dependency Injection** trong NestJS) tự động inject vào constructor."

### 9. Nice to have: Cloud Computing (AWS) & CI/CD chuyên sâu

**Câu hỏi:** _Là một Fullstack Developer, em sử dụng các dịch vụ AWS nào để host hệ thống ReactJS + Node.js API + Database?_
**Trả lời:**
"Em thiết kế kiến trúc hệ thống trên AWS như sau:
1. **Frontend Hosting (ReactJS/VueJS):**
   * Em build code frontend thành các file tĩnh (HTML, CSS, JS) và upload lên **AWS S3** bucket.
   * Để tăng tốc độ tải trang toàn cầu và bảo mật SSL, em cấu hình **AWS CloudFront (CDN)** đứng trước S3 bucket. Người dùng sẽ truy cập thông qua CloudFront, giúp cache static assets tại các Edge Location gần họ nhất.
2. **Backend API (Node.js/Express/NestJS):**
   * Em đóng gói API Backend thành Docker Image.
   * Sử dụng dịch vụ **AWS ECS (Elastic Container Service) với Fargate (Serverless container)** để chạy ứng dụng Docker. Em chọn Fargate vì không cần quản lý, vá lỗi hay scale thủ công các máy ảo EC2.
   * Đặt Backend sau một **Application Load Balancer (ALB)** để phân phối traffic và xử lý SSL termination.
3. **Database (MySQL & Redis):**
   * Sử dụng **AWS RDS (Relational Database Service)** chạy MySQL. RDS tự động hóa việc backup, vá lỗi bảo mật, và cấu hình Multi-AZ (Multiple Availability Zones) để bảo đảm tính sẵn sàng cao (High Availability).
   * Sử dụng **AWS ElastiCache** chạy Redis phục vụ lưu cache layer.
4. **Networking & Security:**
   * Tất cả Backend và Database được đặt trong một mạng ảo riêng biệt **AWS VPC (Virtual Private Cloud)**. Database chỉ nằm trong Private Subnet, không mở public IP, chỉ cho phép các container ECS trong Private Subnet truy cập qua Security Groups."

**Câu hỏi:** _Em quản lý các cấu hình nhạy cảm (Credentials, Secrets) như thế nào trên Cloud/CI/CD?_
**Trả lời:**
"Nguyên tắc là **KHÔNG BAO GIỜ** commit API keys, DB passwords, hoặc secret tokens lên Git.
- **Local Dev:** Sử dụng file `.env` và đưa nó vào `.gitignore`.
- **CI/CD (GitHub Actions):** Sử dụng **GitHub Secrets** để lưu trữ các biến nhạy cảm (như AWS Access Key, Docker Registry Password).
- **Production (AWS):** Sử dụng dịch vụ **AWS Secrets Manager** hoặc **AWS Systems Manager Parameter Store**. Khi ứng dụng ECS khởi chạy, nó sẽ kéo các cấu hình bảo mật này về dưới dạng biến môi trường một cách an toàn thông qua IAM Role được phân quyền chặt chẽ."

### 10. Nice to have: Headless CMS (Strapi, Decap CMS, Ghost)

**Câu hỏi:** _Headless CMS là gì? Phân biệt Strapi, Decap CMS (NetlifyCMS) và Ghost? Khi nào nên áp dụng?_
**Trả lời:**
"**Headless CMS** là hệ thống quản lý nội dung đã được tách rời phần quản lý (Back-end) khỏi phần hiển thị (Front-end). Nó chỉ tập trung vào việc tạo, lưu trữ nội dung và cung cấp dữ liệu đó cho mọi nền tảng khác qua **RESTful API** hoặc **GraphQL API**. Frontend có thể tùy biến dùng React, Vue, Next.js hay mobile app.

**So sánh chi tiết 3 loại Headless CMS:**
1. **Strapi:**
   * *Đặc điểm:* Viết bằng Node.js, self-hosted (tự cài đặt trên server của mình).
   * *Ưu điểm:* Cực kỳ linh hoạt, hỗ trợ tạo Content-Types động rất mạnh mẽ thông qua Admin UI. Có plugin ecosystem phong phú. Hỗ trợ đa dạng database (PostgreSQL, MySQL, SQLite).
   * *Nhược điểm:* Tốn công cài đặt, vận hành server và quản lý database.
2. **Decap CMS (Tên cũ là NetlifyCMS):**
   * *Đặc điểm:* Git-based Headless CMS (không có database). Nó là một Single Page Application React đơn giản nhúng vào thư mục tĩnh của website.
   * *Ưu điểm:* Khi admin viết bài, Decap CMS sẽ **commit trực tiếp** file Markdown hoặc JSON vào GitHub repository của bạn. Web tĩnh (Next.js/Gatsby) sẽ tự động trigger rebuild và deploy lại. Hoàn toàn miễn phí, không tốn tiền duy trì database hay server.
   * *Nhược điểm:* Phù hợp với các trang web tĩnh vừa và nhỏ, blog cá nhân. Không thích hợp cho hệ thống có hàng vạn nội dung cập nhật liên tục hoặc cần query dữ liệu động thời gian thực.
3. **Ghost:**
   * *Đặc điểm:* Viết bằng Node.js, tối ưu hóa tối đa cho các trang tin tức, blog chuyên nghiệp, và bản tin (newsletters).
   * *Ưu điểm:* Giao diện soạn thảo (Ghost Editor) cực kỳ đẹp và tiện dụng. Tích hợp sẵn hệ thống đăng ký thành viên, quản lý membership và cổng thanh toán (Stripe) để thu tiền người đọc. Performance đọc/ghi tĩnh cực nhanh.
   * *Nhược điểm:* Khả năng tùy biến Custom Content Type phức tạp không bằng Strapi.

*Khi nào áp dụng:* Em sẽ đề xuất dùng **Headless CMS** khi doanh nghiệp muốn xây dựng một website tin tức, giới thiệu sản phẩm (landing pages), hoặc trang tài liệu hướng dẫn sử dụng, nơi content creators cần cập nhật thông tin hàng ngày nhưng team kỹ thuật muốn tự do thiết kế giao diện frontend mượt mà bằng Next.js nhằm tối ưu hóa SEO."

### 11. Kỹ năng mềm & Xử lý tình huống (Problem Solving, Teamwork, English)

**Câu hỏi:** _Khi gặp một bug nghiêm trọng trên hệ thống Production và chưa tìm ra nguyên nhân ngay, em xử lý tình huống đó thế nào?_
**Trả lời:**
"Quy trình xử lý sự cố khẩn cấp của em gồm 4 bước:
1. **Cô lập và Giảm thiểu thiệt hại (Mitigation):** Ưu tiên hàng đầu là đưa hệ thống về trạng thái ổn định cho người dùng trước. Nếu vừa deploy xong phát hiện lỗi nặng, em sẽ lập tức **Rollback** về phiên bản stable gần nhất. Nếu là lỗi dữ liệu, em có thể bật trang bảo trì tạm thời hoặc tắt tính năng bị lỗi thông qua Feature Flags.
2. **Thu thập thông tin và Tái hiện (Analysis):** Đọc log trên ELK/Datadog qua Correlation ID để xác định lỗi xuất phát từ server nào, API nào. Kiểm tra các metrics CPU/RAM/Database xem có bị nghẽn không. Cố gắng viết một test case tối giản để tái hiện lỗi ở môi trường local/staging.
3. **Sửa lỗi và Kiểm thử:** Viết bản sửa lỗi (Hotfix), chạy test suite kỹ càng để đảm bảo không gây hồi quy (regression) sang các tính năng khác.
4. **Post-mortem (Rút kinh nghiệm):** Sau khi deploy hotfix thành công, em viết báo cáo ngắn về nguyên nhân cốt lõi (Root Cause), tại sao QA/Test không phát hiện ra, và đề xuất cách cải thiện quy trình test tự động để lỗi này không bao giờ lặp lại."

**Câu hỏi:** _Trong team, nếu xảy ra bất đồng quan điểm kỹ thuật giữa em và một thành viên khác (ví dụ: việc chọn thư viện, cấu trúc code), em giải quyết ra sao?_
**Trả lời:**
"Em luôn giải quyết mâu thuẫn trên tinh thần tôn trọng và khách quan:
1. **Lắng nghe tích cực:** Em sẽ ngồi lại trao đổi để hiểu rõ lý do tại sao họ lại chọn giải pháp đó. Rất có thể họ có những góc nhìn mà em chưa thấy hết.
2. **Đưa ra các tiêu chí so sánh cụ thể:** Thay vì tranh cãi cảm tính, em sẽ đề xuất lập bảng so sánh dựa trên các thông số kỹ thuật rõ ràng:
   * Hiệu năng (Performance / Bundle size).
   * Độ phức tạp của mã nguồn (Complexity & Maintainability).
   * Cộng đồng hỗ trợ và độ tin cậy (Documentation, stars, issues).
   * Thời gian triển khai (Time to market).
3. **Thực hiện POC (Proof of Concept):** Nếu cả hai bên vẫn giữ ý kiến, em đề xuất mỗi người dành ra vài tiếng làm một bản demo nhỏ (POC). Kết quả chạy thực tế và benchmark sẽ quyết định phương án tối ưu nhất.
4. **Tôn trọng quyết định chung:** Nếu đã biểu quyết hoặc được Tech Lead quyết định, dù phương án được chọn là của ai, em vẫn sẽ dốc hết sức hỗ trợ triển khai."

**Câu hỏi:** _Khả năng tiếng Anh của em thế nào trong công việc?_
**Trả lời:**
"Em có khả năng sử dụng tiếng Anh tốt trong công việc:
- **Đọc hiểu:** Em có thể đọc hiểu trơn tru các tài liệu kỹ thuật (documentation), các đặc tả thiết kế (specs), API docs, các bài blog công nghệ, và các issue thảo luận trên GitHub để giải quyết bug.
- **Viết:** Em tự tin viết tài liệu kỹ thuật (Documentation), comment code, viết Git commit messages rõ ràng theo chuẩn Conventional Commits, và trao đổi công việc qua các kênh chat như Slack/Teams hay viết email cho khách hàng quốc tế.
- **Giao tiếp:** Em có thể tham gia các buổi họp hàng ngày (Daily Standup) bằng tiếng Anh để báo cáo tiến độ và thảo luận các vấn đề kỹ thuật cơ bản trực tiếp với khách hàng hoặc đồng nghiệp nước ngoài."

---

## PHẦN 6: CHỐT PHỎNG VẤN (REVERSE INTERVIEWING)

_(Luôn luôn đặt 1 trong 2 câu hỏi này khi nhà tuyển dụng hỏi "Bạn có câu hỏi nào cho chúng tôi không?". Nó thể hiện bạn là một Lead có tầm nhìn)._

1. _"Nếu em được nhận vào vị trí này, mục tiêu ưu tiên nhất mà công ty kỳ vọng em giải quyết/đạt được trong 2 tháng thử việc là gì?"_
2. _"Stack công nghệ hiện tại của dự án công ty mình đang gặp điểm nghẽn (bottleneck) lớn nhất ở phần nào (Frontend hay Backend), và team có đang lên kế hoạch refactor nó không ạ?"_
3. _"Team hiện tại có practice Code Review, CI/CD, và viết Test không ạ? Quy trình development flow như thế nào?"_
````
