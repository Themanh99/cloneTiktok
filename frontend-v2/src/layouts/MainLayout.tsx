import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

export default function MainLayout() {
  const location = useLocation();
  const isVideoPage = location.pathname.startsWith('/video/');

  return (
    <div className="flex flex-col min-h-screen bg-bg-primary">
      <Header />
      <div className="flex flex-1 pt-[60px]">
        <Sidebar />
        <main
          className={`app-main min-w-0 flex-1 overflow-y-auto ${
            isVideoPage
              ? 'app-main--video p-0'
              : 'app-main--content px-3 py-4 sm:px-4 sm:py-5 lg:px-6 lg:py-6'
          }`}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
