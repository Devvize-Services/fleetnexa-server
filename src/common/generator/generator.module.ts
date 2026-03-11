import { Global, Module } from '@nestjs/common';
import { GeneratorService } from './generator.service.js';

@Global()
@Module({
  imports: [],
  providers: [GeneratorService],
  exports: [GeneratorService],
})
export class GeneratorModule {}
