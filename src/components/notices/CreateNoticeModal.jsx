import React, { useState } from 'react';
import { Bell, FileText, Link as LinkIcon, Send } from 'lucide-react';
import { noticeApi } from '../../api/noticeApi';
import { useToast } from '../../context/ToastContext';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';

const CreateNoticeModal = ({ isOpen, onClose, classId, onNoticeCreated }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [link, setLink] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!title || !message) {
      setErrorMessage('Notice title and announcement message are required.');
      return;
    }

    setLoading(true);
    try {
      const res = await noticeApi.createNotice({
        classId,
        title: title.trim(),
        message: message.trim(),
        link: link.trim() || undefined,
      });

      toast.success(res.message || 'Notice published to class!');
      if (onNoticeCreated) {
        onNoticeCreated(res.notice);
      }
      onClose();
      setTitle('');
      setMessage('');
      setLink('');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to publish notice.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Publish Class Announcement"
      subtitle="Broadcast a formal notice or resource link to all enrolled students in this class."
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
          id="notice-title-input"
          label="Notice Subject / Headline"
          icon={Bell}
          placeholder="e.g. Midterm Schedule & Syllabus Clarification"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          autoFocus
        />

        <div className="form-group">
          <label htmlFor="notice-message-input" className="form-label">
            Announcement Message <span className="required-indicator">*</span>
          </label>
          <textarea
            id="notice-message-input"
            rows={4}
            className="form-control"
            placeholder="Write the complete announcement text here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            style={{ resize: 'vertical' }}
          />
        </div>

        <Input
          id="notice-link-input"
          label="Attachment / Reference Link (Optional)"
          type="url"
          icon={LinkIcon}
          placeholder="https://drive.google.com/..."
          value={link}
          onChange={(e) => setLink(e.target.value)}
          hint="Link to course material, slide deck, or submission portal."
        />

        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            id="create-notice-submit-btn"
            type="submit"
            variant="primary"
            icon={Send}
            loading={loading}
          >
            Post Notice
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateNoticeModal;
