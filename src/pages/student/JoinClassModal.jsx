import React, { useState } from 'react';
import { PlusCircle, KeyRound, User, Hash, Building2, Calendar } from 'lucide-react';
import { classApi } from '../../api/classApi';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';

const DEPARTMENT_OPTIONS = [
  'Computer Science & Engineering',
  'Information Technology',
  'Electronics & Communication',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Chemical Engineering',
  'Applied Sciences & Humanities',
  'Management Studies',
];

const YEAR_OPTIONS = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'M.Tech 1st Year', 'M.Tech 2nd Year'];

const JoinClassModal = ({ isOpen, onClose, studentUser, onRequestSubmitted }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState({
    joinCode: '',
    year: studentUser?.year || '',
    department: studentUser?.department || '',
    scholarNo: '',
    rollNo: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'joinCode' ? value.toUpperCase() : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.joinCode || !formData.year || !formData.department || !formData.scholarNo || !formData.rollNo) {
      setErrorMessage('All fields are required.');
      return;
    }

    setLoading(true);
    try {
      const res = await classApi.requestJoinClass({
        joinCode: formData.joinCode.trim(),
        year: formData.year.trim(),
        department: formData.department.trim(),
        scholarNo: formData.scholarNo.trim(),
        rollNo: formData.rollNo.trim(),
      });

      toast.success(res.message || 'Join request submitted! Awaiting instructor approval.');
      if (onRequestSubmitted) {
        onRequestSubmitted(res.joinRequest);
      }
      onClose();
      setFormData({
        joinCode: '',
        year: studentUser?.year || '',
        department: studentUser?.department || '',
        scholarNo: '',
        rollNo: '',
      });
    } catch (err) {
      setErrorMessage(err.message || 'Failed to submit join request. Please verify the join code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Enroll in Course / Add Class"
      subtitle="Provide the unique 6-character Join Code given by your course instructor."
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
          id="student-join-code-input"
          name="joinCode"
          label="Course Join Code"
          icon={KeyRound}
          placeholder="e.g. 7X9K2A"
          maxLength={6}
          value={formData.joinCode}
          onChange={handleChange}
          required
          autoFocus
          style={{ letterSpacing: '0.2em', fontWeight: 700, textTransform: 'uppercase' }}
          hint="Case-insensitive 6-character alphanumeric code."
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <Input
            id="student-roll-input"
            name="rollNo"
            label="Your Roll Number"
            icon={User}
            placeholder="e.g. 21"
            value={formData.rollNo}
            onChange={handleChange}
            required
            hint="Must match your institutional roll"
          />

          <Input
            id="student-scholar-input"
            name="scholarNo"
            label="Scholar / Registration No."
            icon={Hash}
            placeholder="e.g. SCH-2024-049"
            value={formData.scholarNo}
            onChange={handleChange}
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <Select
            id="student-department-select"
            name="department"
            label="Department"
            options={DEPARTMENT_OPTIONS}
            value={formData.department}
            onChange={handleChange}
            placeholder="Select Department..."
            required
          />

          <Select
            id="student-year-select"
            name="year"
            label="Academic Year"
            options={YEAR_OPTIONS}
            value={formData.year}
            onChange={handleChange}
            placeholder="Select Year..."
            required
          />
        </div>

        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            id="student-join-class-submit"
            type="submit"
            variant="primary"
            icon={PlusCircle}
            loading={loading}
          >
            Submit Request
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default JoinClassModal;
