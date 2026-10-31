import React, { useState } from 'react';
import { PlusCircle, FileText, Award, Save } from 'lucide-react';
import { examApi } from '../../api/examApi';
import { useToast } from '../../context/ToastContext';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';

const CreateExamModal = ({ isOpen, onClose, classroom, onExamCreated }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [examName, setExamName] = useState('');
  const [maxMarks, setMaxMarks] = useState('100');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const max = Number(maxMarks);
    if (isNaN(max) || max <= 0) {
      setErrorMessage('Maximum marks must be a positive number greater than 0.');
      return;
    }

    setLoading(true);
    try {
      const res = await examApi.createExam({
        classId: classroom._id,
        examName: examName.trim(),
        maxMarks: max,
      });

      toast.success(res.message || `Exam "${examName}" added as a grade column!`);
      onExamCreated(res.exam);
      onClose();
      setExamName('');
      setMaxMarks('100');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to create exam column.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Exam Column"
      subtitle="Create a new evaluation component (e.g. Midterm, Quiz 1, Assignment, Final)."
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
          id="create-exam-name-input"
          label="Exam / Assessment Title"
          icon={FileText}
          placeholder="e.g. Mid-Semester Exam 1"
          value={examName}
          onChange={(e) => setExamName(e.target.value)}
          required
          autoFocus
        />

        <Input
          id="create-exam-max-marks-input"
          label="Maximum Marks"
          type="number"
          min="1"
          max="500"
          icon={Award}
          placeholder="e.g. 100"
          value={maxMarks}
          onChange={(e) => setMaxMarks(e.target.value)}
          required
          hint="Marks entered in this column cannot exceed this maximum value."
        />

        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            id="create-exam-submit-btn"
            type="submit"
            variant="primary"
            icon={PlusCircle}
            loading={loading}
          >
            Create Column
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateExamModal;
