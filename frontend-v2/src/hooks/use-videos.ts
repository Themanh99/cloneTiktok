import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import * as http from '@/lib/http';

// ===== Types =====

export interface VideoAuthor {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  isVerified: boolean;
}

export interface VideoSound {
  id: string;
  name: string;
}

export interface Video {
  id: string;
  title: string;
  hlsUrl: string | null;
  originalUrl: string;
  coverUrl: string | null;
  thumbnailUrl: string | null;
  width: number;
  height: number;
  duration: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  viewCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
  isFollowing: boolean;
  author: VideoAuthor;
  sound: VideoSound | null;
  createdAt: string;
}

interface FeedResponse {
  data: Video[];
  nextCursor: string | null;
}

// ===== Query Keys =====

export const videoKeys = {
  all: ['videos'] as const,
  feed: (type: 'for-you' | 'following') =>
    [...videoKeys.all, 'feed', type] as const,
  detail: (id: string) => [...videoKeys.all, 'detail', id] as const,
};

// ===== Hooks =====

export const useVideoFeed = (type: 'for-you' | 'following' = 'for-you') => {
  const endpoint = type === 'following' ? '/videos/following' : '/videos/feed';

  return useInfiniteQuery({
    queryKey: videoKeys.feed(type),
    queryFn: async ({ pageParam }) => {
      const params: Record<string, unknown> = { limit: 10 };
      if (pageParam) params.cursor = pageParam;
      return http.get<FeedResponse>(endpoint, { params });
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
};

export const useVideo = (id: string) => {
  return useQuery({
    queryKey: videoKeys.detail(id),
    queryFn: () => http.get<Video>(`/videos/${id}`),
    enabled: !!id,
  });
};
