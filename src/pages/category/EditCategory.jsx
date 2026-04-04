import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, LayoutGrid, Layers, Image as ImageIcon, Check, Info, X, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import productService from '../../services/productService';
import Loader from '../../components/Loader';
import './Category.css';

import { BASE_IMAGE_URL } from '../../config/env';

const EditCategory = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [parentCategories, setParentCategories] = useState([]);

    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        parentId: '',
        type: 'Standard',
        status: true,
        image: null,
        attributeIds: [],
        variantTypeIds: [],
        addonIds: []
    });

    const [previewUrl, setPreviewUrl] = useState(null);
    const [existingImageUrl, setExistingImageUrl] = useState(null);
    const [masters, setMasters] = useState({
        attributes: [],
        variantTypes: [],
        addons: []
    });


    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [catRes, allCatsRes, attrRes, vtRes, addonRes] = await Promise.all([
                productService.getCategoryById(id),
                productService.getCategories(),
                productService.getAttributes(),
                productService.getVariantTypes(),
                productService.getAddons()
            ]);

            const cat = catRes.category;
            setFormData({
                name: cat.name || '',
                slug: cat.slug || '',
                parentId: cat.parentId?._id || cat.parentId || '',
                type: cat.type || 'Standard',
                status: cat.status !== false,
                image: null,
                attributeIds: cat.attributeIds?.map(a => a._id || a) || [],
                variantTypeIds: cat.variantTypeIds?.map(v => v._id || v) || [],
                addonIds: cat.addonIds?.map(add => add._id || add) || []
            });

            if (cat.image) {
                setExistingImageUrl(`${BASE_IMAGE_URL}/public/category-image/${cat._id}`);
            }

            setParentCategories(allCatsRes.categories || []);
            setMasters({
                attributes: attrRes.attributes || [],
                variantTypes: vtRes.variantTypes || [],
                addons: addonRes.addons || []
            });
        } catch (error) {
            console.error('Fetch data failed:', error);
            toast.error('Failed to load category data');
            navigate('/categories');
        } finally {
            setIsLoading(false);
        }
    };

    const handleNameChange = (val) => {
        const slug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        setFormData({ ...formData, name: val, slug });
    };

    const toggleMasterSelection = (field, id) => {
        setFormData(prev => {
            const current = prev[field];
            const updated = current.includes(id)
                ? current.filter(i => i !== id)
                : [...current, id];
            return { ...prev, [field]: updated };
        });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({ ...prev, image: file }));
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const removeImage = () => {
        setFormData(prev => ({ ...prev, image: null }));
        setPreviewUrl(null);
        setExistingImageUrl(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) return toast.error('Category name is required');

        setIsSaving(true);
        try {
            const data = new FormData();
            data.append('name', formData.name);
            data.append('slug', formData.slug);
            data.append('status', formData.status);
            data.append('type', formData.type);

            if (formData.image) {
                data.append('image', formData.image);
            }

            await productService.updateCategory(id, data);
            toast.success('Category updated successfully!', {
                icon: '✨',
                style: { borderRadius: '10px', background: '#333', color: '#fff' }
            });
            navigate('/categories');
        } catch (error) {
            console.error('Update category failed:', error);
            toast.error(error.message || 'Failed to update category');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="category-page-container fade-in">
            <div className="category-content-pane category-form-view absolute-unified power-ui">
                <header className="internal-page-header">
                    <div className="page-header-content">
                        <h1>Edit Category</h1>
                        <p>Modify classification nodes and refine your marketplace hierarchy.</p>
                    </div>
                    <div className="header-actions">
                        <button type="button" className="secondary-button" onClick={() => navigate('/products/master-management')}>Cancel</button>
                        <button type="submit" form="edit-category-form" className="primary-button" disabled={isSaving}>
                            <Save size={18} /> {isSaving ? 'Updating...' : 'Save Changes'}
                        </button>
                    </div>
                </header>

                <hr className="header-divider-internal" />

                <form id="edit-category-form" className="category-glass-card" onSubmit={handleSubmit}>
                    <div className="category-form-grid" style={{ gridTemplateColumns: '1fr' }}>
                        {/* Basic Info */}
                        <div className="category-form-group">
                            <label><LayoutGrid size={14} /> Category Name</label>
                            <input
                                type="text"
                                className="category-search-input"
                                style={{ paddingLeft: '1rem' }}
                                placeholder="e.g. Smart Electronics"
                                value={formData.name}
                                onChange={(e) => handleNameChange(e.target.value)}
                                required
                            />
                            {formData.slug && (
                                <p style={{ fontSize: '0.7rem', color: 'hsl(var(--primary))', margin: '4px 0 0 4px', fontWeight: '500' }}>
                                    Slug: {formData.slug}
                                </p>
                            )}
                        </div>

                        {/* Image Upload Area */}
                        <div className="category-form-group full-width">
                            <label><ImageIcon size={14} /> Category Visual Representation</label>
                            <div
                                className={`category-upload-zone ${(previewUrl || existingImageUrl) ? 'has-image' : ''}`}
                                onClick={() => document.getElementById('category-image-input-edit').click()}
                            >
                                {(previewUrl || existingImageUrl) ? (
                                    <>
                                        <img src={previewUrl || existingImageUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                                            onClick={(e) => { e.stopPropagation(); removeImage(); }}
                                        >
                                            <X size={16} />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <ImageIcon size={40} strokeWidth={1} style={{ marginBottom: '1rem', color: 'hsl(var(--muted-foreground))' }} />
                                        <div style={{ textAlign: 'center' }}>
                                            <p style={{ fontWeight: '700', fontSize: '0.9rem', marginBottom: '4px' }}>UPLOAD ASSET</p>
                                            <p style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>Drag and drop or click to browse</p>
                                        </div>
                                    </>
                                )}
                                <input
                                    type="file"
                                    id="category-image-input-edit"
                                    hidden
                                    accept="image/*"
                                    onChange={handleImageChange}
                                />
                            </div>
                        </div>
                    </div>
                </form>
            </div>
            {(isLoading || isSaving) && <Loader />}
        </div>
    );
};

export default EditCategory;
