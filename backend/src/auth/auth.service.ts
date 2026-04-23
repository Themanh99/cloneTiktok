import { ConflictException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { MessageCode } from '../common/constants/message-codes';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private googleClient: OAuth2Client;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    // Initialize Google OAuth client once
    this.googleClient = new OAuth2Client(this.configService.get<string>('GOOGLE_CLIENT_ID'));
  }

  // === REGISTER ===
  async register(dto: RegisterDto) {
    // 1. Check if email or username already exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          {
            email: dto.email,
            username: dto.username,
          },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.email === dto.email) {
        throw new ConflictException({
          message: 'Email already exists',
          messageCode: MessageCode.AUTH_EMAIL_EXISTS,
        });
      }
      throw new ConflictException({
        message: 'Username already exists',
        messageCode: MessageCode.AUTH_USERNAME_EXISTS,
      });
    }

    // 2. Hash password
    // saltRounds = 10 → each hash takes ~100ms
    // Increase to 12 for more security but 4x slower
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // 3. Create user
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        username: dto.username,
        displayName: dto.displayName,
        provider: 'LOCAL',
      },
    });

    const tokens = await this.generateTokens(user.id, user.email);

    await this.saveRefreshToken(user.id, tokens.refreshToken);
    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  // === LOGIN ===
  async login(dto: LoginDto) {
    // 1. Find user by email
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException({
        message: 'Email or password is invalid',
        messageCode: MessageCode.AUTH_INVALID_CREDENTIALS,
      });
    }

    // 2. Compare password
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException({
        message: 'Email or password is invalid',
        messageCode: MessageCode.AUTH_INVALID_CREDENTIALS,
      });
    }

    // 3. Check account status
    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException({
        message: 'Account is not active',
        messageCode: MessageCode.AUTH_ACCOUNT_INACTIVE,
      });
    }

    // 4. Generate tokens
    const tokens = await this.generateTokens(user.id, user.email);

    await this.saveRefreshToken(user.id, tokens.refreshToken);
    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  // === REFRESH TOKEN ===
  async refreshToken(refreshToken: string) {
    // 1. Look up token in DB
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: {
        user: true,
      },
    });

    if (!storedToken) {
      throw new UnauthorizedException({
        message: 'Invalid refresh token',
        messageCode: MessageCode.AUTH_INVALID_REFRESH_TOKEN,
      });
    }

    // 2. Check token expiration
    if (storedToken.expiresAt <= new Date()) {
      await this.prisma.refreshToken.delete({
        where: { id: storedToken.id },
      });
      throw new UnauthorizedException({
        message: 'Refresh token has expired',
        messageCode: MessageCode.AUTH_REFRESH_TOKEN_EXPIRED,
      });
    }

    // 3. Token rotation: delete old token, then issue a new pair
    await this.prisma.refreshToken.delete({
      where: { id: storedToken.id },
    });

    // 4. Generate new token pair
    const tokens = await this.generateTokens(storedToken.user.id, storedToken.user.email);
    await this.saveRefreshToken(storedToken.user.id, tokens.refreshToken);

    return tokens;
  }

  // ==================== LOGOUT ====================
  async logout(refreshToken: string) {
    // Delete token from DB → it can no longer be used
    await this.prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
  }

  // === GOOGLE LOGIN ===
  async googleLogin(idToken: string) {
    // 1. Verify idToken with Google
    // Google returns: email, name, picture, sub
    let googleUser;
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: this.configService.get('GOOGLE_CLIENT_ID'),
      });
      googleUser = ticket.getPayload();
    } catch (error) {
      throw new UnauthorizedException({
        message: 'Invalid Google token',
        messageCode: MessageCode.AUTH_INVALID_GOOGLE_TOKEN,
      });
    }

    // 2. Find or create user
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [{ providerId: googleUser.sub, provider: 'GOOGLE' }, { email: googleUser.email }],
      },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: googleUser.email,
          displayName: googleUser.name,
          avatarUrl: googleUser.picture,
          provider: 'GOOGLE',
          providerId: googleUser.sub,
          username: this.generateUsername(googleUser.name),
          isVerified: googleUser.email_verified || false,
        },
      });
    } else if (user.provider === 'LOCAL') {
      user = await this.prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          provider: 'GOOGLE',
          providerId: googleUser.sub,
          displayName: googleUser.name,
          avatarUrl: googleUser.picture,
        },
      });
    }

    const tokens = await this.generateTokens(user.id, user.email);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    // Access token — TTL 15 minutes
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get('JWT_ACCESS_EXPRIATION') || '15m',
    });

    // Refresh token — TTL 7 days
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPRIATION') || '7d',
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  private async saveRefreshToken(userId: string, token: string) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.prisma.refreshToken.create({
      data: { token, userId, expiresAt },
    });
  }

  // Strip sensitive fields before returning to client
  private sanitizeUser(user: any) {
    const { password, providerId, ...sanitized } = user;
    return sanitized;
  }

  // Generate username from Google name (add random suffix to avoid duplicates)
  private generateUsername(name: string): string {
    const base = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const suffix = Math.floor(Math.random() * 10000);
    return `${base}${suffix}`;
  }
}
