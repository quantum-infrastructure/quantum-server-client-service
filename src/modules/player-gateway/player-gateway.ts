import { Server, Socket } from 'socket.io';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { PlayerGatewayService } from './player-gateway.service';
import { ConnectedEntityData } from 'src/common/connection-handler/connection.types';

import {
  FROM_PLAYER_EVENT_TYPES,
  TO_PLAYER_EVENT_TYPES,
} from 'src/common/events/type/player.event-type';
import {
  ToPlayerGenericEvent,
  ToPlayerServerStatusEvent,
} from 'src/common/events/player.event';
import { PlayerData } from 'src/modules/player-gateway/types/player.types';

@WebSocketGateway({ namespace: 'gateway', cors: true })
export class PlayerGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private server: Server;

  constructor(private playerGatewayService: PlayerGatewayService) {}

  async handleDisconnect(socket: Socket) {
    await this.playerGatewayService.handlePlayerDisconnect(socket.id);
    // this.emitThingToEveryone();
  }

  async handleConnection(socket: Socket) {
    const authentication = await this.verifyAuthToken(socket.handshake.auth);

    if (!authentication) {
      return socket.disconnect();
    }
    await this.playerGatewayService.handlePlayerConnect(
      socket,
      authentication.data.id,
      authentication.data,
    );
  }

  @SubscribeMessage(FROM_PLAYER_EVENT_TYPES.GENERIC_MESSAGE)
  private async onGenericEvent(socket: Socket, event: ToPlayerGenericEvent) {
    console.log(event, 1111);
    this.playerGatewayService.handleGenericEvent(socket.id, event);
  }

  @SubscribeMessage(FROM_PLAYER_EVENT_TYPES.GAME_SERVER_STATUS)
  private async onGetAuth(): Promise<ToPlayerServerStatusEvent> {
    return Promise.resolve({
      type: TO_PLAYER_EVENT_TYPES.GAME_SERVER_STATUS,
      id: '0',
      message: {
        status: true,
      },
    });
  }

  public async verifyAuthToken(
    auth: unknown,
  ): Promise<ConnectedEntityData<PlayerData>> {
    // THIS METHOD WILL CALL LAMBDA LATER
    const { authToken } = auth as any;
    if (authToken < 10) {
      return null;
    }

    return {
      id: authToken,
      data: {
        id: authToken,
        name: 'id' + authToken,
        gameInstance: {
          id: 'entry1',
        },
      },
    };
  }
}
