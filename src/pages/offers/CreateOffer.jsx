import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, ImageIcon, LayoutGrid, X, RefreshCw, Calendar, Link as LinkIcon, AlertCircle, Percent, Hash } from 'lucide-react';
import toast from 'react-hot-toast';
import offerService from '../../services/offerService';
import Loader from '../../components/Loader';
import CustomDatePicker from '../../components/CustomDatePicker';
import CustomSelect from '../../components/CustomSelect';
import './Offer.css';

const CreateOffer = () => {
    const navigate = useNavigate();
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        discountType: 'Percentage',
        discountValue: 0,
        linkType: 'None',
        linkId: '',
        startDate: new Date().toISOString().split('T')[0],
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
        toast.success('Offer image selected!');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title.trim()) return toast.error('Offer title is required');
        if (!formData.image) return toast.error('Please upload an offer image');

        setIsSaving(true);
        try {
            const data = new FormData();
            Object.keys(formData).forEach(key => {
                if (formData[key] !== null && formData[key] !== '') {
                    data.append(key, formData[key]);
                }
            });

            await offerService.createOffer(data);
            toast.success('Offer Created Successfully! 🚀');
            navigate('/offers-list');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create offer');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="offer-page-container fade-in">
            <div className="offer-form-view category-content-pane absolute-unified power-ui">
                <header className="internal-page-header">
                    <div className="page-header-content">
                        <h1>Create New Offer</h1>
                        <p>Launch a new promotional campaign with an attractive banner.</p>
                    </div>
                    <div className="header-actions">
                        <button type="button" className="secondary-button" onClick={() => navigate('/offers-list')}>Cancel</button>
                        <button type="submit" form="create-offer-form" className="primary-button" disabled={isSaving}>
                            <Save size={18} /> {isSaving ? 'Saving...' : 'Save Offer'}
                        </button>
                    </div>
                </header>

                <hr className="header-divider-internal" />

                <form id="create-offer-form" className="offer-glass-card" onSubmit={handleSubmit}>
                    <div className="offer-form-flex">
                        {/* Left Column */}
                        <div className="offer-inputs-column">
                            <div className="banner-form-group">
                                <label><LayoutGrid size={14} /> Offer Title</label>
                                <input
                                    type="text"
                                    className="offer-input-fancy"
                                    placeholder="e.g. Festival Special 50% Off"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="discount-inputs-row">
                                <div className="banner-form-group">
                                    <label>Discount Type</label>
                                    <CustomSelect
                                        options={[
                                            { label: 'Percentage (%)', value: 'Percentage' },
                                            { label: 'Fixed Amount (₹)', value: 'Fixed' }
                                        ]}
                                        value={formData.discountType}
                                        onChange={(val) => setFormData({ ...formData, discountType: val })}
                                    />
                                </div>
                                <div className="banner-form-group">
                                    <label><Hash size={14} /> Discount Value</label>
                                    <input
                                        type="number"
                                        className="offer-input-fancy"
                                        value={formData.discountValue}
                                        onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="banner-field-row">
                                <CustomDatePicker
                                    label={<span><Calendar size={14} style={{ marginRight: '6px' }} /> Start Date</span>}
                                    value={formData.startDate}
                                    onChange={(val) => setFormData({ ...formData, startDate: val })}
                                />
                                <CustomDatePicker
                                    label={<span><Calendar size={14} style={{ marginRight: '6px' }} /> End Date</span>}
                                    value={formData.expiryDate}
                                    onChange={(val) => setFormData({ ...formData, expiryDate: val })}
                                />
                            </div>

                            <div className="discount-inputs-row">
                                <div className="banner-form-group">
                                    <label>Link Type</label>
                                    <CustomSelect
                                        options={[
                                            { label: 'No Link', value: 'None' },
                                            { label: 'Product', value: 'Product' },
                                            { label: 'Category', value: 'Category' },
                                            { label: 'External URL', value: 'External' }
                                        ]}
                                        value={formData.linkType}
                                        onChange={(val) => setFormData({ ...formData, linkType: val })}
                                    />
                                </div>
                                <div className="banner-form-group">
                                    <label><LinkIcon size={14} /> Link ID / URL</label>
                                    <input
                                        type="text"
                                        className="offer-input-fancy"
                                        placeholder={formData.linkType === 'External' ? 'https://...' : 'ID from masters'}
                                        disabled={formData.linkType === 'None'}
                                        value={formData.linkId}
                                        onChange={(e) => setFormData({ ...formData, linkId: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="banner-form-group">
                                <label>Visibility</label>
                                <div
                                    className="luxury-toggle-container"
                                    onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                                >
                                    <div className="luxury-toggle-info">
                                        <span className="luxury-toggle-label">Active Status</span>
                                        <span className="luxury-toggle-sub">Should this offer be visible to customers?</span>
                                    </div>
                                    <div className={`luxury-switch ${formData.isActive ? 'active' : ''}`}>
                                        <div className="luxury-knob" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="offer-preview-column">
                            <div className="banner-form-group">
                                <label><ImageIcon size={14} /> Offer Image (16:6 Recommended)</label>
                                <div
                                    className={`offer-upload-zone ${previewUrl ? 'has-image' : ''}`}
                                    onClick={() => fileInputRef.current.click()}
                                >
                                    {previewUrl ? (
                                        <>
                                            <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                                                <p style={{ fontWeight: '800', fontSize: '0.9rem', marginBottom: '4px' }}>UPLOAD ASSET</p>
                                                <p style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>Click to browse offer image</p>
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
                            </div>
                        </div>
                    </div>
                </form>
            </div>
            {isSaving && <Loader />}
        </div>
    );
};

export default CreateOffer;
