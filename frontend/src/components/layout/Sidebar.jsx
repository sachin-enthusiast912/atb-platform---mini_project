import { NavLink } from 'react-router-dom';
import { FaTachometerAlt, FaClipboardList, FaBug, FaPlay } from 'react-icons/fa';

const navItems = [
  { to: '/dashboard', icon: <FaTachometerAlt />, label: 'Dashboard' },
  { to: '/test-cases', icon: <FaClipboardList />, label: 'Test Cases' },
  { to: '/bugs', icon: <FaBug />, label: 'Bugs' },
  { to: '/executions', icon: <FaPlay />, label: 'Executions' }
];

export const Sidebar = () => {
  return (
    <aside style={{
      width: '250px',
      background: 'linear-gradient(to bottom, #003366, #001A33)',
      borderRight: '1px solid #001A33',
      minHeight: 'calc(100vh - 65px)',
      padding: '1rem 0',
      boxShadow: '2px 0 10px rgba(0,0,0,0.2)'
    }}>
      <nav>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1.5rem',
              color: isActive ? '#ffffff' : '#E3F2FD',
              backgroundColor: isActive ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
              textDecoration: 'none',
              transition: 'all 0.3s',
              borderLeft: isActive ? '3px solid #E3F2FD' : '3px solid transparent',
              fontWeight: isActive ? '600' : '400'
            })}
          >
            <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};