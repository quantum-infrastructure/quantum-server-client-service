import { BaseEvent } from './base.event';

export type ToPlayerBaseEvens<T = unknown> = BaseEvent<T>;
export type FromPlayerBaseEvent<T = unknown> = BaseEvent<T>;

export type ToPlayerGenericEvent = BaseEvent<string>;
export type ToPlayerServerStatusEvent = BaseEvent<{
  status: boolean;
}>;

export type FromPlayerGenericEvent<T = unknown> = FromPlayerBaseEvent<T>;
export type FromPlayerServerStatusEvent<T = unknown> = FromPlayerBaseEvent<T>;
