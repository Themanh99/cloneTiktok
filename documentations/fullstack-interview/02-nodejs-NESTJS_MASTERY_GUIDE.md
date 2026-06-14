# Hướng Dẫn Ôn Phỏng Vấn NestJS & Node.js

Tài liệu này tập trung vào kiến thức thường gặp trong phỏng vấn backend NestJS/Node.js. Bản cũ đã có các ý chính, nhưng bị trùng nhiều giữa phần kiến thức và phần hỏi đáp, thiếu nền tảng Node.js, thiếu các câu hỏi thực tế về production, transaction, performance, queue, logging, bảo mật và testing.

## 1. Mức Độ Cần Nắm

### Bắt buộc phải chắc

- Node.js event loop, non-blocking I/O, Promise, async/await, error handling.
- Cấu trúc NestJS: module, controller, provider, service, dependency injection.
- Request lifecycle: middleware, guard, interceptor, pipe, controller, service, exception filter.
- DTO, validation, transform dữ liệu, exception handling.
- Authentication/Authorization: JWT, Passport strategy, guard, role/permission.
- Database: repository/service boundary, transaction, migration, connection pooling.
- Testing: unit test service/controller, e2e test API, mock provider.

### Nên biết để trả lời tốt hơn

- Custom provider: `useClass`, `useValue`, `useFactory`, `useExisting`.
- Injection scope: singleton, request, transient; hiểu chi phí của request scope.
- Dynamic module, global module, circular dependency.
- Caching, rate limiting, queue/background job, logging, health check.
- Microservices trong NestJS: TCP, Redis, RabbitMQ, Kafka, gRPC; `send()` vs `emit()`.
- Production readiness: config, secrets, graceful shutdown, observability, retry, timeout.

### Có thể học sau nếu thời gian ít

- GraphQL, WebSocket, CQRS, event sourcing.
- Multi-tenant nâng cao.
- Custom transport strategy.
- Deep internals của Nest container.

## 2. Node.js Nền Tảng

### Event loop

Node.js chạy JavaScript chủ yếu trên một main thread, nhưng I/O bất đồng bộ được giao cho hệ điều hành hoặc libuv thread pool khi cần. Event loop nhận callback/promise continuation khi tác vụ hoàn tất.

Thứ tự cần nhớ ở mức phỏng vấn:

1. Code đồng bộ chạy trước.
2. Microtask queue chạy sau call stack hiện tại, gồm `Promise.then/catch/finally` và `queueMicrotask`.
3. `process.nextTick()` có độ ưu tiên rất cao trong Node.js, dùng quá nhiều có thể làm đói event loop.
4. Macrotask/phases gồm timers, pending callbacks, poll, check, close callbacks.
5. `setTimeout(fn, 0)` và `setImmediate(fn)` không luôn có thứ tự tuyệt đối nếu gọi từ top-level; trong I/O callback thì `setImmediate` thường chạy trước timer.

Ví dụ trả lời ngắn:

```ts
console.log("A");

setTimeout(() => console.log("B"), 0);
setImmediate(() => console.log("C"));

Promise.resolve().then(() => console.log("D"));
process.nextTick(() => console.log("E"));

console.log("F");
```

Kết quả thường gặp: `A F E D ...`. Phần `B/C` có thể phụ thuộc ngữ cảnh, nên khi phỏng vấn nên giải thích theo queue/phases thay vì học thuộc cứng.

### Blocking vs non-blocking

- Blocking: xử lý CPU nặng, vòng lặp lớn, sync filesystem, JSON parse/stringify payload quá lớn.
- Non-blocking: I/O qua callback/promise, database/network call async.
- CPU-bound task nên đưa sang worker thread, queue worker riêng, hoặc service riêng.

### Stream và backpressure

- Stream dùng để xử lý dữ liệu lớn theo từng chunk thay vì load toàn bộ vào RAM.
- Backpressure xảy ra khi producer ghi nhanh hơn consumer đọc. Trong Node.js nên dùng `pipe()`/`pipeline()` để xử lý backpressure và lỗi tốt hơn.
- Case phỏng vấn: upload/download file lớn, export CSV, proxy file từ S3.

### Error handling trong Node/Nest

