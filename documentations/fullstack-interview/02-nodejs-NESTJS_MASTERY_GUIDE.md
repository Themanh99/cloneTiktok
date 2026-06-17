# Hướng Dẫn Ôn Phỏng Vấn Node.js, TypeScript và NestJS

File này là tài liệu canonical cho Node.js, TypeScript backend và NestJS. Mục tiêu là đọc để hiểu và nói lại được trong phỏng vấn, không chỉ là checklist.

Các phần liên quan nhưng không đi sâu ở đây:

- Database chuyên sâu: `05-kiến thức master database.md`
- Cache, Redis, queue, Kafka, rate limit: `06-backend-core-knowledge.md`
- Docker, CI/CD, monitoring, cloud: `04-kiến thức-database-devops.md`

## 1. Mức độ cần nắm

### Bắt buộc phải chắc

- Node.js chạy JavaScript như thế nào: call stack, event loop, libuv, non-blocking I/O.
- Khi nào Node.js nhanh, khi nào Node.js bị chậm.
- Promise, async/await, microtask, macrotask.
- Stream và backpressure khi xử lý file/request lớn.
- TypeScript: `unknown` vs `any`, `interface` vs `type`, generic, utility type.
- NestJS: module, controller, provider/service, dependency injection.
- Request lifecycle: middleware, guard, interceptor, pipe, exception filter.
- DTO, validation, serialization.
- Authentication và authorization: JWT, refresh token, RBAC, permission, ownership.
- Testing: unit test, integration/E2E test, mock provider.
- Production readiness: error format, logging, timeout, graceful shutdown, health check.

### Nên biết để trả lời senior hơn

- Worker thread và cách xử lý CPU-bound workload.
- Injection scope: singleton, request-scoped, transient.
- Dynamic module và custom provider.
- Circular dependency và cách tránh.
- Transaction boundary trong service layer.
- Outbox/idempotency ở mức tích hợp với business flow.
- Fastify adapter vs Express adapter.
- OpenAPI/Swagger, API versioning, backward compatibility.

## 2. Node.js core

### 2.1 Node.js là gì?

Node.js là runtime cho phép chạy JavaScript ở phía server. Node.js dùng V8 để thực thi JavaScript, và dùng libuv để xử lý event loop, I/O bất đồng bộ, timer, thread pool cho một số tác vụ hệ thống.

Điểm quan trọng khi phỏng vấn:

- JavaScript trong Node.js chạy trên main thread.
- I/O như network, database driver, filesystem async có thể không block main thread.
- Node.js rất hợp với I/O-bound workload: API server, gateway, real-time, streaming, BFF.
- Node.js không tự động tốt cho CPU-bound workload: xử lý ảnh/video, mã hóa nặng, vòng lặp tính toán lớn.

Câu trả lời ngắn:

> Node.js phù hợp với backend có nhiều I/O vì nó dùng event loop và non-blocking I/O. Main thread chạy JavaScript, còn nhiều tác vụ I/O được giao cho OS/libuv. Nhưng nếu mình đặt CPU-heavy task trong request handler thì event loop vẫn bị block và toàn bộ API có thể chậm.

### 2.2 Event loop

Event loop là cơ chế giúp Node.js xử lý các callback/tác vụ bất đồng bộ theo vòng lặp. Khi code đồng bộ chạy xong, event loop lấy các callback đã sẵn sàng từ các queue để đưa lên call stack thực thi.

Bản chất cần hiểu:

```text
Call Stack
  -> chạy code JavaScript đồng bộ
Async APIs / libuv / OS
  -> xử lý timer, network, file I/O...
Queues
  -> callback/promise continuation chờ được chạy
Event Loop
  -> đưa callback phù hợp vào call stack
```

Ví dụ:

```ts
console.log("start");

setTimeout(() => console.log("timeout"), 0);

Promise.resolve().then(() => console.log("promise"));

console.log("end");
```

Thường output:

```text
start
end
promise
timeout
```

Lý do:

- `console.log("start")` và `console.log("end")` là code đồng bộ.
- Promise callback nằm trong microtask queue nên chạy sau code sync nhưng trước timer callback.
- `setTimeout` là timer callback, chạy ở phase timer khi event loop đến lượt.

Điểm phỏng vấn hay hỏi:

- Event loop không biến JavaScript thành multi-thread.
- Event loop giúp main thread không đứng chờ I/O.
- Nếu main thread bị block bởi CPU task, event loop không có cơ hội xử lý callback khác.

### 2.3 Các phase quan trọng của event loop

Không cần học thuộc quá máy móc, nhưng nên hiểu các nhóm chính:

1. Timers: chạy callback của `setTimeout`, `setInterval`.
2. Pending callbacks: xử lý một số callback hệ thống.
3. Poll: nhận I/O callbacks, chờ I/O mới.
4. Check: chạy `setImmediate`.
5. Close callbacks: callback khi socket/handle đóng.
6. Microtask queue: Promise callbacks và `process.nextTick`, chạy giữa các phase.

Ví dụ:

```ts
setTimeout(() => console.log("timeout"), 0);
setImmediate(() => console.log("immediate"));
Promise.resolve().then(() => console.log("promise"));
process.nextTick(() => console.log("nextTick"));
```

