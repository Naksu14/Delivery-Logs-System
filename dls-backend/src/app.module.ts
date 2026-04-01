import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getTypeOrmConfig, getOtherTypeOrmConfig } from './config/typeorm.config';
import { UsersModule } from './modules/users/users.module';
import { DeliveriesModule } from './modules/deliveries/deliveries.module';
import { AuthModule } from './modules/auth/auth.module';
import { DeliveryPartnersModule } from './modules/delivery-partners/delivery-partners.module';
import { DeliveryTypeModule } from './modules/delivery-type/delivery-type.module';
import { CompaniesModule } from './modules/companies/companies.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getTypeOrmConfig,
      inject: [ConfigService],
    }),
    TypeOrmModule.forRootAsync({
      name: 'companyConnection',
      imports: [ConfigModule],
      useFactory: getOtherTypeOrmConfig,
      inject: [ConfigService],
    }),
    UsersModule, DeliveriesModule, AuthModule, DeliveryPartnersModule, DeliveryTypeModule, CompaniesModule]
})
export class AppModule {}
