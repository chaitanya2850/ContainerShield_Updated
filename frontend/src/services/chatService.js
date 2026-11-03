import api from './api';

export const askAssistant = async (projectOrImageName, question) => {
  const response = await api.post('/api/chat', {
    projectOrImageName,
    question
  });
  return response.data;
};
