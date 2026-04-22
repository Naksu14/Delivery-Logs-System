import {
	IsString,
	IsNotEmpty,
	IsIn,
	IsOptional,
	IsDateString,
	ValidateIf,
	IsArray,
	ValidateNested,
	IsInt,
	Min,
	ArrayNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export class DeliveryItemDto {
	@IsString()
	@IsNotEmpty()
	name!: string;

	@IsInt()
	@Min(1)
	quantity!: number;
}

export class CreateDeliveryDto {
	@IsDateString()
	date_received!: string;

	@IsString()
	@IsIn(['Company', 'Individual'])
	delivery_for!: string;

	@IsString()
	@IsNotEmpty()
	recipient_name!: string;

	@ValidateIf((dto: CreateDeliveryDto) => dto.delivery_for === 'Company')
	@IsString()
	@IsNotEmpty()
	company_name!: string;

	@IsOptional()
	@IsArray()
	@ArrayNotEmpty()
	@ValidateNested({ each: true })
	@Type(() => DeliveryItemDto)
	delivery_items?: DeliveryItemDto[];

	@IsString()
	@ValidateIf((dto: CreateDeliveryDto) => !dto.delivery_items || dto.delivery_items.length === 0)
	@IsNotEmpty()
	delivery_type!: string;

	@IsOptional()
	@IsInt()
	@Min(1)
	total_items?: number;

	@IsString()
	delivery_partner!: string;

	@IsOptional()
	@IsString()
	courier_type_name?: string;

	@IsOptional()
	@IsString()
	supplier_description?: string;

	@IsOptional()
	@IsString()
	deliverer_name?: string;

	@IsOptional()
	@IsString()
	description?: string;

	@IsOptional()
	@IsString()
	@IsIn(['Pending'])
	is_status?: string;

	@IsOptional()
	@IsString()
	received_by?: string;

	@IsOptional()
	@IsDateString()
	received_at?: string;

	@IsOptional()
	@IsString()
	receiver_signature?: string;
}
