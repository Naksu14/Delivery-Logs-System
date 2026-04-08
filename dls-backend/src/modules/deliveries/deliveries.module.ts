import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeliveriesService } from './deliveries.service';
import { DeliveriesController } from './deliveries.controller';
import { Delivery } from './entities/delivery.entity';
import { DeliveriesGateway } from './deliveries.gateway';
import { DeliveryPartner } from '../delivery-partners/entities/delivery-partner.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Delivery, DeliveryPartner])],
  controllers: [DeliveriesController],
  providers: [DeliveriesService, DeliveriesGateway],
})
export class DeliveriesModule {}
