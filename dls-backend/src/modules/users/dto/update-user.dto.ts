import { IsOptional, IsString, IsEmail, MinLength, IsIn } from 'class-validator';

export class UpdateUserDto {
	@IsOptional()
	@IsString()
	fullname?: string;

	@IsOptional()
	@IsEmail()
	email?: string;

	@IsOptional()
	@IsString()
	@MinLength(6)
	password?: string;

	@IsOptional()
	@IsIn(['admin', 'receptionist'])
	role?: string;
}
