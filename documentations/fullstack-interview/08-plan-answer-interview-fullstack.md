# Bộ Câu Trả Lời Phỏng Vấn Fullstack / Frontend Lead

File này tập trung vào cách trả lời phỏng vấn theo kinh nghiệm cá nhân, project story, leadership và reverse interview. Các kiến thức kỹ thuật chi tiết nằm ở các file canonical khác; ở đây ưu tiên cách nói sao cho rõ, sâu và có tính senior.

## 1. Cách dùng file này

Khi luyện phỏng vấn, không nên học thuộc từng chữ. Hãy dùng các khung trả lời để tự viết lại theo kinh nghiệm thật của bạn.

Một câu trả lời tốt thường có:

- Context: dự án/bối cảnh.
- Problem: vấn đề cụ thể.
- Action: bạn đã làm gì.
- Trade-off: bạn cân nhắc gì.
- Result: kết quả, tốt nhất có số liệu.
- Reflection: bài học hoặc cách làm tốt hơn lần sau.

## 2. Elevator pitch

### 2.1 Mục tiêu của pitch

Pitch 60-90 giây dùng để mở đầu phỏng vấn. Mục tiêu không phải kể toàn bộ CV, mà là giúp interviewer hiểu:

- Bạn là ai.
- Bạn mạnh ở mảng nào.
- Bạn từng giải quyết loại bài toán gì.
- Bạn phù hợp với role ra sao.

### 2.2 Mẫu pitch fullstack

> Em là fullstack developer tập trung vào React/Next.js ở frontend và Node.js/NestJS ở backend. Em có kinh nghiệm xây dựng sản phẩm end-to-end: từ UI nhiều form/data, API backend, authentication, database, đến performance và production readiness. Điểm mạnh của em là không chỉ code feature chạy được, mà còn quan tâm đến maintainability, validation, error handling, logging, performance và trải nghiệm người dùng. Trong các dự án gần đây, em làm nhiều với UI phức tạp, API production, tối ưu query/API chậm và xử lý dữ liệu lớn. Em đang tìm role có thể đóng góp sâu hơn ở cả frontend architecture lẫn backend system design.

### 2.3 Nếu JD nghiêng frontend

Nhấn mạnh:

- React/Next.js.
- UI architecture.
- Form lớn.
- Performance.
- Design system/component reuse.
- SEO/rendering nếu JD có Next.js.

Mẫu:

> Điểm mạnh của em ở frontend là xây dựng UI có cấu trúc, dễ maintain và xử lý tốt các màn hình data-heavy. Em quan tâm đến cách chia component, state management, form validation, performance như re-render, bundle size, LCP/INP/CLS, cũng như cách chọn SSR/SSG/CSR trong Next.js theo use case.

### 2.4 Nếu JD nghiêng backend

Nhấn mạnh:

- Node.js/NestJS.
- API design.
- Database.
- Cache/queue.
- Production readiness.
- System design.

Mẫu:

> Ở backend, em tập trung vào API design, NestJS architecture, database transaction/index/query tuning, cache, queue và các yếu tố production như logging, metrics, timeout, retry, graceful shutdown. Em cố gắng thiết kế API không chỉ đúng nghiệp vụ mà còn dễ vận hành, dễ debug và có khả năng scale hợp lý.

## 3. STAR framework

STAR là khung trả lời hành vi/kỹ thuật:

- Situation: bối cảnh.
- Task: nhiệm vụ/vấn đề.
- Action: hành động cụ thể của bạn.
- Result: kết quả.

Với câu hỏi senior, nên thêm:

- Trade-off: vì sao chọn cách đó.
- Lesson: học được gì.

Mẫu:

```text
Situation: Dự án có API import dữ liệu lớn, thường timeout.
Task: Em cần thiết kế lại để import ổn định hơn.
Action: Em tách upload và xử lý thành background job, dùng stream, batch insert, progress tracking và error report.
Result: API không còn timeout, user xem được progress và download lỗi.
Trade-off: Thiết kế phức tạp hơn request sync, nhưng phù hợp với file lớn và retry.
```

## 4. Project story: xử lý dữ liệu lớn

### 4.1 Câu hỏi có thể gặp

- Bạn từng xử lý file/data lớn như thế nào?
- Làm sao tránh timeout?
- Làm sao tránh memory tăng quá cao?
- Làm sao preview dữ liệu trên UI?
- Làm sao retry mà không duplicate?
- Làm sao hiển thị progress?

### 4.2 Câu trả lời mẫu