Cần nói được:

- `process.nextTick` thường chạy trước Promise microtask.
- Promise microtask chạy trước timer/check callback.
- Thứ tự giữa `setTimeout(..., 0)` và `setImmediate` có thể phụ thuộc context.
- Trong I/O callback, `setImmediate` thường chạy trước `setTimeout(..., 0)`.

### 2.4 Blocking vs non-blocking

Blocking là khi một tác vụ giữ main thread hoặc tài nguyên quan trọng quá lâu, làm các request khác phải chờ.

Ví dụ blocking trong Node.js:

```ts
app.get("/report", (req, res) => {
  const result = heavyCalculation(); // CPU-heavy, block event loop
  res.json(result);
});
```

Ví dụ non-blocking I/O:

```ts
app.get("/users/:id", async (req, res) => {
  const user = await userRepository.findById(req.params.id);
  res.json(user);
});
```

Các nguồn gây block phổ biến:

- Vòng lặp CPU-heavy.
- `fs.readFileSync`, crypto/compression sync trong request path.
- Parse/stringify JSON payload quá lớn.
- Xử lý file lớn bằng cách load toàn bộ vào memory.
- Gọi external service không timeout làm request treo lâu.

Cách xử lý:

- Dùng async I/O.
- Dùng stream cho file lớn.
- Đưa tác vụ lâu vào queue/background worker.
- Dùng worker thread/process riêng cho CPU-heavy task.
- Giới hạn payload size, timeout, concurrency.

### 2.5 Promise, async/await

Promise đại diện cho kết quả của một tác vụ bất đồng bộ có thể thành công hoặc thất bại trong tương lai.

`async/await` là cú pháp giúp viết Promise dễ đọc hơn, nhưng không làm code bất đồng bộ thành đồng bộ thật sự.

Ví dụ:

```ts
async function getUserProfile(userId: string) {
  const user = await userRepository.findById(userId);
  const profile = await profileRepository.findByUserId(user.id);
  return { user, profile };
}
```

Vấn đề cần chú ý:

- Nếu task độc lập mà `await` tuần tự, latency bị cộng dồn.
- Nếu dùng `Promise.all` quá nhiều task cùng lúc, có thể làm quá tải dependency.
- Promise bị reject mà không catch có thể tạo unhandled rejection.

Khi nên dùng `Promise.all`:

```ts
const [profile, orders, unreadCount] = await Promise.all([
  profileService.getProfile(userId),
  orderService.getRecentOrders(userId),
  notificationService.getUnreadCount(userId),
]);
```

Khi không nên:

- Task sau cần kết quả task trước.
- Gọi hàng nghìn external requests cùng lúc.
- Dependency có rate limit hoặc connection pool nhỏ.

Nếu có nhiều task, nên dùng concurrency limit:

```ts
// Ý tưởng: chỉ chạy 5 task cùng lúc thay vì chạy tất cả.
```

Câu trả lời phỏng vấn:

> `async/await` chỉ là syntax trên Promise. Khi gặp `await`, function tạm nhường quyền thực thi, phần sau `await` được đưa vào microtask khi Promise resolve. Nếu nhiều thao tác độc lập, em dùng `Promise.all`, nhưng với số lượng lớn phải giới hạn concurrency để không làm quá tải DB hoặc external service.

### 2.6 Stream và backpressure

Stream là cách xử lý dữ liệu theo từng phần nhỏ thay vì load toàn bộ dữ liệu vào memory.

Phù hợp khi:

- Upload/download file lớn.
- Đọc CSV/Excel/JSONL lớn.
- Proxy response lớn.
- Xử lý log/data pipeline.

Ví dụ sai:

```ts
const content = await fs.promises.readFile("big-file.csv", "utf8");
const rows = content.split("\n");
```

Vấn đề:

- File 1GB có thể làm memory tăng mạnh.
- Request có thể timeout.
- GC pressure cao.

Ví dụ đúng hơn:

```ts
import { pipeline } from "node:stream/promises";
import { createReadStream } from "node:fs";

await pipeline(
  createReadStream("big-file.csv"),
  parseCsvStream(),
  validateRowsStream(),
  saveRowsInBatchStream(),
);
```

Backpressure là cơ chế giúp bên đọc hoặc ghi điều tiết tốc độ. Nếu bên ghi DB chậm, stream đọc file phải chậm lại, tránh đẩy dữ liệu vào memory quá nhanh.

Câu trả lời phỏng vấn:

> Với file lớn, em dùng stream pipeline để đọc và xử lý theo chunk/batch. Backpressure giúp pipeline không đọc nhanh hơn khả năng xử lý của downstream như DB hoặc network. Nếu bỏ qua backpressure và push dữ liệu liên tục, memory có thể tăng mạnh và service crash.

### 2.7 Worker thread và CPU-bound workload

Node.js mạnh ở I/O-bound, nhưng CPU-bound task sẽ block event loop nếu chạy trực tiếp trên main thread.

CPU-bound task thường gặp:

- Resize/compress ảnh.
- Encode/transcode video.
- Hash/mã hóa nặng.
- Parse file cực lớn với logic phức tạp.
- Generate report lớn.
- Tính toán thuật toán nặng.

Cách xử lý:

