import api from './api';

export async function getRuntimeSecurityFindings() {
  const response = await api.get('/api/runtime-security/analyze');
  return response.data;
}