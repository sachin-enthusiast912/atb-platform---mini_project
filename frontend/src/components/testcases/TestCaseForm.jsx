import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { testCaseService } from '../../services/testCaseService';
import { Input, Textarea, Select } from '../common/Input';
import { Button } from '../common/Button';
import { CATEGORIES, PRIORITIES } from '../../utils/constants';
import { FaSave, FaPlus, FaTrash } from 'react-icons/fa';

export const TestCaseForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: '',
    steps: [{ stepNumber: 1, action: '', expectedResult: '' }],
    tags: ''
  });

  useEffect(() => {
    if (id) {
      loadTestCase();
    }
  }, [id]);

  const loadTestCase = async () => {
    try {
      const data = await testCaseService.getById(id);
      const testCase = data.testCase;
      setFormData({
        title: testCase.title,
        description: testCase.description || '',
        category: testCase.category,
        priority: testCase.priority,
        steps: testCase.steps,
        tags: testCase.tags?.join(', ') || ''
      });
    } catch (err) {
      setError('Failed to load test case');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleStepChange = (index, field, value) => {
    const newSteps = [...formData.steps];
    newSteps[index][field] = value;
    setFormData({ ...formData, steps: newSteps });
  };

  const addStep = () => {
    setFormData({
      ...formData,
      steps: [...formData.steps, { 
        stepNumber: formData.steps.length + 1, 
        action: '', 
        expectedResult: '' 
      }]
    });
  };

  const removeStep = (index) => {
    const newSteps = formData.steps.filter((_, i) => i !== index);
    newSteps.forEach((step, i) => step.stepNumber = i + 1);
    setFormData({ ...formData, steps: newSteps });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = {
        ...formData,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
      };

      if (id) {
        await testCaseService.update(id, data);
      } else {
        await testCaseService.create(data);
      }
      navigate('/test-cases');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save test case');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>{id ? 'Edit' : 'Create'} Test Case</h1>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <form onSubmit={handleSubmit}>
          <Input
            label="Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter test case title"
            required
          />

          <Textarea
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe the test case"
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Select
              label="Category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              options={CATEGORIES}
              required
            />

            <Select
              label="Priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              options={PRIORITIES}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Test Steps *</label>
            
            <div style={{
              backgroundColor: '#eff6ff',
              color: '#1e40af',
              border: '1px solid #bfdbfe',
              padding: '1rem',
              borderRadius: '0.375rem',
              marginBottom: '1rem',
              fontSize: '0.875rem'
            }}>
              <strong>🤖 Auto-Execution Syntax:</strong> Use keywords to make this test executable.
              <ul style={{ margin: '0.5rem 0 0 1.5rem', listStyleType: 'disc' }}>
                <li><strong>Actions:</strong> <code style={{background: 'rgba(255,255,255,0.5)', padding: '2px 4px', borderRadius: '2px'}}>NAVIGATE &lt;url&gt;</code>, <code style={{background: 'rgba(255,255,255,0.5)', padding: '2px 4px', borderRadius: '2px'}}>CLICK &lt;selector&gt;</code>, <code style={{background: 'rgba(255,255,255,0.5)', padding: '2px 4px', borderRadius: '2px'}}>TYPE &lt;selector&gt; &lt;text&gt;</code>, <code style={{background: 'rgba(255,255,255,0.5)', padding: '2px 4px', borderRadius: '2px'}}>WAIT &lt;seconds&gt;</code></li>
                <li><strong>Expected:</strong> <code style={{background: 'rgba(255,255,255,0.5)', padding: '2px 4px', borderRadius: '2px'}}>ASSERT_URL &lt;text&gt;</code>, <code style={{background: 'rgba(255,255,255,0.5)', padding: '2px 4px', borderRadius: '2px'}}>ASSERT_VISIBLE &lt;selector&gt;</code>, <code style={{background: 'rgba(255,255,255,0.5)', padding: '2px 4px', borderRadius: '2px'}}>ASSERT_TEXT &lt;selector&gt; &lt;text&gt;</code></li>
              </ul>
            </div>

            {formData.steps.map((step, index) => (
              <div key={index} style={{ 
                border: '1px solid var(--gray-300)', 
                borderRadius: '0.375rem',
                padding: '1rem',
                marginBottom: '1rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <strong>Step {step.stepNumber}</strong>
                  {formData.steps.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeStep(index)}
                      className="btn btn-danger"
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                    >
                      <FaTrash /> Remove
                    </button>
                  )}
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Action (e.g., NAVIGATE http://google.com or Click login button)"
                    value={step.action}
                    onChange={(e) => handleStepChange(index, 'action', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Expected Result (e.g., ASSERT_VISIBLE #logo or User is logged in)"
                    value={step.expectedResult}
                    onChange={(e) => handleStepChange(index, 'expectedResult', e.target.value)}
                    required
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addStep}
              className="btn btn-outline"
            >
              <FaPlus /> Add Step
            </button>
          </div>

          <Input
            label="Tags"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            placeholder="Enter tags separated by commas (e.g., login, critical)"
          />

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <Button type="submit" variant="primary" loading={loading} icon={<FaSave />}>
              {id ? 'Update' : 'Create'} Test Case
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/test-cases')}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};