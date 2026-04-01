import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateDeliveryPartnerDto } from './dto/create-delivery-partner.dto';
import { UpdateDeliveryPartnerDto } from './dto/update-delivery-partner.dto';
import { DeliveryPartner } from './entities/delivery-partner.entity';

@Injectable()
export class DeliveryPartnersService {
  constructor(
    @InjectRepository(DeliveryPartner)
    private readonly repo: Repository<DeliveryPartner>,
  ) {}

  private toResponse(ent: DeliveryPartner) {
    const { ...rest } = ent;
    return rest;
  }

  async create(dto: CreateDeliveryPartnerDto) {
    const type = dto.type.toLowerCase().trim();
    if (type === 'courier' && !dto.name) {
      throw new BadRequestException('Name is required for courier type');
    }
    const ent = this.repo.create({ name: dto.name?.trim(), type });
    const saved = await this.repo.save(ent);
    return this.toResponse(saved);
  }

  async findAll() {
    const list = await this.repo.find();
    return list.map((l) => this.toResponse(l));
  }

  async findOne(id: number) {
    const ent = await this.repo.findOne({ where: { id } });
    if (!ent) throw new NotFoundException('Delivery partner not found');
    return this.toResponse(ent);
  }

  async update(id: number, dto: UpdateDeliveryPartnerDto) {
    const ent = await this.repo.findOne({ where: { id } });
    if (!ent) throw new NotFoundException('Delivery partner not found');
    if (dto.type) ent.type = dto.type.toLowerCase().trim();
    if (dto.name !== undefined) ent.name = dto.name?.trim();
    if (ent.type === 'courier' && !ent.name) {
      throw new BadRequestException('Name is required for courier type');
    }
    const saved = await this.repo.save(ent);
    return this.toResponse(saved);
  }

  async remove(id: number) {
    const ent = await this.repo.findOne({ where: { id } });
    if (!ent) throw new NotFoundException('Delivery partner not found');
    await this.repo.remove(ent);
    return { message: 'Delivery partner deleted' };
  }
}
