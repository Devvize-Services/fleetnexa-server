import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TransactionService } from './transaction.service.js';
import { TransactionController } from './transaction.controller.js';
import { TransactionRepository } from './transaction.repository.js';
import jwtConfig from '../../config/jwt.config.js';
import { ExpenseModule } from './modules/expense/expense.module.js';
import { PaymentModule } from './modules/payment/payment.module.js';
import { RefundModule } from './modules/refund/refund.module.js';

@Module({
  imports: [
    ConfigModule.forFeature(jwtConfig),
    JwtModule.registerAsync(jwtConfig.asProvider()),
    ExpenseModule,
    PaymentModule,
    RefundModule,
  ],
  providers: [TransactionService, TransactionRepository],
  controllers: [TransactionController],
  exports: [TransactionService],
})
export class TransactionModule {}