- Luôn `await` promise hoặc return promise để lỗi không bị trôi.
- Dùng `try/catch` ở boundary khi cần map lỗi domain sang HTTP exception.
- Với Nest, ưu tiên ném `BadRequestException`, `UnauthorizedException`, `ForbiddenException`, `NotFoundException`, `ConflictException`, hoặc exception domain rồi để filter map ra response.
- Không expose stack trace, SQL error, secret, token trong response production.

## 3. Kiến Trúc NestJS Cốt Lõi

### Module

`@Module()` là đơn vị đóng gói feature. Module khai báo:

- `imports`: module khác mà module hiện tại cần dùng.
- `controllers`: HTTP entry points.
- `providers`: service, repository, helper, factory.
- `exports`: provider public cho module khác import.

Gợi ý tổ chức dự án:

```txt
src/
  app.module.ts
  common/
    filters/
    guards/
    interceptors/
    pipes/
  config/
  database/
  modules/
    auth/
    users/
    orders/
```

Tránh biến `SharedModule` thành nơi chứa mọi thứ. Service thuộc domain nào nên ở module domain đó, chỉ export thứ thật sự cần dùng ngoài module.

### Controller

Controller chỉ nên làm việc ở tầng HTTP:

- Định tuyến endpoint.
- Nhận `@Body()`, `@Param()`, `@Query()`, `@Headers()`.
- Gọi service.
- Trả response DTO hoặc object.

Không nên để business logic, query phức tạp hoặc transaction orchestration quá nhiều trong controller.

### Provider và Service

Provider là class/value/factory được Nest IoC container quản lý. Service thường chứa business logic. Repository hoặc Prisma/TypeORM service chứa data access.

Ví dụ boundary tốt:

- Controller: `POST /orders`.
- Service: kiểm tra user, tính tiền, tạo order, publish event.
- Repository/ORM: đọc/ghi database.

### Dependency Injection

Nest dùng IoC container để tạo dependency graph và inject provider qua constructor.

```ts
@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}
}
```

Custom provider cần biết:

```ts
providers: [
  { provide: CACHE_TTL, useValue: 60 },
  { provide: PaymentClient, useClass: StripePaymentClient },
  {
    provide: DATABASE_OPTIONS,
    useFactory: (config: ConfigService) => ({
      url: config.getOrThrow("DATABASE_URL"),
    }),
    inject: [ConfigService],
  },
  { provide: LoggerAlias, useExisting: LoggerService },
];
```

Khi dùng string token, nên khai báo constant/symbol riêng, tránh rải string literal khắp code.

### Injection scope

- `DEFAULT`: singleton, dùng cho hầu hết provider.
- `REQUEST`: tạo instance mới mỗi request, hữu ích cho tenant/request context nhưng tốn tài nguyên và có thể kéo scope lan lên controller/service phụ thuộc.
- `TRANSIENT`: mỗi consumer nhận instance riêng.

Trong phỏng vấn, câu trả lời tốt là: mặc định dùng singleton; request scope chỉ dùng khi có lý do rõ như per-request context, multi-tenant, correlation data. Với logging/correlation id, cân nhắc `AsyncLocalStorage` thay vì request-scoped service nếu hệ thống tải cao.

### Dynamic module

Dùng khi module cần cấu hình lúc import, ví dụ `ConfigModule.forRoot()`, `JwtModule.register()`, `DatabaseModule.forRootAsync()`.

```ts
@Module({})
export class DatabaseModule {
  static forRoot(options: DatabaseOptions): DynamicModule {
    return {
      module: DatabaseModule,
      providers: [{ provide: DATABASE_OPTIONS, useValue: options }],
      exports: [DATABASE_OPTIONS],
    };
  }
}
```

## 4. Request Lifecycle

Luồng tổng quát:

```txt
Middleware
-> Guards
-> Interceptors (before)
-> Pipes
-> Controller
-> Service/Provider
-> Interceptors (after)
-> Exception Filters nếu có lỗi
```

### Middleware

- Chạy trước guard.
- Thường dùng cho request logging thô, attach request id, parse cookie, tích hợp middleware Express/Fastify.
- Không phù hợp cho authorization theo route vì không có metadata handler/class như guard.

### Guard

- Quyết định request có được đi tiếp hay không.
- Dùng cho authentication, authorization, role/permission, feature flag.
- Có thể đọc metadata bằng `Reflector`.

