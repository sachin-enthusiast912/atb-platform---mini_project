import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

export const Layout = () => {
  return (
    <div>
      <Navbar />
      <div style={{ display: 'flex' }}>
        <Sidebar />
        <main style={{ 
          flex: 1, 
          padding: '2rem',
          backgroundColor: '#F1F4F9',
          minHeight: 'calc(100vh - 65px)'
        }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};