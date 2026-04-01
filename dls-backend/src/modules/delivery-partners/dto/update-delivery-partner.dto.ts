import { IsOptional, IsString, IsIn, ValidateIf, IsNotEmpty } from 'class-validator';

export class UpdateDeliveryPartnerDto {
	@ValidateIf((o) => o.type === 'courier')
	@IsOptional()
	@IsString()
	@IsNotEmpty()
	name?: string;

	@IsOptional()
	@IsString()
	@IsIn(['courier', 'supplier'])
	type?: string;
}
