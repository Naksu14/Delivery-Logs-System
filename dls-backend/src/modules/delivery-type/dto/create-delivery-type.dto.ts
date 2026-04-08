import { IsString } from 'class-validator';

export class CreateDeliveryTypeDto {
  @IsString()
  name: string;
}

