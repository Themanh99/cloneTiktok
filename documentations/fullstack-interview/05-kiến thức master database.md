# Hướng dẫn Master Database cho Backend Developer

Tài liệu này tổng hợp các kiến thức cốt lõi về Database (Relational Database - SQL) để phục vụ cho công việc thực tế và phỏng vấn vị trí Backend Developer.

---

## 1. Các Khái Niệm Cốt Lõi

### 1.1 Cấu trúc bảng (Table Structure)

- **Định nghĩa:** Cách tổ chức dữ liệu thành các hàng (records) và cột (fields) với các kiểu dữ liệu cụ thể (INT, VARCHAR, DATE...).
- **Tác dụng:** Đảm bảo tính toàn vẹn, định hình cấu trúc lưu trữ và chuẩn hóa dữ liệu.
- **Nhược điểm:** Lược đồ cố định (rigid schema). Mỗi lần thêm cột (ALTER TABLE) ở các bảng có hàng chục triệu bản ghi có thể gây lock bảng, downtime.
- **Thực tế:** Thường thiết kế qua mô hình ERD. Backend dev thường dùng ORM (như Prisma, TypeORM) để định nghĩa schema dưới dạng code và chạy Migration.

### 1.2 Khóa chính (Primary Key - PK)

- **Định nghĩa:** Cột (hoặc tập hợp cột) định danh duy nhất mỗi bản ghi trong bảng. PK không được phép NULL.
- **Tác dụng:** Phân biệt các bản ghi. Hầu hết các DB sẽ tự tạo **Clustered Index** dựa trên khóa chính, giúp truy xuất 1 record cực nhanh.
- **Nhược điểm:** Nếu chọn PK sai (ví dụ chuỗi ngẫu nhiên dài hoặc UUID v4 không tuần tự), nó có thể gây ra hiện tượng _Page Split_ làm giảm mạnh hiệu suất INSERT/UPDATE.
- **Thực tế:**
  - Hệ thống nhỏ/truyền thống: Dùng `INT/BIGINT AUTO_INCREMENT`.
  - Hệ thống phân tán (Microservices): Dùng **UUID v7**, **ULID**, hoặc thuật toán **Snowflake ID** (do có tính tuần tự theo thời gian và an toàn khi tạo đồng thời ở nhiều server).

### 1.3 Khóa ngoại (Foreign Key - FK)

- **Định nghĩa:** Ràng buộc đảm bảo giá trị ở một cột phải tồn tại ở khóa chính của bảng khác.
- **Tác dụng:** Đảm bảo toàn vẹn tham chiếu (Referential Integrity). Tránh tình trạng có "bản ghi mồ côi" (VD: Bài viết thuộc về User ID = 5, nhưng User ID = 5 đã bị xóa).
- **Nhược điểm:** Làm chậm quá trình INSERT/UPDATE/DELETE vì DB luôn phải check xem ID có tồn tại/có bị ràng buộc hay không.
- **Thực tế:**
  - Ở các hệ thống nhỏ và vừa: Khuyên dùng để DB tự lo tính toàn vẹn.
  - Ở các hệ thống siêu lớn, High Traffic hoặc Microservices: **Thường bỏ qua Foreign Key**. Họ tự xử lý tính toàn vẹn dữ liệu ở tầng Application code để tối ưu tốc độ ghi.

### 1.4 SELECT, INSERT, UPDATE, DELETE (DML)

- **Định nghĩa:** Các câu lệnh tương tác dữ liệu (Data Manipulation Language).
- **Tác dụng:** Thêm, sửa, xóa, đọc dữ liệu.
- **Nhược điểm:** Nếu không cẩn thận (quên mệnh đề `WHERE` khi `UPDATE/DELETE`) sẽ sửa/xóa nhầm toàn bộ bảng dữ liệu.
- **Thực tế:**
  - Hạn chế tối đa việc dùng lệnh `DELETE` cứng. Thay vào đó dùng **Soft Delete** (Thêm 1 cột `deleted_at`, khi xóa thì `UPDATE deleted_at = NOW()`).
  - Không bao giờ dùng `SELECT *`, chỉ select các cột thực sự cần để giảm tải RAM và băng thông.

### 1.5 JOINs

- **Định nghĩa:** Kết hợp dữ liệu từ 2 hay nhiều bảng dựa trên một cột chung.
  - `INNER JOIN`: Chỉ lấy các bản ghi khớp nhau ở cả 2 bảng.
  - `LEFT JOIN`: Lấy TẤT CẢ ở bảng bên trái, nếu bảng bên phải không có thì để NULL.
