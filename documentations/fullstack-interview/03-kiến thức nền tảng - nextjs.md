# Kiến Thức Nền Tảng React và Next.js

File này là tài liệu canonical cho frontend React/Next.js trong lộ trình phỏng vấn fullstack. Mục tiêu là đọc để hiểu, biết trade-off và nói lại được trong phỏng vấn.

Các phần liên quan nhưng không đi sâu ở đây:

- Node.js/NestJS backend: `02-nodejs-NESTJS_MASTERY_GUIDE.md`
- Database: `05-kiến thức master database.md`
- Cache, queue, backend production patterns: `06-backend-core-knowledge.md`
- DevOps/deploy/monitoring: `04-kiến thức-database-devops.md`

## 1. Mức độ cần nắm

### Bắt buộc phải chắc

- React component, props, state, render cycle.
- Hooks: `useState`, `useEffect`, `useMemo`, `useCallback`, `useRef`.
- Controlled/uncontrolled component.
- Form lớn, validation, state colocation.
- Next.js App Router: `layout`, `page`, `loading`, `error`, dynamic route.
- SSR, SSG, ISR, CSR: định nghĩa, ưu/nhược điểm, khi nào dùng.
- Server Component vs Client Component.
- Data fetching, caching, revalidation.
- SEO, metadata, image optimization.
- Frontend performance: LCP, INP, CLS, bundle size, re-render.

### Nên biết để trả lời senior hơn

- Streaming rendering và Suspense.
- Client boundary cost.
- BFF pattern trong Next.js.
- Server Actions/API Routes dùng khi nào.
- Accessibility cơ bản.
- Design system/component contract.
- Virtualization cho list/table lớn.
- Performance budget và cách debug Web Vitals.

## 2. React core

### 2.1 React là gì?

React là thư viện xây dựng UI dựa trên component. UI được chia thành các component nhỏ, mỗi component nhận `props`, có thể có `state`, và render ra giao diện dựa trên dữ liệu hiện tại.

Bản chất cần hiểu:

- React render UI theo state.
- Khi state/props thay đổi, component có thể render lại.
- Render không có nghĩa là DOM thật luôn bị thay đổi toàn bộ. React tính toán khác biệt rồi cập nhật DOM cần thiết.
- Performance frontend thường liên quan đến render quá nhiều, bundle quá lớn, network waterfall hoặc asset chưa tối ưu.

Câu trả lời phỏng vấn:

> React giúp tổ chức UI thành component. Mỗi component render theo props/state. Khi state thay đổi, React render lại component liên quan và cập nhật DOM theo diff. Với app lớn, điều quan trọng là quản lý state đúng chỗ, tách component hợp lý và tránh re-render không cần thiết.

### 2.2 Props và state

`props` là dữ liệu truyền từ component cha xuống component con. Props nên được xem là read-only.

`state` là dữ liệu nội bộ của component, thay đổi được bằng setter như `setState`.

Ví dụ:

```tsx
function UserCard({ name }: { name: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <section>
      <h2>{name}</h2>
      <button onClick={() => setExpanded((value) => !value)}>
        Toggle
      </button>
      {expanded && <p>More information</p>}
    </section>
  );
}
```

Nguyên tắc:

- State nên đặt gần nơi sử dụng nhất có thể.
- Nếu nhiều component cần dùng chung state, đẩy state lên parent gần nhất.
- Không duplicate derived state nếu có thể tính từ state gốc.

Ví dụ không tốt:

```tsx
const [items, setItems] = useState<Item[]>([]);
const [total, setTotal] = useState(0); // Có thể bị lệch với items.length
```

Tốt hơn:

```tsx
const total = items.length;
```

### 2.3 Controlled và uncontrolled component

Controlled component là input mà value được React state kiểm soát.

```tsx
function SearchBox() {
  const [keyword, setKeyword] = useState("");

  return (
    <input
      value={keyword}
      onChange={(event) => setKeyword(event.target.value)}
    />
  );
}
```

Ưu điểm:

- Dễ validate.
- Dễ sync với UI khác.
- Dễ reset/submit.

Nhược điểm:

- Form rất lớn có thể re-render nhiều nếu thiết kế state không tốt.