> Trong một bài toán xử lý dữ liệu lớn, vấn đề chính là không thể xử lý toàn bộ trong một HTTP request và không thể load hết dữ liệu vào memory. Em tách flow thành upload, preview và import async. File được lưu vào storage, backend chỉ stream một phần đầu để preview/mapping trên UI. Khi user submit, backend tạo job và đẩy vào queue. Worker đọc file bằng stream, validate theo row, insert/upsert theo batch transaction, cập nhật progress và lưu error rows riêng. Để retry an toàn, em dựa vào unique constraint, idempotency và job status rõ ràng.

### 4.3 Điểm cần nhấn mạnh

- Không xử lý file lớn trong request sync.
- Dùng stream/backpressure.
- Batch transaction.
- Queue/background worker.
- Progress tracking.
- Error report.
- Idempotency/retry.
- Observability theo `jobId`.

### 4.4 Nếu bị hỏi sâu

Người phỏng vấn có thể hỏi:

- Batch size chọn bao nhiêu?
- Nếu worker crash giữa chừng thì sao?
- Nếu có duplicate row thì sao?
- Nếu file format sai thì sao?
- Nếu user upload file 2GB thì sao?

Cách trả lời:

> Batch size em chọn dựa trên benchmark và khả năng DB, ví dụ 500-2000 rows/batch. Nếu worker crash, job có thể retry; để không duplicate thì target table cần unique business key hoặc checkpoint. Lỗi dữ liệu từng row không retry vô hạn mà ghi vào error report. Với file rất lớn, em ưu tiên presigned upload, stream processing và giới hạn size rõ.

## 5. Project story: UI/form phức tạp

### 5.1 Câu hỏi có thể gặp

- Bạn xử lý form lớn nhiều field như thế nào?
- Làm sao tránh re-render?
- Làm sao validate?
- Làm sao thiết kế component dùng lại?
- Làm sao xử lý error từ backend?

### 5.2 Câu trả lời mẫu

> Với form lớn, em không để một state global làm toàn bộ form render lại mỗi lần gõ. Em chia form theo section, đặt state gần nơi dùng, dùng schema validation cho rule rõ ràng và debounce các validation cần gọi API. Các component như input, select, modal, toast được thiết kế contract rõ: value, onChange, error, disabled, loading. Khi submit, backend vẫn validate lại và trả lỗi field/global để UI map về đúng vị trí.

### 5.3 Điểm cần nhấn mạnh

- State colocation.
- Chia section.
- Controlled/uncontrolled tùy tình huống.
- React Hook Form hoặc thư viện form nếu phù hợp.
- Validation client + backend validation.
- Error mapping.
- Accessibility: label, aria-invalid, role alert.
- Performance profiling nếu form chậm.

### 5.4 Nếu bị hỏi về performance

> Em sẽ dùng React Profiler để xem component nào render nhiều. Sau đó tách component, memo phần expensive, tránh truyền object/function mới không cần thiết, hoặc dùng thư viện form tối ưu subscription theo field. Nếu là table/list lớn, em cân nhắc virtualization và server-side pagination/filter/sort.

## 6. Project story: API/backend production

### 6.1 Câu hỏi có thể gặp

- Một API production-ready cần gì?
- Bạn xử lý error/logging thế nào?
- Bạn thiết kế auth/authorization thế nào?
- Bạn debug API chậm ra sao?

### 6.2 Câu trả lời mẫu

> Với API production, em quan tâm nhiều hơn việc endpoint trả đúng dữ liệu. Em cần validation input, auth/authz rõ, error response chuẩn, logging có request id, metric latency/error rate, timeout khi gọi dependency, graceful shutdown và test cho flow quan trọng. Khi API chậm, em không tối ưu theo cảm tính mà dùng log/APM/tracing để tách bottleneck ở app, DB, cache hay external API.

### 6.3 Điểm cần nhấn mạnh

- DTO validation.
- Guard/authz.
- Error format thống nhất.
- Logging structured.
- Request id/correlation id.
- Metrics p95/p99, error rate.
- Timeout/retry/circuit breaker.
- Health check/readiness.
- Graceful shutdown.
- Unit/E2E test.

## 7. Project story: tối ưu database/query

### 7.1 Câu hỏi có thể gặp

- Bạn từng tối ưu query chậm thế nào?
- Index hoạt động ra sao?
- N+1 là gì?
- Transaction/isolation có ý nghĩa gì?

### 7.2 Câu trả lời mẫu

> Khi gặp query chậm, em bắt đầu bằng slow query log hoặc APM để xác định query thật sự gây vấn đề. Sau đó em chạy EXPLAIN để xem scan type, rows, sort, join order và query có dùng index không. Tùy access pattern, em thêm hoặc chỉnh compound index, giảm column trả về, tránh N+1 và đổi offset pagination sang cursor nếu data lớn. Với flow cần consistency như order/inventory, em đặt transaction boundary ở service layer và dùng constraint/locking phù hợp.

