import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Delivery } from './entities/delivery.entity';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { UpdateDeliveryDto } from './dto/update-delivery.dto';

@Injectable()
export class DeliveriesService {
  constructor(
    @InjectRepository(Delivery)
    private readonly deliveryRepo: Repository<Delivery>,
  ) {}

  async create(createDeliveryDto: CreateDeliveryDto): Promise<Delivery> {
    try {
      const delivery = this.deliveryRepo.create(createDeliveryDto as any) as unknown as Delivery;
      return await this.deliveryRepo.save(delivery);
    } catch (err: any) {
      if (err.code === 'ER_DUP_ENTRY') {
        throw new ConflictException('Duplicate delivery');
      }
      throw new BadRequestException(err.message || 'Failed to create delivery');
    }
  }

  async findAll(): Promise<Delivery[]> {
    return this.deliveryRepo.find();
  }

  async findOne(id: number): Promise<Delivery> {
    const delivery = await this.deliveryRepo.findOne({ where: { id } });
    if (!delivery) throw new NotFoundException('Delivery not found');
    return delivery;
  }

  async update(id: number, updateDeliveryDto: UpdateDeliveryDto): Promise<Delivery> {
    const delivery = await this.findOne(id);
    Object.assign(delivery, updateDeliveryDto);
    return this.deliveryRepo.save(delivery);
  }

  async remove(id: number): Promise<void> {
    const delivery = await this.findOne(id);
    await this.deliveryRepo.remove(delivery);
  }
}
