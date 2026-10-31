import React, { useState } from 'react';
import { PlusCircle, BookOpen, Users, Building2, Calendar, Layers } from 'lucide-react';
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
const SECTION_OPTIONS = ['A', 'B', 'C', 'D', 'E', 'CSE-1', 'CSE-2', 'IT-1', 'IT-2'];

const CreateClassModal = ({ isOpen, onClose, onClassCreated, defaultDepartment = '' }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState({
    subjectName: '',
    numberOfStudents: '60',
    department: defaultDepartment || '',
    year: '',
    section: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const num = parseInt(formData.numberOfStudents, 10);
    if (isNaN(num) || num < 1) {
      setErrorMessage('Number of students must be at least 1.');
      return;
    }

    setLoading(true);
    try {
      const res = await classApi.createClass({
        subjectName: formData.subjectName.trim(),
        numberOfStudents: num,
        department: formData.department.trim(),
        year: formData.year.trim(),
        section: formData.section.trim(),
      });

      toast.success(res.message || 'Classroom created successfully!');
      onClassCreated(res.classroom);
      onClose();
      // Reset form
      setFormData({
        subjectName: '',
        numberOfStudents: '60',
        department: defaultDepartment || '',
        year: '',
        section: '',
      });
    } catch (err) {
      setErrorMessage(err.message || 'Failed to create classroom.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Classroom"
      subtitle="Define course metadata. A unique 6-character Join Code will be automatically generated."
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
          id="create-class-subject"
          name="subjectName"
          label="Subject / Course Name"
          icon={BookOpen}
          placeholder="e.g. Data Structures & Algorithms"
          value={formData.subjectName}
          onChange={handleChange}
          required
          autoFocus
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <Input
            id="create-class-num-students"
            name="numberOfStudents"
            label="Class Capacity / Students"
            type="number"
            min="1"
            max="300"
            icon={Users}
            placeholder="e.g. 60"
            value={formData.numberOfStudents}
            onChange={handleChange}
            required
          />

          <Select
            id="create-class-department"
            name="department"
            label="Department"
            options={DEPARTMENT_OPTIONS}
            value={formData.department}
            onChange={handleChange}
            placeholder="Select Department..."
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <Select
            id="create-class-year"
            name="year"
            label="Academic Year"
            options={YEAR_OPTIONS}
            value={formData.year}
            onChange={handleChange}
            placeholder="Select Year..."
            required
          />

          <Select
            id="create-class-section"
            name="section"
            label="Section"
            options={SECTION_OPTIONS}
            value={formData.section}
            onChange={handleChange}
            placeholder="Select Section..."
            required
          />
        </div>

        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            id="create-class-submit-btn"
            type="submit"
            variant="primary"
            icon={PlusCircle}
            loading={loading}
          >
            Create Classroom
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateClassModal;
