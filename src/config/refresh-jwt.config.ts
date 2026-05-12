import { registerAs } from '@nestjs/config';
import { JwtModuleOptions, JwtSignOptions } from '@nestjs/jwt';
import type { StringValue } from 'ms';

export default registerAs(
  'refresh-jwt',
  (): JwtSignOptions => ({
    secret: process.env.REFRESH_JWT_SECRET || 'defaultSecret',
    expiresIn: (process.env.REFRESH_JWT_EXPIRE_IN || '7d') as StringValue,
  }),
);
