import { registerAs } from '@nestjs/config';
import { JwtModuleOptions } from '@nestjs/jwt';
import type { StringValue } from 'ms';

export default registerAs(
  'jwt',
  (): JwtModuleOptions => ({
    secret: process.env.JWT_SECRET || 'defaultSecret',
    signOptions: {
      expiresIn: (process.env.JWT_EXPIRE_IN || '1d') as StringValue,
    },
  }),
);
