# PHẦN 6: BẢO TRÌ, GỠ LỖI, KIẾN THỨC NGÀNH & KỸ NĂNG MỀM — DEEP DIVE

---

## 1. Bảo trì & Gỡ lỗi (Debugging)

### 1.1. React DevTools — Sử dụng chuyên sâu

**Components Tab:**
- Inspect từng component, xem **props, state, hooks** hiện tại.
- Click vào component → xem nó render bởi parent nào (component tree).
- **Highlight Updates:** Bật tính năng "Highlight updates when components render" → thấy viền flash quanh component nào đang re-render. Nếu thấy toàn bộ trang flash liên tục → có vấn đề performance.

**Profiler Tab:**
- Ghi lại quá trình render, hiển thị **mỗi commit** (lần React cập nhật DOM).
- Cho biết: component nào render, render mất bao lâu, tại sao render (props changed? state changed? parent re-rendered?).
- **Flamegraph:** Hiển thị cây component, màu vàng/đỏ = render chậm, xám = không render (skipped).

**Thực tế debug performance:**
1. Bật Profiler, click Record.
2. Thực hiện thao tác gây lag (scroll danh sách, gõ input).
3. Stop Recording.
4. Xem Flamegraph → tìm component render lâu nhất.
5. Click vào component đó → xem "Why did this render?" → fix bằng `React.memo`, `useMemo`, `useCallback`.

### 1.2. Error Boundary

**Nguyên lý:** Nếu 1 component con throw lỗi runtime (VD: `undefined.map()`), toàn bộ React app sẽ crash — hiện màn hình trắng. Error Boundary **bắt lỗi** từ component con và hiển thị fallback UI thay vì crash cả app.

```tsx
// ErrorBoundary.tsx — phải dùng Class component (hook chưa hỗ trợ)
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Gửi lỗi lên Sentry / monitoring service
    console.error('ErrorBoundary caught:', error, errorInfo);
    // Sentry.captureException(error, { extra: errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="error-fallback">
          <h2>Đã xảy ra lỗi</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Thử lại
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Sử dụng — bọc quanh các phần độc lập của app
function App() {
  return (
    <ErrorBoundary fallback={<p>Lỗi sidebar</p>}>
      <Sidebar />
    </ErrorBoundary>

    <ErrorBoundary fallback={<p>Lỗi nội dung</p>}>
      <MainContent />
    </ErrorBoundary>
  );
}
```

**Key takeaway:** Đặt nhiều Error Boundary ở nhiều cấp → lỗi 1 phần không crash toàn app. VD: sidebar lỗi → chỉ sidebar hiện fallback, main content vẫn hoạt động bình thường.

### 1.3. Sentry — Error Monitoring Production

**Tại sao cần?** Trong production, user KHÔNG báo lỗi cho bạn. Họ chỉ tắt app rồi đi. Sentry tự động:
- Bắt tất cả unhandled errors + rejected promises.
- Ghi lại stack trace, browser, OS, URL, actions trước khi lỗi xảy ra.
- Gửi thông báo (email, Slack) khi có lỗi mới.

```javascript
// Tích hợp Sentry cơ bản
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: 'https://xxx@sentry.io/123',
  environment: 'production',
  tracesSampleRate: 0.1, // Chỉ trace 10% request (tiết kiệm quota)
});

// Error Boundary tích hợp Sentry
const SentryErrorBoundary = Sentry.withErrorBoundary(App, {
  fallback: <ErrorFallback />,
});
```

**Source Maps:** Upload source maps lên Sentry để stack trace hiển thị **code gốc** (trước khi minify), giúp debug nhanh hơn.

### Câu hỏi phỏng vấn

**Q: Bạn debug một component render chậm thế nào?**

