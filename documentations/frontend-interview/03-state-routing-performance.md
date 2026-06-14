# PHẦN 3: STATE MANAGEMENT, ROUTING & PERFORMANCE — DEEP DIVE

---

## 1. State Management — Khi nào dùng gì?

### Nguyên lý hoạt động

**State trong React chia làm nhiều loại:**

| Loại State                       | Ví dụ                                      | Giải pháp               |
| -------------------------------- | ------------------------------------------ | ----------------------- |
| **Local UI state**               | Modal open/close, form input               | `useState`              |
| **Shared state** (vài component) | Theme, language                            | `useContext`            |
| **Complex local state**          | Form với nhiều bước, nhiều field liên quan | `useReducer`            |
| **Global app state**             | Auth, cart, notifications                  | Redux Toolkit / Zustand |
| **Server state** (data từ API)   | User list, product data                    | React Query / SWR       |

### Context API + useReducer

**Nguyên lý:** Context API tạo một "kênh truyền dữ liệu" từ component cha xuống mọi component con mà không cần truyền props qua từng tầng (prop drilling).

**Vấn đề lớn nhất của Context:** Khi giá trị của Context thay đổi, **TẤT CẢ component** đang subscribe (dùng `useContext`) sẽ re-render — dù component đó chỉ dùng 1 phần nhỏ của context value.

```jsx
// ❌ SAI — gộp hết vào 1 context
const AppContext = createContext();
// value={{ user, theme, cart, notifications }}
// → Khi cart thay đổi, component chỉ dùng theme cũng re-render!

// ✅ ĐÚNG — tách thành nhiều context nhỏ
const AuthContext = createContext();
const ThemeContext = createContext();
const CartContext = createContext();
```

### Redux Toolkit

**Tại sao Redux Toolkit (RTK) thay thế Redux thường?**

Redux gốc quá nhiều boilerplate: phải viết riêng action types (constants), action creators, reducers, immutable update thủ công. RTK giải quyết tất cả:

- `createSlice` = action types + action creators + reducer gộp lại 1 file.
- Dùng Immer bên trong → cho phép viết code "mutate" trực tiếp (`state.items.push(item)`), Immer tự chuyển thành immutable update.
- `configureStore` tự động thêm middleware (redux-thunk, devtools).

```javascript
// Redux Toolkit — 1 file duy nhất
import { createSlice } from "@reduxjs/toolkit";

const cartSlice = createSlice({
  name: "cart",
  initialState: { items: [], total: 0 },
  reducers: {
    addItem(state, action) {
      state.items.push(action.payload); // Viết "mutate" nhờ Immer
      state.total += action.payload.price;
    },
    removeItem(state, action) {
      const idx = state.items.findIndex((i) => i.id === action.payload);
      if (idx !== -1) {
        state.total -= state.items[idx].price;
        state.items.splice(idx, 1);
      }
    },
  },
});

export const { addItem, removeItem } = cartSlice.actions;
export default cartSlice.reducer;
```

### Zustand — Lightweight Alternative

**Tại sao dùng Zustand?** Không cần Provider bọc component, API cực kỳ đơn giản, tự động chỉ re-render component dùng phần state đã thay đổi (selector).

```javascript
import { create } from "zustand";

const useCartStore = create((set) => ({
  items: [],
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
  removeItem: (id) =>
    set((state) => ({
      items: state.items.filter((i) => i.id !== id),
    })),
}));

// Trong component — chỉ re-render khi items thay đổi
function CartCount() {
  const count = useCartStore((state) => state.items.length);
  return <span>{count}</span>;
}
```

### Câu hỏi phỏng vấn

**Q: Khi nào dùng Context API, khi nào dùng Redux/Zustand?**

**A:** Context API phù hợp cho state ít thay đổi (theme, locale, auth status). Vì mỗi lần value thay đổi, tất cả consumer re-render. Redux/Zustand phù hợp cho state thay đổi thường xuyên, phức tạp (cart, notifications, real-time data) vì chúng có cơ chế selector — component chỉ re-render khi phần state mà nó subscribe thay đổi.

**Q: Immer trong Redux Toolkit hoạt động thế nào?**

**A:** Immer tạo một "draft" (bản nháp) Proxy của state gốc. Khi ta viết `state.items.push(item)`, thực ra ta đang thao tác trên Proxy, không phải state thật. Sau khi reducer chạy xong, Immer so sánh draft với original → tạo ra object mới (immutable) chỉ với phần đã thay đổi. Nhờ vậy ta viết code "mutable" nhưng kết quả vẫn immutable.

---

## 2. React Router DOM

### Nguyên lý hoạt động

React Router sử dụng **History API** của trình duyệt (`window.history.pushState`) để thay đổi URL mà KHÔNG reload trang. Khi URL thay đổi, React Router so khớp URL với các `<Route>` đã khai báo và render component tương ứng.

**Nested Routes:**

```jsx
<Routes>
  <Route path="/dashboard" element={<DashboardLayout />}>
    <Route index element={<Overview />} />
    <Route path="users" element={<UserManagement />} />
    <Route path="settings" element={<Settings />} />
  </Route>
</Routes>
```

`DashboardLayout` phải có `<Outlet />` để render child routes.

**Protected Route Pattern:**

```jsx
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

// Sử dụng
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>;
```

---
