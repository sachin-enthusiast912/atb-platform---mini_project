import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { bugService } from '../../services/bugService';
import { Loader } from '../common/Loader';
import { StatusBadge } from '../common/Badge';
import { CommentSection } from './CommentSection';
import { formatDate } from '../../utils/helpers';
import { FaArrowLeft, FaEdit } from 'react-icons/fa';

export const BugDetail = () => {
  const { id } = useParams();
  const [bug, setBug] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadBug();
  }, [id]);

  const loadBug = async () => {
    try {
      const data = await bugService.getById(id);
      setBug(data.bug);
    } catch (err) {
      setError('Failed to load bug');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!bug) return <div>Bug not found</div>;

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <Link to="/bugs" className="btn btn-outline">
          <FaArrowLeft /> Back to Bugs
        </Link>
      </div>

      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <h1 style={{ margin: 0 }}>{bug.title}</h1>
        <Link to={`/bugs/${id}/edit`} className="btn btn-primary">
          <FaEdit /> Edit
        </Link>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Details</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <strong>Status:</strong> <StatusBadge status={bug.status} />
          </div>
          <div>
            <strong>Priority:</strong> <StatusBadge status={bug.priority} />
          </div>
          <div>
            <strong>Severity:</strong> <StatusBadge status={bug.severity} />
          </div>
          <div>
            <strong>Type:</strong> {bug.type}
          </div>
          <div>
            <strong>Reported By:</strong> {bug.reportedBy?.name}
          </div>
          <div>
            <strong>Assigned To:</strong> {bug.assignedTo?.name || 'Unassigned'}
          </div>
          <div>
            <strong>Environment:</strong> {bug.environment}
          </div>
          <div>
            <strong>Browser:</strong> {bug.browser || 'N/A'}
          </div>
          <div>
            <strong>Created:</strong> {formatDate(bug.createdAt)}
          </div>
          {bug.isAutomated && (
            <div>
              <strong>Auto-Created:</strong> <span className="badge badge-info">Yes</span>
            </div>
          )}
        </div>

        <div style={{ marginTop: '1.5rem' }}>
          <strong>Description:</strong>
          <p style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap' }}>{bug.description}</p>
        </div>

        {bug.stepsToReproduce && bug.stepsToReproduce.length > 0 && (
          <div style={{ marginTop: '1.5rem' }}>
            <strong>Steps to Reproduce:</strong>
            <ol style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
              {bug.stepsToReproduce.map((step, index) => (
                <li key={index} style={{ marginBottom: '0.25rem' }}>{step}</li>
              ))}
            </ol>
          </div>
        )}

        {bug.expectedBehavior && (
          <div style={{ marginTop: '1.5rem' }}>
            <strong>Expected Behavior:</strong>
            <p style={{ marginTop: '0.5rem' }}>{bug.expectedBehavior}</p>
          </div>
        )}

        {bug.actualBehavior && (
          <div style={{ marginTop: '1.5rem' }}>
            <strong>Actual Behavior:</strong>
            <p style={{ marginTop: '0.5rem' }}>{bug.actualBehavior}</p>
          </div>
        )}
      </div>

      <CommentSection bugId={id} comments={bug.comments || []} onCommentAdded={loadBug} />
    </div>
  );
};