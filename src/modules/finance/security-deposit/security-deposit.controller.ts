import { Controller, Post, UseGuards, Request, Body } from '@nestjs/common';
import { SecurityDepositService } from './security-deposit.service';
import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard';
import { Role } from '../../../shared/enums/role.enum';
import { Roles } from '../../../modules/auth/decorator/role.decorator';
import { SecurityDepositDto } from './security-deposit.dto';

@Controller('finance/security-deposit')
@UseGuards(JwtAuthGuard)
@Roles(Role.TENANT)
export class SecurityDepositController {
  constructor(
    private readonly securityDepositService: SecurityDepositService,
  ) {}

  @Post('collect')
  collectSecurityDeposit(@Body() data: SecurityDepositDto, @Request() req) {
    return this.securityDepositService.collectSecurityDeposit(
      data,
      req.user.tenant,
      req.user,
    );
  }

  @Post('refund')
  refundSecurityDeposit(@Body() data: SecurityDepositDto, @Request() req) {
    return this.securityDepositService.refundSecurityDeposit(
      data,
      req.user.tenant,
      req.user,
    );
  }

  @Post('forfeit')
  forfeitSecurityDeposit(@Body() data: SecurityDepositDto, @Request() req) {
    return this.securityDepositService.forfeitSecurityDeposit(
      data,
      req.user.tenant,
      req.user,
    );
  }

  @Post('waive')
  waiveSecurityDeposit(@Body() data: SecurityDepositDto, @Request() req) {
    return this.securityDepositService.waiveSecurityDeposit(
      data,
      req.user.tenant,
      req.user,
    );
  }
}
