# 🎨 Phase 7: Frontend — Next.js (Chi tiết từng bước)

> **Thời gian ước tính:** 10-14 ngày (song song với backend Phase 5-6)
> **Mục tiêu:** Web app hoàn chỉnh với custom design, video feed, upload, realtime comments
> **Bắt đầu:** Sau khi backend Phase 4 (Auth + User) hoàn thành

---

## Bước 7.1: Khởi tạo Next.js Project

```bash
cd d:\Code\tiktokweb

# Tạo frontend project
npx -y create-next-app@latest frontend --typescript --app --src-dir --eslint
# Khi hỏi:
# ✔ Would you like to use Tailwind CSS? → No (dùng Vanilla CSS)
# ✔ Would you like to use `src/` directory? → Yes
# ✔ Would you like to customize the default import alias? → Yes → @/*
```

> **Tại sao KHÔNG dùng Tailwind CSS?** Theo quy tắc workspace, dùng Vanilla CSS để có maximum control. Sẽ dùng CSS Modules cho component styling.

### Cài thêm dependencies:

```bash
cd d:\Code\tiktokweb\frontend

# SWR — Data fetching + cache + revalidation
npm install swr
```
> **Tại sao SWR?** Thư viện data fetching của Vercel. Tự động cache, revalidate, retry, dedup requests. Thay vì viết `useEffect + fetch + useState` cho mỗi API call.

```bash
# Zustand — Global state management (auth, player state)
npm install zustand
```
> **Tại sao Zustand?** Nhẹ hơn Redux 50x (1.1KB), không boilerplate, TypeScript native. Dùng cho: auth state (user, tokens), video player state (current video, muted).

```bash
# Socket.io client — Realtime comments
npm install socket.io-client
```
> **Tại sao?** Kết nối WebSocket tới backend NestJS. Nhận comment realtime, notification.

```bash
# HLS.js — Video HLS streaming
npm install hls.js
```
> **Tại sao?** Trình duyệt không hỗ trợ HLS natively (trừ Safari). HLS.js parse file M3U8 và play video adaptive bitrate. Giống cách YouTube/TikTok stream video.

```bash
# date-fns — Format ngày tháng
npm install date-fns
```
> **Tại sao?** Lightweight (tree-shakeable), thay vì moment.js (300KB). Dùng cho "2 giờ trước", "3 ngày trước".

```bash
# js-cookie — Quản lý cookies (lưu tokens)
npm install js-cookie
npm install -D @types/js-cookie
```

---

## Bước 7.2: Cấu trúc thư mục Frontend

```
frontend/src/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home → redirect /foryou
│   ├── globals.css               # Design system + global styles
│   │
│   ├── (auth)/                   # Auth pages (không có sidebar)
│   │   ├── layout.tsx            # Auth layout (centered form)
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   │
│   ├── (main)/                   # Main pages (có sidebar)
│   │   ├── layout.tsx            # Main layout (sidebar + content)
│   │   ├── foryou/page.tsx       # Feed "For You"
│   │   ├── following/page.tsx    # Feed "Following"
│   │   └── explore/page.tsx      # Discover/Search
│   │
│   ├── @[username]/              # Dynamic user profile
│   │   └── page.tsx
│   │
│   ├── video/[id]/               # Video detail (share link)
│   │   └── page.tsx
│   │
│   ├── upload/                   # Upload video
│   │   └── page.tsx
│   │
│   └── settings/                 # User settings
│       └── page.tsx
│
├── components/                   # Reusable components
│   ├── layout/
│   │   ├── Sidebar/
│   │   │   ├── Sidebar.tsx
│   │   │   └── Sidebar.module.css
│   │   ├── Header/
│   │   └── BottomNav/
│   │
│   ├── video/
│   │   ├── VideoPlayer/
│   │   ├── VideoCard/
│   │   ├── VideoFeed/
│   │   ├── VideoActions/
│   │   └── VideoUploader/
│   │
│   ├── comment/
│   │   ├── CommentSection/
│   │   ├── CommentItem/
│   │   └── CommentInput/
│   │
│   ├── user/
│   │   ├── UserAvatar/
│   │   ├── ProfileHeader/
│   │   └── FollowButton/
│   │
│   ├── auth/
│   │   ├── LoginForm/
│   │   ├── RegisterForm/
│   │   └── GoogleLoginButton/
│   │
│   └── ui/                       # Generic UI components
│       ├── Modal/
│       ├── Toast/
│       ├── Skeleton/
│       └── InfiniteScroll/
│
├── hooks/                        # Custom React hooks
│   ├── useAuth.ts                # Auth state + actions
│   ├── useVideo.ts               # Video data fetching
│   ├── useSocket.ts              # Socket.io connection
│   └── useInfiniteScroll.ts      # Scroll detection
│
├── lib/                          # Utilities
│   ├── api.ts                    # Axios/Fetch wrapper
│   ├── socket.ts                 # Socket.io client instance
│   └── utils.ts                  # Helper functions
│
├── stores/                       # Zustand stores
│   ├── auth.store.ts             # User, tokens, login/logout
│   └── player.store.ts           # Current video, muted, volume
│
└── types/                        # TypeScript types
    ├── user.ts
    ├── video.ts
    ├── comment.ts
    └── api.ts
```

