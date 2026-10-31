import apiClient from './client';

export const plannerApi = {
  // Teacher: Generate or load cached syllabus planner
  generatePlanner: async (data) => {
    return apiClient.post('/planner/generate', data);
  },

  // Both: Get full syllabus planner for a class
  getPlanner: async (classId) => {
    return apiClient.get(`/planner/${classId}`);
  },

  // Teacher: Update day status (pending, done, skipped)
  updateDayStatus: async (data) => {
    return apiClient.patch('/planner/day', data);
  },
};
