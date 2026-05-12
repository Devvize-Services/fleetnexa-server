import {
	IsArray,
	IsEnum,
	IsNotEmpty,
	IsOptional,
	IsString,
	IsUrl,
	IsUUID,
} from "class-validator";

export class DocumentDto {
	@IsUrl()
	@IsNotEmpty()
	url: string;

	@IsString()
	@IsNotEmpty()
	fileName: string;
}

export class SendDocumentsDto {
	@IsUUID()
	@IsNotEmpty()
	bookingId: string;

	@IsString()
	@IsNotEmpty()
	recipient: string;

	@IsEnum(["WHATSAPP", "EMAIL"])
	@IsNotEmpty()
	method: "WHATSAPP" | "EMAIL";

	@IsArray()
	@IsOptional()
	documents?: DocumentDto[];
}
