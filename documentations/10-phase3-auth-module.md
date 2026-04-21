# 🔐 Phase 3: Auth Module (Chi tiết từng bước)

> **Thời gian ước tính:** 4 ngày
> **Mục tiêu:** Đăng ký, Đăng nhập, JWT Refresh Token rotation, Google SSO
> **Điều kiện:** Phase 2 hoàn thành, PrismaService + RedisService hoạt động

---

## Bước 3.1: Tạo Auth Module (NestJS CLI)

```bash
cd d:\Code\tiktokweb\backend

# NestJS CLI tự tạo file + import vào AppModule
nest generate module auth
nest generate controller auth
nest generate service auth
```

**Kết quả:**
```
src/auth/
├── auth.module.ts
├── auth.controller.ts
├── auth.service.ts
```

> **Lưu ý:** CLI tự thêm `AuthModule` vào `imports` của `AppModule`. Kiểm tra `app.module.ts` để xác nhận.

---

## Bước 3.2: Tạo DTOs (Data Transfer Objects)

### Tại sao cần DTO?
- **Validation:** Đảm bảo client gửi đúng format
- **Security:** Chỉ nhận fields mong muốn, chặn field injection
- **Documentation:** DTO = contract giữa FE và BE

### File `src/auth/dto/register.dto.ts`

```typescript
import { IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password phải có ít nhất 8 ký tự' })
  @MaxLength(32)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số',
  })
  // Regex giải thích:
  // (?=.*[a-z]) → có ít nhất 1 chữ thường
  // (?=.*[A-Z]) → có ít nhất 1 chữ hoa
  // (?=.*\d)    → có ít nhất 1 chữ số
  password: string;

  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9._]+$/, {
    message: 'Username chỉ chứa chữ cái, số, dấu chấm và gạch dưới',
  })
  username: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  displayName: string;
}
```

### File `src/auth/dto/login.dto.ts`

```typescript
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(1) // Không reveal password policy ở login error
  password: string;
}
```

### File `src/auth/dto/refresh-token.dto.ts`

```typescript
import { IsString, IsNotEmpty } from 'class-validator';

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
```

### File `src/auth/dto/google-auth.dto.ts`

```typescript
import { IsString, IsNotEmpty } from 'class-validator';

export class GoogleAuthDto {
  @IsString()
  @IsNotEmpty()
  idToken: string;
  // idToken là JWT token do Google SDK trả về cho frontend
  // Backend sẽ verify token này với Google servers
}
```

---

## Bước 3.3: JWT Strategy (Passport)

### File `src/auth/strategies/jwt.strategy.ts`

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

// Passport Strategy giải thích:
// Mỗi request có header "Authorization: Bearer <token>"
// Strategy này tự động:
// 1. Extract token từ header
// 2. Verify signature bằng JWT_ACCESS_SECRET
// 3. Check expiry (15m)
// 4. Gọi validate() với payload đã decode
// 5. Trả về user object → gắn vào request.user

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // Đọc token từ header "Authorization: Bearer xxx"
      ignoreExpiration: false,
      // false = tự động reject token hết hạn
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET'),
    });
  }

  // validate() chạy SAU KHI token đã verify thành công
  // payload = { sub: userId, email, username, iat, exp }
  async validate(payload: { sub: string; email: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        status: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User không tồn tại');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Tài khoản đã bị khóa');
    }

    // Object này sẽ gắn vào request.user
    // → Dùng @CurrentUser() decorator để lấy
    return user;
  }
}
```

### File `src/common/guards/jwt-auth.guard.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Guard này dùng JwtStrategy ở trên
// Sử dụng: @UseGuards(JwtAuthGuard) trước controller method
// Hoặc apply global cho cả controller
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

