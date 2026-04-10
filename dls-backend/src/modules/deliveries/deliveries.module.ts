import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeliveriesService } from './deliveries.service';
import { DeliveriesController } from './deliveries.controller';
import { Delivery } from './entities/delivery.entity';
import { DeliveriesGateway } from './deliveries.gateway';
import { DeliveryPartner } from '../delivery-partners/entities/delivery-partner.entity';
import { CompaniesModule } from '../companies/companies.module';
import { DeliveryEmailService } from './delivery-email.service';
import { DeliveryNotificationService } from './delivery-notification.service';
import { DeliveryReadState } from './entities/delivery-read-state.entity';
import { DeliveryReadStateService } from './delivery-read-state.service';
import { DeliverySpreadsheetSetting } from './entities/delivery-spreadsheet-setting.entity';
import { CompanyDeliverySpreadsheet } from './entities/company-delivery-spreadsheet.entity';
import { DeliverySpreadsheetService } from './delivery-spreadsheet.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Delivery,
      DeliveryPartner,
      DeliveryReadState,
      DeliverySpreadsheetSetting,
      CompanyDeliverySpreadsheet,
    ]),
    CompaniesModule,
  ],
  controllers: [DeliveriesController],
  providers: [
    DeliveriesService,
    DeliveriesGateway,
    DeliveryEmailService,
    DeliveryNotificationService,
    DeliveryReadStateService,
    DeliverySpreadsheetService,
  ],
})
export class DeliveriesModule {}
