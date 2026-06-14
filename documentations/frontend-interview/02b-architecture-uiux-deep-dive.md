# PHẦN 2B: THIẾT KẾ, KIẾN TRÚC & UI/UX TOOLS — DEEP DIVE

---

## 4. Micro-frontend

### Nguyên lý hoạt động

**Bài toán:** Công ty có 5 team, mỗi team phụ trách 1 phần app. Monolith → conflict liên tục, build chậm, deploy phải chờ nhau.

**Giải pháp:** Chia app thành **micro-app độc lập**:

- **Shell (Host):** Layout, navigation, auth. Load các micro-app vào.
- **Micro-apps (Remotes):** Mỗi team sở hữu 1 app, tự build, tự deploy.

**Webpack Module Federation:**

```javascript
// Remote app (Team Tài khoản) — webpack.config.js
new ModuleFederationPlugin({
  name: "accountApp",
  filename: "remoteEntry.js",
  exposes: {
    "./AccountPage": "./src/AccountPage",
  },
  shared: { react: { singleton: true }, "react-dom": { singleton: true } },
});

// Host/Shell app — webpack.config.js
new ModuleFederationPlugin({
  name: "shell",
  remotes: {
    accountApp: "accountApp@https://account.example.com/remoteEntry.js",
  },
  shared: { react: { singleton: true }, "react-dom": { singleton: true } },
});

// Trong Shell app — load remote component
const AccountPage = React.lazy(() => import("accountApp/AccountPage"));
```

**`shared: { singleton: true }` là gì?** Đảm bảo tất cả micro-app dùng **cùng 1 instance** React. Nếu không, mỗi micro-app load React riêng → hooks bị lỗi (React không cho phép 2 instance chạy cùng lúc).

### Câu hỏi phỏng vấn

**Q: Micro-frontend có những thách thức gì? Cách giải quyết?**

**A:**

1. **Shared dependencies** — Nhiều app dùng chung React, lodash → load trùng. Fix: Module Federation `shared` config với `singleton: true`.
2. **Giao tiếp giữa micro-apps** — Cần truyền data (user info, cart). Fix: Custom Events, shared state store (Zustand), hoặc props drilling qua Shell.
3. **Consistent UI** — Mỗi team style khác nhau → UX không nhất quán. Fix: **Design System** chung (shared component library).
4. **Routing** — Shell router vs micro-app router conflict. Fix: Shell quản lý top-level routes, micro-app quản lý internal routes.
5. **Testing** — Test tích hợp khó vì phải chạy nhiều app. Fix: Contract testing, mock remote modules.

**Q: So sánh Micro-frontend với Monolith. Khi nào KHÔNG nên dùng Micro-frontend?**

**A:** KHÔNG nên dùng khi: (1) Team nhỏ (<5 FE devs) — overhead quản lý lớn hơn lợi ích. (2) App đơn giản — complexity không đáng. (3) Không có infra/DevOps hỗ trợ — mỗi micro-app cần CI/CD riêng, hosting riêng. Micro-frontend là giải pháp **tổ chức team** nhiều hơn giải pháp kỹ thuật — chỉ có ý nghĩa khi nhiều team cần deploy độc lập.

---

## 5. Component Libraries

### Ant Design vs Material UI

| Tiêu chí          | Ant Design                       | Material UI (MUI)          |
| ----------------- | -------------------------------- | -------------------------- |
| **Phong cách**    | Enterprise, formal               | Google Material Design     |
| **Mạnh nhất**     | Table, Form, DatePicker phức tạp | Theming, customization     |
| **Phù hợp**       | Admin panel, Banking, ERP        | Consumer app, SaaS         |
| **Customization** | ConfigProvider theme token       | sx prop + styled() + theme |

**Tùy chỉnh Theme Ant Design:**

```tsx
<ConfigProvider
  theme={{
    token: {
      colorPrimary: "#1a365d", // Màu chủ đạo ngân hàng
      borderRadius: 8,
      fontFamily: "Inter, sans-serif",
    },
    components: {
      Button: { primaryShadow: "0 2px 8px rgba(26, 54, 93, 0.3)" },
      Table: { headerBg: "#f0f5ff" },
    },
  }}
>
  <App />
</ConfigProvider>
```

### Headless UI (Radix UI)

**Nguyên lý:** Cung cấp **logic + accessibility** (keyboard, focus, ARIA) mà **KHÔNG có styling**. Developer tự viết CSS.

**Khi nào dùng?** Khi design team có thiết kế riêng, khác hoàn toàn MUI/AntD. Dùng component library → phải override rất nhiều CSS. Dùng Headless → lấy logic, tự style 100%.

```tsx
import * as Dialog from "@radix-ui/react-dialog";

<Dialog.Root>
  <Dialog.Trigger className="my-button">Mở</Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay className="my-overlay" />
    <Dialog.Content className="my-modal">
      <Dialog.Title>Xác nhận</Dialog.Title>
      <Dialog.Close>×</Dialog.Close>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>;
```

### Câu hỏi phỏng vấn

**Q: Bạn chọn component library nào cho dự án và tại sao?**

**A:** Tùy vào context:

- **Enterprise/Banking:** Ant Design — có sẵn Table, Form, DatePicker chất lượng cao, team mới dùng ngay, phù hợp admin panel.
- **Startup, design độc đáo:** Tailwind CSS + Radix UI — toàn quyền design, accessibility có sẵn.
- **Design system nội bộ:** CSS Modules + Headless components — scoped styles, zero-runtime, kiểm soát hoàn toàn.

---

## 6. CSS-in-JS

### Nguyên lý hoạt động

Viết CSS trong JavaScript, gắn style vào component. Mỗi component tạo **className unique** → không bao giờ xung đột CSS (scoped styles).

```tsx
import styled from 'styled-components';

const Button = styled.button<{ variant?: 'primary' | 'danger' }>`
  padding: 12px 24px;
  border-radius: 8px;
  background: ${({ variant }) =>
    variant === 'danger' ? '#e53e3e' : '#3182ce'};
  color: white;

  &:hover { opacity: 0.85; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

<Button variant="primary">Xác nhận</Button>
<Button variant="danger">Xóa</Button>
```

**Ưu điểm:** Scoped CSS, dynamic styles từ props, styles nằm cùng file component.
**Nhược điểm:** Runtime overhead (tạo CSS lúc render), bundle size lớn hơn.

### Xu hướng mới: Zero-runtime CSS

| Giải pháp         | Runtime | Đặc điểm                      |
| ----------------- | ------- | ----------------------------- |
| Styled Components | Có      | Dynamic, co-located           |
| Tailwind CSS      | Không   | Utility-first, purge unused   |
| CSS Modules       | Không   | Scoped bằng hashed class name |
| vanilla-extract   | Không   | TypeScript type-safe CSS      |

### Câu hỏi phỏng vấn

**Q: Runtime CSS-in-JS (Styled Components) vs Zero-runtime (Tailwind/CSS Modules) — ưu nhược?**

**A:**

- **Runtime (Styled Components, Emotion):** Ưu: dynamic styles dựa trên props, co-locate styles. Nhược: tạo CSS lúc render → chậm hơn, SSR cần cấu hình thêm, bundle size lớn.
- **Zero-runtime (Tailwind, CSS Modules):** Ưu: CSS tạo lúc build → nhanh hơn, bundle nhỏ, SSR tốt. Nhược: Tailwind class dài, CSS Modules không dynamic theo props (phải dùng className conditional).
- **Xu hướng:** Industry đang chuyển sang zero-runtime. Next.js team khuyến nghị CSS Modules hoặc Tailwind.
