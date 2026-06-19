import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { routes } from '@/config';
import { useAuthStore, useAuthModalStore, useThemeStore } from '@/stores';
import * as http from '@/lib/http';
import Portal from '@/components/Portal';
import { useTranslation, type LanguageCode } from '@/i18n';

// ===== Sidebar Icons =====

const HomeIcon = ({ active }: { active?: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 48 48" fill={active ? '#FE2C55' : 'currentColor'}>
    <path fillRule="evenodd" clipRule="evenodd" d="M24.9505 7.84001C24.3975 7.38666 23.6014 7.38666 23.0485 7.84003L6.94846 21.04C6.53839 21.3744 6.29688 21.8792 6.29688 22.4142V38.4C6.29688 39.5045 7.19231 40.4 8.29688 40.4H18.2969V29.2H29.6969V40.4H39.6969C40.8014 40.4 41.6969 39.5045 41.6969 38.4V22.4142C41.6969 21.8792 41.4553 21.3744 41.0453 21.04L24.9505 7.84001Z" />
  </svg>
);

const ExploreIcon = ({ active }: { active?: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 48 48" fill={active ? '#FE2C55' : 'currentColor'}>
    <path fillRule="evenodd" clipRule="evenodd" d="M24 37.5C31.4558 37.5 37.5 31.4558 37.5 24C37.5 16.5442 31.4558 10.5 24 10.5C16.5442 10.5 10.5 16.5442 10.5 24C10.5 31.4558 16.5442 37.5 24 37.5ZM24 40.5C33.1127 40.5 40.5 33.1127 40.5 24C40.5 14.8873 33.1127 7.5 24 7.5C14.8873 7.5 7.5 14.8873 7.5 24C7.5 33.1127 14.8873 40.5 24 40.5ZM27.3 20.7L30.6 17.4L21.3 27.3L17.4 30.6L27.3 20.7Z" />
  </svg>
);

const FollowingIcon = ({ active }: { active?: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 48 48" fill={active ? '#FE2C55' : 'currentColor'}>
    <path d="M25.5 17C25.5 21.1421 22.1421 24.5 18 24.5C13.8579 24.5 10.5 21.1421 10.5 17C10.5 12.8579 13.8579 9.5 18 9.5C22.1421 9.5 25.5 12.8579 25.5 17Z" />
    <path d="M7.10396 34.7906C8.78769 30.2189 12.8204 27 18.0009 27C23.1818 27 27.2107 30.2226 28.8958 34.7945C29.3075 35.906 28.6603 37 27.5 37H8.5C7.33939 37 6.69289 35.9016 7.10396 34.7906Z" />
    <path d="M33 31.5C33 32.3284 32.3284 33 31.5 33H31V35H31.5C32.3284 35 33 35.6716 33 36.5C33 37.3284 32.3284 38 31.5 38H31C30.6 38 30.3 37.8 30 37.5C29.7 37.8 29.4 38 29 38H28.5C27.6716 38 27 37.3284 27 36.5C27 35.6716 27.6716 35 28.5 35H29V33H28.5C27.6716 33 27 32.3284 27 31.5C27 30.6716 27.6716 30 28.5 30H29V28H28.5C27.6716 28 27 27.3284 27 26.5C27 25.6716 27.6716 25 28.5 25H31.5C32.3284 25 33 25.6716 33 26.5C33 27.3284 32.3284 28 31.5 28H31V30H31.5C32.3284 30 33 30.6716 33 31.5Z" />
    <path d="M37.5 17C37.5 19.4853 35.4853 21.5 33 21.5C30.5147 21.5 28.5 19.4853 28.5 17C28.5 14.5147 30.5147 12.5 33 12.5C35.4853 12.5 37.5 14.5147 37.5 17Z" />
  </svg>
);

const FriendsIcon = ({ active }: { active?: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 48 48" fill={active ? '#FE2C55' : 'currentColor'}>
    <path fillRule="evenodd" clipRule="evenodd" d="M16 12C16 16.4183 19.5817 20 24 20C28.4183 20 32 16.4183 32 12C32 7.58172 28.4183 4 24 4C19.5817 4 16 7.58172 16 12ZM24 23C16.268 23 10 29.268 10 37C10 37.5523 10.4477 38 11 38H37C37.5523 38 38 37.5523 38 37C38 29.268 31.732 23 24 23Z" />
  </svg>
);

const LiveIcon = ({ active }: { active?: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 48 48" fill={active ? '#FE2C55' : 'currentColor'}>
    <path d="M12 28.5C12 30.433 13.567 32 15.5 32H28L36 38V12C36 10.067 34.433 8.5 32.5 8.5H15.5C13.567 8.5 12 10.067 12 12V28.5Z" />
  </svg>
);

const MessagesIcon = ({ active }: { active?: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 48 48" fill={active ? '#FE2C55' : 'currentColor'}>
    <path fillRule="evenodd" clipRule="evenodd" d="M8 10C8 7.79086 9.79086 6 12 6H36C38.2091 6 40 7.79086 40 10V30C40 32.2091 38.2091 34 36 34H18.8284L12.4142 40.4142C11.7843 41.0441 10.7 40.5977 10.7 39.7071V34H12H12H36C37.1046 34 38 33.1046 38 32V10C38 8.89543 37.1046 8 36 8H12C10.8954 8 10 8.89543 10 10V32C10 32.5523 9.55228 33 9 33C8.44772 33 8 32.5523 8 32V10Z" />
  </svg>
);

const ActivityIcon = ({ active }: { active?: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 48 48" fill={active ? '#FE2C55' : 'currentColor'}>
    <path fillRule="evenodd" clipRule="evenodd" d="M24 4C25.1046 4 26 4.89543 26 6V7.17066C32.327 8.16335 37.25 13.5049 37.25 20V29.3562C37.25 31.5721 38.3071 33.6421 40.0988 34.9535C40.9238 35.558 40.5842 36.85 39.5558 36.85H8.44422C7.41584 36.85 7.07624 35.558 7.90123 34.9535C9.6929 33.6421 10.75 31.5721 10.75 29.3562V20C10.75 13.5049 15.673 8.16335 22 7.17066V6C22 4.89543 22.8954 4 24 4ZM20 40H28C28 42.2091 26.2091 44 24 44C21.7909 44 20 42.2091 20 40Z" />
  </svg>
);

const UploadIcon = ({ active }: { active?: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 48 48" fill={active ? '#FE2C55' : 'currentColor'}>
    <path fillRule="evenodd" clipRule="evenodd" d="M24 10C24.5523 10 25 10.4477 25 11V29C25 29.5523 24.5523 30 24 30C23.4477 30 23 29.5523 23 29V11C23 10.4477 23.4477 10 24 10Z" />
    <path fillRule="evenodd" clipRule="evenodd" d="M24 9.17157L18.4142 14.7574C18.0237 15.1479 17.3905 15.1479 17 14.7574C16.6095 14.3668 16.6095 13.7337 17 13.3431L23.2929 7.05025C23.6834 6.65973 24.3166 6.65973 24.7071 7.05025L31 13.3431C31.3905 13.7337 31.3905 14.3668 31 14.7574C30.6095 15.1479 29.9763 15.1479 29.5858 14.7574L24 9.17157Z" />
    <path d="M10 36C10 34.8954 10.8954 34 12 34H36C37.1046 34 38 34.8954 38 36C38 37.1046 37.1046 38 36 38H12C10.8954 38 10 37.1046 10 36Z" />
  </svg>
);

const ProfileIcon = ({ active }: { active?: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 48 48" fill={active ? '#FE2C55' : 'currentColor'}>
    <path d="M24 12.5C21.5 12.5 19.5 14.5 19.5 17C19.5 19.5 21.5 21.5 24 21.5C26.5 21.5 28.5 19.5 28.5 17C28.5 14.5 26.5 12.5 24 12.5Z" />
    <path d="M24 24C18 24 12.5 27 12.5 32V35.5H35.5V32C35.5 27 30 24 24 24Z" />
  </svg>
);

const MoreIcon = ({ active }: { active?: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 48 48" fill={active ? '#FE2C55' : 'currentColor'}>
    <circle cx="12" cy="24" r="4" />
    <circle cx="24" cy="24" r="4" />
    <circle cx="36" cy="24" r="4" />
  </svg>
);

const VerifiedBadge = () => (
  <svg width="14" height="14" viewBox="0 0 48 48" className="inline-block" fill="none">
    <circle cx="24" cy="24" r="20" fill="#20D5EC" />
    <path d="M16 24L22 30L32 18" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

interface FollowedUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  isVerified: boolean;
}

export default function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const openModal = useAuthModalStore((s) => s.openModal);
  const logout = useAuthStore((s) => s.logout);
  const setUser = useAuthStore((s) => s.setUser);
  const { theme, toggleTheme } = useThemeStore();
  const { language, setLanguage, t } = useTranslation();
  const navigate = useNavigate();

  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const [morePosition, setMorePosition] = useState({ left: 16, bottom: 16 });

  // Dynamically fetch followed accounts from backend API (only when logged in)
  const { data: followingData } = useQuery<{ data: FollowedUser[] }>({
    queryKey: ['following', user?.id],
    queryFn: () => http.get(`/users/${user!.id}/following`),
    enabled: !!user,
    retry: 1,
  });
  const followedAccounts = followingData?.data || [];

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        !moreButtonRef.current?.contains(event.target as Node)
      ) {
        setIsMoreOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavClick = (path: string, e: React.MouseEvent) => {
    // If not logged in and clicking on private features, show login
    const privatePaths = ['/friends', '/messages', '/activity', '/upload'];
    if (!user && privatePaths.includes(path)) {
      e.preventDefault();
      openModal('login');
    }
  };

  const toggleMore = () => {
    const rect = moreButtonRef.current?.getBoundingClientRect();
    if (rect) {
      setMorePosition({
        left: Math.max(12, rect.left + 8),
        bottom: Math.max(12, window.innerHeight - rect.top + 8),
      });
    }
    setIsMoreOpen((open) => !open);
  };

  const changeLanguage = async (nextLanguage: LanguageCode) => {
    setLanguage(nextLanguage);
    if (user) {
      const updatedUser = await http.patch<typeof user>('/users/me', {
        languageCode: nextLanguage,
      });
      setUser(updatedUser);
    }
  };

  const navItems = [
    { path: routes.home, label: t('sidebar.forYou'), icon: HomeIcon },
    { path: routes.explore, label: t('sidebar.explore'), icon: ExploreIcon },
    { path: routes.following, label: t('sidebar.following'), icon: FollowingIcon },
    { path: '/friends', label: t('sidebar.friends'), icon: FriendsIcon, hideOnMobile: true },
    { path: routes.live, label: 'LIVE', icon: LiveIcon, hideOnMobile: true },
    { path: '/messages', label: t('sidebar.messages'), icon: MessagesIcon, hideOnMobile: true },
    { path: '/activity', label: t('sidebar.activity'), icon: ActivityIcon, hideOnMobile: true },
    { path: '/upload', label: t('sidebar.upload'), icon: UploadIcon },
  ];

  return (
    <aside className="app-sidebar fixed z-30 flex bg-bg-primary">
      {/* Navigation */}
      <nav className="app-sidebar__nav">
        {navItems.map(({ path, label, icon: Icon, hideOnMobile }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            onClick={(e) => handleNavClick(path, e)}
            className={({ isActive }) =>
              `app-sidebar__item ${hideOnMobile ? 'app-sidebar__item--desktop' : ''} ${
                isActive
                  ? 'text-primary'
                  : 'text-text-primary hover:bg-bg-hover'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon active={isActive} />
                <span className="app-sidebar__label">{label}</span>
              </>
            )}
          </NavLink>
        ))}

        {/* Profile (conditional) */}
        <NavLink
          to={user ? `/@${user.username}` : '#'}
          onClick={(e) => {
            if (!user) {
              e.preventDefault();
              openModal('login');
            }
          }}
          className={({ isActive }) =>
            `app-sidebar__item ${
              isActive && user
                ? 'text-primary'
                : 'text-text-primary hover:bg-bg-hover'
            }`
          }
        >
          {({ isActive }) => (
            <>
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.username}
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <ProfileIcon active={isActive && !!user} />
              )}
              <span className="app-sidebar__label">{t('sidebar.profile')}</span>
            </>
          )}
        </NavLink>

        {/* More popover button */}
        <div className="app-sidebar__more relative">
          <button
            ref={moreButtonRef}
            onClick={toggleMore}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-md font-bold transition-colors duration-150 ${
              isMoreOpen ? 'bg-bg-hover text-primary' : 'text-text-primary hover:bg-bg-hover'
            }`}
          >
            <MoreIcon active={isMoreOpen} />
            <span className="app-sidebar__wide-label">{t('sidebar.more')}</span>
          </button>

          {/* More Popover Menu */}
          {isMoreOpen && (
            <Portal>
            <div
              ref={popoverRef}
              style={{ left: morePosition.left, bottom: morePosition.bottom }}
              className="fixed w-64 bg-bg-primary rounded-xl shadow-xl border border-border py-2 z-[100] animate-slide-up"
            >
              {/* Settings Zone */}
              <div className="px-2 pb-2 border-b border-divider">
                <p className="px-3 py-1.5 text-xs font-semibold text-text-tertiary uppercase tracking-wider">{t('sidebar.settings')}</p>
                <div className="flex items-center justify-between px-3 py-2 text-sm text-text-primary font-medium hover:bg-bg-hover rounded-lg cursor-pointer">
                  <span>{t('sidebar.general')}</span>
                </div>
                <div className="px-3 py-2 text-sm text-text-primary font-medium">
                  <span className="block mb-2">{t('sidebar.language')}</span>
                  <div className="grid grid-cols-2 gap-2">
                    {(['vi', 'en'] as const).map((code) => (
                      <button
                        key={code}
                        onClick={() => void changeLanguage(code)}
                        className={`rounded-md px-3 py-2 text-xs font-bold ${
                          language === code
                            ? 'bg-primary text-white'
                            : 'bg-bg-secondary hover:bg-bg-hover'
                        }`}
                      >
                        {code === 'vi' ? 'Tiếng Việt' : 'English'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between px-3 py-2 text-sm text-text-primary font-medium rounded-lg">
                  <span>{t('sidebar.darkMode')}</span>
                  <button
                    onClick={() => toggleTheme()}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                      theme === 'dark' ? 'bg-primary' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                        theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Other Zone */}
              <div className="px-2 pt-2">
                <p className="px-3 py-1.5 text-xs font-semibold text-text-tertiary uppercase tracking-wider">{t('sidebar.other')}</p>
                <div className="px-3 py-2 text-sm text-text-primary font-medium hover:bg-bg-hover rounded-lg cursor-pointer">
                  {t('sidebar.support')}
                </div>
                {user && (
                  <button
                    onClick={async () => {
                      await logout();
                      setIsMoreOpen(false);
                      navigate('/');
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-error font-medium hover:bg-bg-hover rounded-lg cursor-pointer"
                  >
                    {t('header.logout')}
                  </button>
                )}
              </div>
            </div>
            </Portal>
          )}
        </div>
      </nav>

      {/* Followed accounts section */}
      {followedAccounts.length > 0 && (
        <div className="app-sidebar__wide-section pt-4 border-t border-divider px-3 mt-4">
          <p className="text-xs font-semibold text-text-secondary mb-2 px-2">{t('sidebar.followedAccounts')}</p>
          <div className="space-y-1">
            {followedAccounts.slice(0, 5).map((acc) => (
              <NavLink
                key={acc.id}
                to={`/@${acc.username}`}
                className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-bg-hover transition-colors duration-150"
              >
                <img
                  src={acc.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                  alt={acc.username}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-bold text-text-primary truncate">{acc.username}</span>
                    {acc.isVerified && <VerifiedBadge />}
                  </div>
                  <p className="text-xs text-text-secondary truncate">{acc.displayName}</p>
                </div>
              </NavLink>
            ))}
          </div>
          {followedAccounts.length > 5 && (
            <button className="text-xs font-bold text-primary mt-2 px-2 hover:underline text-left">{t('sidebar.seeAll')}</button>
          )}
        </div>
      )}

      {/* Guest Login CTA Card (exactly as in Figma) */}
      {!user && (
        <div className="app-sidebar__wide-section mx-4 my-4 p-4 border border-divider rounded-lg bg-bg-secondary text-left mt-auto">
          <p className="text-sm text-text-secondary mb-4 leading-normal font-medium">
            {t('sidebar.guestPrompt')}
          </p>
          <button
            onClick={() => openModal('login')}
            className="w-full py-2.5 rounded-md border border-primary text-primary font-bold text-sm hover:bg-primary-light transition-colors duration-200"
          >
            {t('header.login')}
          </button>
        </div>
      )}

      {/* Footer links */}
      <div className="app-sidebar__wide-section px-5 py-4 border-t border-divider mt-auto">
        <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs text-text-tertiary font-medium">
          <a href="#" className="hover:underline">{t('sidebar.about')}</a>
          <a href="#" className="hover:underline">{t('sidebar.contact')}</a>
          <a href="#" className="hover:underline">{t('sidebar.report')}</a>
          <a href="#" className="hover:underline">{t('sidebar.terms')}</a>
        </div>
        <p className="text-[11px] text-text-tertiary mt-3 font-semibold">© 2026 TikTok Clone</p>
      </div>
    </aside>
  );
}
