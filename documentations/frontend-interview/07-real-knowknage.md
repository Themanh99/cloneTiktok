### **KIẾN THỨC THỰC TẾ: XÂY DỰNG CÁC COMMON COMPONENTS TRONG HỆ THỐNG**

Việc xây dựng các common components là cực kỳ quan trọng trong một hệ thống lớn để đảm bảo tính nhất quán, khả năng tái sử dụng và dễ bảo trì.

#### **1. Common Toast (Thông báo nổi)**

- **Yêu cầu:** Hiển thị thông báo (thành công, lỗi, cảnh báo, thông tin) ở một vị trí cố định trên màn hình, tự động biến mất sau vài giây hoặc có nút đóng.
- **Cách xây dựng:**
  1.  **Toast Item Component:** `Toast.tsx`
      - Nhận `type` (success, error, warning, info), `message`, `duration`, `onClose` làm props.
      - Sử dụng `useEffect` để thiết lập timer tự đóng.
      - Sử dụng CSS transitions hoặc `react-transition-group` để tạo hiệu ứng vào/ra mượt mà.
      - Ví dụ:

        ```jsx
        // components/Toast/ToastItem.jsx
        import React, { useEffect, useState } from "react";
        import "./ToastItem.css"; // CSS cho toast

        const ToastItem = ({
          id,
          message,
          type = "info",
          duration = 3000,
          onClose,
        }) => {
          const [isVisible, setIsVisible] = useState(true);

          useEffect(() => {
            const timer = setTimeout(() => {
              setIsVisible(false);
              setTimeout(() => onClose(id), 300); // Đợi hiệu ứng fade out
            }, duration);
            return () => clearTimeout(timer);
          }, [duration, onClose, id]);

          return (
            <div
              className={`toast-item toast-${type} ${isVisible ? "show" : "hide"}`}
            >
              <p>{message}</p>
              <button
                onClick={() => {
                  setIsVisible(false);
                  setTimeout(() => onClose(id), 300);
                }}
              >
                &times;
              </button>
            </div>
          );
        };
        export default ToastItem;
        ```

  2.  **Toast Container Component:** `ToastContainer.tsx`
      - Là nơi chứa tất cả các Toast Item đang hoạt động.
      - Thường được đặt ở cấp cao nhất của ứng dụng (ví dụ: trong `App.js` hoặc `layout`).
      - Sử dụng state để quản lý danh sách các toasts (`[{ id, message, type }]`).
      - Khi một toast cần hiển thị, thêm nó vào state này. Khi nó đóng, xóa nó khỏi state.
  3.  **Toast Hook/Service:** `useToast.js` hoặc `toastService.js`
      - Đây là cách bạn "trigger" một toast từ bất kỳ đâu trong ứng dụng.
      - Sử dụng Context API hoặc một thư viện quản lý state nhẹ để truyền hàm `addToast` xuống dưới.
      - Hoặc đơn giản hơn, bạn có thể tạo một đối tượng global với các phương thức `toast.success('message')`, `toast.error('message')`.
      - Ví dụ Context API:

        ```jsx
        // contexts/ToastContext.js
        import React, {
          createContext,
          useState,
          useContext,
          useCallback,
        } from "react";
        import ToastItem from "../components/Toast/ToastItem";
        import { createPortal } from "react-dom";

        const ToastContext = createContext();
        let nextId = 0; // Để tạo ID duy nhất cho mỗi toast

        export const ToastProvider = ({ children }) => {
          const [toasts, setToasts] = useState([]);

          const addToast = useCallback((message, type = "info", duration) => {
            const id = nextId++;
            setToasts((prevToasts) => [
              ...prevToasts,
              { id, message, type, duration },
            ]);
          }, []);

          const removeToast = useCallback((id) => {
            setToasts((prevToasts) =>
              prevToasts.filter((toast) => toast.id !== id),
            );
          }, []);

          return (
            <ToastContext.Provider value={{ addToast }}>
              {children}
              {createPortal(
                // Dùng Portal để toast luôn nằm trên cùng
                <div className="toast-container">
                  {toasts.map((toast) => (
                    <ToastItem
                      key={toast.id}
                      id={toast.id}
                      message={toast.message}
                      type={toast.type}
                      duration={toast.duration}
                      onClose={removeToast}
                    />
                  ))}
                </div>,
                document.body, // Hoặc một div cụ thể ngoài root của app
              )}
            </ToastContext.Provider>
          );
        };

        export const useToast = () => {
          return useContext(ToastContext);
        };

        // App.js
        // <ToastProvider>
        //   <App />
        // </ToastProvider>

        // Trong component nào đó
        // const { addToast } = useToast();
        // addToast('Đăng nhập thành công!', 'success');
        ```

