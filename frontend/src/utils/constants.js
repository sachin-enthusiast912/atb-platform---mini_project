export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const CATEGORIES = [
  { value: 'UI', label: 'UI' },
  { value: 'API', label: 'API' },
  { value: 'Integration', label: 'Integration' },
  { value: 'Regression', label: 'Regression' },
  { value: 'Performance', label: 'Performance' },
  { value: 'Security', label: 'Security' }
];

export const PRIORITIES = [
  { value: 'Low', label: 'Low' },
  { value: 'Medium', label: 'Medium' },
  { value: 'High', label: 'High' },
  { value: 'Critical', label: 'Critical' }
];

export const SEVERITIES = [
  { value: 'Minor', label: 'Minor' },
  { value: 'Major', label: 'Major' },
  { value: 'Critical', label: 'Critical' },
  { value: 'Blocker', label: 'Blocker' }
];

export const BUG_STATUSES = [
  { value: 'New', label: 'New' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Fixed', label: 'Fixed' },
  { value: 'Verified', label: 'Verified' },
  { value: 'Closed', label: 'Closed' },
  { value: 'Reopened', label: 'Reopened' }
];

export const BUG_TYPES = [
  { value: 'Functional', label: 'Functional' },
  { value: 'UI', label: 'UI' },
  { value: 'Performance', label: 'Performance' },
  { value: 'Security', label: 'Security' },
  { value: 'Data', label: 'Data' },
  { value: 'API', label: 'API' },
  { value: 'Other', label: 'Other' }
];

export const EXECUTION_STATUSES = [
  { value: 'Pending', label: 'Pending' },
  { value: 'Running', label: 'Running' },
  { value: 'Passed', label: 'Passed' },
  { value: 'Failed', label: 'Failed' },
  { value: 'Skipped', label: 'Skipped' },
  { value: 'Error', label: 'Error' }
];

export const ENVIRONMENTS = [
  { value: 'Development', label: 'Development' },
  { value: 'Staging', label: 'Staging' },
  { value: 'Production', label: 'Production' },
  { value: 'Testing', label: 'Testing' }
];