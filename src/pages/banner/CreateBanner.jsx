import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, ImageIcon, LayoutGrid, X, RefreshCw, Calendar, Link as LinkIcon, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import bannerService from '../../services/bannerService';
import Loader from '../../components/Loader';
import CustomDatePicker from '../../components/CustomDatePicker';
import './Banner.css';

const CreateBanner = () => {
    const navigate = useNavigate();
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        link: '',
        publishDate: new Date().toISOString().split('T')[0],
        expiryDate: '',
        isActive: true,
        image: null
    });

    const [previewUrl, setPreviewUrl] = useState(null);
    const fileInputRef = useRef(null);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setFormData(prev => ({ ...prev, image: file }));
        setPreviewUrl(URL.createObjectURL(file));
        toast.success('Image selected! Previewing in 16:6 format.');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title.trim()) return toast.error('Banner title is required');
        if (!formData.image) return toast.error('Please upload a 16:6 banner image');

        setIsSaving(true);
        try {
            const data = new FormData();
            data.append('title', formData.title);
            data.append('link', formData.link);
            data.append('publishDate', formData.publishDate);
            if (formData.expiryDate) data.append('expiryDate', formData.expiryDate);
            data.append('isActive', formData.isActive);
            data.append('image', formData.image);

            await bannerService.createBanner(data);
            toast.success('Banner Published Successfully! 🚀');
            navigate('/banners-list');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create banner');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="category-page-container fade-in">
            <div className="category-content-pane category-form-view absolute-unified power-ui">
                <header className="internal-page-header">
                    <div className="page-header-content">
                        <h1>Create New Banner</h1>
                        <p>Upload and schedule a premium promotion for the mobile app.</p>
                    </div>
                    <div className="header-actions">
                        <button type="button" className="secondary-button" onClick={() => navigate('/banners-list')}>Cancel</button>
                        <button type="submit" form="create-banner-form" className="primary-button" disabled={isSaving}>
                            <Save size={18} /> {isSaving ? 'Finalizing...' : 'Save Banner'}
                        </button>
                    </div>
                </header>

                <hr className="header-divider-internal" />

                <form id="create-banner-form" className="category-glass-card" onSubmit={handleSubmit}>
                    <div className="banner-form-flex">
                        {/* Left Column: All Primary Fields */}
                        <div className="banner-inputs-column">
                            <div className="banner-form-group">
                                <label><LayoutGrid size={14} /> Internal Title</label>
                                <input
                                    type="text"
                                    className="banner-input-fancy"
                                    placeholder="e.g. Summer Clearance Sale"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                    autoFocus
                                />
                            </div>

                            <div className="banner-field-row">
                                <CustomDatePicker
                                    label={<span><Calendar size={14} style={{ marginRight: '6px' }} /> Publish Date</span>}
                                    value={formData.publishDate}
                                    onChange={(val) => setFormData({ ...formData, publishDate: val })}
                                />
                                <CustomDatePicker
                                    label={<span><Calendar size={14} style={{ marginRight: '6px' }} /> Expiry Date (Optional)</span>}
                                    value={formData.expiryDate}
                                    onChange={(val) => setFormData({ ...formData, expiryDate: val })}
                                />
                            </div>

                            <div className="banner-form-group">
                                <label><LinkIcon size={14} /> Redirection Link (Optional)</label>
                                <input
                                    type="text"
                                    className="banner-input-fancy"
                                    placeholder="e.g. app://category/grocery-pantry"
                                    value={formData.link}
                                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                                />
                            </div>

                            <div className="banner-form-group">
                                <label>Mobile Availability</label>
                                <div
                                    className="luxury-toggle-container"
                                    onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                                >
                                    <div className="luxury-toggle-info">
                                        <span className="luxury-toggle-label">Active Status</span>
                                        <span className="luxury-toggle-sub">Should this banner be visible on the mobile app?</span>
                                    </div>
                                    <div className={`luxury-switch ${formData.isActive ? 'active' : ''}`}>
                                        <div className="luxury-knob" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Sticky Visual Preview */}
                        <div className="banner-preview-column">
                            <div className="banner-form-group">
                                <label><ImageIcon size={14} /> Banner Visual Preview</label>
                                <div
                                    className={`banner-upload-zone ${previewUrl ? 'has-image' : ''}`}
                                    onClick={() => fileInputRef.current.click()}
                                >
                                    {previewUrl ? (
                                        <>
                                            <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            <div className="aspect-ratio-tag">16:6 PREVIEW</div>
                                            <div className="preview-overlay">
                                                <div style={{ textAlign: 'center' }}>
                                                    <RefreshCw size={24} style={{ marginBottom: '8px' }} />
                                                    <p style={{ fontWeight: '700', fontSize: '0.8rem' }}>CHANGE IMAGE</p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                className="action-btn delete"
                                                style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10 }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setFormData({ ...formData, image: null });
                                                    setPreviewUrl(null);
                                                    if (fileInputRef.current) fileInputRef.current.value = '';
                                                }}
                                            >
                                                <X size={16} />
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <ImageIcon size={40} strokeWidth={1} style={{ marginBottom: '1rem', color: 'hsl(var(--muted-foreground))' }} />
                                            <div style={{ textAlign: 'center' }}>
                                                <p style={{ fontWeight: '800', fontSize: '0.9rem', marginBottom: '4px' }}>UPLOAD BANNER ASSET</p>
                                                <p style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>Drag and drop or click to browse</p>
                                            </div>
                                        </>
                                    )}
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        hidden
                                        accept="image/*"
                                        onChange={handleImageChange}
                                    />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '4px', color: 'hsl(var(--primary))', fontSize: '0.75rem', fontWeight: '500' }}>
                                    <AlertCircle size={14} />
                                    <span>Image auto-fits to 16:6 aspect ratio.</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
            {isSaving && <Loader />}
        </div>
    );
};

export default CreateBanner;
