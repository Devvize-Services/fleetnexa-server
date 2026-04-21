import { Inject, Injectable } from '@nestjs/common';
import * as config from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import refreshJwtConfig from 'src/config/refresh-jwt.config.js';

@Injectable()
export class RefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    @Inject(refreshJwtConfig.KEY)
    private config: config.ConfigType<typeof refreshJwtConfig>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        RefreshStrategy.cookieExtractor,
      ]),
      ignoreExpiration: false,
      secretOrKey: config.secret as string,
    });
  }

  static cookieExtractor = (req: any): string | null => {
    return req?.cookies?.refresh_token || null;
  };
}
