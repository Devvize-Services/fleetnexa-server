import { Module } from '@nestjs/common';
import { PermissionCategoryService } from './permission-category.service.js';
import { PermissionCategoryController } from './permission-category.controller.js';

@Module({
  imports: [],
  controllers: [PermissionCategoryController],
  providers: [PermissionCategoryService],
  exports: [PermissionCategoryService],
})
export class PermissionCategoryModule {}
