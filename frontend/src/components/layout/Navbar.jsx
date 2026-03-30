import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaUser, FaSignOutAlt } from 'react-icons/fa';

export const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav style={{
      background: 'white',
      borderBottom: '1px solid var(--gray-200)',
      padding: '1rem 0',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      <div className="container" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Link to="/dashboard" style={{ 
          fontSize: '1.5rem', 
          fontWeight: 'bold', 
          color: 'var(--primary)',
          textDecoration: 'none'
        }}>
          ATBP
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            color: 'var(--gray-700)'
          }}>
            <FaUser />
            <span>{user?.name}</span>
            <span className="badge badge-primary">{user?.role}</span>
          </div>

          <button
            onClick={logout}
            className="btn btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <FaSignOutAlt />
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};