- Worker thread cho CPU task cần chạy trong cùng app/runtime.
- Child process hoặc service riêng nếu muốn isolate tốt hơn.
- Queue/background worker nếu task không cần trả kết quả ngay.
- Dùng external service chuyên dụng cho video/image processing.

Ưu điểm worker thread:

- Không block event loop chính.
- Có thể tận dụng nhiều CPU core.

Nhược điểm:

- Tăng độ phức tạp.
- Có overhead truyền dữ liệu giữa thread.
- Cần quản lý pool, timeout, error.

### 2.8 Error handling trong Node.js

Mục tiêu của error handling là:

- Không làm app crash ngoài ý muốn.
- Không nuốt lỗi.
- Log đủ context để debug.
- Trả error response nhất quán cho client.

Nguyên tắc:

- Luôn `await` hoặc return Promise.
- Dùng `try/catch` khi cần map lỗi sang domain/HTTP error.
- Không catch rồi bỏ qua.
- Không trả stack trace/internal error ra client.
- Log kèm request id/correlation id.

Ví dụ:

```ts
try {
  const order = await orderService.createOrder(input);
  return order;
} catch (error) {
  this.logger.error("Create order failed", {
    requestId,
    userId,
    error,
  });

  throw error;
}
```

Pitfall:

```ts
users.forEach(async (user) => {
  await sendEmail(user.email);
});
```

`forEach` không await các Promise bên trong. Nên dùng:

```ts
for (const user of users) {
  await sendEmail(user.email);
}
```

Hoặc nếu chạy song song có kiểm soát:

```ts
await Promise.all(users.map((user) => sendEmail(user.email)));
```

## 3. TypeScript backend

### 3.1 Vì sao backend Node.js nên dùng TypeScript?

TypeScript giúp phát hiện lỗi ở compile time, mô tả contract rõ hơn, hỗ trợ refactor an toàn hơn và làm codebase lớn dễ maintain hơn.

Lợi ích:

- Giảm lỗi truyền sai shape object.
- DTO, service interface, repository contract rõ ràng.
- IDE autocomplete/refactor tốt.
- Dễ onboard team hơn.

Giới hạn:

- TypeScript không validate runtime data.
- Dữ liệu từ HTTP body, DB, queue, external API vẫn cần validate.
- Type có thể bị bypass bằng `any`, type assertion sai.

Câu cần nói:

> TypeScript giúp kiểm tra kiểu ở compile time, nhưng input từ bên ngoài vẫn là runtime data nên vẫn cần validation bằng DTO/schema. Em không coi TypeScript là thay thế cho validation.

### 3.2 `unknown` vs `any`

`any` tắt kiểm tra kiểu. Khi một biến là `any`, TypeScript cho phép gọi mọi property/method mà không cảnh báo.

`unknown` nghĩa là "chưa biết kiểu". Muốn dùng phải narrow type trước.

Ví dụ:

```ts
function handlePayload(payload: unknown) {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "email" in payload
  ) {
    // Lúc này mới xử lý tiếp sau khi validate/narrow.
  }
}
```

So sánh:

| Tiêu chí | `any` | `unknown` |
| --- | --- | --- |
| Type safety | Kém | Tốt hơn |
| Có cần kiểm tra trước khi dùng | Không | Có |
| Phù hợp cho input bên ngoài | Không nên | Nên |
| Rủi ro runtime error | Cao | Thấp hơn |

Khi dùng:

- Dùng `unknown` cho JSON parse, message từ queue, external webhook.
- Tránh `any` trừ khi đang migrate code hoặc wrapper library quá khó type.

### 3.3 `interface` vs `type`

`interface` thường dùng để mô tả shape của object/class contract.

```ts
interface UserRepository {
  findById(id: string): Promise<User | null>;
}
```

`type` linh hoạt hơn, dùng tốt cho union, intersection, mapped type, function type.

```ts
type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };
```

So sánh:

| Tiêu chí | `interface` | `type` |
| --- | --- | --- |
| Object shape | Rất phù hợp | Phù hợp |
| Union type | Không | Có |
| Declaration merging | Có | Không |
| Mapped/conditional type | Hạn chế | Mạnh hơn |

Khi phỏng vấn:

> Em thường dùng interface cho public object contract hoặc abstraction như repository, service port. Em dùng type cho union, utility, mapped type hoặc API result phức tạp. Quan trọng nhất là convention thống nhất trong team.

### 3.4 Generic

Generic cho phép viết code tái sử dụng mà vẫn giữ type safety.

Ví dụ pagination:

```ts
type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

function createPaginatedResult<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number,
): PaginatedResult<T> {
  return { items, total, page, pageSize };
}
```

Khi dùng:

- Repository/helper dùng chung.
- API response wrapper.
- Pagination.
- Cache wrapper.
- Event/message envelope.

Không nên lạm dụng:

- Generic quá nhiều tầng làm code khó đọc.
- Generic không mang lại type safety thực tế.
- Dùng generic để "khoe kỹ thuật" thay vì giải quyết duplication.

### 3.5 Utility types hay dùng

