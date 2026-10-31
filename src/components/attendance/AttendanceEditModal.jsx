import React, { useState, useEffect } from 'react';
import { Edit2, Calendar, User, Save } from 'lucide-react';
import { attendanceApi } from '../../api/attendanceApi';
import { useToast } from '../../context/ToastContext';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';

const AttendanceEditModal = ({
  isOpen,
  onClose,
  classroom,
  initialRecord, // { rollNo, date, status }
  onRecordUpdated,
}) => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [rollNo, setRollNo] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState('present');

  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      if (initialRecord) {
        setRollNo(initialRecord.rollNo || '');
        if (initialRecord.date) {
          const d = new Date(initialRecord.date);
          setDate(d.toISOString().split('T')[0]);
        }
        setStatus(initialRecord.status || 'present');
      }
    }
  }, [isOpen, initialRecord]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!rollNo || !date || !status) {
      setErrorMessage('All fields are required.');
      return;
    }

    setLoading(true);
    try {
      const res = await attendanceApi.editAttendance({
        classId: classroom._id,
        rollNo: rollNo.toString().trim(),
        date,
        status,
      });

      toast.success(res.message || 'Attendance record updated successfully.');
      onRecordUpdated();
      onClose();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update attendance record.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Individual Attendance Record"
      subtitle="Modify attendance status for a specific roll number and date."
      size="md"
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
        <Input
          id="edit-attendance-roll"
          label="Student Roll Number"
          icon={User}
          value={rollNo}
          onChange={(e) => setRollNo(e.target.value)}
          placeholder="e.g. 101"
          required
        />

        <Input
          id="edit-attendance-date"
          label="Date of Attendance"
          type="date"
          icon={Calendar}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />

        <Select
          id="edit-attendance-status"
          label="Attendance Status"
          options={[
            { value: 'present', label: 'Present' },
            { value: 'absent', label: 'Absent' },
          ]}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          placeholder="Select Status..."
          required
        />

        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            id="edit-attendance-submit"
            type="submit"
            variant="primary"
            icon={Save}
            loading={loading}
          >
            Update Record
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AttendanceEditModal;
