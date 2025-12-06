import api from './api';

export const fileService = {
  // Upload single file
  uploadFile: async (category, file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post(`/files/upload/${category}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Upload multiple files
  uploadMultipleFiles: async (category, files) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await api.post(`/files/upload-multiple/${category}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Delete file
  deleteFile: async (category, filename) => {
    const response = await api.delete(`/files/delete/${category}/${filename}`);
    return response.data;
  },

  // Get file URL
  getFileUrl: (filePath) => {
    return `http://localhost:8000${filePath}`;
  },
};