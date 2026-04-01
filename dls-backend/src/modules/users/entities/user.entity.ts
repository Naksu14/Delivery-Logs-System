import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'users' })
export class User {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: 'varchar', length: 200 })
	fullname: string;

	@Column({ type: 'varchar', length: 100, unique: true })
	email: string;

	@Column({ type: 'varchar', length: 200 })
	password: string;

	@Column({ type: 'varchar', length: 50, default: 'admin' })
	role: string;

	@CreateDateColumn({ type: 'timestamp' })
	createdAt: Date;

	@UpdateDateColumn({ type: 'timestamp' })
	updatedAt: Date;
}
