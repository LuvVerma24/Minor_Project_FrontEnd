import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Plus,
  BookOpen,
  CalendarCheck,
  Award,
  Bell,
  Search,
  CheckCircle2,
  Clock,
  User,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { classApi } from '../../api/classApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Card, { CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Input from '../../components/common/Input';
import Skeleton from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import JoinClassModal from './JoinClassModal';
import StudentClassModal from './StudentClassModal';

const StudentDashboard = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [enrolledClasses, setEnrolledClasses] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  // Modal inspection target
  const [selectedClassData, setSelectedClassData] = useState(null); // { classroom, enrolledRollNo, tab }

  const fetchStudentData = async () => {
    setLoading(true);
    try {
      const res = await classApi.getEnrolledClasses();
      if (res?.classes) {
        setEnrolledClasses(res.classes);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load your enrolled classes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, []);

  // Restore open modal and subtab from URL on refresh
  useEffect(() => {
    const classIdParam = searchParams.get('classId');
    const tabParam = searchParams.get('tab') || 'attendance';
    if (classIdParam && enrolledClasses.length > 0) {
      const match = enrolledClasses.find(
        (item) => item.classroom?._id === classIdParam || item.classroom === classIdParam
      );
      if (match && match.classroom) {
        setSelectedClassData({
          classroom: match.classroom,
          enrolledRollNo: match.rollNo,
          tab: tabParam,
        });
      }
    }
  }, [enrolledClasses, searchParams]);

  const handleJoinRequestSubmitted = (newRequest) => {
    // Add optimistic pending entry
    setPendingRequests((prev) => [newRequest, ...prev]);
    fetchStudentData();
  };

  const handleOpenClassTab = (classroom, rollNo, tab) => {
    setSelectedClassData({
      classroom,
      enrolledRollNo: rollNo,
      tab,
    });
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('classId', classroom._id);
        if (tab && tab !== 'attendance') {
          next.set('tab', tab);
        } else {
          next.delete('tab');
        }
        return next;
      },
      { replace: true }
    );
  };

  const handleCloseClassModal = () => {
    setSelectedClassData(null);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('classId');
        next.delete('tab');
        return next;
      },
      { replace: true }
    );
  };

  const handleModalTabChange = (newTab) => {
    setSelectedClassData((prev) => (prev ? { ...prev, tab: newTab } : prev));
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (newTab && newTab !== 'attendance') {
          next.set('tab', newTab);
        } else {
          next.delete('tab');
        }
        return next;
      },
      { replace: true }
    );
  };

  // Filter approved classes
  const filteredEnrolled = enrolledClasses.filter((item) => {
    const q = searchQuery.toLowerCase();
    const c = item.classroom || {};
    return (
      c.subjectName?.toLowerCase().includes(q) ||
      c.department?.toLowerCase().includes(q) ||
      c.facultyId?.fullName?.toLowerCase().includes(q) ||
      item.rollNo?.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      {/* Header Banner */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '2rem',
          paddingBottom: '1.25rem',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
            Student Academic Portal
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Logged in as <strong>{user?.fullName}</strong> — {user?.year}, Section {user?.section} ({user?.department})
          </p>
        </div>

        <Button
          id="student-add-class-btn"
          variant="primary"
          icon={Plus}
          onClick={() => setIsJoinModalOpen(true)}
        >
          Add / Join Class
        </Button>
      </div>

      {/* Quick Search & Summary */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ flex: 1, maxWidth: '380px' }}>
          <Input
            id="student-search-input"
            icon={Search}
            placeholder="Search your courses by name, faculty..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {enrolledClasses.length} {enrolledClasses.length === 1 ? 'Approved Course' : 'Approved Courses'}
        </div>
      </div>

      {/* Enrolled & Pending Classes List */}
      {loading ? (
        <div className="grid-cols-auto">
          <Skeleton height="200px" count={3} />
        </div>
      ) : enrolledClasses.length === 0 && pendingRequests.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={searchQuery ? 'No Courses Found' : 'No Enrolled Classes Yet'}
          description={
            searchQuery
              ? 'Try modifying your search keywords.'
              : 'Click "Add / Join Class" to enter the join code provided by your teacher.'
          }
          action={
            !searchQuery && (
              <Button
                variant="primary"
                icon={Plus}
                onClick={() => setIsJoinModalOpen(true)}
              >
                Join First Class
              </Button>
            )
          }
        />
      ) : (
        <div className="grid-cols-auto">
          {/* Pending Requests Cards */}
          {pendingRequests.map((req, idx) => (
            <Card
              key={req._id || idx}
              style={{
                border: '1px dashed var(--status-warning-border)',
                backgroundColor: 'var(--status-warning-bg)',
                opacity: 0.9,
              }}
            >
              <CardBody style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--status-warning-text)' }}>
                    Course Enrollment Request
                  </div>
                  <Badge variant="pending" icon={Clock}>
                    Pending Approval
                  </Badge>
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Roll No: <strong>{req.rollNo}</strong> • Scholar: {req.scholarNo}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Awaiting instructor verification. You will gain access once approved.
                </div>
              </CardBody>
            </Card>
          ))}

          {/* Approved & Enrolled Classes Cards */}
          {filteredEnrolled.map((item) => {
            const classroom = item.classroom || {};
            const faculty = classroom.facultyId || {};

            return (
              <Card
                key={item.enrollmentId}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <CardBody style={{ padding: '1.25rem' }}>
                  {/* Title and Approved Badge */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <div>
                      <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {classroom.subjectName}
                      </h3>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        Instructor: <strong>{faculty.fullName || 'Faculty Member'}</strong>
                      </div>
                    </div>

                    <Badge variant="approved" icon={CheckCircle2}>
                      Approved
                    </Badge>
                  </div>

                  {/* Metadata Tags */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', margin: '0.75rem 0' }}>
                    <Badge variant="accent">My Roll: {item.rollNo}</Badge>
                    <Badge variant="neutral">{classroom.year}</Badge>
                    <Badge variant="neutral">Sec {classroom.section}</Badge>
                  </div>

                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    {classroom.department}
                  </div>
                </CardBody>

                {/* 3 Dedicated Action Buttons */}
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    borderTop: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-surface-subtle)',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '0.4rem',
                  }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    icon={CalendarCheck}
                    onClick={() => handleOpenClassTab(classroom, item.rollNo, 'attendance')}
                    style={{ fontSize: '0.75rem', padding: '0.35rem 0.4rem' }}
                    title="View your attendance statistics"
                  >
                    Attendance
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    icon={Award}
                    onClick={() => handleOpenClassTab(classroom, item.rollNo, 'marks')}
                    style={{ fontSize: '0.75rem', padding: '0.35rem 0.4rem' }}
                    title="See your exam marks"
                  >
                    See Marks
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    icon={Bell}
                    onClick={() => handleOpenClassTab(classroom, item.rollNo, 'notices')}
                    style={{ fontSize: '0.75rem', padding: '0.35rem 0.4rem' }}
                    title="Check class notices and updates"
                  >
                    See Notice
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Join Class Modal */}
      <JoinClassModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        studentUser={user}
        onRequestSubmitted={handleJoinRequestSubmitted}
      />

      {/* Student Course Details Modal (Attendance, Marks, Notices) */}
      {selectedClassData && (
        <StudentClassModal
          isOpen={!!selectedClassData}
          onClose={handleCloseClassModal}
          classroom={selectedClassData.classroom}
          enrolledRollNo={selectedClassData.enrolledRollNo}
          initialTab={selectedClassData.tab}
          onTabChange={handleModalTabChange}
        />
      )}
    </div>
  );
};

export default StudentDashboard;
