# PHẦN 5: DESIGN PATTERNS, UI/UX TOOLS & COMMON COMPONENTS — DEEP DIVE

---

## 1. Design Patterns trong React

### 1.1. Container / Presentational Pattern

**Nguyên lý:** Tách component thành 2 loại:
- **Container (Smart):** Chứa logic nghiệp vụ — gọi API, quản lý state, xử lý event. KHÔNG quan tâm UI trông như nào.
- **Presentational (Dumb):** Chỉ nhận props và render UI. KHÔNG biết data đến từ đâu. Thuần túy, dễ test, dễ tái sử dụng.

**Tại sao cần?** Khi 1 component vừa fetch data vừa render UI vừa xử lý event → nó trở nên quá lớn, khó test, khó tái sử dụng. Tách ra giúp:
- Presentational component có thể dùng lại ở nhiều nơi (cùng UI, khác data source).
- Container component dễ test logic riêng (mock API, không cần render UI).

```tsx
// ❌ SAI — Gộp hết vào 1 component
function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => { setProducts(data); setLoading(false); });
  }, []);

  if (loading) return <Spinner />;
  return (
    <ul>
      {products.map(p => (
        <li key={p.id}>
          <img src={p.image} />
          <h3>{p.name}</h3>
          <span>{p.price}đ</span>
        </li>
      ))}
    </ul>
  );
}

// ✅ ĐÚNG — Tách Container + Presentational
// Container: chỉ lo logic
function ProductListContainer() {
  const { data, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  });

  if (isLoading) return <Spinner />;
  return <ProductList products={data} />;
}

// Presentational: chỉ lo UI — có thể tái sử dụng
function ProductList({ products }: { products: Product[] }) {
  return (
    <ul>
      {products.map(p => (
        <ProductCard key={p.id} product={p} />
      ))}
    </ul>
  );
}
```

**Lưu ý hiện đại:** Với Custom Hooks, pattern này đã tiến hóa. Thay vì tạo Container component riêng, ta đóng gói logic vào **Custom Hook** và component tự gọi hook đó. Nhưng nguyên tắc "tách logic khỏi UI" vẫn đúng.

### 1.2. Higher-Order Components (HOCs)

**Nguyên lý:** HOC là một hàm nhận vào 1 Component, trả về 1 Component mới đã được "nâng cấp" thêm logic/data.

```tsx
// HOC: thêm logic kiểm tra authentication
function withAuth(WrappedComponent) {
  return function AuthenticatedComponent(props) {
    const { isAuthenticated } = useAuth();
    if (!isAuthenticated) return <Navigate to="/login" />;
    return <WrappedComponent {...props} />;
  };
}

// Sử dụng
const ProtectedDashboard = withAuth(Dashboard);
// <ProtectedDashboard /> → tự động check auth trước khi render Dashboard
```

**Tại sao ít dùng hơn?** HOC tạo "wrapper hell" (nhiều lớp component lồng nhau), khó debug trong React DevTools, và gây vấn đề naming collision khi nhiều HOC cùng inject prop trùng tên. **Custom Hooks** giải quyết tốt hơn trong hầu hết trường hợp.

**Khi nào vẫn dùng HOC?** Khi cần "bọc" component mà không muốn thay đổi code bên trong (VD: thêm error boundary, logging, analytics tracking cho nhiều component).

### 1.3. Render Props

**Nguyên lý:** Component nhận một prop là **function**, gọi function đó để quyết định render gì. Function nhận data/state làm tham số.

```tsx
// Render Props pattern
function MouseTracker({ render }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMove = (e) => setPosition({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  return render(position); // Giao quyền render cho parent
}

// Sử dụng — parent quyết định render gì với position data
<MouseTracker render={({ x, y }) => (
  <div>Chuột ở vị trí: {x}, {y}</div>
)} />
```

**Hiện đại:** Pattern này cũng đã bị Custom Hooks thay thế phần lớn. Nhưng một số thư viện vẫn dùng (Formik's `<Field>`, React Router's `<Route render={...}>`).

### Câu hỏi phỏng vấn

**Q: So sánh HOC, Render Props và Custom Hooks. Khi nào dùng cái nào?**

