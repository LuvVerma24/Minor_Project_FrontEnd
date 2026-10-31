import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarCheck,
  Award,
  Trophy,
  Sparkles,
  UserCheck,
  Bell,
  Copy,
  Check,
  RefreshCw,
  Users,
  BookOpen,
} from 'lucide-react';
import { classApi } from '../../api/classApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Skeleton from '../../components/common/Skeleton';
import Card, { CardBody } from '../../components/common/Card';
import AttendanceSummaryTable from '../../components/attendance/AttendanceSummaryTable';
import MarksSpreadsheet from '../../components/marks/MarksSpreadsheet';
import ResultView from '../../components/result/ResultView';
import PlannerGenerator from '../../components/planner/PlannerGenerator';
import PendingRequestsTable from '../../components/requests/PendingRequestsTable';
import NoticeList from '../../components/notices/NoticeList';

const ClassDashboard = () => {
  const { classId } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useSearchParams();
  const validTabs = ['attendance', 'marks', 'result', 'planner', 'requests', 'notices'];
  const tabFromUrl = searchParams.get('tab');
  const activeTab = validTabs.includes(tabFromUrl) ? tabFromUrl : 'attendance';

  const handleTabChange = (newTab) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (newTab === 'attendance') {
          next.delete('tab');
        } else {
          next.set('tab', newTab);
        }
        return next;
      },
      { replace: true }
    );
  };
  const [loading, setLoading] = useState(true);
  const [classroom, setClassroom] = useState(null);
  const [enrolledCount, setEnrolledCount] = useState(0);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [copiedCode, setCopiedCode] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  // Fetch Classroom Metadata
  const fetchClassDetails = async () => {
    if (!classId) return;
    setLoading(true);
    try {
      const res = await classApi.getClassDetails(classId);
      if (res?.classroom) {
        setClassroom(res.classroom);
        setEnrolledCount(res.enrolledCount || 0);
        setPendingRequestsCount(res.pendingRequestsCount || 0);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load classroom details.');
      navigate('/faculty');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassDetails();
  }, [classId]);

  const handleCopyJoinCode = () => {
    if (!classroom?.joinCode) return;
    navigator.clipboard.writeText(classroom.joinCode);
    setCopiedCode(true);
    toast.success(`Join code ${classroom.joinCode} copied!`);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleRegenerateCode = async () => {
    if (!window.confirm('Regenerate join code? The previous code will become invalid for new requests.')) {
      return;
    }

    setRegenerating(true);
    try {
      const res = await classApi.regenerateJoinCode(classId);
      toast.success('Join code regenerated successfully!');
      setClassroom((prev) => ({ ...prev, joinCode: res.joinCode }));
    } catch (err) {
      toast.error(err.message || 'Failed to regenerate join code.');
    } finally {
      setRegenerating(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <Skeleton height="120px" />
        <Skeleton height="350px" />
      </div>
    );
  }

  if (!classroom) {
    return null;
  }

  return (
    <div>
      {/* Back to Faculty Dashboard Breadcrumb */}
      <div style={{ marginBottom: '1rem' }}>
        <Link
          to="/faculty"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
            fontWeight: 500,
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to All Classes</span>
        </Link>
      </div>

      {/* Class Meta Banner */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.35rem',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: '1.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.25rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              {classroom.subjectName}
            </h1>
            <Badge variant="neutral">{classroom.year}</Badge>
            <Badge variant="neutral">Sec {classroom.section}</Badge>
          </div>

          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {classroom.department} • Capacity: {classroom.numberOfStudents} Students
          </div>
        </div>

        {/* Join Code Display Box */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
            padding: '0.65rem 1rem',
            backgroundColor: 'var(--bg-surface-subtle)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em' }}>
              Student Join Code
            </div>
            <div className="font-mono" style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-text)', letterSpacing: '0.15em' }}>
              {classroom.joinCode}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <Button
              id="copy-class-code-btn"
              variant="outline"
              size="sm"
              icon={copiedCode ? Check : Copy}
              onClick={handleCopyJoinCode}
              title="Copy join code"
            >
              {copiedCode ? 'Copied' : 'Copy'}
            </Button>
            <Button
              id="regen-class-code-btn"
              variant="ghost"
              size="icon"
              icon={RefreshCw}
              loading={regenerating}
              onClick={handleRegenerateCode}
              title="Regenerate join code"
            />
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="tab-list" role="tablist">
        <button
          id="tab-attendance"
          type="button"
          role="tab"
          className={`tab-item ${activeTab === 'attendance' ? 'active' : ''}`}
          onClick={() => handleTabChange('attendance')}
        >
          <CalendarCheck size={16} />
          <span>Attendance Register</span>
        </button>

        <button
          id="tab-marks"
          type="button"
          role="tab"
          className={`tab-item ${activeTab === 'marks' ? 'active' : ''}`}
          onClick={() => handleTabChange('marks')}
        >
          <Award size={16} />
          <span>Evaluation & Marks</span>
        </button>

        <button
          id="tab-result"
          type="button"
          role="tab"
          className={`tab-item ${activeTab === 'result' ? 'active' : ''}`}
          onClick={() => handleTabChange('result')}
        >
          <Trophy size={16} />
          <span>Merit & Result</span>
        </button>

        <button
          id="tab-planner"
          type="button"
          role="tab"
          className={`tab-item ${activeTab === 'planner' ? 'active' : ''}`}
          onClick={() => handleTabChange('planner')}
        >
          <Sparkles size={16} />
          <span>AI Syllabus Planner</span>
        </button>

        <button
          id="tab-requests"
          type="button"
          role="tab"
          className={`tab-item ${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => handleTabChange('requests')}
        >
          <UserCheck size={16} />
          <span>Join Requests</span>
          {pendingRequestsCount > 0 && (
            <Badge variant="pending" style={{ marginLeft: '0.25rem', fontSize: '0.7rem', padding: '1px 6px' }}>
              {pendingRequestsCount}
            </Badge>
          )}
        </button>

        <button
          id="tab-notices"
          type="button"
          role="tab"
          className={`tab-item ${activeTab === 'notices' ? 'active' : ''}`}
          onClick={() => handleTabChange('notices')}
        >
          <Bell size={16} />
          <span>Class Notices</span>
        </button>
      </div>

      {/* Active Tab Content Area */}
      <div style={{ marginTop: '1.25rem' }}>
        {activeTab === 'attendance' && (
          <AttendanceSummaryTable
            classroom={classroom}
            facultyName={user?.fullName}
          />
        )}

        {activeTab === 'marks' && (
          <MarksSpreadsheet classroom={classroom} />
        )}

        {activeTab === 'result' && (
          <ResultView
            classroom={classroom}
            facultyName={user?.fullName}
          />
        )}

        {activeTab === 'planner' && (
          <PlannerGenerator classroom={classroom} />
        )}

        {activeTab === 'requests' && (
          <PendingRequestsTable
            classroom={classroom}
            onRequestResolved={fetchClassDetails}
          />
        )}

        {activeTab === 'notices' && (
          <NoticeList classId={classroom._id} isTeacher={true} />
        )}
      </div>
    </div>
  );
};

export default ClassDashboard;
