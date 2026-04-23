import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { MessageCode } from '../../common/constants/message-codes';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // Reads the token from the Authorization header
      ignoreExpiration: false,
      // false = auto-reject expired tokens
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET'),
    });
  }

  // validate() runs after the token has been successfully verified.
  // payload: { sub: userId, email, iat, exp }
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
      throw new UnauthorizedException({
        message: 'User not found',
        messageCode: MessageCode.USER_NOT_FOUND,
      });
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException({
        message: 'User is not active',
        messageCode: MessageCode.USER_NOT_ACTIVE,
      });
    }
    // This object is attached to request.user
    // → Use @CurrentUser() decorator to access it
    return user;
  }
}
