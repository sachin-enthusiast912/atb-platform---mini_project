import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { executionService } from '../../services/executionService';
import { Loader } from '../common/Loader';
import { StatusBadge } from '../common/Badge';
import { formatDate, formatDuration } from '../../utils/helpers';

export const ExecutionList = () => {
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadExecutions();
  }, []);

  // Auto-refresh every 3 seconds if there are running executions
  useEffect(() => {
    if (!autoRefresh) return;

    const hasRunningTests = executions.some(
      exec => exec.status === 'Running' || exec.status === 'Pending'
    );

    if (hasRunningTests) {
      const interval = setInterval(() => {
        console.log('🔄 Auto-refreshing executions...');
        loadExecutions();
      }, 3000); // Refresh every 3 seconds

      return () => clearInterval(interval);
    }
  }, [executions, autoRefresh]);

  const loadExecutions = async () => {
    try {
      const data = await executionService.getAll();
      setExecutions(data.executions || []);
      setError('');
    } catch (err) {
      setError('Failed to load executions');
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this execution record?')) {
      try {
        await executionService.delete(id);
        loadExecutions();
      } catch (err) {
        console.error('Failed to delete execution:', err);
        setError('Failed to delete execution');
      }
    }
  };

  const getStatusIcon = (status) => {
    const icons = {
      'Pending': '⏳',
      'Running': '▶️',
      'Passed': '✅',
      'Failed': '❌',
      'Error': '⚠️',
      'Skipped': '⏭️'
    };
    return icons[status] || '❓';
  };

  if (loading) return <Loader />;

  const runningCount = executions.filter(e => e.status === 'Running' || e.status === 'Pending').length;

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <div>
          <h1 style={{ margin: 0 }}>Test Executions</h1>
          {runningCount > 0 && (
            <p style={{ 
              margin: '0.5rem 0 0 0', 
              color: 'var(--info)',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span className="spinner" style={{ 
                width: '12px', 
                height: '12px', 
                borderWidth: '2px' 
              }}></span>
              {runningCount} test{runningCount > 1 ? 's' : ''} running...
              {autoRefresh && ' (Auto-refreshing every 3s)'}
            </p>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            fontSize: '0.875rem',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-refresh
          </label>
          
          <button 
            onClick={loadExecutions}
            className="btn btn-outline"
            disabled={loading}
          >
            🔄 Refresh Now
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <div className="card">
        {executions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-500)' }}>
            <p>No test executions yet.</p>
            <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
              Go to Test Cases and click "Run" to start testing!
            </p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Test Case</th>
                <th>Type</th>
                <th>Status</th>
                <th>Duration</th>
                <th>Triggered By</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {executions.map((execution) => (
                <tr key={execution._id} style={{
                  backgroundColor: execution.status === 'Running' ? '#fffbeb' : 'transparent'
                }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>{getStatusIcon(execution.status)}</span>
                      <span>{execution.testCaseId?.title || 'N/A'}</span>
                    </div>
                  </td>
                  <td>{execution.executionType || 'Automated'}</td>
                  <td>
                    <StatusBadge status={execution.status} />
                    {(execution.status === 'Running' || execution.status === 'Pending') && (
                      <span style={{ 
                        marginLeft: '0.5rem',
                        fontSize: '0.75rem',
                        color: 'var(--gray-500)'
                      }}>
                        (in progress...)
                      </span>
                    )}
                  </td>
                  <td>
                    {execution.duration ? formatDuration(execution.duration) : 
                     (execution.status === 'Running' || execution.status === 'Pending') ? 
                     '⏱️ Running...' : 'N/A'}
                  </td>
                  <td>{execution.triggeredBy?.name || 'N/A'}</td>
                  <td>{formatDate(execution.createdAt)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Link 
                        to={`/executions/${execution._id}`} 
                        className="btn btn-outline" 
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                      >
                        View Details
                      </Link>
                      <button
                        onClick={() => handleDelete(execution._id)}
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};