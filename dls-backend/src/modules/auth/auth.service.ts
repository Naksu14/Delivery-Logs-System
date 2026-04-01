import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { LoginAuthDto } from './dto/login-auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const found = await this.usersService.findByEmail(email);
    if (!found) return { valid: false };
    const valid = await bcrypt.compare(password, found.password || '');
    return { valid, user: found };
  }

  async login(dto: LoginAuthDto) {
    const { email, password } = dto;
    const { valid, user } = await this.validateUser(email, password);
    if (!valid || !user) throw new UnauthorizedException('Invalid credentials');

    const payload = { sub: (user as any).id, email: (user as any).email, role: (user as any).role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: (user as any).id,
        fullname: (user as any).fullname,
        email: (user as any).email,
        role: (user as any).role,
      },
    };
  }
}
