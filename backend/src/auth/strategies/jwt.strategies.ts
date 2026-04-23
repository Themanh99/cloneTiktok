import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      //    Read token from header Authorization
      ignoreExpiration: false,
      // False  = auto reject token was expired
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET'),
    });
  }

  //   validate chay sau khi token da verify thanh cong
  //  payload { sub: userId , email , username, iat, exp}
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
      throw new UnauthorizedException('User not found');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User not active');
    }
    // Object này sẽ gắn vào request.user
    // → Dùng @CurrentUser() decorator để lấy
    return user;
  }
}