### Interceptor

- Bọc trước/sau controller.
- Dùng cho response mapping, logging duration, cache, timeout, serialization, tracing.
- Vì dùng RxJS `Observable`, cần biết `next.handle().pipe(map(...), catchError(...))`.

### Pipe

- Transform và validate input.
- Ví dụ: `ParseIntPipe`, `ValidationPipe`, custom pipe parse ObjectId.
- Pipe chạy gần controller, sau guard/interceptor before.

### Exception filter

- Chuẩn hóa lỗi trả về client.
- Dùng khi muốn map lỗi database/domain sang HTTP response hoặc format error thống nhất.

## 5. Validation, DTO Và Serialization

Thiết lập nên dùng ở `main.ts`:

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

- `whitelist`: bỏ field không có decorator validation.
- `forbidNonWhitelisted`: báo lỗi nếu client gửi field lạ.
- `transform`: chuyển plain object sang DTO class, hỗ trợ parse type khi cấu hình đúng.

DTO nên tách theo use case:

```ts
export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}
```

Không dùng entity/database model trực tiếp làm request DTO hoặc response DTO. Request DTO phản ánh input client được phép gửi; response DTO kiểm soát dữ liệu trả ra, tránh leak `passwordHash`, internal flags, token.

## 6. Authentication Và Authorization

### Authentication

Luồng JWT phổ biến:

1. User login bằng email/password.
2. Service kiểm tra password bằng bcrypt/argon2.
3. Tạo access token ngắn hạn, refresh token dài hơn nếu cần.
4. `JwtStrategy` validate token và gắn user/payload vào request.
5. `AuthGuard('jwt')` bảo vệ endpoint.

Điểm phỏng vấn hay hỏi:

- Access token nên ngắn hạn; refresh token cần revoke/rotate nếu hệ thống yêu cầu bảo mật cao.
- Không lưu secret trong code.
- Không trả password hash ra API.
- Nên dùng HTTPS, secure cookie hoặc Authorization header tùy architecture.

### Authorization

- Role-based: `ADMIN`, `USER`, `MANAGER`.
- Permission-based: `user:create`, `order:refund`.
- Attribute-based: user chỉ sửa resource thuộc chính họ.

Ví dụ trả lời:

> JWT chỉ chứng minh "bạn là ai". Authorization quyết định "bạn được làm gì". Vì vậy sau `JwtAuthGuard`, hệ thống vẫn cần `RolesGuard`/`PoliciesGuard` hoặc logic ownership trong service.

## 7. Database, Transaction Và Migration

### Prisma vs TypeORM

Không nên trả lời tuyệt đối "Prisma luôn tốt hơn TypeORM". Câu trả lời cân bằng:

- Prisma: type-safety tốt, schema rõ, DX tốt, query API dễ đọc, migration tiện.
- TypeORM: quen với decorator/entity, repository pattern truyền thống, QueryBuilder linh hoạt, phù hợp team đã có nền OOP/ORM.
- Chọn theo team, legacy, độ phức tạp query, yêu cầu migration, ecosystem hiện có.

### Transaction

Khi một use case cần nhiều thao tác DB phải cùng thành công hoặc cùng rollback, dùng transaction.

Ví dụ:

- Tạo order.
- Trừ tồn kho.
- Ghi payment record.
- Ghi outbox event.

Nếu một bước fail, rollback toàn bộ.

Lưu ý:

- Không gọi API ngoài quá lâu bên trong DB transaction.
- Transaction càng ngắn càng tốt.
- Với message/event, cân nhắc outbox pattern để tránh DB commit thành công nhưng publish message thất bại.

### Migration

- Migration là version control cho schema database.
- Không sửa production DB thủ công.
- Local/dev có thể generate migration; production chỉ apply migration đã review.
- Migration destructive cần plan backfill/rollback rõ.

## 8. Performance Và Production Readiness

### Caching

- Cache read-heavy data bằng Redis hoặc cache manager.
- Cần TTL, invalidation strategy, cache key rõ ràng.
- Không cache dữ liệu nhạy cảm theo key chung.
- Với endpoint theo user, cache key phải chứa user/tenant context nếu dữ liệu khác nhau.

### Rate limiting

