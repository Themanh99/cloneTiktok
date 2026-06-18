import { Link, useNavigate } from 'react-router-dom';
import { routes } from '@/config';
import { useAuthStore, useAuthModalStore } from '@/stores';
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from '@/i18n';
import { useQuery } from '@tanstack/react-query';
import {
  RiseOutlined,
  SearchOutlined,
  UserOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import type { SearchResponse } from '@/types/search';
import * as http from '@/lib/http';

// ===== Header Icons =====

const LogoIcon = () => (
  <svg height="36" width="30" viewBox="0 0 28 42" fill="none" aria-hidden="true">
    <path d="M9.87537 16.842V15.7233C9.49211 15.6721 9.10246 15.6401 8.70003 15.6401C3.90288 15.6338 0 19.5399 0 24.3475C0 27.2947 1.46917 29.9031 3.71764 31.4822C2.26763 29.9287 1.37974 27.8381 1.37974 25.5494C1.37974 20.8121 5.17403 16.9507 9.87537 16.842Z" fill="#25F4EE" />
    <path d="M10.0862 29.5259C12.2261 29.5259 13.9763 27.819 14.053 25.6965L14.0594 6.72822H17.5215C17.4512 6.33824 17.4129 5.93548 17.4129 5.52632H12.686L12.6796 24.4946C12.603 26.6171 10.8527 28.324 8.71286 28.324C8.04854 28.324 7.42255 28.1578 6.86682 27.8637C7.58224 28.8674 8.75758 29.5259 10.0862 29.5259Z" fill="#25F4EE" />
    <path d="M23.9923 13.166V12.1112C22.6701 12.1112 21.4436 11.7212 20.4088 11.0435C21.3286 12.0984 22.5742 12.8656 23.9923 13.166Z" fill="#25F4EE" />
    <path d="M20.4088 11.0435C19.3995 9.88639 18.7927 8.37762 18.7927 6.72821H17.528C17.8537 8.53106 18.9269 10.0782 20.4088 11.0435Z" fill="#FE2C55" />
    <path d="M8.70642 20.3646C6.51544 20.3646 4.73328 22.1483 4.73328 24.3411C4.73328 25.8691 5.602 27.1988 6.86676 27.8637C6.39408 27.2116 6.11302 26.4125 6.11302 25.543C6.11302 23.3502 7.89518 21.5665 10.0862 21.5665C10.495 21.5665 10.891 21.6368 11.2615 21.7519V16.9188C10.8782 16.8676 10.4886 16.8356 10.0862 16.8356C10.0159 16.8356 9.95202 16.842 9.88175 16.842V20.55C9.50488 20.4349 9.11523 20.3646 8.70642 20.3646Z" fill="#FE2C55" />
    <path d="M23.9921 13.166V16.842C21.5392 16.842 19.2652 16.0557 17.4127 14.7259V24.3475C17.4127 29.1487 13.5099 33.0613 8.70631 33.0613C6.85388 33.0613 5.12921 32.4731 3.71753 31.4822C5.30806 33.1891 7.57569 34.2632 10.0861 34.2632C14.8832 34.2632 18.7925 30.357 18.7925 25.5494V15.9278C20.6449 17.2576 22.9189 18.0439 25.3718 18.0439V13.3131C24.8927 13.3131 24.4328 13.2619 23.9921 13.166Z" fill="#FE2C55" />
    <path d="M17.4127 24.3475V14.7259C19.2652 16.0557 21.5392 16.842 23.9921 16.842V13.166C22.574 12.8656 21.3284 12.0984 20.4086 11.0435C18.9266 10.0782 17.8599 8.53106 17.5213 6.72821H14.0592L14.0528 25.6964C13.9762 27.8189 12.2259 29.5259 10.0861 29.5259C8.75742 29.5259 7.58847 28.8674 6.86028 27.8701C5.59551 27.1988 4.72679 25.8755 4.72679 24.3475C4.72679 22.1547 6.50895 20.371 8.69993 20.371C9.10874 20.371 9.50478 20.4413 9.87527 20.5564V16.8484C5.17393 16.9507 1.37964 20.8121 1.37964 25.5494C1.37964 27.8381 2.26753 29.9223 3.71753 31.4822C5.12921 32.4731 6.85389 33.0613 8.70632 33.0613C13.5035 33.0613 17.4127 29.1487 17.4127 24.3475Z" fill="currentColor" />
  </svg>
);

const UploadIcon = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" fill="currentColor">
    <path fillRule="evenodd" clipRule="evenodd" d="M24 10C24.5523 10 25 10.4477 25 11V23H37C37.5523 23 38 23.4477 38 24C38 24.5523 37.5523 25 37 25H25V37C25 37.5523 24.5523 38 24 38C23.4477 38 23 37.5523 23 37V25H11C10.4477 25 10 24.5523 10 24C10 23.4477 10.4477 23 11 23H23V11C23 10.4477 23.4477 10 24 10Z" />
  </svg>
);

