import apiClient from './client';

export const classApi = {
  // Teacher: Create class (server generates joinCode)
  createClass: async (data) => {
    return apiClient.post('/classes', data);
  },

  // Teacher: Get all classes taught by teacher
  getTeacherClasses: async () => {
    return apiClient.get('/classes');
  },

  // Both: Get single classroom details
  getClassDetails: async (classId) => {
    return apiClient.get(`/classes/${classId}`);
  },

  // Teacher: Regenerate join code
  regenerateJoinCode: async (classId) => {
    return apiClient.post(`/classes/${classId}/regenerate-code`, { classId });
  },

  // Student: Get enrolled classes
  getEnrolledClasses: async () => {
    return apiClient.get('/classes/enrolled');
  },

  // Student: Submit join request
  requestJoinClass: async (data) => {
    return apiClient.post('/classes/join-request', data);
  },

  // Teacher: List join requests for class (paginated, optional status)
  listJoinRequests: async (classId, params = {}) => {
    return apiClient.get(`/classes/${classId}/join-requests`, { params });
  },

  // Teacher: Approve or reject join request
  respondJoinRequest: async (data) => {
    return apiClient.post('/classes/join-requests/respond', data);
  },
};
