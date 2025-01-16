import { BASE_EVENT_TYPES } from './base.event-type';

export const PLAYER_EVENT_TYPES = {
  ...BASE_EVENT_TYPES,
  GAME_SERVER_STATUS: 'game-server-status',
  CONNECT_TO_GAME_INSTANCE: 'connect-to-game-instance',
} as const;

export const TO_PLAYER_EVENT_TYPES = {
  ...PLAYER_EVENT_TYPES,
} as const;

export const FROM_PLAYER_EVENT_TYPES = {
  ...PLAYER_EVENT_TYPES,
} as const;

export type ToPlayerEventType =
  (typeof TO_PLAYER_EVENT_TYPES)[keyof typeof TO_PLAYER_EVENT_TYPES];

export type FromPlayerEventType =
  (typeof FROM_PLAYER_EVENT_TYPES)[keyof typeof FROM_PLAYER_EVENT_TYPES];
