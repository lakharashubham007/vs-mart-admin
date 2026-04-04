import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import './CustomDatePicker.css';

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

// Min calendar width in px
const MIN_CAL_WIDTH = 188;

const CustomDatePicker = ({ label, value, onChange, placeholder = 'Select a date' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: MIN_CAL_WIDTH, openUp: false });

    const today = new Date();
    const parsed = value ? new Date(value + 'T00:00:00') : null;
    const [viewYear, setViewYear] = useState(parsed?.getFullYear() || today.getFullYear());
    const [viewMonth, setViewMonth] = useState(parsed?.getMonth() ?? today.getMonth());

    const containerRef = useRef(null);
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (parsed) { setViewYear(parsed.getFullYear()); setViewMonth(parsed.getMonth()); }
    }, [value]);

    // Calendar width = 1/3 of input width, but no less than MIN_CAL_WIDTH
    const getCalWidth = () => {
        if (!containerRef.current) return MIN_CAL_WIDTH;
        return Math.max(Math.round(containerRef.current.offsetWidth / 3), MIN_CAL_WIDTH);
    };

    const updateCoords = () => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const calWidth = getCalWidth();
        const calHeight = 280; // approximate
        const spaceBelow = window.innerHeight - rect.bottom;
        const openUp = spaceBelow < calHeight && rect.top > calHeight;
        setCoords({
            top: openUp ? rect.top - 6 : rect.bottom + 6,
            left: rect.left,
            width: calWidth,
            openUp,
        });
    };

    useLayoutEffect(() => {
        if (isOpen) updateCoords();
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const close = () => setIsOpen(false);
        window.addEventListener('scroll', close, true);
        window.addEventListener('resize', close);
        return () => {
            window.removeEventListener('scroll', close, true);
            window.removeEventListener('resize', close);
        };
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (
                containerRef.current && !containerRef.current.contains(e.target) &&
                dropdownRef.current && !dropdownRef.current.contains(e.target)
            ) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
    const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();

    const handleDayClick = (day) => {
        const m = String(viewMonth + 1).padStart(2, '0');
        const d = String(day).padStart(2, '0');
        onChange(`${viewYear}-${m}-${d}`);
        setIsOpen(false);
    };

    const prevMonth = () => {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
        else setViewMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
        else setViewMonth(m => m + 1);
    };

    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
    const selectedDay = parsed?.getFullYear() === viewYear && parsed?.getMonth() === viewMonth ? parsed.getDate() : null;
    const todayDay = today.getFullYear() === viewYear && today.getMonth() === viewMonth ? today.getDate() : null;
    const displayValue = parsed
        ? parsed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : null;

    return (
        <div className="cdp-container" ref={containerRef}>
            {label && <label className="cdp-label">{label}</label>}
            <div
                className={`cdp-trigger ${isOpen ? 'active' : ''} ${value ? 'has-value' : ''}`}
                onClick={() => setIsOpen(o => !o)}
            >
                <Calendar size={15} className="cdp-icon-left" />
                <span className={value ? 'cdp-selected-text' : 'cdp-placeholder'}>
                    {displayValue || placeholder}
                </span>
                {value && (
                    <button className="cdp-clear-btn" onClick={(e) => { e.stopPropagation(); onChange(''); }}>
                        <X size={13} />
                    </button>
                )}
            </div>

            {isOpen && createPortal(
                <div
                    ref={dropdownRef}
                    className={`cdp-dropdown animate-cdp ${coords.openUp ? 'cdp-up' : 'cdp-down'}`}
                    style={{
                        position: 'fixed',
                        top: coords.openUp ? 'auto' : `${coords.top}px`,
                        bottom: coords.openUp ? `${window.innerHeight - coords.top}px` : 'auto',
                        left: `${coords.left}px`,
                        width: `${coords.width}px`,
                        zIndex: 99999,
                    }}
                >
                    <div className="cdp-header">
                        <button className="cdp-nav-btn" onClick={prevMonth}><ChevronLeft size={12} /></button>
                        <span className="cdp-month-label">{MONTHS[viewMonth].slice(0, 3)} {viewYear}</span>
                        <button className="cdp-nav-btn" onClick={nextMonth}><ChevronRight size={12} /></button>
                    </div>
                    <div className="cdp-days-grid">
                        {DAYS.map(d => <div key={d} className="cdp-day-name">{d}</div>)}
                        {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
                        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => (
                            <button
                                key={day}
                                className={`cdp-day-btn${day === selectedDay ? ' selected' : ''}${day === todayDay && day !== selectedDay ? ' today' : ''}`}
                                onClick={() => handleDayClick(day)}
                            >{day}</button>
                        ))}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default CustomDatePicker;
