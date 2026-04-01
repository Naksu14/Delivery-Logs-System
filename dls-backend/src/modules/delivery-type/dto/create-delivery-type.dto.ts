import { IsString, IsIn } from 'class-validator';

export class CreateDeliveryTypeDto {
  @IsString()
  name: string;
}

