import api from './api';

export const scanImage = async (imageName) => {
  const response = await api.get('/api/trivy/scan', {
    params: { image: imageName }
  });
  return response.data;
};

export const scanWithManifest = async (imageName, manifestFile) => {
  const formData = new FormData();
  formData.append('manifest', manifestFile);

  const response = await api.post('/api/trivy/scan-with-manifest', formData, {
    params: { image: imageName },
    headers: {
      'Content-Type': 'multipart/form-data',
    }
  });
  return response.data;
};
