import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bugService } from '../../services/bugService';
import { Loader } from '../common/Loader';
import { StatusBadge } from '../common/Badge';
import { formatDate } from '../../utils/helpers';
import { FaPlus } from 'react-icons/fa';

export const BugList = () => {
  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadBugs();
  }, []);

  const loadBugs = async () => {
    try {
      const data = await bugService.getAll();
      setBugs(data.bugs || []);
    } catch (err) {
      setError('Failed to load bugs');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <h1 style={{ margin: 0 }}>Bugs</h1>
        <Link to="/bugs/new" className="btn btn-danger">
          <FaPlus /> Report Bug
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        {bugs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-500)' }}>
            <p>No bugs reported yet.</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Priority</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Reported By</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {bugs.map((bug) => (
                <tr key={bug._id}>
                  <td>
                    <Link to={`/bugs/${bug._id}`} style={{ textDecoration: 'none', color: 'var(--primary)' }}>
                      {bug.title}
                      {bug.isAutomated && <span className="badge badge-info" style={{ marginLeft: '0.5rem' }}>AUTO</span>}
                    </Link>
                  </td>
                  <td><StatusBadge status={bug.priority} /></td>
                  <td><StatusBadge status={bug.severity} /></td>
                  <td><StatusBadge status={bug.status} /></td>
                  <td>{bug.reportedBy?.name || 'N/A'}</td>
                  <td>{formatDate(bug.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};