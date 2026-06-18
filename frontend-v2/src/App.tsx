import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/lib/query-client';
import { routes } from '@/config';

// Layouts
import MainLayout from '@/layouts/MainLayout';

// Pages
import HomePage from '@/pages/Home';
import FollowingPage from '@/pages/Following';
import ExplorePage from '@/pages/Explore';
import LivePage from '@/pages/Live';
import UploadPage from '@/pages/Upload';
import SearchPage from '@/pages/Search';
import ProfilePage from '@/pages/Profile';
import VideoPage from '@/pages/Video';

// Components
import LoginModal from '@/components/LoginModal';

import { useEffect } from 'react';
import { useThemeStore } from '@/stores';

export default function App() {
  const initTheme = useThemeStore((s) => s.initTheme);

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  return (

    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path={routes.home} element={<HomePage />} />
            <Route path={routes.following} element={<FollowingPage />} />
            <Route path={routes.explore} element={<ExplorePage />} />
            <Route path={routes.live} element={<LivePage />} />
            <Route path={routes.upload} element={<UploadPage />} />
            <Route path={routes.search} element={<SearchPage />} />
            <Route path={routes.profile} element={<ProfilePage />} />
            <Route path={routes.video} element={<VideoPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <LoginModal />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
