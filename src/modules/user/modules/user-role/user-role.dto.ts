import { IsBoolean, IsOptional, IsString, IsUUID } from "class-validator";

export class UserRoleDto {
	@IsUUID()
	id: string;

	@IsString()
	name: string;

	@IsString()
	@IsOptional()
	description?: string;

	@IsBoolean()
	show?: boolean = true;
}

export class UserRolePermissionsDto {
	@IsUUID()
	roleId: string;

	@IsUUID("all", { each: true })
	permissions: string[];
}