- `Partial<T>`: tất cả field thành optional, hay dùng cho update nội bộ.
- `Required<T>`: tất cả field bắt buộc.
- `Pick<T, K>`: lấy một số field.
- `Omit<T, K>`: bỏ một số field.
- `Record<K, V>`: map key-value.
- `Readonly<T>`: tránh mutate object.
- `ReturnType<T>`: lấy kiểu return của function.

Ví dụ:

```ts
type UserPublicDto = Omit<User, "passwordHash" | "refreshTokenHash">;

type UpdateUserInput = Partial<Pick<User, "displayName" | "avatarUrl">>;

type PermissionMap = Record<string, boolean>;
```

Lưu ý: không nên dùng `Partial<Entity>` trực tiếp làm DTO public nếu entity có field nhạy cảm.

## 4. Kiến trúc NestJS

### 4.1 NestJS là gì?

NestJS là framework backend cho Node.js, thường dùng với TypeScript. Nest xây trên Express hoặc Fastify, cung cấp kiến trúc module, dependency injection, decorator, lifecycle và testing pattern.

NestJS phù hợp khi:

- Codebase backend lớn.
- Nhiều module/domain.
- Team cần convention rõ.
- Cần test, DI, guard, interceptor, validation, OpenAPI.

Ưu điểm:

- Có cấu trúc rõ ràng.
- DI tốt, dễ mock/test.
- Request lifecycle mạnh.
- Dễ tổ chức module theo domain.
- Hợp với enterprise/backend lớn.

Nhược điểm:

- Nhiều abstraction hơn Express thuần.
- Người mới cần hiểu decorator, DI, module.
- Nếu project rất nhỏ, Nest có thể hơi nặng.

Câu trả lời ngắn:

> Express cho mình web framework tối giản. NestJS xây trên Express/Fastify nhưng thêm kiến trúc module, DI, decorator, guard, pipe, interceptor, filter và testing pattern. Với project lớn, Nest giúp code có convention rõ và dễ maintain hơn.

### 4.2 Module

Module là đơn vị tổ chức code trong NestJS. Một module gom controller, provider và các dependency liên quan.

Ví dụ:

```ts
@Module({
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService],
})
export class UsersModule {}
```

Bản chất:

- `controllers`: xử lý HTTP route.
- `providers`: service, repository, client, helper được DI container quản lý.
- `imports`: import module khác.
- `exports`: provider cho module khác dùng.

Cách chia module:

- Theo feature/domain: `AuthModule`, `UsersModule`, `OrdersModule`.
- Tránh `SharedModule` quá lớn chứa mọi thứ.
- Không để business logic trong module file.

Pitfall:

- Circular dependency giữa module.
- Export quá nhiều provider làm boundary mờ.
- Module chia theo technical layer quá cứng như `ControllerModule`, `ServiceModule`, `RepositoryModule`, làm domain bị phân tán.

### 4.3 Controller

Controller nhận request từ client và trả response.

Controller nên làm:

- Định nghĩa route.
- Nhận params/body/query.
- Gọi service/use case.
- Trả DTO/response.

Controller không nên:

- Chứa business logic phức tạp.
- Query DB trực tiếp.
- Gọi nhiều external service và tự orchestration phức tạp.
- Format response/error thủ công lặp lại ở nhiều nơi.

Ví dụ:

```ts
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(":id")
  async getUser(@Param("id") id: string): Promise<UserResponseDto> {
    return this.usersService.getUserById(id);
  }
}
```

Câu cần nói:

> Controller là HTTP adapter. Business logic nên nằm ở service/use case để dễ test và không bị phụ thuộc HTTP layer.

### 4.4 Provider, Service, Repository

Provider là class/value/factory được Nest DI container quản lý và inject vào nơi khác.

Service thường chứa use case hoặc business orchestration.

Repository chịu trách nhiệm truy cập database/persistence.

Ranh giới nên có:

```text
Controller
  -> nhận HTTP request
Service / Use case
  -> xử lý business flow
Repository
  -> query database
External client
  -> gọi service bên ngoài
```

Ví dụ:

```ts
@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async getUserById(id: string): Promise<UserResponseDto> {
    const user = await this.usersRepository.findById(id);

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return UserResponseDto.fromEntity(user);
  }
}
```

Lợi ích khi tách:

- Dễ unit test service bằng cách mock repository.
- Có thể thay ORM/DB implementation dễ hơn.
- Controller mỏng, dễ đọc.
- Business rule tập trung.

### 4.5 Dependency Injection

Dependency Injection là kỹ thuật đưa dependency từ bên ngoài vào class thay vì class tự tạo dependency.

Không tốt:

```ts
class UsersService {
  private repository = new UsersRepository();
}
```

Tốt hơn trong Nest:

```ts
@Injectable()
class UsersService {
  constructor(private readonly repository: UsersRepository) {}
}
```

Lợi ích:

- Dễ test: mock dependency.
- Giảm coupling.
- Quản lý lifecycle provider tốt hơn.
- Dễ thay implementation bằng custom provider.

Custom provider:

```ts
{
  provide: "PAYMENT_CLIENT",
  useFactory: (config: ConfigService) => {
    return new PaymentClient(config.getOrThrow("PAYMENT_API_KEY"));
  },
  inject: [ConfigService],
}
```

Pitfall:

