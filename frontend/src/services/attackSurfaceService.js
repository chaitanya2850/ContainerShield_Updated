import api from './api';

export const getAttackSurfaceFindings = async () => {
  const response = await api.get('/api/attack-surface/analyze');
  return response.data;
};

export const getSecurityCorrelations = async () => {
  const response = await api.get('/api/attack-surface/correlations');
  return response.data;
};

export const getContainerRiskAssessments = async () => {
  const response = await api.get('/api/attack-surface/risk-assessment');
  return response.data;
};

export const getEnvironmentSecurityPosture = async () => {
  const response = await api.get('/api/attack-surface/environment-posture');
  return response.data;
};

export const getSecurityPriorities = async () => {
  const response = await api.get('/api/attack-surface/priorities');
  return response.data;
};
