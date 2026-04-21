BẢN KẾ HOẠCH DỰNG BACKEND TIKTOK CLONE VỚI NESTJS
1. Tech Stack (Phù hợp với Vercel Free & Thực tế)
Framework: NestJS (TypeScript).
Database chính (RDBMS): PostgreSQL (Dùng Supabase Free hoặc NeonDB Free vì chúng hỗ trợ Connection Pooling - bắt buộc phải có khi chạy Serverless trên Vercel để tránh sập DB).
ORM: Prisma (Rất mạnh, type-safe, dễ kết hợp với NestJS).
Caching & Queue: Redis (Dùng Upstash Free, cực kỳ phù hợp cho Serverless). Dùng để đếm View, đếm Like, Cache Feed.
Lưu trữ Video (Storage): Cloudinary Free hoặc AWS S3 Free Tier. Cloudinary tốt hơn cho video vì nó tự động nén, tối ưu hóa và hỗ trợ stream video tốt hơn trên mobile.
Real-time (Comments): Vì Vercel không chạy được WebSocket, ta sẽ dùng Pusher (Free tier) hoặc Supabase Realtime. Backend NestJS chỉ làm nhiệm vụ nhận comment, lưu vào DB và "bắn" event qua Pusher. Client (Frontend) sẽ nghe event từ Pusher.
2. Các tính năng cốt lõi (Core Features)
Auth Module: Đăng ký, đăng nhập (JWT), Refresh Token, Login bằng Google.
User Module: Profile, Follow/Unfollow.
Video Module:
Lấy Signed URL để Frontend tự upload video thẳng lên Cloudinary/S3 (Backend KHÔNG nhận file video trực tiếp để tiết kiệm băng thông và không bị timeout trên Vercel).
Tạo Metadata (Title, Hashtag).
Cơ chế Feed (For You - Thuật toán cơ bản, Following).
Interaction Module: Like, Share, Lưu video.
Comment Module (Real-time): Comment cha/con (Nested comments), bắn event realtime.
3. Lộ trình thực hiện (Step-by-Step Plan)
Giai đoạn 1: Khởi tạo & Cấu hình cơ bản (Tuần 1)
Setup project NestJS: nest new tiktok-clone.
Cài đặt Prisma và kết nối với PostgreSQL (NeonDB/Supabase). Setup PgBouncer hoặc Connection Pooling.
Cấu hình JWT Authentication & Guard.
Kinh nghiệm thực tế: Viết Exception Filter toàn cục để format lỗi trả về chuẩn xác, setup Winston/Pino để ghi log.
Giai đoạn 2: User & Social Graph (Tuần 2)
Tạo các API Profile (Lấy thông tin, cập nhật avatar).
Tạo API Follow/Unfollow.
Kinh nghiệm thực tế: Khi User A follow User B, không thể đếm SELECT COUNT(*) mỗi lần có người vào profile. Phải tạo 2 field followerCount và followingCount trong bảng User. Dùng Prisma Transaction để vừa thêm record follow, vừa tăng (increment) biến count.
Giai đoạn 3: Xử lý Video & Feed (Tuần 3)
Tạo API Generate Pre-signed URL (Cho phép Frontend tự upload file lên Cloud, sau khi upload xong gọi lại API lưu URL vào DB).
API lấy danh sách Video (Phân trang dùng Cursor-based Pagination thay vì Offset/Limit vì dữ liệu thêm mới liên tục, dùng Limit/Offset sẽ bị lặp video).
Kinh nghiệm thực tế (Đếm View): Không update DB mỗi khi có 1 view (sẽ sập DB). Khi có người xem, đẩy ViewId vào Redis. Cứ 5 phút, chạy 1 Cronjob (hoặc Upstash QStash) lấy tổng view từ Redis ghi vào Database (Batch Update).
Giai đoạn 4: Tương tác & Realtime Comment (Tuần 4)
Làm tính năng Like/Unlike (Cũng nên cache Like trên Redis tương tự View).
Làm Comment: Thiết kế cấu trúc Parent-Child (Reply comment).
Tích hợp Pusher API. Khi API POST /comments được gọi -> Lưu DB -> pusher.trigger('video-123', 'new-comment', data).
Kinh nghiệm thực tế: Dùng Redis để chặn Spam Comment (Rate limit: 1 User chỉ được comment 5 lần / 1 phút).
Giai đoạn 5: Deploy & Tối ưu (Tuần 5)
Đưa lên Vercel. Cấu hình vercel.json để compile NestJS thành Serverless function.
Test tải (Load Testing) bằng K6 hoặc Artillery.
Tối ưu index trong Database (Index các cột authorId, videoId, createdAt).
4. Database Schema (Prisma Format)
Tham khảo file schema-sample.md




