import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorator/role.decorator.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest();
    const user = request?.user ?? request?.context?.user;

    if (!user) {
      const hasAuthCredential = Boolean(
        request?.cookies?.access_token || request?.headers?.authorization,
      );
      return hasAuthCredential;
    }

    return requiredRoles.includes(user.role);
  }
}
