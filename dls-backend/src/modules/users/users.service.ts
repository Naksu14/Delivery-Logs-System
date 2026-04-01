import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

export type UserResponse = Omit<User, 'password'>;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  private toResponse(user: User): UserResponse {
    const { password, ...safeUser } = user;
    return safeUser;
  }

  async create(createUserDto: CreateUserDto): Promise<UserResponse> {
    const normalizedEmail = createUserDto.email.toLowerCase().trim();
    const existing = await this.usersRepository.findOne({ where: { email: normalizedEmail } });
    if (existing) {
      throw new ConflictException('Email already exists');
    }

    const hashed = await bcrypt.hash(createUserDto.password, 10);
    const user = this.usersRepository.create({
      fullname: createUserDto.fullname,
      email: normalizedEmail,
      password: hashed,
      role: createUserDto.role ?? 'receptionist',
    });

    try {
      const saved = await this.usersRepository.save(user);
      return this.toResponse(saved);
    } catch (err: any) {
      if (err?.code === 'ER_DUP_ENTRY' || err?.code === '23505') {
        throw new ConflictException('Email already exists');
      }
      throw new BadRequestException(err?.message || 'Failed to create user');
    }
  }

  async findAll(): Promise<UserResponse[]> {
    const users = await this.usersRepository.find();
    return users.map((user) => this.toResponse(user));
  }

  // Return full user (including password) for internal usage (auth)
  async findByEmail(email: string): Promise<User | null> {
    const normalized = email.toLowerCase().trim();
    return this.usersRepository.findOne({ where: { email: normalized } });
  }

  async findById(id: number): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findOne(id: number): Promise<UserResponse> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User with id ${id} not found`);
    return this.toResponse(user);
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<UserResponse> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User with id ${id} not found`);

    if (updateUserDto.email) {
      const normalizedEmail = updateUserDto.email.toLowerCase().trim();
      const existing = await this.usersRepository.findOne({ where: { email: normalizedEmail } });
      if (existing && existing.id !== id) {
        throw new ConflictException('Email already exists');
      }
      user.email = normalizedEmail;
    }

    if (updateUserDto.fullname !== undefined) {
      user.fullname = updateUserDto.fullname;
    }

    if (updateUserDto.role !== undefined) {
      user.role = updateUserDto.role;
    }

    if (updateUserDto.password) {
      user.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    try {
      const saved = await this.usersRepository.save(user);
      return this.toResponse(saved);
    } catch (err: any) {
      if (err?.code === 'ER_DUP_ENTRY' || err?.code === '23505') {
        throw new ConflictException('Email already exists');
      }
      throw new BadRequestException(err?.message || 'Failed to update user');
    }
  }

  async remove(id: number): Promise<{ message: string }> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User with id ${id} not found`);

    await this.usersRepository.remove(user);
    return { message: 'User deleted successfully' };
  }
}
