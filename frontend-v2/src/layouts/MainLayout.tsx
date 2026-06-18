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
          className={`flex-1 ml-[var(--width-sidebar)] overflow-y-auto ${
            isVideoPage ? 'p-0' : 'px-6 py-6'
          }`}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