- **Key takeaways:** Sử dụng `createPortal` để đảm bảo toast render ra ngoài luồng DOM chính, tránh bị ảnh hưởng bởi CSS của các component khác.

#### **2. Common Modal (Hộp thoại Pop-up)**

- **Yêu cầu:** Hiển thị nội dung (form, thông báo xác nhận, chi tiết) trên một lớp phủ mờ (overlay), có nút đóng, có thể đóng bằng cách click ra ngoài hoặc phím `Esc`.
- **Cách xây dựng:**
  1.  **Modal Component:** `Modal.tsx`
      - Nhận `isOpen` (boolean), `onClose` (function), `children` (nội dung bên trong).
      - Sử dụng `createPortal` để render ra ngoài luồng DOM chính.
      - `useEffect` để lắng nghe sự kiện `keydown` (phím Esc).
      - Kiểm soát hiển thị/ẩn overlay và modal content dựa trên `isOpen`.
      - Ví dụ:

        ```jsx
        // components/Modal/Modal.jsx
        import React, { useEffect } from "react";
        import { createPortal } from "react-dom";
        import "./Modal.css"; // CSS cho modal và overlay

        const Modal = ({ isOpen, onClose, children, title }) => {
          if (!isOpen) return null;

          // Đóng modal khi nhấn Esc
          useEffect(() => {
            const handleEscape = (event) => {
              if (event.key === "Escape") {
                onClose();
              }
            };
            document.addEventListener("keydown", handleEscape);
            return () => {
              document.removeEventListener("keydown", handleEscape);
            };
          }, [onClose]);

          return createPortal(
            <div className="modal-overlay" onClick={onClose}>
              <div
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
              >
                {" "}
                {/* Ngăn chặn đóng khi click vào nội dung */}
                <div className="modal-header">
                  {title && <h2>{title}</h2>}
                  <button onClick={onClose} className="modal-close-button">
                    &times;
                  </button>
                </div>
                <div className="modal-body">{children}</div>
              </div>
            </div>,
            document.body, // Hoặc một div cụ thể ngoài root của app
          );
        };
        export default Modal;
        ```

  2.  **Cách sử dụng:**

      ```jsx
      // Trong một component khác
      import React, { useState } from "react";
      import Modal from "../components/Modal/Modal";

      function MyPage() {
        const [isModalOpen, setIsModalOpen] = useState(false);

        const handleOpenModal = () => setIsModalOpen(true);
        const handleCloseModal = () => setIsModalOpen(false);

        return (
          <div>
            <h1>Trang của tôi</h1>
            <button onClick={handleOpenModal}>Mở Modal</button>

            <Modal
              isOpen={isModalOpen}
              onClose={handleCloseModal}
              title="Xác nhận xóa"
            >
              <p>Bạn có chắc chắn muốn xóa mục này không?</p>
              <button
                onClick={() => {
                  /* Xử lý logic xóa */ handleCloseModal();
                }}
              >
                Xóa
              </button>
              <button onClick={handleCloseModal}>Hủy</button>
            </Modal>
          </div>
        );
      }
      export default MyPage;
      ```

- **Key takeaways:** `stopPropagation()` khi click vào nội dung modal để tránh đóng modal khi click bên trong. Quản lý `isOpen` state tại component cha.

#### **Cách trả lời phỏng vấn về việc xây dựng Toast và Modal:**

**Với Toast Component:**

- **Vấn đề giải quyết:** Ứng dụng cần một hệ thống thông báo global, có thể gọi từ bất kỳ đâu (API error, success submit) mà không phải chèn component Toast vào từng trang một.
- **Giải pháp:**
  - Em áp dụng **Context API** (hoặc Redux/Zustand) để tạo một `ToastProvider` bao bọc toàn bộ ứng dụng, cung cấp một hàm `addToast` có thể truy cập ở mọi nơi thông qua custom hook `useToast`.
  - Để tránh Toast component ảnh hưởng đến bố cục DOM hiện tại (z-index conflicts, overflow hidden), em sử dụng **`React.createPortal`** để render list các Toast ra hẳn `document.body` (hoặc một root div riêng).
  - Về mặt UI/UX, em thêm CSS transition để Toast xuất hiện mượt mà. Mỗi Toast tự quản lý lifecycle của nó bằng `setTimeout` để tự động unmount sau khoảng 3-5 giây. Em cũng chú ý dọn dẹp (cleanup) `setTimeout` trong `useEffect` để tránh memory leak.

