import { Global, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@Global()
@WebSocketGateway({
  cors: { origin: '*' },
})
export class TenantGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(TenantGateway.name);
  constructor(private readonly jwt: JwtService) {}

  @WebSocketServer()
  io: Server;

  handleConnection(socket: Socket) {
    const token = socket.handshake.auth?.token;

    if (!token) {
      socket.disconnect();
      return;
    }

    try {
      const decoded: any = this.jwt.verify(token);
      socket.data.user = decoded.user;
      socket.join(decoded.user.tenantId);
    } catch (error) {
      this.logger.error('❌ Invalid socket token');
      socket.disconnect();
    }
  }

  handleDisconnect(socket: Socket) {
    this.logger.log(`🔌 Client disconnected: ${socket.id}`);
  }

  sendTenantNotification(tenantId: string, data: any) {
    this.io.to(tenantId).emit('tenant-notification', data);
  }
}
