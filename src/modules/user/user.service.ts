import { Injectable } from '@nestjs/common';
import { EmailService } from '../../common/email/email.service.js';
import { GeneratorService } from '../../common/generator/generator.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { TenantUserRepository } from './tenant-user/tenant-user.repository.js';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly generator: GeneratorService,
    private readonly repo: TenantUserRepository,
    private readonly email: EmailService,
  ) {}
}
