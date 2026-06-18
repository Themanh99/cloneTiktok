import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore, useAuthModalStore } from '@/stores';
import * as http from '@/lib/http';

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

interface CommentUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  isVerified: boolean;
}
interface CommentItem {
  id: string;
  content: string;
  createdAt: string;
  likeCount: number;
  isLiked: boolean;
  user?: CommentUser;
  author?: CommentUser;
  replyCount: number;
  parentId: string | null;
}

export default function VideoPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const user = useAuthStore((s) => s.user);
  const openModal = useAuthModalStore((s) => s.openModal);

  // States
  const [commentContent, setCommentContent] = useState('');
  const [replyToComment, setReplyToComment] = useState<CommentItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [expandedCommentReplies, setExpandedCommentReplies] = useState<Record<string, CommentItem[]>>({});
  const [loadingReplies, setLoadingReplies] = useState<Record<string, boolean>>({});

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
      queryClient.invalidateQueries({ queryKey: ['video', uuid] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Không thể gửi bình luận');
    },
  });

  // Fetch Replies for a comment
  const fetchReplies = async (commentId: string) => {
    setLoadingReplies((prev) => ({ ...prev, [commentId]: true }));
    try {
      const res = await http.get<{ data: CommentItem[] }>(`/comments/${commentId}/replies`);
      setExpandedCommentReplies((prev) => ({
        ...prev,
        [commentId]: res.data || [],
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingReplies((prev) => ({ ...prev, [commentId]: false }));
    }
  };

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
    alert('Đã sao chép liên kết video!');
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
        <h2 className="text-xl font-bold mb-2">Video không tồn tại</h2>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary-hover transition-colors"
        >
          Về trang chủ
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-bg-primary overflow-hidden animate-fade-in relative z-50">
      
      {/* LEFT COLUMN: VIDEO VIEW */}
      <div className="relative flex-[1.5] bg-black flex items-center justify-center select-none group/video">
        
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
          className="absolute top-5 left-5 p-2 bg-black/45 hover:bg-black/60 rounded-full text-white cursor-pointer transition-colors z-30 shadow-md"
        >
          <svg width="24" height="24" viewBox="0 0 48 48" fill="none">
            <path d="M14 14L34 34" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M14 34L34 14" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Video Player Box */}
        <div className="relative aspect-[9/16] h-[90vh] max-h-[800px] rounded-lg overflow-hidden bg-black shadow-2xl flex items-center justify-center">
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
          <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3 bg-black/35 px-4 py-2.5 rounded-lg text-white text-xs backdrop-blur-sm opacity-0 group-hover/video:opacity-100 transition-opacity duration-300">
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

            <span>
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
                className="w-16 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: INFO & COMMENTS */}
      <div className="w-[450px] border-l border-divider bg-bg-primary flex flex-col h-full shrink-0">
        
        {/* Header Block: User Info */}
        <div className="p-6 border-b border-divider">
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
              <button className="px-5 py-1 text-sm bg-primary text-white font-bold rounded hover:bg-primary-hover transition-colors shadow-sm">
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
              <span>nhạc nền - {video.sound.name}</span>
            </div>
          )}
        </div>

        {/* Stats & Actions Row */}
        <div className="px-6 py-3 border-b border-divider flex items-center justify-between bg-bg-secondary">
          <div className="flex gap-6">
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
              <span className="text-xs font-bold text-text-primary">Lưu</span>
            </button>
          </div>

          {/* Share */}
          <button
            onClick={handleCopyLink}
            className="p-2 rounded-full text-text-primary hover:bg-bg-hover transition-colors"
            title="Sao chép liên kết"
          >
            <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
              <path d="M28 6L42 20L28 34" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M6 42C6 30 18 20 28 20" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Scrollable Comments area */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {isCommentsLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center text-text-tertiary">
              <p className="text-sm font-semibold mb-1">Chưa có bình luận nào</p>
              <p className="text-xs">Hãy là người đầu tiên bình luận về video này!</p>
            </div>
          ) : (
            comments.map((comment) => {
              const commentUser = comment.author || comment.user || {
                username: 'user',
                displayName: 'Người dùng',
                avatarUrl: null,
                isVerified: false,
              };
              return (
                <div key={comment.id} className="space-y-4">
                  
                  {/* Root Comment Card */}
                  <div className="flex gap-3 items-start group">
                    <img
                      onClick={() => navigate(`/@${commentUser.username}`)}
                      src={commentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                      className="w-8 h-8 rounded-full object-cover cursor-pointer border border-border/10"
                      alt={commentUser.username}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span
                          onClick={() => navigate(`/@${commentUser.username}`)}
                          className="text-xs font-bold text-text-primary hover:underline cursor-pointer"
                        >
                          {commentUser.username}
                        </span>
                        {commentUser.isVerified && (
                          <svg width="10" height="10" viewBox="0 0 48 48" fill="none">
                            <circle cx="24" cy="24" r="20" fill="#20D5EC" />
                            <path d="M16 24L22 30L32 18" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      <p className="text-sm text-text-primary mt-1 leading-normal whitespace-pre-wrap">{comment.content}</p>
                      
                      {/* Actions row */}
                      <div className="flex items-center gap-4 mt-2 text-xs text-text-tertiary font-semibold">
                        <span>{new Date(comment.createdAt).toLocaleDateString('vi-VN')}</span>
                        <button onClick={() => handleReplyClick(comment)} className="hover:underline">
                          Trả lời
                        </button>
                      </div>
                    </div>

                    {/* Comment Heart button */}
                    <div className="flex flex-col items-center text-text-tertiary hover:text-text-primary cursor-pointer transition-colors">
                      <svg width="16" height="16" viewBox="0 0 48 48" fill="none">
                        <path d="M15 8C8.92487 8 4 12.9249 4 19C4 30 17 40 24 42.3262C31 40 44 30 44 19C44 12.9249 39.0751 8 33 8C29.2797 8 25.9907 9.8469 24 12.6738C22.0093 9.8469 18.7203 8 15 8Z" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="text-[10px] mt-0.5">{comment.likeCount}</span>
                    </div>
                  </div>

                  {/* Indented Replies Section */}
                  <div className="pl-11 space-y-4">
                    {/* Expanded replies */}
                    {expandedCommentReplies[comment.id]?.map((reply) => {
                      const replyUser = reply.author || reply.user || {
                        username: 'user',
                        displayName: 'Người dùng',
                        avatarUrl: null,
                        isVerified: false,
                      };
                      return (
                        <div key={reply.id} className="flex gap-3 items-start">
                          <img
                            onClick={() => navigate(`/@${replyUser.username}`)}
                            src={replyUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                            className="w-6 h-6 rounded-full object-cover cursor-pointer border border-border/10"
                            alt={replyUser.username}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <span
                                onClick={() => navigate(`/@${replyUser.username}`)}
                                className="text-xs font-bold text-text-primary hover:underline cursor-pointer"
                              >
                                {replyUser.username}
                              </span>
                              {replyUser.isVerified && (
                                <svg width="10" height="10" viewBox="0 0 48 48" fill="none">
                                  <circle cx="24" cy="24" r="20" fill="#20D5EC" />
                                  <path d="M16 24L22 30L32 18" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              )}
                            </div>
                            <p className="text-sm text-text-primary mt-1 leading-normal whitespace-pre-wrap">{reply.content}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-text-tertiary font-semibold">
                              <span>{new Date(reply.createdAt).toLocaleDateString('vi-VN')}</span>
                              <button onClick={() => handleReplyClick(comment)} className="hover:underline">
                                Trả lời
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Expand Replies controller */}
                    {comment.replyCount > 0 && !expandedCommentReplies[comment.id] && (
                      <button
                        onClick={() => fetchReplies(comment.id)}
                        disabled={loadingReplies[comment.id]}
                        className="text-xs font-bold text-text-secondary hover:text-text-primary flex items-center gap-1.5 transition-colors"
                      >
                        {loadingReplies[comment.id] ? (
                          <div className="w-3 h-3 border-2 border-text-secondary border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <span className="w-6 h-[1px] bg-text-secondary inline-block mr-1"></span>
                        )}
                        Xem thêm câu trả lời ({comment.replyCount})
                      </button>
                    )}
                  </div>

                </div>
              );
            })
          )}
        </div>

        {/* Comment input panel (Fixed bottom) */}
        <div className="p-4 border-t border-divider bg-bg-primary">
          {/* Reply alert */}
          {replyToComment && (() => {
            const replyUser = replyToComment.author || replyToComment.user;
            return (
              <div className="flex items-center justify-between px-3 py-1.5 bg-bg-secondary rounded-lg mb-2 text-xs text-text-secondary">
                <span>Đang trả lời @{replyUser?.username || 'user'}</span>
                <button onClick={() => setReplyToComment(null)} className="text-text-tertiary hover:text-text-primary">
                  <svg width="14" height="14" viewBox="0 0 48 48" fill="none">
                    <path d="M14 14L34 34" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M14 34L34 14" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            );
          })()}

          <form onSubmit={handleCommentSubmit} className="flex gap-2 items-center">
            <input
              ref={inputRef}
              type="text"
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              placeholder={replyToComment ? `Trả lời @${(replyToComment.author || replyToComment.user)?.username || 'user'}...` : 'Thêm bình luận...'}
              className="flex-1 bg-bg-secondary text-text-primary border border-border/30 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
            />
            <button
              type="submit"
              disabled={postCommentMutation.isPending || !commentContent.trim()}
              className="px-5 py-2.5 bg-primary text-white font-bold rounded-lg text-sm hover:bg-primary-hover disabled:opacity-50 transition-colors shadow-sm"
            >
              {postCommentMutation.isPending ? 'Đang gửi...' : 'Đăng'}
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
