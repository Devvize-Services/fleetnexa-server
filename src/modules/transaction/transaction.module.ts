import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TransactionService } from './transaction.service.js';
import { TransactionController } from './transaction.controller.js';
import { TransactionRepository } from './transaction.repository.js';
import jwtConfig from '../../config/jwt.config.js';

@Module({
  imports: [
    ConfigModule.forFeature(jwtConfig),
    JwtModule.registerAsync(jwtConfig.asProvider()),
  ],
  providers: [TransactionService, TransactionRepository],
  controllers: [TransactionController],
  exports: [TransactionService],
})
export class TransactionModule {}
