import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { Delivery } from './entities/delivery.entity';

const allowedOrigins = [
  'http://localhost:5185',
  'http://192.168.200.15:5185',
  'http://192.168.110.50:5185',
];

@WebSocketGateway({
  namespace: 'deliveries',
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
})
export class DeliveriesGateway {
  private readonly logger = new Logger(DeliveriesGateway.name);

  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    this.logger.debug(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('delivery.ping')
  handlePing(@ConnectedSocket() client: Socket, @MessageBody() payload?: unknown) {
    client.emit('delivery.pong', {
      ok: true,
      timestamp: new Date().toISOString(),
      payload: payload ?? null,
    });
  }

  emitDeliveryCreated(delivery: Delivery) {
    this.server.emit('delivery.created', {
      delivery,
      timestamp: new Date().toISOString(),
    });
  }

  emitDeliveryUpdated(delivery: Delivery) {
    this.server.emit('delivery.updated', {
      delivery,
      timestamp: new Date().toISOString(),
    });
  }

  emitDeliveryDeleted(id: number) {
    this.server.emit('delivery.deleted', {
      id,
      timestamp: new Date().toISOString(),
    });
  }
}