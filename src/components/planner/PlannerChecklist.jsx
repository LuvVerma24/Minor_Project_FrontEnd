import React, { useState } from 'react';
import { CheckCircle2, Clock, SkipForward, AlertCircle } from 'lucide-react';
import { plannerApi } from '../../api/plannerApi';
import { useToast } from '../../context/ToastContext';
import Button from '../common/Button';
import Badge from '../common/Badge';

const PlannerChecklist = ({
  classId,
  days = [],
  onDayUpdated,
  isStudent = false,
}) => {
  const toast = useToast();
  const [updatingDayId, setUpdatingDayId] = useState(null);

  const handleStatusChange = async (day, newStatus) => {
    if (isStudent || day.status === newStatus) return;

    setUpdatingDayId(day._id || day.dayNumber);
    try {
      const res = await plannerApi.updateDayStatus({
        classId,
        dayId: day._id,
        dayNumber: day.dayNumber,
        status: newStatus,
      });

      toast.success(res.message || `Day ${day.dayNumber} updated to ${newStatus}.`);
      if (onDayUpdated) {
        onDayUpdated(res.day || { ...day, status: newStatus });
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update day status.');
    } finally {
      setUpdatingDayId(null);
    }
  };

  const total = days.length;
  const done = days.filter((d) => d.status === 'done').length;
  const skipped = days.filter((d) => d.status === 'skipped').length;
  const pending = days.filter((d) => d.status === 'pending').length;
  const percentage = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div>
      {/* Progress & Summary Bar */}
      <div
        style={{
          padding: '1.25rem',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Syllabus Completion Track
            </span>
            <span style={{ marginLeft: '0.75rem', fontSize: '1.15rem', fontWeight: 700, color: 'var(--accent-text)' }}>
              {percentage}%
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem' }}>
            <Badge variant="approved">{done} Completed</Badge>
            <Badge variant="pending">{pending} Pending</Badge>
            {skipped > 0 && <Badge variant="neutral">{skipped} Skipped</Badge>}
            <Badge variant="accent">{total} Total Days</Badge>
          </div>
        </div>

        {/* Progress Bar */}
        <div
          style={{
            width: '100%',
            height: '8px',
            backgroundColor: 'var(--bg-surface-subtle)',
            borderRadius: 'var(--radius-full)',
            overflow: 'hidden',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div
            style={{
              width: `${percentage}%`,
              height: '100%',
              backgroundColor: percentage === 100 ? '#10b981' : 'var(--accent-primary)',
              transition: 'width 300ms ease-in-out',
            }}
          />
        </div>
      </div>

      {/* Day-by-Day Checklist */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        {days.map((day) => {
          const isUpdating = updatingDayId === (day._id || day.dayNumber);
          const isDone = day.status === 'done';
          const isSkipped = day.status === 'skipped';

          return (
            <div
              key={day._id || day.dayNumber}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.85rem 1.1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: isDone
                  ? 'var(--bg-surface)'
                  : isSkipped
                  ? 'var(--bg-surface-subtle)'
                  : 'var(--bg-surface)',
                border: isDone
                  ? '1px solid var(--status-success-border)'
                  : isSkipped
                  ? '1px solid var(--border-subtle)'
                  : '1px solid var(--border-strong)',
                opacity: isSkipped ? 0.7 : 1,
                gap: '1rem',
                transition: 'all var(--transition-fast)',
              }}
            >
              {/* Day Number and Topic */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                <div
                  style={{
                    padding: '0.3rem 0.65rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: isDone
                      ? 'var(--status-success-bg)'
                      : isSkipped
                      ? 'var(--bg-surface-subtle)'
                      : 'var(--accent-subtle)',
                    color: isDone
                      ? 'var(--status-success-text)'
                      : isSkipped
                      ? 'var(--text-muted)'
                      : 'var(--accent-text)',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Day {day.dayNumber}
                </div>

                <div
                  style={{
                    fontSize: '0.9rem',
                    color: 'var(--text-primary)',
                    textDecoration: isDone ? 'none' : isSkipped ? 'line-through' : 'none',
                    fontWeight: isDone ? 500 : 400,
                  }}
                >
                  {day.topic}
                </div>
              </div>

              {/* Status Controls (Faculty Only) */}
              {!isStudent ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => handleStatusChange(day, 'done')}
                    className={`btn btn-sm ${isDone ? 'btn-primary' : 'btn-ghost'}`}
                    style={{
                      padding: '0.3rem 0.6rem',
                      fontSize: '0.78rem',
                      backgroundColor: isDone ? 'var(--status-success-text)' : undefined,
                      borderColor: isDone ? 'var(--status-success-text)' : undefined,
                      color: isDone ? '#ffffff' : undefined,
                    }}
                    title="Mark topic as completed"
                  >
                    <CheckCircle2 size={14} />
                    <span>Done</span>
                  </button>

                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => handleStatusChange(day, 'pending')}
                    className={`btn btn-sm ${day.status === 'pending' ? 'btn-secondary' : 'btn-ghost'}`}
                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}
                    title="Mark topic as pending"
                  >
                    <Clock size={14} />
                    <span>Pending</span>
                  </button>

                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => handleStatusChange(day, 'skipped')}
                    className={`btn btn-sm ${isSkipped ? 'btn-secondary' : 'btn-ghost'}`}
                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}
                    title="Skip this topic"
                  >
                    <SkipForward size={14} />
                    <span>Skip</span>
                  </button>
                </div>
              ) : (
                <Badge variant={isDone ? 'approved' : isSkipped ? 'neutral' : 'pending'}>
                  {day.status.toUpperCase()}
                </Badge>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PlannerChecklist;
