import { Injectable } from '@nestjs/common';
import { ConnectionHandler } from 'src/common/connection-handler/connection-handler';
import {
  FromPlayerGenericEvent,
  ToPlayerBaseEvens,
} from 'src/common/events/player.event';
import { TO_PLAYER_EVENT_TYPES } from 'src/common/events/type/player.event-type';
import { PlayerData } from 'src/modules/player-gateway/types/player.types';
import { RedisService } from 'src/modules/redis/redis.service';
import { Socket } from 'socket.io';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  getGameInstanceMessagesKey,
  getPlayerHeartbeatKey,
} from 'src/common/access-patterns/access-patterns';
import { addPlayerToGameInstance } from 'src/modules/player-gateway/helper-methods/add-player-to-server';

@Injectable()
export class PlayerGatewayService {
  public connectionHandler: ConnectionHandler<PlayerData>;

  constructor(private readonly redisService: RedisService) {
    this.connectionHandler = new ConnectionHandler<PlayerData>();
  }

  async handleGenericEvent(socketId: string, event: FromPlayerGenericEvent) {
    const playerData =
      await this.connectionHandler.getEntityDataBySocketId(socketId);
    if (!playerData) {
      return;
    }

    await this.redisService.client.rPush(
      getGameInstanceMessagesKey(playerData.data.gameInstance?.id),
      JSON.stringify({
        //type: BASE_EVENT_TYPES.GENERIC_MESSAGE,
        type: event.type,
        id: event.id,
        message: event.message,
        playerId: playerData.id,
      }),
      //JSON.stringify(event),
    );
  }

  async handleGetAuth(socketId: string): Promise<ToPlayerBaseEvens> {
    const playerData =
      await this.connectionHandler.getEntityDataBySocketId(socketId);
    if (!playerData) {
      return;
    }

    return {
      type: TO_PLAYER_EVENT_TYPES.GAME_SERVER_STATUS,
      id: '0',
    };
  }

  async handlePlayerConnect(
    socket: Socket,
    playerId: string,
    playerData: PlayerData,
  ) {
    const connectedPlayer =
      await this.connectionHandler.addEntityDataToSocketConnection(socket, {
        id: playerId,
        data: playerData,
      });

    await this.redisService.addPlayerSubscriptionIfNotExists(
      playerId,
      (message: string) => {
        const messageJSON = JSON.parse(message);
        connectedPlayer.socketConnections.forEach((connection) => {
          connection.socket.emit(
            TO_PLAYER_EVENT_TYPES.GENERIC_MESSAGE,
            messageJSON,
          );
        });
      },
    );

    if (connectedPlayer.data.gameInstance) {
      await addPlayerToGameInstance(
        this.redisService.client,
        connectedPlayer.data,
        connectedPlayer.data.gameInstance.id,
      );
    }
  }

  async handlePlayerConnectToGameInstance(playerId: string, gameInstanceId: string) {
    const connectedPlayer =
      await this.connectionHandler.getEntityData(playerId);
    connectedPlayer.data.gameInstance = { id : gameInstanceId };
      await addPlayerToGameInstance(
        this.redisService.client,
        connectedPlayer.data,
        gameInstanceId,
      );
  }

  async handlePlayerDisconnect(socketId: string) {
    const playerData =
      await this.connectionHandler.getEntityDataBySocketId(socketId);
    await this.connectionHandler.removeSocketConnection(socketId);
    if (playerData?.socketConnections?.size == 0) {
      this.redisService.destroyPlayerSubscription(playerData.id);
    }
  }

  @Cron(CronExpression.EVERY_SECOND)
  async syncSocketsToRedis() {
    const allSocketConnections =
      await this.connectionHandler.getAllSocketConnections();

    const connectedPlayers: { [key: string]: string } = {};
    const timeStamp = Date.now().toString();
    const connectionArray = Array.from(allSocketConnections);
    if (connectionArray.length) {
      connectionArray.forEach(([, socketConnection]) => {
        connectedPlayers[
          getPlayerHeartbeatKey(socketConnection.entityData.id)
        ] = timeStamp;
      });

      await this.redisService.client.mSet(connectedPlayers);
    }
  }
}
