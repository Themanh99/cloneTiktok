import React, { useEffect, useRef, useState } from 'react';
import { useAuthStore, useAuthModalStore, useVideoPlayerStore } from '@/stores';
import { useLikeVideo, useBookmarkVideo, useFollowUser } from '@/hooks/use-interactions';
import { useTranslation } from '@/i18n';

// Icons
const HeartIcon = ({ liked }: { liked?: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 48 48" fill={liked ? '#FE2C55' : 'currentColor'}>
    <path d="M24 9.17647C20.6667 4.23529 13.5 3 8.5 8C3.5 13 4 21.5 11 28.5L24 41L37 28.5C44 21.5 44.5 13 39.5 8C34.5 3 27.3333 4.23529 24 9.17647Z" />
  </svg>
);

const CommentIcon = () => (
  <svg width="24" height="24" viewBox="0 0 48 48" fill="currentColor">
    <path d="M24 6C13.5 6 5 13.2 5 22.1C5 27 7.5 31.4 11.5 34.3L9 41.5C8.8 42.1 9.4 42.6 10 42.2L18.5 37.5C20.3 38 22.1 38.2 24 38.2C34.5 38.2 43 31 43 22.1C43 13.2 34.5 6 24 6Z" />
  </svg>
);

const BookmarkIcon = ({ bookmarked }: { bookmarked?: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 48 48" fill={bookmarked ? '#F7B500' : 'currentColor'}>
    <path d="M12 6C10.9 6 10 6.9 10 8V41L24 32L38 41V8C38 6.9 37.1 6 36 6H12Z" />
  </svg>
);

const ShareIcon = () => (
  <svg width="24" height="24" viewBox="0 0 48 48" fill="currentColor">
    <path d="M34.7 15.3L25.3 5.9C24.5 5.1 23 5.7 23 7V13C12.5 13.5 5 18 5 32.5C5 34.5 7.5 35.5 8.9 34.1C13.2 29.8 17.5 28 23 28V34C23 35.3 24.5 35.9 25.3 35.1L34.7 25.7C35.5 24.9 35.5 23.5 34.7 22.7L34.7 15.3Z" />
  </svg>
);

const MusicIcon = () => (
  <svg width="14" height="14" viewBox="0 0 48 48" fill="currentColor" className="animate-spin-slow">
    <path d="M20 9V37C20 39.8 17.8 42 15 42C12.2 42 10 39.8 10 37C10 34.2 12.2 32 15 32H18V13H38V21C38 23.8 35.8 26 33 26C30.2 26 28 23.8 28 21H30C30 22.1 30.9 23 32 23C33.1 23 34 22.1 34 21V9H20Z" />
  </svg>
);

const PlayIcon = () => (
  <svg width="28" height="28" viewBox="0 0 48 48" fill="currentColor">
    <path d="M12 8L40 24L12 40V8Z" />
  </svg>
);

const PauseIcon = () => (
  <svg width="28" height="28" viewBox="0 0 48 48" fill="currentColor">
    <path d="M10 8H18V40H10V8ZM30 8H38V40H30V8Z" />
  </svg>
);

const MuteIcon = () => (
  <svg width="22" height="22" viewBox="0 0 48 48" fill="currentColor">
    <path d="M8 18H16L28 6V42L16 30H8V18ZM38 24C38 19 35.3 14.7 31.3 12.3L29.7 13.9C33 15.9 35 19.7 35 24C35 28.3 33 32.1 29.7 34.1L31.3 35.7C35.3 33.3 38 29 38 24Z" />
  </svg>
);

const VolumeIcon = () => (
  <svg width="22" height="22" viewBox="0 0 48 48" fill="currentColor">
    <path d="M8 18H16L28 6V42L16 30H8V18ZM34 24C34 18 30.5 13 25.5 10.8V15.2C28.2 17.2 30 20.4 30 24C30 27.6 28.2 30.8 25.5 32.8V37.2C30.5 35 34 30 34 24ZM40 24C40 14.5 34.3 6.5 26.3 3V7.7C31.5 10.9 35 17 35 24C35 31 31.5 37.1 26.3 40.3V45C34.3 41.5 40 33.5 40 24Z" />
  </svg>
);

export interface VideoData {
  id: string;
  description: string;
  file_url: string;
  thumb_url: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  music: string;
  tick: boolean;
  is_liked?: boolean;
  is_bookmarked?: boolean;
  user: {
    id: string;
    nickname: string;
    first_name: string;
    avatar?: string | null;
    is_followed: boolean;
  };
}

interface VideoCardProps {
  video: VideoData;
  active: boolean;
  onCommentsClick?: () => void;
}

export default function VideoCard({ video, active, onCommentsClick }: VideoCardProps) {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const openModal = useAuthModalStore((s) => s.openModal);
  
  const { volume, muted, setVolume, toggleMute } = useVideoPlayerStore();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLiked, setIsLiked] = useState(video.is_liked || false);
  const [isBookmarked, setIsBookmarked] = useState(video.is_bookmarked || false);
  const [isFollowing, setIsFollowing] = useState(video.user.is_followed || false);
  const [likesCount, setLikesCount] = useState(video.likes_count || 0);
  const [bookmarksCount, setBookmarksCount] = useState(video.shares_count || 0);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  const likeMutation = useLikeVideo();
  const bookmarkMutation = useBookmarkVideo();
  const followMutation = useFollowUser();

  // Sync state on video prop changes
  useEffect(() => {
    // State mirrors a new feed item when React reuses this card instance.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLiked(video.is_liked || false);
    setIsBookmarked(video.is_bookmarked || false);
    setIsFollowing(video.user.is_followed || false);
    setLikesCount(video.likes_count || 0);
    setBookmarksCount(video.shares_count || 0);
  }, [video]);

  // Sync active state with playback
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    if (active) {
      videoEl.play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    } else {
      videoEl.pause();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsPlaying(false);
    }
  }, [active]);

  // Sync volume / muted globally from Zustand
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    
    videoEl.volume = volume / 100;
    videoEl.muted = muted;
  }, [volume, muted]);

  const handlePlayPause = () => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    if (isPlaying) {
      videoEl.pause();
      setIsPlaying(false);
    } else {
      videoEl.play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleTimelineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleLike = () => {
    if (!user) {
      openModal('login');
      return;
    }
    const nextVal = !isLiked;
    setIsLiked(nextVal);
    setLikesCount((prev) => (nextVal ? prev + 1 : Math.max(0, prev - 1)));
    likeMutation.mutate({
      videoId: video.id,
      isLiked: isLiked,
    });
  };

  const handleBookmark = () => {
    if (!user) {
      openModal('login');
      return;
    }
    const nextVal = !isBookmarked;
    setIsBookmarked(nextVal);
    setBookmarksCount((prev) => (nextVal ? prev + 1 : Math.max(0, prev - 1)));
    bookmarkMutation.mutate({
      videoId: video.id,
      isBookmarked: isBookmarked,
    });
  };

  const handleFollow = () => {
    if (!user) {
      openModal('login');
      return;
    }
    const nextVal = !isFollowing;
    setIsFollowing(nextVal);
    followMutation.mutate({
      userId: video.user.id,
      isFollowing: isFollowing,
    });
  };

  const handleCommentClick = () => {
    if (onCommentsClick) {
      onCommentsClick();
    } else if (!user) {
      openModal('login');
    }
  };

  const formatTime = (time: number) => {
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div ref={containerRef} className="mx-auto flex max-w-[640px] flex-col gap-3 border-b border-divider py-4 sm:flex-row sm:gap-4 sm:py-6">
      {/* Video Content Panel */}
      <div className="flex-1 flex flex-col">
        {/* Author Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <div className="h-9 w-9 shrink-0 rounded-full overflow-hidden border border-border bg-bg-secondary cursor-pointer sm:h-10 sm:w-10">
              {video.user.avatar ? (
                <img src={video.user.avatar} alt={video.user.nickname} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-text-secondary">
                  {video.user.nickname[0].toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-1">
                <span className="truncate font-bold text-text-primary hover:underline cursor-pointer">
                  {video.user.nickname}
                </span>
                {video.tick && (
                  <svg className="text-[#20D5EC] w-[14px] h-[14px]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
                <span className="hidden truncate text-xs text-text-secondary font-medium sm:inline">· {video.user.first_name}</span>
              </div>
              <p className="text-sm text-text-primary mt-0.5 line-clamp-2 leading-relaxed">
                {video.description}
              </p>
            </div>
          </div>
          
          {/* Follow Button */}
          {!isFollowing && user?.id !== video.user.id && (
            <button
              onClick={handleFollow}
              className="shrink-0 rounded border border-primary px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary-light cursor-pointer sm:px-4 sm:text-sm"
            >
              Follow
            </button>
          )}
        </div>

        {/* Player Container */}
        <div className="relative mx-auto aspect-[9/16] w-full max-h-[72svh] bg-black rounded-lg overflow-hidden group sm:max-h-[580px]">
          {/* Video element */}
          <video
            ref={videoRef}
            loop
            preload="auto"
            onClick={handlePlayPause}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            className="w-full h-full object-cover cursor-pointer"
          >
            <source src={video.file_url} type="video/mp4" />
          </video>

          {/* Bottom Info & Music Ticker Overlay */}
          <div className="absolute bottom-14 left-4 right-4 text-white z-10 select-none pointer-events-none">
            <div className="flex items-center gap-2 text-xs font-semibold bg-black/25 backdrop-blur-md px-3 py-1.5 rounded-full w-fit max-w-[80%]">
              <MusicIcon />
              <span className="truncate">{video.music}</span>
            </div>
          </div>

          {/* Controls HUD */}
          <div className="absolute inset-0 flex flex-col justify-between p-3 bg-gradient-to-t from-black/60 via-transparent to-black/20 opacity-100 transition-opacity duration-300 sm:p-4 sm:opacity-0 sm:group-hover:opacity-100">
            {/* Top controls (Volume, etc) */}
            <div className="flex justify-end relative">
              <div 
                className="relative"
                onMouseEnter={() => setShowVolumeSlider(true)}
                onMouseLeave={() => setShowVolumeSlider(false)}
              >
                {/* Volume Slider Drawer */}
                {showVolumeSlider && (
                  <div className="absolute right-0 bottom-full mb-2 bg-black/80 backdrop-blur-md px-2 py-4 rounded-full flex flex-col items-center gap-2 shadow-lg animate-fade-in border border-white/10">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={muted ? 0 : volume}
                      onChange={(e) => setVolume(parseInt(e.target.value))}
                      className="accent-primary h-24 w-1 [writing-mode:vertical-lr] direction-rtl cursor-pointer"
                    />
                    <span className="text-[10px] text-white font-bold">{muted ? 0 : volume}%</span>
                  </div>
                )}
                
                {/* Mute Button */}
                <button
                  onClick={toggleMute}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 text-white transition-colors cursor-pointer border border-white/10"
                >
                  {muted ? <MuteIcon /> : <VolumeIcon />}
                </button>
              </div>
            </div>

            {/* Middle play/pause HUD indicator */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <button 
                onClick={handlePlayPause}
                className="w-16 h-16 rounded-full bg-black/55 backdrop-blur-sm flex items-center justify-center text-white scale-90 active:scale-75 group-hover:scale-100 transition-all shadow-xl"
              >
                {isPlaying ? <PauseIcon /> : <PlayIcon />}
              </button>
            </div>

            {/* Bottom track bar slider */}
            <div className="mt-auto flex items-center gap-3 text-white text-xs select-none">
              <span>{formatTime(currentTime)}</span>
              <input
                type="range"
                min="0"
                max={duration || 100}
                step="0.1"
                value={currentTime}
                onChange={handleTimelineChange}
                className="flex-1 accent-primary h-1 rounded-full cursor-pointer bg-white/30"
              />
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Vertical Action Column (Right side) */}
      <div className="sticky bottom-[calc(64px+env(safe-area-inset-bottom))] z-20 -mx-1 flex items-center justify-around gap-2 rounded-xl border border-border bg-bg-primary/95 px-2 py-2 shadow-lg backdrop-blur sm:static sm:mx-0 sm:flex-col sm:justify-end sm:gap-5 sm:self-end sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:shadow-none">
        {/* Creator Avatar & follow status badge */}
        <div className="relative mb-2 hidden sm:block">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white bg-bg-secondary shadow cursor-pointer">
            {video.user.avatar ? (
              <img src={video.user.avatar} alt={video.user.nickname} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-text-secondary">
                {video.user.nickname[0].toUpperCase()}
              </div>
            )}
          </div>
          {/* Active red plus icon to follow */}
          {!isFollowing && user?.id !== video.user.id && (
            <button
              onClick={handleFollow}
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-primary hover:bg-primary-hover text-white w-5 h-5 rounded-full flex items-center justify-center shadow transition-colors cursor-pointer"
            >
              <span className="text-sm font-extrabold leading-none">+</span>
            </button>
          )}
        </div>

        {/* Like Button */}
        <div className="text-center">
          <button
            onClick={handleLike}
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-md transition-colors cursor-pointer border border-border bg-bg-secondary hover:bg-bg-hover ${
              isLiked ? 'text-primary' : 'text-text-primary'
            }`}
          >
            <HeartIcon liked={isLiked} />
          </button>
          <span className="text-xs text-text-secondary font-bold mt-1.5 block">
            {likesCount.toLocaleString('vi-VN')}
          </span>
        </div>

        {/* Comment Button */}
        <div className="text-center">
          <button
            onClick={handleCommentClick}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-md text-text-primary hover:bg-bg-hover transition-colors cursor-pointer border border-border bg-bg-secondary"
          >
            <CommentIcon />
          </button>
          <span className="text-xs text-text-secondary font-bold mt-1.5 block">
            {video.comments_count.toLocaleString('vi-VN')}
          </span>
        </div>

        {/* Bookmark Button */}
        <div className="text-center">
          <button
            onClick={handleBookmark}
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-md transition-colors cursor-pointer border border-border bg-bg-secondary hover:bg-bg-hover ${
              isBookmarked ? 'text-[#F7B500]' : 'text-text-primary'
            }`}
          >
            <BookmarkIcon bookmarked={isBookmarked} />
          </button>
          <span className="text-xs text-text-secondary font-bold mt-1.5 block">
            {bookmarksCount.toLocaleString('vi-VN')}
          </span>
        </div>

        {/* Share Button */}
        <div className="text-center">
          <button
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-md text-text-primary hover:bg-bg-hover transition-colors cursor-pointer border border-border bg-bg-secondary"
          >
            <ShareIcon />
          </button>
          <span className="text-xs text-text-secondary font-bold mt-1.5 block">
            {t('misc.share')}
          </span>
        </div>
      </div>
    </div>
  );
}
