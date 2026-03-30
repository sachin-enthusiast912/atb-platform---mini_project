import api from './api';

export const testCaseService = {
  async getAll(filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await api.get(`/api/testcases?${params}`);
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/api/testcases/${id}`);
    return response.data;
  },

  async create(data) {
    const response = await api.post('/api/testcases', data);
    return response.data;
  },

  async update(id, data) {
    const response = await api.put(`/api/testcases/${id}`, data);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/api/testcases/${id}`);
    return response.data;
  }
};