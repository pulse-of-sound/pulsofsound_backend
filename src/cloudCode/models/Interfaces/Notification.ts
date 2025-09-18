export interface NotificationBody {
  topic?: string;
  user_ids?: string[];
  title: string;
  body: string;
  color?: string;
  sound?: string;
  channelId?: string;
  icon?: string;
  id?: string;
  imageUrl?: string;
  data?: any;
}