// Cách dùng trong controller:
// @UseGuards(JwtAuthGuard)
// @Get('profile')
// getProfile(@CurrentUser() user) { return user; }
```

---

## Bước 3.4: Auth Service (Business Logic)

### File `src/auth/auth.service.ts`

```typescript
import {
  Injectable, UnauthorizedException, ConflictException, Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private googleClient: OAuth2Client;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    // Khởi tạo Google OAuth client 1 lần
    this.googleClient = new OAuth2Client(
      this.configService.get('GOOGLE_CLIENT_ID'),
    );
  }

  // ==================== REGISTER ====================
  async register(dto: RegisterDto) {
    // 1. Check email + username đã tồn tại chưa
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: dto.email },
          { username: dto.username },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.email === dto.email) {
        throw new ConflictException('Email đã được sử dụng');
      }
      throw new ConflictException('Username đã được sử dụng');
    }

    // 2. Hash password
    // saltRounds = 10: đủ an toàn, mỗi hash mất ~100ms
    // Tăng lên 12 nếu muốn bảo mật hơn (nhưng chậm hơn 4x)
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // 3. Tạo user
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        username: dto.username,
        displayName: dto.displayName,
        provider: 'LOCAL',
      },
    });

    // 4. Generate tokens
    const tokens = await this.generateTokens(user.id, user.email);

    // 5. Lưu refresh token vào DB
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  // ==================== LOGIN ====================
  async login(dto: LoginDto) {
    // 1. Tìm user by email
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.password) {
      // KHÔNG nói "email không tồn tại" → lộ thông tin
      // Luôn trả message chung chung
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    // 2. So sánh password
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    // 3. Check account status
    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Tài khoản đã bị khóa');
    }

    // 4. Generate tokens
    const tokens = await this.generateTokens(user.id, user.email);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  // ==================== REFRESH TOKEN ====================
  async refreshToken(refreshToken: string) {
    // 1. Tìm token trong DB
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }

    // 2. Check hết hạn
    if (storedToken.expiresAt < new Date()) {
      // Xóa token hết hạn
      await this.prisma.refreshToken.delete({
        where: { id: storedToken.id },
      });
      throw new UnauthorizedException('Refresh token đã hết hạn');
    }

    // 3. Token Rotation: Xóa token cũ, tạo token mới
    // Tại sao rotation?
    // Nếu hacker đánh cắp refresh token và dùng nó,
    // user thật cũng dùng token đó → 1 trong 2 sẽ bị reject
    // → Phát hiện token bị đánh cắp
    await this.prisma.refreshToken.delete({
      where: { id: storedToken.id },
    });

    // 4. Tạo cặp token mới
    const tokens = await this.generateTokens(
      storedToken.user.id,
      storedToken.user.email,
    );
    await this.saveRefreshToken(storedToken.user.id, tokens.refreshToken);

    return tokens;
  }

  // ==================== LOGOUT ====================
  async logout(refreshToken: string) {
    // Xóa refresh token khỏi DB → không thể dùng lại
    await this.prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
  }

  // ==================== GOOGLE SSO ====================
  async googleLogin(idToken: string) {
    // 1. Verify idToken với Google
    // Google trả về: email, name, picture, sub (Google user ID)
    let googleUser;
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: this.configService.get('GOOGLE_CLIENT_ID'),
      });
      googleUser = ticket.getPayload();
    } catch {
      throw new UnauthorizedException('Google token không hợp lệ');
    }

    // 2. Tìm hoặc tạo user (Upsert)
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { providerId: googleUser.sub, provider: 'GOOGLE' },
          { email: googleUser.email },
        ],
      },
    });

    if (!user) {
      // Tạo user mới từ Google profile
      user = await this.prisma.user.create({
        data: {
          email: googleUser.email,
          provider: 'GOOGLE',
          providerId: googleUser.sub,
          username: this.generateUsername(googleUser.name),
          displayName: googleUser.name,
          avatarUrl: googleUser.picture,
          isVerified: googleUser.email_verified || false,
        },
      });
    } else if (user.provider === 'LOCAL') {
      // User đã đăng ký bằng email trước → link Google account
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          provider: 'GOOGLE',
          providerId: googleUser.sub,
          avatarUrl: user.avatarUrl || googleUser.picture,
        },
      });
    }

    // 3. Generate tokens
    const tokens = await this.generateTokens(user.id, user.email);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  // ==================== HELPER METHODS ====================

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    // Access Token: ngắn hạn (15m), dùng cho mọi API call
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRATION') || '15m',
    });

    // Refresh Token: dài hạn (7d), chỉ dùng để lấy access token mới
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION') || '7d',
    });

    return { accessToken, refreshToken };
  }

  private async saveRefreshToken(userId: string, token: string) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 ngày

    await this.prisma.refreshToken.create({
      data: { token, userId, expiresAt },
    });
  }

  // Loại bỏ sensitive fields trước khi trả về client
  private sanitizeUser(user: any) {
    const { password, providerId, ...sanitized } = user;
    return sanitized;
  }

  // Tạo username từ tên Google (thêm random suffix nếu trùng)
  private generateUsername(name: string): string {
    const base = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const suffix = Math.floor(Math.random() * 10000);
    return `${base}${suffix}`;
  }
}
```

---

## Bước 3.5: Auth Controller (API Endpoints)

### File `src/auth/auth.controller.ts`

```typescript
import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('auth') // Prefix: /api/auth (vì main.ts có setGlobalPrefix('api'))
export class AuthController {
  constructor(private authService: AuthService) {}

