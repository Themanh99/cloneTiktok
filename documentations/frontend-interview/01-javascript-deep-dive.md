# PHẦN 1: JAVASCRIPT NÂNG CAO — DEEP DIVE

---

## 1. `var`, `let`, `const` và Scope

### Nguyên lý hoạt động

**Scope** là "phạm vi nhìn thấy" của một biến. JavaScript có 3 loại scope:

- **Global scope**: Biến khai báo ngoài mọi hàm/block, truy cập được ở mọi nơi.
- **Function scope**: Biến chỉ tồn tại bên trong hàm chứa nó.
- **Block scope**: Biến chỉ tồn tại bên trong cặp `{}` (if, for, while).

**Tại sao cần phân biệt?**

- `var` có **Function scope** — nó KHÔNG bị giới hạn bởi block `{}`. Đây là nguồn gốc của rất nhiều bug kinh điển.
- `let` và `const` có **Block scope** — chúng bị giới hạn bởi `{}`, an toàn hơn rất nhiều.

**Hoisting (Nâng biến lên đầu):**

- `var` được "hoist" lên đầu function scope với giá trị `undefined`. Nghĩa là bạn có thể dùng biến trước khi khai báo mà không bị lỗi (nhưng giá trị là `undefined`).
- `let` / `const` cũng được hoist nhưng nằm trong **Temporal Dead Zone (TDZ)** — truy cập trước khi khai báo sẽ bị lỗi `ReferenceError`.

```javascript
// Bug kinh điển với var
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100);
}
// Output: 3, 3, 3 (vì var là function scope, chỉ có 1 biến i duy nhất)

// Fix với let
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100);
}
// Output: 0, 1, 2 (mỗi vòng lặp tạo ra 1 biến i riêng biệt trong block scope)
```

**`const` vs `let`:** `const` ngăn cản việc **gán lại** (re-assignment), KHÔNG ngăn thay đổi nội dung bên trong object/array.

```javascript
const user = { name: 'An' };
user.name = 'Bình'; // OK — thay đổi property bên trong
user = { name: 'Cường' }; // LỖI — gán lại biến
```

### Câu hỏi phỏng vấn

**Q: Giải thích sự khác biệt giữa var, let, const. Tại sao nên dùng const mặc định?**

**A:** `var` có function scope và bị hoist với giá trị `undefined`, dễ gây bug khi dùng trong vòng lặp hay block `if/else`. `let` và `const` có block scope, bị hoist nhưng nằm trong TDZ nên lỗi sớm hơn — giúp debug dễ hơn. Nên dùng `const` mặc định vì nó ép ta phải rõ ràng: nếu biến không cần thay đổi thì `const`, nếu cần thay đổi thì dùng `let`. Điều này giúp code dễ đọc hơn vì người đọc biết ngay biến nào sẽ bị thay đổi.

---

## 2. `this` keyword và `call`, `apply`, `bind`

### Nguyên lý hoạt động

`this` trong JavaScript **KHÔNG** cố định như Java/C#. Giá trị của `this` được quyết định bởi **cách hàm được gọi** (call-site), KHÔNG phải nơi hàm được khai báo.

**4 quy tắc xác định `this` (theo thứ tự ưu tiên từ cao xuống thấp):**

1. **`new` binding**: Khi gọi hàm với `new`, `this` trỏ đến object mới được tạo.
2. **Explicit binding** (`call`, `apply`, `bind`): Ta chỉ định `this` là gì.
3. **Implicit binding**: Khi gọi hàm qua object (`obj.method()`), `this` = `obj`.
4. **Default binding**: Gọi hàm đơn thuần, `this` = `window` (non-strict) hoặc `undefined` (strict mode).

```javascript
const obj = {
  name: 'An',
  greet() {
    console.log(this.name); // this = obj (implicit binding)
  }
};
obj.greet(); // 'An'

const fn = obj.greet;
fn(); // undefined — vì đây là default binding, this = window
```

