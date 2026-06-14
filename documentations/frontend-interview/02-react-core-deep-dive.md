# PHẦN 2: REACT CORE CONCEPTS — DEEP DIVE

---

## 1. Functional Components & JSX

### Nguyên lý hoạt động

**JSX không phải HTML.** JSX là một cú pháp mở rộng (syntax extension) của JavaScript. Khi build, Babel/SWC sẽ biên dịch JSX thành các lời gọi hàm `React.createElement()`:

```jsx
// Code bạn viết (JSX)
<div className="card">
  <h1>{title}</h1>
</div>

// Sau khi Babel biên dịch → JavaScript thuần
React.createElement('div', { className: 'card' },
  React.createElement('h1', null, title)
)
```

**Tại sao cần hiểu điều này?** Vì nó giải thích:
- Tại sao dùng `className` thay vì `class` (class là keyword JS).
- Tại sao mỗi component phải return **1 element duy nhất** (vì `createElement` chỉ nhận 1 element gốc).
- Tại sao `<Fragment>` (`<>...</>`) tồn tại — nó nhóm elements mà không tạo DOM node thật.

**Functional Component là gì thực sự?** Là một **hàm JavaScript nhận `props` và trả về React Element** (JSX). Mỗi khi state/props thay đổi, React **gọi lại hàm đó từ đầu** (re-render). Toàn bộ biến local bên trong hàm bị tạo mới.

---

## 2. useState — Cơ chế re-render

### Nguyên lý hoạt động

Khi bạn gọi `setState`, React KHÔNG cập nhật state ngay lập tức. Nó **đánh dấu (schedule)** component cần re-render, rồi trong lần render tiếp theo, `useState` trả về giá trị mới.

**Batching:** React gom nhiều lệnh `setState` trong cùng 1 event handler thành 1 lần re-render duy nhất (từ React 18, điều này áp dụng cho cả setTimeout, Promise).

```jsx
function Counter() {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    setCount(count + 1);
    setCount(count + 1);
    setCount(count + 1);
    // Kết quả: count chỉ tăng 1! Vì cả 3 dòng đều đọc giá trị count CŨ (0)
    // → setCount(0+1) x 3 lần = setCount(1)
  };

  // FIX: Dùng functional update
  const handleClickCorrect = () => {
    setCount(prev => prev + 1); // prev = 0 → 1
    setCount(prev => prev + 1); // prev = 1 → 2
    setCount(prev => prev + 1); // prev = 2 → 3
    // Kết quả: count = 3 ✅
  };
}
```

**Tại sao functional update (`prev => prev + 1`) quan trọng?** Vì nó đảm bảo bạn luôn tính toán dựa trên state mới nhất, không bị stale state. **Luôn dùng functional update khi state mới phụ thuộc vào state cũ.**

---

## 3. useEffect — Lifecycle trong Functional Component

### Nguyên lý hoạt động

`useEffect` chạy **SAU** khi React đã render xong và cập nhật DOM. Nó không chặn (block) việc hiển thị UI.

**Dependency array quyết định khi nào effect chạy lại:**

```jsx
// Chạy SAU MỌI lần render (componentDidMount + componentDidUpdate)
useEffect(() => { /* ... */ });

// Chạy CHỈ 1 LẦN sau render đầu tiên (componentDidMount)
useEffect(() => { /* ... */ }, []);

// Chạy khi userId thay đổi
useEffect(() => { /* ... */ }, [userId]);
```

**Cleanup function — Tại sao cần?**

Cleanup chạy TRƯỚC khi effect chạy lại (lần tiếp theo) và khi component unmount. Mục đích: **dọn dẹp side effects cũ** để tránh memory leak.

```jsx
useEffect(() => {
  const ws = new WebSocket('ws://api.example.com');
  ws.onmessage = (event) => setData(JSON.parse(event.data));

  // Cleanup: đóng kết nối khi component unmount
  return () => ws.close();
}, []);
```

**Sai lầm phổ biến:** Quên cleanup cho event listener, interval, subscription → memory leak.

```jsx
// SAI — không cleanup
useEffect(() => {
  window.addEventListener('resize', handleResize);
}, []);

// ĐÚNG
useEffect(() => {
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);
```

### Câu hỏi phỏng vấn

**Q: useEffect chạy ở thời điểm nào trong lifecycle? Nó khác gì useLayoutEffect?**

