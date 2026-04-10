import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe, Query } from '@nestjs/common';
import { DeliveriesService } from './deliveries.service';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { UpdateDeliveryDto } from './dto/update-delivery.dto';
import { VerifyDeliveryDto } from './dto/verify-delivery.dto';
import { DeliveryReadStateService } from './delivery-read-state.service';
import { DeliverySpreadsheetService } from './delivery-spreadsheet.service';
import { UpdateDeliverySpreadsheetSettingsDto } from './dto/update-delivery-spreadsheet-settings.dto';
import { UpsertCompanyDeliverySpreadsheetDto } from './dto/upsert-company-delivery-spreadsheet.dto';


@Controller('deliveries')
export class DeliveriesController {
  constructor(
    private readonly deliveriesService: DeliveriesService,
    private readonly deliveryReadStateService: DeliveryReadStateService,
    private readonly deliverySpreadsheetService: DeliverySpreadsheetService,
  ) {}

  @Post()
  create(@Body() createDeliveryDto: CreateDeliveryDto) {
    return this.deliveriesService.create(createDeliveryDto);
  }

  @Get()
  findAll(@Query() query: Record<string, any>) {
    return this.deliveriesService.findAll(query);
  }

  @Get('notification-state')
  getNotificationState() {
    return this.deliveryReadStateService.getStatus();
  }

  @Patch('notification-state/seen')
  markNotificationStateSeen() {
    return this.deliveryReadStateService.markSeen();
  }

  @Get('spreadsheet-settings')
  getSpreadsheetSettings() {
    return this.deliverySpreadsheetService.getSpreadsheetSettings();
  }

  @Patch('spreadsheet-settings')
  updateSpreadsheetSettings(@Body() dto: UpdateDeliverySpreadsheetSettingsDto) {
    return this.deliverySpreadsheetService.updateSpreadsheetSettings(dto);
  }

  @Get('spreadsheet-settings/company-mappings')
  getCompanySpreadsheetMappings() {
    return this.deliverySpreadsheetService.getCompanySpreadsheetMappings();
  }

  @Post('spreadsheet-settings/company-mappings')
  upsertCompanySpreadsheetMapping(@Body() dto: UpsertCompanyDeliverySpreadsheetDto) {
    return this.deliverySpreadsheetService.upsertCompanySpreadsheet(dto);
  }

  @Delete('spreadsheet-settings/company-mappings/:id')
  removeCompanySpreadsheetMapping(@Param('id', ParseIntPipe) id: number) {
    return this.deliverySpreadsheetService.removeCompanySpreadsheet(id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.deliveriesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateDeliveryDto: UpdateDeliveryDto) {
    return this.deliveriesService.update(id, updateDeliveryDto);
  }

  @Patch(':id/verify-release')
  verifyAndRelease(@Param('id', ParseIntPipe) id: number, @Body() verifyDeliveryDto: VerifyDeliveryDto) {
    return this.deliveriesService.verifyAndRelease(id, verifyDeliveryDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.deliveriesService.remove(id);
  }
}
