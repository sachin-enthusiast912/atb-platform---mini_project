import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService } from '../../services/dashboardService';
import { Loader } from '../common/Loader';
import { StatsCard } from './StatsCard';
import { RecentActivity } from './RecentActivity';
import { FaClipboardList, FaBug, FaPlay, FaCheckCircle, FaPlus } from 'react-icons/fa';

export const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const data = await dashboardService.getStats();
      setStats(data.stats);
    } catch (err) {
      setError('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  if (error) {
    return <div className="alert alert-error">{error}</div>;
  }

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <h1 style={{ margin: 0 }}>Dashboard</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/test-cases/new" className="btn btn-primary">
            <FaPlus /> New Test Case
          </Link>
          <Link to="/bugs/new" className="btn btn-danger">
            <FaPlus /> Report Bug
          </Link>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <StatsCard
          title="Test Cases"
          value={stats?.testCases?.total || 0}
          icon={<FaClipboardList />}
          color="primary"
          subtitle={`${stats?.testCases?.active || 0} active`}
        />
        <StatsCard
          title="Bugs"
          value={stats?.bugs?.total || 0}
          icon={<FaBug />}
          color="danger"
          subtitle={`${stats?.bugs?.open || 0} open`}
        />
        <StatsCard
          title="Executions"
          value={stats?.executions?.total || 0}
          icon={<FaPlay />}
          color="info"
          subtitle={`${stats?.executions?.recent || 0} recent`}
        />
        <StatsCard
          title="Pass Rate"
          value={`${stats?.executions?.passRate || 0}%`}
          icon={<FaCheckCircle />}
          color="success"
          subtitle="Overall"
        />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <div className="card">
          <h2 style={{ marginBottom: '1rem' }}>Test Cases by Category</h2>
          {stats?.testCases?.byCategory && stats.testCases.byCategory.length > 0 ? (
            <div>
              {stats.testCases.byCategory.map((item) => (
                <div 
                  key={item._id}
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    padding: '0.5rem 0',
                    borderBottom: '1px solid var(--gray-200)'
                  }}
                >
                  <span>{item._id}</span>
                  <span className="badge badge-primary">{item.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--gray-500)' }}>No data available</p>
          )}
        </div>

        <div className="card">
          <h2 style={{ marginBottom: '1rem' }}>Bugs by Status</h2>
          {stats?.bugs?.byStatus && stats.bugs.byStatus.length > 0 ? (
            <div>
              {stats.bugs.byStatus.map((item) => (
                <div 
                  key={item._id}
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    padding: '0.5rem 0',
                    borderBottom: '1px solid var(--gray-200)'
                  }}
                >
                  <span>{item._id}</span>
                  <span className="badge badge-danger">{item.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--gray-500)' }}>No data available</p>
          )}
        </div>
      </div>

      <RecentActivity />
    </div>
  );
};