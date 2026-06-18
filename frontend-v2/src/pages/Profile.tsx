import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore, useAuthModalStore } from '@/stores';
import * as http from '@/lib/http';
import EditProfileModal from '@/components/EditProfileModal';
import { useRef } from 'react';
import { useTranslation } from '@/i18n';
import { PageError, PageSkeleton } from '@/components/common/Feedback';

interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  isVerified: boolean;
  followerCount: number;
  followingCount: number;
  totalLikes: number;
  isFollowing: boolean;
}

interface VideoItem {
  id: string;
  title: string;
  originalUrl: string;
  coverUrl: string | null;
  thumbnailUrl: string | null;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  visibility: 'PUBLIC' | 'FRIENDS_ONLY' | 'PRIVATE';
  isPinned?: boolean;
}

const VerifiedBadge = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" fill="none" className="inline-block ml-1">
    <circle cx="24" cy="24" r="20" fill="#20D5EC" />
    <path d="M16 24L22 30L32 18" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const VideoCard = ({ video, onClick }: { video: VideoItem; onClick: () => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleMouseEnter = () => {
    videoRef.current?.play().catch(() => {});
  };

  const handleMouseLeave = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <div
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative aspect-[9/16] rounded-lg overflow-hidden bg-black cursor-pointer group shadow-sm border border-border/20 transition-transform duration-200 hover:scale-[1.01]"
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={video.originalUrl}
        poster={video.coverUrl || video.thumbnailUrl || undefined}
        muted
        loop
        playsInline
        className="w-full h-full object-cover"
      />

      {/* Pin Badge */}
      {video.isPinned && (
        <span className="absolute top-2 left-2 px-1.5 py-0.5 text-[10px] font-bold bg-primary text-white rounded">
          Ghim
        </span>
      )}

      {/* Visibility Badge (padlock for PRIVATE) */}
      {video.visibility === 'PRIVATE' && (
        <span className="absolute bottom-2 left-2 p-1.5 bg-black/40 text-white rounded-full">
          <svg width="12" height="12" viewBox="0 0 48 48" fill="none" className="text-white">
            <path d="M12 22H36V42H12V22Z" fill="currentColor" stroke="currentColor" strokeWidth="4" strokeLinejoin="round"/>
            <path d="M18 22V15C18 11.6863 20.6863 9 24 9C27.3137 9 30 11.6863 30 15V22" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      )}

      {/* View Count Overlay */}
      <div className="absolute bottom-2 right-2 flex items-center gap-1 text-white text-xs font-bold bg-black/25 px-1.5 py-0.5 rounded-sm">
        <svg width="12" height="12" viewBox="0 0 48 48" fill="currentColor">
          <path d="M24 9C14 9 6 15 2 24C6 33 14 39 24 39C34 39 42 33 46 24C42 15 34 9 24 9ZM24 33C19.03 33 15 28.97 15 24C15 19.03 19.03 15 24 15C28.97 15 33 19.03 33 24C33 28.97 28.97 33 24 33ZM24 18C20.69 18 18 20.69 18 24C18 27.31 20.69 30 24 30C27.31 30 30 27.31 30 24C30 20.69 27.31 18 24 18Z" />
        </svg>
        <span>{video.viewCount}</span>
      </div>
    </div>
  );
};

