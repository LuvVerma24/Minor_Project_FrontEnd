import React from 'react';
import { User, Mail, Lock, Phone, Building2, GraduationCap, ArrowRight } from 'lucide-react';
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

const TEACHER_POSTS = [
  'Professor & Head of Department',
  'Professor',
  'Associate Professor',
  'Assistant Professor',
  'Senior Lecturer',
  'Visiting Faculty',
  'Teaching Assistant',
];

const STUDENT_YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'M.Tech 1st Year', 'M.Tech 2nd Year'];
const STUDENT_SECTIONS = ['A', 'B', 'C', 'D', 'E', 'CSE-1', 'CSE-2', 'IT-1', 'IT-2'];

const SignupScreen1 = ({
  role,
  formData,
  setFormData,
  onSubmit,
  loading,
  errorMessage,
}) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <form onSubmit={onSubmit}>
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

      {/* Full Name */}
      <Input
        id="signup-fullname"
        name="fullName"
        label="Full Name"
        icon={User}
        placeholder={role === 'teacher' ? 'Dr. Jane Smith' : 'Alex Johnson'}
        value={formData.fullName}
        onChange={handleChange}
        required
      />

      {/* Email */}
      <Input
        id="signup-email"
        name="email"
        label="Institutional Email"
        type="email"
        icon={Mail}
        placeholder={role === 'teacher' ? 'teacher@college.edu' : 'student@college.edu'}
        value={formData.email}
        onChange={handleChange}
        required
      />

      {/* Phone Number */}
      <Input
        id="signup-phone"
        name="phone"
        label="Phone Number"
        type="tel"
        icon={Phone}
        placeholder="+91 98765 43210"
        value={formData.phone}
        onChange={handleChange}
        required
      />

      {/* Department */}
      <Select
        id="signup-department"
        name="department"
        label="Academic Department"
        options={DEPARTMENT_OPTIONS}
        value={formData.department}
        onChange={handleChange}
        placeholder="Select Department..."
        required
      />

      {/* Role-Specific Fields */}
      {role === 'teacher' ? (
        <Select
          id="signup-post"
          name="post"
          label="Designation / Academic Post"
          options={TEACHER_POSTS}
          value={formData.post}
          onChange={handleChange}
          placeholder="Select Designation..."
          required
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <Select
            id="signup-year"
            name="year"
            label="Year of Study"
            options={STUDENT_YEARS}
            value={formData.year}
            onChange={handleChange}
            placeholder="Select Year..."
            required
          />
          <Select
            id="signup-section"
            name="section"
            label="Section"
            options={STUDENT_SECTIONS}
            value={formData.section}
            onChange={handleChange}
            placeholder="Select Section..."
            required
          />
        </div>
      )}

      {/* Passwords */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <Input
          id="signup-password"
          name="password"
          label="Password"
          type="password"
          icon={Lock}
          placeholder="Min. 8 characters"
          value={formData.password}
          onChange={handleChange}
          required
        />
        <Input
          id="signup-confirm-password"
          name="confirmPassword"
          label="Confirm Password"
          type="password"
          icon={Lock}
          placeholder="Re-enter password"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
        />
      </div>

      <div style={{ marginTop: '1.25rem' }}>
        <Button
          id="signup-initiate-submit"
          type="submit"
          variant="primary"
          icon={ArrowRight}
          iconPosition="right"
          loading={loading}
          style={{ width: '100%' }}
        >
          Send Verification OTP
        </Button>
      </div>
    </form>
  );
};

export default SignupScreen1;
