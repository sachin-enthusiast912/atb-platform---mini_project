import api from './api';

export const dashboardService = {
  async getStats() {
    const response = await api.get('/api/dashboard/stats');
    return response.data;
  },

  async getRecentActivity(limit = 10) {
    const response = await api.get(`/api/dashboard/recent-activity?limit=${limit}`);
    return response.data;
  },

  async getTrends(days = 7) {
    const response = await api.get(`/api/dashboard/trends?days=${days}`);
    return response.data;
  }
};