### 7.3 Điểm cần nhấn mạnh

- Đo trước khi tối ưu.
- EXPLAIN/EXPLAIN ANALYZE.
- Index theo `WHERE`, `JOIN`, `ORDER BY`.
- Compound index và leftmost prefix.
- N+1 từ ORM.
- Pagination.
- Transaction ngắn.
- Không gọi external API trong transaction.

## 8. Project story: cache, queue và event-driven

### 8.1 Câu hỏi có thể gặp

- Khi nào dùng cache?
- Khi nào dùng queue?
- Làm sao retry mà không duplicate?
- Kafka/RabbitMQ/queue khác nhau thế nào?
- Outbox pattern là gì?

### 8.2 Câu trả lời mẫu

> Em dùng cache cho data đọc nhiều và chấp nhận stale trong TTL nhất định. Cache phải có key convention, TTL, invalidation và metric hit rate. Với tác vụ chậm hoặc cần retry như email, import file, notification, em đưa vào queue/background job. Consumer phải idempotent vì message có thể duplicate. Với flow DB commit rồi publish event, em cân nhắc transactional outbox để tránh mất event.

### 8.3 Điểm cần nhấn mạnh

- Cache-aside.
- TTL/invalidation.
- Cache stampede/hot key.
- Queue cho async/retry.
- Retry backoff.
- DLQ.
- Idempotent consumer.
- Outbox pattern.
- Monitoring queue lag.

## 9. Project story: frontend performance

### 9.1 Câu hỏi có thể gặp

- Bạn tối ưu frontend chậm thế nào?
- LCP/INP/CLS là gì?
- Làm sao giảm bundle?
- Làm sao xử lý list/table lớn?

### 9.2 Câu trả lời mẫu

> Em bắt đầu bằng đo lường thay vì đoán. Em xem Web Vitals để biết vấn đề là LCP, INP hay CLS, dùng bundle analyzer để kiểm tra JS size và React Profiler để xem re-render. Nếu LCP chậm, em tối ưu server rendering, image, font, cache. Nếu INP chậm, em giảm JS client, tách task nặng, giảm re-render. Với list/table lớn, em dùng server-side pagination/filter/sort hoặc virtualization.

### 9.3 Điểm cần nhấn mạnh

- Web Vitals.
- Bundle analyzer.
- React Profiler.
- Server vs client rendering.
- Lazy load.
- Image/font optimization.
- Virtualization.
- Avoid network waterfall.

## 10. Leadership và collaboration

### 10.1 Code review

Câu trả lời mẫu:

> Khi review code, em ưu tiên correctness, security, readability, test và maintainability. Em không chỉ comment style, mà cố gắng chỉ ra risk cụ thể: logic sai, edge case thiếu, API contract không rõ, query có thể chậm, error handling thiếu. Khi góp ý, em đưa lý do và nếu có thể thì đề xuất hướng sửa để người nhận dễ hành động.

Điểm cần nhấn mạnh:

- Review theo risk.
- Không biến review thành tranh luận style cá nhân.
- Convention và lint giúp giảm tranh luận.
- Với issue nghiêm trọng, trao đổi trực tiếp nhanh hơn comment dài.

### 10.2 Mentoring

Câu trả lời mẫu:

> Khi mentor, em không chỉ đưa đáp án. Em cố gắng giải thích context, trade-off và cách tự debug. Với task khó, em chia nhỏ scope, pair ở phần rủi ro cao và dùng PR review để chỉ ra pattern tốt. Mục tiêu là giúp bạn khác tự ra quyết định tốt hơn ở lần sau.

### 10.3 Conflict trong team

Câu trả lời mẫu:

> Khi có disagreement, em kéo cuộc thảo luận về requirement, constraint và trade-off thay vì ý kiến cá nhân. Ví dụ nếu tranh luận giữa làm nhanh và làm chuẩn, em sẽ hỏi deadline, risk, blast radius, khả năng rollback và chi phí maintain. Nếu cần, em đề xuất phương án incremental: làm giải pháp đủ an toàn trước, để lại phần refactor lớn sau khi có thời gian.

### 10.4 Ownership

Câu trả lời mẫu:

> Với em, ownership không dừng ở việc merge code. Em cần đảm bảo feature có validation, test, logging, monitoring nếu cần, migration/deploy plan và xử lý bug sau release. Nếu có vấn đề production, em ưu tiên giảm impact trước, sau đó phân tích root cause và bổ sung action item để tránh lặp lại.

