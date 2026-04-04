import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft,
    Save,
    Info,
    FileText,
    Layout,
    Type,
    Globe,
    CheckCircle2,
    AlertCircle,
    Eye
} from 'lucide-react';
import cmsService from '../../services/cmsService';
import Loader from '../../components/Loader';
import toast from 'react-hot-toast';

const INDIAN_GROCERY_TERMS = `
<h1>Terms and Conditions for VS Mart</h1>
<p>Effective Date: ${new Date().toLocaleDateString()}</p>

<h2>1. Introduction</h2>
<p>Welcome to VS Mart. These Terms and Conditions govern your use of our mobile application and services for grocery delivery in India.</p>

<h2>2. Service Availability</h2>
<p>Our services are currently available in selected cities across India. Delivery times are estimates and may vary based on traffic, weather, and stock availability.</p>

<h2>3. Pricing and Payments</h2>
<p>All prices are in Indian Rupees (INR) and are inclusive of GST where applicable. We accept payments via UPI, Credit/Debit Cards, and Net Banking. Cash on Delivery (COD) may be available for specific order values.</p>

<h2>4. Quality and Returns</h2>
<p>We strive to provide fresh produce and quality products. If you receive damaged or expired items, please report it within 2 hours of delivery for fresh items and 24 hours for packaged goods.</p>

<h2>5. Licensing and Compliance</h2>
<p>VS Mart operates in compliance with FSSAI regulations and other local Indian laws pertaining to food safety and e-commerce.</p>

<p>By using our app, you agree to these terms.</p>
`;