- Inject quá nhiều dependency vào một service là dấu hiệu service có quá nhiều trách nhiệm.
- Dùng string token lung tung làm khó refactor; nên đặt constant token.
- Circular dependency thường là dấu hiệu module/service boundary chưa tốt.

### 4.6 Injection scope

NestJS có 3 scope phổ biến:

| Scope | Ý nghĩa | Khi dùng |
| --- | --- | --- |
| Singleton | Một instance dùng chung toàn app | Mặc định, nên dùng hầu hết trường hợp |
| Request-scoped | Mỗi request tạo instance riêng | Khi provider cần state theo request |
| Transient | Mỗi nơi inject có instance riêng | Ít dùng, cho provider có state riêng |

Singleton là mặc định và thường tốt nhất.

Request-scoped provider có nhược điểm:

- Tạo nhiều object hơn.
- Có thể ảnh hưởng performance.
- Nếu một provider request-scoped được inject sâu, nhiều provider liên quan cũng có thể bị kéo theo request scope.

Câu trả lời:

> Em chỉ dùng request-scoped provider khi thật sự cần context riêng theo request và không muốn truyền context qua tham số. Mặc định em dùng singleton vì nhẹ và phù hợp với stateless service.

### 4.7 Dynamic module

Dynamic module là module có thể nhận config khi import.

Ví dụ quen thuộc:

```ts
JwtModule.register({
  secret: process.env.JWT_SECRET,
  signOptions: { expiresIn: "15m" },
});
```

Khi tự viết:

```ts
@Module({})
export class PaymentModule {
  static register(options: PaymentModuleOptions): DynamicModule {
    return {
      module: PaymentModule,
      providers: [
        {
          provide: PAYMENT_OPTIONS,
          useValue: options,
        },
        PaymentService,
      ],
      exports: [PaymentService],
    };
  }
}
```

Khi dùng:

- SDK module cần config.
- Module dùng lại ở nhiều app.
- Cần async config từ `ConfigService`.

Không nên dùng dynamic module nếu module chỉ dùng nội bộ đơn giản, vì sẽ làm code phức tạp không cần thiết.

### 4.8 Circular dependency

Circular dependency xảy ra khi A phụ thuộc B và B phụ thuộc A.

Ví dụ:

```text
UsersService -> AuthService
AuthService -> UsersService
```

Nest có `forwardRef`, nhưng không nên coi đó là giải pháp đầu tiên.

Cách xử lý tốt hơn:

- Tách shared logic ra service thứ ba.
- Đảo chiều dependency qua interface/event.
- Xem lại boundary giữa module.
- Dùng domain event nếu chỉ cần thông báo sau khi action xảy ra.

Câu trả lời:

> `forwardRef` giải quyết được lỗi DI trước mắt, nhưng nếu dùng nhiều thì thường là dấu hiệu thiết kế module chưa tốt. Em ưu tiên tách responsibility hoặc dùng event/interface để giảm coupling.

## 5. Request lifecycle trong NestJS

### 5.1 Thứ tự tổng quan

Một request trong NestJS thường đi qua:

```text
Client request
-> Middleware
-> Guard
-> Interceptor before
-> Pipe
-> Controller
-> Service/Provider
-> Interceptor after
-> Exception filter nếu có lỗi
-> Response
```

Cần nắm vì phỏng vấn NestJS rất hay hỏi guard, pipe, interceptor khác nhau như thế nào.

### 5.2 Middleware

Middleware chạy sớm ở tầng HTTP adapter.

Phù hợp để:

- Gắn request id.
- Logging request raw.
- Parse cookie.
- CORS/security header ở mức Express/Fastify.
- Attach metadata đơn giản vào request.

Không phù hợp để:

- Authorization dựa trên route metadata.
- Validate DTO.
- Transform response.

Lý do: middleware thường không có đầy đủ Nest execution context và decorator metadata như guard/interceptor.

### 5.3 Guard

Guard quyết định request có được đi tiếp vào route handler hay không.

Dùng cho:

- Authentication: user đã đăng nhập chưa?
- Authorization: user có role/permission không?
- Ownership: user có quyền trên resource này không?

Ví dụ:

```ts
@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    return Boolean(request.user);
  }
}
```

Câu trả lời:

> Guard trả lời câu hỏi "request này có được phép vào route không?". Vì guard có access tới execution context và metadata, nó phù hợp cho auth/authz hơn middleware.

### 5.4 Pipe

Pipe dùng để validate hoặc transform input trước khi vào controller method.

Ví dụ:

```ts
@Get(":id")
getUser(@Param("id", ParseIntPipe) id: number) {
  return this.usersService.getUser(id);
}
```

Dùng cho:

- Validate DTO.
- Transform string param thành number/UUID.
- Sanitize input.

Không dùng pipe cho:

- Authorization.
- Logging duration.
- Transform response.

### 5.5 Interceptor

Interceptor bọc quanh route handler, có thể chạy trước và sau handler.

Dùng cho:

- Logging thời gian xử lý.
- Transform response.
- Cache response.
- Timeout.
- Serialization.
- Mapping stream/observable.

Ví dụ ý tưởng:

```ts
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const startedAt = Date.now();

    return next.handle().pipe(
      tap(() => {
        console.log(`Request took ${Date.now() - startedAt}ms`);
      }),
    );
  }
}
```