- Dùng để chống brute force, abuse, scraping.
- Login/register/password reset nên có limit riêng.
- Trong hệ thống có reverse proxy/load balancer, cần cấu hình trust proxy/IP extraction đúng.

### Queue/background job

Dùng queue khi task:

- Chạy lâu hơn request/response bình thường.
- Có retry.
- Không cần client chờ kết quả ngay.
- Ví dụ gửi email, resize video/image, sync third-party, generate report.

Trong Nest có thể dùng BullMQ/Redis hoặc message broker tùy hệ thống.

### Logging và observability

Nên có:

- Structured log JSON.
- Request id/correlation id.
- Error log có stack ở server, không expose cho client.
- Metrics: latency, error rate, throughput, queue lag.
- Health check cho app, DB, Redis, broker.

### Graceful shutdown

Khi deploy/restart:

- Ngừng nhận request mới.
- Chờ request đang chạy hoàn tất trong timeout.
- Đóng DB connection, Redis, broker consumer.
- Với Nest có thể bật shutdown hooks và xử lý lifecycle hooks như `onModuleDestroy`, `beforeApplicationShutdown`.

## 9. Microservices Trong NestJS

Nest hỗ trợ nhiều transport: TCP, Redis, MQTT, NATS, RabbitMQ, Kafka, gRPC.

Điểm cần phân biệt:

- `client.send(pattern, data)`: request-response, caller chờ kết quả.
- `client.emit(pattern, data)`: event fire-and-forget, phù hợp event-driven.

Khi chọn broker:

- RabbitMQ: task queue, routing, acknowledgement, retry/dead-letter tốt.
- Kafka: event streaming, throughput lớn, lưu log, consumer group, analytics/event pipeline.
- gRPC: service-to-service RPC typed contract, low latency.
- TCP/Redis transport: đơn giản hơn nhưng cần cân nhắc reliability/observability.

Trong microservices, cần nói thêm về timeout, retry, idempotency, tracing, schema/versioning và dead-letter queue.

## 10. Testing

### Unit test

Test service/controller độc lập bằng `Test.createTestingModule`.

- Mock repository, external API, queue, mailer.
- Assert output và side effect.
- Test cả happy path và error path.

```ts
const moduleRef = await Test.createTestingModule({
  providers: [
    UsersService,
    { provide: UsersRepository, useValue: mockUsersRepository },
  ],
}).compile();
```

### E2E test

- Boot app gần giống thật.
- Gọi HTTP bằng `supertest`.
- Dùng test database hoặc containerized DB.
- Test validation, auth, status code, response shape, side effect trong DB.

### Test thực tế nên có

- Login sai password trả `401`.
- User thường gọi endpoint admin trả `403`.
- Create resource thiếu field trả `400`.
- Unique email conflict trả `409`.
- Transaction fail thì không ghi nửa vời.

## 11. Câu Hỏi Thực Tế Hay Gặp

### 1. NestJS khác Express ở điểm nào?

Express là framework HTTP tối giản. NestJS xây trên Express hoặc Fastify adapter và cung cấp kiến trúc opinionated: module, DI, decorator, guard, pipe, interceptor, testing utilities. Nest phù hợp codebase lớn vì cấu trúc rõ và dễ test hơn, nhưng có learning curve và abstraction overhead.

### 2. Vì sao không nên gọi repository trực tiếp từ controller?

Controller là HTTP boundary, không nên chứa business logic. Nếu controller gọi repository trực tiếp, logic nghiệp vụ bị rải rác, khó test, khó tái sử dụng và khó đảm bảo transaction/authorization nhất quán. Service nên điều phối use case.

### 3. Guard, pipe, interceptor khác nhau thế nào?

Guard quyết định có cho request đi tiếp không. Pipe validate/transform input. Interceptor bọc trước/sau controller để logging, mapping response, cache, timeout. Nếu sai auth dùng guard; sai input dùng pipe; muốn đổi response format dùng interceptor.

### 4. Middleware và guard khác nhau thế nào?

Middleware chạy sớm, gần tầng HTTP adapter, không có context metadata mạnh như guard. Guard hiểu execution context và đọc được metadata từ controller/handler nên phù hợp auth/role theo route.

### 5. Request lifecycle trong NestJS?

