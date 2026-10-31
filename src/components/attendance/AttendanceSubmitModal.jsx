import React, { useState, useEffect } from 'react';
import { Calendar, Check, X, CheckSquare, Square, Save } from 'lucide-react';
import { attendanceApi } from '../../api/attendanceApi';
import { useToast } from '../../context/ToastContext';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';

const AttendanceSubmitModal = ({
  isOpen,
  onClose,
  classroom,
  enrolledStudents = [],
  onSubmitted,
}) => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [attendanceMap, setAttendanceMap] = useState({}); // { [rollNo]: 'present' | 'absent' }
  const [errorMessage, setErrorMessage] = useState('');

  // Determine list of roll numbers: from enrolled students or default capacity 1..numberOfStudents
  const rollNumbers = React.useMemo(() => {
    if (enrolledStudents && enrolledStudents.length > 0) {
      const rolls = enrolledStudents.map((s) => s.rollNo.toString().trim());
      // Sort roll numbers numerically if possible
      return [...new Set(rolls)].sort((a, b) => {
        const na = parseInt(a, 10);
        const nb = parseInt(b, 10);
        return !isNaN(na) && !isNaN(nb) ? na - nb : a.localeCompare(b);
      });
    }

    const count = classroom?.numberOfStudents || 60;
    return Array.from({ length: count }, (_, i) => (i + 1).toString());
  }, [enrolledStudents, classroom]);

  // Default all students to present when opened
  useEffect(() => {
    if (isOpen) {
      const initial = {};
      rollNumbers.forEach((r) => {
        initial[r] = 'present';
      });
      setAttendanceMap(initial);
      setErrorMessage('');
    }
  }, [isOpen, rollNumbers]);

  const toggleStatus = (roll) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [roll]: prev[roll] === 'present' ? 'absent' : 'present',
    }));
  };

  const markAll = (status) => {
    const updated = {};
    rollNumbers.forEach((r) => {
      updated[r] = status;
    });
    setAttendanceMap(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const records = rollNumbers.map((r) => ({
      rollNo: r,
      status: attendanceMap[r] || 'present',
    }));

    if (records.length === 0) {
      setErrorMessage('No student roll numbers available to submit.');
      return;
    }

    setLoading(true);
    try {
      const res = await attendanceApi.submitAttendance({
        classId: classroom._id,
        date,
        records,
      });

      toast.success(res.message || `Attendance submitted for ${records.length} students!`);
      onSubmitted();
      onClose();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to submit attendance.');
    } finally {
      setLoading(false);
    }
  };

  const presentCount = Object.values(attendanceMap).filter((s) => s === 'present').length;
  const absentCount = rollNumbers.length - presentCount;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Submit Daily Attendance"
      subtitle={`${classroom?.subjectName} — ${classroom?.year} (Sec ${classroom?.section})`}
      size="lg"
    >
      {errorMessage && (
        <div
          style={{
            padding: '0.75rem 0.85rem',
            backgroundColor: 'var(--status-danger-bg)',
            border: '1px solid var(--status-danger-border)',
            color: 'var(--status-danger-text)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.85rem',
            marginBottom: '1rem',
          }}
          role="alert"
        >
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Top Controls: Date picker & Quick toggles */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            padding: '0.85rem 1rem',
            backgroundColor: 'var(--bg-surface-subtle)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.25rem',
          }}
        >
          <div style={{ maxWidth: '200px' }}>
            <Input
              id="attendance-date-input"
              label="Session Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="mb-0"
            />
          </div>

          {/* Quick action buttons & summary */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={CheckSquare}
              onClick={() => markAll('present')}
            >
              All Present
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={Square}
              onClick={() => markAll('absent')}
            >
              All Absent
            </Button>

            <div style={{ marginLeft: '0.5rem', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              <span style={{ color: 'var(--status-success-text)', marginRight: '0.5rem' }}>
                Present: {presentCount}
              </span>
              <span style={{ color: 'var(--status-danger-text)' }}>
                Absent: {absentCount}
              </span>
            </div>
          </div>
        </div>

        {/* Roll numbers grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))',
            gap: '0.65rem',
            maxHeight: '380px',
            overflowY: 'auto',
            padding: '0.5rem',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-surface)',
          }}
        >
          {rollNumbers.map((roll) => {
            const isPresent = attendanceMap[roll] === 'present';
            return (
              <button
                key={roll}
                type="button"
                onClick={() => toggleStatus(roll)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.55rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: isPresent
                    ? '1px solid var(--status-success-border)'
                    : '1px solid var(--status-danger-border)',
                  backgroundColor: isPresent ? 'var(--status-success-bg)' : 'var(--status-danger-bg)',
                  color: isPresent ? 'var(--status-success-text)' : 'var(--status-danger-text)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <span>Roll {roll}</span>
                {isPresent ? <Check size={16} /> : <X size={16} />}
              </button>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            id="attendance-submit-save-btn"
            type="submit"
            variant="primary"
            icon={Save}
            loading={loading}
          >
            Submit Today's Attendance
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AttendanceSubmitModal;