- **Tác dụng:** Lấy dữ liệu liên quan mà không cần gọi DB nhiều lần.
- **Nhược điểm:** Tốn tài nguyên CPU/RAM. Càng JOIN nhiều bảng thì truy vấn càng chậm, đặc biệt nếu thiếu Index.
- **Thực tế:** Cố gắng giới hạn số lượng bảng JOIN (thường <= 3-4 bảng). Nếu logic quá phức tạp, đôi khi chia thành 2 câu query nhỏ kết hợp ở code BE hoặc dùng cơ sở dữ liệu NoSQL/Elasticsearch để lưu dữ liệu đọc (CQRS).

### 1.6 Indexes (Chỉ mục)

- **Định nghĩa:** Cấu trúc dữ liệu riêng biệt (thường là B-Tree) giúp tăng tốc quá trình tìm kiếm, giống như Mục Lục của một cuốn sách.
- **Tác dụng:** Tăng tốc độ đọc (`SELECT`, `WHERE`, `JOIN`, `ORDER BY`) lên gấp hàng nghìn lần so với việc quét toàn bảng (Full Table Scan).
- **Nhược điểm:** Tốn thêm dung lượng ổ cứng. Đặc biệt: **Làm chậm thao tác INSERT/UPDATE/DELETE** vì mỗi lần dữ liệu đổi, DB phải cập nhật lại cấu trúc Index.
- **Thực tế:** Đánh index cho các cột thường xuyên xuất hiện ở `WHERE`, khóa ngoại (`FK`), cột cần sắp xếp. Tránh đánh Index cho các cột có quá ít giá trị phân biệt (như giới tính Nam/Nữ).

### 1.7 Views

- **Định nghĩa:** Một bảng "ảo" được tạo ra bởi một câu lệnh `SELECT` lưu sẵn.
- **Tác dụng:** Đơn giản hóa các query phức tạp dài hàng trăm dòng, che giấu dữ liệu nhạy cảm (cho user xem View không có cột password).
- **Nhược điểm:** View thông thường không làm query chạy nhanh hơn vì bản chất nó vẫn biên dịch lại query mỗi lần gọi (trừ _Materialized View_).
- **Thực tế:** Thường dùng cho các công cụ BI (Business Intelligence), Data Analytics để xuất báo cáo. PostgreSQL hỗ trợ _Materialized View_ lưu lại kết quả thực, giúp tăng tốc độ đọc dữ liệu tĩnh.

### 1.8 Stored Procedures (SP)

- **Định nghĩa:** Những đoạn mã SQL (chứa if/else, vòng lặp...) được định nghĩa và lưu trữ sẵn trên Database.
- **Tác dụng:** Chạy logic thẳng ở mức Database giúp giảm độ trễ mạng (network latency) thay vì gọi nhiều query từ Backend. Rất nhanh và tối ưu.
- **Nhược điểm:**
  - Khó debug, khó viết unit test, khó quản lý version control (so với code ứng dụng).
  - Gây **Vendor Lock-in** (Nếu dùng SP của SQL Server, sau này muốn chuyển sang PostgreSQL gần như phải đập đi viết lại).
  - Chuyển gánh nặng xử lý CPU vào Database (vốn khó scale ngang hơn so với Web server).
- **Thực tế hiện nay:** Backend Developer hiện đại **RẤT ÍT** dùng Stored Procedures cho logic nghiệp vụ. Business logic nên nằm ở tầng Application (BE). SP chỉ nên dùng cho các tác vụ Maintainance nội bộ, cronjob của DB, hoặc xử lý Batch Data cực kỳ nặng cần tối ưu tuyệt đối.

### 1.9 Transactions (Giao dịch)

- **Định nghĩa:** Một nhóm các lệnh thao tác DB được nhóm lại thành một khối. Khối này phải tuân thủ nguyên tắc **All-or-Nothing** (Thành công toàn bộ, hoặc thất bại toàn bộ).
- **Tác dụng:** Đảm bảo tính ACID, đặc biệt quan trọng khi thao tác tiền bạc.
  - _Ví dụ:_ Chuyển tiền từ A sang B gồm 2 lệnh: Trừ tiền A, Cộng tiền B. Nếu lệnh 2 lỗi, transaction sẽ `ROLLBACK` lệnh 1, tránh việc A mất tiền mà B chưa nhận được.
- **Nhược điểm:** Khi transaction mở, DB sẽ đặt Lock (khóa) trên các dòng dữ liệu. Transaction dài sẽ làm treo các thao tác khác (bottleneck, deadlocks).
- **Thực tế:** Luôn giữ Transaction ngắn nhất có thể. Không gọi API bên thứ 3 trong khi đang mở Transaction (vì API thứ 3 có thể timeout mất 10s, làm khóa luôn DB trong 10s đó).

