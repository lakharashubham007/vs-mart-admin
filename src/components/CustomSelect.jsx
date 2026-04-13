import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, ChevronDown, Check, X } from 'lucide-react';
import './CustomSelect.css';

const CustomSelect = ({ options, value, onChange, placeholder = "Select an option", label, size = "default", searchPlaceholder = "Search...", direction = "down", disabled = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
    const containerRef = useRef(null);
    const dropdownRef = useRef(null);

    const selectedOption = options.find(opt => opt.value === value);

    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useLayoutEffect(() => {
        if (isOpen && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setCoords({
                top: direction === 'up'
                    ? rect.top + window.scrollY - 8 // 8px gap
                    : rect.bottom + window.scrollY + 8, // 8px gap
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    }, [isOpen]);

    useEffect(() => {
        const handleScroll = (e) => {
            if (isOpen && dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            window.addEventListener('scroll', handleScroll, true);
        }

        return () => window.removeEventListener('scroll', handleScroll, true);
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            const isInsideContainer = containerRef.current && containerRef.current.contains(e.target);
            const isInsideDropdown = dropdownRef.current && dropdownRef.current.contains(e.target);

            if (!isInsideContainer && !isInsideDropdown) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (option, e) => {
        if (e) e.stopPropagation();
        onChange(option.value);
        setIsOpen(false);
        setSearchTerm('');
    };

    return (
        <div className={`custom-select-container ${size === 'small' ? 'size-small' : ''}`} ref={containerRef}>
            {label && <label className="custom-select-label">{label}</label>}

            <div
                className={`custom-select-trigger ${isOpen ? 'active' : ''} ${value ? 'has-value' : ''} ${disabled ? 'disabled' : ''}`}
                onClick={(e) => {
                    if (disabled) return;
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
                onMouseDown={(e) => e.stopPropagation()}
            >
                <div className="custom-select-trigger-content">
                    {selectedOption && value ? (
                        <span className="selected-text">{selectedOption.label}</span>
                    ) : (
                        <span className="placeholder-text">{placeholder}</span>
                    )}
                </div>
                <div className="custom-select-icon">
                    <ChevronDown size={18} className={isOpen ? 'rotate-180' : ''} />
                </div>
            </div>

            {isOpen && createPortal(
                <div
                    ref={dropdownRef}
                    className={`custom-select-dropdown animate-scale-up direction-${direction} ${size === 'small' ? 'size-small' : ''}`}
                    style={{
                        position: 'absolute',
                        top: `${coords.top}px`,
                        left: `${coords.left}px`,
                        width: `${coords.width}px`,
                        zIndex: 99999
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="custom-select-search-wrapper" onClick={e => e.stopPropagation()}>
                        <Search size={16} className="search-icon" />
                        <input
                            type="text"
                            className="custom-select-search-input"
                            placeholder={searchPlaceholder}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                        {searchTerm && (
                            <button className="clear-search" onClick={() => setSearchTerm('')}>
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <div className="custom-select-options-list">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option) => (
                                <div
                                    key={option.value}
                                    className={`custom-select-option ${value === option.value ? 'selected' : ''}`}
                                    onClick={(e) => handleSelect(option, e)}
                                >
                                    <span className="option-label">{option.label}</span>
                                    {value === option.value && <Check size={16} className="check-icon" />}
                                </div>
                            ))
                        ) : (
                            <div className="no-options">No results found</div>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default CustomSelect;