const MessageIcon = () => (
  <svg width="26" height="26" viewBox="0 0 48 48" fill="currentColor">
    <path d="M24 6C13.5 6 5 13.2 5 22.1C5 27 7.5 31.4 11.5 34.3L9 41.5C8.8 42.1 9.4 42.6 10 42.2L18.5 37.5C20.3 38 22.1 38.2 24 38.2C34.5 38.2 43 31 43 22.1C43 13.2 34.5 6 24 6Z" fillRule="evenodd" clipRule="evenodd"/>
  </svg>
);

const InboxIcon = () => (
  <svg width="26" height="26" viewBox="0 0 48 48" fill="currentColor">
    <path d="M8.5 10.5C8.5 9.4 9.4 8.5 10.5 8.5H37.5C38.6 8.5 39.5 9.4 39.5 10.5V26.5H31.5C30.1 26.5 29 27.6 29 29C29 30.4 27.9 31.5 26.5 31.5H21.5C20.1 31.5 19 30.4 19 29C19 27.6 17.9 26.5 16.5 26.5H8.5V10.5ZM8.5 29.5V37.5C8.5 38.6 9.4 39.5 10.5 39.5H37.5C38.6 39.5 39.5 38.6 39.5 37.5V29.5H32.5C32.5 33 29.7 34.5 26.5 34.5H21.5C18.3 34.5 15.5 33 15.5 29.5H8.5Z" />
  </svg>
);

const OptionsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" fill="currentColor">
    <path d="M24 16C25.1 16 26 15.1 26 14C26 12.9 25.1 12 24 12C22.9 12 22 12.9 22 14C22 15.1 22.9 16 24 16ZM24 26C25.1 26 26 25.1 26 24C26 22.9 25.1 22 24 22C22.9 22 22 22.9 22 24C22 25.1 22.9 26 24 26ZM24 36C25.1 36 26 35.1 26 34C26 32.9 25.1 32 24 32C22.9 32 22 32.9 22 34C22 35.1 22.9 36 24 36Z" />
  </svg>
);

