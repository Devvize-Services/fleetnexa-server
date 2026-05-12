import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import crypto from 'node:crypto';

@Injectable()
export class ApiGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    const apiKey = req.headers['x-api-key'];
    const signature = req.headers['x-signature'];
    const timestamp = req.headers['x-timestamp'];

    if (!apiKey || !signature || !timestamp) {
      throw new UnauthorizedException('Missing auth headers');
    }

    if (apiKey !== process.env.API_KEY) {
      throw new UnauthorizedException('Invalid API key');
    }

    const now = Date.now();
    const requestTime = new Date(timestamp).getTime();
    const timeDiff = Math.abs(now - requestTime);

    if (timeDiff > 5 * 60 * 1000) {
      throw new UnauthorizedException('Request expired');
    }

    const payload = `${apiKey}:${timestamp}`;

    const secret = process.env.API_HMAC_SECRET;
    if (!secret) {
      throw new UnauthorizedException('HMAC secret not configured');
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex'),
    );

    if (!isValid) {
      throw new UnauthorizedException('Invalid signature');
    }

    return true;
  }
}
