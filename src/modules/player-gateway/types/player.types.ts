export type PlayerData = {
  id: string;
  gameInstance?: {
    id: string;
  };
  additionalData?: {
    [key: string]: any;
  };
};