Uncontrolled component để DOM giữ state, React lấy value qua ref hoặc form submit.

Ưu điểm:

- Ít re-render hơn.
- Phù hợp với input đơn giản hoặc thư viện form tối ưu.

Nhược điểm:

- Khó đồng bộ UI phức tạp.
- Khó validate realtime nếu không có thư viện hỗ trợ.

Câu trả lời:

> Với form đơn giản hoặc cần validate realtime, controlled component dễ kiểm soát. Với form rất lớn, em thường dùng thư viện form như React Hook Form để giảm re-render, hoặc chia state theo section thay vì để một state lớn làm render lại cả form.

### 2.4 Hooks quan trọng

`useState` dùng cho state cục bộ.

`useEffect` dùng để đồng bộ với hệ thống bên ngoài React như API client-side, subscription, timer, DOM side effect.

`useMemo` cache kết quả tính toán đắt đỏ.

`useCallback` giữ ổn định reference của function khi truyền xuống component con memoized.

`useRef` giữ mutable value không làm re-render hoặc truy cập DOM.

Pitfall với `useEffect`:

Không nên dùng `useEffect` để tính derived state đơn giản.

Không tốt:

```tsx
const [fullName, setFullName] = useState("");

useEffect(() => {
  setFullName(`${firstName} ${lastName}`);
}, [firstName, lastName]);
```

Tốt hơn:

```tsx
const fullName = `${firstName} ${lastName}`;
```

Pitfall khác:

- Thiếu dependency trong `useEffect` gây stale value.
- Đưa object/function mới vào dependency làm effect chạy liên tục.
- Fetch data trong nhiều component con tạo waterfall.

### 2.5 Re-render và memoization

Component re-render khi:

- State của chính nó thay đổi.
- Props từ parent thay đổi.
- Parent render lại và child không được memo phù hợp.
- Context value thay đổi.

Tối ưu không phải là bọc mọi thứ bằng `memo`, `useMemo`, `useCallback`.

Nên tối ưu khi:

- Component render đắt.
- List/table lớn.
- Child được memo nhưng callback/object props đổi liên tục.
- Có bằng chứng từ React DevTools profiler.

Ví dụ:

```tsx
const filteredItems = useMemo(() => {
  return items.filter((item) => item.name.includes(keyword));
}, [items, keyword]);
```

Trade-off:

- Memoization cũng có cost.
- Dùng quá nhiều làm code khó đọc.
- Nếu computation rẻ, memo không đáng.

Câu trả lời phỏng vấn:

> Em không tối ưu re-render theo cảm tính. Em dùng profiler để xác định component nào render nhiều hoặc render đắt. Sau đó mới tách component, colocate state, dùng memo/useMemo/useCallback hoặc virtualization nếu list lớn.

## 3. Form lớn và UI phức tạp

### 3.1 Vấn đề của form lớn

Form lớn thường khó vì:

- Nhiều field, nhiều rule validation.
- Field phụ thuộc nhau.
- Có async validation.
- Cần dirty/touched state.
- Cần lưu draft hoặc wizard nhiều bước.
- Nếu thiết kế state sai, mỗi lần gõ một input có thể render lại toàn bộ form.

### 3.2 Cách thiết kế form lớn

Nguyên tắc:

- Chia form theo section.
- State đặt gần nơi sử dụng.
- Dùng schema validation nếu rule phức tạp.
- Debounce async validation.
- Không validate server mỗi key stroke nếu không cần.
- Submit phải có loading state và chống double submit.
- Backend vẫn phải validate lại, không tin hoàn toàn frontend.

Ví dụ flow:

```text
User nhập form
-> validate client cơ bản
-> async validate field cần server nếu có
-> submit
-> backend validate lại
-> backend trả lỗi field/global
-> UI map lỗi về đúng field
```

Với form rất lớn:

- Dùng React Hook Form hoặc thư viện tương tự.
- Chia section thành component riêng.
- Field nào thay đổi chỉ ảnh hưởng khu vực cần thiết.
- Nếu có nhiều step, lưu draft theo step.

### 3.3 Component dùng lại

Component dùng lại tốt cần contract rõ:

