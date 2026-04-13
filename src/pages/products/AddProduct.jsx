import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Save, Plus, Trash2, Image as ImageIcon, CheckCircle,
    Package, DollarSign, ChevronRight, X, RefreshCw, Layers, Zap, Edit2,
    ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';
import productService from '../../services/productService';
import Loader from '../../components/Loader';
import CustomSelect from '../../components/CustomSelect';
import QuickCreateModal from '../../components/QuickCreateModal';
import './Product.css';

const AddProduct = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState(1);
    const [masters, setMasters] = useState({
        categories: [],
        allSubCategories: [],
        subCategories: [],
        brands: [],
        units: [],
        taxes: [],
        variantAttributes: [],
    });

    const [formData, setFormData] = useState({
        name: '',
        categoryId: '',
        subCategoryId: '',
        brandId: '',
        unitId: '',
        description: '',
        productType: 'Single',
        pricing: {
            mrp: '',
            sellingPrice: '',
            finalSellingPrice: '',
            costPrice: '',
            taxId: '',
            discountType: 'Fixed',
            discountValue: 0,
            quantity: '',
            sku: '',
            minStock: 0
        },
        variants: [],
    });

    // Variant builder state
    const [selectedAttributes, setSelectedAttributes] = useState([]);
    const [selectedValuesPerAttr, setSelectedValuesPerAttr] = useState({});
    const [bulkApply, setBulkApply] = useState({ mrp: '', price: '', costPrice: '', taxId: '', stock: '', minStock: '' });

    const [images, setImages] = useState({ thumbnail: null, gallery: [] });
    const [previews, setPreviews] = useState({ thumbnail: '', gallery: [] });

    // Quick-create category modal
    const [isCatModalOpen, setIsCatModalOpen] = useState(false);
    // Quick-create subcategory modal
    const [isSubCatModalOpen, setIsSubCatModalOpen] = useState(false);
    // Quick-create brand modal
    const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
    // Quick-create unit modal
    const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
    // Quick-create tax modal
    const [isTaxModalOpen, setIsTaxModalOpen] = useState(false);
    // Quick-create variant attribute modal
    const [isAttrModalOpen, setIsAttrModalOpen] = useState(false);
    // Quick-create variant value modal
    const [isValueModalOpen, setIsValueModalOpen] = useState(false);
    const [activeAttrForValue, setActiveAttrForValue] = useState(null);

    // Variant Row Edit Modal
    const [editingVariantIndex, setEditingVariantIndex] = useState(null);
    const [editingVariantData, setEditingVariantData] = useState(null);

    useEffect(() => {
        fetchMasters();
    }, []);

    const fetchMasters = async () => {
        setIsLoading(true);
        try {
            const [cat, sub, br, un, tx, attr] = await Promise.all([
                productService.getCategories(),
                productService.getSubcategories(),
                productService.getBrands(),
                productService.getUnits(),
                productService.getTaxes(),
                productService.getVariantAttributes()
            ]);
            setMasters({
                categories: cat.categories || [],
                allSubCategories: sub.subcategories || [],
                subCategories: [],
                brands: br.brands || [],
                units: un.units || [],
                taxes: tx.taxes || [],
                variantAttributes: (attr.variantTypes || []).filter(a => a.status),
            });
        } catch {
            toast.error('Failed to load masters');
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePricingChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newPricing = { ...prev.pricing, [name]: value };

            const mrp = parseFloat(newPricing.mrp) || 0;
            const sp = parseFloat(newPricing.sellingPrice) || 0;

            // If MRP, Selling Price, Discount Type, or Discount Value changes, auto-calculate Final Selling Price
            if (name === 'mrp' || name === 'sellingPrice' || name === 'discountValue' || name === 'discountType') {
                const discount = parseFloat(newPricing.discountValue) || 0;

                if (discount > 0 && mrp > 0) {
                    if (newPricing.discountType === 'Percentage') {
                        newPricing.finalSellingPrice = Math.round(mrp - (mrp * (discount / 100)));
                    } else {
                        newPricing.finalSellingPrice = Math.round(Math.max(0, mrp - discount));
                    }
                } else {
                    newPricing.finalSellingPrice = newPricing.sellingPrice;
                }
            }
            // If Final Selling Price is manually changed, reverse-calculate the Discount
            else if (name === 'finalSellingPrice') {
                const fsp = parseFloat(newPricing.finalSellingPrice) || 0;
                if (mrp > 0 && fsp > 0 && mrp >= fsp && fsp !== sp) {
                    if (newPricing.discountType === 'Percentage') {
                        newPricing.discountValue = Math.round(((mrp - fsp) / mrp) * 100);
                    } else {
                        newPricing.discountValue = Math.round(mrp - fsp);
                    }
                } else {
                    newPricing.discountValue = 0;
                }
            }
            return { ...prev, pricing: newPricing };
        });
    };

    const generateSKUAction = (type = 'product', index = null) => {
        const namePart = formData.name ? formData.name.substring(0, 3).toUpperCase() : 'SKU';
        const randomPart = Math.floor(1000 + Math.random() * 9000);
        const newSKU = `${namePart}-${randomPart}`;
        if (type === 'product') {
            setFormData(prev => ({ ...prev, pricing: { ...prev.pricing, sku: newSKU } }));
        } else if (index !== null) {
            const updated = [...formData.variants];
            updated[index].sku = newSKU;
            setFormData(prev => ({ ...prev, variants: updated }));
            // Also update the active modal state if it's open
            if (editingVariantIndex === index) {
                setEditingVariantData(prev => ({ ...prev, sku: newSKU }));
            }
        }
    };

    const handleThumbnailChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Logic limit: 5MB
            if (file.size > 5 * 1024 * 1024) {
                return toast.error('Thumbnail exceeds 5MB limit');
            }
            setImages(prev => ({ ...prev, thumbnail: file }));
            setPreviews(prev => ({ ...prev, thumbnail: URL.createObjectURL(file) }));
        }
    };

    const removeThumbnail = (e) => {
        e.stopPropagation();
        setImages(prev => ({ ...prev, thumbnail: null }));
        setPreviews(prev => ({ ...prev, thumbnail: '' }));
        // Reset the input field so same file can be selected again
        const input = document.getElementById('thumbInput');
        if (input) input.value = '';
    };

    const handleGalleryChange = (e) => {
        const files = Array.from(e.target.files);
        const validFiles = [];
        let skipped = 0;

        files.forEach(file => {
            if (file.size <= 5 * 1024 * 1024) {
                validFiles.push(file);
            } else {
                skipped++;
            }
        });

        if (skipped > 0) {
            toast.error(`${skipped} images skipped (exceed 5MB limit)`);
        }

        if (validFiles.length > 0) {
            setImages(prev => ({ ...prev, gallery: [...prev.gallery, ...validFiles] }));
            const newPreviews = validFiles.map(f => URL.createObjectURL(f));
            setPreviews(prev => ({ ...prev, gallery: [...prev.gallery, ...newPreviews] }));
        }
    };

    const removeGalleryImage = (index) => {
        setImages(prev => ({ ...prev, gallery: prev.gallery.filter((_, i) => i !== index) }));
        setPreviews(prev => ({ ...prev, gallery: prev.gallery.filter((_, i) => i !== index) }));
    };

    // â”€â”€â”€ Variant Builder Logic â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    const toggleAttribute = async (attrId) => {
        const alreadySelected = selectedAttributes.some(a => a._id === attrId);
        if (alreadySelected) {
            setSelectedAttributes(prev => prev.filter(a => a._id !== attrId));
            setSelectedValuesPerAttr(prev => {
                const next = { ...prev };
                delete next[attrId];
                return next;
            });
        } else {
            const attr = masters.variantAttributes.find(a => a._id === attrId);
            try {
                const res = await productService.getVariantValues(attrId);
                const values = (res.variantValues || []).filter(v => v.status);
                // Pre-select all values by default
                const valueMap = {};
                values.forEach(v => { valueMap[v._id] = true; });
                setSelectedAttributes(prev => [...prev, { ...attr, values }]);
                setSelectedValuesPerAttr(prev => ({ ...prev, [attrId]: valueMap }));
            } catch {
                toast.error('Failed to load values for ' + attr.name);
            }
        }
    };

    const toggleValue = (attrId, valueId) => {
        setSelectedValuesPerAttr(prev => ({
            ...prev,
            [attrId]: { ...prev[attrId], [valueId]: !prev[attrId]?.[valueId] }
        }));
    };

    const toggleAllValues = (attrId, selectAll) => {
        const attr = selectedAttributes.find(a => a._id === attrId);
        if (!attr) return;
        const valueMap = {};
        attr.values.forEach(v => { valueMap[v._id] = selectAll; });
        setSelectedValuesPerAttr(prev => ({ ...prev, [attrId]: valueMap }));
    };

    const getComboCount = () => {
        if (selectedAttributes.length === 0) return 0;
        let count = 1;
        for (const attr of selectedAttributes) {
            const selected = Object.values(selectedValuesPerAttr[attr._id] || {}).filter(Boolean).length;
            if (selected === 0) return 0;
            count *= selected;
        }
        return count;
    };

    const generateMatrix = () => {
        const count = getComboCount();
        if (count === 0) return toast.error('Select at least one value per attribute');

        let matrix = [[]];
        selectedAttributes.forEach(attr => {
            const selectedVals = attr.values.filter(v => selectedValuesPerAttr[attr._id]?.[v._id]);
            const newMatrix = [];
            selectedVals.forEach(val => {
                matrix.forEach(prevRow => {
                    newMatrix.push([...prevRow, {
                        variantTypeId: attr._id,
                        valueId: val._id,
                        valueName: val.name || val.valueName,
                        typeName: attr.name,
                        colorCode: val.colorCode || null
                    }]);
                });
            });
            matrix = newMatrix;
        });

        const newVariants = matrix.map(combination => ({
            variantValues: combination,
            sku: '',
            quantity: '',
            price: '',
            mrp: '',
            costPrice: '',
            discountType: 'Percentage',
            discountValue: 0,
            finalSellingPrice: 0,
            taxId: '',
            minStock: 0
        }));

        // Filter out duplicates outside setFormData to avoid side effects/double toasts in Strict Mode
        const filteredNew = newVariants.filter(nv => {
            const comboKey = nv.variantValues.map(vv => vv.valueId).sort().join('-');
            return !formData.variants.some(ev => {
                const existingKey = ev.variantValues.map(vv => vv.valueId).sort().join('-');
                return existingKey === comboKey;
            });
        });

        if (filteredNew.length === 0) {
            return toast.error('No new combinations to add');
        }

        setFormData(prev => ({
            ...prev,
            variants: [...prev.variants, ...filteredNew]
        }));

        toast.success(`${filteredNew.length} new variant(s) added`);

        setBulkApply({ mrp: '', price: '', costPrice: '', taxId: '', stock: '', minStock: '' });
    };

    const updateVariantRow = (index, field, value) => {
        setFormData(prev => {
            const updatedVar = { ...prev.variants[index], [field]: value };

            const mrp = parseFloat(updatedVar.mrp) || 0;
            const sp = parseFloat(updatedVar.price) || 0;

            if (field === 'mrp' || field === 'price' || field === 'discountValue' || field === 'discountType') {
                const discount = parseFloat(updatedVar.discountValue) || 0;
                if (discount > 0 && mrp > 0) {
                    if (updatedVar.discountType === 'Percentage') {
                        updatedVar.finalSellingPrice = Math.round(mrp - (mrp * (discount / 100)));
                    } else {
                        updatedVar.finalSellingPrice = Math.round(Math.max(0, mrp - discount));
                    }
                } else {
                    updatedVar.finalSellingPrice = updatedVar.price;
                }
            } else if (field === 'finalSellingPrice') {
                const fsp = parseFloat(updatedVar.finalSellingPrice) || 0;
                if (mrp > 0 && fsp > 0 && mrp >= fsp && fsp !== sp) {
                    if (updatedVar.discountType === 'Percentage') {
                        updatedVar.discountValue = Math.round(((mrp - fsp) / mrp) * 100);
                    } else {
                        updatedVar.discountValue = Math.round(mrp - fsp);
                    }
                } else {
                    updatedVar.discountValue = 0;
                }
            }

            const newVariants = [...prev.variants];
            newVariants[index] = updatedVar;
            return { ...prev, variants: newVariants };
        });
    };

    const applyBulkToAll = () => {
        if (!bulkApply.mrp && !bulkApply.price && !bulkApply.costPrice && !bulkApply.taxId && !bulkApply.stock && !bulkApply.minStock) {
            return toast.error('Fill at least one field to apply');
        }
        setFormData(prev => ({
            ...prev,
            variants: prev.variants.map(v => ({
                ...v,
                ...(bulkApply.mrp !== '' && { mrp: bulkApply.mrp }),
                ...(bulkApply.price !== '' && { price: bulkApply.price }),
                ...(bulkApply.costPrice !== '' && { costPrice: bulkApply.costPrice }),
                ...(bulkApply.taxId !== '' && { taxId: bulkApply.taxId }),
                ...(bulkApply.stock !== '' && { quantity: bulkApply.stock }),
                ...(bulkApply.minStock !== '' && { minStock: bulkApply.minStock }),
            }))
        }));
        toast.success('Bulk values applied to all variants');
    };

    const deleteVariantRow = (index) => {
        setFormData(prev => ({ ...prev, variants: prev.variants.filter((_, i) => i !== index) }));
    };

    const handleVariantEditChange = (e) => {
        const { name, value } = e.target;
        setEditingVariantData(prev => {
            const next = { ...prev, [name]: value };

            const mrp = parseFloat(next.mrp) || 0;
            const sp = parseFloat(next.price) || 0;

            if (name === 'mrp' || name === 'price' || name === 'discountValue' || name === 'discountType') {
                const discount = parseFloat(next.discountValue) || 0;
                if (discount > 0 && mrp > 0) {
                    if (next.discountType === 'Percentage') {
                        next.finalSellingPrice = Math.round(mrp - (mrp * (discount / 100)));
                    } else {
                        next.finalSellingPrice = Math.round(Math.max(0, mrp - discount));
                    }
                } else {
                    next.finalSellingPrice = next.price;
                }
            } else if (name === 'finalSellingPrice') {
                const fsp = parseFloat(next.finalSellingPrice) || 0;
                if (mrp > 0 && fsp > 0 && mrp >= fsp && fsp !== sp) {
                    if (next.discountType === 'Percentage') {
                        next.discountValue = Math.round(((mrp - fsp) / mrp) * 100);
                    } else {
                        next.discountValue = Math.round(mrp - fsp);
                    }
                } else {
                    next.discountValue = 0;
                }
            }

            return next;
        });
    };

    const handleSaveVariantRow = () => {
        if (editingVariantIndex !== null && editingVariantData) {
            const updated = [...formData.variants];
            updated[editingVariantIndex] = editingVariantData;
            setFormData(prev => ({ ...prev, variants: updated }));
            setEditingVariantIndex(null);
            setEditingVariantData(null);
        }
    };

    // â”€â”€â”€ Submit â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    const handleSubmit = async () => {
        if (!formData.name || !formData.categoryId) return toast.error('Product Name and Category are required');
        if (formData.productType === 'Variant' && formData.variants.length === 0) {
            return toast.error('Generate at least one variant combination');
        }

        setIsLoading(true);
        try {
            const data = new FormData();
            ['name', 'categoryId', 'subCategoryId', 'brandId', 'unitId', 'description', 'productType'].forEach(key => {
                if (formData[key]) data.append(key, formData[key]);
            });
            const cleanPricing = { ...formData.pricing };
            if (!cleanPricing.taxId) delete cleanPricing.taxId;
            data.append('pricing', JSON.stringify(cleanPricing));

            if (formData.productType === 'Variant') {
                const cleanVariants = formData.variants.map(v => {
                    const cleanV = { ...v };
                    if (!cleanV.taxId) delete cleanV.taxId;
                    return cleanV;
                });
                data.append('variants', JSON.stringify(cleanVariants));
            }
            if (images.thumbnail) data.append('image', images.thumbnail);
            images.gallery.forEach(img => data.append('images', img));
            console.log(data);
            const res = await productService.createProduct(data);
            console.log(res);
            toast.success('Product created successfully!');
            navigate('/products/list-products');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create product');
        } finally {
            setIsLoading(false);
        }
    };

    // â”€â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    const comboCount = getComboCount();

    return (
        <div className="product-page-container fade-in">
            <div className="product-content-pane">
                <header className="product-header">
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <button className="product-btn-icon" onClick={() => navigate(-1)} title="Back to list">
                                <ArrowLeft size={16} />
                            </button>
                            <h1>{formData.name || 'Create New Product'}</h1>
                        </div>
                        <p>Define standard or variant-based products for the catalog.</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.75rem' }}>
                        <div className="product-tab-navbar">
                            {[
                                { id: 1, label: 'General Info', icon: <Package size={16} /> },
                                { id: 2, label: 'Pricing & Stock', icon: <DollarSign size={16} /> },
                                { id: 3, label: 'Media', icon: <ImageIcon size={16} /> },
                            ].map(tab => (
                                <div key={tab.id} className={`tab-nav-item ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
                                    {tab.icon}
                                    <span>{tab.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </header>

                <div className="product-glass-card">
                    <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid hsl(var(--border)/0.2)', paddingBottom: '1rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'hsl(var(--primary))', margin: 0 }}>
                            {['1. General Information', '2. Pricing & Initial Stock', '3. Media Assets'][activeTab - 1]}
                        </h3>
                    </div>

                    {/* â”€â”€ Tab 1: General Info â”€â”€ */}
                    {activeTab === 1 && (
                        <div className="animate-in fade-in">
                            <div className="product-grid">
                                <div className="product-field-group" style={{ gridColumn: '1 / -1' }}>
                                    <label className="product-label">Product Name *</label>
                                    <input name="name" className="product-input" style={{ fontSize: '1.1rem', fontWeight: 800 }} placeholder="Enter product name..." value={formData.name} onChange={handleInputChange} autoFocus />
                                </div>
                                <div className="product-field-group">
                                    <label className="product-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span>Category *</span>
                                        <button
                                            type="button"
                                            className="add-new-chip-btn"
                                            onClick={() => setIsCatModalOpen(true)}
                                        >
                                            <span className="add-new-chip-icon"><Plus size={10} strokeWidth={3.5} /></span>
                                            Add New
                                        </button>
                                    </label>
                                    <CustomSelect
                                        options={[{ value: '', label: 'None' }, ...masters.categories.map(c => ({ value: c._id, label: c.name }))]}
                                        value={formData.categoryId}
                                        onChange={(val) => {
                                            setFormData(prev => ({ ...prev, categoryId: val, subCategoryId: '' }));
                                            const filtered = val ? masters.allSubCategories.filter(s => s.categoryId?._id === val || s.categoryId === val) : [];
                                            setMasters(prev => ({ ...prev, subCategories: filtered }));
                                        }}
                                        placeholder="Select Category"
                                    />
                                </div>
                                <div className="product-field-group">
                                    <label className="product-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span>Sub-Classification</span>
                                        <button
                                            type="button"
                                            className="add-new-chip-btn"
                                            onClick={() => setIsSubCatModalOpen(true)}
                                            disabled={!formData.categoryId}
                                            style={{ opacity: !formData.categoryId ? 0.4 : 1, cursor: !formData.categoryId ? 'not-allowed' : 'pointer' }}
                                        >
                                            <span className="add-new-chip-icon"><Plus size={10} strokeWidth={3.5} /></span>
                                            Add New
                                        </button>
                                    </label>
                                    <CustomSelect
                                        options={[{ value: '', label: 'None' }, ...masters.subCategories.map(s => ({ value: s._id, label: s.name }))]}
                                        value={formData.subCategoryId}
                                        onChange={(val) => setFormData(prev => ({ ...prev, subCategoryId: val }))}
                                        placeholder={formData.categoryId ? 'Select Sub Category' : 'Awaiting Category...'}
                                        disabled={!formData.categoryId || masters.subCategories.length === 0}
                                    />
                                </div>
                                <div className="product-field-group">
                                    <label className="product-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span>Brand</span>
                                        <button type="button" className="add-new-chip-btn" onClick={() => setIsBrandModalOpen(true)}>
                                            <span className="add-new-chip-icon"><Plus size={10} strokeWidth={3.5} /></span>
                                            Add New
                                        </button>
                                    </label>
                                    <CustomSelect options={[{ value: '', label: 'None' }, ...masters.brands.map(b => ({ value: b._id, label: b.name }))]} value={formData.brandId} onChange={(val) => setFormData(prev => ({ ...prev, brandId: val }))} placeholder="Select Brand" />
                                </div>
                                <div className="product-field-group">
                                    <label className="product-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span>Base Unit</span>
                                        <button type="button" className="add-new-chip-btn" onClick={() => setIsUnitModalOpen(true)}>
                                            <span className="add-new-chip-icon"><Plus size={10} strokeWidth={3.5} /></span>
                                            Add New
                                        </button>
                                    </label>
                                    <CustomSelect options={[{ value: '', label: 'None' }, ...masters.units.map(u => ({ value: u._id, label: u.name }))]} value={formData.unitId} onChange={(val) => setFormData(prev => ({ ...prev, unitId: val }))} placeholder="Select Unit" />
                                </div>
                                <div className="product-field-group" style={{ gridColumn: '1 / -1' }}>
                                    <label className="product-label">Description</label>
                                    <textarea name="description" className="product-input product-textarea" placeholder="Product description, specifications..." value={formData.description} onChange={handleInputChange} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* â”€â”€ Tab 2: Pricing & Stock â”€â”€ */}
                    {activeTab === 2 && (
                        <div className="animate-in fade-in">
                            {/* Product Type Toggle */}
                            <div className="type-selection-wrapper">
                                <label className={`type-selection-card ${formData.productType === 'Single' ? 'active' : ''}`}>
                                    <input type="radio" name="productType" value="Single" checked={formData.productType === 'Single'} onChange={handleInputChange} style={{ width: 14, height: 14, cursor: 'pointer' }} />
                                    <div className="type-selection-icon"><Package size={14} strokeWidth={2.5} /></div>
                                    <div className="type-selection-title">Standard Single</div>
                                </label>
                                <label className={`type-selection-card ${formData.productType === 'Variant' ? 'active' : ''}`}>
                                    <input type="radio" name="productType" value="Variant" checked={formData.productType === 'Variant'} onChange={handleInputChange} style={{ width: 14, height: 14, cursor: 'pointer' }} />
                                    <div className="type-selection-icon"><Layers size={14} strokeWidth={2.5} /></div>
                                    <div className="type-selection-title">Variant Matrix</div>
                                </label>
                            </div>

                            {/* â”€â”€ Single Product Pricing (Initial Batch) â”€â”€ */}
                            {formData.productType === 'Single' && (
                                <div className="product-grid">
                                    <div style={{ gridColumn: '1 / -1', padding: '0.8rem', background: 'hsl(var(--primary) / 0.05)', borderRadius: '8px', borderLeft: '4px solid hsl(var(--primary))', marginBottom: '1rem' }}>
                                        <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: 'hsl(var(--primary))' }}>
                                            <Zap size={14} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'middle' }} />
                                            Initial Stock: The pricing and quantity below will create the FIRST inventory batch for this product.
                                        </p>
                                    </div>
                                    <div className="product-field-group">
                                        <label className="product-label">SKU</label>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <input name="sku" className="product-input" style={{ fontFamily: 'monospace', textTransform: 'uppercase', fontSize: '0.85rem' }} placeholder="AUTO-SKU" value={formData.pricing.sku} onChange={handlePricingChange} />
                                            <button className="vb-icon-btn" onClick={() => generateSKUAction('product')} title="Generate SKU"><RefreshCw size={15} /></button>
                                        </div>
                                    </div>
                                    <div className="product-field-group">
                                        <label className="product-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span>Tax Configuration</span>
                                            <button type="button" className="add-new-chip-btn" onClick={() => setIsTaxModalOpen(true)}>
                                                <span className="add-new-chip-icon"><Plus size={10} strokeWidth={3.5} /></span>
                                                Add New
                                            </button>
                                        </label>
                                        <CustomSelect
                                            options={[{ value: '', label: 'None' }, ...masters.taxes.filter(t => t && t.name).map(t => ({ value: t._id, label: `${t.name} (${t.rate || 0}%)` }))]}
                                            value={formData.pricing.taxId}
                                            onChange={(val) => handlePricingChange({ target: { name: 'taxId', value: val } })}
                                            placeholder="Exempt / No Tax"
                                        />
                                    </div>
                                    <div className="product-field-group">
                                        <label className="product-label">MRP (â‚¹)</label>
                                        <input type="number" min="0" onWheel={(e) => e.currentTarget.blur()} onKeyDown={(e) => { if (e.key === "-" || e.key === "e" || e.key === "E") e.preventDefault(); }} name="mrp" className="product-input" value={formData.pricing.mrp} onChange={handlePricingChange} placeholder="0.00" />
                                    </div>
                                    <div className="product-field-group">
                                        <label className="product-label">Standard Selling Price (â‚¹) *</label>
                                        <input type="number" min="0" onWheel={(e) => e.currentTarget.blur()} onKeyDown={(e) => { if (e.key === "-" || e.key === "e" || e.key === "E") e.preventDefault(); }} name="sellingPrice" className="product-input" value={formData.pricing.sellingPrice} onChange={handlePricingChange} placeholder="0.00" />
                                    </div>
                                    <div className="product-field-group">
                                        <label className="product-label">Discount Type</label>
                                        <CustomSelect
                                            options={[
                                                { value: 'Fixed', label: 'Fixed Amount (â‚¹)' },
                                                { value: 'Percentage', label: 'Percentage (%)' }
                                            ]}
                                            value={formData.pricing.discountType || 'Fixed'}
                                            onChange={(val) => handlePricingChange({ target: { name: 'discountType', value: val } })}
                                            placeholder="Select Type"
                                        />
                                    </div>
                                    <div className="product-field-group">
                                        <label className="product-label">Discount Value</label>
                                        <input type="number" min="0" onWheel={(e) => e.currentTarget.blur()} onKeyDown={(e) => { if (e.key === "-" || e.key === "e" || e.key === "E") e.preventDefault(); }} name="discountValue" className="product-input" value={formData.pricing.discountValue} onChange={handlePricingChange} placeholder="0" />
                                    </div>
                                    <div className="product-field-group">
                                        <label className="product-label">Final Selling Price (â‚¹)</label>
                                        <input type="number" min="0" onWheel={(e) => e.currentTarget.blur()} onKeyDown={(e) => { if (e.key === "-" || e.key === "e" || e.key === "E") e.preventDefault(); }} name="finalSellingPrice" className="product-input" style={{ fontWeight: 800, fontSize: '1.1rem', color: 'hsl(var(--primary))', background: 'hsl(var(--secondary)/0.3)' }} value={formData.pricing.finalSellingPrice} onChange={handlePricingChange} placeholder="0.00" />
                                    </div>
                                    <div className="product-field-group">
                                        <label className="product-label">Cost Price (â‚¹)</label>
                                        <input type="number" min="0" onWheel={(e) => e.currentTarget.blur()} onKeyDown={(e) => { if (e.key === "-" || e.key === "e" || e.key === "E") e.preventDefault(); }} name="costPrice" className="product-input" value={formData.pricing.costPrice} onChange={handlePricingChange} placeholder="0.00" />
                                    </div>
                                    <div className="product-field-group">
                                        <label className="product-label">Initial Stock Quantity *</label>
                                        <input type="number" min="0" onWheel={(e) => e.currentTarget.blur()} onKeyDown={(e) => { if (e.key === "-" || e.key === "e" || e.key === "E") e.preventDefault(); }} name="quantity" className="product-input" style={{ fontWeight: 700, borderColor: 'hsl(var(--primary) / 0.3)' }} value={formData.pricing.quantity} onChange={handlePricingChange} placeholder="0" />
                                    </div>
                                    <div className="product-field-group">
                                        <label className="product-label">Min Stock Alert</label>
                                        <input type="number" min="0" onWheel={(e) => e.target.blur()} onKeyDown={(e) => { if (e.key === "-" || e.key === "e" || e.key === "E") e.preventDefault(); }} name="minStock" className="product-input" value={formData.pricing.minStock} onChange={handlePricingChange} placeholder="0" />
                                    </div>
                                </div>
                            )}

                            {/* â”€â”€ Variant Matrix Builder â”€â”€ */}
                            {formData.productType === 'Variant' && (
                                <div className="variant-builder-section">

                                    {/* Step 1: Attribute + Value Selection */}
                                    <div className="vb-step-card">
                                        <div className="vb-step-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                <div className="vb-step-number">1</div>
                                                <div>
                                                    <div className="vb-step-title">{formData.variants.length > 0 ? 'Add More Variations' : 'Select Variant Attributes'}</div>
                                                    <div className="vb-step-desc">{formData.variants.length > 0 ? 'Pick additional combinations to add to the existing list' : 'Define combinations and specify INITIAL batch pricing/stock for each variant'}</div>
                                                </div>
                                            </div>
                                            <button type="button" className="add-new-chip-btn" onClick={() => setIsAttrModalOpen(true)}>
                                                <span className="add-new-chip-icon"><Plus size={10} strokeWidth={3.5} /></span>
                                                Add New
                                            </button>
                                        </div>

                                        {/* Attribute Type Toggles */}
                                        {masters.variantAttributes.length === 0 ? (
                                            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'hsl(var(--muted-foreground))', fontSize: '0.85rem', border: '1px dashed hsl(var(--border)/0.4)', borderRadius: '0.75rem' }}>
                                                No variant attributes found. Create some in the Variants settings first.
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: selectedAttributes.length > 0 ? '1.25rem' : '0' }}>
                                                {masters.variantAttributes.map(attr => {
                                                    const isSelected = selectedAttributes.some(a => a._id === attr._id);
                                                    return (
                                                        <button key={attr._id} type="button" onClick={() => toggleAttribute(attr._id)} className={`attr-type-toggle ${isSelected ? 'active' : ''}`}>
                                                            {isSelected ? <CheckCircle size={13} /> : <Plus size={13} />}
                                                            {attr.name}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Value Selection per Attribute */}
                                        {selectedAttributes.map(attr => {
                                            const vals = selectedValuesPerAttr[attr._id] || {};
                                            const selectedCount = Object.values(vals).filter(Boolean).length;
                                            const allSelected = attr.values.length > 0 && selectedCount === attr.values.length;
                                            return (
                                                <div key={attr._id} className="attr-values-panel">
                                                    <div className="attr-values-header">
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <span className="attr-values-name">{attr.name}</span>
                                                            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))', background: 'hsl(var(--secondary)/0.5)', padding: '0.15rem 0.5rem', borderRadius: '999px' }}>
                                                                {selectedCount} / {attr.values.length} selected
                                                            </span>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                                            <button className="attr-select-all-btn" onClick={() => toggleAllValues(attr._id, !allSelected)}>
                                                                {allSelected ? 'Deselect All' : 'Select All'}
                                                            </button>
                                                            <button className="attr-remove-btn" onClick={() => toggleAttribute(attr._id)} title="Remove attribute">
                                                                <X size={13} />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {attr.values.length === 0 ? (
                                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                            <div style={{ fontSize: '0.78rem', color: 'hsl(var(--muted-foreground))', fontStyle: 'italic' }}>No values found for this attribute.</div>
                                                            <button type="button" className="add-new-chip-btn" onClick={() => { setActiveAttrForValue(attr); setIsValueModalOpen(true); }} style={{ padding: '0.2rem 0.6rem', fontSize: '0.7rem' }}>
                                                                <Plus size={10} strokeWidth={3.5} /> Add New
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
                                                            {attr.values.map(val => {
                                                                const isChecked = !!vals[val._id];
                                                                return (
                                                                    <button key={val._id} type="button" onClick={() => toggleValue(attr._id, val._id)} className={`attr-value-chip ${isChecked ? 'selected' : ''}`}>
                                                                        {attr.inputType === 'Color Picker' && (
                                                                            <span style={{ display: 'inline-block', width: 11, height: 11, borderRadius: '50%', background: val.colorCode || '#ccc', border: '1px solid rgba(0,0,0,0.15)', flexShrink: 0 }} />
                                                                        )}
                                                                        {val.name}
                                                                        {isChecked && <CheckCircle size={11} />}
                                                                    </button>
                                                                );
                                                            })}
                                                            <button type="button" className="add-new-chip-btn" onClick={() => { setActiveAttrForValue(attr); setIsValueModalOpen(true); }} style={{ padding: '0.2rem 0.6rem', fontSize: '0.7rem' }}>
                                                                <Plus size={10} strokeWidth={3.5} /> Add New
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}

                                        {/* Combo Count + Generate Button */}
                                        {selectedAttributes.length > 0 && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px dashed hsl(var(--border)/0.3)' }}>
                                                <div className="combo-preview">
                                                    {comboCount > 0 ? (
                                                        <><span className="combo-count">{comboCount}</span> variant combination{comboCount !== 1 ? 's' : ''} will be generated</>
                                                    ) : (
                                                        <span style={{ color: 'hsl(var(--muted-foreground))' }}>Select values above to preview combinations</span>
                                                    )}
                                                </div>
                                                <button onClick={generateMatrix} className="vb-generate-btn" disabled={comboCount === 0}>
                                                    <Layers size={15} />
                                                    {formData.variants.length > 0 ? 'Add New Combinations' : 'Generate Variant Matrix'}
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Step 2: Variant Table */}
                                    {formData.variants.length > 0 && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            {/* Header Card */}
                                            <div className="vb-step-card" style={{ padding: 0, overflow: 'hidden' }}>
                                                <div className="vb-compact-toolbar">
                                                    <div className="vb-toolbar-status">
                                                        <div className="vb-table-title">
                                                            <span style={{ color: 'hsl(var(--primary))', marginRight: '0.4rem' }}>{formData.variants.length}</span> Variant Matrix Generated
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="vb-col-header">
                                                    <div>VARIANT</div>
                                                    <div>SKU</div>
                                                    <div className="text-center">STOCK</div>
                                                    <div className="text-center">MIN</div>
                                                    <div className="text-center">MRP</div>
                                                    <div className="text-center">PRICE</div>
                                                    <div className="text-center">TAX</div>
                                                    <div className="text-center">ACTIONS</div>
                                                </div>

                                                <div className="vb-table-body" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                                                    {formData.variants.map((v, idx) => (
                                                        <div key={idx} className="vb-variant-row">
                                                            <div>
                                                                <div className="variant-badge-group">
                                                                    {v.variantValues.map((vv, i) => (
                                                                        <div key={i} className="variant-attr-badge" title={vv.typeName}>
                                                                            {vv.colorCode && (
                                                                                <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: vv.colorCode, marginRight: 4, border: '1px solid rgba(0,0,0,0.1)' }} />
                                                                            )}
                                                                            {vv.valueName}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div style={{ display: 'flex', gap: '4px', width: '100%' }}>
                                                                    <input className="vb-row-input" style={{ flex: 1, textTransform: 'uppercase', fontSize: '0.7rem' }} value={v.sku} onChange={(e) => updateVariantRow(idx, 'sku', e.target.value)} placeholder="SKU" />
                                                                    <button className="vb-icon-btn small" onClick={() => generateSKUAction('variant', idx)}><RefreshCw size={12} /></button>
                                                                </div>
                                                            </div>
                                                            <div><input type="number" min="0" onWheel={(e) => e.target.blur()} className="vb-row-input text-center" value={v.quantity} onChange={(e) => updateVariantRow(idx, 'quantity', e.target.value)} placeholder="0" /></div>
                                                            <div><input type="number" min="0" onWheel={(e) => e.target.blur()} className="vb-row-input text-center" value={v.minStock} onChange={(e) => updateVariantRow(idx, 'minStock', e.target.value)} placeholder="0" /></div>
                                                            <div><input type="number" min="0" onWheel={(e) => e.target.blur()} className="vb-row-input text-center" value={v.mrp} onChange={(e) => updateVariantRow(idx, 'mrp', e.target.value)} placeholder="0" /></div>
                                                            <div><input type="number" min="0" onWheel={(e) => e.target.blur()} className="vb-row-input text-center" value={v.price} onChange={(e) => updateVariantRow(idx, 'price', e.target.value)} placeholder="0" /></div>
                                                            <div>
                                                                <select className="vb-row-select" value={v.taxId} onChange={(e) => updateVariantRow(idx, 'taxId', e.target.value)}>
                                                                    <option value="">No Tax</option>
                                                                    {masters.taxes.map(t => <option key={t._id} value={t._id}>{t.rate}%</option>)}
                                                                </select>
                                                            </div>
                                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                                <button className="vb-action-btn edit" onClick={() => { setEditingVariantIndex(idx); setEditingVariantData({ ...v }); }} title="Advanced Edit"><Edit2 size={12} /></button>
                                                                <button className="vb-action-btn delete" onClick={() => deleteVariantRow(idx)} title="Remove Variant"><Trash2 size={12} /></button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* â”€â”€ Tab 3: Media â”€â”€ */}
                    {activeTab === 3 && (
                        <div className="animate-in fade-in">
                            <div className="product-grid">
                                {/* Thumbnail */}
                                <div className="product-field-group" style={{ gridColumn: '1 / -1' }}>
                                    <label className="product-label">Standard Thumbnail *</label>
                                    <div className="image-upload-zone" onClick={() => document.getElementById('thumbInput').click()} style={{ height: '240px', cursor: 'pointer', border: '2px dashed hsl(var(--border)/0.4)', borderRadius: '1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'hsl(var(--card)/0.2)', position: 'relative', overflow: 'hidden' }}>
                                        {previews.thumbnail ? (
                                            <>
                                                <img src={previews.thumbnail} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: '0.3s' }} className="hover-overlay">
                                                    <Edit2 color="white" size={32} />
                                                </div>
                                                <button
                                                    onClick={removeThumbnail}
                                                    style={{
                                                        position: 'absolute',
                                                        top: 10,
                                                        right: 10,
                                                        background: 'rgba(239, 68, 68, 0.9)',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '50%',
                                                        width: 32,
                                                        height: 32,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        cursor: 'pointer',
                                                        zIndex: 20,
                                                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                                                    }}
                                                    title="Remove Thumbnail"
                                                >
                                                    <X size={18} />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'hsl(var(--primary)/0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                                                    <ImageIcon size={32} color="hsl(var(--primary))" />
                                                </div>
                                                <p style={{ fontWeight: 700, margin: 0 }}>Click to upload thumbnail</p>
                                                <p style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', textAlign: 'center' }}>
                                                    Recommended: 2-3MB (Max 5MB) <br />
                                                    800x800px (PNG/JPG)
                                                </p>
                                            </>
                                        )}
                                        <input id="thumbInput" type="file" hidden accept="image/*" onChange={handleThumbnailChange} />
                                    </div>
                                </div>

                                {/* Gallery */}
                                <div className="product-field-group" style={{ gridColumn: '1 / -1' }}>
                                    <label className="product-label">Additional Gallery Images</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
                                        {previews.gallery.map((url, idx) => (
                                            <div key={idx} style={{ position: 'relative', aspectRatio: '1/1', border: '1px solid hsl(var(--border)/0.4)', borderRadius: '0.75rem', overflow: 'hidden', background: 'white' }}>
                                                <img src={url} alt="Gallery" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                <button onClick={() => removeGalleryImage(idx)} style={{ position: 'absolute', top: 5, right: 5, background: 'rgba(239, 68, 68, 0.9)', color: 'white', border: 'none', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}>
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                        <button onClick={() => document.getElementById('galleryInput').click()} style={{ aspectRatio: '1/1', border: '2px dashed hsl(var(--border)/0.3)', borderRadius: '0.75rem', background: 'hsl(var(--secondary)/0.2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: '0.3s' }}>
                                            <Plus size={24} color="hsl(var(--muted-foreground))" />
                                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'hsl(var(--muted-foreground))', marginTop: 4 }}>Add Images</span>
                                            <span style={{ fontSize: '0.6rem', color: 'hsl(var(--muted-foreground))' }}>Max 5MB each</span>
                                        </button>
                                    </div>
                                    <input id="galleryInput" type="file" hidden multiple accept="image/*" onChange={handleGalleryChange} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* â”€â”€ Navigation Footer â”€â”€ */}
                    <div className="employee-form-footer">
                        <button type="button" className="secondary-button" onClick={() => navigate(-1)} style={{ padding: '0.75rem 1.5rem' }}>Cancel</button>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            {activeTab > 1 && (
                                <button type="button" className="secondary-button" onClick={() => setActiveTab(activeTab - 1)} style={{ padding: '0.75rem 1.5rem' }}>
                                    Previous
                                </button>
                            )}
                            {activeTab < 3 ? (
                                <button type="button" className="primary-button" onClick={() => setActiveTab(activeTab + 1)} style={{ padding: '0.75rem 2.5rem' }}>
                                    Next Phase <ChevronRight size={18} />
                                </button>
                            ) : (
                                <button type="button" className="primary-button" onClick={handleSubmit} disabled={isLoading} style={{ padding: '0.75rem 2.5rem' }}>
                                    <Save size={18} /> {isLoading ? 'Saving...' : 'Drop in Catalog'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals for Quick Creation */}
            {isCatModalOpen && (
                <QuickCreateModal
                    type="Category"
                    onClose={() => setIsCatModalOpen(false)}
                    onSuccess={(newCat) => {
                        setMasters(prev => ({ ...prev, categories: [...prev.categories, newCat] }));
                        setFormData(prev => ({ ...prev, categoryId: newCat._id }));
                    }}
                />
            )}
            {isSubCatModalOpen && (
                <QuickCreateModal
                    type="Sub Category"
                    categoryId={formData.categoryId}
                    onClose={() => setIsSubCatModalOpen(false)}
                    onSuccess={(newSub) => {
                        setMasters(prev => ({ ...prev, allSubCategories: [...prev.allSubCategories, newSub], subCategories: [...prev.subCategories, newSub] }));
                        setFormData(prev => ({ ...prev, subCategoryId: newSub._id }));
                    }}
                />
            )}
            {isBrandModalOpen && (
                <QuickCreateModal
                    type="Brand"
                    onClose={() => setIsBrandModalOpen(false)}
                    onSuccess={(newBrand) => {
                        setMasters(prev => ({ ...prev, brands: [...prev.brands, newBrand] }));
                        setFormData(prev => ({ ...prev, brandId: newBrand._id }));
                    }}
                />
            )}
            {isUnitModalOpen && (
                <QuickCreateModal
                    type="Unit"
                    onClose={() => setIsUnitModalOpen(false)}
                    onSuccess={(newUnit) => {
                        setMasters(prev => ({ ...prev, units: [...prev.units, newUnit] }));
                        setFormData(prev => ({ ...prev, unitId: newUnit._id }));
                    }}
                />
            )}
            {isTaxModalOpen && (
                <QuickCreateModal
                    type="Tax"
                    onClose={() => setIsTaxModalOpen(false)}
                    onSuccess={(newTax) => {
                        setMasters(prev => ({ ...prev, taxes: [...prev.taxes, newTax] }));
                        setFormData(prev => ({ ...prev, pricing: { ...prev.pricing, taxId: newTax._id } }));
                    }}
                />
            )}
            {isAttrModalOpen && (
                <QuickCreateModal
                    type="Variant Attribute"
                    onClose={() => setIsAttrModalOpen(false)}
                    onSuccess={(newAttr) => {
                        setMasters(prev => ({ ...prev, variantAttributes: [...prev.variantAttributes, { ...newAttr, values: [] }] }));
                    }}
                />
            )}
            {isValueModalOpen && activeAttrForValue && (
                <QuickCreateModal
                    type="Variant Value"
                    variantTypeId={activeAttrForValue._id}
                    onClose={() => { setIsValueModalOpen(false); setActiveAttrForValue(null); }}
                    onSuccess={(newVal) => {
                        setSelectedAttributes(prev => prev.map(a => a._id === activeAttrForValue._id ? { ...a, values: [...a.values, newVal] } : a));
                        setSelectedValuesPerAttr(prev => ({ ...prev, [activeAttrForValue._id]: { ...prev[activeAttrForValue._id], [newVal._id]: true } }));
                    }}
                />
            )}

            {/* Variant Edit Modal (Portal) */}
            {editingVariantIndex !== null && editingVariantData && createPortal(
                <div className="variant-edit-modal-overlay">
                    <div className="variant-edit-modal">
                        <div className="modal-header">
                            <div>
                                <h3>Edit Variant Combination</h3>
                                <div className="modal-subtitle">
                                    {editingVariantData.variantValues.map((vv, i) => (
                                        <span key={vv.valueId} className="modal-badge">
                                            {vv.typeName}: <strong>{vv.valueName}</strong>
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <button className="modal-close" onClick={() => { setEditingVariantIndex(null); setEditingVariantData(null); }}><X size={20} /></button>
                        </div>

                        <div className="modal-body">
                            <div className="product-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem' }}>
                                <div className="product-field-group">
                                    <label className="product-label">SKU</label>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <input name="sku" className="product-input" style={{ flex: 1, textTransform: 'uppercase', fontSize: '0.85rem' }} value={editingVariantData.sku} onChange={handleVariantEditChange} />
                                        <button className="vb-icon-btn" onClick={() => generateSKUAction('variant', editingVariantIndex)}><RefreshCw size={15} /></button>
                                    </div>
                                </div>
                                <div className="product-field-group">
                                    <label className="product-label">Tax Config</label>
                                    <CustomSelect
                                        options={[{ value: '', label: 'None' }, ...masters.taxes.map(t => ({ value: t._id, label: `${t.name} (${t.rate}%)` }))]}
                                        value={editingVariantData.taxId}
                                        onChange={(val) => handleVariantEditChange({ target: { name: 'taxId', value: val } })}
                                    />
                                </div>
                                <div className="product-field-group">
                                    <label className="product-label">MRP (RS)</label>
                                    <input type="number" min="0" onWheel={(e) => e.target.blur()} name="mrp" className="product-input" value={editingVariantData.mrp} onChange={handleVariantEditChange} />
                                </div>
                                <div className="product-field-group">
                                    <label className="product-label">Selling Price (RS)</label>
                                    <input type="number" min="0" onWheel={(e) => e.target.blur()} name="price" className="product-input" value={editingVariantData.price} onChange={handleVariantEditChange} />
                                </div>
                                <div className="product-field-group">
                                    <label className="product-label">Discount Type</label>
                                    <CustomSelect
                                        options={[
                                            { value: 'Fixed', label: 'Fixed amount (RS)' },
                                            { value: 'Percentage', label: 'Percentage (%)' }
                                        ]}
                                        value={editingVariantData.discountType || 'Fixed'}
                                        onChange={(val) => handleVariantEditChange({ target: { name: 'discountType', value: val } })}
                                    />
                                </div>
                                <div className="product-field-group">
                                    <label className="product-label">Discount Value</label>
                                    <input type="number" min="0" onWheel={(e) => e.target.blur()} name="discountValue" className="product-input" value={editingVariantData.discountValue} onChange={handleVariantEditChange} />
                                </div>
                                <div className="product-field-group">
                                    <label className="product-label">Final Price</label>
                                    <input type="number" className="product-input" style={{ fontWeight: 800, background: 'hsl(var(--secondary)/0.3)' }} value={editingVariantData.finalSellingPrice} readOnly />
                                </div>
                                <div className="product-field-group">
                                    <label className="product-label">Cost Price</label>
                                    <input type="number" min="0" onWheel={(e) => e.target.blur()} name="costPrice" className="product-input" value={editingVariantData.costPrice} onChange={handleVariantEditChange} />
                                </div>
                                <div className="product-field-group">
                                    <label className="product-label">Stock Quantity</label>
                                    <input type="number" min="0" onWheel={(e) => e.target.blur()} name="quantity" className="product-input" style={{ borderColor: 'hsl(var(--primary)/0.3)', fontWeight: 700 }} value={editingVariantData.quantity} onChange={handleVariantEditChange} />
                                </div>
                                <div className="product-field-group">
                                    <label className="product-label">Min Stock</label>
                                    <input type="number" min="0" onWheel={(e) => e.target.blur()} name="minStock" className="product-input" value={editingVariantData.minStock} onChange={handleVariantEditChange} />
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="secondary-button" onClick={() => { setEditingVariantIndex(null); setEditingVariantData(null); }}>Discard</button>
                            <button className="primary-button" onClick={handleSaveVariantRow}>Apply Changes</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {isLoading && <Loader />}
        </div>
    );
};

export default AddProduct;
