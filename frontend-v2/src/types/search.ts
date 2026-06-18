export interface SearchUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  isVerified: boolean;
  followerCount?: number;
}

export interface SearchVideo {
  id: string;
  title: string | null;
  originalUrl: string;
  coverUrl: string | null;
  thumbnailUrl: string | null;
  viewCount: number;
  likeCount: number;
  author: SearchUser;
}

export interface SearchSuggestion {
  type: 'user' | 'video';
  value: string;
  label: string;
}

export interface SearchResponse {
  query: string;
  suggestions: SearchSuggestion[];
  users: SearchUser[];
  videos: SearchVideo[];
}
