import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity({ name: 'company_delivery_spreadsheets' })
export class CompanyDeliverySpreadsheet {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int', nullable: true })
  company_id?: number | null;

  @Column({ type: 'varchar', length: 255 })
  company_name!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  company_name_key!: string;

  @Column({ type: 'varchar', length: 255 })
  spreadsheet_url!: string;

  @Column({ type: 'varchar', length: 255 })
  spreadsheet_id!: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at!: Date;
}