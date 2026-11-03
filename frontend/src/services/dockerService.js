import api from './api';

export const getRunningContainers = async () => {
  const response = await api.get('/api/docker/containers/running');
  return response.data;
};

export const getAllContainers = async () => {
  const response = await api.get('/api/docker/containers/all');
  return response.data;
};

export const getDockerImages = async () => {
  const response = await api.get('/api/docker/images');
  return response.data;
};