**`call`, `apply`, `bind`:**

- `call(thisArg, arg1, arg2)` — Gọi hàm ngay lập tức, truyền `this` và từng tham số riêng lẻ.
- `apply(thisArg, [arg1, arg2])` — Giống `call` nhưng tham số truyền dạng mảng.
- `bind(thisArg)` — **KHÔNG gọi hàm ngay**, mà trả về một hàm mới với `this` đã bị "khóa" cứng.

```javascript
function greet(greeting) {
  console.log(`${greeting}, tôi là ${this.name}`);
}

const user = { name: 'An' };
greet.call(user, 'Xin chào');   // "Xin chào, tôi là An"
greet.apply(user, ['Xin chào']); // "Xin chào, tôi là An"

const boundGreet = greet.bind(user);
boundGreet('Xin chào');          // "Xin chào, tôi là An"
```

**Arrow function và `this`:** Arrow function KHÔNG có `this` riêng. Nó "kế thừa" `this` từ scope cha (lexical `this`). Đây là lý do arrow function rất hữu ích trong React event handlers.

```javascript
const obj = {
  name: 'An',
  greet: () => {
    console.log(this.name); // this = window/undefined, KHÔNG phải obj
  },
  greetCorrect() {
    // Arrow function kế thừa this từ greetCorrect (= obj)
    const inner = () => console.log(this.name);
    inner(); // 'An'
  }
};
```

### Câu hỏi phỏng vấn

**Q: Tại sao trong React class component cũ, ta phải `bind(this)` trong constructor?**

**A:** Khi truyền method làm callback cho event handler (VD: `onClick={this.handleClick}`), React gọi hàm đó mà không qua object (`this.`), nên `this` bị mất (default binding → `undefined` vì strict mode). `bind(this)` trong constructor "khóa" `this` vĩnh viễn cho hàm đó. Arrow function giải quyết vấn đề này vì nó kế thừa `this` từ scope cha (class instance).

---

## 3. Closures

### Nguyên lý hoạt động

Closure xảy ra khi một **hàm bên trong (inner function) ghi nhớ và truy cập được các biến của hàm bên ngoài (outer function)**, ngay cả khi hàm bên ngoài đã chạy xong và bị xóa khỏi Call Stack.

**Tại sao nó hoạt động được?** Vì JavaScript Engine không xóa biến của outer function nếu inner function vẫn còn tham chiếu đến chúng. Biến đó được giữ lại trong bộ nhớ (Heap), gắn vào một "Closure scope" đặc biệt mà inner function có thể truy cập.

```javascript
function createCounter() {
  let count = 0; // Biến này được "đóng gói" trong closure
  return {
    increment: () => ++count,
    getCount: () => count,
  };
}

const counter = createCounter();
counter.increment(); // 1
counter.increment(); // 2
counter.getCount();  // 2
// Không thể truy cập count trực tiếp từ bên ngoài — data privacy!
```

**Ứng dụng thực tế trong FE:**

1. **Data Privacy** (đóng gói biến private — như ví dụ trên).
2. **Function Factory** (tạo hàm với cấu hình sẵn):
   ```javascript
   function createApiClient(baseUrl) {
     return (endpoint) => fetch(`${baseUrl}${endpoint}`);
   }
   const api = createApiClient('https://api.example.com');
   api('/users'); // fetch('https://api.example.com/users')
   ```
3. **Debounce / Throttle** — closure giữ biến `timer` giữa các lần gọi:
   ```javascript
   function debounce(fn, delay) {
     let timer; // Closure giữ biến timer
     return (...args) => {
       clearTimeout(timer);
       timer = setTimeout(() => fn(...args), delay);
     };
   }
   ```

### Câu hỏi phỏng vấn

**Q: Closure là gì? Cho ví dụ thực tế bạn đã dùng trong dự án.**

