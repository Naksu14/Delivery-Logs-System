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

	@IsString()
	@IsNotEmpty()
	courier_type_name: string;

	@IsOptional()
	@IsString()
	supplier_description?: string;

	@IsString()
	@IsNotEmpty()
	deliverer_name: string;

	@IsOptional()
	@IsString()
	description?: string;

	@IsString()
	@IsIn(['Received', 'Release'])
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
