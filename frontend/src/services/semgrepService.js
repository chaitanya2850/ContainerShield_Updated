import api from './api';

export const scanProject = async (path, projectName) => {
  const response = await api.get('/api/semgrep/scan', {
    params: {
      path,
      projectName
    }
  });
  return response.data;
};
