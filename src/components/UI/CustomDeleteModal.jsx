import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { Trash2, X, AlertTriangle } from 'lucide-react';
import './CustomDeleteModal.css';

const CustomDeleteModal = ({ isOpen, onClose, onConfirm, title, itemName, isLoading }) => {
    const [isRendered, setIsRendered] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsRendered(true);
            document.body.style.overflow = 'hidden';
        } else {
            const timer = setTimeout(() => setIsRendered(false), 300);
            document.body.style.overflow = 'unset';
            return () => clearTimeout(timer);
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isRendered) return null;

    return ReactDOM.createPortal(
        <div className={`custom-modal-overlay ${isOpen ? 'active' : ''}`} onClick={onClose}>
            <div
                className={`custom-delete-modal ${isOpen ? 'active' : ''}`}
                onClick={(e) => e.stopPropagation()}
            >
                <button className="modal-close-btn" onClick={onClose} disabled={isLoading}>
                    <X size={20} />
                </button>

                <div className="modal-header-icon">
                    <div className="icon-pulse-ring"></div>
                    <AlertTriangle size={32} className="warning-icon" />
                </div>

                <div className="modal-content-body">
                    <h2>{title || 'Confirm Deletion'}</h2>
                    <p>
                        Are you sure you want to delete <strong className="highlight-text">"{itemName}"</strong>?
                        This action cannot be undone and will permanently remove this data from the system.
                    </p>
                </div>

                <div className="modal-actions-footer">
                    <button
                        className="modal-btn-cancel"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button
                        className="modal-btn-delete"
                        onClick={onConfirm}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <div className="btn-spinner"></div>
                        ) : (
                            <>
                                <Trash2 size={18} />
                                <span>Yes, Delete</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default CustomDeleteModal;