**A:** (1) Dùng React DevTools Profiler → ghi lại, xem Flamegraph, tìm component render lâu nhất. (2) Kiểm tra "Why did this render?" → props mới? state mới? parent re-render? (3) Nếu parent re-render → bọc `React.memo`. (4) Nếu props object/function tạo mới mỗi lần → `useMemo`/`useCallback`. (5) Nếu tính toán nặng (filter 10k items) → `useMemo`. (6) Nếu danh sách quá dài → virtualization (`react-window`).

**Q: Error Boundary bắt được những lỗi nào? Không bắt được lỗi nào?**

**A:** Bắt được: lỗi trong render, lifecycle methods, constructor của component con. KHÔNG bắt được: lỗi trong event handlers (phải dùng try/catch), async code (setTimeout, Promise), server-side rendering, lỗi trong Error Boundary chính nó.

---

## 2. Webpack & Vite — Hiểu bản chất

### Webpack

**Nguyên lý:** Webpack là module bundler — nó nhận tất cả file (JS, CSS, images, fonts) → phân tích dependency graph → đóng gói thành các bundle (chunk) tối ưu cho browser.

**Các khái niệm chính:**
- **Entry:** File bắt đầu (thường là `src/index.tsx`).
- **Output:** File bundle đầu ra (`dist/main.js`).
- **Loaders:** Biến đổi file không phải JS (CSS, TS, images) thành module JS. VD: `babel-loader` biên dịch JSX → JS.
- **Plugins:** Thực hiện tác vụ build (minify, tree-shaking, HTML generation).

### Vite

**Tại sao Vite nhanh hơn Webpack?**
1. **Dev mode:** Vite KHÔNG bundle lúc dev. Nó dùng **native ES modules** — trình duyệt tự import từng file. Chỉ biên dịch file khi trình duyệt request.
2. **HMR (Hot Module Replacement):** Vite chỉ cập nhật module thay đổi, không rebuild cả bundle → thay đổi code phản ánh gần như tức thì.
3. **Build:** Vite dùng **Rollup** (optimized cho production) thay vì Webpack.

### Câu hỏi phỏng vấn

**Q: Tree-shaking là gì?**

**A:** Tree-shaking là quá trình bundler (Webpack/Rollup) phân tích static import/export → loại bỏ code không được sử dụng (dead code) khỏi bundle cuối cùng. Nó chỉ hoạt động với ES Modules (`import/export`), KHÔNG hoạt động với `require()` (CommonJS) vì `require` là dynamic (chạy lúc runtime, bundler không phân tích được lúc build).

---

## 3. Docker — Khái niệm cơ bản cho FE

**Docker đóng gói ứng dụng** cùng tất cả dependencies vào một "container" — chạy giống nhau trên mọi máy (dev, staging, production).

```dockerfile
# Dockerfile cho React app
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve bằng nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
```

**Tại sao FE developer cần biết Docker?** Trong CI/CD pipeline, app thường được build và deploy bằng Docker. Hiểu Docker giúp: debug lỗi build, tối ưu image size, hiểu deploy flow.

---

## 4. Kiến thức chuyên ngành (Fintech/Banking)

### 4.1. Các luồng nghiệp vụ cốt lõi

**Đăng ký & Xác thực (Onboarding):**
- KYC (Know Your Customer): Upload CCCD, selfie verification.
- eKYC: Xác minh danh tính điện tử (FaceID, video call).
- OTP (One-Time Password): SMS hoặc email.
- 2FA (Two-Factor Authentication): Bảo mật 2 lớp.

**Chuyển tiền:**
- **Internal Transfer:** Chuyển giữa 2 tài khoản cùng ngân hàng.
- **Interbank Transfer:** Qua hệ thống Napas/CITAD.
- **Flow:** Nhập thông tin → Xác nhận → OTP → Xử lý → Thông báo kết quả.
- **Idempotency:** Mỗi giao dịch có mã duy nhất để tránh chuyển khoản trùng khi user double-click.

