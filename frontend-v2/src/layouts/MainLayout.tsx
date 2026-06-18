import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

export default function MainLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-bg-primary">
      <Header />
      <div className="flex flex-1 pt-[60px]">
        <Sidebar />
        <main className="flex-1 ml-[var(--width-sidebar)] px-6 py-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
