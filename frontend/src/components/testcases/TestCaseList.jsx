import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { testCaseService } from '../../services/testCaseService';
import { executionService } from '../../services/executionService';
import { Loader } from '../common/Loader';
import { StatusBadge } from '../common/Badge';
import { formatDate } from '../../utils/helpers';
import { FaPlus, FaPlay, FaEdit, FaTrash } from 'react-icons/fa';

export const TestCaseList = () => {
  const navigate = useNavigate();
  const [testCases, setTestCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [runningTests, setRunningTests] = useState(new Set());
  const [error, setError] = useState('');

  useEffect(() => {
    loadTestCases();
  }, []);

  const loadTestCases = async () => {
    try {
      const data = await testCaseService.getAll();
      setTestCases(data.testCases || []);
    } catch (err) {
      setError('Failed to load test cases');
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunTest = async (testCaseId, testCaseTitle) => {
    console.log('🚀 Run button clicked for:', testCaseId);
    
    if (runningTests.has(testCaseId)) {
      alert('Test is already running!');
      return;
    }

    const confirmed = window.confirm(
      `Run test: "${testCaseTitle}"?\n\n` +
      `This will:\n` +
      `• Start automated browser testing\n` +
      `• Execute all test steps\n` +
      `• Create execution record\n` +
      `• Auto-create bug if test fails`
    );

    if (!confirmed) {
      console.log('❌ User cancelled test execution');
      return;
    }

    console.log('✅ User confirmed, starting execution...');
    setRunningTests(prev => new Set(prev).add(testCaseId));

    try {
      console.log('📡 Calling executionService.create...');
      
      const response = await executionService.create({
        testCaseId: testCaseId,
        executionType: 'Automated',
        environment: 'Testing',
        browser: 'Chrome'
      });

      console.log('✅ Execution created:', response);

      alert(
        `✅ Test execution started!\n\n` +
        `Test: ${testCaseTitle}\n` +
        `Execution ID: ${response.execution._id}\n\n` +
        `Redirecting to Executions page...`
      );

      // Navigate to executions page after 1 second
      setTimeout(() => {
        navigate('/executions');
      }, 1000);

    } catch (err) {
      console.error('❌ Failed to run test:', err);
      console.error('Error details:', err.response?.data);
      
      const errorMessage = err.response?.data?.error || err.message || 'Unknown error';
      
      alert(
        `❌ Failed to start test execution!\n\n` +
        `Error: ${errorMessage}\n\n` +
        `Check console (F12) for details`
      );
    } finally {
      setRunningTests(prev => {
        const newSet = new Set(prev);
        newSet.delete(testCaseId);
        return newSet;
      });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this test case?')) {
      try {
        await testCaseService.delete(id);
        alert('Test case deleted successfully');
        loadTestCases();
      } catch (err) {
        alert('Failed to delete test case');
        console.error('Delete error:', err);
      }
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
        <h1 style={{ margin: 0 }}>Test Cases</h1>
        <Link to="/test-cases/new" className="btn btn-primary">
          <FaPlus /> New Test Case
        </Link>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <div className="card">
        {testCases.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-500)' }}>
            <p>No test cases found. Create your first test case!</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {testCases.map((testCase) => (
                <tr key={testCase._id}>
                  <td>
                    <Link 
                      to={`/test-cases/${testCase._id}`} 
                      style={{ textDecoration: 'none', color: 'var(--primary)' }}
                    >
                      {testCase.title}
                    </Link>
                  </td>
                  <td><StatusBadge status={testCase.category} /></td>
                  <td><StatusBadge status={testCase.priority} /></td>
                  <td><StatusBadge status={testCase.status} /></td>
                  <td>{formatDate(testCase.createdAt)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        onClick={() => handleRunTest(testCase._id, testCase.title)}
                        disabled={runningTests.has(testCase._id)}
                        className="btn btn-success" 
                        style={{ 
                          padding: '0.25rem 0.5rem', 
                          fontSize: '0.75rem',
                          cursor: runningTests.has(testCase._id) ? 'not-allowed' : 'pointer'
                        }}
                        title="Run this test"
                      >
                        <FaPlay /> {runningTests.has(testCase._id) ? 'Running...' : 'Run'}
                      </button>
                      <Link 
                        to={`/test-cases/${testCase._id}/edit`} 
                        className="btn btn-outline" 
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                        title="Edit this test case"
                      >
                        <FaEdit />
                      </Link>
                      <button 
                        onClick={() => handleDelete(testCase._id)}
                        className="btn btn-danger" 
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                        title="Delete this test case"
                      >
                        <FaTrash />
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