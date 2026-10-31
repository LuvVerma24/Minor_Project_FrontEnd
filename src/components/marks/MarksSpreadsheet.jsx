import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Save,
  Search,
  Award,
  AlertCircle,
  FileSpreadsheet,
  Check,
} from 'lucide-react';
import { examApi } from '../../api/examApi';
import { useToast } from '../../context/ToastContext';
import Button from '../common/Button';
import Input from '../common/Input';
import Badge from '../common/Badge';
import Skeleton from '../common/Skeleton';
import EmptyState from '../common/EmptyState';
import CreateExamModal from './CreateExamModal';

const EMPTY_STUDENTS = [];

const MarksSpreadsheet = ({ classroom, enrolledStudents = EMPTY_STUDENTS }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState([]);
  const [marksRecords, setMarksRecords] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddColumnModalOpen, setIsAddColumnModalOpen] = useState(false);
  const [savingExamId, setSavingExamId] = useState(null);

  // Local grid matrix: { [rollNo]: { [examId]: scoreString } }
  const [gridValues, setGridValues] = useState({});
  // Track cell validation errors: { [`${rollNo}_${examId}`]: errorMessage }
  const [cellErrors, setCellErrors] = useState({});

  // Compute roll numbers from enrolled students, class capacity, and any existing mark records
  const rollNumbers = useMemo(() => {
    const rollsSet = new Set();
    if (enrolledStudents && enrolledStudents.length > 0) {
      enrolledStudents.forEach((s) => {
        if (s.rollNo) rollsSet.add(s.rollNo.toString().trim());
      });
    } else {
      const count = classroom?.numberOfStudents || 60;
      for (let i = 1; i <= count; i++) {
        rollsSet.add(i.toString());
      }
    }

    marksRecords.forEach((m) => {
      if (m.rollNo) rollsSet.add(m.rollNo.toString().trim());
    });

    return Array.from(rollsSet).sort((a, b) => {
      const na = parseInt(a, 10);
      const nb = parseInt(b, 10);
      return !isNaN(na) && !isNaN(nb) ? na - nb : a.localeCompare(b);
    });
  }, [enrolledStudents, classroom?.numberOfStudents, marksRecords]);

  // Load Exams and Marks
  const loadData = async () => {
    if (!classroom?._id) return;
    setLoading(true);
    try {
      const [examsRes, marksRes] = await Promise.all([
        examApi.listExams(classroom._id, { limit: 100 }),
        examApi.getMarks(classroom._id, { limit: 1000 }),
      ]);

      const examList = examsRes?.items || [];
      const marksList = marksRes?.items || [];

      setExams(examList);
      setMarksRecords(marksList);

      // Collect all active roll numbers
      const rollsSet = new Set();
      if (enrolledStudents && enrolledStudents.length > 0) {
        enrolledStudents.forEach((s) => {
          if (s.rollNo) rollsSet.add(s.rollNo.toString().trim());
        });
      } else {
        const count = classroom?.numberOfStudents || 60;
        for (let i = 1; i <= count; i++) {
          rollsSet.add(i.toString());
        }
      }
      marksList.forEach((m) => {
        if (m.rollNo) rollsSet.add(m.rollNo.toString().trim());
      });

      // Build grid matrix
      const matrix = {};
      rollsSet.forEach((r) => {
        matrix[r] = {};
        examList.forEach((ex) => {
          matrix[r][ex._id] = '';
        });
      });

      marksList.forEach((m) => {
        const roll = m.rollNo?.toString().trim();
        const examId = m.examId?._id || m.examId;
        if (roll && examId && matrix[roll]) {
          matrix[roll][examId] = m.marksObtained !== undefined ? m.marksObtained.toString() : '';
        }
      });

      setGridValues(matrix);
      setCellErrors({});
    } catch (err) {
      toast.error(err.message || 'Failed to load examination marks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [classroom?._id]);

  const handleCellChange = (roll, exam, val) => {
    const errorKey = `${roll}_${exam._id}`;
    const newErrors = { ...cellErrors };

    if (val === '') {
      delete newErrors[errorKey];
    } else {
      const num = Number(val);
      if (isNaN(num) || num < 0) {
        newErrors[errorKey] = 'Negative or invalid';
      } else if (num > exam.maxMarks) {
        newErrors[errorKey] = `Max is ${exam.maxMarks}`;
      } else {
        delete newErrors[errorKey];
      }
    }

    setCellErrors(newErrors);
    setGridValues((prev) => ({
      ...prev,
      [roll]: {
        ...(prev[roll] || {}),
        [exam._id]: val,
      },
    }));
  };

  // Save marks for a specific exam column
  const handleSaveExamColumn = async (exam) => {
    // Check for errors in this column
    const hasError = rollNumbers.some((r) => cellErrors[`${r}_${exam._id}`]);
    if (hasError) {
      toast.error(`Please correct marks exceeding max score (${exam.maxMarks}) in ${exam.examName}.`);
      return;
    }

    const records = [];
    for (const roll of rollNumbers) {
      const rawVal = gridValues[roll]?.[exam._id];
      if (rawVal !== undefined && rawVal !== null && rawVal.toString().trim() !== '') {
        const num = Number(rawVal);
        if (!isNaN(num) && num >= 0 && num <= exam.maxMarks) {
          records.push({
            rollNo: roll,
            marksObtained: num,
          });
        }
      }
    }

    if (records.length === 0) {
      toast.error(`No marks entered for ${exam.examName}.`);
      return;
    }

    setSavingExamId(exam._id);
    try {
      const res = await examApi.submitMarks({
        classId: classroom._id,
        examId: exam._id,
        records,
      });

      toast.success(res.message || `Saved marks for ${records.length} students in ${exam.examName}!`);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to save marks.');
    } finally {
      setSavingExamId(null);
    }
  };

  const handleExamCreated = (newExam) => {
    setExams((prev) => [...prev, newExam]);
    setGridValues((prev) => {
      const copy = { ...prev };
      rollNumbers.forEach((r) => {
        if (!copy[r]) copy[r] = {};
        copy[r][newExam._id] = '';
      });
      return copy;
    });
  };

  // Filter rows by Roll Number search
  const filteredRolls = useMemo(() => {
    if (!searchQuery) return rollNumbers;
    return rollNumbers.filter((r) => r.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [rollNumbers, searchQuery]);

  return (
    <div>
      {/* Header controls: Add Column, Search & Save Controls */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Button
            id="add-exam-column-btn"
            variant="primary"
            icon={Plus}
            onClick={() => setIsAddColumnModalOpen(true)}
          >
            Add Exam Column
          </Button>

          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {exams.length} {exams.length === 1 ? 'Exam Column' : 'Exam Columns'} Configured
          </div>
        </div>

        <div style={{ minWidth: '240px' }}>
          <Input
            id="marks-search-input"
            icon={Search}
            placeholder="Search by Roll No..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Main Grid View */}
      {loading ? (
        <Skeleton height="300px" />
      ) : exams.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No Exam Columns Created Yet"
          description="Create exam components like Midterm, Quizzes, or Finals to evaluate student marks."
          action={
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => setIsAddColumnModalOpen(true)}
            >
              Add First Exam Column
            </Button>
          }
        />
      ) : (
        <div className="table-container" style={{ maxHeight: '550px', overflowY: 'auto' }}>
          <table className="data-table" id="marks-spreadsheet-table">
            <thead>
              <tr>
                <th className="col-sticky-1" style={{ minWidth: '130px' }}>
                  Roll Number
                </th>
                {exams.map((ex) => (
                  <th key={ex._id} style={{ minWidth: '160px', textAlign: 'center' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{ex.examName}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Max: {ex.maxMarks} Marks
                    </div>
                    <div style={{ marginTop: '0.4rem' }}>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={Save}
                        loading={savingExamId === ex._id}
                        onClick={() => handleSaveExamColumn(ex)}
                        title={`Save all entered scores for ${ex.examName}`}
                        style={{ padding: '0.2rem 0.55rem', fontSize: '0.72rem' }}
                      >
                        Save Col
                      </Button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRolls.map((roll) => (
                <tr key={roll}>
                  <td className="col-sticky-1">Roll No. {roll}</td>
                  {exams.map((ex) => {
                    const errorKey = `${roll}_${ex._id}`;
                    const hasError = !!cellErrors[errorKey];
                    const val = gridValues[roll]?.[ex._id] ?? '';

                    return (
                      <td key={ex._id} style={{ textAlign: 'center', padding: '0.4rem 0.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <input
                            type="number"
                            min="0"
                            max={ex.maxMarks}
                            step="any"
                            placeholder="—"
                            value={val}
                            onChange={(e) => handleCellChange(roll, ex, e.target.value)}
                            style={{
                              width: '90px',
                              textAlign: 'center',
                              fontFamily: 'var(--font-mono)',
                              fontSize: '0.9rem',
                              fontWeight: 600,
                              padding: '0.35rem 0.45rem',
                              borderRadius: 'var(--radius-sm)',
                              border: hasError
                                ? '1.5px solid var(--status-danger-btn)'
                                : '1px solid var(--border-subtle)',
                              backgroundColor: hasError
                                ? 'var(--status-danger-bg)'
                                : val !== ''
                                ? 'var(--bg-surface)'
                                : 'var(--bg-surface-subtle)',
                              color: hasError ? 'var(--status-danger-text)' : 'var(--text-primary)',
                            }}
                            title={hasError ? cellErrors[errorKey] : `Max ${ex.maxMarks}`}
                          />
                          {hasError && (
                            <span style={{ fontSize: '0.65rem', color: 'var(--status-danger-text)', marginTop: '2px' }}>
                              {cellErrors[errorKey]}
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Exam Column Modal */}
      <CreateExamModal
        isOpen={isAddColumnModalOpen}
        onClose={() => setIsAddColumnModalOpen(false)}
        classroom={classroom}
        onExamCreated={handleExamCreated}
      />
    </div>
  );
};

export default MarksSpreadsheet;
