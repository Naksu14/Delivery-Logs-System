import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'delivery_partners' })
export class DeliveryPartner {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column({ type: 'varchar', length: 200, nullable: true })
	name?: string | null;

	@Column({ type: 'varchar', length: 50 })
	type!: string;

	@CreateDateColumn({ type: 'timestamp' })
	createdAt!: Date;

	@UpdateDateColumn({ type: 'timestamp' })
	updatedAt!: Date;
}
