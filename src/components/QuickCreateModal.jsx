import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Image as ImageIcon, Zap, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import productService from '../services/productService';
import CustomSelect from './CustomSelect';
import './QuickCreateModal.css';


const QuickCreateModal = ({ isOpen, onClose, type, onSuccess, masters = {}, editItem = null }) => {

    const isEdit = !!editItem;
    const [name, setName] = useState('');
    const [shortName, setShortName] = useState('');

    const [image, setImage] = useState(null);
    const [existingImage, setExistingImage] = useState(null);
    const [removeImage, setRemoveImage] = useState(false);
    const [status, setStatus] = useState(true);
    const [categoryId, setCategoryId] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Variant Specific State
    const [inputType, setInputType] = useState('Dropdown');
    const [requiredField, setRequiredField] = useState(false);
    const [sortOrder, setSortOrder] = useState(0);
    const [colorCode, setColorCode] = useState('#000000');
    const [variantTypeId, setVariantTypeId] = useState('');
    const [rate, setRate] = useState(0);

    const API_BASE_URL = import.meta.env.VITE_BASE_IMAGE_URL || 'http://localhost:5000';

    // Populate data for Edit Mode
    useEffect(() => {
        if (isOpen && isEdit && editItem) {
            setName(editItem.name || '');
            if (type === 'Unit') setShortName(editItem.shortName || '');
            setStatus(editItem.status !== false);
            setCategoryId(editItem.categoryId?._id || editItem.categoryId || '');

            if (type === 'Attribute') {
                setInputType(editItem.inputType || 'Dropdown');
                setRequiredField(editItem.required || false);
            }
            if (type === 'Value') {
                setSortOrder(editItem.sortOrder || 0);
                setColorCode(editItem.colorCode || '#000000');
                setVariantTypeId(editItem.variantTypeId?._id || editItem.variantTypeId || '');
            }
            if (type === 'Tax') {
                setRate(editItem.rate || 0);
            }

            // Handle existing image
            const imgUrl = type === 'Brand' ? editItem.logo : editItem.image;
            if (imgUrl) {
                setExistingImage(imgUrl);
            } else {
                setExistingImage(null);
            }
            setImage(null);
            setRemoveImage(false);
        } else if (isOpen && !isEdit) {
            // Reset for create mode
            setName('');
            setShortName('');

            setImage(null);
            setExistingImage(null);
            setRemoveImage(false);
            setStatus(true);
            setCategoryId('');
            setInputType('Dropdown');
            setRequiredField(false);
            setSortOrder(0);
            setColorCode('#000000');
            setVariantTypeId(masters.variantTypeId || '');

            const fileInput = document.getElementById('quick-image-input');
            if (fileInput) fileInput.value = '';
        }
    }, [isOpen, isEdit, editItem, type]);

    // Close on escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name) return toast.error('Name is required');
        if (type === 'Subcategory' && !categoryId) return toast.error('Parent category is required');

        setIsLoading(true);

        try {
            const formData = new FormData();
            formData.append('name', name);
            formData.append('status', status);
            if (categoryId) formData.append('categoryId', categoryId);

            if (image) {
                const imageField = type === 'Category' ? 'image' : (type === 'Brand' ? 'logo' : 'image');
                formData.append(imageField, image);
            } else if (removeImage) {
                formData.append('removeImage', 'true');
            }

            let result;
            if (isEdit) {
                if (type === 'Category') {
                    result = await productService.updateCategory(editItem._id, formData);
                } else if (type === 'Subcategory') {
                    result = await productService.updateSubcategory(editItem._id, formData);
                } else if (type === 'Brand') {
                    result = await productService.updateBrand(editItem._id, formData);
                } else if (type === 'Unit') {
                    result = await productService.updateUnit(editItem._id, { name, shortName, status });
                } else if (type === 'Tax') {
                    result = await productService.updateTax(editItem._id, { name, rate, status });
                } else if (type === 'Attribute') {
                    result = await productService.updateVariantAttribute(editItem._id, { name, inputType, required: requiredField, status });
                } else if (type === 'Value') {
                    result = await productService.updateVariantValue(editItem._id, { name, variantTypeId, sortOrder, colorCode, status });
                }

            } else {

                if (type === 'Category') {
                    result = await productService.createCategory(formData);
                } else if (type === 'Subcategory') {
                    result = await productService.createSubcategory(formData);
                } else if (type === 'Brand') {
                    result = await productService.createBrand(formData);
                } else if (type === 'Unit') {
                    result = await productService.createUnit({ name, shortName, status });
                } else if (type === 'Tax') {
                    result = await productService.createTax({ name, rate, status });
                } else if (type === 'Attribute') {
                    result = await productService.createVariantAttribute({ name, inputType, required: requiredField, status });
                } else if (type === 'Value') {
                    result = await productService.createVariantValue({ name, variantTypeId, sortOrder, colorCode, status });
                }

            }

            toast.success(`${type} ${isEdit ? 'Updated' : 'Created'}!`, {
                icon: '🚀',
                style: { borderRadius: '10px', background: '#333', color: '#fff' }
            });
            const extractedItem =
                result?.tax ||
                result?.category ||
                result?.brand ||
                result?.unit ||
                result?.variantType ||
                result?.variantValue;
            onSuccess(extractedItem, result);

            onClose();
            setName('');
            setRate(0);
            setImage(null);
            setCategoryId('');
            setStatus(true);

        } catch (error) {
            console.error(`Error in handleSubmit (${type}):`, error);
            toast.error(error.data?.message || error.message || `Failed to create ${type}`);
        } finally {

            setIsLoading(false);
        }
    };

    const modalContent = (
        <div className="quick-modal-overlay" onClick={(e) => { if (e.target.className === 'quick-modal-overlay') onClose(); }}>
            <div className="quick-modal-container">
                {/* Visual Accent */}
                <div className="quick-modal-gradient-bar" />

                <div className="quick-modal-content">
                    <div className="quick-modal-header">
                        <div>
                            <h3 className="quick-modal-title">
                                <Zap size={20} style={{ color: 'hsl(var(--primary))' }} />
                                {isEdit ? 'Edit' : 'Quick'} {type}
                            </h3>
                            <p className="quick-modal-subtitle">{isEdit ? 'Update master record' : 'Add to master records'}</p>
                        </div>
                        <button onClick={onClose} className="quick-modal-close-btn" title="Close Modal">
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="quick-modal-form">
                        <div className="quick-modal-form-group">
                            <label className="quick-modal-label">{type} Name</label>
                            <input
                                type="text"
                                className="quick-modal-input"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder={`Enter ${type.toLowerCase()} name...`}
                                autoFocus
                            />
                        </div>
                        {type === 'Tax' && (
                            <div className="quick-modal-form-group">
                                <label className="quick-modal-label">Tax Rate (%)</label>
                                <input
                                    type="number"
                                    className="quick-modal-input"
                                    value={rate}
                                    onChange={(e) => setRate(e.target.value)}
                                    placeholder="Enter tax rate (e.g. 5)"
                                />
                            </div>
                        )}
                        {type === 'Unit' && (
                            <div className="quick-modal-form-group">
                                <label className="quick-modal-label">Short Name</label>
                                <input
                                    type="text"
                                    className="quick-modal-input"
                                    value={shortName}
                                    onChange={(e) => setShortName(e.target.value)}
                                    placeholder="e.g. kg, g, pc, l"
                                />
                            </div>
                        )}

                        {type === 'Attribute' && (
                            <>
                                <CustomSelect
                                    label="Input Type"
                                    placeholder="Select Input Type"
                                    options={[
                                        { value: 'Dropdown', label: 'Dropdown' },
                                        { value: 'Color Picker', label: 'Color Picker' },
                                        { value: 'Text', label: 'Text' },
                                        { value: 'Radio', label: 'Radio' }
                                    ]}
                                    value={inputType}
                                    onChange={setInputType}
                                />
                                <div className="quick-modal-status-toggle" style={{ marginTop: '1rem' }}>
                                    <div className="quick-modal-status-info">
                                        <h4>Required</h4>
                                        <p>Mandatory for product variants</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setRequiredField(!requiredField)}
                                        className={`quick-modal-toggle-btn ${requiredField ? 'active' : 'inactive'}`}
                                    >
                                        <div className="quick-modal-toggle-circle"></div>
                                    </button>
                                </div>
                            </>
                        )}

                        {type === 'Value' && (
                            <>
                                <div className="quick-modal-form-group">
                                    <label className="quick-modal-label">Sort Order</label>
                                    <input
                                        type="number"
                                        className="quick-modal-input"
                                        value={sortOrder}
                                        onChange={(e) => setSortOrder(e.target.value)}
                                        placeholder="e.g. 1, 2, 3"
                                    />
                                </div>
                                {masters.inputType === 'Color Picker' && (
                                    <div className="quick-modal-form-group">
                                        <label className="quick-modal-label">Color Code</label>
                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                            <input
                                                type="color"
                                                style={{ width: '50px', height: '40px', padding: '0', border: 'none', background: 'transparent', cursor: 'pointer' }}
                                                value={colorCode}
                                                onChange={(e) => setColorCode(e.target.value)}
                                            />
                                            <input
                                                type="text"
                                                className="quick-modal-input"
                                                value={colorCode}
                                                onChange={(e) => setColorCode(e.target.value)}
                                                placeholder="#FFFFFF"
                                                style={{ flex: 1 }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </>
                        )}


                        {type === 'Subcategory' && masters.categories && (
                            <CustomSelect
                                label="Parent Category"
                                placeholder="Select Parent Category"
                                options={masters.categories.map(c => ({ value: c._id, label: c.name }))}
                                value={categoryId}
                                onChange={setCategoryId}
                            />
                        )}



                        {(type === 'Category' || type === 'Subcategory' || type === 'Brand') && (
                            <div className="quick-modal-form-group">
                                <label className="quick-modal-label">{type} Image</label>
                                <input
                                    type="file"
                                    id="quick-image-input"
                                    hidden
                                    accept="image/*"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            setImage(e.target.files[0]);
                                            setRemoveImage(false);
                                        }
                                    }}
                                />
                                <div
                                    className={`quick-modal-upload-zone ${image || existingImage ? 'has-image' : ''}`}
                                    onClick={() => document.getElementById('quick-image-input').click()}
                                >
                                    {image ? (
                                        <>
                                            <button
                                                type="button"
                                                className="quick-modal-image-remove"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setImage(null);
                                                    document.getElementById('quick-image-input').value = '';
                                                }}
                                                title="Remove new image"
                                            >
                                                <X size={14} />
                                            </button>
                                            <img
                                                src={URL.createObjectURL(image)}
                                                alt="Preview"
                                                className="quick-modal-image-preview"
                                            />
                                        </>
                                    ) : existingImage ? (
                                        <>
                                            <button
                                                type="button"
                                                className="quick-modal-image-remove"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setExistingImage(null);
                                                    setRemoveImage(true);
                                                    document.getElementById('quick-image-input').value = '';
                                                }}
                                                title="Remove existing image"
                                            >
                                                <X size={14} />
                                            </button>
                                            <img
                                                src={`${API_BASE_URL}/${existingImage}`}
                                                alt="Existing"
                                                className="quick-modal-image-preview"
                                            />
                                        </>
                                    ) : (
                                        <>
                                            <ImageIcon size={28} />
                                            <p className="quick-modal-upload-text">
                                                Click to upload image
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="quick-modal-status-toggle">
                            <div className="quick-modal-status-info">
                                <h4>Status</h4>
                                <p>Available for public use</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setStatus(!status)}
                                className={`quick-modal-toggle-btn ${status ? 'active' : 'inactive'}`}
                            >
                                <div className="quick-modal-toggle-circle"></div>
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="quick-modal-submit-btn"
                        >
                            {isLoading ? (isEdit ? 'Updating...' : 'Creating...') : (
                                <>
                                    <Check size={20} strokeWidth={3} />
                                    {isEdit ? 'UPDATE' : 'CREATE'} {type.toUpperCase()}
                                </>
                            )}
                        </button>
                    </form>
                </div >
            </div >
        </div >
    );

    return createPortal(modalContent, document.body);
};

export default QuickCreateModal;
