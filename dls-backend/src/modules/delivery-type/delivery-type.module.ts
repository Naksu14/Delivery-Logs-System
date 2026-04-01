import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeliveryTypeService } from './delivery-type.service';
import { DeliveryTypeController } from './delivery-type.controller';
import { DeliveryType } from './entities/delivery-type.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DeliveryType])],
  controllers: [DeliveryTypeController],
  providers: [DeliveryTypeService],
  exports: [DeliveryTypeService],
})
export class DeliveryTypeModule {}