Tuyệt vời! Khi bạn đã nắm trong tay Schema DB và ERD, phần móng của ngôi nhà coi như đã vững chắc. Bây giờ, tôi sẽ tổng hợp lại toàn bộ vòng đời dự án từ lúc "gõ dòng code đầu tiên" cho đến khi "chuyển nhà sang VPS" thành một lộ trình thực thi (Actionable Plan) ngắn gọn, chuẩn xác nhất.

---

# TỔNG HỢP LỘ TRÌNH TRIỂN KHAI TIKTOK CLONE BACKEND

## GIAI ĐOẠN 1: SETUP KIẾN TRÚC & DỊCH VỤ CLOUD (TUẦN 1)
Nguyên tắc cốt lõi: **Stateless (App không lưu trạng thái/file vật lý)**.

1. **Khởi tạo dịch vụ bên ngoài (External Services):**
   * **Database:** Tạo tài khoản **Supabase** (hoặc NeonDB), lấy chuỗi kết nối `DATABASE_URL`.
   * **Redis:** Tạo tài khoản **Upstash**, lấy chuỗi kết nối Redis (Dùng để đếm View, chặn Spam, chạy Socket.io Adapter).
   * **Storage:** Tạo tài khoản **Cloudinary** hoặc **Cloudflare R2/AWS S3** để lưu Video/Ảnh.
2. **Khởi tạo Codebase:**
   * Dùng lệnh `nest new tiktok-clone`.
   * Cài đặt Prisma: `npm install prisma --save-dev` và `npx prisma init`.
   * Tạo ngay file `Dockerfile` chuẩn (như tôi đã gửi ở trên) ngay từ ngày đầu.
3. **Cấu hình Môi trường:** Setup module `@nestjs/config` để bắt buộc mọi kết nối phải đọc qua file `.env`.

---

## GIAI ĐOẠN 2: CODE CÁC MODULE CỐT LÕI (TUẦN 2 - TUẦN 4)

1. **Module Auth & User:**
   * Setup Passport.js (JWT cho Local Login, OAuth2 cho Google/Facebook SSO).
   * Viết logic cập nhật Profile (Chỉ lưu link Avatar dạng string lấy từ Cloudinary/S3).
2. **Module Video (Đặc biệt quan trọng):**
   * Viết API **Generate Pre-signed URL**: Frontend gọi API này để lấy quyền upload thẳng file video lên S3/Cloudinary. (Không đẩy file qua NestJS).
   * Viết API **Webhook/Confirm**: Sau khi Frontend upload xong, gọi API này để Backend lưu link video, duration, size... vào bảng `Video`.
   * Viết API **Feed (Lướt Tiktok):** Dùng Prisma phân trang bằng `cursor` (Lấy ID video cuối cùng) thay vì `skip/take`.
3. **Module Realtime & Tương tác:**
   * Cài `@nestjs/platform-socket.io` và `@nestjs/websockets`.
   * Setup **Redis Adapter** cho Socket.io để chuẩn bị cho việc scale nhiều server sau này.
   * Viết logic: Khi User A comment -> Lưu DB -> `server.to(videoId).emit('new_comment', data)`.
   * **Tối ưu View/Like:** Không `UPDATE` DB liên tục. View/Like đổ vào Redis -> Dùng `@nestjs/schedule` (Cronjob) cứ 5 phút gom lại ghi xuống DB 1 lần (Batch Update).

---

## GIAI ĐOẠN 3: DEPLOY LÊN RENDER.COM (GIAI ĐOẠN ĐẦU)

Khi code xong, đưa lên mạng cho người dùng thật test:

1. Đẩy toàn bộ code lên **GitHub**.
2. Đăng nhập **Render.com**, chọn tạo **Web Service**.
3. Kết nối Render với Repo GitHub của bạn.
4. **Cấu hình cực kỳ quan trọng trên Render:**
   * **Environment:** Chọn "Docker" (Render sẽ tự đọc file Dockerfile để build).
   * Nhập toàn bộ các biến trong file `.env` của bạn (DATABASE_URL, REDIS_URL, S3_KEY...) vào bảng Environment Variables của Render.
5. Ấn **Deploy**. Chờ khoảng 2-3 phút, Render sẽ cấp cho bạn 1 đường link (VD: `tiktok-api.onrender.com`).
6. Trỏ Custom Domain của bạn (vd: `api.domain.com`) về link Render đó thông qua CNAME record.
*Lúc này, hệ thống chạy hoàn hảo, có WebSockets real-time, Database ở Supabase, Video ở S3.*

---

## GIAI ĐOẠN 4: CHIẾN DỊCH "DỜI NHÀ" SANG VPS (ZERO DOWNTIME)

Sau vài tháng, lượng truy cập tăng, Render.com hết miễn phí và bắt đầu tính tiền đắt. Ta sẽ thực hiện dời sang VPS (Hetzner/DigitalOcean) **mà không làm gián đoạn người dùng (Zero Downtime)**.

