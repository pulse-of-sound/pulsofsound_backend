export interface QueryConfig {
  limit: number;
  order?: string;
  where?: Record<string, any>;
  postIds?: string[];
  bannerIds: string[];
  featured: boolean;
  newest: boolean;
  popular: boolean;
  likes: boolean;
  rate: boolean;
}
