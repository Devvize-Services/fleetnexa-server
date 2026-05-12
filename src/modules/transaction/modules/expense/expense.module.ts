import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ExpenseService } from './expense.service.js';
import { TransactionModule } from '../../transaction.module.js';
import { ExpenseController } from './expense.controller.js';
import jwtConfig from '../../../../config/jwt.config.js';

@Module({
  imports: [
    forwardRef(() => TransactionModule),
    ConfigModule.forFeature(jwtConfig),
    JwtModule.registerAsync(jwtConfig.asProvider()),
  ],
  providers: [ExpenseService],
  controllers: [ExpenseController],
  exports: [ExpenseService],
})
export class ExpenseModule {}
