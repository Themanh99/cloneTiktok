import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as http from '@/lib/http';
import { videoKeys } from './use-videos';

// ===== Types =====

interface LikeResponse {
  liked: boolean;
  likeCount: number;
}

interface BookmarkResponse {
  bookmarked: boolean;
}

// ===== Hooks =====

export const useLikeVideo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      videoId,
      isLiked,
    }: {
      videoId: string;
      isLiked: boolean;
    }) => {
      if (isLiked) {
        return http.del<LikeResponse>(`/videos/${videoId}/like`);
      }
      return http.post<LikeResponse>(`/videos/${videoId}/like`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: videoKeys.all });
    },
  });
};

export const useBookmarkVideo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      videoId,
      isBookmarked,
    }: {
      videoId: string;
      isBookmarked: boolean;
    }) => {
      if (isBookmarked) {
        return http.del<BookmarkResponse>(`/videos/${videoId}/bookmark`);
      }
      return http.post<BookmarkResponse>(`/videos/${videoId}/bookmark`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: videoKeys.all });
    },
  });
};

export const useFollowUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      isFollowing,
    }: {
      userId: string;
      isFollowing: boolean;
    }) => {
      if (isFollowing) {
        return http.del(`/users/${userId}/follow`);
      }
      return http.post(`/users/${userId}/follow`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: videoKeys.all });
    },
  });
};

export const useTrackView = () => {
  return useMutation({
    mutationFn: (videoId: string) => http.post(`/videos/${videoId}/view`),
  });
};