**A:** Cả 3 đều giải quyết bài toán **tái sử dụng logic**:
- **HOC:** Bọc component, thêm behavior. Ưu: không sửa component gốc. Nhược: wrapper hell, name collision, khó trace.
- **Render Props:** Component cha kiểm soát việc render. Ưu: linh hoạt. Nhược: callback nesting sâu.
- **Custom Hooks:** Cách hiện đại nhất. Ưu: đơn giản, composable (gọi nhiều hook trong 1 component), dễ test, không tạo thêm DOM node. Nhược: chỉ dùng trong Functional Component.

Em ưu tiên Custom Hooks cho 95% trường hợp. HOC chỉ dùng khi cần wrap component mà không muốn sửa source code (VD: `withErrorBoundary`).

---

## 2. UI/UX Tools — Hiểu sâu

### 2.1. Component Libraries: Ant Design vs Material UI

| Tiêu chí | Ant Design | Material UI (MUI) |
|---|---|---|
| **Phong cách** | Enterprise, formal | Google Material Design |
| **Mạnh nhất** | Table, Form, DatePicker phức tạp | Theming system, customization |
| **Phù hợp** | Admin panel, Banking, ERP | Consumer app, SaaS |
| **Bundle size** | Lớn (hỗ trợ tree-shaking) | Trung bình |
| **Customization** | Theme token system (ConfigProvider) | sx prop + styled() + theme |

**Thực tế trong Fintech/Banking:** Ant Design được ưa chuộng vì có sẵn các component phức tạp cho enterprise: `Table` (pagination, sorting, filtering, editable cells), `Form` (validation rules, dynamic fields), `DatePicker` (range, quarter, year picker).

**Tùy chỉnh Theme Ant Design:**
```tsx
import { ConfigProvider } from 'antd';

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1a365d',    // Màu chủ đạo ngân hàng
          borderRadius: 8,
          fontFamily: 'Inter, sans-serif',
        },
        components: {
          Button: { primaryShadow: '0 2px 8px rgba(26, 54, 93, 0.3)' },
        },
      }}
    >
      <RouterProvider router={router} />
    </ConfigProvider>
  );
}
```

### 2.2. Headless UI (Radix UI, Headless UI)

**Nguyên lý:** Cung cấp **logic + accessibility** (keyboard navigation, focus management, ARIA) mà **KHÔNG có styling**. Developer tự viết CSS/Tailwind.

**Tại sao cần?** Khi design team có thiết kế riêng, khác hoàn toàn với Material Design hay Ant Design. Dùng component library có sẵn → phải override rất nhiều CSS. Dùng Headless UI → chỉ lấy logic, tự style 100%.

```tsx
import * as Dialog from '@radix-ui/react-dialog';

// Logic (open/close, focus trap, Esc key) có sẵn
// Style hoàn toàn tự viết
<Dialog.Root>
  <Dialog.Trigger className="my-custom-button">Mở</Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay className="my-custom-overlay" />
    <Dialog.Content className="my-custom-modal">
      <Dialog.Title>Xác nhận</Dialog.Title>
      <Dialog.Close className="my-close-btn">&times;</Dialog.Close>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

### 2.3. CSS-in-JS: Styled Components

**Nguyên lý:** Viết CSS trực tiếp trong file JavaScript, gắn style vào component. Mỗi component tự tạo className unique → **không bao giờ bị xung đột CSS** (scoped styles).

```tsx
import styled from 'styled-components';

const Button = styled.button<{ variant?: 'primary' | 'danger' }>`
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  background: ${({ variant }) =>
    variant === 'danger' ? '#e53e3e' : '#3182ce'};
  color: white;

  &:hover {
    opacity: 0.85;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// Sử dụng — giống component thường
<Button variant="primary" onClick={handleSubmit}>Xác nhận</Button>
<Button variant="danger" onClick={handleDelete}>Xóa</Button>
```

**Ưu điểm:** Scoped CSS, dynamic styles dựa trên props, co-locate styles với component.
**Nhược điểm:** Runtime overhead (tạo CSS lúc render), bundle size lớn hơn. Xu hướng mới chuyển sang **zero-runtime CSS** (Tailwind, CSS Modules, vanilla-extract).

### Câu hỏi phỏng vấn

**Q: Bạn chọn cách styling nào cho dự án và tại sao?**