**Với Modal Component:**

- **Vấn đề giải quyết:** Tạo một hộp thoại popup có thể dùng lại nhiều lần, chặn tương tác với nền bên dưới (overlay) và độc lập với cấu trúc HTML hiện hành.
- **Giải pháp:**
  - Tương tự Toast, em dùng **`React.createPortal`** để mount Modal ra ngoài root DOM (thường là `document.body`). Điều này giải quyết triệt để lỗi bị che khuất bởi các phần tử cha có `overflow: hidden` hoặc `z-index` thấp.
  - Về mặt tương tác: Em bắt sự kiện `onClick` ở lớp Overlay để đóng Modal khi user click ra ngoài. Đồng thời phải dùng `e.stopPropagation()` ở phần nội dung Modal để click vào nội dung không bị đóng.
  - Về mặt Accessibility (a11y): Em sử dụng `useEffect` để gắn event listener lắng nghe phím `Escape` (keydown) giúp user đóng Modal bằng bàn phím. (Nâng cao hơn: em còn implement _Focus Trap_ để giữ focus của phím Tab chỉ loanh quanh trong Modal khi Modal đang mở, cải thiện trải nghiệm người dùng bàn phím).

#### **3. Thiết kế Debounce trong React**

**Debounce là gì?** Là kỹ thuật trì hoãn việc thực thi một hàm cho đến khi một khoảng thời gian yên tĩnh (không có sự kiện nào được kích hoạt) trôi qua. Rất hay dùng cho tính năng Live Search (gõ xong mới gọi API, tránh gọi liên tục mỗi khi gõ 1 ký tự).

**Cách 1: Custom Hook `useDebounce` (Cách phổ biến và React-way nhất)**

Hook này nhận vào một `value` và một `delay`, trả về `value` đã được debounce.

```jsx
import { useState, useEffect } from "react";

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Mỗi khi value hoặc delay thay đổi, set lại một timeout mới
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup function: Hủy timeout cũ nếu value thay đổi trước khi delay kết thúc
    // Đây là cốt lõi của debounce trong React useEffect
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
export default useDebounce;
```

**Cách sử dụng `useDebounce` trong Component:**

```jsx
import React, { useState, useEffect } from "react";
import useDebounce from "./useDebounce";

function SearchInput() {
  const [searchTerm, setSearchTerm] = useState("");
  // Chỉ khi người dùng ngừng gõ 500ms, debouncedSearchTerm mới thay đổi
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    if (debouncedSearchTerm) {
      // Gọi API tìm kiếm ở đây (chỉ chạy khi user đã gõ xong)
      console.log("Fetching data for:", debouncedSearchTerm);
    }
  }, [debouncedSearchTerm]);

  return (
    <input
      type="text"
      placeholder="Tìm kiếm..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
    />
  );
}
```

**Cách 2: Sử dụng thư viện `lodash/debounce` kết hợp `useCallback`**
Nếu chỉ muốn debounce một hàm thực thi (thay vì giá trị), bạn phải kết hợp với `useCallback` để đảm bảo hàm debounce không bị tạo lại sau mỗi lần component re-render.

```jsx
import React, { useState, useCallback } from "react";
import debounce from "lodash/debounce";

function SearchInput() {
  const [searchTerm, setSearchTerm] = useState("");

  // Dùng useCallback để giữ reference của hàm debounce qua các lần render
  const debouncedFetchData = useCallback(
    debounce((query) => {
      console.log("Fetching API for:", query);
    }, 500),
    [], // dependency rỗng vì ta muốn tạo hàm này đúng 1 lần khi mount
  );

  const handleChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value); // Update UI text input ngay lập tức
    debouncedFetchData(value); // Hàm gọi API bị delay
  };

  return <input value={searchTerm} onChange={handleChange} />;
}
```

#### **4. Một số Custom Hooks phổ biến khác (Hay hỏi trong phỏng vấn)**

Dưới đây là các custom hooks hay gặp để đánh giá khả năng hiểu React lifecycle và tách biệt logic của bạn:

1.  **`useOnClickOutside`**: (Rất hay dùng kèm với Modal, Dropdown, Menu)
    - **Mục đích:** Phát hiện user click ra ngoài một element cụ thể để đóng nó lại.
    - **Cách làm:** Truyền vào một `ref` và một `handler`. Trong `useEffect`, lắng nghe sự kiện `mousedown` hoặc `touchstart` trên `document`. Nếu click target không nằm trong `ref.current` (`!ref.current.contains(e.target)`) thì kích hoạt `handler()`.