Câu trả lời:

> Interceptor phù hợp cho cross-cutting concerns quanh handler, ví dụ logging, response mapping, cache, timeout. Nó khác pipe vì pipe xử lý input, khác guard vì guard quyết định có cho request đi tiếp không.

### 5.6 Exception filter

Exception filter dùng để bắt exception và chuyển thành response chuẩn.

Mục tiêu:

- Chuẩn hóa error response.
- Map domain error sang HTTP status.
- Không leak stack trace/internal error ra client.
- Gắn request id vào error response.

Ví dụ response:

```json
{
  "code": "USER_NOT_FOUND",
  "message": "User not found",
  "requestId": "req_123",
  "details": []
}
```

Pitfall:

- Mỗi controller tự `try/catch` rồi trả format khác nhau.
- Trả raw error từ database.
- Trả `500` cho lỗi validation/business.

## 6. DTO, validation và serialization

### 6.1 DTO là gì?

DTO là object mô tả dữ liệu đi vào hoặc đi ra khỏi API. DTO giúp tách API contract khỏi entity/internal model.

Input DTO:

- Validate request body/query/param.
- Mô tả field client được gửi.

Output DTO:

- Kiểm soát field trả về.
- Tránh leak field nhạy cảm như password hash, refresh token, internal flag.

Ví dụ:

```ts
export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsString()
  displayName?: string;
}
```

### 6.2 ValidationPipe

Cấu hình thường dùng:

```ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
);
```

Ý nghĩa:

- `whitelist: true`: loại bỏ field không khai báo trong DTO.
- `forbidNonWhitelisted: true`: báo lỗi nếu client gửi field lạ.
- `transform: true`: transform input theo DTO/metatype khi phù hợp.

Ưu điểm:

- Giảm boilerplate validate ở controller.
- API contract rõ.
- Tránh client gửi field ngoài ý muốn.

Giới hạn:

- Không thay thế business validation.
- Không thay thế DB constraint.
- Cần cẩn thận với transform nếu input phức tạp.

Ví dụ:

- DTO validate email format.
- Service check email đã tồn tại chưa.
- Database unique constraint đảm bảo cuối cùng không duplicate khi race condition.

### 6.3 Entity không nên trả thẳng ra API

Không nên:

```ts
return this.userRepository.findById(id);
```

Nếu entity có:

```ts
{
  id,
  email,
  passwordHash,
  refreshTokenHash,
  internalNote
}
```

Client có thể nhận field nhạy cảm nếu quên strip.

Nên map sang response DTO:

```ts
export class UserResponseDto {
  id!: string;
  email!: string;
  displayName!: string;

  static fromEntity(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
    };
  }
}
```

## 7. Authentication và Authorization

### 7.1 Authentication là gì?

Authentication là xác minh "người dùng là ai".

Ví dụ:

- Login bằng email/password.
- Verify JWT access token.
- Verify session cookie.
- Verify API key.

Kết quả authentication thường là `request.user`.

### 7.2 Authorization là gì?

Authorization là xác định "người dùng được làm gì".

Ví dụ:

- User đã login nhưng có được xóa bài viết này không?
- User có role admin không?
- User có permission `user:ban` không?
- User có phải owner của resource không?

Câu trả lời:

> Authentication trả lời "bạn là ai", authorization trả lời "bạn được làm gì". Trong NestJS, authentication/authorization thường được xử lý bằng guard.

### 7.3 JWT access token và refresh token

Access token:

- Thời gian sống ngắn.
- Gửi kèm request API.
- Dùng để xác thực nhanh.
- Nếu bị lộ, rủi ro giới hạn theo TTL.

Refresh token:

- Thời gian sống dài hơn.
- Dùng để lấy access token mới.
- Nên có rotation và revoke.
- Nếu lưu DB, nên lưu hash thay vì plaintext token.

Flow phổ biến:

```text
Login thành công
-> trả access token ngắn hạn
-> trả refresh token dài hơn qua HttpOnly cookie hoặc secure storage
Access token hết hạn
-> client gọi refresh endpoint
-> server verify refresh token
-> rotate refresh token
-> cấp access token mới
```

Vấn đề quan trọng:

- Token đặt ở localStorage dễ bị lấy nếu XSS.
- Cookie HttpOnly giảm rủi ro token bị JavaScript đọc, nhưng cần quan tâm CSRF.
- Refresh token nên revoke được khi logout/đổi mật khẩu/phát hiện bất thường.

### 7.4 RBAC, permission và ownership

RBAC là phân quyền theo role:

- `admin`
- `moderator`
- `user`

Ưu điểm:

- Dễ hiểu.
- Dễ triển khai.
- Hợp với hệ thống quyền đơn giản.

Nhược điểm:

- Khó linh hoạt khi permission phức tạp.
- Role có thể phình to.

Permission-based:

- `post:create`
- `post:update`
- `user:ban`
- `report:view`

Ưu điểm:

- Linh hoạt.
- Phù hợp hệ thống lớn.

Nhược điểm:

- Cần quản lý permission matrix.
- Dễ rối nếu không có convention.

Ownership:

- User chỉ sửa bài viết của chính họ.
- User chỉ xem order của chính họ.

Thực tế thường kết hợp:

