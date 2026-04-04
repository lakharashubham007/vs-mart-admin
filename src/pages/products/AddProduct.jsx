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
                    newPricing.finalSellingPrice = newPricing.sellingPrice || 0;
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
            setImages(prev => ({ ...prev, thumbnail: file }));
            setPreviews(prev => ({ ...prev, thumbnail: URL.createObjectURL(file) }));
        }
    };

    const handleGalleryChange = (e) => {
        const files = Array.from(e.target.files);
        setImages(prev => ({ ...prev, gallery: [...prev.gallery, ...files] }));
        const newPreviews = files.map(f => URL.createObjectURL(f));
        setPreviews(prev => ({ ...prev, gallery: [...prev.gallery, ...newPreviews] }));
    };

    const removeGalleryImage = (index) => {
        setImages(prev => ({ ...prev, gallery: prev.gallery.filter((_, i) => i !== index) }));
        setPreviews(prev => ({ ...prev, gallery: prev.gallery.filter((_, i) => i !== index) }));
    };

    // Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Variant Builder Logic Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

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
                    updatedVar.finalSellingPrice = updatedVar.price || 0;
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
                    next.finalSellingPrice = next.price || 0;
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

    // Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Submit Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

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

    // Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Render Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

    const comboCount = getComboCount();

    return (
        <div className="product-page-container fade-in">
            <div className="product-content-pane">
                <header className="internal-page-header" style={{ padding: '0 0 1.5rem 0', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'flex-start' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: 'hsl(var(--foreground))' }}>
                                    <ArrowLeft size={18} />
                                </button>
                                <span style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'hsl(var(--primary))' }}>
                                    Catalog / New Product
                                </span>
                            </div>
                            <h1 style={{ fontSize: '1.6rem', fontWeight: '800', margin: '0 0 4px 0', color: 'hsl(var(--foreground))' }}>
                                {formData.name || 'Create New Product'}
                            </h1>
                            <p style={{ margin: 0, color: 'hsl(var(--muted-foreground))', fontSize: '0.9rem' }}>
                                Define standard or variant-based products for the catalog.
                            </p>
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))', background: 'hsl(var(--secondary) / 0.5)', padding: '0.4rem 0.8rem', borderRadius: '20px' }}>
                            Phase {activeTab} / 3
                        </span>
                    </div>

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
                </header>

                <div className="product-glass-card" style={{ padding: '2rem', overflow: 'visible' }}>
                    <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid hsl(var(--border)/0.2)', paddingBottom: '1rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'hsl(var(--primary))', margin: 0 }}>
                            {['1. General Information', '2. Pricing & Initial Stock', '3. Media Assets'][activeTab - 1]}
                        </h3>
                    </div>

                    {/* Ã¢â€â‚¬Ã¢â€â‚¬ Tab 1: General Info Ã¢â€â‚¬Ã¢â€â‚¬ */}
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

                    {/* Ã¢â€â‚¬Ã¢â€â‚¬ Tab 2: Pricing & Stock Ã¢â€â‚¬Ã¢â€â‚¬ */}
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

                            {/* Ã¢â€â‚¬Ã¢â€â‚¬ Single Product Pricing (Initial Batch) Ã¢â€â‚¬Ã¢â€â‚¬ */}
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
                                        <label className="product-label">MRP (Ã¢â€šÂ¹)</label>
                                        <input type="number" min="0" onWheel={(e) => e.target.blur()} onKeyDown={(e) => { if (e.key === "-" || e.key === "e" || e.key === "E") e.preventDefault(); }} name="mrp" className="product-input" value={formData.pricing.mrp} onChange={handlePricingChange} placeholder="0.00" />
                                    </div>
                                    <div className="product-field-group">
                                        <label className="product-label">Standard Selling Price (Ã¢â€šÂ¹) *</label>
                                        <input type="number" min="0" onWheel={(e) => e.target.blur()} onKeyDown={(e) => { if (e.key === "-" || e.key === "e" || e.key === "E") e.preventDefault(); }} name="sellingPrice" className="product-input" value={formData.pricing.sellingPrice} onChange={handlePricingChange} placeholder="0.00" />
                                    </div>
                                    <div className="product-field-group">
                                        <label className="product-label">Discount Type</label>
                                        <CustomSelect
                                            options={[
                                                { value: 'Fixed', label: 'Fixed Amount (Ã¢â€šÂ¹)' },
                                                { value: 'Percentage', label: 'Percentage (%)' }
                                            ]}
                                            value={formData.pricing.discountType || 'Fixed'}
                                            onChange={(val) => handlePricingChange({ target: { name: 'discountType', value: val } })}
                                            placeholder="Select Type"
                                        />
                                    </div>
                                    <div className="product-field-group">
                                        <label className="product-label">Discount Value</label>
                                        <input type="number" min="0" onWheel={(e) => e.target.blur()} onKeyDown={(e) => { if (e.key === "-" || e.key === "e" || e.key === "E") e.preventDefault(); }} name="discountValue" className="product-input" value={formData.pricing.discountValue} onChange={handlePricingChange} placeholder="0" />
                                    </div>
                                    <div className="product-field-group">
                                        <label className="product-label">Final Selling Price (Ã¢â€šÂ¹)</label>
                                        <input type="number" min="0" onWheel={(e) => e.target.blur()} onKeyDown={(e) => { if (e.key === "-" || e.key === "e" || e.key === "E") e.preventDefault(); }} name="finalSellingPrice" className="product-input" style={{ fontWeight: 800, fontSize: '1.1rem', color: 'hsl(var(--primary))', background: 'hsl(var(--secondary)/0.3)' }} value={formData.pricing.finalSellingPrice} onChange={handlePricingChange} placeholder="0.00" />
                                    </div>
                                    <div className="product-field-group">
                                        <label className="product-label">Cost Price (Ã¢â€šÂ¹)</label>
                                        <input type="number" min="0" onWheel={(e) => e.target.blur()} onKeyDown={(e) => { if (e.key === "-" || e.key === "e" || e.key === "E") e.preventDefault(); }} name="costPrice" className="product-input" value={formData.pricing.costPrice} onChange={handlePricingChange} placeholder="0.00" />
                                    </div>
                                    <div className="product-field-group">
                                        <label className="product-label">Initial Stock Quantity *</label>
                                        <input type="number" min="0" onWheel={(e) => e.target.blur()} onKeyDown={(e) => { if (e.key === "-" || e.key === "e" || e.key === "E") e.preventDefault(); }} name="quantity" className="product-input" style={{ fontWeight: 700, borderColor: 'hsl(var(--primary) / 0.3)' }} value={formData.pricing.quantity} onChange={handlePricingChange} placeholder="0" />
                                    </div>
                                    <div className="product-field-group">
                                        <label className="product-label">Min Stock Alert</label>
                                        <input type="number" min="0" onWheel={(e) => e.target.blur()} onKeyDown={(e) => { if (e.key === "-" || e.key === "e" || e.key === "E") e.preventDefault(); }} name="minStock" className="product-input" value={formData.pricing.minStock} onChange={handlePricingChange} placeholder="0" />
                                    </div>
                                </div>
                            )}

                            {/* Ã¢â€â‚¬Ã¢â€â‚¬ Variant Matrix Builder Ã¢â€â‚¬Ã¢â€â‚¬ */}
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

                                                <div className="vb-col-header" style={{ gridTemplateColumns: 'minmax(150px, 1.5fr) minmax(130px, 1fr) 0.8fr 0.7fr 0.8fr 0.8fr 0.8fr 0.8fr 1.2fr 0.8fr 0.8fr 40px 40px' }}>
                                                    <div>VARIANT</div>
                                                    <div>SKU</div>
                                                    <div>MRP</div>
                                                    <div>TYPE</div>
                                                    <div>DISC.</div>
                                                    <div>SELL PRICE</div>
                                                    <div>FINAL PRICE</div>
                                                    <div>COST PRICE</div>
                                                    <div>TAX</div>
                                                    <div>STOCK</div>
                                                    <div>MIN.</div>
                                                    <div>EDIT</div>
                                                    <div>DEL</div>
                                                </div>
                                            </div>

                                            {/* Body Card */}
                                            <div className="vb-step-card" style={{ padding: 0, overflow: 'hidden' }}>
                                                <div style={{ paddingBottom: '1rem' }}>
                                                    {formData.variants.map((v, idx) => (
                                                        <div key={idx} className="vb-variant-row" style={{ gridTemplateColumns: 'minmax(150px, 1.5fr) minmax(130px, 1fr) 0.8fr 0.7fr 0.8fr 0.8fr 0.8fr 0.8fr 1.2fr 0.8fr 0.8fr 40px 40px' }} onClick={() => { setEditingVariantIndex(idx); setEditingVariantData({ ...v }); }}>
                                                            <div data-label="Combination">
                                                                <div className="vb-badge-group">
                                                                    {v.variantValues.map((val, vi) => (
                                                                        <span key={vi} className="vb-attr-badge">
                                                                            <span className="vb-badge-type">{val.typeName}:</span> {val.valueName}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <div data-label="SKU">
                                                                <div style={{ display: 'flex', gap: '0.3rem', width: '100%', alignItems: 'center' }}>
                                                                    <input type='text' className="vb-row-input" style={{ fontSize: '0.75rem', fontFamily: 'monospace' }} placeholder="AUTO" value={v.sku} onChange={(e) => updateVariantRow(idx, 'sku', e.target.value)} onClick={(e) => e.stopPropagation()} />
                                                                    <button className="vb-icon-btn" style={{ padding: 4 }} onClick={(e) => { e.stopPropagation(); generateSKUAction('variant', idx); }}><RefreshCw size={10} /></button>
                                                                </div>
                                                            </div>
                                                            <div data-label="MRP">
                                                                <input type='number' min='0' onWheel={(e) => e.target.blur()} onKeyDown={(e) => { if (e.key === "-" || e.key === "e" || e.key === "E") e.preventDefault(); }} className="vb-row-input" value={v.mrp} onChange={(e) => updateVariantRow(idx, 'mrp', e.target.value)} onClick={(e) => e.stopPropagation()} placeholder="0" />
                                                            </div>
                                                            <div data-label="Type">
                                                                <CustomSelect
                                                                    size="small"
                                                                    options={[
                                                                        { value: 'Percentage', label: '%' },
                                                                        { value: 'Fixed', label: 'RS' }
                                                                    ]}
                                                                    value={v.discountType}
                                                                    onChange={(val) => updateVariantRow(idx, 'discountType', val)}
                                                                />
                                                            </div>
                                                            <div data-label="Discount">
                                                                <input type='number' min='0' onWheel={(e) => e.target.blur()} onKeyDown={(e) => { if (e.key === "-" || e.key === "e" || e.key === "E") e.preventDefault(); }} className="vb-row-input" value={v.discountValue || 0} onChange={(e) => updateVariantRow(idx, 'discountValue', e.target.value)} onClick={(e) => e.stopPropagation()} placeholder="0" />
                                                            </div>
                                                            <div data-label="Selling Price">
                                                                <input type='number' min='0' onWheel={(e) => e.target.blur()} onKeyDown={(e) => { if (e.key === "-" || e.key === "e" || e.key === "E") e.preventDefault(); }} className="vb-row-input" style={{ color: 'hsl(var(--primary))', fontWeight: '700' }} value={v.price} onChange={(e) => updateVariantRow(idx, 'price', e.target.value)} onClick={(e) => e.stopPropagation()} placeholder="0" />
                                                            </div>
                                                            <div data-label="Final Price">
                                                                <input type='number' min='0' className="vb-row-input" style={{ color: 'hsl(var(--primary))', background: 'hsl(var(--primary)/0.05)', fontWeight: 800 }} value={v.finalSellingPrice} readOnly onClick={(e) => e.stopPropagation()} placeholder="0" />
                                                            </div>
                                                            <div data-label="Cost Price">
                                                                <input type='number' min='0' onWheel={(e) => e.target.blur()} onKeyDown={(e) => { if (e.key === "-" || e.key === "e" || e.key === "E") e.preventDefault(); }} className="vb-row-input" value={v.costPrice} onChange={(e) => updateVariantRow(idx, 'costPrice', e.target.value)} onClick={(e) => e.stopPropagation()} placeholder="0.00" />
                                                            </div>
                                                            <div data-label="Tax">
                                                                <CustomSelect
                                                                    size="small"
                                                                    options={[{ value: '', label: 'Exempt' }, ...masters.taxes.filter(t => t && t.name).map(tx => ({ value: tx._id, label: tx.name }))]}
                                                                    value={v.taxId}
                                                                    onChange={(val) => updateVariantRow(idx, 'taxId', val)}
                                                                />
                                                            </div>
                                                            <div data-label="Stock">
                                                                <input type='number' min='0' onWheel={(e) => e.target.blur()} onKeyDown={(e) => { if (e.key === "-" || e.key === "e" || e.key === "E") e.preventDefault(); }} className="vb-row-input" value={v.quantity} onChange={(e) => updateVariantRow(idx, 'quantity', e.target.value)} onClick={(e) => e.stopPropagation()} placeholder="0" />
                                                            </div>
                                                            <div data-label="Min. Stock">
                                                                <input type='number' min='0' onWheel={(e) => e.target.blur()} onKeyDown={(e) => { if (e.key === "-" || e.key === "e" || e.key === "E") e.preventDefault(); }} className="vb-row-input" value={v.minStock} onChange={(e) => updateVariantRow(idx, 'minStock', e.target.value)} onClick={(e) => e.stopPropagation()} placeholder="0" />
                                                            </div>
                                                            <div data-label="Edit">
                                                                <button className="vb-icon-btn" onClick={(e) => { e.stopPropagation(); setEditingVariantIndex(idx); setEditingVariantData({ ...v }); }}><Edit2 size={13} /></button>
                                                            </div>
                                                            <div data-label="Delete">
                                                                <button className="vb-delete-btn" onClick={(e) => { e.stopPropagation(); deleteVariantRow(idx); }}><Trash2 size={14} /></button>
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
                    {/* Ã¢â€â‚¬Ã¢â€â‚¬ Tab 3: Visuals Ã¢â€â‚¬Ã¢â€â‚¬ */}
                    {activeTab === 3 && (
                        <div className="animate-in fade-in">
                            <div className="product-grid">
                                <div className="product-field-group">
                                    <label className="product-label">Thumbnail Image *</label>
                                    <div className="image-upload-zone" style={{ height: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', border: '2px dashed hsl(var(--border)/0.3)', borderRadius: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                                        {previews.thumbnail ? (
                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'hsl(var(--secondary)/0.1)', position: 'relative' }}>
                                                <img src={previews.thumbnail} alt="Thumbnail" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                                <button style={{ position: 'absolute', top: 12, right: 12, padding: '8px 12px', background: 'hsl(var(--destructive))', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)', zIndex: 10, transition: 'all 0.2s' }}
                                                    onClick={() => { setImages(p => ({ ...p, thumbnail: null })); setPreviews(p => ({ ...p, thumbnail: '' })); }}
                                                    onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                                    onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                                                    <X size={14} strokeWidth={3} /> Remove
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <div style={{ width: 48, height: 48, background: 'hsl(var(--primary)/0.1)', color: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '0.75rem', marginBottom: '0.5rem' }}><Plus size={24} /></div>
                                                <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.4, letterSpacing: '0.1em' }}>Main Product Image</span>
                                                <input type="file" accept="image/*" style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} onChange={handleThumbnailChange} />
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="product-field-group">
                                    <label className="product-label">Gallery Images</label>
                                    <div className="image-upload-zone" style={{ height: 220, padding: '0.75rem', border: '2px dashed hsl(var(--border)/0.3)', borderRadius: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', overflowY: 'auto' }}>
                                        {previews.gallery.map((src, i) => (
                                            <div key={i} style={{ width: 80, height: 80, borderRadius: '0.75rem', overflow: 'hidden', position: 'relative', border: '1px solid hsl(var(--border)/0.2)' }}>
                                                <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                <button style={{ position: 'absolute', top: 4, right: 4, padding: '4px', background: 'hsl(var(--destructive))', color: 'white', border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', zIndex: 10 }} onClick={() => removeGalleryImage(i)}>
                                                    <X size={10} strokeWidth={3} />
                                                </button>
                                            </div>
                                        ))}
                                        <div style={{ width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'hsl(var(--primary)/0.05)', border: '1px solid hsl(var(--primary)/0.1)', borderRadius: '0.75rem', position: 'relative', cursor: 'pointer' }}>
                                            <Plus size={20} style={{ color: 'hsl(var(--primary)/0.4)' }} />
                                            <input type="file" multiple accept="image/*" style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} onChange={handleGalleryChange} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="action-footer" style={{ borderBottomLeftRadius: '20px', borderBottomRightRadius: '20px' }}>
                    <button className="btn-premium-outline" onClick={() => navigate(-1)}>Exit Studio</button>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        {activeTab > 1 && <button className="btn-premium-outline" onClick={() => setActiveTab(activeTab - 1)}>Ã¢â€ Â Previous</button>}
                        {activeTab < 3 ? (
                            <button className="btn-premium-primary" onClick={() => setActiveTab(activeTab + 1)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                Next <ChevronRight size={18} />
                            </button>
                        ) : (
                            <button className="btn-premium-primary" onClick={handleSubmit} disabled={isLoading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Save size={16} /> {isLoading ? 'Processing...' : 'Create Product'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {isLoading && <Loader />}

            <QuickCreateModal
                isOpen={isCatModalOpen}
                onClose={() => setIsCatModalOpen(false)}
                type="Category"
                masters={{ categories: masters.categories }}
                editItem={null}
                onSuccess={(created) => {
                    if (created?._id) {
                        setMasters(prev => ({ ...prev, categories: [...prev.categories, created] }));
                        setFormData(prev => ({ ...prev, categoryId: created._id, subCategoryId: '' }));
                    }
                    setIsCatModalOpen(false);
                }}
            />

            <QuickCreateModal
                isOpen={isSubCatModalOpen}
                onClose={() => setIsSubCatModalOpen(false)}
                type="Subcategory"
                masters={{ categories: masters.categories }}
                editItem={null}
                onSuccess={(created) => {
                    if (created?._id) {
                        setMasters(prev => {
                            const newAll = [...prev.allSubCategories, created];
                            const newFiltered = formData.categoryId
                                ? newAll.filter(s => (s.categoryId?._id || s.categoryId) === formData.categoryId)
                                : prev.subCategories;
                            return { ...prev, allSubCategories: newAll, subCategories: newFiltered };
                        });
                        setFormData(prev => ({ ...prev, subCategoryId: created._id }));
                    }
                    setIsSubCatModalOpen(false);
                }}
            />

            <QuickCreateModal
                isOpen={isBrandModalOpen}
                onClose={() => setIsBrandModalOpen(false)}
                type="Brand"
                masters={{}}
                editItem={null}
                onSuccess={(created) => {
                    if (created?._id) {
                        setMasters(prev => ({ ...prev, brands: [...prev.brands, created] }));
                        setFormData(prev => ({ ...prev, brandId: created._id }));
                    }
                    setIsBrandModalOpen(false);
                }}
            />

            <QuickCreateModal
                isOpen={isUnitModalOpen}
                onClose={() => setIsUnitModalOpen(false)}
                type="Unit"
                masters={{}}
                editItem={null}
                onSuccess={(created) => {
                    if (created?._id) {
                        setMasters(prev => ({ ...prev, units: [...prev.units, created] }));
                        setFormData(prev => ({ ...prev, unitId: created._id }));
                    }
                    setIsUnitModalOpen(false);
                }}
            />

            <QuickCreateModal
                isOpen={isTaxModalOpen}
                onClose={() => setIsTaxModalOpen(false)}
                type="Tax"
                masters={{}}
                editItem={null}
                onSuccess={(created) => {
                    if (created?._id) {
                        setMasters(prev => ({ ...prev, taxes: [...prev.taxes, created] }));
                        setFormData(prev => ({ ...prev, pricing: { ...prev.pricing, taxId: created._id } }));
                    }
                    setIsTaxModalOpen(false);
                }}
            />

            <QuickCreateModal
                isOpen={isAttrModalOpen}
                onClose={() => setIsAttrModalOpen(false)}
                type="Attribute"
                masters={{}}
                editItem={null}
                onSuccess={(created) => {
                    if (created?._id) {
                        setMasters(prev => ({ ...prev, variantAttributes: [...prev.variantAttributes, created] }));
                        // The user requested that we do NOT auto-select the new attribute automatically
                        // toggleAttribute(created._id); 
                    }
                    setIsAttrModalOpen(false);
                }}
            />

            <QuickCreateModal
                isOpen={isValueModalOpen}
                onClose={() => { setIsValueModalOpen(false); setActiveAttrForValue(null); }}
                type="Value"
                masters={{ variantTypeId: activeAttrForValue?._id, inputType: activeAttrForValue?.inputType }}
                editItem={null}
                onSuccess={(created, result) => {
                    const fullList = result?.variantValues || (created ? [created] : []);
                    if (activeAttrForValue) {
                        setMasters(prev => {
                            const updatedAttrs = prev.variantAttributes.map(a => {
                                if (a._id === activeAttrForValue._id) {
                                    return { ...a, values: fullList };
                                }
                                return a;
                            });
                            return { ...prev, variantAttributes: updatedAttrs };
                        });

                        // Also update the selectedAttributes state which drives the immediate UI rendering
                        setSelectedAttributes(prev => prev.map(a => {
                            if (a._id === activeAttrForValue._id) {
                                return { ...a, values: fullList };
                            }
                            return a;
                        }));

                        // Auto-toggle the newly created value if it was a single creation
                        if (created?._id) {
                            toggleValue(activeAttrForValue._id, created._id);
                        }
                    }
                    setIsValueModalOpen(false);
                }}
            />
            {
                editingVariantData && editingVariantIndex !== null && createPortal(
                    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={() => { setEditingVariantData(null); setEditingVariantIndex(null); }}>
                        <div className="quick-modal-container animate-in zoom-in" onClick={e => e.stopPropagation()} style={{ width: '650px', maxWidth: '95%', position: 'relative', margin: 0, maxHeight: '95vh', overflowY: 'auto' }}>
                            <div className="quick-modal-gradient-bar" />
                            <div className="quick-modal-content">
                                <div className="quick-modal-header">
                                    <div>
                                        <h3 className="quick-modal-title">
                                            <Zap size={20} style={{ color: 'hsl(var(--primary))' }} />
                                            Edit Variant Data
                                        </h3>
                                        <p className="quick-modal-subtitle">Update pricing and stock for this specific variant</p>
                                    </div>
                                    <button onClick={() => { setEditingVariantData(null); setEditingVariantIndex(null); }} className="quick-modal-close-btn" title="Close Modal">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="quick-modal-form" style={{ marginTop: '1.5rem' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                                        <div className="quick-modal-form-group">
                                            <label className="quick-modal-label">SKU</label>
                                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                <input type="text" className="quick-modal-input" name="sku" value={editingVariantData.sku} onChange={handleVariantEditChange} placeholder="AUTO" style={{ fontFamily: 'monospace', textTransform: 'uppercase' }} />
                                                <button className="btn-premium-outline" style={{ padding: '0 0.75rem' }} onClick={() => generateSKUAction('variant', editingVariantIndex)} title="Regenerate">
                                                    <RefreshCw size={13} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="quick-modal-form-group">
                                            <label className="quick-modal-label">Cost Price</label>
                                            <input type="number" min="0" onWheel={(e) => e.target.blur()} className="quick-modal-input" name="costPrice" value={editingVariantData.costPrice} onChange={handleVariantEditChange} placeholder="0.00" />
                                        </div>

                                        <div className="quick-modal-form-group">
                                            <label className="quick-modal-label">MRP</label>
                                            <input type="number" min="0" onWheel={(e) => e.target.blur()} className="quick-modal-input" name="mrp" value={editingVariantData.mrp} onChange={handleVariantEditChange} placeholder="0.00" />
                                        </div>
                                        <div className="quick-modal-form-group">
                                            <label className="quick-modal-label">Selling Price</label>
                                            <input type="number" min="0" onWheel={(e) => e.target.blur()} className="quick-modal-input" name="price" value={editingVariantData.price} onChange={handleVariantEditChange} placeholder="0.00" />
                                        </div>

                                        <div className="quick-modal-form-group" style={{ gridColumn: '1 / -1' }}>
                                            <label className="quick-modal-label">Discount Configuration</label>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.5rem' }}>
                                                <CustomSelect
                                                    options={[{ value: 'Percentage', label: 'Percentage (%)' }, { value: 'Fixed', label: 'Fixed Amount (Ã¢â€šÂ¹)' }]}
                                                    value={editingVariantData.discountType}
                                                    onChange={(val) => handleVariantEditChange({ target: { name: 'discountType', value: val } })}
                                                    placeholder="Type"
                                                />
                                                <input type="number" min="0" onWheel={(e) => e.target.blur()} className="quick-modal-input" name="discountValue" value={editingVariantData.discountValue} onChange={handleVariantEditChange} placeholder="0" />
                                            </div>
                                        </div>

                                        <div className="quick-modal-form-group" style={{ gridColumn: '1 / -1' }}>
                                            <label className="quick-modal-label" style={{ color: 'hsl(var(--primary))' }}>Final Selling Price</label>
                                            <input type="number" min="0" onWheel={(e) => e.target.blur()} className="quick-modal-input" style={{ fontWeight: 800, fontSize: '1.2rem', background: 'hsl(var(--primary)/0.05)', borderColor: 'hsl(var(--primary)/0.3)', color: 'hsl(var(--primary))', height: '3rem' }} name="finalSellingPrice" value={editingVariantData.finalSellingPrice} onChange={handleVariantEditChange} placeholder="0.00" />
                                        </div>

                                        <div className="quick-modal-form-group">
                                            <label className="quick-modal-label">Stock Quantity</label>
                                            <input type="number" min="0" onWheel={(e) => e.target.blur()} className="quick-modal-input" name="quantity" value={editingVariantData.quantity} onChange={handleVariantEditChange} placeholder="0" />
                                        </div>
                                        <div className="quick-modal-form-group">
                                            <label className="quick-modal-label">Min Stock Level</label>
                                            <input type="number" min="0" onWheel={(e) => e.target.blur()} className="quick-modal-input" name="minStock" value={editingVariantData.minStock} onChange={handleVariantEditChange} placeholder="0" />
                                        </div>

                                        <div className="quick-modal-form-group" style={{ gridColumn: '1 / -1' }}>
                                            <label className="quick-modal-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span>Tax Configuration</span>
                                                <button type="button" className="add-new-chip-btn" onClick={() => setIsTaxModalOpen(true)}>
                                                    <span className="add-new-chip-icon"><Plus size={10} strokeWidth={3.5} /></span>
                                                    Add New
                                                </button>
                                            </label>
                                            <CustomSelect
                                                direction="up"
                                                options={[{ value: '', label: 'No Tax' }, ...masters.taxes.filter(t => t && t.name).map(t => ({ value: t._id, label: `${t.name} (${t.rate || 0}%)` }))]}
                                                value={editingVariantData.taxId}
                                                onChange={(val) => handleVariantEditChange({ target: { name: 'taxId', value: val } })}
                                                placeholder="Select Tax"
                                            />
                                        </div>
                                    </div>

                                    <div className="quick-modal-form-actions" style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid hsl(var(--border)/0.2)' }}>
                                        <button type="button" className="quick-modal-submit-btn" style={{ width: '100%' }} onClick={handleSaveVariantRow}>
                                            Save Variant Data
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>, document.body
                )
            }</div>
    );
};

export default AddProduct;