---

## 2. Phần Nào Quan Trọng Nhất Đối Với Backend Developer?

Trong số các mục trên, chia làm 2 cấp độ:

- **MUST MASTER (Bắt buộc phải giỏi):** `Cấu trúc bảng, Khóa chính/Khóa ngoại, SELECT/INSERT/UPDATE/DELETE, JOINs, Indexes, Transactions.` Bạn dùng những thứ này 99% thời gian làm việc. Việc tối ưu DB của Backend phụ thuộc chủ yếu vào hiểu biết về **Indexes** và **Transactions**.
- **NICE TO HAVE (Biết để khi cần thì dùng):** `Views, Stored Procedures, Triggers`. (Trừ khi bạn vào làm ở ngân hàng với hệ thống core cũ, còn làm Web Apps hiện đại thì ít đụng).

---

## 3. Cách Tối Ưu Query Dành Cho Backend Developer

1. **Hiểu rõ câu lệnh với EXPLAIN:** Luôn chạy `EXPLAIN` hoặc `EXPLAIN ANALYZE` (trên Postgres) trước các câu query chậm để xem Execution Plan (DB đang dùng Index nào, quét bao nhiêu dòng). Nếu thấy _Full Table Scan / Seq Scan_ ở bảng lớn thì phải xem lại Index.
2. **Nguyên tắc "Left-most prefix" trong Composite Index:** Nếu đánh index gộp trên (A, B, C), query `WHERE A=1 AND B=2` sẽ dùng được index, nhưng `WHERE B=2 AND C=3` sẽ **KHÔNG** dùng được index (vì thiếu cột đứng đầu A).
3. **Tránh xử lý hàm trên cột đã Index (Sargability):**
   - ❌ Sai (Làm mất Index): `WHERE YEAR(created_at) = 2024`
   - ✅ Đúng: `WHERE created_at >= '2024-01-01' AND created_at < '2025-01-01'`
4. **Tránh JOIN vô tội vạ:** Đôi khi chạy 2 câu select nhỏ kết hợp bằng code BE lại nhanh và dễ cache vào Redis hơn là 1 câu JOIN chằng chịt 5 bảng.
5. **Deep Pagination (Phân trang sâu):**
   - ❌ Dùng `OFFSET 1,000,000 LIMIT 10`: Cực chậm vì DB phải đếm qua và loại bỏ 1 triệu record đầu tiên.
   - ✅ Dùng **Keyset Pagination (Cursor Pagination)**: `WHERE id > last_seen_id LIMIT 10`. Rất mượt và cực nhanh kể cả ở trang thứ 1 triệu.

---

## 4. Các Lỗi Hay Gặp (Common Pitfalls)

1. **Vấn đề N+1 Query:**
   - Lỗi kinh điển khi dùng ORM. Khi bạn get danh sách 100 User, sau đó trong vòng lặp bạn truy vấn lấy Bài viết của từng User. Tổng cộng DB phải chạy 1 + 100 = 101 câu query.
   - **Cách fix:** Dùng tính năng Eager Loading của ORM (như `include` trong Prisma), hoặc dùng DataLoader để gom lại thành 1 câu `SELECT ... WHERE user_id IN (...)`.
2. **SQL Injection:**
   - Lỗi bảo mật chết người. Ghép chuỗi đầu vào của user thẳng vào query.
   - **Cách fix:** Luôn dùng **Parameterized Queries** (hoặc cứ dùng ORM/Query Builder hiện đại thì mặc định đã an toàn).
3. **Deadlock (Khóa chéo):**
   - Transaction A lock Hàng 1 rồi đợi Hàng 2. Transaction B lock Hàng 2 rồi đợi Hàng 1. Cả 2 cùng đợi nhau vĩnh viễn.
   - **Cách fix:** Mọi transaction phải thao tác các bảng/hàng theo cùng một thứ tự thống nhất (vd: luôn khóa bảng User trước, bảng Post sau).
4. **Không giới hạn dữ liệu đầu ra (Missing LIMIT):**
   - Query trả về 1 triệu dòng đẩy lên backend RAM. App sập (Out of Memory - OOM).
   - **Cách fix:** Các hàm GetList luôn luôn phải bắt buộc truyền tham số phân trang (`LIMIT` / `Take`).
5. **Mở kết nối (Connection) không kiểm soát:**
   - Tạo kết nối tới DB rất tốn kém. Nếu app cứ mỗi request lại tạo 1 connection sẽ làm sập DB.
   - **Cách fix:** Sử dụng Connection Pooling (PgBouncer cho Postgres, hoặc cấu hình max_pool_size ở Prisma/TypeORM) để tái sử dụng connection.