export default function ProfilePage() {
  const { nickname } = useParams<{ nickname: string }>();
  const cleanNickname = nickname?.startsWith('@') ? nickname.slice(1) : nickname;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const user = useAuthStore((s) => s.user);
  const openModal = useAuthModalStore((s) => s.openModal);
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [isEditOpen, setIsEditOpen] = useState(false);

  const isOwner = user?.username === cleanNickname;

  // Fetch Public Profile from NestJS backend API
  const {
    data: profile,
    isLoading: isProfileLoading,
    error: profileError,
    refetch: refetchProfile,
  } = useQuery<UserProfile>({
    queryKey: ['profile', cleanNickname],
    queryFn: () => http.get(`/users/${cleanNickname}`),
    enabled: !!cleanNickname,
    retry: 1,
  });

  // Fetch Videos (filter by tab: PUBLIC vs PRIVATE)
  const { data: videosData, isLoading: isVideosLoading } = useQuery<{ data: VideoItem[] }>({
    queryKey: ['profile-videos', cleanNickname, activeTab],
    queryFn: () => http.get(`/users/${cleanNickname}/videos`, {
      params: { visibility: activeTab }
    }),
    enabled: !!cleanNickname,
    retry: 1,
  });

  const videos = videosData?.data || [];

  // Follow/Unfollow Mutation
  const followMutation = useMutation({
    mutationFn: () => {
      const endpoint = `/users/${profile?.id}/follow`;
      return profile?.isFollowing ? http.del(endpoint) : http.post(endpoint);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', cleanNickname] });
    },
  });

  const handleFollowClick = () => {
    if (!user) {
      openModal('login');
      return;
    }
    followMutation.mutate();
  };

  if (isProfileLoading) {
    return <PageSkeleton rows={5} />;
  }

  if (profileError || !profile) {
    return (
      <PageError
        title={t('profile.notFound')}
        description={t('profile.notFoundDescription')}
        onRetry={() => void refetchProfile()}
      />
    );
  }

  return (
    <div className="max-w-[1000px] mx-auto px-4 py-8 animate-fade-in">
      {/* Profile Header */}
      <div className="flex gap-6 items-start mb-8">
        <img
          src={profile.avatarUrl || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300'}
          alt={profile.username}
          className="w-28 h-28 rounded-full object-cover border-2 border-border"
        />
        <div className="flex-1 min-w-0 pt-2">
          <div className="flex items-center gap-4 mb-1.5 flex-wrap">
            <h1 className="text-2xl font-bold text-text-primary tracking-tight truncate flex items-center">
              {profile.username}
              {profile.isVerified && <VerifiedBadge />}
            </h1>
            {isOwner ? (
              <button
                onClick={() => setIsEditOpen(true)}
                className="px-6 py-1.5 border border-border text-text-primary font-bold text-sm rounded-md hover:bg-bg-hover transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <svg width="16" height="16" viewBox="0 0 48 48" fill="none">
                  <path d="M7 42H43" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M11 26.7199V34H18.3172L39 13.3081L31.6919 6L11 26.7199Z" fill="none" stroke="currentColor" strokeWidth="4" strokeLinejoin="round"/>
                </svg>
                {t('profile.edit')}
              </button>
            ) : (
              <button
                onClick={handleFollowClick}
                disabled={followMutation.isPending}
                className={`px-8 py-1.5 rounded-md font-bold text-sm shadow-sm transition-colors ${
                  profile.isFollowing
                    ? 'border border-border text-text-primary hover:bg-bg-hover'
                    : 'bg-primary text-white hover:bg-primary-hover'
                }`}
              >
                {profile.isFollowing ? t('profile.following') : 'Follow'}
              </button>
            )}
          </div>
          <p className="text-lg text-text-secondary font-medium mb-4">{profile.displayName}</p>

          {/* Stats block */}
          <div className="flex gap-6 mb-4 text-sm">
            <span className="text-text-secondary">
              <strong className="text-text-primary text-base font-bold mr-1">{profile.followingCount}</strong> {t('profile.following')}
            </span>
            <span className="text-text-secondary">
              <strong className="text-text-primary text-base font-bold mr-1">{profile.followerCount}</strong> {t('profile.followers')}
            </span>
            <span className="text-text-secondary">
              <strong className="text-text-primary text-base font-bold mr-1">{profile.totalLikes}</strong> {t('profile.likes')}
            </span>
          </div>

          {/* Bio block */}
          <p className="text-sm text-text-primary whitespace-pre-line leading-relaxed font-normal">
            {profile.bio || t('profile.noBio')}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-divider flex gap-8 mb-6">
        <button
          onClick={() => setActiveTab('PUBLIC')}
          className={`pb-3 font-semibold text-sm transition-colors relative ${
            activeTab === 'PUBLIC'
              ? 'text-text-primary border-b-2 border-text-primary'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          {t('profile.videos')}
        </button>
        {isOwner && (
          <button
            onClick={() => setActiveTab('PRIVATE')}
            className={`pb-3 font-semibold text-sm transition-colors relative flex items-center gap-1.5 ${
              activeTab === 'PRIVATE'
                ? 'text-text-primary border-b-2 border-text-primary'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 48 48" fill="none">
              <path d="M12 22H36V42H12V22Z" fill="currentColor" stroke="currentColor" strokeWidth="4" strokeLinejoin="round"/>
              <path d="M18 22V15C18 11.6863 20.6863 9 24 9C27.3137 9 30 11.6863 30 15V22" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {t('profile.private')}
          </button>
        )}
      </div>

      {/* Videos Grid */}
      {isVideosLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="text-text-tertiary mb-3">
            <path d="M24 4C12.95 4 4 12.95 4 24C4 35.05 12.95 44 24 44C35.05 44 44 35.05 44 24C44 12.95 35.05 4 24 4ZM24 38C16.28 38 10 31.72 10 24C10 16.28 16.28 10 24 10C31.72 10 38 16.28 38 24C38 31.72 31.72 38 24 38ZM22 18H26V22H22V18ZM22 26H26V32H22V26Z" fill="currentColor" />
          </svg>
          <p className="text-sm font-semibold text-text-secondary">{t('profile.noVideos')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {videos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onClick={() => navigate(`/video/${video.id}`)}
            />
          ))}
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditOpen && (
        <EditProfileModal isOpen onClose={() => setIsEditOpen(false)} />
      )}
    </div>
  );
}
