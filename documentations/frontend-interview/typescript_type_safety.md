# TypeScript — Type Safety (Ôn Phỏng Vấn Chuyên Sâu)

> [!TIP]
> Tài liệu này được thiết kế theo phong cách **"giải thích cho người phỏng vấn nghe"**. Mỗi phần đều có code ví dụ thực tế trong React/TypeScript, câu hỏi mẫu, và cách trả lời chuyên nghiệp.

---

## Mục lục

1. [Type vs Interface](#1-type-vs-interface)
2. [Union Type](#2-union-type)
3. [Generic Type](#3-generic-type)
4. [any vs unknown](#4-any-vs-unknown)
5. [Utility Types](#5-utility-types-trọng-tâm-phỏng-vấn)
   - [Partial\<T\>](#51-partialt)
   - [Pick\<T, K\>](#52-pickt-k)
   - [Omit\<T, K\>](#53-omitt-k)
   - [Record\<K, V\>](#54-recordk-v)
   - [ReturnType\<T\>](#55-returntypet)
   - [Readonly\<T\> (bonus)](#56-readonlyt-bonus)
   - [Required\<T\> (bonus)](#57-requiredt-bonus)
   - [Extract & Exclude (bonus)](#58-extract--exclude-bonus)
6. [Tuples](#6-tuples)
7. [Bảng tổng hợp & Cheat Sheet](#7-bảng-tổng-hợp--cheat-sheet)
8. [Câu hỏi phỏng vấn thực chiến](#8-câu-hỏi-phỏng-vấn-thực-chiến)

---

## 1. Type vs Interface

### Định nghĩa

---

**`interface`** — Là một **"bản vẽ kỹ thuật"** mô tả chính xác một object phải có những property gì và kiểu dữ liệu của từng property là gì. Nó **chỉ dùng được cho object** (bao gồm cả function signature và class).

Hãy nghĩ interface như một **hợp đồng** (contract): "Bất kỳ object nào muốn được gọi là `User` thì **bắt buộc** phải có `id` kiểu number, `name` kiểu string, `email` kiểu string."

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

// Mọi object gán cho biến kiểu User phải tuân thủ "hợp đồng" này
const user: User = { id: 1, name: 'An', email: 'an@mail.com' }; // ✅
const bad: User = { id: 1, name: 'An' }; // ❌ Thiếu email → vi phạm hợp đồng
```

---

**`type`** (Type Alias) — Là một **"biệt danh"** (alias) để đặt tên cho **BẤT KỲ kiểu dữ liệu nào** trong TypeScript. Không chỉ giới hạn ở object — bạn có thể đặt tên cho union, tuple, primitive, function, hoặc thậm chí kết hợp nhiều kiểu phức tạp lại với nhau.

Hãy nghĩ `type` như cách bạn **đặt tên tắt** cho một công thức dài: thay vì viết đi viết lại `string | number`, bạn đặt cho nó cái tên `ID` để dùng lại.

```typescript
// Đặt tên cho kiểu primitive kết hợp (Union) — interface KHÔNG làm được
type ID = string | number;

// Đặt tên cho Tuple — interface KHÔNG làm được
type Coordinate = [number, number];

// Đặt tên cho Function signature
type Callback = (data: string) => void;

// Đặt tên cho Object — CẢ HAI đều làm được (giống interface)
type User = {
  id: number;
  name: string;
};
```

> [!NOTE]
> **Tóm gọn sự khác biệt cốt lõi:**
> - `interface` = **chuyên gia cho object** — có Declaration Merging, extends rõ ràng, báo lỗi conflict chặt chẽ.
> - `type` = **đa năng cho mọi thứ** — object, union, tuple, primitive, computed type... cái gì cũng được.

### Bảng so sánh chi tiết

| Tính năng | `interface` | `type` |
|-----------|-------------|--------|
| Mô tả Object shape | ✅ | ✅ |
| Union type (`A \| B`) | ❌ | ✅ |
| Intersection (`A & B`) | ✅ (extends) | ✅ (`&`) |
| Tuple | ❌ | ✅ |
| Primitive alias (`type ID = string`) | ❌ | ✅ |
| **Declaration Merging** | ✅ | ❌ |
| Extends / Kế thừa | ✅ `extends` | ✅ `&` (intersection) |
| `implements` (class) | ✅ | ✅ |

### Declaration Merging — Điểm khác biệt then chốt

Đây là tính năng **chỉ interface có**, và là câu trả lời "điểm cộng" khi phỏng vấn.

```typescript
// ✅ Interface: Declaration Merging — tự động hợp nhất
interface Window {
  myCustomProperty: string;
}
// TypeScript tự động merge vào interface Window có sẵn của DOM
// => window.myCustomProperty giờ hợp lệ

// ❌ Type: Lỗi ngay — Duplicate identifier
type Window = {    // Error: Duplicate identifier 'Window'
  myCustomProperty: string;
};
```

**Ứng dụng thực tế của Declaration Merging:**
- Mở rộng type của thư viện bên thứ 3 (ví dụ: thêm field vào `Request` của Express)
- Khai báo global types (ví dụ: mở rộng `Window` interface)
- Plugin systems

```typescript
// Ví dụ thực tế: Mở rộng Express Request
declare namespace Express {
  interface Request {
    user?: {
      id: string;
      role: 'admin' | 'user';
    };
  }
}
// Giờ req.user có type safety mà không cần cast
```

### Kế thừa: extends vs Intersection (&)

```typescript
// Interface: Dùng extends
interface Animal {
  name: string;
}
interface Dog extends Animal {
  breed: string;
}

// Type: Dùng Intersection (&)
type Animal = {
  name: string;
};
type Dog = Animal & {
  breed: string;
};
```

> [!IMPORTANT]
> **Khác biệt quan trọng khi có conflict:**
> - `interface extends` sẽ **báo lỗi** nếu property bị xung đột kiểu → An toàn hơn.
> - `type &` (intersection) sẽ **tạo ra kiểu `never`** khi conflict → Lỗi ẩn, khó debug.

```typescript
interface A {
  x: number;
}
// ❌ Error: Type 'string' is not assignable to type 'number'
interface B extends A {
  x: string; // Compiler báo lỗi ngay!
}

type A = { x: number };
type B = A & { x: string }; // Không lỗi, nhưng x thành `never`
// const b: B = { x: ??? } // Không thể gán giá trị gì cho x cả!
```

### Khi nào dùng cái nào? (Câu trả lời phỏng vấn)

> **"Tôi follow theo convention của team, nhưng nguyên tắc chung của tôi là:"**
>
> 1. **`interface`** — Khi mô tả shape của **object**, đặc biệt là **API response**, **component props**, hoặc khi cần **mở rộng** (declaration merging).
> 2. **`type`** — Khi cần **Union**, **Tuple**, **computed types**, hoặc bất cứ thứ gì **không phải object shape đơn thuần**.
>
> Trong dự án React, tôi thường dùng `interface` cho Props vì nó rõ ràng về intent, dễ extend, và convention phổ biến nhất.

```typescript
// Props component → interface
interface ButtonProps {
  label: string;
  variant: 'primary' | 'secondary'; // Union inline thì OK
  onClick: () => void;
}

// Union type, computed type → type
type Theme = 'light' | 'dark';
type ApiResponse<T> = {
  data: T;
  error: string | null;
  status: 'loading' | 'success' | 'error';
};
```

---

## 2. Union Type

### Định nghĩa

Union Type cho phép một biến có thể là **một trong nhiều kiểu khác nhau**, dùng ký hiệu `|`.

```typescript
type Status = 'loading' | 'success' | 'error';
type ID = string | number;

let userId: ID;
userId = 123;      // ✅
userId = 'abc-def'; // ✅
userId = true;      // ❌ Error
```

### Discriminated Unions (Union có phân biệt) — HAY BỊ HỎI

Đây là pattern cực kỳ mạnh, dùng một property chung (discriminant) để TypeScript tự **thu hẹp (narrow)** kiểu.

```typescript
// Mỗi trạng thái có cấu trúc dữ liệu riêng
type ApiState<T> =
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string };

function renderResult(state: ApiState<User[]>) {
  switch (state.status) {
    case 'loading':
      return <Spinner />;
    case 'success':
      // ✅ TypeScript TỰ BIẾT state.data tồn tại ở đây!
      return state.data.map(user => <UserCard key={user.id} user={user} />);
    case 'error':
      // ✅ TypeScript TỰ BIẾT state.error tồn tại ở đây!
      return <ErrorMessage message={state.error} />;
  }
}
```

> [!TIP]
> **Cách giải thích cho người phỏng vấn:** "Discriminated Union giúp tôi model state machine trong ứng dụng. Thay vì có `data`, `error`, `isLoading` rời rạc — dễ tạo ra trạng thái bất hợp lệ (ví dụ `isLoading=true` nhưng `data` vẫn có giá trị) — tôi dùng union để đảm bảo **chỉ có các tổ hợp hợp lệ** mới tồn tại."

### Type Narrowing (Thu hẹp kiểu)

TypeScript dùng control flow analysis để tự thu hẹp kiểu trong các nhánh điều kiện:

```typescript
function processValue(value: string | number | null) {
  if (value === null) {
    // TypeScript biết: value là null
    return;
  }
  if (typeof value === 'string') {
    // TypeScript biết: value là string
    console.log(value.toUpperCase()); // ✅ Gọi method của string OK
  } else {
    // TypeScript biết: value là number
    console.log(value.toFixed(2)); // ✅ Gọi method của number OK
  }
}
```

### Ví dụ thực tế trong React

```typescript
// Union cho Event Handler
type ButtonAction =
  | { type: 'navigate'; url: string }
  | { type: 'submit'; formId: string }
  | { type: 'custom'; handler: () => void };

interface ActionButtonProps {
  label: string;
  action: ButtonAction; // Discriminated Union
}

function ActionButton({ label, action }: ActionButtonProps) {
  const handleClick = () => {
    switch (action.type) {
      case 'navigate':
        window.location.href = action.url; // ✅ TypeScript biết có .url
        break;
      case 'submit':
        document.getElementById(action.formId)?.submit(); // ✅
        break;
      case 'custom':
        action.handler(); // ✅
        break;
    }
  };

  return <button onClick={handleClick}>{label}</button>;
}
```

---

## 3. Generic Type

### Định nghĩa

Generic cho phép tạo các **thành phần có thể tái sử dụng** mà vẫn giữ nguyên type safety. Nghĩ như một **"biến cho kiểu dữ liệu"** — bạn không cố định kiểu khi viết, mà để người dùng truyền vào khi sử dụng.

```typescript
// Không có Generic: Phải viết nhiều hàm
function getFirstString(arr: string[]): string { return arr[0]; }
function getFirstNumber(arr: number[]): number { return arr[0]; }

// ✅ Có Generic: Một hàm cho tất cả
function getFirst<T>(arr: T[]): T {
  return arr[0];
}

getFirst<string>(['a', 'b']); // return type: string
getFirst([1, 2, 3]);          // TypeScript tự suy ra T = number
```

### Generic Constraints (Ràng buộc)

Dùng `extends` để giới hạn kiểu mà Generic chấp nhận:

```typescript
// T phải là object có property 'id'
function findById<T extends { id: number }>(items: T[], id: number): T | undefined {
  return items.find(item => item.id === id);
}

// ✅ OK - User có property id: number
interface User { id: number; name: string; }
findById<User>([{ id: 1, name: 'An' }], 1);

// ❌ Error - string không có property id
findById<string>(['hello'], 1);
```

### `keyof` — Lấy tất cả property names

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

type UserKeys = keyof User; // "id" | "name" | "email"

// Ứng dụng thực tế: Hàm lấy value an toàn
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user: User = { id: 1, name: 'An', email: 'an@mail.com' };
const name = getProperty(user, 'name');   // ✅ type: string
const id = getProperty(user, 'id');       // ✅ type: number
const foo = getProperty(user, 'foo');     // ❌ Error: 'foo' không phải key của User
```

### Generic trong React — Ứng dụng thực tế

#### 1. Generic Component

```typescript
// Component Select có thể dùng với bất kỳ kiểu option nào
interface SelectProps<T> {
  options: T[];
  value: T;
  onChange: (value: T) => void;
  getLabel: (option: T) => string;
  getKey: (option: T) => string | number;
}

function Select<T>({ options, value, onChange, getLabel, getKey }: SelectProps<T>) {
  return (
    <select
      value={String(getKey(value))}
      onChange={(e) => {
        const selected = options.find(opt => String(getKey(opt)) === e.target.value);
        if (selected) onChange(selected);
      }}
    >
      {options.map(opt => (
        <option key={getKey(opt)} value={String(getKey(opt))}>
          {getLabel(opt)}
        </option>
      ))}
    </select>
  );
}

// Sử dụng với User
interface User { id: number; name: string; }
<Select<User>
  options={users}
  value={selectedUser}
  onChange={setSelectedUser}
  getLabel={(u) => u.name}   // ✅ TypeScript biết u là User
  getKey={(u) => u.id}       // ✅
/>
```

#### 2. Generic Custom Hook

```typescript
// useFetch hook dùng Generic để type-safe response
function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    
    fetch(url, { signal: controller.signal })
      .then(res => res.json())
      .then((json: T) => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        if (!controller.signal.aborted) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [url]);

  return { data, loading, error };
}

// Sử dụng — response tự động có type!
interface Product { id: number; title: string; price: number; }
const { data } = useFetch<Product[]>('/api/products');
// data có type: Product[] | null  ✅
```

#### 3. Generic API Service

```typescript
// Wrapper cho fetch API với full type safety
async function apiRequest<TResponse, TBody = undefined>(
  url: string,
  options?: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: TBody;
  }
): Promise<TResponse> {
  const response = await fetch(url, {
    method: options?.method ?? 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });
  
  if (!response.ok) throw new Error(`API Error: ${response.status}`);
  return response.json() as Promise<TResponse>;
}

// Sử dụng
interface CreateUserDTO { name: string; email: string; }
interface UserResponse { id: number; name: string; email: string; }

const newUser = await apiRequest<UserResponse, CreateUserDTO>(
  '/api/users',
  { method: 'POST', body: { name: 'An', email: 'an@mail.com' } }
);
// newUser có type: UserResponse ✅
```

---

## 4. any vs unknown

### Bảng so sánh

| Đặc điểm | `any` | `unknown` |
|-----------|-------|-----------|
| Gán cho biến khác | ✅ Gán được mọi nơi | ❌ Chỉ gán cho `unknown` hoặc `any` |
| Truy cập property | ✅ Thoải mái (không check) | ❌ Phải **type guard** trước |
| Gọi method | ✅ Thoải mái | ❌ Phải **type guard** trước |
| Type safety | ❌ **TẮT hoàn toàn** type checking | ✅ **BẮT BUỘC** kiểm tra trước khi dùng |
| Khi nào dùng | Migration JS→TS, prototype | Parse JSON, external data, catch error |

### Ví dụ minh hoạ sự nguy hiểm của `any`

```typescript
// ❌ any — Tắt toàn bộ type checking, dễ gây runtime error
function processData(data: any) {
  // TypeScript KHÔNG cảnh báo gì cả — tất cả đều "hợp lệ"
  console.log(data.name.toUpperCase()); // Runtime Error nếu data = 42
  data.foo.bar.baz();                   // Runtime Error nhưng TS không biết
  const x: number = data;              // Gán thoải mái, không check
}
```

```typescript
// ✅ unknown — Ép buộc phải kiểm tra kiểu trước khi sử dụng
function processData(data: unknown) {
  // data.name;  // ❌ Error: Object is of type 'unknown'
  
  // Phải type guard trước
  if (typeof data === 'object' && data !== null && 'name' in data) {
    // Giờ TypeScript biết data có property 'name'
    console.log((data as { name: string }).name.toUpperCase()); // ✅
  }
}
```

### Ứng dụng thực tế: Error Handling

```typescript
// ❌ Sai — error có type unknown trong catch block (TS 4.4+)
try {
  await fetchData();
} catch (error) {
  // error là `unknown`, không phải `any`!
  console.log(error.message); // ❌ Object is of type 'unknown'
}

// ✅ Đúng — Type guard trước khi dùng
try {
  await fetchData();
} catch (error: unknown) {
  if (error instanceof Error) {
    console.log(error.message); // ✅ TypeScript biết đây là Error
  } else {
    console.log('Unknown error:', String(error));
  }
}
```

### Ứng dụng thực tế: Parse JSON

```typescript
// ✅ Dùng unknown khi parse dữ liệu từ bên ngoài
function parseApiResponse(raw: unknown): User {
  if (
    typeof raw === 'object' &&
    raw !== null &&
    'id' in raw &&
    'name' in raw &&
    typeof (raw as Record<string, unknown>).id === 'number' &&
    typeof (raw as Record<string, unknown>).name === 'string'
  ) {
    return raw as User;
  }
  throw new Error('Invalid API response shape');
}

// Hoặc dùng thư viện validation như Zod (cách pro nhất)
import { z } from 'zod';
const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
});
type User = z.infer<typeof UserSchema>; // Tự generate type từ schema!

function parseUser(data: unknown): User {
  return UserSchema.parse(data); // Tự validate + throw nếu sai
}
```

> [!IMPORTANT]
> **Câu trả lời phỏng vấn chuẩn:** "`any` tắt hoàn toàn type checking — nó làm mất đi giá trị cốt lõi của TypeScript. `unknown` là phiên bản an toàn (type-safe) của `any`: cũng nhận mọi giá trị, nhưng **bắt buộc developer phải kiểm tra kiểu** trước khi sử dụng. Trong dự án thực tế, tôi dùng `unknown` cho mọi dữ liệu từ bên ngoài (API, JSON parse, catch error) và cấm `any` trong ESLint rule (`@typescript-eslint/no-explicit-any`)."

---

## 5. Utility Types (Trọng tâm phỏng vấn)

> [!CAUTION]
> Đây là phần **HAY BỊ HỎI NHẤT** trong phỏng vấn TypeScript. Người phỏng vấn thường cho code snippet và hỏi "output kiểu gì" hoặc "dùng Utility Type nào cho bài toán này".

### 5.1. Partial\<T\>

**Chuyển TẤT CẢ property thành optional (`?`).**

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  avatar: string;
}

type PartialUser = Partial<User>;
// Tương đương với:
// {
//   id?: number;
//   name?: string;
//   email?: string;
//   avatar?: string;
// }
```

**Ứng dụng thực tế — Update API:**

```typescript
// Khi update, user chỉ gửi những field muốn thay đổi
async function updateUser(id: number, updates: Partial<User>): Promise<User> {
  const response = await fetch(`/api/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
  return response.json();
}

// Chỉ update name, không cần gửi email, avatar
updateUser(1, { name: 'Tên mới' }); // ✅ OK
updateUser(1, { name: 'Tên mới', email: 'new@mail.com' }); // ✅ OK
updateUser(1, { age: 25 }); // ❌ Error: 'age' không tồn tại trong User
```

**Hiểu bản chất (implementation):**

```typescript
// Đây là cách Partial được implement bên trong TypeScript:
type Partial<T> = {
  [P in keyof T]?: T[P];
};
// Dùng Mapped Type: lặp qua TẤT CẢ key (P) trong T,
// thêm `?` để biến thành optional
```

---

### 5.2. Pick\<T, K\>

**Chọn ra MỘT SỐ property từ type gốc.**

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  avatar: string;
  createdAt: Date;
}

// Chỉ lấy những field cần hiển thị trên UI
type UserCard = Pick<User, 'id' | 'name' | 'avatar'>;
// Tương đương:
// {
//   id: number;
//   name: string;
//   avatar: string;
// }
```

**Ứng dụng thực tế — Component Props:**

```typescript
// API trả về User đầy đủ, nhưng component chỉ cần vài field
interface UserProfileProps {
  user: Pick<User, 'name' | 'email' | 'avatar'>;
  onEdit: () => void;
}

// Không cần tạo interface mới, không cần truyền password/createdAt
function UserProfile({ user, onEdit }: UserProfileProps) {
  return (
    <div>
      <img src={user.avatar} alt={user.name} />
      <h2>{user.name}</h2>
      <p>{user.email}</p>
      <button onClick={onEdit}>Edit</button>
    </div>
  );
}
```

**Hiểu bản chất:**

```typescript
type Pick<T, K extends keyof T> = {
  [P in K]: T[P];
};
// K phải là key hợp lệ của T (ràng buộc bởi `extends keyof T`)
```

---

### 5.3. Omit\<T, K\>

**Ngược lại Pick — Loại bỏ một số property, GIỮ LẠI phần còn lại.**

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  password: string;
}

// Loại bỏ password khi trả về cho client
type SafeUser = Omit<User, 'password'>;
// Tương đương:
// {
//   id: number;
//   name: string;
//   email: string;
// }

// Loại bỏ nhiều field
type PublicUser = Omit<User, 'password' | 'email'>;
// { id: number; name: string; }
```

**Ứng dụng thực tế — Tạo mới (Create DTO):**

```typescript
// Khi tạo User mới, id do server tạo → Omit 'id'
type CreateUserDTO = Omit<User, 'id'>;

async function createUser(data: CreateUserDTO): Promise<User> {
  const response = await fetch('/api/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.json(); // Server trả về User đầy đủ (có id)
}

createUser({ name: 'An', email: 'an@mail.com', password: '123' }); // ✅
createUser({ id: 1, name: 'An', email: 'an@mail.com', password: '123' }); // ❌ Thừa id
```

**Pick vs Omit — Khi nào dùng cái nào?**

| Tình huống | Dùng |
|------------|------|
| Chỉ cần **2-3 field** từ object lớn (10+ fields) | `Pick` — Liệt kê vài cái cần |
| Cần **hầu hết field**, chỉ bỏ 1-2 cái | `Omit` — Liệt kê vài cái bỏ |
| Bảo mật: Loại `password`, `token` | `Omit` |
| Create DTO: Bỏ `id`, `createdAt` | `Omit` |
| Component chỉ hiển thị summary | `Pick` |

---

### 5.4. Record\<K, V\>

**Tạo kiểu object với key thuộc kiểu K và value thuộc kiểu V.**

```typescript
// K = kiểu của key, V = kiểu của value
type ThemeColors = Record<string, string>;
// Tương đương: { [key: string]: string }

const colors: ThemeColors = {
  primary: '#3B82F6',
  secondary: '#10B981',
  danger: '#EF4444',
};
```

**Sức mạnh thực sự — Khi K là Union Type:**

```typescript
type Role = 'admin' | 'editor' | 'viewer';

interface Permission {
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

// Record ÉP BUỘC phải khai báo ĐẦY ĐỦ tất cả role
const permissions: Record<Role, Permission> = {
  admin: { canCreate: true,  canRead: true,  canUpdate: true,  canDelete: true },
  editor: { canCreate: true, canRead: true,  canUpdate: true,  canDelete: false },
  viewer: { canCreate: false, canRead: true, canUpdate: false, canDelete: false },
  // Nếu thiếu bất kỳ role nào → ❌ Error ngay!
};
```

> [!IMPORTANT]
> **Đây là điểm mạnh nhất của `Record`:** Khi K là union type, TypeScript **ép buộc bạn phải handle tất cả case**. Nếu thêm role mới (`'moderator'`), compiler sẽ báo lỗi ở **mọi nơi** dùng `Record<Role, ...>` cho tới khi bạn thêm case cho `'moderator'`.

**Ứng dụng thực tế — Status configuration:**

```typescript
type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

interface StatusConfig {
  label: string;
  color: string;
  icon: string;
}

const ORDER_STATUS_CONFIG: Record<OrderStatus, StatusConfig> = {
  pending:    { label: 'Chờ xử lý',   color: '#F59E0B', icon: '⏳' },
  processing: { label: 'Đang xử lý', color: '#3B82F6', icon: '🔄' },
  shipped:    { label: 'Đang giao',   color: '#8B5CF6', icon: '🚚' },
  delivered:  { label: 'Đã giao',     color: '#10B981', icon: '✅' },
  cancelled:  { label: 'Đã hủy',      color: '#EF4444', icon: '❌' },
};

// Sử dụng trong component
function OrderBadge({ status }: { status: OrderStatus }) {
  const config = ORDER_STATUS_CONFIG[status]; // ✅ Type-safe, auto-complete
  return (
    <span style={{ color: config.color }}>
      {config.icon} {config.label}
    </span>
  );
}
```

**Hiểu bản chất:**

```typescript
type Record<K extends keyof any, T> = {
  [P in K]: T;
};
// Mapped Type: với mỗi key P trong union K, value có type T
```

---

### 5.5. ReturnType\<T\>

**Lấy kiểu trả về của một function.**

```typescript
function createUser() {
  return {
    id: Math.random(),
    name: 'An',
    createdAt: new Date(),
  };
}

type NewUser = ReturnType<typeof createUser>;
// Tương đương:
// {
//   id: number;
//   name: string;
//   createdAt: Date;
// }
```

**Ứng dụng thực tế — Custom Hook return type:**

```typescript
function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = async (email: string, password: string) => { /* ... */ };
  const logout = async () => { /* ... */ };

  return { user, isLoading, login, logout };
}

// Lấy return type mà KHÔNG cần khai báo interface riêng
type AuthContext = ReturnType<typeof useAuth>;
// {
//   user: User | null;
//   isLoading: boolean;
//   login: (email: string, password: string) => Promise<void>;
//   logout: () => Promise<void>;
// }

// Dùng cho Context Provider
const AuthCtx = createContext<AuthContext | null>(null);
```

**Ứng dụng — Store (Zustand/Redux):**

```typescript
// Zustand store
const useCartStore = create<CartState>()((set) => ({
  items: [],
  addItem: (item: Product) => set((state) => ({ items: [...state.items, item] })),
  removeItem: (id: number) => set((state) => ({
    items: state.items.filter(i => i.id !== id)
  })),
  total: 0,
}));

// Lấy type của store tự động
type CartStore = ReturnType<typeof useCartStore>;
```

**Hiểu bản chất:**

```typescript
type ReturnType<T extends (...args: any) => any> = T extends (...args: any) => infer R
  ? R
  : any;
// Dùng `infer R` để TypeScript tự suy ra kiểu trả về R
```

---

### 5.6. Readonly\<T\> (Bonus)

**Biến tất cả property thành readonly — không thể gán lại.**

```typescript
interface Config {
  apiUrl: string;
  timeout: number;
}

const config: Readonly<Config> = {
  apiUrl: 'https://api.example.com',
  timeout: 5000,
};

config.apiUrl = 'new-url'; // ❌ Error: Cannot assign to 'apiUrl' because it is a read-only property

// Ứng dụng: Immutable state trong Redux reducer
type State = Readonly<{
  users: readonly User[];  // Mảng cũng readonly
  loading: boolean;
}>;
```

---

### 5.7. Required\<T\> (Bonus)

**Ngược lại Partial — đổi tất cả optional thành required.**

```typescript
interface FormData {
  name?: string;
  email?: string;
  phone?: string;
}

// Trước khi submit, đảm bảo tất cả field đã điền
type ValidatedFormData = Required<FormData>;
// {
//   name: string;   // Không còn optional
//   email: string;
//   phone: string;
// }

function submitForm(data: ValidatedFormData) {
  // Đảm bảo mọi field đều có giá trị
  console.log(data.name.toUpperCase()); // ✅ An toàn, không thể undefined
}
```

---

### 5.8. Extract & Exclude (Bonus)

**Thao tác trên Union Types:**

```typescript
type AllEvents = 'click' | 'scroll' | 'mousemove' | 'keydown' | 'keyup';

// Extract: GIỮ LẠI các member thỏa điều kiện
type KeyEvents = Extract<AllEvents, 'keydown' | 'keyup'>;
// → 'keydown' | 'keyup'

// Exclude: LOẠI BỎ các member thỏa điều kiện
type MouseEvents = Exclude<AllEvents, 'keydown' | 'keyup'>;
// → 'click' | 'scroll' | 'mousemove'
```

**Ứng dụng kết hợp:**

```typescript
type ApiEndpoint = '/users' | '/products' | '/orders' | '/admin/users' | '/admin/settings';

// Lấy chỉ các endpoint admin
type AdminEndpoint = Extract<ApiEndpoint, `/admin/${string}`>;
// → '/admin/users' | '/admin/settings'

// Lấy các endpoint public (không phải admin)
type PublicEndpoint = Exclude<ApiEndpoint, `/admin/${string}`>;
// → '/users' | '/products' | '/orders'
```

---

## 6. Tuples

### Định nghĩa

Tuple là **mảng có số lượng phần tử cố định** và **mỗi vị trí có kiểu xác định**.

```typescript
// Mảng thường: tất cả phần tử cùng kiểu, số lượng tùy ý
const numbers: number[] = [1, 2, 3, 4, 5];

// Tuple: số lượng cố định, kiểu từng vị trí xác định
const point: [number, number] = [10, 20];
const userEntry: [number, string, boolean] = [1, 'An', true];

// ❌ Error: kiểu sai
const bad: [number, string] = ['hello', 42]; // Type error!
// ❌ Error: thiếu phần tử
const short: [number, string] = [42]; // Error: Source has 1 element but target requires 2
```

### Tuple trong React — useState chính là Tuple!

```typescript
// useState trả về Tuple: [state, setState]
const [count, setCount] = useState(0);
//      ^number  ^(value: number) => void

// Đó là lý do bạn có thể đặt tên tùy ý khi destructure
// Nếu trả về object thì phải dùng đúng key name
```

### Custom Hook trả về Tuple

```typescript
// Hook trả về Tuple — người dùng đặt tên tùy ý
function useToggle(initial = false): [boolean, () => void] {
  const [value, setValue] = useState(initial);
  const toggle = useCallback(() => setValue(v => !v), []);
  return [value, toggle]; // Tuple: [boolean, function]
}

// Sử dụng — đặt tên theo ngữ cảnh
const [isOpen, toggleOpen] = useToggle();
const [isDark, toggleTheme] = useToggle(true);

// So sánh với hook trả về Object — phải dùng đúng tên hoặc rename
function useToggleObject(initial = false) {
  const [value, setValue] = useState(initial);
  const toggle = useCallback(() => setValue(v => !v), []);
  return { value, toggle }; // Object
}
const { value: isOpen, toggle: toggleOpen } = useToggleObject(); // Phải rename
```

### Named Tuples (TypeScript 4.0+)

```typescript
// Đặt tên cho từng vị trí — giúp IDE hiển thị gợi ý tốt hơn
type UserTuple = [id: number, name: string, isActive: boolean];

const user: UserTuple = [1, 'An', true];
// Khi hover, IDE hiển thị: id: number, name: string, isActive: boolean
```

### Optional & Rest trong Tuple

```typescript
// Optional element
type HttpResponse = [number, string, object?];
const ok: HttpResponse = [200, 'OK', { data: [] }]; // ✅
const notFound: HttpResponse = [404, 'Not Found'];  // ✅ Phần tử thứ 3 optional

// Rest element — Tuple có chiều dài linh hoạt
type StringNumberBooleans = [string, number, ...boolean[]];
const valid: StringNumberBooleans = ['hello', 42, true, false, true]; // ✅

// Ứng dụng: Hàm nhận cố định 2 arg đầu, phần còn lại tùy ý
function log(level: string, message: string, ...metadata: unknown[]) {
  console.log(`[${level}] ${message}`, ...metadata);
}
```

### `as const` — Biến mảng thành readonly Tuple

```typescript
// Không có `as const` → TypeScript suy ra là string[]
const ROLES = ['admin', 'editor', 'viewer'];
// type: string[]

// Có `as const` → TypeScript suy ra là readonly Tuple
const ROLES = ['admin', 'editor', 'viewer'] as const;
// type: readonly ['admin', 'editor', 'viewer']

// Lấy Union type từ const Tuple
type Role = (typeof ROLES)[number];
// type Role = 'admin' | 'editor' | 'viewer'

// Ứng dụng: Đảm bảo giá trị truyền vào phải nằm trong danh sách
function hasRole(userRole: string, requiredRole: Role): boolean {
  return userRole === requiredRole;
}
hasRole('admin', 'admin');   // ✅
hasRole('admin', 'manager'); // ❌ Error: 'manager' is not assignable to type Role
```

---

## 7. Bảng tổng hợp & Cheat Sheet

### Utility Types — Bảng tóm tắt nhanh

| Utility Type | Công dụng | Ví dụ |
|-------------|-----------|-------|
| `Partial<T>` | Tất cả thành `optional` | Update API payload |
| `Required<T>` | Tất cả thành `required` | Validated form data |
| `Readonly<T>` | Tất cả thành `readonly` | Config, constants |
| `Pick<T, K>` | Chọn một số property | Component chỉ cần vài field |
| `Omit<T, K>` | Bỏ một số property | Loại password, tạo DTO |
| `Record<K, V>` | Object với key K, value V | Config map, enum mapping |
| `ReturnType<T>` | Lấy kiểu trả về của function | Hook return type, store type |
| `Extract<T, U>` | Giữ member trong union | Lọc event types |
| `Exclude<T, U>` | Bỏ member trong union | Loại trừ event types |

### Kết hợp Utility Types (Combo)

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
  createdAt: Date;
}

// Combo 1: Create DTO — bỏ id + createdAt (server tạo)
type CreateUser = Omit<User, 'id' | 'createdAt'>;

// Combo 2: Update DTO — bỏ id + tất cả còn lại optional
type UpdateUser = Partial<Omit<User, 'id'>>;

// Combo 3: Public user — bỏ password + readonly
type PublicUser = Readonly<Omit<User, 'password'>>;

// Combo 4: User summary cho list — chỉ lấy id, name, role
type UserSummary = Pick<User, 'id' | 'name' | 'role'>;

// Combo 5: Admin có thêm quyền
type AdminUser = Pick<User, 'id' | 'name'> & {
  permissions: string[];
  lastLogin: Date;
};
```

### Type Guard Functions — Kết hợp với Utility Types

```typescript
// Type predicate function
function isUser(data: unknown): data is User {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'name' in data &&
    'email' in data
  );
}

// Sử dụng
function handleApiResponse(response: unknown) {
  if (isUser(response)) {
    // TypeScript biết response là User ở đây
    console.log(response.name); // ✅
  }
}
```

---

## 8. Câu hỏi phỏng vấn thực chiến

### Câu 1: "Type vs Interface khác nhau gì?"

> **Trả lời:** Cả hai đều dùng để mô tả kiểu dữ liệu, nhưng có 2 khác biệt chính:
> 1. **Scope**: `interface` chuyên cho object shape, còn `type` dùng được cho mọi thứ (union, tuple, primitive alias).
> 2. **Declaration Merging**: Chỉ `interface` hỗ trợ — hai khai báo cùng tên sẽ tự merge. `type` thì lỗi duplicate. Điều này hữu ích khi mở rộng type thư viện bên thứ 3.
>
> Tôi dùng `interface` cho component props và object shape, `type` cho union, computed types, và utility types.

---

### Câu 2: "Cho đoạn code này, output kiểu gì?"

```typescript
interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  inStock: boolean;
}

type A = Pick<Product, 'name' | 'price'>;
type B = Omit<A, 'price'>;
type C = Partial<Product> & Required<Pick<Product, 'id'>>;
```

> **Trả lời:**
> - `A` = `{ name: string; price: number }` — Pick 2 field
> - `B` = `{ name: string }` — Từ A bỏ price, chỉ còn name
> - `C` = Tất cả field optional **NGOẠI TRỪ `id` là required**. Vì `Required<Pick<Product, 'id'>>` = `{ id: number }`, intersection với `Partial<Product>` sẽ override `id` thành required.

---

### Câu 3: "Generic giải quyết vấn đề gì?"

> **Trả lời:** Generic giải quyết bài toán **tái sử dụng code mà vẫn giữ type safety**. Không có Generic, tôi phải chọn giữa:
> - Viết nhiều hàm trùng logic cho từng kiểu (duplicate code)
> - Dùng `any` (mất type safety)
>
> Generic cho phép tôi viết một hàm/component/hook **một lần** nhưng chạy an toàn với **nhiều kiểu khác nhau**. Ví dụ: `useState<T>`, `useFetch<T>`, `ApiResponse<T>`, component `<Select<T>>`.

---

### Câu 4: "Khi nào dùng Tuple thay vì Object?"

> **Trả lời:** Tuple thích hợp khi:
> 1. **Thứ tự có ý nghĩa** và số lượng cố định (ví dụ: tọa độ `[x, y]`)
> 2. **Cần người dùng tự đặt tên** khi destructure (pattern của React hooks: `const [value, setValue] = useState()`)
> 3. **Performance**: Tuple (mảng JS) nhẹ hơn object khi tạo nhiều instance
>
> Object thích hợp khi có nhiều field (3+), hoặc khi tên property quan trọng cho readability.

---

### Câu 5: "Viết type cho hàm PATCH API chỉ cho update một số field"

```typescript
// Yêu cầu: Hàm updateUser nhận id (bắt buộc) và một số field tùy chọn để update

// ✅ Giải pháp dùng Partial + Omit
interface User {
  id: number;
  name: string;
  email: string;
  avatar: string;
}

async function updateUser(
  id: number,
  updates: Partial<Omit<User, 'id'>> // id không nằm trong body
): Promise<User> {
  return fetch(`/api/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  }).then(res => res.json());
}

// Hoặc version ngắn gọn hơn:
type UpdateUserDTO = Partial<Omit<User, 'id'>>;
```

---

> [!NOTE]
> **Lời khuyên cuối:** Khi phỏng vấn TypeScript, hãy luôn nói về **WHY** (tại sao dùng) trước khi nói **HOW** (cách dùng). Người phỏng vấn muốn thấy bạn hiểu **giá trị thực tế** của type safety, không chỉ syntax. Ví dụ: "Tôi dùng `Record<Role, Permission>` thay vì `{ [key: string]: Permission }` vì Record **ép compiler kiểm tra tôi đã handle đủ tất cả role** — nếu thêm role mới mà quên cập nhật permissions, TypeScript sẽ báo lỗi ngay lúc biên dịch, không phải lúc runtime."