## 11. Điểm yếu

### 11.1 Cách chọn điểm yếu

Điểm yếu nên:

- Thật.
- Không phá trực tiếp yêu cầu chính của role.
- Có ví dụ bạn đã cải thiện.
- Không quá sáo rỗng.

Không nên:

- "Em quá cầu toàn" nếu không có ví dụ cụ thể.
- "Em yếu giao tiếp" nếu role cần lead.
- Nói một điểm yếu quá nghiêm trọng mà chưa có cách khắc phục.

### 11.2 Mẫu trả lời

> Trước đây em có xu hướng đi quá sâu vào technical detail khi giải thích, nhất là với stakeholder không quá technical. Sau đó em cải thiện bằng cách bắt đầu với context, impact và trade-off trước, rồi mới đi vào chi tiết nếu người nghe cần. Cách này giúp em trao đổi với product, QA và teammate hiệu quả hơn.

Mẫu khác:

> Trước đây khi gặp task lớn, em đôi khi muốn xử lý nhiều phần cùng lúc. Sau một vài lần thấy scope bị rộng, em học cách chia task thành milestone nhỏ hơn, xác định phần rủi ro cao trước và feedback sớm hơn với team.

## 12. Câu hỏi về dự án khó nhất

### 12.1 Khung trả lời

1. Dự án là gì?
2. Khó ở đâu?
3. Bạn chịu trách nhiệm phần nào?
4. Bạn đã làm gì?
5. Trade-off là gì?
6. Kết quả ra sao?
7. Bài học là gì?

### 12.2 Mẫu trả lời

> Một dự án khó của em là phần xử lý dữ liệu lớn/import dữ liệu. Khó ở chỗ file lớn dễ timeout, memory tăng và user cần biết lỗi ở dòng nào. Em đề xuất tách flow thành upload, preview và background import. Worker xử lý bằng stream và batch insert, progress lưu theo job, lỗi từng dòng ghi ra error report. Trade-off là kiến trúc phức tạp hơn request sync, nhưng đổi lại hệ thống ổn định, retry được và user có trải nghiệm rõ ràng hơn.

## 13. Câu hỏi về bug production

### 13.1 Cách trả lời

Nên thể hiện:

- Bình tĩnh.
- Ưu tiên impact user.
- Biết rollback/mitigate.
- Biết debug bằng data.
- Có postmortem/action item.

### 13.2 Mẫu trả lời

> Khi gặp bug production, em ưu tiên xác định impact trước: endpoint nào lỗi, error rate và latency ra sao, user nào bị ảnh hưởng. Nếu liên quan release mới, em cân nhắc rollback hoặc tắt feature flag để giảm impact. Sau khi hệ thống ổn, em dùng logs/metrics/traces để tìm root cause. Cuối cùng em bổ sung test, alert hoặc runbook nếu thiếu để tránh lỗi lặp lại.

## 14. Câu hỏi ngược cho nhà tuyển dụng

Nên hỏi:

- Team đang ưu tiên bài toán kỹ thuật nào trong 3-6 tháng tới?
- Architecture hiện tại có bottleneck lớn nào không?
- Quy trình release và rollback hiện tại như thế nào?
- Team đo chất lượng bằng metric nào?
- Senior/lead ở đây được kỳ vọng ownership đến mức nào?
- Code review và mentoring trong team diễn ra như thế nào?
- Có phần nào trong hệ thống đang cần cải thiện về performance, testing hoặc observability không?

Không nên hỏi quá sớm:

- Lương/benefit khi chưa đến giai đoạn phù hợp.
- Câu hỏi có thể đọc ngay trên JD/company page.
- Câu hỏi quá chung như "công ty làm gì?".

## 15. Checklist trước phỏng vấn

- Pitch 60-90 giây.
- 2 project story kỹ thuật.
- 1 story về performance.
- 1 story về bug production.
- 1 story về conflict/leadership.
- 1 story về trade-off.
- Câu hỏi ngược.
- Các con số hoặc impact nếu có.
- Biết file canonical nào để ôn lại kiến thức sâu.

## 16. Mẫu câu ngắn nên dùng

- "Em sẽ clarify requirement trước khi chọn giải pháp."
- "Em không tối ưu theo cảm tính, em đo bottleneck trước."
- "Trade-off của cách này là..."
- "Nếu scale nhỏ, em sẽ chọn giải pháp đơn giản hơn."
- "Phần này cần idempotency vì request/message có thể retry."
- "Em sẽ tách tác vụ lâu ra queue để request không bị timeout."
- "Em sẽ thêm monitoring để biết hệ thống lỗi ở đâu, không chỉ deploy xong là xong."
