import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  FireOutlined,
  PictureOutlined,
  SearchOutlined,
  UserOutlined,
  VideoCameraAddOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import type { ComponentType } from 'react';
import { Empty, Spin } from 'antd';
import { useTranslation } from '@/i18n';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import type { SearchResponse } from '@/types/search';
import * as http from '@/lib/http';

type SearchTab = 'top' | 'users' | 'videos' | 'live' | 'images';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get('q') ?? '';
  const [inputValue, setInputValue] = useState(urlQuery);
  const [activeTab, setActiveTab] = useState<SearchTab>('top');
  const debouncedQuery = useDebouncedValue(inputValue.trim(), 350);
  const { t } = useTranslation();

  useEffect(() => {
    // Keep the page input in sync when navigation changes only the q parameter.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setInputValue(urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    setSearchParams(debouncedQuery ? { q: debouncedQuery } : {}, { replace: true });
  }, [debouncedQuery, setSearchParams]);

  const searchQuery = useQuery<SearchResponse>({
    queryKey: ['search', 'page', debouncedQuery],
    queryFn: ({ signal }) =>
      http.get('/search', {
        params: { q: debouncedQuery, limit: 20 },
        signal,
      }),
    enabled: debouncedQuery.length > 0,
  });

  const users = searchQuery.data?.users ?? [];
  const videos = searchQuery.data?.videos ?? [];
  const showUsers = activeTab === 'top' || activeTab === 'users';
  const showVideos = activeTab === 'top' || activeTab === 'videos';

  const tabs: Array<{ id: SearchTab; label: string; icon: ComponentType }> = [
    { id: 'top', label: t('search.top'), icon: FireOutlined },
    { id: 'users', label: t('search.accounts'), icon: UserOutlined },
    { id: 'videos', label: t('search.videos'), icon: VideoCameraOutlined },
    { id: 'live', label: 'LIVE', icon: VideoCameraAddOutlined },
    { id: 'images', label: t('search.images'), icon: PictureOutlined },
  ];

  return (
    <div className="mx-auto max-w-[1120px] animate-fade-in pb-6 sm:pb-12">
      <div className="sticky top-[60px] z-20 -mx-2 bg-bg-primary/95 px-2 pb-3 pt-2 backdrop-blur">
        <h1 className="mb-3 text-xl font-black sm:mb-4 sm:text-2xl">{t('search.title')}</h1>
        <div className="relative">
          <SearchOutlined className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-text-tertiary" />
          <input
            autoFocus
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            placeholder={t('header.searchPlaceholder')}
            className="h-12 w-full rounded-full border border-border bg-bg-secondary pl-12 pr-12 text-base outline-none focus:border-primary focus:bg-bg-primary"
          />
          {searchQuery.isFetching && (
            <Spin size="small" className="absolute right-5 top-1/2 -translate-y-1/2" />
          )}
        </div>

        <div className="mt-5 flex gap-3 overflow-x-auto border-b border-divider">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex min-w-fit items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition-colors ${
                activeTab === id
                  ? 'border-text-primary text-text-primary'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              <Icon />
              {label}
            </button>
          ))}
        </div>
      </div>

      {!debouncedQuery ? (
        <p className="py-20 text-center text-text-secondary">{t('search.hint')}</p>
      ) : activeTab === 'live' || activeTab === 'images' ? (
        <p className="py-20 text-center text-text-secondary">{t('misc.comingSoon')}</p>
      ) : users.length === 0 && videos.length === 0 && !searchQuery.isFetching ? (
        <Empty className="py-20" description={t('search.empty')} />
      ) : (
        <div className="space-y-10 pt-6">
          {showUsers && users.length > 0 && (
            <section>
              <h2 className="mb-4 text-lg font-bold">{t('search.accounts')}</h2>
              <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
                {users.map((account) => (
                  <Link
                    key={account.id}
                    to={`/@${account.username}`}
                    className="flex items-center gap-3 rounded-xl border border-border p-4 hover:bg-bg-hover"
                  >
                    <div className="h-12 w-12 overflow-hidden rounded-full bg-bg-tertiary">
                      {account.avatarUrl ? (
                        <img src={account.avatarUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="flex h-full items-center justify-center font-bold">
                          {account.username[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-bold">{account.username}</p>
                      <p className="truncate text-sm text-text-secondary">
                        {account.displayName} · {account.followerCount ?? 0} {t('profile.followers')}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {showVideos && videos.length > 0 && (
            <section>
              <h2 className="mb-4 text-lg font-bold">{t('search.videos')}</h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
                {videos.map((video) => (
                  <Link key={video.id} to={`/video/${video.id}`} className="group">
                    <div className="aspect-[9/16] overflow-hidden rounded-xl bg-black">
                      <video
                        src={video.originalUrl}
                        poster={video.coverUrl || video.thumbnailUrl || undefined}
                        muted
                        preload="metadata"
                        className="h-full w-full object-cover transition-transform group-hover:scale-[1.03]"
                      />
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm font-semibold">{video.title}</p>
                    <p className="text-xs text-text-secondary">
                      @{video.author.username} · {video.viewCount} views
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
