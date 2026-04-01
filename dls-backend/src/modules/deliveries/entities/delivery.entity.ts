import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'deliveries' })
export class Delivery {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date' })
  date_received: string;

  @Column({ type: 'varchar', length: 255 })
  company_name: string;

  @Column({ type: 'varchar', length: 50 })
  delivery_type: string;

  @Column({ type: 'varchar', length: 50 })
  delivery_partner: string;

  @Column({ type: 'varchar', length: 100 })
  courier_type_name: string;

  @Column({ type: 'text', nullable: true })
  supplier_description?: string;

  @Column({ type: 'varchar', length: 200 })
  deliverer_name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 50 })
  is_status: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  received_by?: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  received_at?: Date;

  @Column({ type: 'varchar', length: 500, nullable: true })
  receiver_signature?: string;
}
