import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Award,
  Bell,
  Sparkles,
  BookOpen,
  User,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { attendanceApi } from '../../api/attendanceApi';
import { examApi } from '../../api/examApi';
import { plannerApi } from '../../api/plannerApi';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Skeleton from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import NoticeList from '../../components/notices/NoticeList';
import PlannerChecklist from '../../components/planner/PlannerChecklist';

const StudentClassModal = ({
  isOpen,
  onClose,
  classroom,
  enrolledRollNo,
  initialTab = 'attendance', // 'attendance' | 'marks' | 'notices' | 'planner'
  onTabChange,
}) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState(initialTab);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  // Data states
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  const [marks, setMarks] = useState([]);
  const [marksLoading, setMarksLoading] = useState(false);

  const [plannerDays, setPlannerDays] = useState([]);
  const [plannerLoading, setPlannerLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Load Attendance
  const fetchAttendance = async () => {
    if (!classroom?._id) return;
    setAttendanceLoading(true);
    try {
      const res = await attendanceApi.getAttendanceHistory(classroom._id, { limit: 100 });
      setAttendanceSummary(res.studentSummary || null);
      setAttendanceLogs(res.items || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load your attendance record.');
    } finally {
      setAttendanceLoading(false);
    }
  };

  // Load Marks
  const fetchMarks = async () => {
    if (!classroom?._id) return;
    setMarksLoading(true);
    try {
      const res = await examApi.getMarks(classroom._id, { limit: 100 });
      setMarks(res.items || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load your exam marks.');
    } finally {
      setMarksLoading(false);
    }
  };

  // Load Syllabus Planner
  const fetchPlanner = async () => {
    if (!classroom?._id) return;
    setPlannerLoading(true);
    try {
      const res = await plannerApi.getPlanner(classroom._id);
      setPlannerDays(res.days || []);
    } catch (err) {
      console.log('No syllabus plan found.');
    } finally {
      setPlannerLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && classroom?._id) {
      if (activeTab === 'attendance') fetchAttendance();
      if (activeTab === 'marks') fetchMarks();
      if (activeTab === 'planner') fetchPlanner();
    }
  }, [isOpen, classroom?._id, activeTab]);

  if (!classroom) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={classroom.subjectName}
      subtitle={`Instructor: ${classroom.facultyId?.fullName || 'Faculty'} • Roll No: ${enrolledRollNo || '—'}`}
      size="xl"
    >
      {/* 3 Main Quick Action Tabs (+ Planner) */}
      <div className="tab-list" role="tablist" style={{ marginBottom: '1.25rem' }}>
        <button
          type="button"
          role="tab"
          className={`tab-item ${activeTab === 'attendance' ? 'active' : ''}`}
          onClick={() => handleTabClick('attendance')}
        >
          <CalendarCheck size={16} />
          <span>View Attendance</span>
        </button>

        <button
          type="button"
          role="tab"
          className={`tab-item ${activeTab === 'marks' ? 'active' : ''}`}
          onClick={() => handleTabClick('marks')}
        >
          <Award size={16} />
          <span>See Marks</span>
        </button>

        <button
          type="button"
          role="tab"
          className={`tab-item ${activeTab === 'notices' ? 'active' : ''}`}
          onClick={() => handleTabClick('notices')}
        >
          <Bell size={16} />
          <span>See Notices</span>
        </button>

        <button
          type="button"
          role="tab"
          className={`tab-item ${activeTab === 'planner' ? 'active' : ''}`}
          onClick={() => handleTabClick('planner')}
        >
          <Sparkles size={16} />
          <span>Syllabus Schedule</span>
        </button>
      </div>

      {/* TAB 1: ATTENDANCE */}
      {activeTab === 'attendance' && (
        <div>
          {attendanceLoading ? (
            <Skeleton height="240px" />
          ) : attendanceSummary ? (
            <div>
              {/* Summary Cards */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '0.85rem',
                  marginBottom: '1.5rem',
                }}
              >
                <div
                  style={{
                    padding: '1rem',
                    backgroundColor: 'var(--bg-surface-subtle)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                    Total Sessions
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {attendanceSummary.totalClasses}
                  </div>
                </div>

                <div
                  style={{
                    padding: '1rem',
                    backgroundColor: 'var(--status-success-bg)',
                    border: '1px solid var(--status-success-border)',
                    borderRadius: 'var(--radius-md)',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', color: 'var(--status-success-text)', fontWeight: 600, textTransform: 'uppercase' }}>
                    Days Attended
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--status-success-text)' }}>
                    {attendanceSummary.presentClasses}
                  </div>
                </div>

                <div
                  style={{
                    padding: '1rem',
                    backgroundColor: 'var(--status-danger-bg)',
                    border: '1px solid var(--status-danger-border)',
                    borderRadius: 'var(--radius-md)',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', color: 'var(--status-danger-text)', fontWeight: 600, textTransform: 'uppercase' }}>
                    Days Absent
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--status-danger-text)' }}>
                    {attendanceSummary.absentClasses}
                  </div>
                </div>

                <div
                  style={{
                    padding: '1rem',
                    backgroundColor: attendanceSummary.percentage >= 75 ? 'var(--status-success-bg)' : 'var(--status-warning-bg)',
                    border: `1px solid ${attendanceSummary.percentage >= 75 ? 'var(--status-success-border)' : 'var(--status-warning-border)'}`,
                    borderRadius: 'var(--radius-md)',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: attendanceSummary.percentage >= 75 ? 'var(--status-success-text)' : 'var(--status-warning-text)' }}>
                    Attendance %
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: attendanceSummary.percentage >= 75 ? 'var(--status-success-text)' : 'var(--status-warning-text)' }}>
                    {attendanceSummary.percentage}%
                  </div>
                </div>
              </div>

              {/* Attendance Log Table */}
              <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', marginBottom: '0.65rem' }}>
                Your Attendance History
              </h4>
              {attendanceLogs.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No individual attendance records recorded yet.</p>
              ) : (
                <div className="table-container" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Session Date</th>
                        <th>Status</th>
                        <th>Recorded At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceLogs.map((log) => (
                        <tr key={log._id}>
                          <td>
                            {new Date(log.date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </td>
                          <td>
                            <Badge variant={log.status === 'present' ? 'approved' : 'rejected'}>
                              {log.status === 'present' ? 'Present' : 'Absent'}
                            </Badge>
                          </td>
                          <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {new Date(log.createdAt || log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <EmptyState
              icon={CalendarCheck}
              title="No Attendance Data Available"
              description="Your instructor has not yet submitted attendance for this class."
            />
          )}
        </div>
      )}

      {/* TAB 2: MARKS */}
      {activeTab === 'marks' && (
        <div>
          {marksLoading ? (
            <Skeleton height="200px" />
          ) : marks.length === 0 ? (
            <EmptyState
              icon={Award}
              title="No Marks Published"
              description="Your instructor has not yet graded or entered examination marks for your roll number."
            />
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Assessment / Exam Title</th>
                    <th className="col-numeric">Maximum Marks</th>
                    <th className="col-numeric">Marks Obtained</th>
                    <th className="col-numeric">Score %</th>
                    <th style={{ textAlign: 'center' }}>Grade Status</th>
                  </tr>
                </thead>
                <tbody>
                  {marks.map((m) => {
                    const exam = m.examId || {};
                    const max = exam.maxMarks || 100;
                    const obtained = m.marksObtained;
                    const pct = max > 0 ? Number(((obtained / max) * 100).toFixed(1)) : 0;

                    return (
                      <tr key={m._id}>
                        <td style={{ fontWeight: 600 }}>{exam.examName || 'Assessment'}</td>
                        <td className="col-numeric">{max}</td>
                        <td className="col-numeric" style={{ fontWeight: 700, color: 'var(--accent-text)' }}>
                          {obtained}
                        </td>
                        <td className="col-numeric" style={{ fontWeight: 600 }}>
                          {pct}%
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <Badge variant={pct >= 40 ? 'approved' : 'rejected'}>
                            {pct >= 40 ? 'Passed' : 'Needs Improvement'}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: NOTICES */}
      {activeTab === 'notices' && (
        <NoticeList classId={classroom._id} isStudent={true} />
      )}

      {/* TAB 4: SYLLABUS PLANNER */}
      {activeTab === 'planner' && (
        <div>
          {plannerLoading ? (
            <Skeleton height="220px" />
          ) : plannerDays.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="No Syllabus Plan Available"
              description="Your instructor has not yet generated a day-by-day syllabus plan for this course."
            />
          ) : (
            <PlannerChecklist
              classId={classroom._id}
              days={plannerDays}
              isStudent={true}
            />
          )}
        </div>
      )}
    </Modal>
  );
};

export default StudentClassModal;
