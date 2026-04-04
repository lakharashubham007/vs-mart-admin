import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ImageIcon, LayoutGrid, X, RefreshCw, Calendar, Link as LinkIcon, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import bannerService from '../../services/bannerService';
import Loader from '../../components/Loader';
import CustomDatePicker from '../../components/CustomDatePicker';
import './Banner.css';
import { BASE_IMAGE_URL } from '../../config/env';

const EditBanner = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        link: '',
        publishDate: '',
        expiryDate: '',
        isActive: true,
        image: null
    });

    const [previewUrl, setPreviewUrl] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchBannerDetails();
    }, [id]);

    const fetchBannerDetails = async () => {
        setIsLoading(true);
        try {
            const res = await bannerService.getBannerById(id);
            const banner = res.banner;

            if (banner) {
                setFormData({
                    title: banner.title,
                    link: banner.link,
                    publishDate: banner.publishDate ? banner.publishDate.split('T')[0] : '',
                    expiryDate: banner.expiryDate ? banner.expiryDate.split('T')[0] : '',
                    isActive: banner.isActive,
                    image: null // Current image path is kept if no new file is selected
                });
                setPreviewUrl(`${BASE_IMAGE_URL}/${banner.image}`);
            }
        } catch (error) {
            toast.error('Failed to load banner details');
            navigate('/banners');
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setFormData(prev => ({ ...prev, image: file }));
        setPreviewUrl(URL.createObjectURL(file));
        toast.success('New image selected! Previewing in 16:6 format.');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const data = new FormData();
            data.append('title', formData.title);
            data.append('link', formData.link);
            data.append('publishDate', formData.publishDate);
            if (formData.expiryDate) data.append('expiryDate', formData.expiryDate);
            data.append('isActive', formData.isActive);
            if (formData.image) data.append('image', formData.image);

            await bannerService.updateBanner(id, data);
            toast.success('Banner Updated Successfully! 🚀');
            navigate('/banners-list');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Update failed');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="category-page-container fade-in">
            <div className="category-content-pane category-form-view absolute-unified power-ui">
                <header className="internal-page-header">
                    <div className="page-header-content">
                        <h1>Edit Banner</h1>
                        <p>Modify and reschedule your promotional campaign.</p>
                    </div>
                    <div className="header-actions">
                        <button type="button" className="secondary-button" onClick={() => navigate('/banners-list')}>Cancel</button>
                        <button type="submit" form="edit-banner-form" className="primary-button" disabled={isSaving}>
                            <Save size={18} /> {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </header>

                <hr className="header-divider-internal" />

                <form id="edit-banner-form" className="category-glass-card" onSubmit={handleSubmit}>
                    <div className="banner-form-flex">
                        {/* Left Column: All Primary Fields */}
                        <div className="banner-inputs-column">
                            <div className="banner-form-group">
                                <label><LayoutGrid size={14} /> Banner Title</label>
                                <input
                                    type="text"
                                    className="banner-input-fancy"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="banner-field-row">
                                <CustomDatePicker
                                    label={<span><Calendar size={14} style={{ marginRight: '6px' }} /> Publish Date</span>}
                                    value={formData.publishDate}
                                    onChange={(val) => setFormData({ ...formData, publishDate: val })}
                                />
                                <CustomDatePicker
                                    label={<span><Calendar size={14} style={{ marginRight: '6px' }} /> Expiry Date</span>}
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
                                        <span className="luxury-toggle-sub">Toggle visibility for mobile users.</span>
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
                                        <div style={{ textAlign: 'center' }}>
                                            <ImageIcon size={40} strokeWidth={1} style={{ marginBottom: '1rem', color: 'hsl(var(--muted-foreground))' }} />
                                            <p style={{ fontWeight: '800', fontSize: '0.9rem' }}>UPLOAD BANNER ASSET</p>
                                        </div>
                                    )}
                                    <input ref={fileInputRef} type="file" hidden accept="image/*" onChange={handleImageChange} />
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
            {(isLoading || isSaving) && <Loader />}
        </div>
    );
};

export default EditBanner;
