import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import * as http from '@/lib/http';

// ===== Types =====

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  isVerified: boolean;
  followerCount: number;
  followingCount: number;
  totalLikes: number;
  videoCount: number;
  isFollowing?: boolean;
}

export interface UserSearchResult {
  data: UserProfile[];
}

// ===== Query Keys =====

export const userKeys = {
  all: ['users'] as const,
  me: () => [...userKeys.all, 'me'] as const,
  detail: (id: string) => [...userKeys.all, 'detail', id] as const,
  search: (q: string) => [...userKeys.all, 'search', q] as const,
  followers: (id: string) => [...userKeys.all, 'followers', id] as const,
  following: (id: string) => [...userKeys.all, 'following', id] as const,
  videos: (id: string) => [...userKeys.all, 'videos', id] as const,
  suggested: () => [...userKeys.all, 'suggested'] as const,
};

// ===== Hooks =====

export const useCurrentUser = () => {
  return useQuery({
    queryKey: userKeys.me(),
    queryFn: () => http.get<UserProfile>('/users/me'),
    retry: false,
  });
};

export const useUser = (id: string) => {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => http.get<UserProfile>(`/users/${id}`),
    enabled: !!id,
  });
};

export const useUserSearch = (q: string) => {
  return useQuery({
    queryKey: userKeys.search(q),
    queryFn: ({ signal }) =>
      http.get<UserSearchResult>('/users/search', {
        params: { q, limit: 10 },
        signal,
      }),
    enabled: q.length > 0,
  });
};

export const useSuggestedUsers = (limit = 5) => {
  return useQuery({
    queryKey: userKeys.suggested(),
    queryFn: () =>
      http.get<UserSearchResult>('/users/search', {
        params: { q: '', limit },
      }),
  });
};

export const useUserVideos = (userId: string) => {
  return useInfiniteQuery({
    queryKey: userKeys.videos(userId),
    queryFn: async ({ pageParam }) => {
      const params: Record<string, unknown> = { limit: 12 };
      if (pageParam) params.cursor = pageParam;
      return http.get<{ data: unknown[]; nextCursor: string | null }>(
        `/users/${userId}/videos`,
        { params },
      );
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!userId,
  });
};
