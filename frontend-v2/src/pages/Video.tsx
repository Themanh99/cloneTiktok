import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore, useAuthModalStore } from '@/stores';
import * as http from '@/lib/http';
import { useTranslation } from '@/i18n';
import CommentThread, { type CommentItem } from '@/components/CommentThread';
import { appToast } from '@/lib/toast';

interface VideoDetail {
  id: string;
  title: string;
  originalUrl: string;
  coverUrl: string | null;
  thumbnailUrl: string | null;
  duration: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  visibility: string;
  allowComments: boolean;
  createdAt: string;
  isLiked: boolean;
  isBookmarked: boolean;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    isVerified: boolean;
  };
  sound: {
    id: string;
    name: string;
    audioUrl: string;
    coverUrl: string | null;
  } | null;
  hashtags: Array<{ id: string; name: string }>;
}

export default function VideoPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const user = useAuthStore((s) => s.user);
  const openModal = useAuthModalStore((s) => s.openModal);
  const { t } = useTranslation();

  // States
  const [commentContent, setCommentContent] = useState('');
  const [replyToComment, setReplyToComment] = useState<CommentItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch Video Detail
  const { data: video, isLoading: isVideoLoading, error: videoError } = useQuery<VideoDetail>({
    queryKey: ['video', uuid],
    queryFn: () => http.get(`/videos/${uuid}`),
    enabled: !!uuid,
    retry: 1,
  });

  // Record a view on mount
  useEffect(() => {
    if (uuid) {
      http.post(`/videos/${uuid}/view`).catch(() => {});
    }
  }, [uuid]);

  // Fetch root comments
  const { data: commentsData, isLoading: isCommentsLoading } = useQuery<{ data: CommentItem[] }>({
    queryKey: ['video-comments', uuid],
    queryFn: () => http.get(`/videos/${uuid}/comments`),
    enabled: !!uuid,
  });

  const comments = commentsData?.data || [];

  // Mutations
  const likeMutation = useMutation({
    mutationFn: () => {
      const endpoint = `/videos/${uuid}/like`;
      return video?.isLiked ? http.del(endpoint) : http.post(endpoint);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video', uuid] });
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: () => {
      const endpoint = `/videos/${uuid}/bookmark`;
      return video?.isBookmarked ? http.del(endpoint) : http.post(endpoint);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video', uuid] });
    },
  });

  const postCommentMutation = useMutation({
    mutationFn: (data: { content: string; parentId?: string }) =>
      http.post(`/videos/${uuid}/comments`, data),
    onSuccess: () => {
      setCommentContent('');
      setReplyToComment(null);
      queryClient.invalidateQueries({ queryKey: ['video-comments', uuid] });
      queryClient.invalidateQueries({ queryKey: ['comment-replies'] });
      queryClient.invalidateQueries({ queryKey: ['video', uuid] });
    },
    onError: (err: unknown) => {
      appToast.error(err, t('video.commentFailed'));
    },
  });

  // Video Controls
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(() => {});
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
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

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (videoRef.current) {
      videoRef.current.currentTime = val;
    }
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openModal('login');
      return;
    }
    if (!commentContent.trim()) return;

    postCommentMutation.mutate({
      content: commentContent,
      parentId: replyToComment?.id,
    });
  };

  const handleReplyClick = (comment: CommentItem) => {
    setReplyToComment(comment);
    inputRef.current?.focus();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    appToast.success(t('video.copyLink'));
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (isVideoLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (videoError || !video) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black text-white p-4">
        <h2 className="text-xl font-bold mb-2">{t('video.notFound')}</h2>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary-hover transition-colors"
        >
          {t('common.home')}
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-[calc(100dvh-124px)] w-full flex-col overflow-y-auto bg-bg-primary animate-fade-in lg:h-[calc(100dvh-60px)] lg:min-h-0 lg:flex-row lg:overflow-hidden">
      
      {/* LEFT COLUMN: VIDEO VIEW */}
      <div className="group/video relative flex h-[58svh] min-h-[420px] shrink-0 select-none items-center justify-center bg-black lg:h-auto lg:min-h-0 lg:flex-[1.5]">
        
        {/* Backdrop Blurred Poster */}
        <img
          src={video.coverUrl || video.thumbnailUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800'}
          className="absolute inset-0 w-full h-full object-cover opacity-35 filter blur-3xl scale-110 pointer-events-none"
          alt="Blur poster"
        />

        {/* Close Button */}
        <button
          onClick={() => {
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate(`/@${video.author.username}`);
            }
          }}
          className="absolute left-3 top-3 z-30 rounded-full bg-black/45 p-2 text-white shadow-md transition-colors hover:bg-black/60 cursor-pointer sm:left-5 sm:top-5"
        >
          <svg width="24" height="24" viewBox="0 0 48 48" fill="none">
            <path d="M14 14L34 34" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M14 34L34 14" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Video Player Box */}
        <div className="relative flex h-[56svh] max-h-[800px] aspect-[9/16] items-center justify-center overflow-hidden bg-black shadow-2xl sm:rounded-lg lg:h-[calc(100dvh-92px)]">
          <video
            ref={videoRef}
            src={video.originalUrl}
            poster={video.coverUrl || video.thumbnailUrl || undefined}
            autoPlay
            loop
            muted={isMuted}
            playsInline
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            className="w-full h-full object-contain cursor-pointer"
            onClick={togglePlay}
          />

          {/* Big Play Overlay (only when paused) */}
          {!isPlaying && (
            <div
              onClick={togglePlay}
              className="absolute inset-0 flex items-center justify-center bg-black/10 cursor-pointer"
            >
              <div className="p-4 bg-black/50 rounded-full text-white">
                <svg width="40" height="40" viewBox="0 0 48 48" fill="currentColor">
                  <path d="M12 8V40L36 24L12 8Z" />
                </svg>
              </div>
            </div>
          )}

          {/* Bottom Custom Progress Bar & Timer */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 rounded-lg bg-black/35 px-3 py-2 text-[11px] text-white opacity-100 backdrop-blur-sm transition-opacity duration-300 sm:bottom-4 sm:left-4 sm:right-4 sm:gap-3 sm:px-4 sm:py-2.5 sm:text-xs lg:opacity-0 lg:group-hover/video:opacity-100">
            <button onClick={togglePlay} className="hover:text-primary transition-colors">
              {isPlaying ? (
                <svg width="18" height="18" viewBox="0 0 48 48" fill="currentColor">
                  <path d="M12 8H18V40H12V8ZM30 8H36V40H30V8Z" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 48 48" fill="currentColor">
                  <path d="M12 8V40L36 24L12 8Z" />
                </svg>
              )}
            </button>

            {/* Slider */}
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={handleProgressChange}
              className="flex-1 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none"
            />

            <span className="hidden sm:inline">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            {/* Volume Icon / Bar */}
            <div className="flex items-center gap-2 group/volume relative">
              <button onClick={toggleMute} className="hover:text-primary transition-colors">
                {isMuted ? (
                  <svg width="18" height="18" viewBox="0 0 48 48" fill="currentColor">
                    <path d="M24 10.5V37.5L15 28.5H10.5V19.5H15L24 10.5ZM32.7 15.3L30.6 17.4C32.1 19 33 21.3 33 24C33 26.7 32.1 29 30.6 30.6L32.7 32.7C34.7 30.7 36 27.5 36 24C36 20.5 34.7 17.3 32.7 15.3Z" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 48 48" fill="currentColor">
                    <path d="M24 6V42L15 33H9V15H15L24 6ZM30 24C30 18.9 27.6 14.4 24 12V36C27.6 33.6 30 29.1 30 24ZM39 24C39 33 33.6 40.5 27 42.9V39.8C31.8 37.5 35 32.7 35 24C35 15.3 31.8 10.5 27 8.2V5.1C33.6 7.5 39 15 39 24Z" />
                  </svg>
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="hidden w-16 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none sm:block"
              />
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: INFO & COMMENTS */}
      <div className="flex w-full shrink-0 flex-col border-t border-divider bg-bg-primary lg:h-full lg:w-[450px] lg:border-l lg:border-t-0">
        
        {/* Header Block: User Info */}
        <div className="border-b border-divider p-4 sm:p-5 lg:p-6">
          <div className="flex items-center gap-3">
            <img
              onClick={() => navigate(`/@${video.author.username}`)}
              src={video.author.avatarUrl || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300'}
              alt={video.author.username}
              className="w-10 h-10 rounded-full object-cover border border-border cursor-pointer"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 cursor-pointer" onClick={() => navigate(`/@${video.author.username}`)}>
                <span className="text-sm font-bold text-text-primary hover:underline truncate">{video.author.username}</span>
                {video.author.isVerified && (
                  <svg width="14" height="14" viewBox="0 0 48 48" fill="none">
                    <circle cx="24" cy="24" r="20" fill="#20D5EC" />
                    <path d="M16 24L22 30L32 18" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <p className="text-xs text-text-secondary truncate">{video.author.displayName}</p>
            </div>
            {video.author.id !== user?.id && (
              <button className="shrink-0 rounded bg-primary px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-primary-hover sm:px-5 sm:py-1 sm:text-sm">
                Follow
              </button>
            )}
          </div>

          {/* Description & Hashtags */}
          <div className="mt-4">
            <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">{video.title}</p>
            {video.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-2">
                {video.hashtags.map((tag) => (
                  <span key={tag.id} className="text-sm font-bold text-primary cursor-pointer hover:underline">
                    #{tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Sound detail */}
          {video.sound && (
            <div className="flex items-center gap-2 mt-4 text-xs font-semibold text-text-primary hover:underline cursor-pointer bg-bg-secondary p-2 rounded-md border border-border/10">
              <svg width="14" height="14" viewBox="0 0 48 48" fill="none" className="animate-spin-slow text-text-primary">
                <path d="M24 44C35.0457 44 44 35.0457 44 24C44 12.9543 35.0457 4 24 4C12.9543 4 4 12.9543 4 24C4 35.0457 12.9543 44 24 44Z" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
                <path d="M24 30C27.3137 30 30 27.3137 30 24C30 20.6863 27.3137 18 24 18C20.6863 18 18 20.6863 18 24C18 27.3137 20.6863 30 24 30Z" fill="currentColor" />
              </svg>
              <span>{t('video.sound')} - {video.sound.name}</span>
            </div>
          )}
        </div>

        {/* Stats & Actions Row */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-divider bg-bg-secondary px-3 py-2.5 sm:px-5 lg:static lg:px-6 lg:py-3">
          <div className="flex flex-1 items-center justify-around gap-2 sm:justify-start sm:gap-6">
            {/* Like */}
            <button
              onClick={() => {
                if (!user) {
                  openModal('login');
                  return;
                }
                likeMutation.mutate();
              }}
              className="flex items-center gap-2"
            >
              <div className={`p-2 rounded-full transition-transform active:scale-95 ${
                video.isLiked ? 'text-primary bg-primary/10' : 'text-text-primary hover:bg-bg-hover'
              }`}>
                {video.isLiked ? (
                  <svg width="20" height="20" viewBox="0 0 48 48" fill="currentColor">
                    <path d="M24 9.17157L21.4142 11.7574C13.8822 19.2893 11 22.1818 11 27C11 34.1797 16.8203 40 24 40C31.1797 40 37 34.1797 37 27C37 22.1818 34.1178 19.2893 26.5858 11.7574L24 9.17157Z" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
                    <path d="M15 8C8.92487 8 4 12.9249 4 19C4 30 17 40 24 42.3262C31 40 44 30 44 19C44 12.9249 39.0751 8 33 8C29.2797 8 25.9907 9.8469 24 12.6738C22.0093 9.8469 18.7203 8 15 8Z" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span className="text-xs font-bold text-text-primary">{video.likeCount}</span>
            </button>

            {/* Comments count display */}
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full text-text-primary bg-transparent">
                <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
                  <path d="M8 10C8 7.79086 9.79086 6 12 6H36C38.2091 6 40 7.79086 40 10V30C40 32.2091 38.2091 34 36 34H18.8284L12.4142 40.4142C11.7843 41.0441 10.7 40.5977 10.7 39.7071V34H12H12H36C37.1046 34 38 33.1046 38 32V10C38 8.89543 37.1046 8 36 8H12C10.8954 8 10 8.89543 10 10V32C10 32.5523 9.55228 33 9 33C8.44772 33 8 32.5523 8 32V10Z" fill="currentColor" />
                </svg>
              </div>
              <span className="text-xs font-bold text-text-primary">{video.commentCount}</span>
            </div>

            {/* Bookmark */}
            <button
              onClick={() => {
                if (!user) {
                  openModal('login');
                  return;
                }
                bookmarkMutation.mutate();
              }}
              className="flex items-center gap-2"
            >
              <div className={`p-2 rounded-full transition-transform active:scale-95 ${
                video.isBookmarked ? 'text-[#F5A623] bg-orange-100/10' : 'text-text-primary hover:bg-bg-hover'
              }`}>
                {video.isBookmarked ? (
                  <svg width="20" height="20" viewBox="0 0 48 48" fill="currentColor">
                    <path d="M10 6C10 4.89543 10.8954 4 12 4H36C37.1046 4 38 4.89543 38 6V44L24 34L10 44V6Z" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
                    <path d="M10 6C10 4.89543 10.8954 4 12 4H36C37.1046 4 38 4.89543 38 6V44L24 34L10 44V6Z" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span className="text-xs font-bold text-text-primary">{t('video.save')}</span>
            </button>
          </div>

          {/* Share */}
          <button
            onClick={handleCopyLink}
            className="p-2 rounded-full text-text-primary hover:bg-bg-hover transition-colors"
            title={t('video.copyLinkTitle')}
          >
            <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
              <path d="M28 6L42 20L28 34" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M6 42C6 30 18 20 28 20" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Scrollable Comments area */}
        <div className="max-h-[55svh] flex-1 space-y-6 overflow-y-auto px-4 py-4 sm:px-5 lg:max-h-none lg:px-6">
          {isCommentsLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center text-text-tertiary">
              <p className="text-sm font-semibold mb-1">{t('video.noComments')}</p>
              <p className="text-xs">{t('video.firstComment')}</p>
            </div>
          ) : (
            comments.map((comment) => (
              <CommentThread
                key={comment.id}
                comment={comment}
                onReply={handleReplyClick}
              />
            ))
          )}
        </div>

        {/* Comment input panel (Fixed bottom) */}
        <div className="sticky bottom-0 z-20 border-t border-divider bg-bg-primary p-3 sm:p-4 lg:static">
          {/* Reply alert */}
          {replyToComment && (() => {
            const replyUser = replyToComment.author || replyToComment.user;
            return (
              <div className="flex items-center justify-between px-3 py-1.5 bg-bg-secondary rounded-lg mb-2 text-xs text-text-secondary">
                <span>{t('video.replyingTo')} @{replyUser?.username || 'user'}</span>
                <button onClick={() => setReplyToComment(null)} className="text-text-tertiary hover:text-text-primary">
                  <svg width="14" height="14" viewBox="0 0 48 48" fill="none">
                    <path d="M14 14L34 34" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M14 34L34 14" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            );
          })()}

          <form onSubmit={handleCommentSubmit} className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              placeholder={replyToComment ? `${t('common.reply')} @${(replyToComment.author || replyToComment.user)?.username || 'user'}...` : t('video.addComment')}
              className="min-w-0 flex-1 bg-bg-secondary text-text-primary border border-border/30 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors sm:px-4"
            />
            <button
              type="submit"
              disabled={postCommentMutation.isPending || !commentContent.trim()}
              className="shrink-0 rounded-lg bg-primary px-3 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary-hover disabled:opacity-50 sm:px-5"
            >
              {postCommentMutation.isPending ? t('common.loading') : t('common.post')}
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
