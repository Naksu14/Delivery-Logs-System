import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from './entities/company.entity';
import { Delivery } from '../deliveries/entities/delivery.entity';

type CompanyWithDeliveryCount = Company & {
  delivery_count: number;
};

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company, 'companyConnection')
    private readonly companyRepo: Repository<Company>,
    @InjectRepository(Delivery)
    private readonly deliveryRepo: Repository<Delivery>,
  ) {}

  private normalizeCompanyName(value?: string): string {
    return (value || '').trim().toLowerCase();
  }

  async findByCompanyName(companyName: string): Promise<Company | null> {
    const normalizedCompanyName = this.normalizeCompanyName(companyName);
    if (!normalizedCompanyName) {
      return null;
    }

    return this.companyRepo
      .createQueryBuilder('company')
      .where('LOWER(TRIM(company.company_name)) = :companyName', {
        companyName: normalizedCompanyName,
      })
      .getOne();
  }

  private async getDeliveryCountMap(): Promise<Map<string, number>> {
    const rows = await this.deliveryRepo
      .createQueryBuilder('d')
      .select('d.company_name', 'company_name')
      .addSelect('COUNT(*)', 'delivery_count')
      .where('d.company_name IS NOT NULL')
      .groupBy('d.company_name')
      .getRawMany<{ company_name: string; delivery_count: string }>();

    const counts = new Map<string, number>();

    rows.forEach((row) => {
      const normalized = this.normalizeCompanyName(row.company_name);
      if (!normalized) return;
      counts.set(normalized, Number(row.delivery_count) || 0);
    });

    return counts;
  }

  async findAll(): Promise<CompanyWithDeliveryCount[]> {
    const [companies, deliveryCountMap] = await Promise.all([
      this.companyRepo.find(),
      this.getDeliveryCountMap(),
    ]);

    return companies.map((company) => ({
      ...company,
      delivery_count:
        deliveryCountMap.get(this.normalizeCompanyName(company.company_name)) || 0,
    }));
  }

  async findOne(id: number): Promise<CompanyWithDeliveryCount> {
    const company = await this.companyRepo.findOne({ where: { id } });
    if (!company) throw new NotFoundException('Company not found');

    const count = await this.deliveryRepo
      .createQueryBuilder('d')
      .where('LOWER(TRIM(d.company_name)) = :companyName', {
        companyName: this.normalizeCompanyName(company.company_name),
      })
      .getCount();

    return {
      ...company,
      delivery_count: count,
    };
  }
}