- Props rõ ràng.
- Không chứa business logic quá cụ thể.
- Có controlled API nếu cần.
- Có state loading/error/disabled.
- Có accessibility cơ bản: label, aria, keyboard.

Ví dụ input component:

```tsx
type TextFieldProps = {
  label: string;
  value: string;
  error?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
};

function TextField({ label, value, error, disabled, onChange }: TextFieldProps) {
  return (
    <label>
      <span>{label}</span>
      <input
        value={value}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        onChange={(event) => onChange(event.target.value)}
      />
      {error && <span role="alert">{error}</span>}
    </label>
  );
}
```

## 4. Next.js nền tảng

### 4.1 Next.js là gì?

Next.js là framework React hỗ trợ routing, rendering trên server, static generation, API routes/server actions, image optimization, metadata/SEO và nhiều cơ chế production khác.

Next.js không thay thế React. Next.js dùng React và thêm framework layer để xây app production dễ hơn.

Phù hợp khi:

- Cần SEO.
- Cần server-side rendering.
- Cần routing chuẩn.
- Cần tối ưu image/font/bundle.
- Cần BFF nhẹ cho frontend.

Không nhất thiết cần Next.js khi:

- App internal dashboard không cần SEO và build bằng SPA là đủ.
- Team muốn kiểm soát routing/build theo cách riêng.
- Backend/frontend deployment tách biệt hoàn toàn và không cần SSR.

### 4.2 App Router

App Router dùng thư mục `app` để định nghĩa route.

Các file quan trọng:

- `page.tsx`: UI của route.
- `layout.tsx`: layout dùng chung cho route segment.
- `loading.tsx`: loading UI khi segment đang tải.
- `error.tsx`: error boundary của segment, là Client Component.
- `not-found.tsx`: UI cho 404.
- `[id]`: dynamic segment.
- `[...slug]`: catch-all segment.
- `(group)`: route group, tổ chức code không ảnh hưởng URL.

Ví dụ:

```text
app/
  products/
    layout.tsx
    page.tsx
    [id]/
      page.tsx
      loading.tsx
      error.tsx
```

Cần hiểu:

- Layout có thể nest.
- Loading/error có phạm vi theo segment.
- Route group giúp tổ chức code như `(admin)` mà không thêm `/admin` vào URL nếu không muốn.

## 5. Rendering strategies

### 5.1 CSR - Client-Side Rendering

CSR là render chủ yếu ở browser. Server trả HTML tối thiểu và JavaScript bundle, sau đó client fetch data và render UI.

Phù hợp:

- Dashboard sau login.
- UI nhiều tương tác.
- SEO không quan trọng.
- Data phụ thuộc nhiều vào action của user.

Ưu điểm:

- Đơn giản với app internal.
- Tương tác client linh hoạt.
- Giảm server render workload.

Nhược điểm:

- First load có thể chậm hơn.
- SEO kém nếu nội dung chính chỉ xuất hiện sau client fetch.
- Dễ tạo loading waterfall.

Câu trả lời:

> CSR phù hợp với app sau login như dashboard, nơi SEO không quan trọng và UI tương tác nhiều. Nhưng nếu page public cần SEO hoặc first content nhanh, em sẽ cân nhắc SSR/SSG/ISR.

### 5.2 SSR - Server-Side Rendering

SSR là render HTML trên server cho mỗi request hoặc theo cơ chế dynamic rendering. Client nhận HTML có nội dung sẵn, sau đó hydrate để tương tác.

Phù hợp:

- Page public cần SEO.
- Data cần fresh theo request.
- Nội dung phụ thuộc cookie/session.
- Product detail có giá/tồn kho cần cập nhật thường xuyên.

Ưu điểm:

- SEO tốt hơn CSR.
- First content tốt hơn nếu server/data nhanh.
- Có thể giữ logic/data sensitive ở server.

Nhược điểm:

- Tăng tải server.
- Latency phụ thuộc DB/external API.
- Cần cache/timeout tốt, nếu không mỗi request đều đắt.

Pitfall:

- Gọi nhiều API tuần tự trong server render làm TTFB cao.
- SSR page nhưng lại fetch nội dung chính ở client, làm mất lợi ích SEO.
- Cache sai dữ liệu user-specific thành public.

