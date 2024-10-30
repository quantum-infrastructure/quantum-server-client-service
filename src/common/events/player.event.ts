import { BaseEvent } from './base.event';

export type ToPlayerBaseEvens<T = unknown> = BaseEvent<T>;
export type FromPlayerBaseEvent<T = unknown> = BaseEvent<T>;

export type ToPlayerGenericEvent = BaseEvent<string>;
export type ToPlayerServerStatusEvent = BaseEvent<{
  status: boolean;
}>;

export type FromPlayerGenericEvent = FromPlayerBaseEvent<unknown>;
export type FromPlayerServerStatusEvent = FromPlayerBaseEvent<undefined>;
