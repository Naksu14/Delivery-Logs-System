import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'deliveries' })
export class Delivery {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'date' })
  date_received!: string;

  @Column({ type: 'varchar', length: 20 })
  delivery_for!: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  recipient_name?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  company_name?: string;

  @Column({ type: 'varchar', length: 50 })
  delivery_type!: string;

  @Column({ type: 'varchar', length: 50 })
  delivery_partner!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  courier_type_name?: string;

  @Column({ type: 'text', nullable: true })
  supplier_description?: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  deliverer_name?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 50, default: 'Pending' })
  is_status!: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  received_by?: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;

  @Column({ type: 'timestamp', nullable: true })
  received_at?: Date;

  @Column({ type: 'varchar', length: 500, nullable: true })
  receiver_signature?: string;
}
