import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import Button from './Button';

const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md', // 'sm' | 'md' | 'lg' | 'xl'
  closeOnEsc = true,
  closeOnBackdrop = true,
  id,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && closeOnEsc) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    // Lock body scroll
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, closeOnEsc, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={closeOnBackdrop ? (e) => e.target === e.currentTarget && onClose() : undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby={id ? `${id}-title` : undefined}
    >
      <div className={`modal-content modal-${size}`}>
        <div className="modal-header">
          <div>
            <h2 id={id ? `${id}-title` : undefined} className="modal-title">
              {title}
            </h2>
            {subtitle && <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{subtitle}</p>}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close dialog"
            title="Close"
          >
            <X size={18} />
          </Button>
        </div>

        <div className="modal-body">{children}</div>

        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;
