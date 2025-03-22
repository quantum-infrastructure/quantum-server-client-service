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
  FromPlayerGenericEvent,
  ToPlayerGenericEvent,
  ToPlayerServerStatusEvent,
} from 'src/common/events/player.event';
import { PlayerData } from 'src/modules/player-gateway/types/player.types';
import { invokeAuthenticationLambda } from 'src/modules/player-gateway/helper-methods/authentication-request';
import { ConfigService } from 'src/modules/config/config.service';

@WebSocketGateway({ namespace: 'gateway', cors: true })
export class PlayerGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private server: Server;

  constructor(
    private playerGatewayService: PlayerGatewayService,
    private configService: ConfigService,
  ) {}

  async handleDisconnect(socket: Socket) {
    await this.playerGatewayService.handlePlayerDisconnect(socket.id);
    // this.emitThingToEveryone();
  }

  async handleConnection(socket: Socket) {
    if (!socket.handshake?.auth?.authToken) {
      return socket.disconnect();
    }

    const authentication = await this.verifyAuthToken(socket.handshake.auth);
    if (!authentication) {
      return socket.disconnect();
    }
    await this.playerGatewayService.handlePlayerConnect(
      socket,
      authentication.id,
      authentication.data,
    );
  }

  @SubscribeMessage(FROM_PLAYER_EVENT_TYPES.GENERIC_MESSAGE)
  private async onGenericEvent(socket: Socket, event: ToPlayerGenericEvent) {

    this.playerGatewayService.handleGenericEvent(socket.id, event);
  }

  @SubscribeMessage(FROM_PLAYER_EVENT_TYPES.CONNECT_TO_GAME_INSTANCE)
  private async onGameInstanceConnectEvent(
    socket: Socket,
    event: FromPlayerGenericEvent<{
      data: {
        gameInstanceId: string;
      }
      
    }>,
  ) {
    const gameInstanceId = event.message?.data.gameInstanceId;
    if (!gameInstanceId) {
      return {
        success: false,
      };
    }
    const player =
      await this.playerGatewayService.connectionHandler.getEntityDataBySocketId(
        socket.id,
      );
    if (!player) {
      return {
        success: false,
      };
    }

    await this.playerGatewayService.handlePlayerConnectToGameInstance(
      player.id,
      gameInstanceId,
    );
    return {
      success: true,
    };
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
    if (this.configService.config.environment == 'dev') {
      // HANDLE DEV ENVIRONMENT
      const { authToken } = auth as any;
      if (authToken < 10) {
        return null;
      }
      return {
        id: authToken,
        data: {
          id: authToken,
          additionalData: {
            name: `name-${authToken}`,
          },
        },
      };
    }

    const response = await invokeAuthenticationLambda({
      authenticationParams: auth as any,
      lambdaFunctionArn:
        this.configService.config.authentication.lambdaFunctionArn,
      region: this.configService.config.aws.region,
    });
    console.log("response from Lambda => ", response)
    if (!response) {
      return null;
    }
    return {
      ...response,
    };
  }
}