export default function Header() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const openModal = useAuthModalStore((s) => s.openModal);
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLFormElement>(null);
  const { t } = useTranslation();
  const debouncedSearch = useDebouncedValue(searchValue.trim(), 300);
  const searchQuery = useQuery<SearchResponse>({
    queryKey: ['search', 'quick', debouncedSearch],
    queryFn: ({ signal }) =>
      http.get('/search', {
        params: { q: debouncedSearch, limit: 5 },
        signal,
      }),
    enabled: debouncedSearch.length > 0,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      setShowSearchResults(false);
      navigate(`/search?q=${encodeURIComponent(searchValue.trim())}`);
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 h-[60px] bg-bg-primary border-b border-border flex items-center justify-between px-6 z-40">
      {/* Left: Logo */}
      <Link to="/" className="flex items-center gap-1.5 cursor-pointer text-text-primary">
        <LogoIcon />
        <span className="text-xl font-bold tracking-tight hidden sm:inline">TikTok</span>
      </Link>

      {/* Center: Search Bar */}
      <form ref={searchRef} onSubmit={handleSearch} className="hidden md:flex relative w-[360px] lg:w-[500px]">
        <input
          type="text"
          placeholder={t('header.searchPlaceholder')}
          value={searchValue}
          onFocus={() => setShowSearchResults(true)}
          onChange={(e) => {
            setSearchValue(e.target.value);
            setShowSearchResults(true);
          }}
          className="w-full h-[40px] pl-4 pr-12 rounded-full bg-bg-secondary text-sm text-text-primary placeholder:text-text-placeholder outline-none border border-transparent transition-all hover:border-border-hover focus:bg-bg-primary focus:border-border-hover"
        />
        <div className="absolute right-12 top-1/2 -translate-y-1/2 w-[1px] h-[18px] bg-divider" />
        <button
          type="submit"
          className="absolute right-0 top-0 bottom-0 px-4 flex items-center justify-center rounded-r-full text-text-tertiary hover:bg-bg-hover hover:text-text-primary transition-colors"
        >
          <SearchOutlined className="text-lg" />
        </button>

        {showSearchResults && debouncedSearch && (
          <div className="absolute left-0 right-0 top-[46px] max-h-[520px] overflow-y-auto rounded-xl border border-border bg-bg-primary p-2 shadow-2xl">
            {searchQuery.isFetching ? (
              <div className="flex items-center gap-3 px-4 py-5 text-sm text-text-secondary">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                {t('common.loading')}
              </div>
            ) : searchQuery.data &&
              searchQuery.data.users.length + searchQuery.data.videos.length > 0 ? (
              <>
                <button
                  type="submit"
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left font-bold hover:bg-bg-hover"
                >
                  <RiseOutlined className="text-primary" />
                  {searchValue.trim()}
                </button>
                {searchQuery.data.users.map((account) => (
                  <button
                    type="button"
                    key={account.id}
                    onClick={() => {
                      setShowSearchResults(false);
                      navigate(`/@${account.username}`);
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-bg-hover"
                  >
                    {account.avatarUrl ? (
                      <img src={account.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
                    ) : (
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-bg-tertiary">
                        <UserOutlined />
                      </span>
                    )}
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold">{account.username}</span>
                      <span className="block truncate text-xs text-text-secondary">{account.displayName}</span>
                    </span>
                  </button>
                ))}
                {searchQuery.data.videos.slice(0, 3).map((video) => (
                  <button
                    type="button"
                    key={video.id}
                    onClick={() => {
                      setShowSearchResults(false);
                      navigate(`/video/${video.id}`);
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-bg-hover"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-bg-tertiary">
                      <VideoCameraOutlined />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{video.title}</span>
                      <span className="block truncate text-xs text-text-secondary">@{video.author.username}</span>
                    </span>
                  </button>
                ))}
              </>
            ) : (
              <p className="px-4 py-6 text-center text-sm text-text-secondary">{t('search.empty')}</p>
            )}
          </div>
        )}
      </form>

      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        {user ? (
          <>
            {/* Upload Button */}
            <Link
              to={routes.upload}
              className="flex items-center gap-2 px-4 py-1.5 rounded-sm border border-border bg-bg-primary hover:bg-bg-secondary text-text-primary font-semibold text-sm transition-colors"
            >
              <UploadIcon />
              <span>{t('header.upload')}</span>
            </Link>

            {/* Message/Inbox Icons */}
            <button className="text-text-primary hover:text-primary transition-colors p-1.5 rounded-full hover:bg-bg-hover relative">
              <MessageIcon />
            </button>
            <button className="text-text-primary hover:text-primary transition-colors p-1.5 rounded-full hover:bg-bg-hover relative">
              <InboxIcon />
              <span className="absolute top-1 right-1 bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none scale-75">
                8
              </span>
            </button>

            {/* Avatar & User Menu */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-8 h-8 rounded-full overflow-hidden border border-border hover:shadow-md transition-shadow cursor-pointer"
              >
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-bg-tertiary flex items-center justify-center text-text-secondary font-bold text-sm">
                    {user.username[0].toUpperCase()}
                  </div>
                )}
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-bg-primary rounded-lg shadow-xl border border-border py-1.5 animate-fade-in z-50">
                  <Link
                    to={`/@${user.username}`}
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-3 px-4 py-2 hover:bg-bg-hover text-sm text-text-primary font-semibold"
                  >
                    {t('header.profile')}
                  </Link>
                  <button
                    onClick={async () => {
                      await logout();
                      setShowUserMenu(false);
                      navigate(routes.home, { replace: true });
                    }}
                    className="w-full text-left flex items-center gap-3 px-4 py-2 hover:bg-bg-hover text-sm text-primary font-semibold border-t border-divider"
                  >
                    {t('header.logout')}
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Guest Actions */}
            <Link
              to={routes.upload}
              className="flex items-center gap-2 px-4 py-1.5 rounded-sm border border-border bg-bg-primary hover:bg-bg-secondary text-text-primary font-semibold text-sm transition-colors"
            >
              <UploadIcon />
              <span>{t('header.upload')}</span>
            </Link>
            <button
              onClick={() => openModal('login')}
              className="px-5 py-1.5 rounded-md bg-primary hover:bg-primary-hover text-white font-bold text-sm shadow-sm transition-colors"
            >
              {t('header.login')}
            </button>
            <button className="text-text-primary hover:bg-bg-hover p-1.5 rounded-full transition-colors">
              <OptionsIcon />
            </button>
          </>
        )}
      </div>
    </header>
  );
}