**A:** Tùy vào dự án:
- **Enterprise/Banking (cần nhanh, UI chuẩn):** Ant Design + override theme token. Lý do: có sẵn Table, Form, DatePicker chất lượng cao, team mới vào dùng ngay.
- **Startup (cần design độc đáo):** Tailwind CSS + Radix UI (headless). Lý do: toàn quyền kiểm soát design, accessibility có sẵn từ Radix.
- **Design system nội bộ:** CSS Modules hoặc vanilla-extract. Lý do: zero-runtime, type-safe, scoped styles.

---

## 3. Common Components — Xây dựng chuyên sâu (TypeScript)

### 3.1. Toast System hoàn chỉnh (TypeScript)

**Kiến trúc:**

```
Toast System
├── ToastContext.tsx    → Context + Provider + hook useToast()
├── ToastContainer.tsx  → Render danh sách toasts (Portal)
├── ToastItem.tsx       → Một toast đơn lẻ (animation + auto-dismiss)
└── toast.types.ts      → Type definitions
```

**Type definitions:**
```typescript
// toast.types.ts
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number; // ms, default 3000
}

export interface ToastContextValue {
  addToast: (message: string, type?: ToastType, duration?: number) => void;
}
```

**Context + Provider:**
```tsx
// ToastContext.tsx
import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Toast, ToastContextValue } from './toast.types';
import ToastItem from './ToastItem';

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback(
    (message: string, type: Toast['type'] = 'info', duration = 3000) => {
      const id = crypto.randomUUID(); // ID unique
      setToasts(prev => [...prev, { id, message, type, duration }]);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {createPortal(
        <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 9999 }}>
          {toasts.map(toast => (
            <ToastItem key={toast.id} {...toast} onClose={removeToast} />
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}
```

**Key takeaway — Tại sao dùng `createPortal`?** Portal render DOM node ra NGOÀI component tree React (gắn vào `document.body`). Điều này đảm bảo toast:
- Không bị giới hạn bởi `overflow: hidden` của bất kỳ parent nào.
- Luôn nằm trên cùng (z-index không bị stacking context cha chặn).
- CSS của parent không ảnh hưởng layout toast.

### 3.2. Modal Component (TypeScript + Accessibility)

```tsx
// Modal.tsx
import { useEffect, useRef, ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Đóng khi nhấn Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);

    // Lock body scroll khi modal mở
    document.body.style.overflow = 'hidden';

    // Focus trap: focus vào modal khi mở
    modalRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="modal-overlay"
      onClick={onClose}                // Click backdrop → đóng
      role="dialog"                     // A11y: đánh dấu đây là dialog
      aria-modal="true"                 // A11y: modal blocking
      aria-labelledby="modal-title"     // A11y: title cho screen reader
    >
      <div
        ref={modalRef}
        className="modal-content"
        onClick={e => e.stopPropagation()} // Chặn event bubble → click trong modal không đóng
        tabIndex={-1}                       // Cho phép focus vào div này
      >
        {title && <h2 id="modal-title">{title}</h2>}
        <button onClick={onClose} aria-label="Đóng modal">&times;</button>
        <div className="modal-body">{children}</div>
      </div>
    </div>,
    document.body
  );
}
```

**Key takeaway — `stopPropagation()` là gì và tại sao cần?**

Khi click vào overlay (backdrop) → `onClose()` được gọi → đóng modal. Nhưng vì modal-content **nằm bên trong** overlay, nếu click vào nội dung modal, event sẽ **bubble lên** overlay và cũng trigger `onClose()`. `stopPropagation()` ngăn event lan từ modal-content lên overlay.

**Key takeaway — `document.body.style.overflow = 'hidden'`:** Khi modal mở, nếu không lock scroll, user scroll chuột sẽ cuộn trang phía dưới modal — trải nghiệm rất tệ. Lock scroll body để chỉ cho phép scroll bên trong modal content.

### 3.3. Button Component

```tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  disabled,
  className,
  ...rest // Spread tất cả HTML button attributes còn lại
}: ButtonProps) {
  return (
    <button
      className={`btn btn-${variant} btn-${size} ${className ?? ''}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <Spinner size="sm" /> : icon}
      {children}
    </button>
  );
}
```

**Tại sao `extends React.ButtonHTMLAttributes`?** Để component thừa hưởng TẤT CẢ native HTML button props (`onClick`, `type`, `form`, `aria-*`,...) mà không cần khai báo lại từng cái. User dùng component giống hệt `<button>` native.

### 3.4. Input Component (với React Hook Form)

```tsx
import { forwardRef, InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

// forwardRef để react-hook-form có thể gắn ref vào input
const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, id, ...rest }, ref) => {
    const inputId = id ?? `input-${label?.toLowerCase().replace(/\s/g, '-')}`;

    return (
      <div className="form-field">
        {label && <label htmlFor={inputId}>{label}</label>}
        <input
          ref={ref}
          id={inputId}
          className={`input ${error ? 'input-error' : ''}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...rest}
        />
        {error && (
          <span id={`${inputId}-error`} className="error-text" role="alert">
            {error}
          </span>
        )}
        {helperText && !error && (
          <span className="helper-text">{helperText}</span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
```

**Tại sao cần `forwardRef`?** React Hook Form (và nhiều thư viện form khác) cần **gắn ref trực tiếp** vào `<input>` DOM element để đọc/set giá trị, focus, validate. Nếu không có `forwardRef`, ref chỉ gắn vào component wrapper, không lấy được DOM element thật.

### 3.5. Table Component (Generics + TypeScript)

```tsx
interface Column<T> {
  key: keyof T;
  title: string;
  render?: (value: T[keyof T], record: T) => ReactNode; // Custom render
  sortable?: boolean;
  width?: number | string;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  onRowClick?: (record: T) => void;
  rowKey: keyof T; // Field nào làm key (thường là 'id')
}

function Table<T>({ data, columns, loading, onRowClick, rowKey }: TableProps<T>) {
  if (loading) return <Skeleton rows={5} />;

  return (
    <table className="data-table">
      <thead>
        <tr>
          {columns.map(col => (
            <th key={String(col.key)} style={{ width: col.width }}>
              {col.title}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map(record => (
          <tr
            key={String(record[rowKey])}
            onClick={() => onRowClick?.(record)}
            className={onRowClick ? 'clickable-row' : ''}
          >
            {columns.map(col => (
              <td key={String(col.key)}>
                {col.render
                  ? col.render(record[col.key], record)
                  : String(record[col.key])}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Sử dụng — TS tự suy ra T = User, autocomplete chính xác
<Table<User>
  data={users}
  rowKey="id"
  columns={[
    { key: 'name', title: 'Họ tên' },
    { key: 'email', title: 'Email' },
    { key: 'role', title: 'Vai trò', render: (val) => <Badge>{val}</Badge> },
  ]}
  onRowClick={(user) => navigate(`/users/${user.id}`)}
/>
```

### 3.6. Storybook — Tại sao cần?

**Nguyên lý:** Storybook cho phép phát triển và demo từng component **một cách cô lập** — không cần chạy cả app, không cần data thật, không cần đăng nhập.

**Lợi ích thực tế:**
1. **Dev:** Phát triển nhanh — thay đổi props, xem kết quả ngay lập tức.
2. **Designer:** Xem tất cả variants của component, kiểm tra có đúng design không.
3. **QA:** Test từng component riêng lẻ.
4. **Documentation:** Storybook tự động tạo docs từ PropTypes/TypeScript interface.

### Câu hỏi phỏng vấn

**Q: Khi xây dựng Design System / Common Components, bạn quan tâm những gì?**

**A:** (1) **API nhất quán** — tất cả component dùng chung naming convention cho props (variant, size, disabled, loading). (2) **Composition over Configuration** — dùng children/slot thay vì hàng trăm props. (3) **Accessibility** — keyboard navigation, ARIA attributes, focus management. (4) **TypeScript strict** — interface rõ ràng, không `any`. (5) **forwardRef** cho input/button. (6) **Storybook** — mỗi component có story riêng với tất cả variants.

**Q: `forwardRef` dùng để làm gì? Khi nào cần?**

**A:** `forwardRef` cho phép component cha truyền `ref` xuyên qua component con để gắn trực tiếp vào DOM element bên trong. Cần khi: (1) Thư viện form (react-hook-form) cần ref để đọc giá trị input. (2) Parent cần focus vào input/button bên trong component con. (3) Tích hợp với thư viện animation cần ref để đo kích thước DOM.
