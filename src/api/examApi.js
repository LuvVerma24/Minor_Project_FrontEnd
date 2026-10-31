import apiClient from './client';

export const examApi = {
  // Teacher: Create exam column for class
  createExam: async (data) => {
    return apiClient.post('/exams', data);
  },

  // Both: List exams for class
  listExams: async (classId, params = {}) => {
    return apiClient.get(`/exams/${classId}`, { params });
  },

  // Teacher: Submit marks for an exam
  submitMarks: async (data) => {
    return apiClient.post('/marks', data);
  },

  // Teacher: Edit a student's marks
  editMarks: async (data) => {
    return apiClient.put('/marks', data);
  },

  // Both: Get marks (supports examId, rollNo, page, limit)
  getMarks: async (classId, params = {}) => {
    return apiClient.get(`/marks/${classId}`, { params });
  },
};
