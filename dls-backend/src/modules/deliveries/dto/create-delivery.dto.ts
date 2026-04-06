import { IsString, IsNotEmpty, IsIn, IsOptional, IsDateString, IsNumber } from 'class-validator';

export class CreateDeliveryDto {
	@IsDateString()
	date_received: string;

	@IsString()
	company_name: string;

	@IsString()
	delivery_type: string;

	@IsString()
	delivery_partner: string;

	@IsOptional()
	@IsString()
	courier_type_name: string;

	@IsOptional()
	@IsString()
	supplier_description?: string;

	@IsOptional()
	@IsString()
	deliverer_name: string;

	@IsOptional()
	@IsString()
	description?: string;

	@IsString()
	@IsIn(['Pending', 'Released'])
	is_status: string;

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
