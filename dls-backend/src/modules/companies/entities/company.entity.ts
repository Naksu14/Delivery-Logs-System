import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity({ name: 'virtual_offices' })
export class Company {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  branch?: string;

  @Column({ type: 'varchar', length: 255 })
  company_name!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  contact_person_1?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  contact_person_2?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email_1?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email_2?: string;

  @Column({ type: 'date', nullable: true })
  date_started?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  duration?: string;

  @Column({ type: 'date', nullable: true })
  end_date?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  package_tier?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  rate_per_month?: number;

  @Column({ type: 'text', nullable: true })
  payment_info?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  payment_terms?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  contract_status?: string;

  @Column({ type: 'text', nullable: true })
  remarks?: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;
}
