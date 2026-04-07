import { IsOptional, IsString, IsIn, IsDateString, IsNumber } from 'class-validator';

export class UpdateDeliveryDto {
	@IsOptional()
	@IsDateString()
	date_received?: string;

	@IsOptional()
	@IsString()
	@IsIn(['Company', 'Individual'])
	delivery_for?: string;

	@IsOptional()
	@IsString()
	recipient_name?: string;

	@IsOptional()
	@IsString()
	company_name?: string;

	@IsOptional()
	@IsString()
	delivery_type?: string;

	@IsOptional()
	@IsString()
	delivery_partner?: string;

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
	@IsIn(['Pending', 'Released'])
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
