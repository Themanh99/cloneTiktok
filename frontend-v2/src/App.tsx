import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import { routes } from '@/config';
import { lazy, Suspense, useEffect } from 'react';

// Layouts
import MainLayout from '@/layouts/MainLayout';

// Components
import LoginModal from '@/components/LoginModal';
import { PageLoading } from '@/components/common/Feedback';

import { useThemeStore } from '@/stores';
import { useAuthStore } from '@/stores';
import { useLanguageStore } from '@/i18n';
import AntdProvider from '@/providers/AntdProvider';

const HomePage = lazy(() => import('@/pages/Home'));
const FollowingPage = lazy(() => import('@/pages/Following'));
const ExplorePage = lazy(() => import('@/pages/Explore'));
const LivePage = lazy(() => import('@/pages/Live'));
const UploadPage = lazy(() => import('@/pages/Upload'));
const SearchPage = lazy(() => import('@/pages/Search'));
const ProfilePage = lazy(() => import('@/pages/Profile'));
const VideoPage = lazy(() => import('@/pages/Video'));
const ReactQueryDevtools = lazy(() =>
  import('@tanstack/react-query-devtools').then((module) => ({
    default: module.ReactQueryDevtools,
  })),
);

export default function App() {
  const initTheme = useThemeStore((s) => s.initTheme);
  const userLanguage = useAuthStore((s) => s.user?.language?.code);
  const setLanguage = useLanguageStore((s) => s.setLanguage);

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  useEffect(() => {
    if (userLanguage) setLanguage(userLanguage);
  }, [setLanguage, userLanguage]);

  return (

    <AntdProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Suspense fallback={<PageLoading />}>
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
          </Suspense>
        </BrowserRouter>
        <LoginModal />
        {import.meta.env.DEV && (
          <Suspense fallback={null}>
            <ReactQueryDevtools initialIsOpen={false} />
          </Suspense>
        )}
      </QueryClientProvider>
    </AntdProvider>
  );
}
