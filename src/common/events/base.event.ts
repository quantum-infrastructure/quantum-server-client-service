export type BaseEvent<T = unknown> = {
  type: string;
  id: string;
  message?: T;
  playerId?: string;
};
