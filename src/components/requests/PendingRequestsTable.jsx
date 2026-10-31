import React, { useState, useEffect } from 'react';
import { UserCheck, UserX, Check, X, Search, Clock, Users, Mail, Phone } from 'lucide-react';
import { classApi } from '../../api/classApi';
import { useToast } from '../../context/ToastContext';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Input from '../common/Input';
import Skeleton from '../common/Skeleton';
import EmptyState from '../common/EmptyState';

const PendingRequestsTable = ({ classroom, onRequestResolved }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [filterStatus, setFilterStatus] = useState('pending'); // 'pending' | 'approved' | 'rejected' | 'all'
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState(null);

  const fetchRequests = async () => {
    if (!classroom?._id) return;
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }
      const res = await classApi.listJoinRequests(classroom._id, params);
      if (res?.items) {
        setRequests(res.items);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load join requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [classroom?._id, filterStatus]);

  const handleRespond = async (joinRequestId, action) => {
    setProcessingId(joinRequestId);
    try {
      const res = await classApi.respondJoinRequest({
        joinRequestId,
        action,
      });

      toast.success(res.message || `Student request ${action}ed!`);
      // Update local state
      setRequests((prev) =>
        prev.map((r) => (r._id === joinRequestId ? { ...r, status: `${action}d` } : r))
      );
      if (onRequestResolved) {
        onRequestResolved();
      }
    } catch (err) {
      toast.error(err.message || `Failed to ${action} join request.`);
    } finally {
      setProcessingId(null);
    }
  };

  // Search filter
  const filteredRequests = requests.filter((r) => {
    const q = searchQuery.toLowerCase();
    const student = r.studentId || {};
    return (
      r.rollNo?.toLowerCase().includes(q) ||
      r.scholarNo?.toLowerCase().includes(q) ||
      student.fullName?.toLowerCase().includes(q) ||
      student.email?.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      {/* Top Filter & Search Controls */}
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
        {/* Status Filter Tabs */}
        <div
          style={{
            display: 'inline-flex',
            backgroundColor: 'var(--bg-surface-subtle)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '2px',
          }}
        >
          {['pending', 'approved', 'rejected', 'all'].map((status) => (
            <button
              key={status}
              type="button"
              className={`btn btn-sm ${filterStatus === status ? 'btn-secondary' : 'btn-ghost'}`}
              style={{ border: 'none', padding: '0.35rem 0.75rem', textTransform: 'capitalize' }}
              onClick={() => setFilterStatus(status)}
            >
              {status === 'all' ? 'All Requests' : status}
            </button>
          ))}
        </div>

        <div style={{ minWidth: '240px' }}>
          <Input
            id="join-request-search"
            icon={Search}
            placeholder="Search student, roll, scholar no..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <Skeleton height="260px" />
      ) : filteredRequests.length === 0 ? (
        <EmptyState
          icon={Users}
          title={
            filterStatus === 'pending'
              ? 'No Pending Join Requests'
              : `No ${filterStatus} Requests Found`
          }
          description={
            filterStatus === 'pending'
              ? 'When students submit a join code for this class, their requests will appear here for your approval.'
              : 'Try selecting a different filter above.'
          }
        />
      ) : (
        <div className="table-container">
          <table className="data-table" id="join-requests-table">
            <thead>
              <tr>
                <th className="col-sticky-1">Student Name</th>
                <th>Roll Number</th>
                <th>Scholar Number</th>
                <th>Department / Year</th>
                <th>Contact Details</th>
                <th style={{ textAlign: 'center' }}>Request Status</th>
                <th style={{ textAlign: 'right' }}>Faculty Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((req) => {
                const student = req.studentId || {};
                const isPending = req.status === 'pending';
                const isProcessing = processingId === req._id;

                return (
                  <tr key={req._id}>
                    <td className="col-sticky-1">
                      <div style={{ fontWeight: 600 }}>{student.fullName || 'Student'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Requested: {new Date(req.createdAt).toLocaleDateString()}
                      </div>
                    </td>

                    <td>
                      <Badge variant="accent">Roll {req.rollNo}</Badge>
                    </td>

                    <td className="font-mono">{req.scholarNo}</td>

                    <td>
                      <div style={{ fontSize: '0.85rem' }}>{student.department || classroom.department}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {student.year || classroom.year} - Sec {student.section || classroom.section}
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.8rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{student.email}</span>
                        {student.phone && (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                            {student.phone}
                          </span>
                        )}
                      </div>
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <Badge variant={req.status === 'approved' ? 'approved' : req.status === 'rejected' ? 'rejected' : 'pending'}>
                        {req.status.toUpperCase()}
                      </Badge>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      {isPending ? (
                        <div style={{ display: 'inline-flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                          <Button
                            variant="primary"
                            size="sm"
                            icon={Check}
                            loading={isProcessing}
                            onClick={() => handleRespond(req._id, 'approve')}
                            title="Approve and enroll student"
                          >
                            Approve
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            icon={X}
                            disabled={isProcessing}
                            onClick={() => handleRespond(req._id, 'reject')}
                            title="Reject request"
                          >
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {req.status === 'approved' ? 'Enrolled' : 'Declined'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PendingRequestsTable;