```text
Role -> tập permission
Permission -> quyền hành động
Ownership -> quyền trên resource cụ thể
```

## 8. Database integration trong NestJS

### 8.1 Transaction boundary

Transaction boundary nên nằm ở service/use case layer, vì service hiểu toàn bộ business action.

Không tốt:

```text
Controller
-> repository A tự mở transaction
-> repository B tự mở transaction khác
```

Vấn đề:

- Một use case bị chia thành nhiều transaction.
- Có thể update một phần rồi fail.
- Khó rollback toàn bộ business action.

Tốt hơn:

```text
Service/use case
-> mở transaction
-> gọi repository A
-> gọi repository B
-> commit/rollback
```

Ví dụ business action:

- Tạo order.
- Trừ inventory.
- Tạo payment record.
- Ghi outbox event.

Các bước này nên nằm trong cùng transaction nếu yêu cầu atomicity.

### 8.2 Prisma vs TypeORM

Không nên trả lời kiểu "cái nào luôn tốt hơn". Nên nói trade-off.

Prisma:

- Developer experience tốt.
- Type safety tốt.
- Migration và schema rõ.
- Query phức tạp đôi khi cần raw SQL.
- Một số pattern transaction/custom repository cần thiết kế cẩn thận.

TypeORM:

- Gần với ORM truyền thống.
- Có entity, repository, decorator.
- Linh hoạt với pattern OOP.
- Type safety/query DX có thể không tốt bằng Prisma trong một số trường hợp.
- Dễ bị lạm dụng lazy relation/N+1 nếu không cẩn thận.

Câu trả lời:

> Em chọn theo team convention, độ phức tạp query, migration strategy và khả năng vận hành. Quan trọng hơn ORM là biết transaction boundary, query plan, index, migration và tránh N+1.

### 8.3 Migration

Migration là thay đổi schema database có version.

Cần chú ý:

- Migration phải được review như code.
- Không chạy destructive migration tùy tiện.
- Cần backward compatibility khi rolling deploy.
- Với thay đổi lớn nên dùng expand/contract pattern.

Ví dụ expand/contract:

1. Add column mới nullable.
2. Deploy code ghi cả field cũ và mới.
3. Backfill data.
4. Deploy code đọc field mới.
5. Drop field cũ sau khi an toàn.

## 9. Production readiness

### 9.1 Một API production-ready cần gì?

Không chỉ là "code chạy được". API production-ready cần:

- Validation input.
- Auth/authz.
- Error response chuẩn.
- Logging có request id/correlation id.
- Timeout khi gọi external service.
- Retry có kiểm soát với backoff.
- Health check/readiness.
- Graceful shutdown.
- Metrics: latency, error rate, throughput.
- Test cho use case quan trọng.
- Migration/rollback plan.
- Rate limit cho endpoint nhạy cảm.

### 9.2 Error response chuẩn

Nên có format thống nhất:

```json
{
  "code": "USER_EMAIL_EXISTS",
  "message": "Email already exists",
  "requestId": "req_123",
  "details": []
}
```

Lợi ích:

- Frontend xử lý lỗi dễ hơn.
- Log/trace dễ hơn.
- Không leak internal detail.
- API contract ổn định hơn.

Không nên:

- Trả raw SQL error.
- Trả stack trace.
- Mỗi endpoint một format lỗi.
- Dùng `500` cho mọi lỗi.

### 9.3 Logging

Log production nên là structured log, không chỉ string rời rạc.

Ví dụ:

```json
{
  "level": "error",
  "message": "Create order failed",
  "requestId": "req_123",
  "userId": "user_42",
  "route": "POST /orders",
  "latencyMs": 532,
  "errorCode": "PAYMENT_TIMEOUT"
}
```

Log tốt giúp trả lời:

- Request nào lỗi?
- User/tenant nào bị ảnh hưởng?
- Lỗi ở dependency nào?
- Latency nằm ở đoạn nào?
- Có correlation id để trace qua service khác không?

Không log:

- Password.
- Access token/refresh token.
- Secret/API key.
- PII nhạy cảm nếu không cần.

### 9.4 Timeout, retry, circuit breaker

Khi gọi external service, luôn cần timeout.

Retry:

- Chỉ retry lỗi tạm thời: timeout, network reset, 502/503.
- Dùng exponential backoff và jitter.
- Không retry vô điều kiện request không idempotent.

Circuit breaker:

- Nếu dependency fail liên tục, tạm ngưng gọi.
- Trả fallback/error nhanh.
- Tránh cascade failure.

Câu trả lời:

> Với external API, em luôn đặt timeout. Retry chỉ dùng cho lỗi tạm thời và phải có backoff. Với request có side effect, cần idempotency key trước khi retry. Nếu dependency lỗi liên tục, circuit breaker giúp hệ thống fail fast thay vì kéo sập toàn bộ request pool.

### 9.5 Graceful shutdown

Graceful shutdown nghĩa là khi app bị restart/deploy, app không cắt ngang request/job đang xử lý một cách tùy tiện.

Cần làm:

- Ngừng nhận request mới.
- Cho request đang chạy hoàn tất trong timeout hợp lý.
- Đóng DB connection.
- Dừng queue consumer đúng cách.
- Báo readiness false trước khi process bị kill.