**Thanh toán QR:**
- QR Code chứa thông tin: số tài khoản, ngân hàng, số tiền, nội dung.
- VietQR: Tiêu chuẩn QR thống nhất cho mọi ngân hàng VN.
- Flow: Scan QR → Parse data → Hiển thị thông tin → Xác nhận → OTP → Hoàn thành.

### 4.2. Thuật ngữ FE developer cần biết

| Thuật ngữ | Ý nghĩa |
|---|---|
| **Transaction** | Giao dịch (chuyển tiền, thanh toán) |
| **Balance** | Số dư tài khoản |
| **Statement** | Sao kê giao dịch |
| **Beneficiary** | Người thụ hưởng |
| **Merchant** | Đơn vị chấp nhận thanh toán |
| **Settlement** | Quyết toán (đối soát giao dịch) |
| **Ledger** | Sổ cái (ghi nhận mọi giao dịch) |
| **Compliance** | Tuân thủ quy định pháp luật |

### Câu hỏi phỏng vấn

**Q: Trong hệ thống banking, FE xử lý bảo mật thế nào?**

**A:** (1) **Token-based auth** — JWT access token (ngắn hạn) + refresh token (httpOnly cookie, không lưu localStorage). (2) **Session timeout** — tự động logout sau 5-15 phút không hoạt động. (3) **Sensitive data masking** — che số tài khoản (chỉ hiện 4 số cuối), số tiền. (4) **OTP flow** — mỗi giao dịch quan trọng cần OTP. (5) **Request signing** — hash request body để chống giả mạo. (6) **CSP headers** — ngăn XSS. (7) **Không log sensitive data** — không console.log token, password.

---

## 4B. Kiến thức chuyên ngành (E-commerce)

### 4B.1. Các luồng nghiệp vụ cốt lõi E-commerce

**Luồng mua hàng (Purchase Flow):**

```
Trang chủ / Danh mục
  → Tìm kiếm / Lọc sản phẩm (search, filter, sort)
    → Trang chi tiết sản phẩm (PDP - Product Detail Page)
      → Thêm vào giỏ hàng (Add to Cart)
        → Giỏ hàng (Cart) — cập nhật số lượng, xóa, mã giảm giá
          → Checkout — chọn địa chỉ, phương thức vận chuyển, thanh toán
            → Xác nhận đơn hàng (Order Confirmation)
              → Theo dõi đơn hàng (Order Tracking)
```

**Giỏ hàng (Cart) — Thách thức FE:**

- **Persistent cart:** Giỏ hàng phải tồn tại qua page refresh. Guest user → lưu `localStorage`. Logged-in user → sync với server (API) + localStorage làm fallback.
- **Real-time inventory check:** Khi user thêm vào giỏ, kiểm tra tồn kho ngay. Nếu hết hàng giữa chừng → hiển thị thông báo + disable nút mua.
- **Optimistic UI:** Khi thêm vào giỏ → cập nhật UI NGAY (tăng badge count) → gọi API ở background. Nếu API lỗi → rollback + thông báo.

```jsx
// Cart state management (Zustand example)
const useCartStore = create((set, get) => ({
  items: [],
  
  addItem: async (product, quantity) => {
    // Optimistic update — cập nhật UI ngay
    set(state => ({
      items: [...state.items, { ...product, quantity }]
    }));
    
    try {
      await api.post('/cart/items', { productId: product.id, quantity });
    } catch (error) {
      // Rollback nếu API lỗi
      set(state => ({
        items: state.items.filter(i => i.id !== product.id)
      }));
      toast.error('Không thể thêm vào giỏ hàng');
    }
  },

  // Tính tổng tiền — derived state
  get totalPrice() {
    return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  },
}));
```

**Checkout — Luồng thanh toán:**

