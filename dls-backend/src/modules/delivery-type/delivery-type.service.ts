import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateDeliveryTypeDto } from './dto/create-delivery-type.dto';
import { UpdateDeliveryTypeDto } from './dto/update-delivery-type.dto';
import { DeliveryType } from './entities/delivery-type.entity';

@Injectable()
export class DeliveryTypeService {
  constructor(
    @InjectRepository(DeliveryType)
    private readonly repo: Repository<DeliveryType>,
  ) {}

  private toResponse(entity: DeliveryType) {
    const { ...rest } = entity;
    return rest;
  }

  async create(dto: CreateDeliveryTypeDto) {
    const name = dto.name.toLowerCase().trim();
    const exists = await this.repo.findOne({ where: { name } });
    if (exists) throw new ConflictException('Delivery type already exists');
    const ent = this.repo.create({ name });
    try {
      const saved = await this.repo.save(ent);
      return this.toResponse(saved);
    } catch (err: any) {
      throw new BadRequestException(err?.message || 'Failed to create delivery type');
    }
  }

  async findAll() {
    const list = await this.repo.find();
    return list.map((l) => this.toResponse(l));
  }

  async findOne(id: number) {
    const ent = await this.repo.findOne({ where: { id } });
    if (!ent) throw new NotFoundException('Delivery type not found');
    return this.toResponse(ent);
  }

  async update(id: number, dto: UpdateDeliveryTypeDto) {
    const ent = await this.repo.findOne({ where: { id } });
    if (!ent) throw new NotFoundException('Delivery type not found');
    if (dto.name) {
      const name = dto.name.toLowerCase().trim();
      const exists = await this.repo.findOne({ where: { name } });
      if (exists && exists.id !== id) throw new ConflictException('Delivery type already exists');
      ent.name = name;
    }
    try {
      const saved = await this.repo.save(ent);
      return this.toResponse(saved);
    } catch (err: any) {
      throw new BadRequestException(err?.message || 'Failed to update delivery type');
    }
  }

  async remove(id: number) {
    const ent = await this.repo.findOne({ where: { id } });
    if (!ent) throw new NotFoundException('Delivery type not found');
    await this.repo.remove(ent);
    return { message: 'Delivery type deleted' };
  }
}

