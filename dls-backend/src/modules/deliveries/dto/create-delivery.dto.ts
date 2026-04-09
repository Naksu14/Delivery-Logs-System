import { IsString, IsNotEmpty, IsIn, IsOptional, IsDateString, ValidateIf } from 'class-validator';

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

	@IsString()
	delivery_type!: string;

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