  // POST /api/auth/register
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  // POST /api/auth/login
  @Post('login')
  @HttpCode(HttpStatus.OK) // Login trả 200 thay vì 201 (default cho POST)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // POST /api/auth/refresh
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  // POST /api/auth/logout
  @Post('logout')
  @UseGuards(JwtAuthGuard) // Phải đăng nhập mới logout được
  @HttpCode(HttpStatus.OK)
  logout(@Body() dto: RefreshTokenDto) {
    return this.authService.logout(dto.refreshToken);
  }

  // POST /api/auth/google
  @Post('google')
  @HttpCode(HttpStatus.OK)
  googleAuth(@Body() dto: GoogleAuthDto) {
    return this.authService.googleLogin(dto.idToken);
  }
}
```

---

## Bước 3.6: Cấu hình Auth Module

### File `src/auth/auth.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
    // register({}) trống vì ta set secret/expiry trong AuthService
    // mỗi khi sign token (access vs refresh dùng secret khác nhau)
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService], // Export cho modules khác dùng (VD: check auth trong WebSocket)
})
export class AuthModule {}
```

---

## Bước 3.7: Test Auth Module

### Test bằng cURL / Postman / Thunder Client (VS Code extension)

```bash
# 1. Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234",
    "username": "testuser",
    "displayName": "Test User"
  }'
# → { data: { user: {...}, accessToken: "...", refreshToken: "..." } }

# 2. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "Test1234"}'
# → { data: { user: {...}, accessToken: "...", refreshToken: "..." } }

# 3. Refresh
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "<paste_refresh_token_here>"}'
# → { data: { accessToken: "new...", refreshToken: "new..." } }

# 4. Test JWT Guard (protected route — sẽ thêm ở Phase 4)
curl -X GET http://localhost:3000/api/users/me \
  -H "Authorization: Bearer <paste_access_token_here>"
```

### ✅ Output Phase 3:
```
✅ POST /api/auth/register — tạo user + trả tokens
✅ POST /api/auth/login — verify password + trả tokens
✅ POST /api/auth/refresh — token rotation
✅ POST /api/auth/logout — xóa refresh token
✅ POST /api/auth/google — Google SSO verify + upsert user
✅ JwtStrategy + JwtAuthGuard hoạt động
✅ DTO validation chặn input sai
✅ Password hash bằng bcrypt
✅ Sanitize user (không trả password)
```

---

## ⏭️ Tiếp theo: [Phase 4 — User & Follow Module](./11-phase4-user-follow.md)
