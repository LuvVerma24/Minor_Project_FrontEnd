import React, { useState, useEffect, useMemo } from 'react';
import {
  Download,
  Search,
  Edit2,
  Calendar,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  Plus,
} from 'lucide-react';
import { attendanceApi } from '../../api/attendanceApi';
import { useToast } from '../../context/ToastContext';
import { exportAttendancePdf } from './AttendancePdfExporter';
import Button from '../common/Button';
import Input from '../common/Input';
import Badge from '../common/Badge';
import Skeleton from '../common/Skeleton';
import EmptyState from '../common/EmptyState';
import AttendanceSubmitModal from './AttendanceSubmitModal';
import AttendanceEditModal from './AttendanceEditModal';

const AttendanceSummaryTable = ({ classroom, facultyName, enrolledStudents = [] }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('summary'); // 'summary' | 'logs'
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  // Fetch all attendance records for this class (high limit to aggregate client-side)
  const fetchAttendance = async () => {
    if (!classroom?._id) return;
    setLoading(true);
    try {
      const res = await attendanceApi.getAttendanceHistory(classroom._id, { limit: 1000 });
      if (res?.items) {
        setRecords(res.items);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load attendance records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [classroom?._id]);

  // Aggregate Attendance Summary per Roll Number
  const { summaryData, uniqueDatesCount } = useMemo(() => {
    const datesSet = new Set();
    const rollMap = {};

    // 1. Prepopulate with enrolled students or class capacity
    if (enrolledStudents && enrolledStudents.length > 0) {
      enrolledStudents.forEach((st) => {
        const roll = st.rollNo.toString().trim();
        rollMap[roll] = { rollNo: roll, present: 0, absent: 0, total: 0 };
      });
    } else {
      const count = classroom?.numberOfStudents || 60;
      for (let i = 1; i <= count; i++) {
        const roll = i.toString();
        rollMap[roll] = { rollNo: roll, present: 0, absent: 0, total: 0 };
      }
    }

    // 2. Process all backend attendance records
    records.forEach((rec) => {
      const roll = rec.rollNo.toString().trim();
      const formattedDate = new Date(rec.date).toISOString().split('T')[0];
      datesSet.add(formattedDate);

      if (!rollMap[roll]) {
        rollMap[roll] = { rollNo: roll, present: 0, absent: 0, total: 0 };
      }

      rollMap[roll].total += 1;
      if (rec.status === 'present') {
        rollMap[roll].present += 1;
      } else {
        rollMap[roll].absent += 1;
      }
    });

    const totalHeld = datesSet.size;

    const list = Object.values(rollMap).map((item) => {
      const totalClasses = item.total > 0 ? item.total : totalHeld;
      const percentage = totalClasses > 0 ? ((item.present / totalClasses) * 100) : 0;
      return {
        rollNo: item.rollNo,
        totalClasses: totalClasses,
        presentClasses: item.present,
        absentClasses: Math.max(0, totalClasses - item.present),
        percentage: Number(percentage.toFixed(1)),
      };
    });

    // Sort roll numbers numerically
    list.sort((a, b) => {
      const na = parseInt(a.rollNo, 10);
      const nb = parseInt(b.rollNo, 10);
      return !isNaN(na) && !isNaN(nb) ? na - nb : a.rollNo.localeCompare(b.rollNo);
    });

    return {
      summaryData: list,
      uniqueDatesCount: totalHeld,
    };
  }, [records, enrolledStudents, classroom]);

  // Search filtered summary
  const filteredSummary = useMemo(() => {
    if (!searchQuery) return summaryData;
    return summaryData.filter((item) =>
      item.rollNo.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [summaryData, searchQuery]);

  // Search filtered logs
  const filteredLogs = useMemo(() => {
    if (!searchQuery) return records;
    return records.filter((rec) =>
      rec.rollNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      new Date(rec.date).toLocaleDateString().includes(searchQuery)
    );
  }, [records, searchQuery]);

  const handleExportPdf = () => {
    if (summaryData.length === 0) {
      toast.error('No attendance data available to download.');
      return;
    }
    exportAttendancePdf({
      classroom,
      facultyName,
      attendanceData: summaryData,
      totalClassesHeld: uniqueDatesCount,
    });
    toast.success('Attendance PDF downloaded successfully.');
  };

  return (
    <div>
      {/* Top Controls: Submit Button, PDF Download, View Switcher & Search */}
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
            id="open-attendance-submit-modal"
            variant="primary"
            icon={Plus}
            onClick={() => setIsSubmitModalOpen(true)}
          >
            Add Today's Attendance
          </Button>

          <Button
            id="download-attendance-pdf-btn"
            variant="outline"
            icon={Download}
            onClick={handleExportPdf}
            disabled={summaryData.length === 0}
          >
            Download Register PDF
          </Button>

          {/* Toggle Summary / Detailed Logs */}
          <div
            style={{
              display: 'inline-flex',
              backgroundColor: 'var(--bg-surface-subtle)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '2px',
            }}
          >
            <button
              type="button"
              className={`btn btn-sm ${viewMode === 'summary' ? 'btn-secondary' : 'btn-ghost'}`}
              style={{ border: 'none', padding: '0.35rem 0.75rem' }}
              onClick={() => setViewMode('summary')}
            >
              Summary Stats
            </button>
            <button
              type="button"
              className={`btn btn-sm ${viewMode === 'logs' ? 'btn-secondary' : 'btn-ghost'}`}
              style={{ border: 'none', padding: '0.35rem 0.75rem' }}
              onClick={() => setViewMode('logs')}
            >
              Date-wise Logs ({records.length})
            </button>
          </div>
        </div>

        <div style={{ minWidth: '240px' }}>
          <Input
            id="attendance-search-input"
            icon={Search}
            placeholder="Search by Roll No..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Main Table View */}
      {loading ? (
        <Skeleton height="260px" />
      ) : viewMode === 'summary' ? (
        filteredSummary.length === 0 ? (
          <EmptyState
            icon={FileSpreadsheet}
            title="No Attendance Recorded Yet"
            description="Click 'Add Today\'s Attendance' above to record the initial session for this class."
            action={
              <Button variant="primary" icon={Plus} onClick={() => setIsSubmitModalOpen(true)}>
                Add Today's Attendance
              </Button>
            }
          />
        ) : (
          <div className="table-container">
            <table className="data-table" id="attendance-summary-table">
              <thead>
                <tr>
                  <th className="col-sticky-1">Roll Number</th>
                  <th className="col-numeric">Total Sessions</th>
                  <th className="col-numeric">Present</th>
                  <th className="col-numeric">Absent</th>
                  <th className="col-numeric">Attendance %</th>
                  <th style={{ textAlign: 'center' }}>Eligibility Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSummary.map((row) => (
                  <tr key={row.rollNo}>
                    <td className="col-sticky-1">Roll No. {row.rollNo}</td>
                    <td className="col-numeric">{row.totalClasses}</td>
                    <td className="col-numeric" style={{ color: 'var(--status-success-text)', fontWeight: 600 }}>
                      {row.presentClasses}
                    </td>
                    <td className="col-numeric" style={{ color: 'var(--status-danger-text)' }}>
                      {row.absentClasses}
                    </td>
                    <td className="col-numeric" style={{ fontWeight: 700 }}>
                      {row.percentage}%
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <Badge variant={row.percentage >= 75 ? 'approved' : 'rejected'}>
                        {row.percentage >= 75 ? 'Satisfactory' : 'Shortage (<75%)'}
                      </Badge>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Edit2}
                        onClick={() =>
                          setEditTarget({
                            rollNo: row.rollNo,
                            date: new Date().toISOString().split('T')[0],
                            status: 'present',
                          })
                        }
                        title="Edit individual attendance entry"
                      >
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        /* Detailed Date-wise Log view */
        filteredLogs.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No Attendance Logs Found"
            description="There are no individual attendance entry logs matching your search."
          />
        ) : (
          <div className="table-container">
            <table className="data-table" id="attendance-logs-table">
              <thead>
                <tr>
                  <th>Session Date</th>
                  <th className="col-sticky-1">Roll Number</th>
                  <th>Status</th>
                  <th>Recorded At</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log._id}>
                    <td>
                      {new Date(log.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="col-sticky-1">Roll No. {log.rollNo}</td>
                    <td>
                      <Badge variant={log.status === 'present' ? 'approved' : 'rejected'}>
                        {log.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(log.createdAt || log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Edit2}
                        onClick={() => setEditTarget(log)}
                        title="Edit this log record"
                      >
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Submit Today's Attendance Modal */}
      <AttendanceSubmitModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        classroom={classroom}
        enrolledStudents={enrolledStudents}
        onSubmitted={fetchAttendance}
      />

      {/* Edit Individual Record Modal */}
      <AttendanceEditModal
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        classroom={classroom}
        initialRecord={editTarget}
        onRecordUpdated={fetchAttendance}
      />
    </div>
  );
};

export default AttendanceSummaryTable;