Middleware -> Guards -> Interceptors before -> Pipes -> Controller -> Service -> Interceptors after -> Exception Filters nếu có lỗi.

### 6. `ValidationPipe` nên cấu hình thế nào?

Thường dùng `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`. Cấu hình này loại/báo lỗi field lạ, validate DTO và hỗ trợ transform input. Production có thể tùy chỉnh `exceptionFactory` để chuẩn hóa error response.

### 7. Khi nào dùng request-scoped provider?

Khi provider thật sự cần state riêng cho từng request như tenant context hoặc per-request cache. Không dùng mặc định vì request scope tạo nhiều instance hơn, tăng GC và có thể làm scope lan lên các dependency khác.

### 8. Dynamic module dùng để làm gì?

Dùng để module nhận config lúc import và tự đăng ký provider tương ứng. Ví dụ `JwtModule.registerAsync()`, `DatabaseModule.forRootAsync()`. Nó giúp module tái sử dụng được ở nhiều app/môi trường.

### 9. Circular dependency là gì và xử lý thế nào?

Circular dependency xảy ra khi A phụ thuộc B và B phụ thuộc A. Cách tốt nhất là tách trách nhiệm hoặc tạo service trung gian để phá vòng. `forwardRef()` là giải pháp kỹ thuật khi chưa refactor được, không nên lạm dụng.

### 10. Làm sao chuẩn hóa error response?

Dùng exception filter global để map `HttpException`, lỗi ORM, lỗi domain thành format thống nhất. Service có thể ném lỗi domain hoặc exception phù hợp; filter quyết định response cuối cùng.

### 11. Làm sao xử lý transaction trong NestJS?

Transaction thường đặt ở service/use case layer vì service biết toàn bộ nghiệp vụ cần atomic. Với Prisma dùng `$transaction`; với TypeORM dùng `QueryRunner` hoặc transaction manager. Không giữ transaction mở khi gọi external API lâu.

### 12. Làm sao tránh publish event thất bại sau khi DB commit?

Dùng outbox pattern: trong cùng transaction ghi business data và outbox event vào DB. Worker riêng đọc outbox để publish message, có retry/idempotency. Cách này giảm rủi ro mất event.

### 13. Khi nào dùng queue thay vì xử lý trực tiếp trong request?

Khi tác vụ lâu, dễ fail cần retry, hoặc không cần client chờ: gửi email, tạo report, xử lý video, sync third-party. API chỉ enqueue job và trả response phù hợp.

### 14. Làm sao bảo vệ endpoint login?

Dùng rate limit theo IP/user/email, hash password bằng bcrypt/argon2, trả lỗi chung để tránh user enumeration, log attempt bất thường, có lockout/captcha tùy mức rủi ro.

### 15. JWT access token và refresh token khác nhau thế nào?

Access token ngắn hạn dùng để gọi API. Refresh token dài hơn dùng lấy access token mới. Refresh token cần lưu/revoke/rotate nếu muốn logout hoặc phát hiện token reuse.

### 16. Role-based và permission-based authorization khác nhau thế nào?

Role-based gán quyền theo vai trò như admin/user. Permission-based chi tiết hơn theo hành động như `order:refund`. Hệ thống lớn thường dùng permission/policy vì role dễ quá rộng.

### 17. Prisma và TypeORM chọn cái nào?

Không có đáp án tuyệt đối. Prisma mạnh về type-safety và DX. TypeORM hợp với entity/decorator/repository truyền thống. Chọn theo team, legacy, kiểu query, migration workflow và ecosystem.

### 18. Làm sao tối ưu endpoint chậm?

Đo trước bằng log/metrics/tracing. Kiểm tra N+1 query, thiếu index, payload quá lớn, gọi external API tuần tự, CPU-bound task, cache miss. Sau đó tối ưu query/index, parallelize I/O, cache, queue background job hoặc tách worker.

### 19. Node.js xử lý nhiều request cùng lúc thế nào nếu JavaScript single-thread?

JavaScript chạy trên main thread, nhưng I/O không blocking được giao cho OS/libuv. Khi I/O hoàn tất, callback/promise continuation quay lại event loop. Vì vậy Node xử lý concurrency tốt với I/O-bound workload, nhưng CPU-bound có thể block event loop.

