import { IsOptional, IsString, IsIn } from 'class-validator';

export class UpdateDeliveryTypeDto {
  @IsOptional()
  @IsString()
  name?: string;
}

