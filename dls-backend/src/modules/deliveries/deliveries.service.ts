import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomInt } from 'crypto';
import { Delivery } from './entities/delivery.entity';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { UpdateDeliveryDto } from './dto/update-delivery.dto';
import { VerifyDeliveryDto } from './dto/verify-delivery.dto';
import { DeliveriesGateway } from './deliveries.gateway';
import { DeliveryPartner } from '../delivery-partners/entities/delivery-partner.entity';
import { DeliveryNotificationService } from './delivery-notification.service';
import { DeliverySpreadsheetService } from './delivery-spreadsheet.service';

@Injectable()
export class DeliveriesService {
  constructor(
    @InjectRepository(Delivery)
    private readonly deliveryRepo: Repository<Delivery>,
    @InjectRepository(DeliveryPartner)
    private readonly deliveryPartnerRepo: Repository<DeliveryPartner>,
    private readonly deliveriesGateway: DeliveriesGateway,
    private readonly deliveryNotificationService: DeliveryNotificationService,
    private readonly deliverySpreadsheetService: DeliverySpreadsheetService,
  ) {}

  private readonly referenceCodeCharset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  private generateReferenceCode(): string {
    let code = '';
    for (let i = 0; i < 4; i += 1) {
      const index = randomInt(0, this.referenceCodeCharset.length);
      code += this.referenceCodeCharset[index];
    }
    return code;
  }

  private async generateUniqueReferenceCode(): Promise<string> {
    const maxAttempts = 10;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const candidate = this.generateReferenceCode();
      const existing = await this.deliveryRepo.findOne({ where: { reference_code: candidate } });
      if (!existing) {
        return candidate;
      }
    }

