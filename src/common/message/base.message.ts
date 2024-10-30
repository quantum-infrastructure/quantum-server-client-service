export type BaseMessage<T = unknown> = {
  type: string;
  data?: T;
};