### 5.3 SSG - Static Site Generation

SSG là tạo HTML tĩnh ở build time.

Phù hợp:

- Blog.
- Documentation.
- Marketing page.
- Landing page.
- Nội dung ít thay đổi.

Ưu điểm:

- Rất nhanh khi phục vụ qua CDN.
- Tải server thấp.
- SEO tốt.

Nhược điểm:

- Data không fresh nếu không rebuild.
- Build time tăng nếu có rất nhiều page.
- Không phù hợp với nội dung thay đổi liên tục theo user/request.

### 5.4 ISR - Incremental Static Regeneration

ISR cho phép dùng static page nhưng revalidate sau một khoảng thời gian hoặc theo yêu cầu.

Phù hợp:

- Product detail không cần realtime tuyệt đối.
- Blog/news có cập nhật.
- Page SEO cần nhanh nhưng data có thể stale ngắn hạn.

Ưu điểm:

- Gần tốc độ static.
- Giảm server render liên tục.
- Có thể cập nhật nội dung sau build.

Nhược điểm:

- Có cửa sổ stale data.
- Cần hiểu cache/revalidation.
- Debug cache có thể khó hơn SSR thuần.

Câu trả lời:

> ISR phù hợp khi cần SEO và performance của static page nhưng data không cần realtime tuyệt đối. Ví dụ product detail có thể stale 1-5 phút. Nếu dữ liệu như payment hoặc inventory cần chính xác tại thời điểm action, em không dựa vào ISR cho quyết định cuối cùng.

### 5.5 Cách chọn rendering strategy

| Use case | Strategy nên cân nhắc |
| --- | --- |
| Dashboard sau login | CSR hoặc server fetch + client interaction |
| Blog/docs/landing | SSG |
| Product detail SEO, cập nhật không quá realtime | ISR |
| Page cần data fresh theo request | SSR |
| Form/editor nhiều tương tác | Client Component/CSR phần tương tác |
| Public page cần SEO nhưng có một widget interactive | Server render page, client boundary cho widget |

## 6. Server Component và Client Component

### 6.1 Server Component là gì?

Server Component là component render trên server. Mặc định trong Next.js App Router, component là Server Component nếu không có `"use client"`.

Server Component có thể:

- Fetch data trực tiếp ở server.
- Truy cập server-only code.
- Không gửi JavaScript của component đó xuống client.
- Giúp giảm bundle client.

Server Component không thể:

- Dùng `useState`, `useEffect`.
- Dùng browser API như `window`, `localStorage`.
- Gắn event handler trực tiếp như `onClick`.

Ví dụ:

```tsx
export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id);

  return (
    <main>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <AddToCartButton productId={product.id} />
    </main>
  );
}
```

`ProductPage` có thể là Server Component. `AddToCartButton` cần là Client Component vì có tương tác.

### 6.2 Client Component là gì?

Client Component là component chạy/hydrate ở browser. Đánh dấu bằng `"use client"` ở đầu file.

Dùng khi cần:

- `useState`
- `useEffect`
- Event handler: `onClick`, `onChange`
- Browser API
- Form interactive
- Modal, dropdown, chart interactive, editor

Ví dụ:

```tsx
"use client";

export function AddToCartButton({ productId }: { productId: string }) {
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    try {
      await addToCart(productId);
    } finally {
      setPending(false);
    }
  }

  return (
    <button disabled={pending} onClick={handleClick}>
      Add to cart
    </button>
  );
}
```

### 6.3 Nguyên tắc đặt client boundary

Nguyên tắc:

- Mặc định để component ở server.
- Chỉ dùng `"use client"` ở component nhỏ nhất cần interaction.
- Không đưa cả page/layout thành Client Component nếu chỉ một button cần click.
- Data sensitive nên xử lý ở server nếu có thể.

Sai thường gặp:

```tsx
"use client";

export default function ProductPage() {
  // Cả page thành client component dù chỉ cần một nút interactive.
}
```

Tốt hơn:

```tsx
export default async function ProductPage() {
  const product = await getProduct();

  return (
    <>
      <ProductInfo product={product} />
      <AddToCartButton productId={product.id} />
    </>
  );
}
```

Câu trả lời:

