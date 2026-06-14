# PHẦN 2A: HIỆU SUẤT, TỐI ƯU HÓA & GIAO TIẾP API — DEEP DIVE

---

## 1. Lazy Loading & Code Splitting

### Nguyên lý hoạt động

**Vấn đề:** Mặc định, bundler (Webpack/Vite) đóng gói TOÀN BỘ app thành 1 file JS lớn. User phải tải hết file này trước khi thấy bất cứ gì → **Time to Interactive (TTI)** rất chậm.

**Code Splitting** chia bundle thành nhiều chunk nhỏ. `React.lazy()` + `Suspense` cho phép tải chunk **chỉ khi component cần render**.

```jsx
// ❌ KHÔNG lazy — tất cả import ngay lúc đầu → bundle lớn
import UserManagement from './pages/UserManagement';
import Analytics from './pages/Analytics';
import Reports from './pages/Reports';

// ✅ CÓ lazy — chỉ tải khi user navigate đến route tương ứng
const UserManagement = React.lazy(() => import('./pages/UserManagement'));
const Analytics = React.lazy(() => import('./pages/Analytics'));
const Reports = React.lazy(() => import('./pages/Reports'));

function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route path="/users" element={<UserManagement />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/reports" element={<Reports />} />
      </Routes>
    </Suspense>
  );
}
```

**Suspense hoạt động thế nào?** Khi `React.lazy` bắt đầu tải chunk, nó "ném" một Promise. `Suspense` bắt Promise đó và hiển thị `fallback` UI. Khi chunk tải xong, Suspense render component thật.

### Câu hỏi phỏng vấn

**Q: `React.lazy()` hoạt động thế nào? Khi nào nên dùng?**

**A:** `React.lazy()` nhận một function trả về `import()` (dynamic import). Khi component cần render lần đầu, React gọi function đó → trình duyệt tải file JS chunk tương ứng → render component. Nên dùng khi: (1) Route-based splitting — mỗi page là 1 chunk riêng. (2) Component nặng ít dùng (editor, chart library). (3) Feature behind modal/tab — chỉ tải khi user mở.

**Q: Suspense boundary nên đặt ở đâu?**

**A:** Đặt ở mức route (bọc `<Routes>`) là phổ biến nhất — khi navigate, hiện loading toàn trang. Nhưng có thể đặt chi tiết hơn: bọc riêng từng section → phần nào tải xong hiển thị trước, phần nào chưa xong hiện skeleton riêng. Nguyên tắc: **đặt Suspense gần component lazy nhất có thể** để tránh flash loading toàn trang khi chỉ 1 phần nhỏ đang tải.

---

## 2. Preloading (Tải trước)

### Nguyên lý hoạt động

Lazy loading giải quyết vấn đề tải ban đầu, nhưng tạo **delay khi navigate** (user click → chờ tải chunk → mới thấy trang). Preloading giải quyết bằng cách **tải trước chunk khi dự đoán user sẽ cần**.

**3 chiến lược preload:**

1. **Preload on hover/focus:** Khi user hover vào link, bắt đầu tải chunk. Thời gian hover trung bình ~200-300ms, đủ để tải chunk nhỏ.
```jsx
const UserPage = React.lazy(() => import('./pages/UserPage'));

// Preload function
const preloadUserPage = () => import('./pages/UserPage');

function Nav() {
  return (
    <Link
      to="/users"
      onMouseEnter={preloadUserPage}  // Hover → bắt đầu tải
      onFocus={preloadUserPage}        // Keyboard focus → tải
    >
      Quản lý User
    </Link>
  );
}
```

2. **Preload after idle:** Sau khi trang chính tải xong, tận dụng thời gian rảnh để tải các chunk khác.
```jsx
useEffect(() => {
  // requestIdleCallback chạy khi browser rảnh
  requestIdleCallback(() => {
    import('./pages/Analytics');
    import('./pages/Reports');
  });
}, []);
```

3. **Prefetch hint:** Dùng `<link rel="prefetch">` để trình duyệt tự tải ở background với priority thấp.

