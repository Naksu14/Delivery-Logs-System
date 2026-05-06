import { IsNotEmpty, IsString, Matches, MaxLength, IsOptional } from 'class-validator';

export class VerifyDeliveryDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z0-9]{4}$/)
  reference_code!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  received_by!: string;

  @IsOptional()
  @IsString()
  @Matches(/^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=\s]+$/, {
    message: 'receiver_signature must be a valid base64 encoded image (png, jpeg, jpg, or webp)'
  })
  @MaxLength(300000)
  receiver_signature?: string;
}
