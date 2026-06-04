import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
    Save, 
    ImageIcon, 
    LayoutGrid, 
    X, 
    RefreshCw, 
    Calendar, 
    Link as LinkIcon, 
    AlertCircle, 
    Home, 
    Gift,
    ChevronRight,
    ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';
import bannerService from '../../services/bannerService';
import productService from '../../services/productService';
import Loader from '../../components/Loader';
import CustomDatePicker from '../../components/CustomDatePicker';
import CustomSelect from '../../components/CustomSelect';
import { BASE_IMAGE_URL } from '../../config/env';
import './Banner.css';


const BannerForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = !!id;

    const [activeTab, setActiveTab] = useState('HOME_BANNER');
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(isEdit);
    
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);

    const [formData, setFormData] = useState({
        title: '',
        type: 'HOME_BANNER',
        publishDate: new Date().toISOString().split('T')[0],
        expiryDate: '',
        redirectLink: '',
        linkType: 'None',
        linkId: '',
        isActive: true,
        image: null
    });

    const [previewUrl, setPreviewUrl] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const fetchMasters = async () => {
            try {
                const [prodRes, catRes] = await Promise.all([
                    productService.getProducts({ limit: 1000 }),
                    productService.getCategories()
                ]);
                
                let productList = [];
                if (Array.isArray(prodRes)) productList = prodRes;
                else if (prodRes) productList = prodRes.products || prodRes.results || prodRes.data || [];

                let categoryList = [];
                if (Array.isArray(catRes)) categoryList = catRes;
                else if (catRes) categoryList = catRes.categories || catRes.data || catRes.results || [];

                setProducts(productList.map(p => ({ label: p.name, value: p._id })));
                setCategories(categoryList.map(c => ({ label: c.name, value: c._id })));
            } catch (error) {
                console.error("Error fetching masters", error);
            }
        };

        const fetchBanner = async () => {
            try {
                const response = await bannerService.getBannerById(id);
                if (response.success) {
                    const banner = response.banner;
                    const bannerType = banner.type || 'HOME_BANNER';
                    setFormData({
                        title: banner.title,
                        type: bannerType,
                        publishDate: new Date(banner.publishDate).toISOString().split('T')[0],
                        expiryDate: banner.expiryDate ? new Date(banner.expiryDate).toISOString().split('T')[0] : '',
                        redirectLink: banner.redirectLink || '',
                        linkType: banner.linkType || 'None',
                        linkId: banner.linkId || '',
                        isActive: banner.isActive,
                        image: null // Existing image is shown via URL
                    });
                    const imageUrl = banner.image?.startsWith('http') ? banner.image : `${BASE_IMAGE_URL}/${banner.image.replace(/^\//, '')}`;
                    console.log("Unified BannerForm Initialized for ID:", id, "Type:", bannerType);
                    setPreviewUrl(imageUrl);
                    setActiveTab(bannerType);
                }
            } catch (error) {
                toast.error('Failed to load banner details');
                navigate('/banners-list');
            } finally {
                setIsLoading(false);
            }
        };

        fetchMasters();
        if (isEdit) fetchBanner();
    }, [id, isEdit, navigate]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setFormData(prev => ({ ...prev, image: file }));
        setPreviewUrl(URL.createObjectURL(file));
        toast.success('Image selected!');
    };

    const handleTabChange = (tab) => {
        if (isEdit) return; // Prevent tab change during edit if needed, or handle conversion
        setActiveTab(tab);
        setFormData(prev => ({ ...prev, type: tab }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title.trim()) return toast.error('Title is required');
        if (!previewUrl) return toast.error('Please upload a banner image');

        setIsSaving(true);
        try {
            const data = new FormData();
            data.append('title', formData.title);
            data.append('type', formData.type);
            data.append('publishDate', formData.publishDate);
            if (formData.expiryDate) data.append('expiryDate', formData.expiryDate);
            data.append('isActive', formData.isActive);
            data.append('linkType', formData.linkType);
            data.append('linkId', formData.linkId);
            data.append('redirectLink', formData.redirectLink);
            
            if (formData.image) {
                data.append('image', formData.image);
            }

            if (isEdit) {
                await bannerService.updateBanner(id, data);
                toast.success('Banner Updated Successfully! ✨');
            } else {
                await bannerService.createBanner(data);
                toast.success('Banner Published Successfully! 🚀');
            }
            navigate('/banners-list');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save banner');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <Loader />;

    return (
        <div className="banner-page-container fade-in">
            <div className="banner-content-pane banner-form-view absolute-unified power-ui">

                <header className="banner-header-section">
                    <div className="page-header-content">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                            <button className="action-btn" onClick={() => navigate('/banners-list')} style={{ background: 'hsl(var(--secondary) / 0.6)', border: '1px solid hsl(var(--border))' }}>
                                <ArrowLeft size={18} />
                            </button>
                            <h1 style={{ margin: 0 }}>{isEdit ? 'Edit Banner' : 'Create New Banner'}</h1>
                        </div>
                        <p style={{ marginLeft: '3.25rem' }}>Configure high-impact visual promotions for your ecosystem.</p>
                    </div>
                    <div className="header-actions">
                        {isEdit && (
                            <div className="link-id-badge" style={{ marginRight: '1rem', height: '42px' }}>
                                <AlertCircle size={14} />
                                <span>Ref: {id}</span>
                            </div>
                        )}
                        <button type="button" className="secondary-button" onClick={() => navigate('/banners-list')}>Cancel</button>
                        <button type="submit" form="banner-form" className="primary-button" disabled={isSaving}>
                            <Save size={18} /> {isSaving ? 'Processing...' : 'Save Changes'}
                        </button>
                    </div>
                </header>

                <hr className="header-divider-internal" />

                <div className="banner-type-tabs">
                    <button 
                        type="button"
                        className={`banner-tab-item ${activeTab === 'HOME_BANNER' ? 'active' : ''}`}
                        onClick={() => handleTabChange('HOME_BANNER')}
                    >
                        <Home size={16} /> Home Placement
                    </button>
                    <button 
                        type="button"
                        className={`banner-tab-item ${activeTab === 'OFFER_BANNER' ? 'active' : ''}`}
                        onClick={() => handleTabChange('OFFER_BANNER')}
                    >
                        <Gift size={16} /> Offer Placement
                    </button>
                </div>

                <form id="banner-form" className="banner-glass-card" onSubmit={handleSubmit} style={{ marginTop: '0.5rem' }}>
                    <div className="banner-form-flex">
                        <div className="banner-inputs-column">
                            <div className="banner-form-group">
                                <label><LayoutGrid size={14} /> Banner Title</label>
                                <input
                                    type="text"
                                    className="banner-input-fancy"
                                    placeholder={activeTab === 'HOME_BANNER' ? "e.g. Summer Clearance Sale" : "e.g. Exclusive Weekend Deal"}
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
                                    label={<span><Calendar size={14} style={{ marginRight: '6px' }} /> Expiry Date</span>}
                                    value={formData.expiryDate}
                                    onChange={(val) => setFormData({ ...formData, expiryDate: val })}
                                />
                            </div>

                            <div className="discount-inputs-row">
                                <div className="banner-form-group">
                                    <label><LinkIcon size={14} /> Link Type</label>
                                    <CustomSelect
                                        options={[
                                            { label: 'No Link', value: 'None' },
                                            { label: 'Product Link', value: 'Product' },
                                            { label: 'Category Link', value: 'Category' },
                                            { label: 'External URL', value: 'External' }
                                        ]}
                                        value={formData.linkType}
                                        onChange={(val) => setFormData({ ...formData, linkType: val, linkId: '', redirectLink: '' })}
                                    />
                                </div>
                                <div className="banner-form-group">
                                    <label><ChevronRight size={14} /> Link Destination / ID</label>
                                    {formData.linkType === 'Product' ? (
                                        <CustomSelect 
                                            options={products} 
                                            value={formData.linkId} 
                                            placeholder="Search for a product..."
                                            onChange={(val) => setFormData({ ...formData, linkId: val })} 
                                        />
                                    ) : formData.linkType === 'Category' ? (
                                        <CustomSelect 
                                            options={categories} 
                                            value={formData.linkId} 
                                            placeholder="Search for a category..."
                                            onChange={(val) => setFormData({ ...formData, linkId: val })} 
                                        />
                                    ) : (
                                        <input
                                            type="text"
                                            className="banner-input-fancy"
                                            placeholder={formData.linkType === 'External' ? "https://example.com/promo" : "Link destination disabled"}
                                            disabled={formData.linkType === 'None'}
                                            value={formData.linkType === 'External' ? formData.redirectLink : formData.linkId}
                                            onChange={(e) => {
                                                if (formData.linkType === 'External') {
                                                    setFormData({ ...formData, redirectLink: e.target.value });
                                                } else {
                                                    setFormData({ ...formData, linkId: e.target.value });
                                                }
                                            }}
                                        />
                                    )}
                                </div>
                            </div>


                            <div className="banner-form-group">
                                <label>Banner Visibility</label>
                                <div
                                    className="luxury-toggle-container"
                                    onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                                >
                                    <div className="luxury-toggle-info">
                                        <span className="luxury-toggle-label">Active Status</span>
                                        <span className="luxury-toggle-sub">Live banners appear instantly on the mobile app.</span>
                                    </div>
                                    <div className={`luxury-switch ${formData.isActive ? 'active' : ''}`}>
                                        <div className="luxury-knob" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Visual Preview */}

                        <div className="banner-preview-column">
                            <div className="banner-form-group">
                                <label><ImageIcon size={14} /> Banner Graphic Asset</label>
                                <div
                                    className={`banner-upload-zone ${previewUrl ? 'has-image' : ''}`}
                                    onClick={() => fileInputRef.current.click()}
                                >
                                    {previewUrl ? (
                                        <>
                                            <img src={previewUrl} alt="Preview" />
                                            <div className="upload-overlay">
                                                <RefreshCw size={24} style={{ marginBottom: '8px' }} />
                                                <span style={{ fontWeight: '700', fontSize: '0.8rem' }}>REPLACE IMAGE</span>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <ImageIcon size={40} strokeWidth={1} style={{ marginBottom: '1rem', color: 'hsl(var(--muted-foreground))' }} />
                                            <div style={{ textAlign: 'center', padding: '0 1rem' }}>
                                                <p style={{ fontWeight: '800', fontSize: '0.9rem', marginBottom: '4px', margin: 0 }}>UPLOAD BANNER</p>
                                                <p style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', margin: 0 }}>Click to select a high-quality visual</p>
                                            </div>
                                        </>
                                    )}
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        style={{ display: 'none' }}
                                        accept="image/*"
                                        onChange={handleImageChange}
                                    />
                                </div>
                                <div className="banner-guidelines" style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'hsl(var(--muted-foreground))', fontSize: '0.8rem' }}>
                                    <AlertCircle size={14} />
                                    <span>Recommended dimension: 1600x600 for wide banners.</span>
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

export default BannerForm;