Trong NestJS:

```ts
app.enableShutdownHooks();
```

Provider có thể implement:

- `OnModuleDestroy`
- `BeforeApplicationShutdown`
- `OnApplicationShutdown`

### 9.6 Health check

Health check không chỉ là trả `200 OK`.

Nên tách:

- Liveness: process còn sống không? Nếu fail thì restart.
- Readiness: app đã sẵn sàng nhận traffic chưa? Nếu fail thì tạm tháo khỏi load balancer.

Readiness có thể kiểm tra:

- DB connection.
- Redis connection nếu bắt buộc.
- Migration/schema version nếu cần.
- App đã warm up xong chưa.

Cẩn thận:

- Health check quá nặng có thể gây thêm tải.
- Liveness check phụ thuộc DB có thể làm app restart hàng loạt khi DB chập chờn.

## 10. Testing trong NestJS

### 10.1 Unit test

Unit test kiểm tra một đơn vị nhỏ, thường là service/use case, với dependency được mock.

Nên test:

- Happy path.
- Business rule fail.
- Dependency throw error.
- Side effect được gọi đúng.
- Không leak field nhạy cảm.

Ví dụ:

```ts
const moduleRef = await Test.createTestingModule({
  providers: [
    UsersService,
    {
      provide: UsersRepository,
      useValue: mockUsersRepository,
    },
  ],
}).compile();

const service = moduleRef.get(UsersService);
```

Ưu điểm:

- Nhanh.
- Dễ isolate business logic.
- Dễ chạy trong CI.

Nhược điểm:

- Không bắt được lỗi integration giữa module, pipe, guard, DB.

### 10.2 E2E test

E2E test kiểm tra từ HTTP layer qua app module đến dependency thật hoặc test container/test DB.

Nên cover:

- Auth flow.
- ValidationPipe.
- Guard/interceptor/filter.
- API contract chính.
- Use case quan trọng như create order, login, permission.

Ưu điểm:

- Gần production hơn.
- Bắt lỗi wiring/module/config.

Nhược điểm:

- Chậm hơn unit test.
- Setup phức tạp hơn.
- Dễ flaky nếu phụ thuộc external service thật.

### 10.3 Test pyramid thực tế

Nên có:

- Nhiều unit test cho business logic.
- Một số integration test cho repository/database query quan trọng.
- E2E test cho critical path.

Không nên chỉ có E2E vì chậm và khó debug. Cũng không nên chỉ có unit test vì có thể miss lỗi wiring/config.

## 11. Câu hỏi phỏng vấn hay gặp

### Node.js xử lý nhiều request như thế nào nếu JavaScript single-thread?

Node.js chạy JavaScript trên một main thread, nhưng I/O async được giao cho OS/libuv. Khi I/O hoàn tất, callback hoặc Promise continuation được đưa về event loop để xử lý. Vì vậy Node.js có thể xử lý nhiều request I/O-bound hiệu quả. Tuy nhiên nếu một request chạy CPU-heavy task trên main thread, event loop bị block và request khác sẽ chậm.

### Khi nào Node.js bị chậm?

Node.js bị chậm khi event loop bị block bởi CPU-heavy task, sync I/O, JSON payload quá lớn, xử lý file không dùng stream, hoặc dependency như DB/external API chậm nhưng không có timeout/backpressure. Cách xử lý là đo bottleneck, dùng async I/O, stream, worker/queue, cache, timeout và giới hạn concurrency.

### Guard, pipe, interceptor khác nhau thế nào?

Guard quyết định request có được vào route không, thường dùng cho auth/authz. Pipe validate hoặc transform input trước khi vào controller. Interceptor bọc quanh handler, dùng cho logging, transform response, cache, timeout. Exception filter xử lý lỗi và chuẩn hóa error response.

### Middleware và guard khác nhau thế nào?

Middleware chạy sớm ở tầng HTTP adapter và phù hợp cho request id, raw logging, parse cookie. Guard chạy sau middleware, có execution context và route metadata, phù hợp cho authentication và authorization.

### Vì sao không nên gọi repository trực tiếp từ controller?

Controller nên là HTTP adapter, không chứa business logic. Nếu controller gọi repository trực tiếp, business rule bị dính vào HTTP layer, khó test, khó reuse và dễ duplicate logic ở nhiều controller. Service/use case nên là nơi orchestration business flow.

### Khi nào dùng request-scoped provider?

Khi provider thật sự cần state riêng theo từng request, ví dụ request context phức tạp mà không muốn truyền qua tham số. Nhưng request scope tốn chi phí hơn singleton, nên không dùng mặc định.

### Làm sao upload/xử lý file lớn an toàn?

Không load toàn bộ file vào memory. Dùng stream/pipeline, giới hạn size/type, validate theo chunk/batch, lưu file vào object storage, xử lý hậu kỳ bằng background job nếu lâu, cập nhật progress và thiết kế retry/idempotency để worker crash không tạo duplicate.

### Một API production-ready cần gì?

Cần validation, auth/authz, error response chuẩn, logging có request id, metrics, tracing, timeout/retry, health check, graceful shutdown, test, CI/CD, migration/rollback plan và rate limit cho endpoint nhạy cảm.

