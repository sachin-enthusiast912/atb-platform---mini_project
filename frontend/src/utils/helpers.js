export const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const getStatusColor = (status) => {
  const colors = {
    // Execution statuses
    'Passed': 'success',
    'Failed': 'danger',
    'Pending': 'warning',
    'Running': 'info',
    'Skipped': 'gray',
    'Error': 'danger',
    
    // Bug statuses
    'New': 'info',
    'In Progress': 'warning',
    'Fixed': 'success',
    'Verified': 'success',
    'Closed': 'gray',
    'Reopened': 'danger',
    
    // Priority levels
    'Critical': 'danger',
    'High': 'warning',
    'Medium': 'info',
    'Low': 'gray',
    
    // Test case statuses
    'Active': 'success',
    'Inactive': 'gray',
    'Deprecated': 'danger'
  };
  
  return colors[status] || 'gray';
};

export const getPriorityColor = (priority) => {
  const colors = {
    'Critical': 'danger',
    'High': 'warning',
    'Medium': 'info',
    'Low': 'gray'
  };
  return colors[priority] || 'gray';
};

export const truncate = (str, length = 50) => {
  if (!str) return '';
  return str.length > length ? str.substring(0, length) + '...' : str;
};

export const formatDuration = (seconds) => {
  if (!seconds) return '0s';
  
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}m ${secs}s`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
};

export const calculatePassRate = (passed, total) => {
  if (total === 0) return 0;
  return ((passed / total) * 100).toFixed(1);
};