1. **Nhập thông tin giao hàng** — form address (tỉnh/thành → quận/huyện → phường/xã cascade select).
2. **Chọn phương thức vận chuyển** — tính phí vận chuyển dựa trên địa chỉ + trọng lượng.
3. **Chọn phương thức thanh toán:**
   - **COD** (Cash on Delivery): Thanh toán khi nhận hàng.
   - **Bank Transfer**: Chuyển khoản ngân hàng.
   - **E-wallet**: MoMo, ZaloPay, VNPay.
   - **Credit/Debit Card**: Visa, MasterCard (qua payment gateway).
4. **Áp dụng mã giảm giá (Coupon/Voucher):**
   - Validate coupon code qua API.
   - Hiển thị discount amount, tính lại tổng tiền.
   - Handle edge cases: coupon hết hạn, không áp dụng cho sản phẩm này, đã dùng hết lượt.
5. **Đặt hàng** → Server tạo order → Redirect sang payment gateway (nếu online payment).

**Payment Gateway — FE cần hiểu:**

```
User click "Thanh toán"
  → FE gọi API backend: POST /orders (tạo đơn hàng)
  → Backend gọi Payment Gateway (VNPay, Stripe): tạo payment session
  → Backend trả về payment URL cho FE
  → FE redirect user đến payment URL (trang của VNPay/Stripe)
  → User thanh toán trên trang gateway
  → Gateway redirect user về FE (return URL) kèm transaction status
  → FE gọi API backend để verify payment status
  → Hiển thị kết quả (thành công / thất bại)
```

**Lưu ý:** FE KHÔNG BAO GIỜ xử lý trực tiếp thông tin thẻ tín dụng. Luôn redirect sang payment gateway hoặc dùng iframe của gateway (PCI DSS compliance).

### 4B.2. Order Lifecycle (Vòng đời đơn hàng)

```
[Pending] → [Confirmed] → [Processing] → [Shipping] → [Delivered]
    ↓            ↓                                          ↓
[Cancelled]  [Cancelled]                              [Return/Refund]
```

| Trạng thái | Ý nghĩa | FE hiển thị |
|---|---|---|
| **Pending** | Đơn mới tạo, chờ xác nhận | Badge "Chờ xác nhận", cho phép hủy |
| **Confirmed** | Seller xác nhận, chuẩn bị hàng | Badge "Đã xác nhận", cho phép hủy |
| **Processing** | Đang đóng gói | Badge "Đang xử lý", ẩn nút hủy |
| **Shipping** | Đã giao cho đơn vị vận chuyển | Badge "Đang giao", hiển thị tracking |
| **Delivered** | Giao thành công | Badge "Hoàn thành", hiện nút "Đánh giá" |
| **Cancelled** | Đã hủy | Badge đỏ, hiện lý do hủy |
| **Return/Refund** | Trả hàng/hoàn tiền | Flow riêng: chụp ảnh → gửi yêu cầu → duyệt |

### 4B.3. Tìm kiếm & Lọc sản phẩm

**FE cần xử lý:**
- **Search:** Debounce input (300ms), highlight kết quả, search suggestion (autocomplete).
- **Filter:** Theo danh mục, giá (range slider), brand, rating, color, size.
- **Sort:** Theo giá (cao/thấp), mới nhất, bán chạy, đánh giá.
- **URL sync:** Đồng bộ filter/sort với URL query params (`?category=phone&sort=price_asc&page=2`) để user copy/share link được, back/forward vẫn giữ trạng thái filter.

```jsx
// Sync filter state với URL
function useFilterParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo(() => ({
    category: searchParams.get('category') || '',
    sort: searchParams.get('sort') || 'newest',
    minPrice: Number(searchParams.get('minPrice')) || 0,
    maxPrice: Number(searchParams.get('maxPrice')) || Infinity,
    page: Number(searchParams.get('page')) || 1,
  }), [searchParams]);

  const setFilter = useCallback((key, value) => {
    setSearchParams(prev => {
      prev.set(key, String(value));
      if (key !== 'page') prev.set('page', '1'); // Reset page khi đổi filter
      return prev;
    });
  }, [setSearchParams]);

  return { filters, setFilter };
}
```

