import api from './api';

export const bugService = {
  async getAll(filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await api.get(`/api/bugs?${params}`);
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/api/bugs/${id}`);
    return response.data;
  },

  async create(data) {
    const response = await api.post('/api/bugs', data);
    return response.data;
  },

  async update(id, data) {
    const response = await api.put(`/api/bugs/${id}`, data);
    return response.data;
  },

  async addComment(id, text) {
    const response = await api.post(`/api/bugs/${id}/comments`, { text });
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/api/bugs/${id}`);
    return response.data;
  }
};