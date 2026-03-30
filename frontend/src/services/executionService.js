import api from './api';

export const executionService = {
  async getAll(filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await api.get(`/api/executions?${params}`);
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/api/executions/${id}`);
    return response.data;
  },

  async create(data) {
    const response = await api.post('/api/executions', data);
    return response.data;
  },

  async update(id, data) {
    const response = await api.put(`/api/executions/${id}`, data);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/api/executions/${id}`);
    return response.data;
  }
};