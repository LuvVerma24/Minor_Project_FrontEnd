import apiClient from './client';

export const noticeApi = {
  // Teacher: Create notice
  createNotice: async (data) => {
    return apiClient.post('/notices', data);
  },

  // Both: List notices for a class (paginated)
  listNotices: async (classId, params = {}) => {
    return apiClient.get(`/notices/${classId}`, { params });
  },

  // Student: Mark notice as read
  markNoticeRead: async (noticeId) => {
    return apiClient.post(`/notices/${noticeId}/read`);
  },
};