**A:** Closure là khả năng một hàm ghi nhớ các biến trong lexical scope của nó, ngay cả khi hàm đó được thực thi bên ngoài scope gốc. Trong dự án, em dùng closure để viết hàm `debounce` cho input search — biến `timer` được closure giữ lại giữa các lần gọi, giúp cancel timer cũ trước khi đặt timer mới. Em cũng dùng closure trong `createApiClient` để đóng gói `baseUrl` và `token`, tránh lặp lại config mỗi lần gọi API.

---

## 4. Higher-Order Functions & Currying

### Nguyên lý hoạt động

**Higher-Order Function (HOF):** Là hàm nhận **hàm khác làm tham số** hoặc **trả về một hàm mới**. Các HOF phổ biến nhất: `map`, `filter`, `reduce`, `forEach`.

```javascript
// map là HOF vì nhận callback function làm tham số
const doubled = [1, 2, 3].map(n => n * 2); // [2, 4, 6]
```

**Tại sao HOF quan trọng?** Vì nó cho phép ta **trừu tượng hóa hành vi**. Thay vì viết lặp lại logic duyệt mảng, ta chỉ mô tả "làm gì với mỗi phần tử" — code ngắn gọn, dễ đọc, ít lỗi.

**Currying:** Biến một hàm nhận nhiều tham số thành chuỗi các hàm, mỗi hàm nhận 1 tham số.

```javascript
// Hàm thường
const add = (a, b) => a + b;
add(1, 2); // 3

// Curried
const curriedAdd = (a) => (b) => a + b;
const add5 = curriedAdd(5); // Trả về hàm (b) => 5 + b
add5(3); // 8
add5(10); // 15
```

**Ứng dụng thực tế:** Tạo các hàm utility với cấu hình sẵn, rất phổ biến trong middleware, validation, permission checking.

---

## 5. Promises & async/await

### Nguyên lý hoạt động

**Promise** đại diện cho một giá trị **chưa có ngay lúc này** nhưng sẽ có trong tương lai. Nó có 3 trạng thái:
- **Pending**: Đang chờ kết quả.
- **Fulfilled**: Thành công, có giá trị.
- **Rejected**: Thất bại, có lỗi.

**Event Loop — Tại sao JS chạy bất đồng bộ dù chỉ có 1 thread?**

JavaScript là single-threaded (1 luồng duy nhất), nhưng nhờ **Event Loop** và **Web APIs** (của trình duyệt), nó có thể xử lý bất đồng bộ:

1. Code đồng bộ chạy trên **Call Stack** (LIFO).
2. Các tác vụ bất đồng bộ (fetch, setTimeout) được giao cho **Web API** xử lý ở background.
3. Khi Web API xong, callback được đẩy vào **Task Queue** (hoặc **Microtask Queue** cho Promises).
4. **Event Loop** liên tục kiểm tra: nếu Call Stack trống → lấy callback từ Queue đẩy vào Stack để chạy.

**Microtask Queue vs Task Queue:** Promise callbacks (`.then`) nằm trong **Microtask Queue** — có độ ưu tiên CAO hơn Task Queue (setTimeout). Microtask Queue được xử lý hết trước khi Event Loop lấy task tiếp theo từ Task Queue.

```javascript
console.log('1');
setTimeout(() => console.log('2'), 0);
Promise.resolve().then(() => console.log('3'));
console.log('4');
// Output: 1, 4, 3, 2
// Giải thích: 1 và 4 là đồng bộ (chạy ngay). 
// 3 là microtask (Promise), chạy trước 2 (macrotask - setTimeout).
```

**`async/await` là Syntactic Sugar:** `async/await` không phải cơ chế mới. Nó chỉ là cách viết đẹp hơn cho Promise chain.

