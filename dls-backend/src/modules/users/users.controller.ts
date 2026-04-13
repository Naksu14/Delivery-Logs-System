import { Controller, Get, Post, Body, Param, Put, Delete, Logger, ParseIntPipe, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    this.logger.debug('Received create user request: ' + JSON.stringify(createUserDto));
    try {
      const user = await this.usersService.create(createUserDto);
      this.logger.debug('User created with id: ' + (user?.id ?? 'unknown'));
      return user;
    } catch (err) {
      this.logger.error('Error creating user', err as any);
      throw err;
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.usersService.findAll();
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  findMe(@Req() req: any) {
    return this.usersService.findOne(Number(req.user.id));
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Put('me')
  @UseGuards(JwtAuthGuard)
  updateMe(@Req() req: any, @Body() updateUserDto: UpdateUserDto) {
    const { fullname, email, password } = updateUserDto;
    return this.usersService.update(Number(req.user.id), { fullname, email, password });
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id', ParseIntPipe) id: number, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }
}
