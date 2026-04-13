import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft, Save, Plus, Trash2, Image as ImageIcon, CheckCircle,
    Package, DollarSign, ChevronRight, X, RefreshCw, Layers, Zap, Edit2,
    QrCode, Lock, ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';
import productService from '../../services/productService';
import Loader from '../../components/Loader';
import CustomSelect from '../../components/CustomSelect';
import QuickCreateModal from '../../components/QuickCreateModal';
import './Product.css';

const EditProduct = () => {
    const navigate = useNavigate();
    const { id } = useParams();
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
            costPrice: '',
            taxId: '',
            discountType: 'Fixed',
            discountValue: 0,
            finalSellingPrice: 0,
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
    const [previews, setPreviews] = useState({ thumbnail: '', gallery: [], qrCode: '' });

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
        const loadAllData = async () => {
            setIsLoading(true);
            try {
                const [cat, sub, br, un, tx, attr, productRes] = await Promise.all([
                    productService.getCategories(),
                    productService.getSubcategories(),
                    productService.getBrands(),
                    productService.getUnits(),
                    productService.getTaxes(),
                    productService.getVariantAttributes(),
                    productService.getProductById(id)
                ]);

                const fetchedVariantAttributes = (attr.variantTypes || []).filter(a => a.status);
                const allSubCats = sub.subcategories || [];

                const p = productRes.product;

                setMasters({
                    categories: cat.categories || [],
                    allSubCategories: allSubCats,
                    subCategories: (p.categoryId || p.category) ? allSubCats.filter(s => s.categoryId?._id === (p.categoryId?._id || p.categoryId || p.category?._id || p.category)) : [],
                    brands: br.brands || [],
                    units: un.units || [],
                    taxes: tx.taxes || [],
                    variantAttributes: fetchedVariantAttributes,
                });

                setFormData({
                    name: p.name || '',
                    categoryId: p.categoryId || p.category?._id || p.category || '',
                    subCategoryId: p.subCategoryId || p.subcategory?._id || p.subcategory || '',
                    brandId: p.brandId || p.brandName?._id || p.brandName || '',
                    unitId: p.unitId?._id || p.unitId || '',
                    description: p.description || '',
                    productType: p.productType || 'Single',
                    pricing: {
                        mrp: p.pricing?.mrp || '',
                        sellingPrice: p.pricing?.sellingPrice || '',
                        costPrice: p.pricing?.costPrice || '',
                        taxId: p.pricing?.taxId?._id || p.pricing?.taxId || '',
                        discountType: p.pricing?.discountType || 'Fixed',
                        discountValue: p.pricing?.discountValue || 0,
                        finalSellingPrice: p.pricing?.finalSellingPrice || p.pricing?.sellingPrice || '',
                        quantity: p.pricing?.quantity !== undefined ? p.pricing.quantity : (p.inventory?.quantity || ''),
                        sku: p.pricing?.sku || '',
                        minStock: p.pricing?.minStock !== undefined ? p.pricing.minStock : (p.inventory?.minStock || 0)
                    },
                    variants: p.variants ? p.variants.map(v => ({
                        _id: v._id,
                        variantValues: v.attributes.map(a => ({
                            variantTypeId: a.variantTypeId?._id || a.variantTypeId,
                            valueId: a.valueId?._id || a.valueId,
                            valueName: a.valueId?.valueName || '',
                            typeName: a.variantTypeId?.name || ''
                        })),
                        sku: v.sku,
                        quantity: v.inventory?.quantity || '',
                        price: v.pricing?.sellingPrice || '',
                        mrp: v.pricing?.mrp || '',
                        costPrice: v.pricing?.costPrice || '',
                        discountType: v.pricing?.discountType || 'Percentage',
                        discountValue: v.pricing?.discountValue || 0,
                        finalSellingPrice: v.pricing?.finalSellingPrice || v.pricing?.sellingPrice || '',
                        taxId: v.pricing?.taxId?._id || v.pricing?.taxId || '',
                        minStock: v.inventory?.minStock || 0
                    })) : [],
                });

                if (p.productType === 'Variant' && p.variants?.length > 0) {
                    const selectedAttrsMap = {};
                    const selectedValsMap = {};
                    const attrIdsToFetch = new Set();

                    p.variants.forEach(v => {
                        v.attributes.forEach(a => {
                            const typeId = a.variantTypeId?._id || a.variantTypeId;
                            const valId = a.valueId?._id || a.valueId;
                            attrIdsToFetch.add(typeId);

                            if (!selectedValsMap[typeId]) selectedValsMap[typeId] = {};
                            selectedValsMap[typeId][valId] = true;
                        });
                    });

                    await Promise.all(Array.from(attrIdsToFetch).map(async (typeId) => {
                        const masterAttr = fetchedVariantAttributes.find(ma => ma._id === typeId);
                        if (masterAttr) {
                            try {
                                const res = await productService.getVariantValues(typeId);
                                masterAttr.values = res.variantValues || [];
                            } catch (e) {
                                console.error('Failed fetching vals for', typeId);
                                masterAttr.values = [];
                            }
                            selectedAttrsMap[typeId] = masterAttr;
                        }
                    }));

                    setSelectedAttributes(Object.values(selectedAttrsMap));
                    setSelectedValuesPerAttr(selectedValsMap);
                }

                if (p.images) {
                    setPreviews({
                        thumbnail: p.images.thumbnail ? `http://localhost:5000/${p.images.thumbnail}` : '',
                        gallery: p.images.gallery ? p.images.gallery.map(g => `http://localhost:5000/${g}`) : [],
                        qrCode: p.qrCode ? `http://localhost:5000${p.qrCode}` : ''
                    });
                }
            } catch (error) {
                console.error(error);
                toast.error('Failed to load product data');
            } finally {
                setIsLoading(false);
            }
        };

        if (id) loadAllData();
    }, [id]);

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

    // ─── Variant Builder Logic ─────────────────────────────────────────────────

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

    const comboCount = getComboCount();

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

    // ─── Submit ────────────────────────────────────────────────────────────────

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
            const res = await productService.updateProduct(id, data);
            console.log(res);
            toast.success('Product updated successfully!');
            navigate('/products/list-products');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update product');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="product-page-container">
            {isLoading && <Loader />}

            <header className="product-header">
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <button className="product-btn-icon" onClick={() => navigate(-1)} title="Back to list">
                            <ArrowLeft size={16} />
                        </button>
                        <h1>{id ? `Edit Product studio` : 'Create New Product'}</h1>
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
                        {['1. General Information', '2. Pricing & Stock Summary', '3. Media Assets'][activeTab - 1]}
                    </h3>
                </div>

                {/* ── Tab 1: General Info ── */}
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
                                    <button type="button" className="add-new-chip-btn" onClick={() => setIsCatModalOpen(true)}>
                                        <span className="add-new-chip-icon"><Plus size={10} strokeWidth={3.5} /></span>
                                        Add New
                                    </button>
                                </label>
                                <CustomSelect
                                    options={[{ value: '', label: 'None' }, ...masters.categories.map(c => ({ value: c._id, label: c.name }))]}
                                    value={formData.categoryId}
                                    onChange={(val) => {
                                        setFormData(prev => ({ ...prev, categoryId: val, subCategoryId: '' }));
                                        const filtered = val ? masters.allSubCategories.filter(s => (s.categoryId?._id || s.categoryId) === val) : [];
                                        setMasters(prev => ({ ...prev, subCategories: filtered }));
                                    }}
                                    placeholder="Select Category"
                                />
                            </div>
                            <div className="product-field-group">
                                <label className="product-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>Sub-Classification</span>
                                    <button type="button" className="add-new-chip-btn" onClick={() => setIsSubCatModalOpen(true)} disabled={!formData.categoryId} style={{ opacity: !formData.categoryId ? 0.4 : 1 }}>
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

                {/* ── Tab 2: Pricing & Stock ── */}
                {activeTab === 2 && (
                    <div className="animate-in fade-in">
                        <div className="type-selection-wrapper">
                            <label className={`type-selection-card ${formData.productType === 'Single' ? 'active' : ''}`}>
                                <input type="radio" name="productType" value="Single" checked={formData.productType === 'Single'} onChange={handleInputChange} />
                                <div className="type-selection-icon"><Package size={14} strokeWidth={2.5} /></div>
                                <div className="type-selection-title">Standard Single</div>
                            </label>
                            <label className={`type-selection-card ${formData.productType === 'Variant' ? 'active' : ''}`}>
                                <input type="radio" name="productType" value="Variant" checked={formData.productType === 'Variant'} onChange={handleInputChange} />
                                <div className="type-selection-icon"><Layers size={14} strokeWidth={2.5} /></div>
                                <div className="type-selection-title">Variant Matrix</div>
                            </label>
                        </div>

                        {formData.productType === 'Single' && (
                            <div className="product-grid">
                                <div style={{ gridColumn: '1 / -1', padding: '1rem', background: 'hsl(var(--secondary) / 0.5)', borderRadius: '12px', border: '1px solid hsl(var(--border))', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'hsl(var(--foreground))' }}>
                                            <Layers size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
                                            Inventory is Batch-Managed
                                        </p>
                                        <p style={{ margin: '4px 0 0 24px', fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))' }}>
                                            Update pricing and quantities in Stock Management for active batches.
                                        </p>
                                    </div>
                                    <button type="button" className="vb-generate-btn" style={{ margin: 0 }} onClick={() => navigate('/stock')}>
                                        <Zap size={14} /> Go to Stock
                                    </button>
                                </div>
                                <div className="product-field-group">
                                    <label className="product-label">SKU</label>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <input name="sku" className="product-input" value={formData.pricing.sku} onChange={handlePricingChange} placeholder="AUTO" />
                                        <button className="vb-icon-btn" onClick={() => generateSKUAction('product')}><RefreshCw size={15} /></button>
                                    </div>
                                </div>
                                <div className="product-field-group">
                                    <label className="product-label">Tax</label>
                                    <CustomSelect
                                        options={[{ value: '', label: 'None' }, ...masters.taxes.map(t => ({ value: t._id, label: `${t.name} (${t.rate}%)` }))]}
                                        value={formData.pricing.taxId}
                                        onChange={(val) => handlePricingChange({ target: { name: 'taxId', value: val } })}
                                    />
                                </div>
                                <div className="product-field-group">
                                    <label className="product-label">MRP (RS) *</label>
                                    <input type="number" name="mrp" className="product-input" value={formData.pricing.mrp} onChange={handlePricingChange} />
                                </div>
                                <div className="product-field-group">
                                    <label className="product-label">Selling Price (RS) *</label>
                                    <input type="number" name="sellingPrice" className="product-input" value={formData.pricing.sellingPrice} onChange={handlePricingChange} />
                                </div>
                                <div className="product-field-group">
                                    <label className="product-label">Discount Type</label>
                                    <CustomSelect options={[{ value: 'Fixed', label: 'Fixed' }, { value: 'Percentage', label: '%' }]} value={formData.pricing.discountType} onChange={(val) => handlePricingChange({ target: { name: 'discountType', value: val } })} />
                                </div>
                                <div className="product-field-group">
                                    <label className="product-label">Discount Value</label>
                                    <input type="number" name="discountValue" className="product-input" value={formData.pricing.discountValue} onChange={handlePricingChange} />
                                </div>
                                <div className="product-field-group">
                                    <label className="product-label">Final Selling Price</label>
                                    <input type="number" readOnly className="product-input" style={{ fontWeight: 800, color: 'hsl(var(--primary))', background: 'hsl(var(--primary)/0.05)' }} value={formData.pricing.finalSellingPrice} />
                                </div>
                                <div className="product-field-group">
                                    <label className="product-label">Min Stock Alert</label>
                                    <input type="number" name="minStock" className="product-input" value={formData.pricing.minStock} onChange={handlePricingChange} />
                                </div>
                            </div>
                        )}

                        {formData.productType === 'Variant' && (
                            <div className="variant-builder-section">
                                <div className="vb-step-card">
                                    <div className="vb-step-header">
                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                            <div className="vb-step-number">1</div>
                                            <div className="vb-step-title">Select Attributes</div>
                                        </div>
                                        <button type="button" className="add-new-chip-btn" onClick={() => setIsAttrModalOpen(true)}>
                                            <Plus size={10} /> Add New
                                        </button>
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}>
                                        {masters.variantAttributes.map(attr => (
                                            <button key={attr._id} type="button" onClick={() => toggleAttribute(attr._id)} className={`attr-type-toggle ${selectedAttributes.some(a => a._id === attr._id) ? 'active' : ''}`}>
                                                {attr.name}
                                            </button>
                                        ))}
                                    </div>
                                    {selectedAttributes.map(attr => (
                                        <div key={attr._id} className="attr-values-panel" style={{ marginTop: '1rem' }}>
                                            <div className="attr-values-header">
                                                <span>{attr.name}</span>
                                                <button onClick={() => toggleAllValues(attr._id, !Object.values(selectedValuesPerAttr[attr._id] || {}).every(Boolean))}>Toggle All</button>
                                            </div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                                                {attr.values.map(val => (
                                                    <button key={val._id} type="button" onClick={() => toggleValue(attr._id, val._id)} className={`attr-value-chip ${selectedValuesPerAttr[attr._id]?.[val._id] ? 'selected' : ''}`}>
                                                        {val.name}
                                                    </button>
                                                ))}
                                                <button type="button" className="add-new-chip-btn" onClick={() => { setActiveAttrForValue(attr); setIsValueModalOpen(true); }}>
                                                    <Plus size={10} /> Add Value
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                                        <button onClick={generateMatrix} className="vb-generate-btn" disabled={comboCount === 0}>
                                            Generate {comboCount} Variants
                                        </button>
                                    </div>
                                </div>

                                {formData.variants.length > 0 && (
                                    <div className="vb-step-card" style={{ marginTop: '1rem', padding: 0, overflow: 'hidden' }}>
                                        <div className="vb-col-header" style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1fr 1fr 1fr 0.5fr 0.5fr', padding: '1rem', background: 'hsl(var(--secondary)/0.5)', fontWeight: 700, fontSize: '0.75rem' }}>
                                            <div>VARIANT</div>
                                            <div>SKU</div>
                                            <div>MRP</div>
                                            <div>PRICE</div>
                                            <div>DISC.</div>
                                            <div>FINAL</div>
                                            <div>COST</div>
                                            <div>STOCK</div>
                                            <div>EDIT</div>
                                            <div>DEL</div>
                                        </div>
                                        {formData.variants.map((v, idx) => (
                                            <div key={idx} className="vb-variant-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1fr 1fr 1fr 0.5fr 0.5fr', padding: '0.8rem 1rem', borderTop: '1px solid hsl(var(--border)/0.2)', fontSize: '0.85rem', alignItems: 'center' }}>
                                                <div className="vb-badge-group" style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                    {v.variantValues.map((val, vi) => (
                                                        <span key={vi} style={{ background: 'hsl(var(--primary)/0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem' }}>{val.valueName}</span>
                                                    ))}
                                                </div>
                                                <input className="vb-row-input" value={v.sku} onChange={(e) => updateVariantRow(idx, 'sku', e.target.value)} />
                                                <input type="number" className="vb-row-input" value={v.mrp} onChange={(e) => updateVariantRow(idx, 'mrp', e.target.value)} />
                                                <input type="number" className="vb-row-input" value={v.price} onChange={(e) => updateVariantRow(idx, 'price', e.target.value)} />
                                                <input type="number" className="vb-row-input" value={v.discountValue} onChange={(e) => updateVariantRow(idx, 'discountValue', e.target.value)} />
                                                <div style={{ fontWeight: 800, color: 'hsl(var(--primary))' }}>{v.finalSellingPrice}</div>
                                                <input type="number" className="vb-row-input" value={v.costPrice} onChange={(e) => updateVariantRow(idx, 'costPrice', e.target.value)} />
                                                <input type="number" className="vb-row-input" value={v.quantity} onChange={(e) => updateVariantRow(idx, 'quantity', e.target.value)} />
                                                <button onClick={() => { setEditingVariantIndex(idx); setEditingVariantData({ ...v }); }}><Edit2 size={13} /></button>
                                                <button onClick={() => deleteVariantRow(idx)} disabled={!!v._id}><Trash2 size={13} /></button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* ── Tab 3: Visuals ── */}
                {activeTab === 3 && (
                    <div className="animate-in fade-in">
                        <div className="product-grid">
                            <div className="product-field-group">
                                <label className="product-label">Thumbnail</label>
                                <div className="image-upload-zone" style={{ height: 200, border: '2px dashed hsl(var(--border)/0.3)', borderRadius: '1rem', position: 'relative', overflow: 'hidden' }}>
                                    {previews.thumbnail ? (
                                        <>
                                            <img src={previews.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
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
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                            <p style={{ margin: 0, fontSize: '0.8rem' }}>Click to upload</p>
                                            <p style={{ fontSize: '0.65rem', color: 'hsl(var(--muted-foreground))', textAlign: 'center' }}>
                                                Recommended: 2-3MB <br />
                                                Max: 5MB
                                            </p>
                                        </div>
                                    )}
                                    <input id="thumbInput" type="file" accept="image/*" onChange={handleThumbnailChange} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                                </div>
                            </div>
                            <div className="product-field-group">
                                <label className="product-label">Gallery</label>
                                <div className="image-upload-zone" style={{ height: 200, border: '2px dashed hsl(var(--border)/0.3)', borderRadius: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', padding: '0.5rem' }}>
                                    {previews.gallery.map((src, i) => (
                                        <div key={i} style={{ width: 60, height: 60, position: 'relative' }}>
                                            <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            <button onClick={() => removeGalleryImage(i)} style={{ position: 'absolute', top: 0, right: 0 }}>X</button>
                                        </div>
                                    ))}
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: 60, height: 60, border: '1px dashed hsl(var(--border))', borderRadius: '4px', position: 'relative' }}>
                                        <Plus size={16} />
                                        <span style={{ fontSize: '0.5rem', textAlign: 'center' }}>Max 5MB</span>
                                        <input type="file" multiple accept="image/*" onChange={handleGalleryChange} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="action-footer" style={{ borderTop: '1px solid hsl(var(--border)/0.2)', padding: '1.25rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button className="btn-premium-outline" onClick={() => navigate(-1)}>Cancel</button>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        {activeTab > 1 && <button className="btn-premium-outline" onClick={() => setActiveTab(activeTab - 1)}>Back</button>}
                        {activeTab < 3 ? (
                            <button className="btn-premium-primary" onClick={() => setActiveTab(activeTab + 1)}>Next</button>
                        ) : (
                            <button className="btn-premium-primary" onClick={handleSubmit} disabled={isLoading}>
                                {isLoading ? 'Updating...' : 'Update Product'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <QuickCreateModal isOpen={isCatModalOpen} onClose={() => setIsCatModalOpen(false)} type="Category" masters={{ categories: masters.categories }} onSuccess={(created) => { if (created?._id) { setMasters(p => ({ ...p, categories: [...p.categories, created] })); setFormData(p => ({ ...p, categoryId: created._id })); } setIsCatModalOpen(false); }} />
            <QuickCreateModal isOpen={isSubCatModalOpen} onClose={() => setIsSubCatModalOpen(false)} type="Subcategory" masters={{ categories: masters.categories }} onSuccess={(created) => { if (created?._id) { setMasters(p => ({ ...p, allSubCategories: [...p.allSubCategories, created] })); setFormData(p => ({ ...p, subCategoryId: created._id })); } setIsSubCatModalOpen(false); }} />
            <QuickCreateModal isOpen={isBrandModalOpen} onClose={() => setIsBrandModalOpen(false)} type="Brand" masters={{}} onSuccess={(created) => { if (created?._id) { setMasters(p => ({ ...p, brands: [...p.brands, created] })); setFormData(p => ({ ...p, brandId: created._id })); } setIsBrandModalOpen(false); }} />
            <QuickCreateModal isOpen={isUnitModalOpen} onClose={() => setIsUnitModalOpen(false)} type="Unit" masters={{}} onSuccess={(created) => { if (created?._id) { setMasters(p => ({ ...p, units: [...p.units, created] })); setFormData(p => ({ ...p, unitId: created._id })); } setIsUnitModalOpen(false); }} />
            <QuickCreateModal isOpen={isTaxModalOpen} onClose={() => setIsTaxModalOpen(false)} type="Tax" masters={{}} onSuccess={(created) => { if (created?._id) { setMasters(p => ({ ...p, taxes: [...p.taxes, created] })); setFormData(p => ({ ...p, pricing: { ...p.pricing, taxId: created._id } })); } setIsTaxModalOpen(false); }} />
            <QuickCreateModal isOpen={isAttrModalOpen} onClose={() => setIsAttrModalOpen(false)} type="Attribute" masters={{}} onSuccess={(created) => { if (created?._id) setMasters(p => ({ ...p, variantAttributes: [...p.variantAttributes, created] })); setIsAttrModalOpen(false); }} />
            <QuickCreateModal isOpen={isValueModalOpen} onClose={() => setIsValueModalOpen(false)} type="Value" masters={{ variantTypeId: activeAttrForValue?._id }} onSuccess={(created, result) => { if (activeAttrForValue) { const list = result?.variantValues || (created ? [created] : []); setMasters(p => ({ ...p, variantAttributes: p.variantAttributes.map(a => a._id === activeAttrForValue._id ? { ...a, values: list } : a) })); } setIsValueModalOpen(false); }} />

            {editingVariantData && createPortal(
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setEditingVariantData(null)}>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '1.5rem', width: 400 }} onClick={e => e.stopPropagation()}>
                        <h3>Edit Variant</h3>
                        <input className="product-input" value={editingVariantData.sku} onChange={(e) => setEditingVariantData({ ...editingVariantData, sku: e.target.value })} placeholder="SKU" />
                        <input type="number" className="product-input" value={editingVariantData.price} onChange={(e) => setEditingVariantData({ ...editingVariantData, price: e.target.value })} placeholder="Price" />
                        <button className="btn-premium-primary" onClick={handleSaveVariantRow}>Save</button>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default EditProduct;