const CMSForm = () => {
    const { type } = useParams();
    const isEdit = !!type;
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(isEdit);
    const [isSaving, setIsSaving] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);

    const [formData, setFormData] = useState({
        type: type || '',
        title: '',
        content: '',
        isActive: true
    });

    const labelMap = {
        terms: 'Terms & Conditions',
        privacy: 'Privacy Policy'
    };

    useEffect(() => {
        if (isEdit) {
            fetchCMSContent();
        } else {
            // Default template for new creation
            setFormData(prev => ({
                ...prev,
                title: 'New Policy Page',
                content: '<h1>New Content Page</h1><p>Start writing your content here...</p>'
            }));
        }
    }, [type]);

    const fetchCMSContent = async () => {
        setIsLoading(true);
        try {
            const res = await cmsService.getCMSByType(type);
            if (res.success && res.data) {
                setFormData({
                    type: res.data.type,
                    title: res.data.title || '',
                    content: res.data.content || '',
                    isActive: res.data.isActive ?? true
                });
            }
        } catch (error) {
            toast.error('Failed to load content');
            navigate('/cms');
        } finally {
            setIsLoading(false);
        }
    };

    const loadTemplate = () => {
        if (formData.type === 'terms' || formData.title.toLowerCase().includes('terms')) {
            setFormData(prev => ({ ...prev, content: INDIAN_GROCERY_TERMS }));
            toast.success('Indian Grocery Terms template loaded!');
        } else {
            toast.error('No specific template found for this type. Try using "terms" as the type.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.content || !formData.type) {
            return toast.error('Please fill in all required fields');
        }

        setIsSaving(true);
        try {
            // Always use updateCMS because the backend handler Upserts
            await cmsService.updateCMS(formData.type, formData);
            toast.success(`Content ${isEdit ? 'updated' : 'created'} successfully`);
            navigate('/cms');
        } catch (error) {
            toast.error('Failed to save content');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <Loader />;

    return (
        <div className="stock-page-container fade-in" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div className="stock-content-pane">
                <header className="stock-header-section" style={{ marginBottom: '2.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <button onClick={() => navigate('/cms')} className="secondary-button" style={{ padding: '8px', width: '36px', height: '36px', borderRadius: '10px' }}>
                            <ArrowLeft size={18} />
                        </button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'hsl(var(--muted-foreground))' }}>
                                CMS
                            </span>
                            <span style={{ color: 'hsl(var(--muted-foreground) / 0.5)' }}>/</span>
                            <span style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'hsl(var(--primary))' }}>
                                {isEdit ? 'Edit Document' : 'Create New Document'}
                            </span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h1 style={{ fontSize: '2.5rem', fontWeight: '900', letterSpacing: '-0.03em', margin: 0 }}>
                                {isEdit ? `Editing ${labelMap[formData.type] || formData.title}` : 'Build Content Page'}
                            </h1>
                            <p style={{ margin: '8px 0 0 0', color: 'hsl(var(--muted-foreground))', fontSize: '1.1rem' }}>
                                Use this editor to create legal agreements and help pages for your Indian grocery audience.
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            {!isEdit && (
                                <button type="button" className="secondary-button" onClick={loadTemplate} style={{ gap: '8px', fontWeight: '600' }}>
                                    <Globe size={16} /> Load Indian Template
                                </button>
                            )}
                            <button type="button" className="secondary-button" onClick={() => setPreviewMode(!previewMode)} style={{ gap: '8px', fontWeight: '600' }}>
                                {previewMode ? <Layout size={16} /> : <Eye size={16} />}
                                {previewMode ? 'Back to Editor' : 'Live Preview'}
                            </button>
                        </div>
                    </div>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem', alignItems: 'start' }}>
                    <div className="stock-glass-card" style={{ padding: '2rem', border: '1px solid hsl(var(--primary) / 0.1)', background: 'hsl(var(--card) / 0.4)', backdropFilter: 'blur(10px)' }}>
                        {previewMode ? (
                            <div className="cms-preview" style={{ minHeight: '500px', backgroundColor: 'white', padding: '3rem', borderRadius: '16px', color: '#1a202c', boxShadow: 'inset 0 2px 4px 0 rgba(0,0,0,0.06)' }}>
                                <div dangerouslySetInnerHTML={{ __html: formData.content }} />
                            </div>
                        ) : (
                            <form id="cms-main-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                <div className="stock-field-group">
                                    <label className="stock-label" style={{ fontSize: '0.9rem', marginBottom: '8px' }}>
                                        <Type size={16} style={{ color: 'hsl(var(--primary))' }} /> Document Title
                                    </label>
                                    <input
                                        type="text"
                                        className="stock-input"
                                        style={{ fontSize: '1.25rem', fontWeight: '700', padding: '1rem', borderRadius: '14px', border: '1px solid hsl(var(--border) / 0.5)' }}
                                        value={formData.title}
                                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                        placeholder="e.g. Terms & Conditions"
                                        required
                                    />
                                </div>

                                <div className="stock-field-group">
                                    <label className="stock-label" style={{ fontSize: '0.9rem', marginBottom: '8px' }}>
                                        <FileText size={16} style={{ color: 'hsl(var(--primary))' }} /> Page Content (HTML/Rich Text)
                                    </label>
                                    <textarea
                                        className="stock-input"
                                        style={{ minHeight: '500px', padding: '1.5rem', lineHeight: '1.6', fontFamily: 'monospace', borderRadius: '14px', border: '1px solid hsl(var(--border) / 0.5)', background: 'hsl(var(--background) / 0.3)' }}
                                        value={formData.content}
                                        onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                                        placeholder="Paste your legal content or HTML markup here..."
                                        required
                                    />
                                </div>
                            </form>
                        )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="stock-glass-card" style={{ padding: '1.5rem', border: '1px solid hsl(var(--border) / 0.5)' }}>
                            <h3 style={{ margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', fontWeight: '800' }}>
                                <Info size={16} /> Configuration
                            </h3>

                            <div className="stock-field-group" style={{ marginBottom: '1.5rem' }}>
                                <label className="stock-label" style={{ fontSize: '0.85rem' }}>URL Identifier (slug)</label>
                                <input
                                    type="text"
                                    className="stock-input"
                                    style={{ fontSize: '0.9rem', opacity: isEdit ? 0.7 : 1 }}
                                    value={formData.type}
                                    onChange={(e) => !isEdit && setFormData(prev => ({ ...prev, type: e.target.value.toLowerCase().replace(/\s+/g, '_') }))}
                                    placeholder="e.g. terms_and_conditions"
                                    disabled={isEdit}
                                    required
                                />
                                <small style={{ display: 'block', marginTop: '4px', color: 'hsl(var(--muted-foreground))' }}>
                                    Unique ID used for the mobile app route.
                                </small>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: '12px', background: 'hsl(var(--muted) / 0.3)' }}>
                                <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>Publish Status</span>
                                <label className="switch">
                                    <input
                                        type="checkbox"
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                                    />
                                    <span className="slider round"></span>
                                </label>
                            </div>
                        </div>

                        <div className="stock-glass-card" style={{ padding: '1.5rem', border: '1px solid hsl(var(--primary) / 0.2)', background: 'linear-gradient(135deg, hsl(var(--primary) / 0.05), transparent)' }}>
                            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: '800' }}>Actions</h3>
                            <button
                                form="cms-main-form"
                                type="submit"
                                className="primary-button"
                                disabled={isSaving}
                                style={{ width: '100%', height: '54px', borderRadius: '14px', gap: '10px', background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))', fontSize: '1rem', fontWeight: '700' }}
                            >
                                {isSaving ? <Loader size={18} /> : <Save size={20} />}
                                {isSaving ? 'Saving...' : 'Publish Content'}
                            </button>
                            <button
                                type="button"
                                className="secondary-button"
                                onClick={() => navigate('/cms')}
                                style={{ width: '100%', marginTop: '10px', height: '50px', border: 'none' }}
                            >
                                Discard Changes
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CMSForm;
