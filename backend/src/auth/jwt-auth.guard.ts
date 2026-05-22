import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

export interface AuthenticatedUser {
  id: string;
  email?: string;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

interface AccessTokenPayload {
  sub?: string;
  email?: string;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthenticatedUser }>();
    const token = this.extractBearerToken(request);

    if (!token) {
      throw new UnauthorizedException('Thiếu token xác thực');
    }

    try {
      const payload = this.jwt.verify<AccessTokenPayload>(token);
      if (!payload.sub) {
        throw new Error('Missing subject');
      }

      request.user = { id: payload.sub, email: payload.email };
      return true;
    } catch {
      throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');
    }
  }

  private extractBearerToken(request: Request) {
    const authorization = request.headers.authorization;
    if (!authorization) return null;

    const [type, token, ...rest] = authorization.trim().split(/\s+/);
    if (type?.toLowerCase() !== 'bearer' || !token || rest.length > 0) {
      return null;
    }

    return token;
  }
}
