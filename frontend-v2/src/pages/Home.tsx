import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVideoFeed } from '@/hooks/use-videos';
import VideoCard, { VideoData } from '@/components/VideoCard';

// Fallback high-fidelity sample videos to ensure a fully functional app out of the box
const FALLBACK_VIDEOS: VideoData[] = [
  {
    id: "fb-1",
    description: "Khám phá phong cảnh thiên nhiên tuyệt đẹp! 🏔️✨ #nature #adventure #travel #relax",
    file_url: "https://assets.mixkit.co/videos/preview/mixkit-beautiful-mountains-under-fog-during-sunset-41484-large.mp4",
    thumb_url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&auto=format&fit=crop",
    likes_count: 124300,
    comments_count: 890,
    shares_count: 5600,
    music: "Nhạc nền thiên nhiên thư giãn - Mixkit",
    tick: true,
    user: {
      id: "u-1",
      nickname: "nature_explorer",
      first_name: "Nature Explorer",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop",
      is_followed: false
    }
  },
  {
    id: "fb-2",
    description: "Công thức làm sinh tố trái cây siêu thơm ngon bổ dưỡng cho mùa hè 🍓🍌 #cooking #healthy #smoothie",
    file_url: "https://assets.mixkit.co/videos/preview/mixkit-making-a-freshly-prepared-fruit-smoothie-42998-large.mp4",
    thumb_url: "https://images.unsplash.com/photo-1553530979-7ee52a2670c4?w=600&auto=format&fit=crop",
    likes_count: 85200,
    comments_count: 432,
    shares_count: 2100,
    music: "Cooking vibes - Chill Lofi Beat",
    tick: false,
    user: {
      id: "u-2",
      nickname: "healthy_chef",
      first_name: "Healthy Chef",
      avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&auto=format&fit=crop",
      is_followed: true
    }
  },
  {
    id: "fb-3",
    description: "Đường phố Tokyo nhộn nhịp về đêm trong mưa lấp lánh ánh đèn neon 🌧️🗼 #tokyo #japan #cyberpunk #neon",
    file_url: "https://assets.mixkit.co/videos/preview/mixkit-rainy-night-in-a-busy-neon-lit-tokyo-street-43844-large.mp4",
    thumb_url: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=600&auto=format&fit=crop",
    likes_count: 342000,
    comments_count: 1845,
    shares_count: 14200,
    music: "Tokyo Drift Rain Lofi Remix",
    tick: true,
    user: {
      id: "u-3",
      nickname: "tokyo_dreamer",
      first_name: "Tokyo Dreamer",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop",
      is_followed: false
    }
  }
];

export default function HomePage() {
  const navigate = useNavigate();
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useVideoFeed('for-you');
  const [activeId, setActiveId] = useState<string | null>(null);
  
  const observerRef = useRef<IntersectionObserver | null>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Flatten the paginated data
  const backendVideos = data?.pages.flatMap((page) => page.data) || [];
  
  // Map backend model format to VideoData properties used by VideoCard
  const mappedVideos: VideoData[] = backendVideos.map((video) => ({
    id: video.id,
    description: video.title || '',
    file_url: video.hlsUrl || video.originalUrl,
    thumb_url: video.coverUrl || video.thumbnailUrl || '',
    likes_count: video.likeCount || 0,
    comments_count: video.commentCount || 0,
    shares_count: video.shareCount || 0,
    music: video.sound?.name || 'Original sound',
    tick: video.author?.isVerified || false,
    is_liked: video.isLiked || false,
    is_bookmarked: video.isBookmarked || false,
    user: {
      id: video.author?.id || '',
      nickname: video.author?.username || 'user',
      first_name: video.author?.displayName || '',
      avatar: video.author?.avatarUrl,
      is_followed: video.isFollowing || false,
    },
  }));

  // Use fallback if there's no data or during dev
  const videos = mappedVideos.length > 0 ? mappedVideos : FALLBACK_VIDEOS;

  // Set up IntersectionObserver to detect the center card for autoplay
  useEffect(() => {
    if (videos.length === 0) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('data-id');
            if (id) {
              setActiveId(id);
            }
          }
        });
      },
      {
        root: null, // relative to viewport
        rootMargin: '-20% 0px -20% 0px', // center of the screen
        threshold: 0.5, // 50% visibility
      }
    );

    // Observe each card node
    cardRefs.current.forEach((node) => {
      if (node && observerRef.current) {
        observerRef.current.observe(node);
      }
    });

    // Default active id to first video
    if (videos.length > 0 && !activeId) {
      setActiveId(videos[0].id);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [videos, activeId]);

  // Handle infinite scroll bottom check
  useEffect(() => {
    const handleScroll = () => {
      if (isLoading || isFetchingNextPage || !hasNextPage) return;
      
      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = document.documentElement.scrollTop;
      const clientHeight = document.documentElement.clientHeight;
      
      if (scrollHeight - scrollTop - clientHeight < 400) {
        fetchNextPage();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isLoading, isFetchingNextPage, hasNextPage, fetchNextPage]);

  if (isLoading && videos === FALLBACK_VIDEOS) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <span className="text-sm font-semibold text-text-secondary">Đang tải video...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-[730px] mx-auto px-4 pb-20 select-none">
      <div className="flex flex-col">
        {videos.map((video) => (
          <div
            key={video.id}
            data-id={video.id}
            ref={(el) => {
              if (el) {
                cardRefs.current.set(video.id, el);
              } else {
                cardRefs.current.delete(video.id);
              }
            }}
          >
            <VideoCard
              video={video}
              active={activeId === video.id}
              onCommentsClick={() => navigate(`/video/${video.id}`)}
            />
          </div>
        ))}

        {isFetchingNextPage && (
          <div className="flex justify-center py-6">
            <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
