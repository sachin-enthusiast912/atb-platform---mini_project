import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { executionService } from '../../services/executionService';
import { Loader } from '../common/Loader';
import { StatusBadge } from '../common/Badge';
import { formatDate, formatDuration } from '../../utils/helpers';
import { FaArrowLeft } from 'react-icons/fa';

export const ExecutionDetail = () => {
  const { id } = useParams();
  const [execution, setExecution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadExecution();
  }, [id]);

  const loadExecution = async () => {
    try {
      const data = await executionService.getById(id);
      setExecution(data.execution);
    } catch (err) {
      setError('Failed to load execution');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!execution) return <div>Execution not found</div>;

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <Link to="/executions" className="btn btn-outline">
          <FaArrowLeft /> Back to Executions
        </Link>
      </div>

      <h1 style={{ marginBottom: '2rem' }}>Execution Details</h1>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Information</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <strong>Test Case:</strong> {execution.testCaseId?.title || 'N/A'}
          </div>
          <div>
            <strong>Status:</strong> <StatusBadge status={execution.status} />
          </div>
          <div>
            <strong>Type:</strong> {execution.executionType}
          </div>
          <div>
            <strong>Environment:</strong> {execution.environment}
          </div>
          <div>
            <strong>Browser:</strong> {execution.browser}
          </div>
          <div>
            <strong>Duration:</strong> {execution.duration ? formatDuration(execution.duration) : 'N/A'}
          </div>
          <div>
            <strong>Started:</strong> {formatDate(execution.startTime)}
          </div>
          <div>
            <strong>Ended:</strong> {execution.endTime ? formatDate(execution.endTime) : 'Running...'}
          </div>
          <div>
            <strong>Triggered By:</strong> {execution.triggeredBy?.name || 'N/A'}
          </div>
          {execution.bugCreated && execution.bugId && (
            <div>
              <strong>Bug Created:</strong>{' '}
              <Link to={`/bugs/${execution.bugId._id}`} style={{ color: 'var(--primary)' }}>
                View Bug
              </Link>
            </div>
          )}
        </div>

        {execution.errorMessage && (
          <div style={{ marginTop: '1.5rem' }}>
            <strong>Error Message:</strong>
            <div style={{ 
              marginTop: '0.5rem', 
              padding: '1rem', 
              backgroundColor: '#fee2e2', 
              borderRadius: '0.375rem',
              fontFamily: 'monospace',
              fontSize: '0.875rem'
            }}>
              {execution.errorMessage}
            </div>
          </div>
        )}

        {execution.screenshot && (
          <div style={{ marginTop: '1.5rem' }}>
            <strong>Screenshot:</strong>
            <div style={{ marginTop: '0.5rem' }}>
              <img 
                src={execution.screenshot} 
                alt="Test failure screenshot" 
                style={{ maxWidth: '100%', border: '1px solid var(--gray-300)', borderRadius: '0.375rem' }}
              />
            </div>
          </div>
        )}
      </div>

      {execution.stepResults && execution.stepResults.length > 0 && (
        <div className="card">
          <h2 style={{ marginBottom: '1rem' }}>Step Results</h2>
          {execution.stepResults.map((step, index) => (
            <div key={index} style={{ 
              borderLeft: `3px solid ${step.status === 'Passed' ? 'var(--success)' : 'var(--danger)'}`,
              paddingLeft: '1rem',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>Step {step.stepNumber}</strong>
                <StatusBadge status={step.status} />
              </div>
              {step.actualResult && (
                <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginTop: '0.25rem' }}>
                  Result: {step.actualResult}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};