### 4B.4. Thuật ngữ E-commerce FE developer cần biết

| Thuật ngữ | Ý nghĩa |
|---|---|
| **SKU** (Stock Keeping Unit) | Mã định danh sản phẩm (VD: áo size M màu đỏ = 1 SKU riêng) |
| **PDP** (Product Detail Page) | Trang chi tiết sản phẩm |
| **PLP** (Product Listing Page) | Trang danh sách sản phẩm |
| **Cart Abandonment** | User thêm giỏ hàng nhưng không checkout (tỷ lệ trung bình ~70%) |
| **Conversion Rate** | Tỷ lệ user hoàn thành mua hàng / tổng user truy cập |
| **AOV** (Average Order Value) | Giá trị đơn hàng trung bình |
| **Inventory** | Tồn kho — số lượng sản phẩm còn trong kho |
| **Fulfillment** | Quy trình xử lý đơn hàng (đóng gói → giao vận) |
| **Coupon / Voucher** | Mã giảm giá |
| **Flash Sale** | Bán giá sốc trong thời gian ngắn (countdown timer) |
| **Wishlist** | Danh sách yêu thích (lưu sản phẩm chưa muốn mua ngay) |

### 4B.5. Các tính năng FE đặc thù E-commerce

**Image Gallery & Zoom:**
- Carousel nhiều ảnh sản phẩm.
- Zoom on hover (hiển thị ảnh phóng to khi di chuột).
- Lazy load ảnh chất lượng cao.

**Variant Selector:**
- Chọn size, màu sắc → thay đổi ảnh, giá, tồn kho tương ứng.
- Disable variant hết hàng (VD: size XL hết → nút XL bị mờ).

**Countdown Timer (Flash Sale):**
- Đếm ngược thời gian sale.
- Dùng `setInterval` + cleanup trong `useEffect`.
- Hiển thị "Đã hết" khi hết thời gian.

**Infinite Scroll / Load More:**
- Trang danh sách sản phẩm: load thêm khi scroll đến cuối.
- React Query `useInfiniteQuery` + Intersection Observer.

### Câu hỏi phỏng vấn

**Q: Bạn xử lý giỏ hàng cho user chưa đăng nhập (guest) thế nào?**

**A:** Lưu giỏ hàng trong `localStorage` cho guest user. Khi user đăng nhập, **merge** giỏ hàng local với giỏ hàng trên server: (1) Gọi API lấy server cart. (2) So sánh items. (3) Nếu trùng sản phẩm → giữ số lượng lớn hơn hoặc cộng dồn (tùy business rule). (4) Sync kết quả lên server. (5) Xóa localStorage cart. Edge case: sản phẩm trong localStorage đã hết hàng → thông báo user, xóa khỏi giỏ.

**Q: Checkout flow có những edge cases nào cần xử lý?**

**A:** (1) **Hết hàng giữa chừng** — user thêm giỏ xong, đến lúc checkout thì hết → check inventory ở bước cuối, thông báo + suggest sản phẩm thay thế. (2) **Double submit** — user click "Đặt hàng" 2 lần → disable button sau click đầu, dùng idempotency key. (3) **Payment timeout** — redirect sang gateway nhưng user không thanh toán → order status = pending, auto cancel sau 30 phút. (4) **Coupon race condition** — coupon giới hạn 100 lượt, 2 user cùng apply → validate ở server, FE hiển thị "Mã đã hết lượt" nếu thất bại. (5) **Session expired** — checkout form dài, user điền xong thì session hết → lưu draft vào sessionStorage.

**Q: FE tối ưu performance cho trang sản phẩm (PLP) có hàng nghìn items thế nào?**

