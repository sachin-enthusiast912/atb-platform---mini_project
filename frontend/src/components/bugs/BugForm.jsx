import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { bugService } from '../../services/bugService';
import { Input, Textarea, Select } from '../common/Input';
import { Button } from '../common/Button';
import { PRIORITIES, SEVERITIES, BUG_TYPES } from '../../utils/constants';
import { FaSave } from 'react-icons/fa';

export const BugForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: '',
    severity: '',
    type: '',
    stepsToReproduce: '',
    expectedBehavior: '',
    actualBehavior: '',
    environment: 'Testing',
    browser: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = {
        ...formData,
        stepsToReproduce: formData.stepsToReproduce.split('\n').filter(Boolean)
      };
      await bugService.create(data);
      navigate('/bugs');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create bug');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Report Bug</h1>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <form onSubmit={handleSubmit}>
          <Input
            label="Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Brief description of the bug"
            required
          />

          <Textarea
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Detailed description of the bug"
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Select
              label="Priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              options={PRIORITIES}
              required
            />

            <Select
              label="Severity"
              name="severity"
              value={formData.severity}
              onChange={handleChange}
              options={SEVERITIES}
              required
            />
          </div>

          <Select
            label="Type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            options={BUG_TYPES}
            required
          />

          <Textarea
            label="Steps to Reproduce"
            name="stepsToReproduce"
            value={formData.stepsToReproduce}
            onChange={handleChange}
            placeholder="Enter each step on a new line"
            required
          />

          <Textarea
            label="Expected Behavior"
            name="expectedBehavior"
            value={formData.expectedBehavior}
            onChange={handleChange}
            placeholder="What should happen?"
          />

          <Textarea
            label="Actual Behavior"
            name="actualBehavior"
            value={formData.actualBehavior}
            onChange={handleChange}
            placeholder="What actually happened?"
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input
              label="Environment"
              name="environment"
              value={formData.environment}
              onChange={handleChange}
              placeholder="Testing, Staging, Production"
            />

            <Input
              label="Browser"
              name="browser"
              value={formData.browser}
              onChange={handleChange}
              placeholder="Chrome, Firefox, Safari"
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <Button type="submit" variant="danger" loading={loading} icon={<FaSave />}>
              Report Bug
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/bugs')}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};