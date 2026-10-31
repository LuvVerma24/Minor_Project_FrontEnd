import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  BookOpen,
  Users,
  Copy,
  Check,
  RefreshCw,
  Search,
  ChevronRight,
  UserCheck,
  GraduationCap,
  Calendar,
  AlertCircle,
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
import CreateClassModal from './CreateClassModal';

const FacultyDashboard = () => {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);
  const [regeneratingId, setRegeneratingId] = useState(null);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const res = await classApi.getTeacherClasses();
      if (res?.classes) {
        setClasses(res.classes);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load your classes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  // Copy join code to clipboard
  const handleCopyJoinCode = (e, code) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Join code ${code} copied to clipboard.`);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // Regenerate join code
  const handleRegenerateCode = async (e, classId) => {
    e.stopPropagation();
    if (!window.confirm('Regenerate join code? The old code will immediately stop working for new student requests.')) {
      return;
    }

    setRegeneratingId(classId);
    try {
      const res = await classApi.regenerateJoinCode(classId);
      toast.success('Join code regenerated successfully!');
      setClasses((prev) =>
        prev.map((c) => (c._id === classId ? { ...c, joinCode: res.joinCode } : c))
      );
    } catch (err) {
      toast.error(err.message || 'Failed to regenerate join code.');
    } finally {
      setRegeneratingId(null);
    }
  };

  const handleClassCreated = (newClass) => {
    setClasses((prev) => [
      {
        ...newClass,
        enrolledCount: 0,
        pendingRequestsCount: 0,
      },
      ...prev,
    ]);
  };

  // Filter classes by subject, department, year or section
  const filteredClasses = classes.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.subjectName?.toLowerCase().includes(q) ||
      c.department?.toLowerCase().includes(q) ||
      c.year?.toLowerCase().includes(q) ||
      c.section?.toLowerCase().includes(q) ||
      c.joinCode?.toLowerCase().includes(q)
    );
  });

  // Calculate totals
  const totalStudents = classes.reduce((sum, c) => sum + (c.enrolledCount || 0), 0);
  const totalPending = classes.reduce((sum, c) => sum + (c.pendingRequestsCount || 0), 0);

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
            Faculty Course Management
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Welcome back, <strong>{user?.fullName}</strong> — {user?.post || 'Faculty'}, {user?.department}
          </p>
        </div>

        <Button
          id="open-create-class-modal-btn"
          variant="primary"
          icon={Plus}
          onClick={() => setIsCreateModalOpen(true)}
        >
          Create New Class
        </Button>
      </div>

      {/* Summary Stat Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <Card>
          <CardBody style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--accent-subtle)',
                color: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BookOpen size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase' }}>
                Active Classes
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {loading ? <Skeleton width="40px" height="28px" /> : classes.length}
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--status-success-bg)',
                color: 'var(--status-success-text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Users size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase' }}>
                Enrolled Students
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {loading ? <Skeleton width="40px" height="28px" /> : totalStudents}
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: totalPending > 0 ? 'var(--status-warning-bg)' : 'var(--bg-surface-subtle)',
                color: totalPending > 0 ? 'var(--status-warning-text)' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <UserCheck size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase' }}>
                Pending Approvals
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {loading ? <Skeleton width="40px" height="28px" /> : totalPending}
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Search & Filter Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '1.25rem',
        }}
      >
        <div style={{ flex: 1, maxWidth: '400px' }}>
          <Input
            id="class-search-input"
            icon={Search}
            placeholder="Search classes by subject, code, year..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Classes Grid */}
      {loading ? (
        <div className="grid-cols-auto">
          <Skeleton height="180px" count={3} />
        </div>
      ) : filteredClasses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={searchQuery ? 'No matching classes found' : 'No classes created yet'}
          description={
            searchQuery
              ? 'Try modifying your search keywords.'
              : 'Create your first classroom to begin taking attendance, generating AI syllabus plans, and grading.'
          }
          action={
            !searchQuery && (
              <Button
                variant="primary"
                icon={Plus}
                onClick={() => setIsCreateModalOpen(true)}
              >
                Create First Class
              </Button>
            )
          }
        />
      ) : (
        <div className="grid-cols-auto">
          {filteredClasses.map((item) => (
            <Card
              key={item._id}
              onClick={() => navigate(`/faculty/class/${item._id}`)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 150ms ease, box-shadow 150ms ease, border-color 150ms ease',
              }}
              className="faculty-class-card"
            >
              <CardBody style={{ padding: '1.25rem' }}>
                {/* Header with Title & Pending Badge */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <h3
                      style={{
                        fontFamily: 'var(--font-serif)',
                        fontSize: '1.15rem',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        lineHeight: 1.3,
                      }}
                    >
                      {item.subjectName}
                    </h3>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      {item.department}
                    </div>
                  </div>

                  {item.pendingRequestsCount > 0 && (
                    <Badge variant="pending" title={`${item.pendingRequestsCount} pending requests`}>
                      {item.pendingRequestsCount} Pending
                    </Badge>
                  )}
                </div>

                {/* Badges: Year, Section, Enrolled */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', margin: '0.85rem 0' }}>
                  <Badge variant="neutral">{item.year}</Badge>
                  <Badge variant="neutral">Sec: {item.section}</Badge>
                  <Badge variant="accent">
                    {item.enrolledCount || 0} / {item.numberOfStudents} Students
                  </Badge>
                </div>

                {/* Join Code Box */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.55rem 0.75rem',
                    backgroundColor: 'var(--bg-surface-subtle)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    marginTop: '0.75rem',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                      Student Join Code
                    </span>
                    <span className="font-mono" style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-text)', letterSpacing: '0.15em' }}>
                      {item.joinCode}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={copiedCode === item.joinCode ? Check : Copy}
                      onClick={(e) => handleCopyJoinCode(e, item.joinCode)}
                      title="Copy join code to share with students"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={RefreshCw}
                      loading={regeneratingId === item._id}
                      onClick={(e) => handleRegenerateCode(e, item._id)}
                      title="Regenerate join code"
                    />
                  </div>
                </div>
              </CardBody>

              <div
                style={{
                  padding: '0.75rem 1.25rem',
                  borderTop: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-surface-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.82rem',
                  color: 'var(--accent-text)',
                  fontWeight: 500,
                }}
              >
                <span>Open Class Dashboard</span>
                <ChevronRight size={16} />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Class Modal */}
      <CreateClassModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onClassCreated={handleClassCreated}
        defaultDepartment={user?.department}
      />
    </div>
  );
};

export default FacultyDashboard;
