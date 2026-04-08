import { IsOptional, IsString } from 'class-validator';

export class UpdateDeliveryTypeDto {
  @IsOptional()
  @IsString()
  name?: string;
}