### Câu hỏi phỏng vấn

**Q: Phân biệt Preload, Prefetch, Preconnect?**

**A:**
- **Preload** (`<link rel="preload">`): Tải resource **ngay lập tức**, priority cao. Dùng cho resource cần thiết cho trang hiện tại (font, critical CSS, hero image).
- **Prefetch** (`<link rel="prefetch">`): Tải resource **khi rảnh**, priority thấp. Dùng cho resource cần cho trang **tiếp theo** (next page chunk).
- **Preconnect** (`<link rel="preconnect">`): Thiết lập kết nối sớm (DNS + TCP + TLS) đến domain bên thứ 3. Dùng khi biết sẽ gọi API/CDN từ domain khác.

---

## 3. Caching (Bộ nhớ đệm)

### 3.1. Client-side Caching

**localStorage vs sessionStorage vs IndexedDB:**

| Đặc điểm | localStorage | sessionStorage | IndexedDB |
|---|---|---|---|
| **Dung lượng** | ~5-10MB | ~5-10MB | Hàng trăm MB+ |
| **Tồn tại** | Vĩnh viễn (đến khi xóa) | Hết khi đóng tab | Vĩnh viễn |
| **API** | Đồng bộ, key-value string | Đồng bộ, key-value string | Bất đồng bộ, structured data |
| **Use case** | Token, user preferences | Form draft, wizard step | Offline data, file cache |

```javascript
// localStorage — lưu user preferences
localStorage.setItem('theme', 'dark');
localStorage.setItem('language', 'vi');
const theme = localStorage.getItem('theme'); // 'dark'

// sessionStorage — lưu form draft (mất khi đóng tab)
sessionStorage.setItem('draftForm', JSON.stringify(formData));

// ⚠️ CHÚ Ý: KHÔNG lưu access token trong localStorage
// Lý do: XSS attack có thể đọc localStorage
// Giải pháp: Lưu token trong httpOnly cookie (JS không đọc được)
```

### 3.2. HTTP Caching

**Trình duyệt tự cache response dựa trên HTTP headers từ server:**

- **`Cache-Control: max-age=3600`** — Cache response 1 giờ. Trong 1 giờ đó, trình duyệt dùng cache, KHÔNG gửi request đến server.
- **`Cache-Control: no-cache`** — Luôn gửi request đến server để validate (KHÔNG có nghĩa "không cache").
- **`Cache-Control: no-store`** — KHÔNG cache gì cả (dùng cho sensitive data: banking, health).

**ETag & Last-Modified (Conditional Request):**
```
1. Browser → GET /api/products
2. Server → 200 OK, ETag: "abc123", data...
3. Browser cache data + ETag
4. Browser → GET /api/products, If-None-Match: "abc123"
5. Server kiểm tra: data chưa đổi → 304 Not Modified (KHÔNG gửi lại data)
6. Browser dùng data từ cache
```

**Lợi ích:** Tiết kiệm bandwidth — server chỉ gửi `304` (vài bytes) thay vì toàn bộ response.

### 3.3. React Query (TanStack Query) — Stale-While-Revalidate

**Cơ chế:**
1. Lần đầu fetch → cache data + hiển thị.
2. User quay lại trang → hiển thị data cũ từ cache NGAY (stale) → **không loading spinner**.
3. Đồng thời re-fetch data mới ở background.
4. Data mới về → cập nhật UI mượt mà.

```jsx
const { data, isLoading, error, refetch } = useQuery({
  queryKey: ['products', { page, sort }],  // Cache key
  queryFn: () => fetchProducts({ page, sort }),
  staleTime: 5 * 60 * 1000,    // 5 phút — data "tươi", không re-fetch
  gcTime: 30 * 60 * 1000,      // 30 phút — giữ cache trong memory
  refetchOnWindowFocus: true,   // Re-fetch khi user quay lại tab
  retry: 3,                     // Retry 3 lần khi lỗi
});
```

