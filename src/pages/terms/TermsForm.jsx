import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft,
    Save,
    Info,
    FileText,
    Layout,
    Type,
    CheckCircle2,
    Eye,
    AlignLeft
} from 'lucide-react';
import termsService from '../../services/termsService';
import Loader from '../../components/Loader';
import toast from 'react-hot-toast';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './Terms.css';

const TermsForm = () => {
    const { id } = useParams();
    const isEdit = !!id;
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(isEdit);
    const [isSaving, setIsSaving] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        content: '',
        isActive: false
    });

    useEffect(() => {
        if (isEdit) {
            fetchTermDetails();
        }
    }, [id]);

    const fetchTermDetails = async () => {
        setIsLoading(true);
        try {
            const res = await termsService.getTermById(id);
            if (res.success && res.data) {
                setFormData({
                    title: res.data.title || '',
                    description: res.data.description || '',
                    content: res.data.content || '',
                    isActive: res.data.isActive ?? false
                });
            }
        } catch (error) {
            toast.error('Failed to load Term details');
            navigate('/terms');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.content) {
            return toast.error('Please fill in required fields (Title & Content)');
        }

        setIsSaving(true);
        try {
            if (isEdit) {
                await termsService.updateTerm(id, formData);
                toast.success('Terms updated successfully');
            } else {
                await termsService.createTerm(formData);
                toast.success('New Terms created successfully');
            }
            navigate('/cms/terms');
        } catch (error) {
            toast.error('Failed to save terms');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <Loader />;

    return (
        <div className="stock-page-container fade-in">
            <div className="stock-content-pane">
                <header className="stock-header-section" style={{ marginBottom: '2.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <button onClick={() => navigate('/cms/terms')} className="secondary-button" style={{ padding: '8px', width: '36px', height: '36px', borderRadius: '10px' }}>
                            <ArrowLeft size={18} />
                        </button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'hsl(var(--muted-foreground))' }}>
                                LEGAL
                            </span>
                            <span style={{ color: 'hsl(var(--muted-foreground) / 0.5)' }}>/</span>
                            <span style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'hsl(var(--primary))' }}>
                                {isEdit ? 'Edit Agreement' : 'Create New Agreement'}
                            </span>
                        </div>
                    </div>
                    <div className="legal-header-flex">
                        <div style={{ maxWidth: '700px' }}>
                            <h1 style={{ fontSize: '2.5rem', fontWeight: '900', letterSpacing: '-0.03em', margin: 0 }}>
                                {isEdit ? `Editing: ${formData.title}` : 'Build New Agreement'}
                            </h1>
                            <p style={{ margin: '8px 0 0 0', color: 'hsl(var(--muted-foreground))', fontSize: '1.1rem' }}>
                                Draft the legal terms, privacy policies, or service agreements for your marketplace users.
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button type="button" className="secondary-button" onClick={() => setPreviewMode(!previewMode)} style={{ gap: '8px', fontWeight: '600', height: '44px' }}>
                                {previewMode ? <Layout size={16} /> : <Eye size={16} />}
                                {previewMode ? 'Back to Editor' : 'Live Preview'}
                            </button>
                        </div>
                    </div>
                </header>

                <div className="legal-form-grid">
                    <div className="stock-glass-card" style={{ padding: '2rem', border: '1px solid hsl(var(--primary) / 0.1)', background: 'hsl(var(--card) / 0.4)', backdropFilter: 'blur(10px)' }}>
                        {previewMode ? (
                            <div className="preview-container" style={{ minHeight: '600px', backgroundColor: 'white', padding: '3.5rem', borderRadius: '20px', color: '#1a202c', boxShadow: 'inset 0 2px 10px 0 rgba(0,0,0,0.04)', overflowY: 'auto' }}>
                                <div style={{ marginBottom: '2rem', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
                                    <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: '800' }}>{formData.title}</h1>
                                    <p style={{ color: '#718096', marginTop: '0.5rem' }}>{formData.description}</p>
                                </div>
                                <div
                                    className="rich-text-preview"
                                    style={{ lineHeight: '1.8', fontSize: '1.1rem' }}
                                    dangerouslySetInnerHTML={{ __html: formData.content }}
                                />
                            </div>
                        ) : (
                            <form id="terms-main-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                <div className="stock-field-group">
                                    <label className="stock-label">
                                        <Type size={16} style={{ color: 'hsl(var(--primary))' }} /> Document Title
                                    </label>
                                    <input
                                        type="text"
                                        className="stock-input"
                                        style={{ fontSize: '1.25rem', fontWeight: '700', padding: '1rem', borderRadius: '14px' }}
                                        value={formData.title}
                                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                        placeholder="e.g. VS Mart General Terms & Conditions"
                                        required
                                    />
                                </div>

                                <div className="stock-field-group">
                                    <label className="stock-label">
                                        <AlignLeft size={16} style={{ color: 'hsl(var(--primary))' }} /> Short Description
                                    </label>
                                    <input
                                        type="text"
                                        className="stock-input"
                                        value={formData.description}
                                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                        placeholder="Briefly describe what this version covers..."
                                    />
                                </div>

                                <div className="stock-field-group">
                                    <label className="stock-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span><FileText size={16} style={{ color: 'hsl(var(--primary))' }} /> Content Editor</span>
                                        <span style={{ fontSize: '0.7rem', color: 'hsl(var(--muted-foreground))', fontWeight: '600' }}>RICH TEXT EDITOR</span>
                                    </label>
                                    <div className="quill-editor-wrapper">
                                        <ReactQuill
                                            theme="snow"
                                            value={formData.content}
                                            onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                                            placeholder="Draft your agreement content here..."
                                            modules={{
                                                toolbar: [
                                                    [{ 'header': [1, 2, 3, false] }],
                                                    ['bold', 'italic', 'underline', 'strike'],
                                                    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                                                    ['link', 'clean']
                                                ],
                                            }}
                                        />
                                    </div>
                                </div>
                            </form>
                        )}
                    </div>

                    <div className="legal-form-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'sticky', top: '2rem' }}>
                        <div className="stock-glass-card" style={{ padding: '1.5rem', border: '1px solid hsl(var(--border) / 0.5)' }}>
                            <h3 style={{ margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', fontWeight: '800' }}>
                                <Info size={16} /> Publication
                            </h3>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px', borderRadius: '14px', background: 'hsl(var(--primary) / 0.05)', border: '1px solid hsl(var(--primary) / 0.1)' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <span style={{ fontSize: '0.9rem', fontWeight: '700' }}>Set as Active</span>
                                    <span style={{ fontSize: '0.7rem', color: 'hsl(var(--muted-foreground))' }}>Deactivates current version</span>
                                </div>
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
                            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: '800' }}>Control Actions</h3>
                            <button
                                form="terms-main-form"
                                type="submit"
                                className="primary-button"
                                disabled={isSaving}
                                style={{ width: '100%', height: '54px', borderRadius: '14px', gap: '10px', background: 'hsl(var(--primary))', fontSize: '1rem', fontWeight: '700', boxShadow: '0 4px 14px 0 hsl(var(--primary) / 0.3)' }}
                            >
                                {isSaving ? <Loader size={18} /> : <Save size={20} />}
                                {isSaving ? 'Processing...' : 'Save & Publish'}
                            </button>
                            <button
                                type="button"
                                className="secondary-button"
                                onClick={() => navigate('/cms/terms')}
                                style={{ width: '100%', marginTop: '10px', height: '50px', border: 'none', background: 'transparent' }}
                            >
                                Back to List
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TermsForm;