**A:** (1) **Pagination hoặc Infinite scroll** — không load hết data 1 lần. (2) **Image lazy loading** — `loading="lazy"` hoặc Intersection Observer, chỉ load ảnh khi scroll đến. (3) **Image optimization** — dùng CDN (Cloudinary, imgix) để serve ảnh đúng kích thước device (responsive images với `srcset`). (4) **Skeleton loading** — hiển thị placeholder khi đang fetch. (5) **URL-based filter** — server-side filtering, FE chỉ render kết quả. (6) **React Query caching** — cache kết quả search/filter, quay lại trang trước không cần fetch lại.

---

## 5. Kỹ năng mềm & Quy trình làm việc

### 5.1. Code Review — Best Practices

**Khi review code người khác:**
1. **Kiểm tra logic trước, style sau.** Đúng/sai quan trọng hơn đẹp/xấu.
2. **Đặt câu hỏi thay vì ra lệnh.** "Có lý do gì cụ thể khiến em chọn cách này không?" thay vì "Làm lại đi".
3. **Khen trước, góp ý sau.** "Logic xử lý tốt, em có thể cải thiện thêm bằng..."
4. **Quan tâm:** Performance (N+1 queries, unnecessary re-renders), Security (XSS, token exposure), Edge cases (null, empty, error states).

**Khi nhận review:**
1. Không defensive — feedback là để code tốt hơn, không phải phê phán con người.
2. Nếu không đồng ý → giải thích lý do kỹ thuật, không phải cảm xúc.

### 5.2. Scrum / Agile

**Sprint:** Chu kỳ phát triển 1-2 tuần.
**Daily Standup:** Mỗi ngày 15 phút — hôm qua làm gì, hôm nay làm gì, có blocker không.
**Sprint Planning:** Đầu sprint — chọn task từ backlog, estimate effort (story points).
**Sprint Review/Demo:** Cuối sprint — demo feature cho stakeholders.
**Retrospective:** Cuối sprint — điều gì tốt, điều gì cần cải thiện.

**Story Points:** Đo độ phức tạp (complexity), KHÔNG phải thời gian. Dùng Fibonacci (1, 2, 3, 5, 8, 13). Task 1 point = đơn giản, rõ ràng. Task 13 points = phức tạp, nên chia nhỏ.

### 5.3. Viết tài liệu kỹ thuật

**Một tài liệu kỹ thuật tốt cần:**
1. **Bối cảnh** — Tại sao cần làm feature này?
2. **Thiết kế** — Component tree, data flow, API contract.
3. **Quyết định kỹ thuật** — Tại sao chọn Zustand thay vì Redux? (Trade-offs).
4. **Edge cases** — Xử lý lỗi, empty state, timeout.
5. **Hướng dẫn chạy** — Cách setup, test, deploy.

### Câu hỏi phỏng vấn

**Q: Bạn ước lượng (estimate) thời gian hoàn thành task như thế nào?**

**A:** Em chia task thành các sub-tasks nhỏ, estimate từng sub-task rồi cộng lại + buffer 20-30% cho edge cases và bug. Ví dụ task "Trang quản lý user": (1) Thiết kế component tree + API contract: 2h. (2) Xây dựng Table + Pagination: 4h. (3) Form tạo/sửa user: 4h. (4) Tích hợp API + error handling: 3h. (5) Unit test + integration test: 3h. (6) Buffer: ~4h. Tổng: ~20h (2.5 ngày).

**Q: Bạn xử lý khi phát hiện task quá phức tạp giữa sprint thế nào?**

**A:** (1) Báo ngay cho Scrum Master/TL trong daily standup — không đợi đến cuối sprint. (2) Phân tích rõ phần nào phức tạp hơn dự kiến. (3) Đề xuất: cắt scope (deliver MVP trước, polish sau) hoặc xin thêm support từ team member khác. Điều quan trọng là **transparent** — báo sớm để team có thể điều chỉnh sprint backlog.
