import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'delivery_read_state' })
export class DeliveryReadState {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column({ type: 'timestamp', nullable: true })
	last_seen_at?: Date | null;

	@CreateDateColumn({ type: 'timestamp' })
	created_at!: Date;

	@UpdateDateColumn({ type: 'timestamp' })
	updated_at!: Date;
}