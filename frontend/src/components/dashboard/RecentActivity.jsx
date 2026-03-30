import { useState, useEffect } from 'react';
import { dashboardService } from '../../services/dashboardService';
import { formatDate } from '../../utils/helpers';
import { StatusBadge } from '../common/Badge';
import { Loader } from '../common/Loader';

export const RecentActivity = () => {
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivity();
  }, []);

  const loadActivity = async () => {
    try {
      const data = await dashboardService.getRecentActivity(5);
      setActivity(data);
    } catch (err) {
      console.error('Failed to load activity');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader size="sm" />;

  return (
    <div className="card">
      <h2 style={{ marginBottom: '1rem' }}>Recent Activity</h2>
      
      {activity?.recentExecutions && activity.recentExecutions.length > 0 ? (
        <div>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Recent Executions</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Test Case</th>
                <th>Status</th>
                <th>Triggered By</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {activity.recentExecutions.map((exec) => (
                <tr key={exec._id}>
                  <td>{exec.testCaseId?.title || 'N/A'}</td>
                  <td><StatusBadge status={exec.status} /></td>
                  <td>{exec.triggeredBy?.name || 'N/A'}</td>
                  <td>{formatDate(exec.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p style={{ color: 'var(--gray-500)' }}>No recent executions</p>
      )}
    </div>
  );
};