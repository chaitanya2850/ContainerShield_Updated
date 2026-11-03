import api from './api';

export const getAllScans = async () => {
  const response = await api.get('/api/scans');
  return response.data;
};

export const getScanDetails = async (id) => {
  const response = await api.get(`/api/scans/${id}`);
  return response.data;
};