**`staleTime` vs `gcTime`:**
- `staleTime` (mặc định 0): Thời gian data được coi là "tươi". Trong thời gian này, React Query trả về cache mà KHÔNG re-fetch.
- `gcTime` (mặc định 5 phút): Thời gian giữ data trong memory SAU KHI không còn component nào subscribe. Hết thời gian → garbage collect.

### Câu hỏi phỏng vấn

**Q: So sánh caching ở các tầng khác nhau. Khi nào dùng tầng nào?**

**A:** (1) **HTTP Cache** (browser): Tầng thấp nhất, tự động, zero code. Phù hợp cho static assets (JS, CSS, images) với `max-age` dài + hashed filename. (2) **React Query cache** (memory): Tầng application. Cache API response, auto re-fetch, optimistic update. Dùng cho mọi API call. (3) **localStorage/sessionStorage**: Tầng persistence. Lưu user preferences, draft form, offline data. Dùng khi cần data tồn tại qua page reload.

**Q: Tại sao KHÔNG nên lưu JWT token trong localStorage?**

**A:** localStorage accessible bởi BẤT KỲ JavaScript nào chạy trên trang — nếu trang bị XSS (attacker inject script), script đó đọc được token ngay. Giải pháp an toàn: lưu refresh token trong **httpOnly cookie** (JS không đọc được, chỉ browser tự gửi kèm request), access token giữ trong **memory** (biến JS — mất khi refresh trang, nhưng có thể lấy lại từ refresh token).

---

## 4. Virtualization

### Nguyên lý hoạt động

**Vấn đề:** Render 10,000 hàng trong table → trình duyệt tạo 10,000 DOM node → cực kỳ chậm (DOM node rất tốn bộ nhớ và CPU để layout/paint).

**Giải pháp:** Chỉ render **những hàng đang nhìn thấy** trên viewport (VD: 20 hàng) + vài hàng buffer trên/dưới. Khi scroll, **tái sử dụng** DOM node cũ với data mới.

```jsx
import { FixedSizeList } from 'react-window';

function VirtualizedList({ items }) {
  const Row = ({ index, style }) => (
    <div style={style} className="row">
      <span>{items[index].name}</span>
      <span>{items[index].email}</span>
    </div>
  );

  return (
    <FixedSizeList
      height={600}            // Viewport height
      itemCount={items.length} // Tổng số items (10,000)
      itemSize={50}            // Chiều cao mỗi hàng
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
}
// Dù có 10,000 items, chỉ ~15-20 DOM nodes được tạo!
```

**`FixedSizeList` vs `VariableSizeList`:**
- `FixedSizeList`: Mọi hàng cùng chiều cao → tính toán nhanh, performance tốt nhất.
- `VariableSizeList`: Mỗi hàng chiều cao khác nhau → cần function `getItemSize(index)`. Phức tạp hơn.

### Câu hỏi phỏng vấn

**Q: Khi nào cần Virtualization? Có giải pháp nào khác không?**

**A:** Cần khi render >500 items trong list/table và thấy lag. Các giải pháp khác: (1) **Pagination** — chia data thành trang, mỗi trang 20-50 items. Đơn giản nhất. (2) **Infinite scroll** — load thêm khi scroll đến cuối (React Query `useInfiniteQuery`). (3) **Virtualization** — khi cần hiển thị toàn bộ data liền mạch mà không phân trang. Em chọn dựa trên UX: pagination cho admin table, infinite scroll cho feed/timeline, virtualization cho danh sách cố định rất lớn.

---

## 5. Tối ưu Re-render

### Nguyên lý

**3 nguyên nhân component re-render:**
1. **State thay đổi** (setState).
2. **Props thay đổi**.
3. **Parent re-render** — nguyên nhân phổ biến nhất, hay bị bỏ qua.

**Công cụ tối ưu:**

| Công cụ | Chức năng | Dùng khi |
|---|---|---|
| `React.memo` | Bọc component, skip re-render nếu props không đổi | Child component nhận props ổn định |
| `useMemo` | Cache kết quả tính toán | Filter/sort danh sách lớn, derived data |
| `useCallback` | Cache reference function | Function truyền cho memo-ized child |

