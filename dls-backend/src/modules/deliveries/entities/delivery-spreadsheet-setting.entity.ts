import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'delivery_spreadsheet_settings' })
export class DeliverySpreadsheetSetting {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  global_spreadsheet_url?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  global_spreadsheet_id?: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  global_sheet_tab_name?: string | null;

  @Column({ type: 'boolean', default: true })
  fallback_to_global!: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at!: Date;
}