import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeliveryPartnersService } from './delivery-partners.service';
import { DeliveryPartnersController } from './delivery-partners.controller';
import { DeliveryPartner } from './entities/delivery-partner.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DeliveryPartner])],
  controllers: [DeliveryPartnersController],
  providers: [DeliveryPartnersService],
  exports: [DeliveryPartnersService],
})
export class DeliveryPartnersModule {}