**A:** `useEffect` chạy **bất đồng bộ (asynchronously) SAU** khi trình duyệt đã paint (vẽ) UI lên màn hình. `useLayoutEffect` chạy **đồng bộ (synchronously) SAU** khi DOM được cập nhật nhưng **TRƯỚC** khi trình duyệt paint. Dùng `useLayoutEffect` khi cần đo đạc DOM (đọc kích thước, vị trí) hoặc thay đổi DOM ngay trước khi user nhìn thấy — tránh hiện tượng "nhấp nháy" (flicker).

---

## 4. useRef — Không chỉ để truy cập DOM

### Nguyên lý hoạt động

`useRef` trả về một object `{ current: value }` mà **tồn tại xuyên suốt các lần render** (không bị tạo mới). Thay đổi `.current` **KHÔNG gây re-render**.

**2 use case chính:**

1. **Truy cập DOM element:**
   ```jsx
   const inputRef = useRef(null);
   // <input ref={inputRef} />
   // inputRef.current.focus(); // Focus vào input
   ```

2. **Lưu trữ giá trị mutable (như biến instance trong class):**
   ```jsx
   function Timer() {
     const intervalRef = useRef(null);

     const start = () => {
       intervalRef.current = setInterval(() => console.log('tick'), 1000);
     };
     const stop = () => {
       clearInterval(intervalRef.current); // Truy cập ID interval để clear
     };
   }
   ```

**Tại sao không dùng `let` thường?** Vì `let` bên trong Functional Component bị **tạo lại mỗi lần render**. Giá trị cũ bị mất. `useRef` giữ giá trị xuyên suốt lifecycle.

---

## 5. useMemo & useCallback — Tối ưu hiệu suất

### Nguyên lý hoạt động

**Vấn đề gốc:** Mỗi khi component re-render, TẤT CẢ code bên trong hàm component chạy lại → tất cả biến, object, function đều được **tạo mới** (reference mới).

**`useMemo(fn, deps)`:** Cache **kết quả** của hàm tính toán. Chỉ tính lại khi `deps` thay đổi.

```jsx
const filteredUsers = useMemo(() => {
  // Phép tính nặng: lọc + sort 10,000 users
  return users
    .filter(u => u.name.includes(search))
    .sort((a, b) => a.name.localeCompare(b.name));
}, [users, search]); // Chỉ tính lại khi users hoặc search thay đổi
```

**`useCallback(fn, deps)`:** Cache **bản thân function**. Trả về cùng 1 function reference nếu `deps` không đổi.

```jsx
// KHÔNG có useCallback: mỗi lần Parent re-render, handleClick được tạo mới
// → Child nhận reference mới → Child re-render (dù dữ liệu không đổi)
const handleClick = () => { /* ... */ };

// CÓ useCallback: handleClick giữ nguyên reference
const handleClick = useCallback(() => {
  console.log(userId);
}, [userId]); // Chỉ tạo mới khi userId đổi
```

**Khi nào KHÔNG nên dùng?**
- Component nhỏ, render nhanh → chi phí so sánh deps có thể đắt hơn re-render.
- Không truyền value/function xuống child component được memo hóa.

**Khi nào NÊN dùng:**
- Phép tính nặng (filter/sort danh sách lớn) → `useMemo`.
- Function truyền làm prop cho component được bọc `React.memo` → `useCallback`.
- Function truyền vào dependency array của `useEffect` → `useCallback`.

### Câu hỏi phỏng vấn

**Q: useMemo vs useCallback khác nhau thế nào? Cho ví dụ khi nào KHÔNG nên dùng.**

**A:** `useMemo` cache **kết quả** tính toán, `useCallback` cache **reference hàm**. Thực ra `useCallback(fn, deps)` tương đương `useMemo(() => fn, deps)`. Không nên dùng khi: (1) Component nhỏ, phép tính đơn giản — chi phí compare deps + lưu cache có thể tốn hơn việc tính lại. (2) Không có child component nào dùng `React.memo` — cache function vô ích vì child vẫn re-render theo parent.

---

## 6. useReducer — State phức tạp

### Nguyên lý hoạt động

`useReducer` hoạt động giống Redux thu nhỏ: bạn viết một **reducer function** nhận `(state, action)` → trả về state mới. Dispatch action để thay đổi state.

**Tại sao dùng thay useState?** Khi state có **nhiều trường liên quan** hoặc **logic cập nhật phức tạp** (nhiều case: add, edit, delete, toggle, filter).

```jsx
const initialState = { items: [], loading: false, error: null };

function reducer(state, action) {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true, error: null };
    case 'FETCH_SUCCESS':
      return { ...state, loading: false, items: action.payload };
    case 'FETCH_ERROR':
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
}

function ProductList() {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    dispatch({ type: 'FETCH_START' });
    fetchProducts()
      .then(data => dispatch({ type: 'FETCH_SUCCESS', payload: data }))
      .catch(err => dispatch({ type: 'FETCH_ERROR', payload: err.message }));
  }, []);
}
```