> Server Component giúp giảm JavaScript gửi xuống client và giữ logic/data fetching ở server. Client Component chỉ dùng cho phần cần state, effect, browser API hoặc event handler. Em cố gắng đặt client boundary càng nhỏ càng tốt.

## 7. Data fetching, cache và revalidation

### 7.1 Fetch data ở server hay client?

Fetch ở server khi:

- Data cần SEO.
- Data cần cookie/session/secret.
- Muốn tránh client waterfall.
- Muốn cache/revalidate ở server/CDN.
- Nội dung chính cần có ngay trong HTML.

Fetch ở client khi:

- Data phụ thuộc interaction sau khi page load.
- Dashboard cần polling/refetch.
- Infinite scroll.
- Optimistic update.
- Form search/filter sau hành động user.

Ví dụ server fetch:

```tsx
export default async function OrdersPage() {
  const orders = await getOrdersForCurrentUser();
  return <OrdersTable orders={orders} />;
}
```

Ví dụ client fetch với React Query/SWR:

```tsx
"use client";

function NotificationsBell() {
  const { data } = useQuery({
    queryKey: ["unread-count"],
    queryFn: fetchUnreadCount,
  });

  return <span>{data?.count ?? 0}</span>;
}
```

### 7.2 Cache key và invalidation

Khi nói về cache, phải nói được:

- Cache key là gì?
- Data stale bao lâu thì chấp nhận?
- Khi mutate data thì invalidate/revalidate ở đâu?
- Cache là public hay user-specific?

Ví dụ:

```text
product:123
user:42:notifications
tenant:abc:dashboard-summary
```

Lỗi hay gặp:

- Cache dữ liệu theo user nhưng key không chứa user id.
- Update data xong quên invalidate.
- Cache quá lâu làm UI sai.
- Cache quá ngắn không giảm được load.

### 7.3 Time-based và on-demand revalidation

Time-based revalidation:

- Data được coi là stale sau N giây.
- Phù hợp với dữ liệu có thể cũ trong thời gian ngắn.

On-demand revalidation:

- Khi có mutation hoặc CMS update, chủ động revalidate route/tag.
- Phù hợp với nội dung cần cập nhật ngay sau khi thay đổi.

Câu trả lời:

> Em chọn revalidation theo độ nhạy của dữ liệu. Blog/product public có thể time-based. Nhưng sau mutation như update profile hoặc update CMS, em ưu tiên on-demand revalidation/invalidate cache để user thấy dữ liệu mới sớm hơn.

### 7.4 React Query/SWR dùng để làm gì?

React Query/SWR hỗ trợ client-side server state:

- Cache response.
- Refetch khi focus/reconnect.
- Loading/error state.
- Retry.
- Pagination/infinite query.
- Optimistic update.
- Invalidate query sau mutation.

Phù hợp:

- Dashboard.
- Notification.
- Search/filter client-side.
- Infinite scroll.
- Data thay đổi sau interaction.

Không thay thế:

- SEO server rendering.
- Backend validation.
- Database cache.

## 8. API Routes, Server Actions và BFF

### 8.1 BFF là gì?

BFF là Backend For Frontend. Đây là lớp backend mỏng được thiết kế riêng cho frontend app.

Trong Next.js, BFF có thể là:

- API Route.
- Route Handler.
- Server Action.
- Server Component gọi backend API rồi compose data.

Dùng BFF khi:

- Cần gom nhiều backend API thành một response cho UI.
- Cần che giấu token/secret khỏi browser.
- Cần transform data theo màn hình.
- Cần xử lý cookie/session ở server.

Không nên:

- Nhồi toàn bộ domain backend vào Next.js nếu logic phức tạp.
- Để Next.js xử lý transaction lớn, queue, worker phức tạp nếu backend riêng phù hợp hơn.
- Duplicate business rule giữa BFF và backend core.

### 8.2 API Routes/Route Handlers

Phù hợp cho:

- Proxy request đến backend.
- Webhook nhẹ.
- BFF endpoint.
- Auth callback.

Ví dụ:

```ts
export async function GET() {
  const data = await fetchDashboardSummary();
  return Response.json(data);
}
```

Cần chú ý:

