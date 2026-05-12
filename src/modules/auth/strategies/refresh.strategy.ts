import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import refreshJwtConfig from '../../../config/refresh-jwt.config.js';

@Injectable()
export class RefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    @Inject(refreshJwtConfig.KEY)
    private config: ConfigType<typeof refreshJwtConfig>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        RefreshStrategy.cookieExtractor,
      ]),
      ignoreExpiration: false,
      secretOrKey: config.secret as string,
    });
  }

  validate(payload: any) {
    return payload;
  }

  static cookieExtractor = (req: any): string | null => {
    return req?.cookies?.refresh_token || null;
  };
}
