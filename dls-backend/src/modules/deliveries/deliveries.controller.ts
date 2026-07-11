import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { DeliveriesService } from './deliveries.service';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { UpdateDeliveryDto } from './dto/update-delivery.dto';
import { VerifyDeliveryDto } from './dto/verify-delivery.dto';
import { DeliveryReadStateService } from './delivery-read-state.service';
import { DeliverySpreadsheetService } from './delivery-spreadsheet.service';
import { UpdateDeliverySpreadsheetSettingsDto } from './dto/update-delivery-spreadsheet-settings.dto';
import { UpsertCompanyDeliverySpreadsheetDto } from './dto/upsert-company-delivery-spreadsheet.dto';
import { ImageUtil } from './image.util';


const proofImageUploadDestination = join(__dirname, '..', '..', '..', 'uploads', 'proof-images');
if (!existsSync(proofImageUploadDestination)) {
  mkdirSync(proofImageUploadDestination, { recursive: true });
}

const proofImageFileName = (req: any, file: Express.Multer.File, callback: (error: Error | null, filename: string) => void) => {
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const extension = file.originalname.includes('.') ? file.originalname.substring(file.originalname.lastIndexOf('.')) : '.jpg';
  callback(null, `${safeName}${extension}`);
};

@Controller('deliveries')
export class DeliveriesController {
  constructor(
    private readonly deliveriesService: DeliveriesService,
    private readonly deliveryReadStateService: DeliveryReadStateService,
    private readonly deliverySpreadsheetService: DeliverySpreadsheetService,
  ) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('proof_image', {
      storage: diskStorage({
        destination: proofImageUploadDestination,
        filename: proofImageFileName,
      }),
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  create(@UploadedFile() file: Express.Multer.File, @Body() createDeliveryDto: CreateDeliveryDto) {
    if (file) {
      const publicUrl = (process.env.APP_URL || process.env.API_URL || 'http://localhost:3014').replace(/\/+$/, '');
      createDeliveryDto.proof_image_url = `${publicUrl}/uploads/proof-images/${file.filename}`;
    }
    return this.deliveriesService.create(createDeliveryDto);
  }

  @Get()
  findAll(@Query() query: Record<string, any>) {
    return this.deliveriesService.findAll(query);
  }

  @Get('debug/test-image/:filename')
  debugTestImage(@Param('filename') filename: string) {
    console.log(`[DEBUG] Testing image conversion for: ${filename}`);
    const base64 = ImageUtil.getImageAsBase64(filename);
    return {
      filename,
      base64Length: base64 ? base64.length : 0,
      base64Preview: base64 ? base64.substring(0, 100) + '...' : 'null',
      success: !!base64,
    };
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