---

## Bước 7.3: Design System (globals.css)

```css
/* src/app/globals.css */

/* ============================
   1. CSS Reset & Base
   ============================ */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* ============================
   2. Design Tokens (CSS Variables)
   ============================ */
:root {
  /* Colors — Dark Theme */
  --bg-primary: #121212;
  --bg-secondary: #1e1e1e;
  --bg-elevated: #2a2a2a;
  --bg-hover: #333333;
  --text-primary: #ffffff;
  --text-secondary: #a0a0a0;
  --text-tertiary: #6b6b6b;
  --accent: #fe2c55;
  --accent-hover: #ff4468;
  --accent-light: rgba(254, 44, 85, 0.1);
  --success: #25d366;
  --warning: #ffa726;
  --error: #ef5350;
  --border: #2f2f2f;
  --divider: #1f1f1f;

  /* Typography */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-size-xs: 0.75rem;    /* 12px */
  --font-size-sm: 0.875rem;   /* 14px */
  --font-size-base: 1rem;     /* 16px */
  --font-size-lg: 1.125rem;   /* 18px */
  --font-size-xl: 1.25rem;    /* 20px */
  --font-size-2xl: 1.5rem;    /* 24px */
  --font-size-3xl: 2rem;      /* 32px */

  /* Spacing */
  --space-1: 0.25rem;  /* 4px */
  --space-2: 0.5rem;   /* 8px */
  --space-3: 0.75rem;  /* 12px */
  --space-4: 1rem;     /* 16px */
  --space-5: 1.25rem;  /* 20px */
  --space-6: 1.5rem;   /* 24px */
  --space-8: 2rem;     /* 32px */
  --space-10: 2.5rem;  /* 40px */
  --space-12: 3rem;    /* 48px */

  /* Borders */
  --radius-sm: 0.375rem;  /* 6px */
  --radius-md: 0.5rem;    /* 8px */
  --radius-lg: 0.75rem;   /* 12px */
  --radius-xl: 1rem;      /* 16px */
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.5);

  /* Layout */
  --sidebar-width: 240px;
  --sidebar-collapsed: 72px;
  --header-height: 60px;
  --video-max-width: 480px;

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-base: 250ms ease;
  --transition-slow: 350ms ease;

  /* Z-index */
  --z-dropdown: 100;
  --z-modal: 200;
  --z-toast: 300;
  --z-tooltip: 400;
}

body {
  font-family: var(--font-sans);
  background-color: var(--bg-primary);
  color: var(--text-primary);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

a { color: inherit; text-decoration: none; }

button {
  cursor: pointer;
  border: none;
  background: none;
  font: inherit;
  color: inherit;
}

/* ============================
   3. Utility Classes
   ============================ */
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
}
```

> **Tại sao CSS Variables thay vì hard-code?**
> 1. Thay đổi 1 chỗ → update toàn bộ app
> 2. Dễ thêm light mode sau này (override variables)
> 3. DevTools inspect dễ hiểu hơn `#2a2a2a` vs `var(--bg-elevated)`

---

## Bước 7.4: API Client Setup

### File `src/lib/api.ts`

```typescript
// Wrapper cho fetch — tự động thêm token, handle errors, refresh token

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// Tại sao wrapper thay vì dùng fetch trực tiếp?
// 1. Tự động thêm Authorization header
// 2. Tự động refresh token khi 401
// 3. Tự động parse JSON
// 4. Centralized error handling

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const { getAccessToken, refreshAccessToken, logout } = useAuthStore.getState();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const token = getAccessToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // 401 → thử refresh token
  if (response.status === 401 && token) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
    } else {
      logout();
      throw new Error('Session expired');
    }
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'API Error');
  }

  return data.data as T;
}
```

### File `src/stores/auth.store.ts` (Zustand)

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';

interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;

  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  getAccessToken: () => string | null;
  refreshAccessToken: () => Promise<string | null>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,

      setAuth: (user, accessToken, refreshToken) => {
        set({ user, accessToken, refreshToken });
      },

      logout: () => {
        set({ user: null, accessToken: null, refreshToken: null });
        Cookies.remove('accessToken');
      },

      getAccessToken: () => get().accessToken,

      refreshAccessToken: async () => {
        const { refreshToken } = get();
        if (!refreshToken) return null;

        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });
          const data = await res.json();
          if (res.ok) {
            set({
              accessToken: data.data.accessToken,
              refreshToken: data.data.refreshToken,
            });
            return data.data.accessToken;
          }
        } catch { /* ignore */ }
        return null;
      },
    }),
    {
      name: 'auth-storage', // Key trong localStorage
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    },
  ),
);
```

---

## Bước 7.5: Thứ tự xây dựng Frontend Pages

### Giai đoạn 7A: Auth Pages (2 ngày)
1. **Login page** — Form email/password + Google button
2. **Register page** — Form đăng ký
3. **Auth layout** — Centered, dark, minimal

### Giai đoạn 7B: Layout & Navigation (2 ngày)
1. **Sidebar** — Logo, nav links (For You, Following, Upload), user menu
2. **Header** — Search bar, notifications, user avatar
3. **BottomNav** — Mobile navigation (< 768px)
4. **Main layout** — Sidebar + content area

### Giai đoạn 7C: Video Feed (3 ngày) — CORE UX
1. **VideoPlayer** — HLS.js, play/pause, mute, progress
2. **VideoCard** — Full-screen video + overlay info (author, caption, sound)
3. **VideoActions** — Like, Comment, Share, Bookmark buttons (bên phải)
4. **VideoFeed** — Vertical swipe, infinite scroll, auto-play/pause
5. **InfiniteScroll** — Intersection Observer hook

### Giai đoạn 7D: Profile & Upload (2 ngày)
1. **Profile page** — Header (avatar, stats, follow btn) + video grid
2. **Upload page** — Drag-drop, progress bar, caption + hashtag input
3. **Settings page** — Edit profile form

### Giai đoạn 7E: Comments & Interactions (2 ngày)
1. **CommentSection** — Slide-in panel, Socket.io realtime
2. **CommentItem** — Avatar, content, like, reply
3. **CommentInput** — Input + emoji + @mention
4. **Toast** — Success/error notifications

### Giai đoạn 7F: Polish (2 ngày)
1. **Skeleton loading** — Placeholder UI khi đang fetch
2. **Error states** — 404, network error
3. **Responsive** — Mobile < 768px, Tablet 768-1024, Desktop > 1024
4. **Micro-animations** — Button press, heart fly, slide transitions

---

## Bước 7.6: Key Frontend Patterns

### Pattern 1: Data Fetching với SWR

```typescript
// hooks/useVideo.ts
import useSWR from 'swr';
import { apiClient } from '@/lib/api';

export function useVideoFeed(type: 'feed' | 'following') {
  const { data, error, isLoading, mutate } = useSWR(
    `/videos/${type}`,
    (url) => apiClient(url),
    {
      revalidateOnFocus: false,  // Không refetch khi tab focus lại
      dedupingInterval: 5000,    // Dedup requests trong 5s
    },
  );

  return { videos: data, error, isLoading, refresh: mutate };
}
```

### Pattern 2: Video Player với HLS.js

```typescript
// components/video/VideoPlayer/VideoPlayer.tsx
'use client';
import { useRef, useEffect } from 'react';
import Hls from 'hls.js';

interface Props {
  src: string;       // URL: .m3u8 hoặc .mp4
  poster?: string;   // Thumbnail
  autoPlay?: boolean;
}

export function VideoPlayer({ src, poster, autoPlay }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Nếu là HLS (.m3u8) và browser không hỗ trợ native (Chrome, Firefox)
    if (src.includes('.m3u8') && Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(video);
      return () => hls.destroy();
    }

    // Safari hỗ trợ HLS native, hoặc fallback MP4
    video.src = src;
  }, [src]);

  return (
    <video
      ref={videoRef}
      poster={poster}
      autoPlay={autoPlay}
      loop
      playsInline // Quan trọng cho mobile (không fullscreen tự động)
      muted       // Autoplay chỉ hoạt động khi muted
    />
  );
}
```

### Pattern 3: Socket.io cho Realtime Comments

```typescript
// hooks/useSocket.ts
'use client';
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth.store';

export function useCommentSocket(videoId: string, onNewComment: (comment: any) => void) {
  const socketRef = useRef<Socket | null>(null);
  const { accessToken } = useAuthStore();

  useEffect(() => {
    // Kết nối Socket.io
    const socket = io(`${process.env.NEXT_PUBLIC_API_URL}/comments`, {
      auth: { token: accessToken },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    // Join room
    socket.emit('join_video_room', { videoId });

    // Listen for new comments
    socket.on('new_comment', (comment) => {
      onNewComment(comment);
    });

    return () => {
      socket.emit('leave_video_room', { videoId });
      socket.disconnect();
    };
  }, [videoId, accessToken]);
}
```

---

## Bước 7.7: Environment Variables Frontend

### File `frontend/.env.local`

```env
# API URL (backend)
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Google OAuth Client ID (cho Google Sign-In button)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id

# Socket.io URL
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
```

> **`NEXT_PUBLIC_` prefix:** Biến có prefix này sẽ expose cho browser (client-side). Biến KHÔNG có prefix chỉ dùng ở server-side. KHÔNG đặt secrets trong `NEXT_PUBLIC_`.

### ✅ Output Phase 7:
```
✅ Next.js project với App Router
✅ Design system (CSS Variables, dark theme)
✅ Auth pages (login, register, Google SSO)
✅ Layout (sidebar, header, bottom nav, responsive)
✅ Video feed (vertical swipe, HLS player, infinite scroll)
✅ Video upload (pre-signed URL, progress)
✅ Profile page (stats, video grid)
✅ Comment panel (realtime Socket.io)
✅ Zustand auth store + SWR data fetching
✅ Micro-animations + skeleton loading
```

---

## ⏭️ Tiếp theo: [Phase 8 — Deploy & Optimization](./15-phase8-deploy.md)