**Ưu điểm:** Logic cập nhật state tập trung tại 1 nơi (reducer), dễ test, dễ debug. Phù hợp khi kết hợp với Context API để tạo "Redux nhẹ" cho toàn app.

---

## 7. Custom Hooks — Tái sử dụng logic

### Nguyên lý hoạt động

Custom Hook là **một hàm JavaScript bắt đầu bằng `use`** và có thể gọi các Hook khác bên trong. Nó cho phép **tách logic stateful ra khỏi component** để tái sử dụng.

**Ví dụ 1: `useDebounce`**
```jsx
function useDebounce(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer); // Cleanup timer cũ
  }, [value, delay]);

  return debouncedValue;
}

// Sử dụng
function SearchPage() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    if (debouncedSearch) fetchResults(debouncedSearch);
  }, [debouncedSearch]); // Chỉ gọi API khi user ngừng gõ 300ms
}
```

**Ví dụ 2: `useFetch`**
```jsx
function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController(); // Để cancel request khi unmount

    setLoading(true);
    fetch(url, { signal: controller.signal })
      .then(res => res.json())
      .then(data => { setData(data); setLoading(false); })
      .catch(err => {
        if (err.name !== 'AbortError') {
          setError(err); setLoading(false);
        }
      });

    return () => controller.abort(); // Cancel khi url đổi hoặc unmount
  }, [url]);

  return { data, loading, error };
}
```

### Câu hỏi phỏng vấn

**Q: Custom Hook khác gì một hàm utility thông thường?**

**A:** Custom Hook có thể gọi các React Hook khác (`useState`, `useEffect`,...) bên trong — hàm utility thường thì không. Custom Hook cho phép tái sử dụng **logic có state** (stateful logic), còn utility function chỉ xử lý **logic thuần** (pure computation) không liên quan đến lifecycle hay state của component.

---

## 8. React.memo — Ngăn re-render không cần thiết

### Nguyên lý hoạt động

`React.memo` là HOC bọc quanh component. Trước mỗi lần re-render, React sẽ **so sánh nông (shallow compare) props mới và props cũ**. Nếu props không đổi → bỏ qua re-render.

```jsx
const UserCard = React.memo(({ name, avatar }) => {
  console.log('UserCard render'); // Chỉ log khi name hoặc avatar thay đổi
  return (
    <div>
      <img src={avatar} />
      <h3>{name}</h3>
    </div>
  );
});
```

**Bẫy thường gặp:** Truyền object/function mới mỗi lần render → shallow compare thấy khác → memo vô tác dụng.

```jsx
// ❌ SAI — object/function tạo mới mỗi render
<UserCard
  style={{ color: 'red' }}           // Reference mới mỗi lần
  onClick={() => handleClick(id)}     // Reference mới mỗi lần
/>

// ✅ ĐÚNG — kết hợp useMemo/useCallback
const style = useMemo(() => ({ color: 'red' }), []);
const onClick = useCallback(() => handleClick(id), [id]);
<UserCard style={style} onClick={onClick} />
```

### Câu hỏi phỏng vấn

**Q: React component re-render khi nào?**

**A:** Component re-render khi: (1) State của nó thay đổi (setState). (2) Props truyền vào thay đổi. (3) **Component CHA re-render** — đây là nguyên nhân phổ biến nhất và hay bị bỏ qua. Khi cha re-render, TẤT CẢ con đều re-render theo mặc định, bất kể props có đổi hay không. `React.memo` giải quyết vấn đề (3) bằng cách chỉ re-render khi props thực sự khác.

**Q: Virtual DOM hoạt động thế nào? Tại sao React cần nó?**

**A:** Virtual DOM (VDOM) là một bản sao nhẹ (lightweight copy) của DOM thật, được lưu trong bộ nhớ dưới dạng JavaScript object. Khi state thay đổi, React tạo một VDOM mới, so sánh với VDOM cũ bằng thuật toán **Diffing** (so sánh từng node), tìm ra sự khác biệt tối thiểu, rồi chỉ cập nhật những phần thay đổi trên DOM thật (gọi là **Reconciliation**). DOM thật rất chậm khi thao tác trực tiếp (reflow/repaint tốn kém), VDOM giúp React tính toán nhanh trên JS object rồi "commit" thay đổi tối thiểu ra DOM thật.
