import apiClient from './client';

export const attendanceApi = {
  // Teacher: Submit today's attendance for list of roll numbers
  submitAttendance: async (data) => {
    return apiClient.post('/attendance', data);
  },

  // Teacher: Edit a single attendance record
  editAttendance: async (data) => {
    return apiClient.put('/attendance', data);
  },

  // Both: Get attendance history (supports date, rollNo, page, limit)
  getAttendanceHistory: async (classId, params = {}) => {
    return apiClient.get(`/attendance/${classId}`, { params });
  },
};
