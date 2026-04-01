import { IsOptional, IsString, IsIn, ValidateIf, IsNotEmpty } from 'class-validator';

export class CreateDeliveryPartnerDto {
	@ValidateIf((o) => o.type === 'courier')
	@IsString()
	@IsNotEmpty()
	name?: string;

	@IsString()
	@IsIn(['courier', 'supplier'])
	type: string;
}
