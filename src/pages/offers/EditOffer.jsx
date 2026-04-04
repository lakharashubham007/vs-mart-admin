import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ImageIcon, LayoutGrid, X, RefreshCw, Calendar, Link as LinkIcon, Hash } from 'lucide-react';
import toast from 'react-hot-toast';
import offerService from '../../services/offerService';
import { BASE_IMAGE_URL as ROOT_URL } from '../../config/env';
import Loader from '../../components/Loader';
import CustomDatePicker from '../../components/CustomDatePicker';
import CustomSelect from '../../components/CustomSelect';
import './Offer.css';

const EditOffer = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        discountType: 'Percentage',
        discountValue: 0,
        linkType: 'None',
        linkId: '',
        startDate: '',
        expiryDate: '',
        isActive: true,
        image: null
    });

    const [previewUrl, setPreviewUrl] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchOfferDetails();
    }, [id]);

    const fetchOfferDetails = async () => {
        try {
            const res = await offerService.getOfferById(id);
            const offer = res.offer;
            setFormData({
                title: offer.title || '',
                description: offer.description || '',
                discountType: offer.discountType || 'Percentage',
                discountValue: offer.discountValue || 0,
                linkType: offer.linkType || 'None',
                linkId: offer.linkId || '',
                startDate: offer.startDate ? offer.startDate.split('T')[0] : '',
                expiryDate: offer.expiryDate ? offer.expiryDate.split('T')[0] : '',
                isActive: offer.isActive,
                image: null
            });
            if (offer.image) {
                setPreviewUrl(`${ROOT_URL}/${offer.image}`);
            }
        } catch (error) {
            toast.error('Failed to load offer details');
            navigate('/offers-list');
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setFormData(prev => ({ ...prev, image: file }));
        setPreviewUrl(URL.createObjectURL(file));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title.trim()) return toast.error('Title is required');

        setIsSaving(true);
        try {
            const data = new FormData();
            Object.keys(formData).forEach(key => {
                if (key === 'image' && !formData[key]) return;
                data.append(key, formData[key]);
            });

            await offerService.updateOffer(id, data);
            toast.success('Offer Updated Successfully! ✨');
            navigate('/offers-list');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Update failed');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <Loader />;

    return (
        <div className="offer-page-container fade-in">
            <div className="offer-form-view category-content-pane absolute-unified power-ui">
                <header className="internal-page-header">
                    <div className="page-header-content">
                        <h1>Edit Offer Campaign</h1>
                        <p>Adjust current promotional details and visual assets.</p>
                    </div>
                    <div className="header-actions">
                        <button type="button" className="secondary-button" onClick={() => navigate('/offers-list')}>Cancel</button>
                        <button type="submit" form="edit-offer-form" className="primary-button" disabled={isSaving}>
                            <Save size={18} /> {isSaving ? 'Updating...' : 'Update Offer'}
                        </button>
                    </div>
                </header>

                <hr className="header-divider-internal" />

                <form id="edit-offer-form" className="offer-glass-card" onSubmit={handleSubmit}>
                    <div className="offer-form-flex">
                        <div className="offer-inputs-column">
                            <div className="banner-form-group">
                                <label><LayoutGrid size={14} /> Offer Title</label>
                                <input
                                    type="text"
                                    className="offer-input-fancy"
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
                                        disabled={formData.linkType === 'None'}
                                        value={formData.linkId}
                                        onChange={(e) => setFormData({ ...formData, linkId: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="banner-form-group">
                                <label>Visibility Control</label>
                                <div
                                    className="luxury-toggle-container"
                                    onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                                >
                                    <div className="luxury-toggle-info">
                                        <span className="luxury-toggle-label">Active Campaign</span>
                                        <span className="luxury-toggle-sub">Should customers see this offer?</span>
                                    </div>
                                    <div className={`luxury-switch ${formData.isActive ? 'active' : ''}`}>
                                        <div className="luxury-knob" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="offer-preview-column">
                            <div className="banner-form-group">
                                <label><ImageIcon size={14} /> Poster Asset</label>
                                <div
                                    className={`offer-upload-zone has-image`}
                                    onClick={() => fileInputRef.current.click()}
                                >
                                    {previewUrl && (
                                        <>
                                            <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            <div className="preview-overlay">
                                                <div style={{ textAlign: 'center' }}>
                                                    <RefreshCw size={24} style={{ marginBottom: '8px' }} />
                                                    <p style={{ fontWeight: '700', fontSize: '0.8rem' }}>REPLACE ASSET</p>
                                                </div>
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

export default EditOffer;