    throw new ConflictException('Failed to generate a unique reference code. Please try again.');
  }

  private async assertCourierPartner(deliveryPartnerName?: string) {
    const normalizedName = deliveryPartnerName?.trim();
    if (!normalizedName) {
      throw new BadRequestException('Delivery partner is required');
    }

    const partner = await this.deliveryPartnerRepo.findOne({
      where: { name: normalizedName, type: 'courier' },
    });

    if (!partner) {
      throw new BadRequestException('Only courier partners can be used for delivery entries');
    }

    return partner;
  }

  private normalizeDeliveryPartnerType(value?: string): 'courier' | 'supplier' {
    const normalized = (value || '').trim().toLowerCase();
    return normalized === 'supplier' ? 'supplier' : 'courier';
  }

  private normalizeDeliveryItems(
    deliveryItems?: Array<{ name?: string; quantity?: number }> | null,
    fallbackDeliveryType?: string,
  ): { deliveryItems: Array<{ name: string; quantity: number }>; totalItems: number; summary: string } {
    const normalizedItems = (Array.isArray(deliveryItems) ? deliveryItems : [])
      .map((item) => ({
        name: String(item?.name || '').trim(),
        quantity: Number(item?.quantity || 1),
      }))
      .filter((item) => item.name.length > 0)
      .map((item) => ({
        name: item.name,
        quantity: Number.isFinite(item.quantity) && item.quantity > 0 ? Math.floor(item.quantity) : 1,
      }));

    const fallbackName = String(fallbackDeliveryType || '').trim();
    const withFallback =
      normalizedItems.length > 0
        ? normalizedItems
        : fallbackName
          ? [{ name: fallbackName, quantity: 1 }]
          : [];

    if (withFallback.length === 0) {
      throw new BadRequestException('At least one delivery item is required');
    }

    const totalItems = withFallback.reduce((sum, item) => sum + item.quantity, 0);
    const summary = withFallback.map((item) => `${item.name} (${item.quantity})`).join(', ').trim();

    return {
      deliveryItems: withFallback,
      totalItems,
      summary,
    };
  }

  async create(createDeliveryDto: CreateDeliveryDto): Promise<Delivery> {
    try {
      const normalizedDto = { ...createDeliveryDto };
      const deliveryItemState = this.normalizeDeliveryItems(
        normalizedDto.delivery_items,
        normalizedDto.delivery_type,
      );
      normalizedDto.delivery_items = deliveryItemState.deliveryItems;
      normalizedDto.total_items = deliveryItemState.totalItems;
      normalizedDto.delivery_type = deliveryItemState.summary;
      const deliveryPartnerType = this.normalizeDeliveryPartnerType(normalizedDto.delivery_partner);

      if (deliveryPartnerType === 'supplier') {
        if (!normalizedDto.supplier_description?.trim()) {
          throw new BadRequestException('Supplier description is required when delivery partner is supplier');
        }
        normalizedDto.delivery_partner = 'Supplier';
        normalizedDto.courier_type_name = undefined;
        normalizedDto.supplier_description = normalizedDto.supplier_description.trim();
      } else {
        const courierPartner = await this.assertCourierPartner(normalizedDto.delivery_partner);
        normalizedDto.delivery_partner = courierPartner.name || courierPartner.type;
        normalizedDto.courier_type_name = normalizedDto.courier_type_name?.trim() || courierPartner.name || undefined;
        normalizedDto.supplier_description = undefined;
      }

      if (normalizedDto.delivery_for === 'Individual' && !normalizedDto.company_name) {
        normalizedDto.company_name = normalizedDto.recipient_name;
      }

      const deliveryPayload: Partial<Delivery> = {
        ...normalizedDto,
        delivery_items: normalizedDto.delivery_items,
        total_items: normalizedDto.total_items,
        date_received: new Date(normalizedDto.date_received),
        received_at: normalizedDto.received_at ? new Date(normalizedDto.received_at) : undefined,
        is_status: 'Pending',
        reference_code: await this.generateUniqueReferenceCode(),
      };

      const delivery = this.deliveryRepo.create(deliveryPayload);
      const savedDelivery = await this.deliveryRepo.save(delivery);
      this.deliveriesGateway.emitDeliveryCreated(savedDelivery);
      await this.deliveryNotificationService.sendNewDeliveryNotification(savedDelivery);
      await this.deliverySpreadsheetService.appendDeliveryLog(savedDelivery);
      return savedDelivery;
    } catch (err: any) {
      if (err.code === 'ER_DUP_ENTRY') {
        throw new ConflictException('Duplicate delivery');
      }
      throw new BadRequestException(err.message || 'Failed to create delivery');
    }
  }

  async findAll(query?: Record<string, any>): Promise<{ items: Delivery[]; meta: { currentPage: number; totalPages: number; totalItems: number } }> {
    const qb = this.deliveryRepo.createQueryBuilder('d');

    const page = Math.max(1, Number(query?.page) || 1);
    const limit = Math.max(1, Number(query?.limit) || 10);

    // Search across several text fields
    if (query?.search) {
      const q = `%${query.search.trim()}%`;
      qb.andWhere(
        '(d.company_name LIKE :q OR d.description LIKE :q OR d.deliverer_name LIKE :q OR d.recipient_name LIKE :q OR d.supplier_description LIKE :q)',
        { q }
      );
    }

    if (query?.status) {
      qb.andWhere('d.is_status = :status', { status: query.status });
    }

    if (query?.type) {
      qb.andWhere('LOWER(d.delivery_type) LIKE :type', { type: `%${String(query.type).trim().toLowerCase()}%` });
    }

    const totalItems = await qb.getCount();

    const items = await qb
      .orderBy('d.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    const totalPages = Math.max(1, Math.ceil(totalItems / limit));

    return { items, meta: { currentPage: page, totalPages, totalItems } };
  }

  async findOne(id: number): Promise<Delivery> {
    const delivery = await this.deliveryRepo.findOne({ where: { id } });
    if (!delivery) throw new NotFoundException('Delivery not found');
    return delivery;
  }

  async update(id: number, updateDeliveryDto: UpdateDeliveryDto): Promise<Delivery> {
    const delivery = await this.findOne(id);

    if (
      updateDeliveryDto.is_status === 'Released' ||
      updateDeliveryDto.received_by !== undefined ||
      updateDeliveryDto.received_at !== undefined ||
      updateDeliveryDto.receiver_signature !== undefined
    ) {
      throw new BadRequestException('Use verify-release endpoint to release a delivery');
    }

    const normalizedDto = { ...updateDeliveryDto };
    if (normalizedDto.delivery_items || normalizedDto.delivery_type) {
      const deliveryItemState = this.normalizeDeliveryItems(
        normalizedDto.delivery_items,
        normalizedDto.delivery_type || delivery.delivery_type,
      );
      normalizedDto.delivery_items = deliveryItemState.deliveryItems;
      normalizedDto.total_items = deliveryItemState.totalItems;
      normalizedDto.delivery_type = deliveryItemState.summary;
    }
    if (normalizedDto.delivery_partner) {
      const deliveryPartnerType = this.normalizeDeliveryPartnerType(normalizedDto.delivery_partner);
      if (deliveryPartnerType === 'supplier') {
        if (!normalizedDto.supplier_description?.trim()) {
          throw new BadRequestException('Supplier description is required when delivery partner is supplier');
        }
        normalizedDto.delivery_partner = 'Supplier';
        normalizedDto.courier_type_name = undefined;
        normalizedDto.supplier_description = normalizedDto.supplier_description.trim();
      } else {
        const courierPartner = await this.assertCourierPartner(normalizedDto.delivery_partner);
        normalizedDto.delivery_partner = courierPartner.name || courierPartner.type;
        normalizedDto.courier_type_name = normalizedDto.courier_type_name?.trim() || courierPartner.name || undefined;
        normalizedDto.supplier_description = undefined;
      }
    }
    if (normalizedDto.delivery_for === 'Individual') {
      normalizedDto.company_name = normalizedDto.company_name || normalizedDto.recipient_name || delivery.company_name;
    }

    Object.assign(delivery, normalizedDto);
    const updatedDelivery = await this.deliveryRepo.save(delivery);
    this.deliveriesGateway.emitDeliveryUpdated(updatedDelivery);
    return updatedDelivery;
  }

  async verifyAndRelease(id: number, verifyDeliveryDto: VerifyDeliveryDto): Promise<Delivery> {
    const delivery = await this.findOne(id);

    if ((delivery.is_status || '').toLowerCase() === 'released') {
      throw new BadRequestException('Delivery has already been released');
    }

    const inputCode = verifyDeliveryDto.reference_code.trim().toUpperCase();
    const expectedCode = (delivery.reference_code || '').trim().toUpperCase();

    if (!expectedCode) {
      throw new BadRequestException('Reference code is missing for this delivery');
    }

    if (inputCode !== expectedCode) {
      throw new BadRequestException('Invalid reference code');
    }

    delivery.received_by = verifyDeliveryDto.received_by.trim();
    delivery.receiver_signature = verifyDeliveryDto.receiver_signature.trim();
    delivery.received_at = new Date();
    delivery.is_status = 'Released';

    const updatedDelivery = await this.deliveryRepo.save(delivery);
    this.deliveriesGateway.emitDeliveryUpdated(updatedDelivery);
    await this.deliverySpreadsheetService.appendDeliveryLog(updatedDelivery);
    return updatedDelivery;
  }

  async remove(id: number): Promise<void> {
    const delivery = await this.findOne(id);
    await this.deliveryRepo.remove(delivery);
    this.deliveriesGateway.emitDeliveryDeleted(id);
  }
}
