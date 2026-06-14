# Fullstack Interview Guide - Part 1

# Next.js

---

## PHẦN A: KIẾN THỨC NỀN TẢNG

---

## II. REST API Concepts

### 1. HTTP Methods

| Method | Mục đích          | Idempotent? | Body? |
| ------ | ----------------- | ----------- | ----- |
| GET    | Lấy dữ liệu       | ✅          | ❌    |
| POST   | Tạo mới           | ❌          | ✅    |
| PUT    | Thay thế toàn bộ  | ✅          | ✅    |
| PATCH  | Cập nhật một phần | ❌          | ✅    |
| DELETE | Xóa               | ✅          | ❌    |

### 2. HTTP Status Codes

- **2xx Success**: 200 OK, 201 Created, 204 No Content
- **4xx Client Error**: 400 Bad Request, 401 Unauthorized (chưa đăng nhập), 403 Forbidden (không có quyền), 404 Not Found, 409 Conflict
- **5xx Server Error**: 500 Internal Server Error, 502 Bad Gateway, 503 Service Unavailable

### 3. Idempotency

Gọi 1 lần hay N lần đều cho kết quả giống nhau. GET, PUT, DELETE là idempotent. POST không phải (mỗi lần gọi tạo bản ghi mới).

### 4. API Versioning

- **URL**: `/api/v1/users` → Dễ hiểu, phổ biến nhất.
- **Header**: `Accept: application/vnd.api.v1+json` → URL sạch, khó debug.
- **Query**: `/api/users?version=1` → Linh hoạt nhưng dễ quên.

### 5. API Security

- **CORS**: Kiểm soát domain nào được gọi API.
- **CSRF**: Tấn công giả mạo request từ site khác. Chống bằng CSRF token.
- **XSS**: Inject script vào trang. Chống bằng sanitize input, CSP header.
- **SQL Injection**: Inject SQL vào input. Chống bằng parameterized queries/ORM.
- **JWT**: Token mã hóa chứa thông tin user, gửi qua `Authorization: Bearer <token>`.
- **OAuth2**: Ủy quyền truy cập qua bên thứ 3 (Google, Facebook login).

---

## VI. Next.js Chuyên Sâu

### 1. Rendering Strategies

| Strategy                       | Khi nào render?      | Khi nào dùng?                                  |
| ------------------------------ | -------------------- | ---------------------------------------------- |
| **CSR**                        | Trên browser         | Dashboard, admin panel                         |
| **SSR** (`getServerSideProps`) | Mỗi request          | Data thay đổi liên tục, cần SEO (feed, search) |
| **SSG** (`getStaticProps`)     | Lúc build            | Blog, landing page, docs                       |
| **ISR** (`revalidate`)         | Build + cập nhật nền | E-commerce product page                        |

**getServerSideProps** - chạy mỗi request:

```jsx
export async function getServerSideProps(context) {
  const { req, res, params, query } = context;
  const data = await fetch(`https://api.example.com/posts`);
  return { props: { posts: await data.json() } };
}
```

**getStaticProps + ISR** - build sẵn, revalidate sau N giây:

```jsx
export async function getStaticProps() {
  const products = await db.product.findMany();
  return {
    props: { products },
    revalidate: 60, // Rebuild lại sau 60 giây
  };
}
```

**getStaticPaths fallback:**

- `false`: Chỉ render paths đã khai báo. Paths khác → 404.
- `true`: Paths mới → hiển thị fallback loading, build nền, cache lại.
- `'blocking'`: Paths mới → SSR lần đầu (user chờ), cache cho lần sau.

### 2. File-system Routing

```
pages/
  index.js          → /
  about.js          → /about
  posts/
    [id].js         → /posts/1, /posts/abc
    [...slug].js    → /posts/a/b/c (catch-all)
  [[...slug]].js    → / hoặc /a/b/c (optional catch-all)
```

### 3. API Routes

```jsx
// pages/api/users.js
export default async function handler(req, res) {
  if (req.method === "POST") {
    const user = await createUser(req.body);
    return res.status(201).json(user);
  }
  const users = await getUsers();
  res.status(200).json(users);
}
```

**Khi nào dùng API Routes thay backend riêng?**

- ✅ BFF (Backend for Frontend) pattern, proxy API, xử lý form đơn giản.
- ❌ Logic phức tạp, real-time, microservices → Dùng NestJS/FastAPI riêng.

### 4. Image Optimization

```jsx
import Image from "next/image";
<Image
  src="/hero.jpg"
  width={800}
  height={600}
  alt="Hero"
  priority // Preload cho LCP
  placeholder="blur" // Blur placeholder
