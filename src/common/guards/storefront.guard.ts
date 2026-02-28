import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  AuthenticatedRequest,
  StorefrontUserPayload,
} from 'src/types/authenticated-request.js';

@Injectable()
export class StorefrontGuard implements CanActivate {
  private readonly logger = new Logger(StorefrontGuard.name);

  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const token = req.headers['x-auth-token'] as string;
    if (!token) {
      this.logger.warn('No auth token provided');
      throw new UnauthorizedException('No auth token, authorization denied');
    }

    try {
      const secret = process.env.JWT_SECRET;

      if (!secret) {
        this.logger.error('JWT secret is not defined in environment variables');
        throw new UnauthorizedException('Token is not valid');
      }

      const decoded = this.jwtService.verify(token, { secret }) as {
        storefrontUser: StorefrontUserPayload;
      };

      req.storefrontUser = decoded.storefrontUser;

      return true;
    } catch (error) {
      this.logger.error('Error in StorefrontGuard', error);
      return false;
    }
  }
}
