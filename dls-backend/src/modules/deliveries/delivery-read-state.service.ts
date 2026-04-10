import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Delivery } from './entities/delivery.entity';
import { DeliveryReadState } from './entities/delivery-read-state.entity';

export type DeliveryReadStateResponse = {
	is_seen: boolean;
	unread_count: number;
	last_seen_at: Date | null;
};

@Injectable()
export class DeliveryReadStateService {
	constructor(
		@InjectRepository(Delivery)
		private readonly deliveryRepo: Repository<Delivery>,
		@InjectRepository(DeliveryReadState)
		private readonly deliveryReadStateRepo: Repository<DeliveryReadState>,
	) {}

	private async getOrCreateState(): Promise<DeliveryReadState> {
		let state = await this.deliveryReadStateRepo.findOne({ where: { id: 1 } });
		if (!state) {
			state = this.deliveryReadStateRepo.create({ id: 1, last_seen_at: null });
			state = await this.deliveryReadStateRepo.save(state);
		}

		return state;
	}

	private async countUnreadSince(lastSeenAt: Date | null | undefined): Promise<number> {
		const qb = this.deliveryRepo.createQueryBuilder('d');

		if (lastSeenAt) {
			qb.where('d.created_at > :lastSeenAt', { lastSeenAt });
		}

		return qb.getCount();
	}

	private async toResponse(state: DeliveryReadState): Promise<DeliveryReadStateResponse> {
		const unreadCount = await this.countUnreadSince(state.last_seen_at ?? null);

		return {
			is_seen: unreadCount === 0,
			unread_count: unreadCount,
			last_seen_at: state.last_seen_at ?? null,
		};
	}

	async getStatus(): Promise<DeliveryReadStateResponse> {
		const state = await this.getOrCreateState();
		return this.toResponse(state);
	}

	async markSeen(): Promise<DeliveryReadStateResponse> {
		const state = await this.getOrCreateState();
		state.last_seen_at = new Date();
		const savedState = await this.deliveryReadStateRepo.save(state);
		return this.toResponse(savedState);
	}
}