/>;
```

- Tự động resize, convert WebP/AVIF.
- Lazy loading mặc định.
- Giảm CLS (Cumulative Layout Shift) nhờ khai báo width/height.

### 5. SEO trong Next.js

```jsx
import Head from "next/head";
export default function Page() {
  return (
    <>
      <Head>
        <title>Trang chủ | MySite</title>
        <meta name="description" content="Mô tả trang" />
        <meta property="og:title" content="MySite" />
        <link rel="canonical" href="https://mysite.com" />
      </Head>
      {/* Content */}
    </>
  );
}
```

- Tạo `sitemap.xml` và `robots.txt` trong `/public`.
- SSR/SSG giúp search engine crawl được nội dung (CSR thì không).

### 6. Middleware (Next.js 12+)

```jsx
// middleware.js (root project)
import { NextResponse } from "next/server";

export function middleware(request) {
  const token = request.cookies.get("token");
  if (!token && request.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
```

- Chạy **trước** mọi route match.
- Use cases: Auth check, redirect, A/B testing, geolocation.

### 7. Auth trong Next.js

- **Client-side**: Lưu JWT vào cookie httpOnly. Dùng Context/SWR để check auth state.
- **Server-side**: Đọc cookie trong `getServerSideProps` → verify token → trả props hoặc redirect.
- **Middleware**: Check token ở edge, redirect trước khi page load.

### 8. Data Fetching (SWR/React Query)

```jsx
import useSWR from "swr";

const fetcher = (url) => fetch(url).then((r) => r.json());

function Profile() {
  const { data, error, isLoading, mutate } = useSWR("/api/user", fetcher, {
    revalidateOnFocus: true, // Refresh khi tab focus
    dedupingInterval: 2000, // Deduplicate request trong 2s
  });
  // mutate() để revalidate thủ công
}
```

### 9. Error Handling

- `pages/_error.js`: Custom error page (500, 404...).
- `pages/404.js`: Custom 404 page riêng.
- `pages/_app.js`: Wrap Error Boundary cho toàn app.

### 10. Deployment

- **Vercel**: Zero-config, tối ưu cho Next.js. Edge Functions, Analytics.
- **Self-hosted**: `next build` → `next start`. Cần Node.js server. Mất ISR on-demand nếu không config CDN.

---

## PHẦN B: CÂU HỎI PHỎNG VẤN & TRẢ LỜI (NEXT.JS)

### II. ReactJS & Next.js

**1. React Hooks**

- **`useCallback` vs `useMemo`:** Cả hai đều dùng để tối ưu (Memoization). `useMemo` cache _giá trị_ trả về của một phép tính nặng. `useCallback` cache _địa chỉ ô nhớ_ của một hàm.
  - _Có hại khi nào:_ Chạy `useMemo` cho một phép tính đơn giản sẽ làm chậm app hơn vì React tốn thêm thời gian so sánh mảng `deps` (dependency array) thay vì cứ tính đại cho xong.
- **Side effects phức tạp:** Trong `useEffect`, nếu subscribe event hoặc mở websocket, luôn phải `return` một hàm dọn dẹp (cleanup function) để unsubscribe/close kết nối khi component unmount, tránh memory leak.
- **`useReducer` thay `useState`:** Khi state là một object phức tạp với nhiều trạng thái lồng nhau, hoặc trạng thái mới phụ thuộc vào trạng thái cũ thông qua nhiều hành động (actions) khác nhau (ví dụ: giỏ hàng - add, remove, update qty).
- **Custom Hooks:** Trích xuất logic stateful có thể tái sử dụng. Bắt đầu bằng chữ `use` (ví dụ `useWindowSize`), sử dụng các hook cơ bản bên trong và trả về data/functions.

**2. Performance Optimization trong React**

- **Chiến lược:**
  1. Windowing / Virtualized Lists (chỉ render item đang hiện trên màn hình).
  2. Throttle/Debounce các event bắn liên tục (scroll, resize, type).
  3. Đẩy state xuống component con sâu nhất có thể để tránh re-render toàn bộ app.
- **Code Splitting / Lazy Loading:** Dùng `React.lazy()` và `<Suspense>` để chia tách file bundle JS. Khi người dùng chưa vào trang A, file JS của trang A chưa được tải. Giúp giảm thời gian Initial Load (TTV - Time to Interactive).
- **Profiling:** Mở thẻ Profiler trong React DevTools, ấn Record, thực hiện thao tác. Xem "Flamegraph" để biết component nào tốn nhiều thời gian render nhất và lý do tại sao nó render (do props đổi hay state đổi).

**3. Next.js Specific**

- **SSR, SSG, ISR, CSR:**
  - _CSR (Client):_ Trắng trang ban đầu, JS tự vẽ. Tốt cho app ẩn sau login.
  - _SSR (Server):_ Server chạy React mỗi khi có request, trả HTML. Tốt cho data liên tục đổi + SEO (Trang chi tiết User).
  - _SSG (Static):_ Chạy React 1 lần duy nhất lúc Build time. Tốt cho Blog, Docs (Tốc độ bàn thờ).
  - _ISR (Incremental):_ Giống SSG nhưng cho phép build lại trang ngầm ở background sau N giây. Tốt cho E-commerce (cần nhanh nhưng giá đổi thì phải cập nhật).
- **`getServerSideProps` thay `getStaticProps`:** Bắt buộc khi dữ liệu phụ thuộc vào context của _request đó_ (ví dụ: đọc Cookie để biết user là ai, hoặc check Authorization header).
- **Tham số `revalidate`:** Trong `getStaticProps`, `revalidate: 60` nghĩa là sau 60s kể từ lần truy cập gần nhất, nếu có request mới, Next.js sẽ trả về bản cũ, đồng thời ở background nó sẽ chạy lại `getStaticProps` để tạo bản mới cho người đến sau (ISR).
- **Tham số `fallback` trong `getStaticPaths`:**
  - `false`: Path không có lúc build sẽ lỗi 404.
  - `true`: Trả về giao diện tạm (loading), chạy fetch data ở background, render xong lưu lại.
  - `'blocking'`: Giữ request chờ (không hiện loading), fetch data ở server, xong mới trả HTML (giống SSR lần đầu).
- **API Routes:** Nằm trong thư mục `/pages/api/`. Dùng cho logic backend nhẹ, che giấu API key thứ 3 (BFF pattern). Không nên dùng nếu hệ thống lớn cần Microservices/WebSockets.
- **Image Optimization (`next/image`):** Tự động chuyển ảnh sang WebP/AVIF, lazy load ngoài màn hình, cung cấp width/height để trình duyệt chừa sẵn khoảng trống chống CLS (Cumulative Layout Shift).
- **SEO:** Dùng thẻ `<Head>` từ `next/head` để chèn dynamic `title`, `meta description`, `og:image`. Dùng SSR/SSG để bot Google đọc được nội dung HTML ngay lập tức.
- **Middlewares:** Chạy ở Edge Runtime trước khi request chạm tới file route. Dùng để check JWT Cookie, nếu chưa login thì điều hướng (`redirect`) sang trang login. Nhanh và tiết kiệm tài nguyên.
- **CSS-in-JS / Tailwind:** Tailwind cấu hình qua `postcss.config.js` và `tailwind.config.js`. CSS-in-JS (như styled-components) cần tinh chỉnh `.babelrc` hoặc `next.config.js` để inject CSS vào server-side lúc SSR, nếu không giao diện sẽ bị nháy (FOUC) do render server không có class JS.
- **Error Handling:** Next cung cấp `pages/404.js` (Lỗi không tìm thấy) và `pages/500.js` hoặc `pages/_error.js` (Lỗi Server). Bọc app trong Error Boundary ở `_app.js` để bắt lỗi Client.
- **Deployment:** Vercel là tối ưu nhất vì hỗ trợ native mọi tính năng (ISR, Edge Middleware, Image Optimization bằng serverless CDN). Nếu deploy lên Custom VPS (Docker, Node.js Server) bằng `next start`, bạn cần tự setup Caching layer hoặc nginx, tính năng Image Optimize/ISR có thể tốn tài nguyên server của bạn.

---

> **Phần NestJS:** → xem `NESTJS_MASTERY_GUIDE.md`
> **Tiếp tục tại `FULLSTACK_GUIDE_PART2.md`** → Database, DevOps, Behavioral Questions