```jsx
// Pattern hoàn chỉnh: Parent + Child optimized
function Parent() {
  const [count, setCount] = useState(0);
  const [items, setItems] = useState(largeList);
  const [search, setSearch] = useState('');

  // useMemo: chỉ filter lại khi items hoặc search đổi
  const filtered = useMemo(
    () => items.filter(i => i.name.includes(search)),
    [items, search]
  );

  // useCallback: giữ reference ổn định cho function
  const handleSelect = useCallback((id) => {
    console.log('Selected:', id);
  }, []);

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
      {/* Khi count thay đổi, Parent re-render nhưng ItemList KHÔNG
          vì filtered và handleSelect reference không đổi */}
      <ItemList items={filtered} onSelect={handleSelect} />
    </div>
  );
}

// React.memo: chỉ re-render khi props thay đổi (shallow compare)
const ItemList = React.memo(({ items, onSelect }) => {
  console.log('ItemList render'); // Chỉ log khi items hoặc onSelect đổi
  return items.map(i => (
    <div key={i.id} onClick={() => onSelect(i.id)}>{i.name}</div>
  ));
});
```

### Câu hỏi phỏng vấn

**Q: Bạn phát hiện và xử lý re-render không cần thiết thế nào?**

**A:** (1) Bật React DevTools → "Highlight updates when components render" → thấy component nào flash liên tục. (2) Profiler tab → Record → xem Flamegraph. (3) Xác định nguyên nhân: parent re-render → dùng `React.memo`. Props object/function tạo mới → dùng `useMemo`/`useCallback`. State đặt sai chỗ (state nên ở gần component cần nhất) → lift state down. (4) Đo lường trước/sau để chứng minh cải thiện thực sự.

---

## 6. RESTful API — Hiểu sâu

### Nguyên lý

**HTTP Methods & Idempotency:**
- `GET` — Lấy data. **Idempotent** (gọi bao nhiêu lần cũng không thay đổi server).
- `POST` — Tạo mới. **NOT idempotent** (gọi 2 lần → tạo 2 bản ghi).
- `PUT` — Cập nhật **toàn bộ** resource. Idempotent.
- `PATCH` — Cập nhật **một phần** resource. Idempotent.
- `DELETE` — Xóa resource. Idempotent.

**Status Codes quan trọng:**
- `200` OK, `201` Created, `204` No Content.
- `400` Bad Request, `401` Unauthorized (chưa login), `403` Forbidden (không có quyền).
- `404` Not Found, `422` Unprocessable Entity (validation lỗi).
- `429` Too Many Requests (rate limit).
- `500` Internal Server Error.

**Axios Interceptor Pattern:**
```javascript
// Request interceptor — tự gắn token
axios.interceptors.request.use((config) => {
  const token = getAccessToken(); // Từ memory, KHÔNG từ localStorage
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor — tự refresh token khi 401
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Tránh loop vô hạn
      const newToken = await refreshAccessToken();
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return axios(originalRequest); // Retry request gốc
    }
    return Promise.reject(error);
  }
);
```

### Câu hỏi phỏng vấn

**Q: Idempotent nghĩa là gì? Tại sao quan trọng?**

**A:** Idempotent = gọi 1 lần hay 100 lần, kết quả trên server giống nhau. Quan trọng vì: network không đáng tin cậy — request có thể bị retry (timeout, connection drop). Nếu `POST /transfer` (chuyển tiền) bị gọi 2 lần → chuyển 2 lần tiền. Giải pháp: dùng **idempotency key** — client gửi kèm UUID, server kiểm tra đã xử lý chưa trước khi thực hiện.

---

## 7. GraphQL

### Nguyên lý hoạt động

**Vấn đề REST:** Over-fetching (API trả về 20 fields, FE chỉ cần 3) và Under-fetching (cần data từ 3 endpoint, phải gọi 3 lần).