### 20. Promise, `process.nextTick`, `setImmediate`, `setTimeout` khác nhau thế nào?

Promise callback là microtask. `process.nextTick` có queue ưu tiên cao của Node. `setTimeout` chạy ở timers phase sau thời gian tối thiểu. `setImmediate` chạy ở check phase. Không nên lạm dụng `nextTick` vì có thể làm event loop không quay lại I/O.

### 21. Làm sao upload file lớn an toàn?

Giới hạn size/type, stream file thay vì load vào RAM, scan nếu cần, lưu object storage, không tin filename từ client, dùng signed URL khi phù hợp, xử lý cleanup khi upload fail.

### 22. E2E test khác unit test thế nào?

Unit test cô lập một class/function và mock dependency. E2E test boot app, gọi endpoint thật qua HTTP, kiểm tra integration giữa route, validation, guard, service và DB/test infra.

### 23. Làm sao mock provider trong test NestJS?

Dùng `Test.createTestingModule()` và override provider bằng `useValue` hoặc `overrideProvider().useValue()`. Mock chỉ nên mô phỏng contract cần test, tránh mock quá sâu làm test phụ thuộc implementation.

### 24. Khi nào dùng Fastify thay Express trong Nest?

Fastify thường có performance tốt hơn và schema ecosystem riêng, phù hợp workload cần throughput cao. Express phổ biến, middleware nhiều, dễ tích hợp legacy. Cần kiểm tra compatibility middleware trước khi đổi adapter.

### 25. Một API production-ready cần những gì ngoài code chạy được?

Config theo môi trường, validation, auth, rate limit, logging có correlation id, metrics/tracing, health check, graceful shutdown, migration strategy, test, CI/CD, secret management, backup/rollback plan.

## 12. Plan Ôn Tập 7 Ngày

### Ngày 1: Node.js core

- Event loop, microtask/macrotask, `nextTick`, `setImmediate`.
- Blocking vs non-blocking.
- Stream/backpressure.
- Làm 5 câu hỏi thực tế phần Node.js.

### Ngày 2: Nest architecture

- Module, controller, provider, DI.
- Custom provider, scope, dynamic module.
- Vẽ dependency graph của một feature bất kỳ.

### Ngày 3: Request lifecycle

- Middleware, guard, interceptor, pipe, filter.
- Viết thử custom `CurrentUser`, `RolesGuard`, `TransformResponseInterceptor`.

### Ngày 4: Auth, validation, security

- JWT strategy, refresh token, role/permission.
- DTO validation config.
- Rate limit, CORS, Helmet, password hashing.

### Ngày 5: Database

- Prisma/TypeORM tradeoff.
- Transaction, migration, index, N+1 query.
- Case order/payment/inventory.

### Ngày 6: Production patterns

- Cache, queue, retry, timeout.
- Logging, health check, graceful shutdown.
- Microservice `send` vs `emit`, broker tradeoff.

### Ngày 7: Mock interview

- Tự trả lời toàn bộ 25 câu thực tế.
- Chuẩn bị 2 project stories: một bug khó, một tối ưu performance, một thiết kế API/module.
- Ôn lại điểm yếu và luyện trả lời ngắn 1-2 phút/câu.

## 13. Checklist Trước Khi Phỏng Vấn

- Giải thích được request lifecycle không nhìn tài liệu.
- Phân biệt guard/pipe/interceptor/filter bằng ví dụ thực tế.
- Nói được DI scope và custom provider.
- Có ví dụ transaction thực tế.
- Có ví dụ xử lý endpoint chậm.
- Có ví dụ test service và e2e endpoint.
- Có kinh nghiệm hoặc phương án cho auth, queue, cache, logging.
- Trả lời được ít nhất 20/25 câu hỏi ở phần trên.

## Nguồn Chính Thức Đã Đối Chiếu

- NestJS Custom Providers: https://docs.nestjs.com/fundamentals/custom-providers
- NestJS Injection Scopes: https://docs.nestjs.com/fundamentals/injection-scopes
- NestJS Request Lifecycle: https://docs.nestjs.com/faq/request-lifecycle
- NestJS Validation: https://docs.nestjs.com/techniques/validation
- Node.js Event Loop: https://nodejs.org/learn/asynchronous-work/event-loop-timers-and-nexttick
