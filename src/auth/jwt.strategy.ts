import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';
import type { AuthenticatedUser } from './auth.types';

interface JwtPayload {
  sub: number;
  email: string;
}

const cookieExtractor = (request: Request): string | null => {
  const cookies = request.cookies as Record<string, string> | undefined;
  return cookies?.ideabox_session ?? null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const secret = process.env.AUTH_JWT_SECRET;
    if (!secret) throw new Error('AUTH_JWT_SECRET est obligatoire');
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieExtractor,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  validate(payload: JwtPayload): AuthenticatedUser {
    return { id: payload.sub, email: payload.email };
  }
}