**GraphQL giải quyết:** Client chỉ định CHÍNH XÁC data cần lấy trong 1 request.

```graphql
# REST: GET /api/users/1 → trả về TẤT CẢ fields
# GraphQL: chỉ lấy name và email
query {
  user(id: 1) {
    name
    email
    orders(last: 5) {    # Lấy luôn 5 đơn hàng gần nhất
      id                  # Không cần gọi thêm endpoint /users/1/orders
      total
    }
  }
}
```

**3 loại operation:**
- **Query** — Đọc data (tương đương GET).
- **Mutation** — Thay đổi data (tương đương POST/PUT/DELETE).
- **Subscription** — Real-time updates qua WebSocket.

**Apollo Client — Tích hợp với React:**
```jsx
import { useQuery, useMutation, gql } from '@apollo/client';

const GET_USERS = gql`
  query GetUsers($page: Int!) {
    users(page: $page) {
      id
      name
      email
    }
  }
`;

function UserList() {
  const { data, loading, error } = useQuery(GET_USERS, {
    variables: { page: 1 },
  });

  if (loading) return <Spinner />;
  return data.users.map(u => <UserCard key={u.id} user={u} />);
}
```

### Câu hỏi phỏng vấn

**Q: So sánh REST và GraphQL. Khi nào dùng cái nào?**

**A:**
- **REST:** Đơn giản, HTTP caching tốt (GET cacheable), tooling phong phú. Phù hợp: CRUD đơn giản, public API, team nhỏ.
- **GraphQL:** Linh hoạt, 1 endpoint, client chọn fields. Phù hợp: nhiều loại client (web, mobile cần data khác nhau), data phức tạp lồng nhau, giảm số request.
- **Nhược điểm GraphQL:** Khó cache ở HTTP level (mọi request đều POST), phức tạp hơn khi setup, N+1 query ở server nếu không dùng DataLoader.

---

## 8. WebSocket — Real-time

### Nguyên lý hoạt động

**HTTP** = request-response (client hỏi → server trả lời). **WebSocket** = **kết nối song công (full-duplex)** — cả hai bên gửi data bất cứ lúc nào.

**Handshake:** Ban đầu, client gửi HTTP request với header `Upgrade: websocket`. Server chấp nhận → kết nối "nâng cấp" thành WebSocket. Từ đó, cả hai giao tiếp qua 1 kết nối TCP liên tục.

```javascript
// Custom Hook: useWebSocket
function useWebSocket(url) {
  const [messages, setMessages] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = new WebSocket(url);
    socketRef.current = socket;

    socket.onopen = () => console.log('Connected');
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages(prev => [...prev, data]);
    };
    socket.onclose = () => {
      // Auto reconnect sau 3 giây
      setTimeout(() => { /* reconnect logic */ }, 3000);
    };

    return () => socket.close(); // Cleanup
  }, [url]);

  const send = useCallback((data) => {
    socketRef.current?.send(JSON.stringify(data));
  }, []);

  return { messages, send };
}
```

**Socket.IO vs native WebSocket:**
- **Native WebSocket:** Nhẹ, chuẩn W3C. Cần tự xử lý reconnect, fallback.
- **Socket.IO:** Thêm features: auto reconnect, room/namespace, fallback sang polling nếu WS không hỗ trợ. Phổ biến hơn trong production.

### Câu hỏi phỏng vấn

**Q: Khi nào dùng WebSocket thay vì REST polling?**

**A:** WebSocket dùng khi: (1) Cần update **tức thì** (chat, notification, stock prices, live dashboard). (2) Server cần **push** data cho client mà client không hỏi. (3) Tần suất update cao (mỗi giây). REST polling (gọi API mỗi 5-10 giây) phù hợp khi: update không cần tức thì, traffic thấp, infra đơn giản. **Nhược điểm WebSocket:** tốn tài nguyên duy trì kết nối, phức tạp hơn khi scale (cần sticky session hoặc Redis pub/sub).