*Vì ta đã tách Database (Supabase) và Storage (S3) ra riêng, nên việc dời nhà siêu dễ:*

1. **Chuẩn bị VPS mới:**
   * Mua 1 con VPS (Ví dụ Hetzner ~ 100k/tháng).
   * Cài đặt **Coolify** lên VPS (Lệnh cài đặt chỉ có 1 dòng trên trang chủ Coolify).
2. **Deploy Code lên VPS (App trên Render vẫn đang chạy):**
   * Đăng nhập vào giao diện Coolify (trên VPS), kết nối với chính Repo GitHub lúc trước.
   * Tạo 1 Project mới trên Coolify, dán y xì đúc các biến `.env` từ Render sang Coolify.
   * Nhấn Deploy trên Coolify.
   * *Kiểm tra:* Truy cập thử IP của VPS hoặc domain tạm của Coolify, đảm bảo API trả về data (Vì nó đang nối chung vào 1 Database Supabase và 1 S3 với Render). WebSockets vẫn chạy bình thường.
3. **Thực hiện Switch DNS (Cú chốt):**
   * Vào nơi quản lý tên miền (Cloudflare / Namecheap).
   * Sửa record của `api.domain.com`: Xóa CNAME trỏ về Render -> **Đổi thành bản ghi A trỏ về IP của VPS.**
   * Bật tùy chọn SSL (HTTPS) trên Coolify.
4. **Hoàn tất:**
   * Mất khoảng 1-5 phút để DNS cập nhật toàn cầu. Trong thời gian này, traffic của user sẽ tự động chuyển dần từ Render sang VPS. Dù user có gọi API vào bên nào thì dữ liệu vẫn lưu chung vào 1 chỗ (Supabase/S3).
   * Sau khi kiểm tra traffic đã sang hết VPS, bạn vào Render.com và nhấn **Suspend/Delete Web Service**.

🎉 **XONG!** Quá trình phát triển và dời nhà đã hoàn tất một cách chuyên nghiệp như các hệ thống lớn. Giờ bạn chỉ cần bật VSCode lên và bắt đầu từ Giai đoạn 1. Chúc bạn code thật "cháy" nhé!

Lưu ý thực tế "sống còn" khi code TikTok Clone:
Tránh "Nút thắt cổ chai" khi Upload Video: Ở mô hình Client-Server truyền thống, App -> Server -> S3. Với TikTok, file video rất nặng, gọi qua backend Vercel sẽ bị timeout (giới hạn 10s của free tier). Giải pháp: Backend NestJS cấp Pre-signed URL -> App upload trực tiếp lên S3/Cloudinary -> Báo lại Backend là xong.
Video Streaming: Đừng gửi file .mp4 nguyên gốc xuống Frontend. Khi upload lên Cloudinary, hãy config để nó tự convert sang định dạng HLS (m3u8). HLS chia video thành nhiều đoạn nhỏ (chunks 2-3s), mạng yếu xem đến đâu load đến đó giống hệt Youtube/TikTok.
Cursor Pagination: Không bao giờ dùng skip và take thuần tuý trong Prisma cho trang Feed. Hãy dùng cursor (Lấy ID của video cuối cùng làm mốc để load các video tiếp theo).
SSO Login: Flow chuẩn là Frontend gọi API Google/Facebook lấy accessToken/idToken, sau đó gửi token này xuống Backend (NestJS). Backend dùng token đó gọi lên API của Google (hoặc xài thư viện verify) để kiểm tra, nếu hợp lệ thì Backend mới tạo/update user trong DB và trả về JWT của hệ thống cho Frontend.
HLS Streaming (M3U8): Trong bảng Video, bạn sẽ thấy có originalUrl và hlsUrl. Thực tế bạn bắt buộc phải có dịch vụ convert .mp4 sang .m3u8 (HLS format). Trình duyệt/Mobile app sẽ load file .m3u8 này. Nó chia video ra thành hàng chục file .ts dung lượng cực nhỏ (vài KB), mạng chập chờn cũng vẫn xem mượt không bị khựng.
Thả tim (Tym/Like): Khi user bấm thả tim liên tục (spam), Frontend nên làm hiệu ứng bay tim (Animation) ngay lập tức (Optimistic UI), đồng thời debounce hoặc gộp (batch) các lượt like lại sau 1-2 giây mới gọi API xuống Backend 1 lần để tránh sập DB.
WebSocket cho Comment: Do bạn dùng VPS tự host, bạn không cần dùng Pusher nữa. Hãy cài thư viện @nestjs/platform-socket.io, nó là socket.io thuần túy, hoàn toàn miễn phí và cực kỳ mạnh mẽ. Nhớ dùng thêm Redis Adapter cho Socket.io nếu sau này bạn chạy nhiều máy chủ cùng lúc.