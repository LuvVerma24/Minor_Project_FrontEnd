import React, { useState, useEffect, useMemo } from 'react';
import { Download, Search, Trophy, Medal, Award, RefreshCw, FileText } from 'lucide-react';
import { examApi } from '../../api/examApi';
import { useToast } from '../../context/ToastContext';
import { exportResultPdf } from './ResultPdfExporter';
import Button from '../common/Button';
import Input from '../common/Input';
import Badge from '../common/Badge';
import Skeleton from '../common/Skeleton';
import EmptyState from '../common/EmptyState';

const ResultView = ({ classroom, facultyName, enrolledStudents = [] }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [hasCalculated, setHasCalculated] = useState(false);
  const [exams, setExams] = useState([]);
  const [marks, setMarks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch exams and marks to compute result tabulation
  const calculateResults = async () => {
    if (!classroom?._id) return;
    setLoading(true);
    try {
      const [examsRes, marksRes] = await Promise.all([
        examApi.listExams(classroom._id, { limit: 100 }),
        examApi.getMarks(classroom._id, { limit: 1000 }),
      ]);

      const examList = examsRes?.items || [];
      const markList = marksRes?.items || [];

      setExams(examList);
      setMarks(markList);
      setHasCalculated(true);
    } catch (err) {
      toast.error(err.message || 'Failed to fetch examination marks for result computation.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Auto calculate on mount if classroom exists
    calculateResults();
  }, [classroom?._id]);

  // Compute Per-Roll Results, Total Marks, Max Marks, and Sort Descending for Merit Ranking
  const computedResults = useMemo(() => {
    if (exams.length === 0) return [];

    // Map of roll numbers
    const rollsSet = new Set();
    if (enrolledStudents && enrolledStudents.length > 0) {
      enrolledStudents.forEach((s) => rollsSet.add(s.rollNo.toString().trim()));
    } else {
      const count = classroom?.numberOfStudents || 60;
      for (let i = 1; i <= count; i++) rollsSet.add(i.toString());
    }

    // Also include roll numbers that have marks entered
    marks.forEach((m) => {
      if (m.rollNo) rollsSet.add(m.rollNo.toString().trim());
    });

    const maxPossibleTotal = exams.reduce((sum, e) => sum + (e.maxMarks || 0), 0);

    const list = Array.from(rollsSet).map((roll) => {
      const marksPerExam = {};
      let totalObtained = 0;
      let examsAttemptedCount = 0;

      exams.forEach((ex) => {
        const markRecord = marks.find(
          (m) =>
            m.rollNo?.toString().trim() === roll &&
            (m.examId?._id?.toString() === ex._id?.toString() || m.examId?.toString() === ex._id?.toString())
        );

        if (markRecord && markRecord.marksObtained !== undefined && markRecord.marksObtained !== null) {
          marksPerExam[ex._id] = markRecord.marksObtained;
          totalObtained += markRecord.marksObtained;
          examsAttemptedCount += 1;
        } else {
          marksPerExam[ex._id] = null;
        }
      });

      const percentage = maxPossibleTotal > 0 ? ((totalObtained / maxPossibleTotal) * 100) : 0;

      return {
        rollNo: roll,
        marksPerExam,
        totalObtained,
        maxPossibleMarks: maxPossibleTotal,
        percentage: Number(percentage.toFixed(1)),
        examsAttemptedCount,
      };
    });

    // Sort descending by totalObtained
    list.sort((a, b) => b.totalObtained - a.totalObtained);

    // Assign Merit Ranks
    return list.map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
  }, [exams, marks, enrolledStudents, classroom]);

  // Search filtered results
  const filteredResults = useMemo(() => {
    if (!searchQuery) return computedResults;
    return computedResults.filter((r) => r.rollNo.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [computedResults, searchQuery]);

  const handleDownloadPdf = () => {
    if (computedResults.length === 0) {
      toast.error('No result data available to download.');
      return;
    }
    exportResultPdf({
      classroom,
      facultyName,
      exams,
      results: computedResults,
    });
    toast.success('Result Tabulation PDF downloaded.');
  };

  return (
    <div>
      {/* Top Action Bar */}
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
            id="recompute-results-btn"
            variant="primary"
            icon={RefreshCw}
            loading={loading}
            onClick={calculateResults}
          >
            Refresh & Compute Results
          </Button>

          <Button
            id="download-result-pdf-btn"
            variant="outline"
            icon={Download}
            onClick={handleDownloadPdf}
            disabled={computedResults.length === 0}
          >
            Download Merit PDF
          </Button>
        </div>

        <div style={{ minWidth: '240px' }}>
          <Input
            id="result-search-input"
            icon={Search}
            placeholder="Search by Roll No..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Main Result Sheet */}
      {loading ? (
        <Skeleton height="320px" />
      ) : exams.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No Exams Found for this Class"
          description="Create exam columns in the 'Marks' tab first. Results are automatically computed once assessments are added."
        />
      ) : filteredResults.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No Results Match Query"
          description="Try searching for another roll number."
        />
      ) : (
        <div>
          {/* Top 3 High Achievers Banner */}
          {computedResults.length >= 3 && !searchQuery && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '1.5rem',
              }}
            >
              {computedResults.slice(0, 3).map((top, idx) => (
                <div
                  key={top.rollNo}
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor:
                      idx === 0
                        ? 'var(--status-warning-bg)'
                        : idx === 1
                        ? 'var(--bg-surface-subtle)'
                        : 'var(--accent-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                  }}
                >
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-strong)',
                      color: idx === 0 ? '#b45309' : idx === 1 ? 'var(--text-secondary)' : 'var(--accent-primary)',
                      fontWeight: 700,
                    }}
                  >
                    {idx === 0 ? <Trophy size={20} /> : <Medal size={20} />}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                      Rank #{top.rank} Achiever
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Roll No. {top.rollNo}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {top.totalObtained} / {top.maxPossibleMarks} ({top.percentage}%)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tabulation Table */}
          <div className="table-container" style={{ maxHeight: '550px', overflowY: 'auto' }}>
            <table className="data-table" id="merit-tabulation-table">
              <thead>
                <tr>
                  <th style={{ width: '70px', textAlign: 'center' }}>Rank</th>
                  <th className="col-sticky-1" style={{ minWidth: '130px' }}>
                    Roll Number
                  </th>
                  {exams.map((ex) => (
                    <th key={ex._id} className="col-numeric" style={{ minWidth: '130px' }}>
                      <div>{ex.examName}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        Max: {ex.maxMarks}
                      </div>
                    </th>
                  ))}
                  <th className="col-numeric" style={{ minWidth: '110px' }}>Total Obtained</th>
                  <th className="col-numeric" style={{ minWidth: '100px' }}>Max Total</th>
                  <th className="col-numeric" style={{ minWidth: '100px' }}>Percentage</th>
                  <th style={{ textAlign: 'center', minWidth: '110px' }}>Result</th>
                </tr>
              </thead>
              <tbody>
                {filteredResults.map((row) => (
                  <tr key={row.rollNo}>
                    <td style={{ textAlign: 'center', fontWeight: 700 }}>
                      {row.rank === 1 ? (
                        <span style={{ color: '#b45309' }}>1st</span>
                      ) : row.rank === 2 ? (
                        <span style={{ color: 'var(--text-secondary)' }}>2nd</span>
                      ) : row.rank === 3 ? (
                        <span style={{ color: 'var(--accent-text)' }}>3rd</span>
                      ) : (
                        `#${row.rank}`
                      )}
                    </td>
                    <td className="col-sticky-1">Roll No. {row.rollNo}</td>
                    {exams.map((ex) => {
                      const score = row.marksPerExam[ex._id];
                      return (
                        <td key={ex._id} className="col-numeric">
                          {score !== null && score !== undefined ? (
                            <span>{score}</span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>—</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="col-numeric" style={{ fontWeight: 700, color: 'var(--accent-text)' }}>
                      {row.totalObtained}
                    </td>
                    <td className="col-numeric">{row.maxPossibleMarks}</td>
                    <td className="col-numeric" style={{ fontWeight: 700 }}>
                      {row.percentage}%
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <Badge variant={row.percentage >= 40 ? 'approved' : 'rejected'}>
                        {row.percentage >= 40 ? 'Passed' : 'Needs Retake'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultView;