- Validate input.
- Không leak secret.
- Đặt timeout khi gọi backend.
- Không xử lý task lâu trong request.

### 8.3 Server Actions

Server Actions cho phép gọi function server từ form/action trong React/Next.

Phù hợp:

- Form mutation đơn giản.
- Action gắn với UI.
- Giảm boilerplate API route cho một số use case.

Nhược điểm/cần cẩn thận:

- Vẫn phải validate input.
- Vẫn phải kiểm tra auth/authz.
- Không nên nhồi business logic lớn.
- Cần hiểu cache invalidation/revalidation sau mutation.

## 9. SEO, metadata và accessibility

### 9.1 SEO trong Next.js

SEO tốt cần:

- Nội dung chính render được ở server/static HTML.
- Title, description, canonical URL.
- Open Graph/Twitter metadata.
- Semantic HTML.
- Sitemap/robots nếu site public.
- Performance tốt vì Core Web Vitals ảnh hưởng trải nghiệm và có thể ảnh hưởng ranking.

Ví dụ metadata:

```ts
export const metadata = {
  title: "Product detail",
  description: "View product information and pricing",
};
```

Pitfall:

- Page public nhưng nội dung chính chỉ fetch ở client.
- Thiếu heading structure.
- Ảnh không có alt.
- Duplicate content nhưng không có canonical.

### 9.2 Semantic HTML và accessibility

Cần biết cơ bản:

- Dùng đúng `button` cho hành động, `a` cho điều hướng.
- Input có label.
- Error message có thể đọc được bởi screen reader.
- Modal/dropdown hỗ trợ keyboard.
- Heading theo thứ tự hợp lý.
- Không chỉ dùng màu để truyền đạt trạng thái.

Ví dụ:

```tsx
<label htmlFor="email">Email</label>
<input id="email" type="email" aria-invalid={Boolean(error)} />
{error && <p role="alert">{error}</p>}
```

Câu trả lời:

> Accessibility không chỉ là thêm aria. Trước hết em dùng HTML semantic đúng, label cho form, keyboard navigation, focus state và error state rõ ràng. ARIA chỉ dùng khi HTML native không đủ.

## 10. Image, font và asset optimization

### 10.1 Image optimization

`next/image` hỗ trợ:

- Responsive image.
- Lazy loading.
- Tối ưu format/kích thước.
- Giảm layout shift nếu khai báo kích thước đúng.

Cần làm:

- Khai báo width/height hoặc aspect ratio.
- Không dùng ảnh quá lớn cho thumbnail.
- Dùng CDN/object storage cho media lớn.
- Ưu tiên ảnh quan trọng trong first viewport.

Pitfall:

- Dùng ảnh 4000px cho card 200px.
- Không set kích thước làm CLS.
- API server stream ảnh thay vì để CDN phục vụ.

### 10.2 Font optimization

Font có thể ảnh hưởng LCP/CLS.

Cần chú ý:

- Dùng font loading tối ưu.
- Tránh quá nhiều weight.
- Preload font quan trọng.
- Dùng fallback hợp lý để tránh layout shift.

## 11. Frontend performance

### 11.1 Core Web Vitals

LCP đo thời gian hiển thị phần nội dung lớn/chính đầu tiên.

Tối ưu LCP:

- Server render nội dung chính.
- Tối ưu image hero.
- Giảm blocking JS/CSS.
- Cache/CDN.
- Tránh API chậm trong SSR.

INP đo độ phản hồi khi người dùng tương tác.

Tối ưu INP:

- Giảm JavaScript trên client.
- Tách task nặng.
- Tránh re-render quá rộng.
- Virtualize list lớn.
- Debounce/throttle event phù hợp.

CLS đo layout shift.

Tối ưu CLS:

- Đặt kích thước cho image/video.
- Reserve space cho dynamic content.
- Không chèn banner/toast làm đẩy layout bất ngờ.

### 11.2 Bundle size

Bundle lớn làm app tải chậm và tương tác chậm.

Cách debug:

- Dùng bundle analyzer.
- Kiểm tra import sai, ví dụ import cả library.
- Lazy load chart/editor/map.
- Đẩy logic server-only về Server Component.
- Xóa dependency trùng lặp.

Ví dụ:

