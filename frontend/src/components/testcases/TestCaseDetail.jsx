import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { testCaseService } from '../../services/testCaseService';
import { executionService } from '../../services/executionService';
import { Loader } from '../common/Loader';
import { StatusBadge } from '../common/Badge';
import { formatDate } from '../../utils/helpers';
import { FaEdit, FaPlay, FaArrowLeft } from 'react-icons/fa';

export const TestCaseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [testCase, setTestCase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTestCase();
  }, [id]);

  const loadTestCase = async () => {
    try {
      const data = await testCaseService.getById(id);
      setTestCase(data.testCase);
    } catch (err) {
      setError('Failed to load test case');
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    setExecuting(true);
    try {
      const data = await executionService.create({
        testCaseId: id,
        executionType: 'Automated',
        environment: 'Testing',
        browser: 'Chrome'
      });
      alert('Test execution started! Execution ID: ' + data.execution.id);
      navigate('/executions');
    } catch (err) {
      alert('Failed to start execution');
    } finally {
      setExecuting(false);
    }
  };

  if (loading) return <Loader />;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!testCase) return <div>Test case not found</div>;

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <Link to="/test-cases" className="btn btn-outline" style={{ marginBottom: '1rem' }}>
          <FaArrowLeft /> Back to Test Cases
        </Link>
      </div>

      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <h1 style={{ margin: 0 }}>{testCase.title}</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={handleExecute} disabled={executing} className="btn btn-success">
            <FaPlay /> {executing ? 'Running...' : 'Run Test'}
          </button>
          <Link to={`/test-cases/${id}/edit`} className="btn btn-primary">
            <FaEdit /> Edit
          </Link>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Details</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <strong>Category:</strong> <StatusBadge status={testCase.category} />
          </div>
          <div>
            <strong>Priority:</strong> <StatusBadge status={testCase.priority} />
          </div>
          <div>
            <strong>Status:</strong> <StatusBadge status={testCase.status} />
          </div>
          <div>
            <strong>Type:</strong> {testCase.isAutomated ? 'Automated' : 'Manual'}
          </div>
          <div>
            <strong>Created:</strong> {formatDate(testCase.createdAt)}
          </div>
          <div>
            <strong>Created By:</strong> {testCase.createdBy?.name}
          </div>
        </div>
        {testCase.description && (
          <div style={{ marginTop: '1rem' }}>
            <strong>Description:</strong>
            <p style={{ marginTop: '0.5rem' }}>{testCase.description}</p>
          </div>
        )}
        {testCase.tags && testCase.tags.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <strong>Tags:</strong>
            <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {testCase.tags.map(tag => (
                <span key={tag} className="badge badge-gray">{tag}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '1rem' }}>Test Steps</h2>
        {testCase.steps && testCase.steps.length > 0 ? (
          <div>
            {testCase.steps.map((step, index) => (
              <div key={index} style={{ 
                borderLeft: '3px solid var(--primary)',
                paddingLeft: '1rem',
                marginBottom: '1rem'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                  Step {step.stepNumber}: {step.action}
                </div>
                <div style={{ color: 'var(--gray-600)', fontSize: '0.875rem' }}>
                  Expected: {step.expectedResult}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No steps defined</p>
        )}
      </div>
    </div>
  );
};