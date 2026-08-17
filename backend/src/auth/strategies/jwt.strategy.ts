import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { UserSession } from '../decorators/current-user.decorator';

interface JwtPayload {
  sub: number;
  email: string;
  role: string;
  vendorId: number | null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request): string | null => {
          let token = null;
          if (req && req.cookies) {
            token = req.cookies['access_token'] as string | undefined;
          }
          return token || ExtractJwt.fromAuthHeaderAsBearerToken()(req);
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'fallback-access-secret',
    });
  }

  validate(payload: unknown): UserSession {
    const typedPayload = payload as JwtPayload | undefined;
    if (!typedPayload || typeof typedPayload.sub !== 'number') {
      throw new UnauthorizedException();
    }
    // Attach { vendor_user_id, vendor_id, role, email } to request.user
    return {
      vendor_user_id: typedPayload.sub,
      vendor_id: typedPayload.vendorId,
      role: typedPayload.role,
      email: typedPayload.email,
    };
  }
}
