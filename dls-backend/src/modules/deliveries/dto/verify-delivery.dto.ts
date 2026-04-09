import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class VerifyDeliveryDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z0-9]{5}$/)
  reference_code!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  received_by!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=\s]+$/)
  @MaxLength(300000)
  receiver_signature!: string;
}
