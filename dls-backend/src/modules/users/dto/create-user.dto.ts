import { IsString, IsEmail, MinLength, IsOptional, IsIn } from 'class-validator';

export class CreateUserDto {
	@IsString()
	fullname: string;

	@IsEmail()
	email: string;

	@IsString()
	@MinLength(6)
	password: string;

	@IsOptional()
	@IsIn(['admin', 'receptionist'])
	role?: string = 'receptionist';
}
