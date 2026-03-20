import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Put,
} from '@nestjs/common';
import { PermissionService } from './permission.service.js';
import { CreatePermissionDto } from './dto/create-permission.dto.js';
import { UpdatePermissionDto } from './dto/update-permission.dto.js';
import { Roles } from '../../../modules/auth/decorator/role.decorator.js';
import { Role } from '../../../common/enums/role.enum.js';
import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard.js';

@Controller('dashboard/permission')
@UseGuards(JwtAuthGuard)
@Roles(Role.ADMIN)
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Post()
  create(@Body() createPermissionDto: CreatePermissionDto) {
    return this.permissionService.createAppPermission(createPermissionDto);
  }

  @Get()
  findAll() {
    return this.permissionService.getAllAppPermissions();
  }

  @Put()
  update(@Body() data: UpdatePermissionDto) {
    return this.permissionService.updateAppPermission(data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.permissionService.deleteAppPermission(id);
  }
}
