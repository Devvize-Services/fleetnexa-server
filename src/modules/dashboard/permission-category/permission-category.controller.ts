import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { PermissionCategoryService } from './permission-category.service.js';
import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard.js';
import { Role } from '../../../common/enums/role.enum.js';
import { Roles } from '../../../modules/auth/decorator/role.decorator.js';
import {
  CreatePermissionCategoryDto,
  UpdatePermissionCategoryDto,
} from './permission-category.dto.js';

@Controller('dashboard/permission-category')
@UseGuards(JwtAuthGuard)
@Roles(Role.ADMIN)
export class PermissionCategoryController {
  constructor(private readonly service: PermissionCategoryService) {}

  @Get()
  async getAllCategories() {
    return this.service.getAllCategories();
  }

  @Post()
  async createPermissionCategory(@Body() data: CreatePermissionCategoryDto) {
    return this.service.createPermissionCategory(data);
  }

  @Put()
  async updatePermissionCategory(@Body() data: UpdatePermissionCategoryDto) {
    return this.service.updatePermissionCategory(data);
  }
}