2.  **`useWindowSize`**:
    - **Mục đích:** Lấy kích thước cửa sổ trình duyệt (width, height) để làm logic responsive bằng JS.
    - **Cách làm:** Lắng nghe sự kiện `resize` trên `window` trong `useEffect` và update state. Nhớ `removeEventListener` lúc unmount (cleanup).
3.  **`useLocalStorage`**:
    - **Mục đích:** Quản lý state đồng bộ tự động với `localStorage` (ví dụ: theme dark/light, token).
    - **Cách làm:** Khởi tạo state bằng việc đọc từ `localStorage`. Trả về mảng `[value, setValue]`. Trong hàm `setValue` custom, vừa update React state, vừa gọi `localStorage.setItem`.
4.  **`usePrevious`**:
    - **Mục đích:** Lấy giá trị prop hoặc state của lần render trước đó.
    - **Cách làm:** Dùng `useRef` để lưu giá trị. Cập nhật `ref.current = value` trong `useEffect` (chạy sau khi render), và return `ref.current` ra ngoài (trả về giá trị của lần render trước).
5.  **`useToggle`**:
    - **Mục đích:** Chuyển đổi trạng thái boolean (true/false) dễ dàng và gọn gàng (ví dụ: mở/đóng menu).
    - **Cách làm:** Quản lý một boolean state và trả về `[value, toggleFunction]`.
6.  **`useFetch`**:
    - **Mục đích:** Gom logic gọi API (loading, error, data) vào một chỗ.
    - **Cách làm:** Quản lý 3 states: `data`, `loading`, `error`. Dùng `useEffect` gọi fetch API và update các state tương ứng. _(Lưu ý: Hiện nay React Query thường được dùng thay thế việc tự viết `useFetch`, nhưng biết cách viết thủ công vẫn rất hữu ích)._

#### **5. Các Common Components khác cần trong hệ thống**

- **Button:** `Button.tsx` (kiểm soát `variant` (primary, secondary, danger), `size`, `disabled`, `loading` state).
  - Sử dụng Props `children`, `onClick`, `type` (submit, button), `className`.
  - Ví dụ: `Button variant="primary" size="large" onClick={handleSubmit} loading={isLoading}>Submit</Button>`
- **Input Field:** `Input.tsx` (kiểm soát `type`, `value`, `onChange`, `placeholder`, `error` message).
  - Có thể tích hợp `label`, `helperText`.
  - Ví dụ: `Input type="text" label="Tên đăng nhập" value={username} onChange={handleUsernameChange} error={errors.username} />`
- **Dropdown/Select:** `Select.tsx` (kiểm soát `options`, `value`, `onChange`, `placeholder`).
  - Hỗ trợ single/multi-select.
- **Loading Spinner:** `Spinner.tsx` (hiển thị khi đang tải dữ liệu).
  - Đơn giản chỉ là một icon quay tròn, hoặc animation CSS.
- **Table:** `Table.tsx` (hiển thị dữ liệu dạng bảng, hỗ trợ `pagination`, `sorting`, `filtering`).
  - Đây là một component phức tạp hơn, có thể sử dụng thư viện như `react-table` hoặc xây dựng từ đầu với các `TableHead`, `TableBody`, `TableRow`, `TableCell` con.
- **Pagination:** `Pagination.tsx` (điều hướng qua các trang dữ liệu).
- **Alert Message:** Tương tự Toast nhưng thường hiển thị cố định trong một khu vực trên trang, không tự biến mất.
- **Card:** `Card.tsx` (component bao bọc nội dung, tạo bố cục rõ ràng).

**Lưu ý khi xây dựng Common Components:**

- **Design System:** Cố gắng tuân thủ một hệ thống thiết kế (Design System) nhất quán (ví dụ: Material Design, Ant Design principles) để đảm bảo UI/UX đồng bộ.
- **Accessibility (A11y):** Đảm bảo các component dễ tiếp cận cho người dùng khuyết tật (sử dụng WAI-ARIA roles, keyboard navigation).
- **Testability:** Viết unit test cho các component để đảm bảo chúng hoạt động đúng trong mọi trường hợp.
- **Storybook:** Sử dụng Storybook để phát triển, tài liệu hóa và demo các common components một cách độc lập. Điều này giúp cả dev và designer dễ dàng xem và sử dụng các component.
- **TypeScript:** Sử dụng TypeScript để định nghĩa props interface rõ ràng, giúp tránh lỗi và cải thiện khả năng đọc code.
