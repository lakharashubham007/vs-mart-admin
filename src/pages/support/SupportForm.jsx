import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Save, Globe, Phone, Mail, Instagram, Facebook, HelpCircle, MessageSquare, Plus, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import supportService from '../../services/supportService';
import Loader from '../../components/Loader';
import './Support.css';

const ICON_OPTIONS = [
    { name: 'Phone', icon: Phone },
    { name: 'Mail', icon: Mail },
    { name: 'Globe', icon: Globe },
    { name: 'Instagram', icon: Instagram },
    { name: 'Facebook', icon: Facebook },
    { name: 'MessageSquare', icon: MessageSquare },
    { name: 'HelpCircle', icon: HelpCircle },
];

const SupportForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = !!id;

    const [isLoading, setIsLoading] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const [formData, setFormData] = useState({
        title: '',
        value: '',
        url: '',
        icon: 'HelpCircle',
        color: '#1A6B3A',
        bgColor: 'rgba(26, 107, 58, 0.1)',
        displayOrder: 0,
        isActive: true
    });

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isEdit) {
            fetchSupportDetails();
        }
    }, [id]);

    const fetchSupportDetails = async () => {
        setIsLoading(true);
        try {
            const data = await supportService.getSupportById(id);
            setFormData(data);
        } catch (error) {
            toast.error('Failed to load support details');
            navigate('/support');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (name === 'displayOrder' ? parseInt(value) || 0 : value)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            if (id) {
                await supportService.updateSupport(id, formData);
                toast.success('Contact channel updated successfully!');
            } else {
                await supportService.createSupport(formData);
                toast.success('Contact channel created successfully!');
            }
            navigate('/cms/support-us');
        } catch (error) {
            toast.error(error.message || 'Failed to save support option');
        } finally {
            setIsLoading(false);
        }
    };

    const SelectedIcon = ICON_OPTIONS.find(i => i.name === formData.icon)?.icon || HelpCircle;

    return (
        <div className="support-page-container fade-in">
            <div className="support-content-pane">
                <header className="support-header-section">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <button onClick={() => navigate('/support')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: 'hsl(var(--foreground))' }}>
                            <ChevronLeft size={18} />
                        </button>
                        <span style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'hsl(var(--primary))' }}>
                            CMS / Support Us
                        </span>
                    </div>
                    <h1 className="support-header-title">
                        {id ? 'Edit Support Channel' : 'Add Support Channel'}
                    </h1>
                    <p className="support-header-sub">
                        {isEdit ? 'Update the details of your support method for the mobile application.' : 'Define a new way for users to reach out to your support team.'}
                    </p>
                </header>

                <div className="support-glass-card">
                    <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid hsl(var(--border)/0.2)', paddingBottom: '1rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'hsl(var(--primary))', margin: 0 }}>
                            Support Configuration
                        </h3>
                    </div>

                    <form onSubmit={handleSubmit} className="support-grid">
                        <div className="support-field-group">
                            <label className="support-label"><Plus size={14} /> Title (e.g. Call Us)</label>
                            <input
                                type="text"
                                name="title"
                                className="support-input"
                                style={{ fontSize: '1.1rem', fontWeight: 800 }}
                                value={formData.title}
                                onChange={handleChange}
                                required
                                placeholder="Call Us, Email Us, etc."
                            />
                        </div>

                        <div className="support-field-group">
                            <label className="support-label"><MessageSquare size={14} /> Value (Display Text)</label>
                            <input
                                type="text"
                                name="value"
                                className="support-input"
                                value={formData.value}
                                onChange={handleChange}
                                required
                                placeholder="+1 (800) 123-4567"
                            />
                        </div>

                        <div className="support-field-group full-width">
                            <label className="support-label"><Globe size={14} /> Action URL (Link)</label>
                            <input
                                type="text"
                                name="url"
                                className="support-input"
                                value={formData.url}
                                onChange={handleChange}
                                required
                                placeholder="tel:+18001234567, mailto:hi@test.com, https://..."
                            />
                        </div>

                        <div className="support-field-group">
                            <label className="support-label">Icon</label>
                            <div className="custom-dropdown-container" ref={dropdownRef}>
                                <div
                                    className={`custom-dropdown-trigger ${isDropdownOpen ? 'open' : ''}`}
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                >
                                    <div className="trigger-content">
                                        <SelectedIcon size={18} strokeWidth={2.5} />
                                        <span>{formData.icon}</span>
                                    </div>
                                    <ChevronDown size={18} style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'none', transition: '0.3s' }} />
                                </div>
                                {isDropdownOpen && (
                                    <div className="custom-dropdown-menu">
                                        {ICON_OPTIONS.map(opt => {
                                            const IconComp = opt.icon;
                                            return (
                                                <div
                                                    key={opt.name}
                                                    className={`custom-dropdown-item ${formData.icon === opt.name ? 'selected' : ''}`}
                                                    onClick={() => {
                                                        setFormData(prev => ({ ...prev, icon: opt.name }));
                                                        setIsDropdownOpen(false);
                                                    }}
                                                >
                                                    <div className="item-icon">
                                                        <IconComp size={18} />
                                                    </div>
                                                    <span>{opt.name}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="support-field-group">
                            <label className="support-label">Display Order</label>
                            <input
                                type="number"
                                name="displayOrder"
                                className="support-input"
                                value={formData.displayOrder}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="support-field-group">
                            <label className="support-label">Primary Color</label>
                            <div className="color-preview-group">
                                <input
                                    type="color"
                                    name="color"
                                    className="support-input"
                                    style={{ width: '80px', padding: '4px', height: '48px' }}
                                    value={formData.color}
                                    onChange={handleChange}
                                />
                                <div className="color-circle" style={{ backgroundColor: formData.color }}></div>
                            </div>
                        </div>

                        <div className="support-field-group">
                            <label className="support-label">Background (RGBA Tint)</label>
                            <input
                                type="text"
                                name="bgColor"
                                className="support-input"
                                value={formData.bgColor}
                                onChange={handleChange}
                                placeholder="rgba(30, 132, 73, 0.1)"
                            />
                        </div>

                        <div className="support-field-group full-width">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px', borderRadius: '14px', background: 'hsl(var(--primary) / 0.05)', border: '1px solid hsl(var(--primary) / 0.1)', marginTop: '1rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <span style={{ fontSize: '0.9rem', fontWeight: '700' }}>Active Visibility</span>
                                    <span style={{ fontSize: '0.7rem', color: 'hsl(var(--muted-foreground))' }}>Enable/Disable this method in the mobile app.</span>
                                </div>
                                <label className="switch">
                                    <input
                                        type="checkbox"
                                        name="isActive"
                                        checked={formData.isActive}
                                        onChange={handleChange}
                                    />
                                    <span className="slider round"></span>
                                </label>
                            </div>
                        </div>
                    </form>

                    <footer className="support-action-footer">
                        <button type="button" className="btn-premium-outline" onClick={() => navigate('/support')} style={{ height: '52px', borderRadius: '0.75rem', padding: '0 2rem' }}>
                            Cancel Changes
                        </button>
                        <button type="button" className="btn-premium-primary" onClick={handleSubmit} disabled={isLoading} style={{ height: '52px', borderRadius: '0.75rem', padding: '0 2.5rem', background: 'hsl(var(--primary))', color: 'white', opacity: isLoading ? 0.7 : 1 }}>
                            <Save size={18} style={{ marginRight: '8px' }} /> {isLoading ? 'Processing...' : (isEdit ? 'Update Configuration' : 'Save Configuration')}
                        </button>
                    </footer>
                </div>

                {/* Live Preview Section */}
                <div className="preview-section">
                    <div className="preview-badge-header">
                        <div className="preview-badge-icon">
                            <Phone size={16} />
                        </div>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'hsl(var(--foreground))', margin: 0 }}>High-Fidelity Mobile Preview</h4>
                    </div>

                    <div className="preview-card">
                        <div className="preview-icon-box" style={{
                            backgroundColor: formData.bgColor || 'rgba(30, 132, 73, 0.1)',
                            boxShadow: `0 8px 24px ${formData.color}30`
                        }}>
                            <SelectedIcon size={32} color={formData.color || '#1e8449'} strokeWidth={2.5} />
                        </div>
                        <div className="preview-info">
                            <div className="preview-title" style={{ color: formData.color || '#7A9E8A' }}>
                                {formData.title || 'Support Title'}
                            </div>
                            <div className="preview-value">
                                {formData.value || 'Contact Details'}
                            </div>
                        </div>
                    </div>
                    <p style={{ marginTop: '1.5rem', fontSize: '0.9rem', color: 'hsl(var(--muted-foreground))', fontStyle: 'italic', fontWeight: '500' }}>
                        * This preview represents exactly how the element will render in the "Reach Out" section of the VSMart mobile application.
                    </p>
                </div>
            </div>
            {isLoading && <Loader />}
        </div>
    );
};

export default SupportForm;
