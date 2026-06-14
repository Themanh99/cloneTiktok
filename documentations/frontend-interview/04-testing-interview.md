# PHẦN 4: TESTING & CÂU HỎI PHỎNG VẤN TỔNG HỢP

---

## 2. Testing — Hiểu sâu

### 2.1. Unit Test (Jest + React Testing Library)

**Nguyên lý React Testing Library:** Test **hành vi** (behavior), KHÔNG test **chi tiết triển khai** (implementation). Query elements giống cách user nhìn thấy (text, label, role), KHÔNG query bằng class/id.

```jsx
// ❌ SAI — test implementation detail
expect(component.state.count).toBe(1);
expect(wrapper.find(".counter-value").text()).toBe("1");

// ✅ ĐÚNG — test behavior (user nhìn thấy gì)
import { render, screen, fireEvent } from "@testing-library/react";

test("tăng counter khi click", () => {
  render(<Counter />);
  const button = screen.getByRole("button", { name: /tăng/i });
  fireEvent.click(button);
  expect(screen.getByText("1")).toBeInTheDocument();
});
```

**Test Custom Hook:**

```jsx
import { renderHook, act } from "@testing-library/react";
import { useCounter } from "./useCounter";

test("increment tăng count lên 1", () => {
  const { result } = renderHook(() => useCounter());
  act(() => {
    result.current.increment();
  });
  expect(result.current.count).toBe(1);
});
```

### 2.2. Integration Test

Test nhiều components tương tác với nhau, thường kèm mock API.

```jsx
import { rest } from "msw";
import { setupServer } from "msw/node";

const server = setupServer(
  rest.get("/api/products", (req, res, ctx) =>
    res(ctx.json([{ id: 1, name: "iPhone" }])),
  ),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test("hiển thị danh sách sản phẩm", async () => {
  render(<ProductList />);
  expect(await screen.findByText("iPhone")).toBeInTheDocument();
});
```

### 2.3. E2E Test (Playwright)

```javascript
test("user đăng nhập và thấy dashboard", async ({ page }) => {
  await page.goto("/login");
  await page.fill('[name="email"]', "test@example.com");
  await page.fill('[name="password"]', "123456");
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL("/dashboard");
  await expect(page.locator("h1")).toHaveText("Welcome");
});
```

### Câu hỏi phỏng vấn

**Q: Bạn viết test cho component nào trước? Chiến lược test của bạn?**

**A:** Em ưu tiên test theo **Testing Trophy** (Kent C. Dodds): nhiều Integration test nhất, ít Unit test cho logic phức tạp, vài E2E test cho happy paths quan trọng. Components em test trước: (1) Form validation logic. (2) Common components (Modal, Toast) vì được dùng ở mọi nơi. (3) Business logic hooks (useCart, useAuth). E2E chỉ test các luồng chính: đăng nhập, tạo đơn hàng, thanh toán.

---

## 4. Security cơ bản cho FE

### XSS (Cross-Site Scripting)

**Nguyên lý:** Attacker inject mã JavaScript vào trang web. Khi victim truy cập, mã đó chạy trên trình duyệt victim, có thể đánh cắp cookie/token.

**React bảo vệ tự động:** JSX tự động escape HTML. `<p>{userInput}</p>` sẽ hiển thị text thuần, không execute script.

**Nguy hiểm:** `dangerouslySetInnerHTML` — bỏ qua escape. KHÔNG BAO GIỜ dùng với user input chưa sanitize.

### CORS (Cross-Origin Resource Sharing)

**Nguyên lý:** Trình duyệt chặn request từ `domain-a.com` đến `domain-b.com` (Same-Origin Policy). CORS là cơ chế cho phép server nói: "Tôi cho phép domain X gọi API của tôi" thông qua header `Access-Control-Allow-Origin`.

**Lỗi phổ biến:** CORS lỗi ở local dev → fix bằng proxy trong Vite/Webpack config, KHÔNG phải disable CORS.

---

## 5. BỘ CÂU HỎI PHỎNG VẤN TỔNG HỢP

### React & Architecture

**Q: Giải thích Reconciliation trong React.**

**A:** Reconciliation là quá trình React so sánh Virtual DOM cũ và mới (Diffing) để tìm ra thay đổi tối thiểu cần áp dụng lên DOM thật. React dùng 2 giả định: (1) Hai element khác type → xóa cây cũ, tạo cây mới. (2) `key` prop giúp React nhận diện element nào đã có, element nào mới trong danh sách. Đó là lý do KHÔNG dùng `index` làm key khi danh sách có thể xáo trộn/xóa — React sẽ update sai element.

**Q: React Fiber là gì?**

**A:** Fiber là engine rendering mới của React (từ v16). Fiber cho phép React **chia nhỏ rendering thành các đơn vị công việc (units of work)** và **tạm dừng/resume** quá trình render. Nhờ vậy React có thể ưu tiên render UI quan trọng trước (animation, user input) và hoãn render phụ (danh sách dài). Đây là nền tảng cho Concurrent Mode, `useTransition`, `Suspense`.

**Q: `useTransition` và `useDeferredValue` dùng khi nào?**

**A:** Cả hai đều đánh dấu cập nhật là "không khẩn cấp" (non-urgent):

- `useTransition`: Bọc quanh `setState` → React hoãn re-render đó lại, ưu tiên UI khẩn cấp (input, animation). Cho biết trạng thái `isPending`.
- `useDeferredValue`: Tạo "bản copy trễ" của một giá trị. Component dùng giá trị trễ sẽ re-render sau.

```jsx
// useTransition — khi user gõ search, danh sách kết quả không lag
const [isPending, startTransition] = useTransition();
const handleSearch = (text) => {
  setSearchInput(text); // Urgent — cập nhật input ngay
  startTransition(() => {
    setFilteredResults(filter(text)); // Non-urgent — hoãn lại
  });
};
```

### Câu hỏi Behavioral (Kỹ năng mềm)

**Q: Bạn xử lý conflict code khi làm việc nhóm thế nào?**

**A:** (1) Chia task rõ ràng theo feature/module — giảm conflict. (2) Pull `main` thường xuyên, rebase trước khi push. (3) Khi conflict xảy ra, em liên hệ trực tiếp người viết code conflict để thảo luận giữ phần nào. (4) Code Review kỹ trước khi merge — bắt được conflict logic sớm.

**Q: Khi gặp bug production khẩn cấp, bạn xử lý thế nào?**

**A:** (1) Xác nhận mức độ ảnh hưởng (bao nhiêu user, tính năng nào). (2) Reproduce bug. (3) Kiểm tra Sentry/log để xác định nguyên nhân. (4) Nếu cần hotfix ngay: tạo branch từ `main`, fix, test, deploy. (5) Sau đó viết post-mortem + bổ sung test case cho bug đó.

**Q: Bạn approach một feature mới phức tạp như thế nào?**

**A:** (1) Đọc kỹ requirement, hỏi BA/PM để clarify edge case. (2) Thiết kế component tree + data flow trên giấy/whiteboard. (3) Xác định API cần thiết, thảo luận contract với BE. (4) Code theo thứ tự: common components → business logic hooks → pages → integration test. (5) Self-review + demo trước khi submit PR.
