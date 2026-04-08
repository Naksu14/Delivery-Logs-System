import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Delivery } from './entities/delivery.entity';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { UpdateDeliveryDto } from './dto/update-delivery.dto';
import { DeliveriesGateway } from './deliveries.gateway';
import { DeliveryPartner } from '../delivery-partners/entities/delivery-partner.entity';

@Injectable()
export class DeliveriesService {
  constructor(
    @InjectRepository(Delivery)
    private readonly deliveryRepo: Repository<Delivery>,
    @InjectRepository(DeliveryPartner)
    private readonly deliveryPartnerRepo: Repository<DeliveryPartner>,
    private readonly deliveriesGateway: DeliveriesGateway,
  ) {}

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

  async create(createDeliveryDto: CreateDeliveryDto): Promise<Delivery> {
    try {
      const normalizedDto = { ...createDeliveryDto };
      normalizedDto.delivery_type = normalizedDto.delivery_type.toLowerCase().trim();
      const courierPartner = await this.assertCourierPartner(normalizedDto.delivery_partner);
      normalizedDto.delivery_partner = courierPartner.name || courierPartner.type;
      normalizedDto.courier_type_name = normalizedDto.courier_type_name?.trim() || courierPartner.name || undefined;

      if (normalizedDto.delivery_for === 'Individual' && !normalizedDto.company_name) {
        normalizedDto.company_name = normalizedDto.recipient_name;
      }

      const delivery = this.deliveryRepo.create(normalizedDto as any) as unknown as Delivery;
      const savedDelivery = await this.deliveryRepo.save(delivery);
      this.deliveriesGateway.emitDeliveryCreated(savedDelivery);
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
      qb.andWhere('d.delivery_type = :type', { type: query.type });
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

    const normalizedDto = { ...updateDeliveryDto };
    if (normalizedDto.delivery_type) {
      normalizedDto.delivery_type = normalizedDto.delivery_type.toLowerCase().trim();
    }
    if (normalizedDto.delivery_partner) {
      const courierPartner = await this.assertCourierPartner(normalizedDto.delivery_partner);
      normalizedDto.delivery_partner = courierPartner.name || courierPartner.type;
      normalizedDto.courier_type_name = normalizedDto.courier_type_name?.trim() || courierPartner.name || undefined;
    }
    if (normalizedDto.delivery_for === 'Individual') {
      normalizedDto.company_name = normalizedDto.company_name || normalizedDto.recipient_name || delivery.company_name;
    }

    Object.assign(delivery, normalizedDto);
    const updatedDelivery = await this.deliveryRepo.save(delivery);
    this.deliveriesGateway.emitDeliveryUpdated(updatedDelivery);
    return updatedDelivery;
  }

  async remove(id: number): Promise<void> {
    const delivery = await this.findOne(id);
    await this.deliveryRepo.remove(delivery);
    this.deliveriesGateway.emitDeliveryDeleted(id);
  }
}