```tsx
const Chart = dynamic(() => import("./Chart"), {
  ssr: false,
  loading: () => <ChartSkeleton />,
});
```

### 11.3 List/table lớn

Vấn đề:

- Render hàng nghìn row làm DOM nặng.
- Sort/filter client-side với data lớn chậm.
- Re-render mỗi cell quá nhiều.

Cách xử lý:

- Server-side pagination/filter/sort.
- Cursor pagination cho feed/infinite scroll.
- Virtualization nếu cần render nhiều row.
- Memo row/cell khi thật sự expensive.
- Không format/tính toán nặng trong render loop.

### 11.4 Network waterfall

Waterfall xảy ra khi request sau phải chờ request trước không cần thiết.

Ví dụ không tốt:

```text
Load page
-> fetch user
-> fetch orders
-> fetch notifications
```

Nếu độc lập, nên chạy song song hoặc fetch ở server để trả data cùng lúc.

Cách xử lý:

- Fetch data ở server khi phù hợp.
- `Promise.all` cho request độc lập.
- Prefetch route/data.
- BFF gom nhiều backend call cho màn hình.
- Cache data ít thay đổi.

## 12. State management

### 12.1 Local state vs global state

Local state dùng cho UI state chỉ liên quan component/section:

- Modal open/close.
- Input value.
- Tab active.
- Local filter.

Global state dùng khi nhiều nơi cần chia sẻ:

- Auth user.
- Theme.
- Cart.
- App-wide notification.
- State qua nhiều step/màn hình.

Không nên đưa mọi thứ vào global store. Global store quá lớn làm coupling tăng và có thể gây re-render rộng.

### 12.2 Server state vs client state

Server state là dữ liệu từ server:

- User profile.
- Product list.
- Orders.
- Notification count.

Client state là trạng thái UI cục bộ:

- Modal đang mở.
- Field đang focus.
- Draft chưa submit.

React Query/SWR phù hợp quản lý server state trên client. Zustand/Redux phù hợp hơn cho client/global state phức tạp.

Câu trả lời:

> Em tách server state và client state. Data từ API nên dùng cache library như React Query/SWR nếu fetch ở client. UI state thì để local hoặc global store nếu thật sự cần share. Không đưa server state vào Redux một cách máy móc.

## 13. Câu hỏi phỏng vấn hay gặp

### Server Component khác Client Component thế nào?

Server Component render trên server, có thể fetch data và không gửi JS của component đó xuống client, nhưng không dùng state/effect/browser API. Client Component chạy ở browser, dùng cho tương tác như form, modal, button, chart. Nguyên tắc là giữ phần lớn UI ở server và chỉ tạo client boundary cho phần cần interaction.

### Khi nào dùng SSR?

Dùng SSR khi page cần SEO, data cần fresh theo request hoặc phụ thuộc session/cookie. Ví dụ product detail có giá cập nhật, trang public cần nội dung trong HTML. Nhược điểm là tăng tải server và latency phụ thuộc data source, nên cần cache/timeout tốt.

### Khi nào dùng SSG/ISR?

SSG dùng cho nội dung tĩnh ít thay đổi như docs/blog/landing. ISR dùng khi cần SEO và tốc độ gần static nhưng data có thể stale một khoảng ngắn, ví dụ product detail hoặc bài viết cập nhật không liên tục.

### Khi nào fetch data ở client?

Khi data phụ thuộc tương tác sau khi render, cần polling, optimistic update, infinite scroll hoặc dashboard sau login. Nếu nội dung chính cần SEO hoặc cần bảo mật token/secret, nên fetch ở server.

### Làm sao tối ưu form lớn?

Chia form theo section, đặt state gần nơi dùng, dùng schema validation, debounce async validation, tránh global re-render, dùng thư viện form tối ưu như React Hook Form nếu phù hợp, và backend vẫn validate lại.

### Làm sao debug frontend chậm?

Đầu tiên đo bằng Web Vitals và React Profiler. Kiểm tra LCP/INP/CLS, bundle size, request waterfall, image/font, component re-render và list/table lớn. Sau khi xác định bottleneck mới tối ưu bằng server rendering, lazy load, memoization, virtualization, cache hoặc giảm JS client.