```javascript
// Promise chain
fetchUser()
  .then(user => fetchOrders(user.id))
  .then(orders => console.log(orders))
  .catch(err => console.error(err));

// async/await — cùng logic, dễ đọc hơn
async function loadData() {
  try {
    const user = await fetchUser();
    const orders = await fetchOrders(user.id);
    console.log(orders);
  } catch (err) {
    console.error(err);
  }
}
```

**Chạy song song với `Promise.all`:**

```javascript
// SAI — chạy tuần tự, tốn 2x thời gian
const users = await fetchUsers();
const products = await fetchProducts();

// ĐÚNG — chạy song song, tổng thời gian = max(fetch1, fetch2)
const [users, products] = await Promise.all([
  fetchUsers(),
  fetchProducts(),
]);
```

### Câu hỏi phỏng vấn

**Q: Giải thích Event Loop. Output của đoạn code sau là gì?**
```javascript
console.log('A');
setTimeout(() => console.log('B'), 0);
Promise.resolve().then(() => console.log('C'));
console.log('D');
```

**A:** Output: `A, D, C, B`.

Giải thích: `A` và `D` là synchronous code, chạy ngay trên Call Stack. `setTimeout` callback được đẩy vào **Macrotask Queue**. Promise `.then` callback được đẩy vào **Microtask Queue**. Sau khi Call Stack trống (sau `D`), Event Loop ưu tiên xử lý hết Microtask Queue trước (in `C`), rồi mới lấy Macrotask (in `B`).

**Q: Khi nào dùng `Promise.all` vs `Promise.allSettled`?**

**A:** `Promise.all` fail-fast — nếu 1 promise reject, toàn bộ reject ngay. Dùng khi tất cả đều bắt buộc thành công (VD: fetch user + fetch permissions → cả 2 đều cần để render trang). `Promise.allSettled` chờ TẤT CẢ hoàn thành dù thành công hay thất bại. Dùng khi muốn biết kết quả từng cái riêng lẻ (VD: gửi 10 email, muốn biết email nào gửi được email nào lỗi).

---

## 6. Map, Set, WeakMap, WeakSet

### Nguyên lý hoạt động

**Map vs Object:**
- `Object` key chỉ là string/symbol. `Map` key có thể là **bất cứ kiểu nào** (object, function, number).
- `Map` giữ nguyên thứ tự chèn. `Map.size` trả về kích thước — `Object` phải dùng `Object.keys(obj).length`.
- `Map` hiệu suất tốt hơn khi thêm/xóa key liên tục.

**Set:** Giống mảng nhưng **chỉ chứa giá trị duy nhất** (không trùng lặp). Rất hữu ích để loại bỏ duplicate.

```javascript
const unique = [...new Set([1, 2, 2, 3, 3])]; // [1, 2, 3]
```

**WeakMap / WeakSet — Tại sao cần?**
- Key trong WeakMap **BẮT BUỘC là object** và là **weak reference** (tham chiếu yếu).
- Nếu object key không còn được tham chiếu ở nơi nào khác → Garbage Collector sẽ tự động xóa nó khỏi WeakMap → **KHÔNG bị memory leak**.
- Ứng dụng: Cache dữ liệu tạm theo object, lưu metadata riêng cho DOM elements.

```javascript
const cache = new WeakMap();
function getExpensiveData(obj) {
  if (cache.has(obj)) return cache.get(obj);
  const result = /* tính toán nặng */;
  cache.set(obj, result);
  return result;
}
// Khi obj bị xóa ở nơi khác, cache tự dọn — không memory leak
```

### Câu hỏi phỏng vấn

**Q: Khi nào bạn sẽ dùng Map thay vì Object thường?**

**A:** Khi key không phải string (VD: dùng object hoặc DOM element làm key), khi cần duy trì thứ tự chèn, hoặc khi có thao tác thêm/xóa key thường xuyên (Map tối ưu hơn). Trong dự án thực tế, em dùng Map khi xây dựng cache cho API responses theo từng endpoint, vì cần iterate theo thứ tự và xóa entry cũ dễ dàng.
