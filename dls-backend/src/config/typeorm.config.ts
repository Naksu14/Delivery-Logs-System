import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getTypeOrmConfig = async (
  configService: ConfigService,
): Promise<TypeOrmModuleOptions> => ({
  type: 'mysql',
  host: configService.get<string>('DB_HOST'),
  port: configService.get<number>('DB_PORT'),
  username: configService.get<string>('DB_USER'),
  password: configService.get<string>('DB_PASSWORD'),
  database: configService.get<string>('DB_NAME'),
  entities: [
    __dirname + '/../**/*.entity{.ts,.js}',
  ],
  autoLoadEntities: true,
  synchronize: configService.get<string>('DB_SYNC') === 'true', 
});

export const getOtherTypeOrmConfig = async (
  configService: ConfigService,
): Promise<TypeOrmModuleOptions> => ({
  type: 'mysql',
  host: configService.get<string>('OTHER_DB_HOST') || configService.get<string>('DB_HOST'),
  port: configService.get<number>('OTHER_DB_PORT') || configService.get<number>('DB_PORT'),
  username: configService.get<string>('OTHER_DB_USER') || configService.get<string>('DB_USER'),
  password: configService.get<string>('OTHER_DB_PASSWORD') || configService.get<string>('DB_PASSWORD'),
  database: configService.get<string>('OTHER_DB_NAME') || configService.get<string>('DB_NAME'),
  entities: [__dirname + '/../**/companies/entities/*.entity{.ts,.js}'],
  autoLoadEntities: false,
  synchronize: false,
});