import React, { useState, useEffect } from 'react';
import { Bell, ExternalLink, CheckCheck, Eye, Plus, Calendar } from 'lucide-react';
import { noticeApi } from '../../api/noticeApi';
import { useToast } from '../../context/ToastContext';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Skeleton from '../common/Skeleton';
import EmptyState from '../common/EmptyState';
import CreateNoticeModal from './CreateNoticeModal';

const NoticeList = ({ classId, isTeacher = false, isStudent = false }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [notices, setNotices] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchNotices = async (pageNum = 1, append = false) => {
    if (!classId) return;
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const res = await noticeApi.listNotices(classId, { page: pageNum, limit: 10 });
      if (res?.items) {
        setNotices((prev) => (append ? [...prev, ...res.items] : res.items));
        setHasMore(!!res.pagination?.hasNextPage);
        setPage(pageNum);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load class notices.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchNotices(1, false);
  }, [classId]);

  // Mark notice as read for student
  const handleMarkAsRead = async (noticeId, isAlreadyRead) => {
    if (!isStudent || isAlreadyRead) return;

    try {
      await noticeApi.markNoticeRead(noticeId);
      // Optimistically update
      setNotices((prev) =>
        prev.map((n) => (n._id === noticeId ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.warn('Failed to mark notice read:', err.message);
    }
  };

  const handleNoticeCreated = (newNotice) => {
    setNotices((prev) => [
      {
        ...newNotice,
        readCount: 0,
        isRead: null,
      },
      ...prev,
    ]);
  };

  return (
    <div>
      {/* Top Header & Post Notice Button for Teacher */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '1.25rem',
        }}
      >
        <div>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', fontWeight: 600 }}>
            Class Bulletins & Notices
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Official announcements, assignment guidelines, and course updates.
          </p>
        </div>

        {isTeacher && (
          <Button
            id="open-create-notice-btn"
            variant="primary"
            icon={Plus}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Post Notice
          </Button>
        )}
      </div>

      {/* Notice Feed */}
      {loading ? (
        <Skeleton height="160px" count={2} />
      ) : notices.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No Notices Posted"
          description="There are currently no active announcements for this classroom."
          action={
            isTeacher && (
              <Button variant="primary" icon={Plus} onClick={() => setIsCreateModalOpen(true)}>
                Post First Notice
              </Button>
            )
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {notices.map((item) => {
            const isUnread = isStudent && item.isRead === false;

            return (
              <div
                key={item._id}
                onClick={() => handleMarkAsRead(item._id, item.isRead)}
                style={{
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--bg-surface)',
                  border: isUnread
                    ? '1.5px solid var(--accent-border)'
                    : '1px solid var(--border-subtle)',
                  boxShadow: 'var(--shadow-sm)',
                  cursor: isStudent && isUnread ? 'pointer' : 'default',
                  transition: 'all var(--transition-fast)',
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {isUnread && <Badge variant="unread">New Notice</Badge>}
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {item.title}
                    </h4>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <Calendar size={13} />
                    <span>
                      {new Date(item.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                {/* Message Body */}
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, whiteSpace: 'pre-line', marginBottom: item.link ? '0.75rem' : '0.5rem' }}>
                  {item.message}
                </p>

                {/* Optional Link & Read Counter Footer */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.65rem', marginTop: '0.5rem' }}>
                  {item.link ? (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        fontSize: '0.82rem',
                        color: 'var(--accent-text)',
                        fontWeight: 500,
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink size={14} />
                      <span>Open Attachment Link</span>
                    </a>
                  ) : (
                    <div />
                  )}

                  {isTeacher && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      <Eye size={14} />
                      <span>Read by {item.readCount || 0} students</span>
                    </div>
                  )}

                  {isStudent && item.isRead && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: 'var(--status-success-text)' }}>
                      <CheckCheck size={14} />
                      <span>Read</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Load More Pagination */}
          {hasMore && (
            <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
              <Button
                variant="outline"
                size="sm"
                loading={loadingMore}
                onClick={() => fetchNotices(page + 1, true)}
              >
                Load Older Notices
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Create Notice Modal */}
      <CreateNoticeModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        classId={classId}
        onNoticeCreated={handleNoticeCreated}
      />
    </div>
  );
};

export default NoticeList;
