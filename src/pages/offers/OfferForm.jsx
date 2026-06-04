import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
    Tag, 
    ArrowLeft, 
    Save, 
    Info, 
    Calendar, 
    CheckCircle2, 
    AlertCircle,
    Percent,
    Banknote,
    Gift,
    Truck,
    Layers,
    X,
    LayoutGrid,
    Package,
    Plus,
    ChevronRight,
    Search
} from 'lucide-react';
import offerService from '../../services/offerService';
import productService from '../../services/productService';
import { toast } from 'react-hot-toast';
import Loader from '../../components/Loader';
import CustomSelect from '../../components/CustomSelect';
import CustomDatePicker from '../../components/CustomDatePicker';

// Importing existing styles
import '../products/Product.css';
import '../offers/Offer.css';

const OfferForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = !!id;

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(isEdit);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [productVariantsMap, setProductVariantsMap] = useState({}); // { productId: [variants] }

    const [formData, setFormData] = useState({
        title: '',
        code: '',
        type: 'OFFER',
        discountType: 'PERCENTAGE',
        discountValue: 0,
        freeProductId: '',
        freeProductVariantId: '',
        applicableType: 'ALL',
        productIds: [],
        categoryIds: [],
        variantIds: [],
        minOrderAmount: 0,
        maxDiscount: '',
        usageLimit: 0,
        perUserLimit: 1,
        validFrom: new Date().toISOString().split('T')[0],
        validTo: '',
        isFirstOrderOnly: false,
        isActive: true
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        const loadMasterData = async () => {
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
                
                setProducts(productList);
                setCategories(categoryList);
            } catch (error) {
                console.error('Error loading master data:', error);
            }
        };

        const loadOffer = async () => {
            try {
                const response = await offerService.getOfferById(id);
                if (response.success) {
                    const offer = response.data;
                    setFormData({
                        ...offer,
                        validFrom: new Date(offer.validFrom).toISOString().split('T')[0],
                        validTo: new Date(offer.validTo).toISOString().split('T')[0],
                        productIds: offer.productIds?.map(p => p._id) || [],
                        categoryIds: offer.categoryIds?.map(c => c._id) || [],
                        variantIds: offer.variantIds?.map(v => v._id) || [],
                        freeProductId: offer.freeProductId?._id || '',
                        freeProductVariantId: offer.freeProductVariantId?._id || ''
                    });

                    // Fetch variants for existing selected products if any
                    if (offer.productIds?.length > 0) {
                        offer.productIds.forEach(p => {
                            if (p.productType === 'Variant') fetchProductVariants(p._id);
                        });
                    }
                    if (offer.freeProductId?._id && offer.freeProductId.productType === 'Variant') {
                        fetchProductVariants(offer.freeProductId._id);
                    }
                }
            } catch (error) {
                toast.error('Failed to load offer details');
                navigate('/offers-list');
            } finally {
                setFetching(false);
            }
        };

        loadMasterData();
        if (isEdit) loadOffer();
    }, [id, isEdit, navigate]);

    const fetchProductVariants = async (productId) => {
        if (productVariantsMap[productId]) return;
        try {
            const res = await productService.getProductById(productId);
            if (res.success && res.product?.variants) {
                setProductVariantsMap(prev => ({
                    ...prev,
                    [productId]: res.product.variants
                }));
            }
        } catch (error) {
            console.error('Error fetching variants:', error);
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.title) newErrors.title = 'Title is required';
        if (formData.type === 'OFFER' && !formData.code) newErrors.code = 'Offer code is required';
        
        if (formData.discountType === 'PERCENTAGE') {
            if (formData.discountValue <= 0 || formData.discountValue > 100) {
                newErrors.discountValue = 'Percentage must be between 1 and 100';
            }
        } else if (formData.discountType === 'FLAT') {
            if (formData.discountValue <= 0) newErrors.discountValue = 'Discount value must be greater than 0';
        } else if (formData.discountType === 'FREE_PRODUCT') {
            if (!formData.freeProductId) newErrors.freeProductId = 'Please select a free product';
            const product = products.find(p => p._id === formData.freeProductId);
            // ONLY require variant if the product ACTUALLY has variants in map
            const variants = productVariantsMap[formData.freeProductId] || [];
            if (product?.productType === 'Variant' && variants.length > 0 && !formData.freeProductVariantId) {
                newErrors.freeProductVariantId = 'Please select a specific variant';
            }
        }

        if (!formData.validTo) {
            newErrors.validTo = 'Expiry date is required';
        } else if (new Date(formData.validTo) <= new Date(formData.validFrom)) {
            newErrors.validTo = 'Expiry date must be after start date';
        }

        if (formData.applicableType === 'PRODUCT' && formData.productIds.length === 0) {
            newErrors.productIds = 'Please select at least one product';
        }
        if (formData.applicableType === 'CATEGORY' && formData.categoryIds.length === 0) {
            newErrors.categoryIds = 'Please select at least one category';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!validate()) {
            toast.error('Please fix the errors in the form');
            return;
        }

        setLoading(true);
        try {
            const data = { ...formData };
            if (data.type === 'AUTO') delete data.code;
            
            // Clean up empty strings for optional ObjectId fields to avoid CastError in backend
            if (!data.freeProductId) delete data.freeProductId;
            if (!data.freeProductVariantId) delete data.freeProductVariantId;
            if (data.maxDiscount === '') delete data.maxDiscount;

            // Ensure numeric values are numbers
            data.discountValue = Number(data.discountValue);
            data.minOrderAmount = Number(data.minOrderAmount);
            if (data.maxDiscount) data.maxDiscount = Number(data.maxDiscount);
            data.usageLimit = Number(data.usageLimit);
            data.perUserLimit = Number(data.perUserLimit);
            
            let response;
            if (isEdit) {
                response = await offerService.updateOffer(id, data);
            } else {
                response = await offerService.createOffer(data);
            }

            if (response.success) {
                toast.success(response.message || 'Offer saved successfully!');
                navigate('/offers-list');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save offer');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const val = type === 'checkbox' ? checked : value;
        setFormData(prev => ({ ...prev, [name]: val }));
        
        // Dynamic resets
        if (name === 'type' && val === 'AUTO') setFormData(p => ({ ...p, code: '' }));
        if (name === 'discountType') setFormData(p => ({ ...p, discountValue: 0, maxDiscount: '', freeProductId: '', freeProductVariantId: '' }));
        if (name === 'applicableType') setFormData(p => ({ ...p, productIds: [], categoryIds: [], variantIds: [] }));

        if (name === 'freeProductId') {
            const product = products.find(p => p._id === value);
            if (product?.productType === 'Variant') fetchProductVariants(value);
            setFormData(p => ({ ...p, freeProductVariantId: '' }));
        }

        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    const handleProductSelect = (productId, isVariantProduct) => {
        setFormData(prev => {
            const current = [...prev.productIds];
            let next;
            if (current.includes(productId)) {
                next = current.filter(id => id !== productId);
                if (isVariantProduct) {
                    const variantsToRemove = productVariantsMap[productId]?.map(v => v._id) || [];
                    setFormData(p => ({
                        ...p,
                        productIds: next,
                        variantIds: p.variantIds.filter(vid => !variantsToRemove.includes(vid))
                    }));
                    return { ...prev, productIds: next };
                }
            } else {
                next = [...current, productId];
                if (isVariantProduct) fetchProductVariants(productId);
            }
            return { ...prev, productIds: next };
        });
    };

    const handleVariantSelect = (variantId) => {
        setFormData(prev => {
            const current = [...prev.variantIds];
            if (current.includes(variantId)) {
                return { ...prev, variantIds: current.filter(id => id !== variantId) };
            } else {
                return { ...prev, variantIds: [...current, variantId] };
            }
        });
    };

    const handleCategorySelect = (categoryId) => {
        setFormData(prev => {
            const current = [...prev.categoryIds];
            if (current.includes(categoryId)) {
                return { ...prev, categoryIds: current.filter(id => id !== categoryId) };
            } else {
                return { ...prev, categoryIds: [...current, categoryId] };
            }
        });
    };

    if (fetching) return <Loader />;

    return (
        <div className="product-page-container fade-in">
            <div className="product-content-pane">
                <header className="product-header">
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                            <button className="product-btn-icon" onClick={() => navigate('/offers-list')} title="Back to list">
                                <ArrowLeft size={18} />
                            </button>
                            <h1 style={{ fontSize: '1.5rem', fontWeight: 900 }}>{isEdit ? 'Update Offer' : 'Create Offer'}</h1>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))', marginLeft: '2.5rem' }}>
                            Configure promotion rules, discounts and validity.
                        </p>
                    </div>
                    <div className="header-actions">
                        <button type="button" className="secondary-button" onClick={() => navigate('/offers-list')}>Cancel</button>
                        <button type="button" className="primary-button" onClick={handleSubmit} disabled={loading}>
                            <Save size={18} /> {loading ? 'Saving...' : (isEdit ? 'Update Offer' : 'Save Offer')}
                        </button>
                    </div>
                </header>

                <div className="product-glass-card" style={{ marginTop: '1.5rem' }}>
                    <form onSubmit={handleSubmit}>
                        
                        {/* 1. BASIC INFO */}
                        <div style={{ marginBottom: '2rem' }}>
                            <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid hsl(var(--border)/0.2)', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Info size={18} className="text-primary" />
                                <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'hsl(var(--foreground))', margin: 0 }}>Basic Information</h3>
                            </div>
                            
                            <div className="product-grid">
                                <div className="product-field-group" style={{ gridColumn: '1 / -1' }}>
                                    <label className="product-label">Offer Title *</label>
                                    <input name="title" className="product-input" style={{ fontSize: '1.05rem', fontWeight: 700 }} placeholder="e.g. Summer Festival Special" value={formData.title} onChange={handleChange} />
                                    {errors.title && <span className="error-message" style={{ color: 'hsl(var(--destructive))', fontSize: '0.75rem', marginTop: '4px' }}>{errors.title}</span>}
                                </div>
                                <div className="product-field-group">
                                    <label className="product-label">Offer Type</label>
                                    <CustomSelect options={[{ value: 'OFFER', label: 'Manual Offer Code' }, { value: 'AUTO', label: 'Auto Apply' }]} value={formData.type} onChange={(val) => handleChange({ target: { name: 'type', value: val } })} />
                                </div>
                                {formData.type === 'OFFER' && (
                                    <div className="product-field-group animate-in">
                                        <label className="product-label">Offer Code *</label>
                                        <input name="code" className="product-input font-mono" style={{ textTransform: 'uppercase', fontWeight: 800 }} placeholder="e.g. SAVE50" value={formData.code} onChange={handleChange} />
                                        {errors.code && <span className="error-message" style={{ color: 'hsl(var(--destructive))', fontSize: '0.75rem', marginTop: '4px' }}>{errors.code}</span>}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 2. DISCOUNT CONFIG */}
                        <div style={{ marginBottom: '2rem' }}>
                            <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid hsl(var(--border)/0.2)', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Percent size={18} className="text-primary" />
                                <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'hsl(var(--foreground))', margin: 0 }}>Discount Configuration</h3>
                            </div>

                            <div className="product-grid">
                                <div className="product-field-group" style={{ gridColumn: '1 / -1' }}>
                                    <label className="product-label">Discount Method</label>
                                    <div className="type-selection-wrapper" style={{ justifyContent: 'flex-start', gap: '1rem' }}>
                                        {[
                                            { id: 'PERCENTAGE', label: 'Percentage', icon: Percent },
                                            { id: 'FLAT', label: 'Flat Amount', icon: Banknote },
                                            { id: 'FREE_PRODUCT', label: 'Free Product', icon: Gift },
                                            { id: 'FREE_DELIVERY', label: 'Free Delivery', icon: Truck },
                                        ].map((method) => (
                                            <label key={method.id} className={`type-selection-card ${formData.discountType === method.id ? 'active' : ''}`} style={{ flex: 1, minWidth: '120px' }}>
                                                <input type="radio" name="discountType" value={method.id} checked={formData.discountType === method.id} onChange={handleChange} style={{ display: 'none' }} />
                                                <div className="type-selection-icon"><method.icon size={14} strokeWidth={2.5} /></div>
                                                <div className="type-selection-title" style={{ fontSize: '0.7rem' }}>{method.label}</div>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {formData.discountType === 'PERCENTAGE' && (
                                    <>
                                        <div className="product-field-group animate-in">
                                            <label className="product-label">Discount Percentage (%)</label>
                                            <input type="number" name="discountValue" className="product-input" value={formData.discountValue} onChange={handleChange} />
                                            {errors.discountValue && <span className="error-message" style={{ color: 'hsl(var(--destructive))', fontSize: '0.75rem', marginTop: '4px' }}>{errors.discountValue}</span>}
                                        </div>
                                        <div className="product-field-group animate-in">
                                            <label className="product-label">Max Discount Cap (&#8377;)</label>
                                            <input type="number" name="maxDiscount" className="product-input" placeholder="No Limit" value={formData.maxDiscount} onChange={handleChange} />
                                        </div>
                                    </>
                                )}

                                {formData.discountType === 'FLAT' && (
                                    <div className="product-field-group animate-in">
                                        <label className="product-label">Discount Amount (&#8377;)</label>
                                        <input type="number" name="discountValue" className="product-input" value={formData.discountValue} onChange={handleChange} />
                                        {errors.discountValue && <span className="error-message" style={{ color: 'hsl(var(--destructive))', fontSize: '0.75rem', marginTop: '4px' }}>{errors.discountValue}</span>}
                                    </div>
                                )}

                                {formData.discountType === 'FREE_PRODUCT' && (
                                    <>
                                        <div className="product-field-group animate-in">
                                            <label className="product-label">Select Free Product</label>
                                            <CustomSelect 
                                                options={[{ value: '', label: '-- Choose Product --' }, ...products.map(p => ({ value: p._id, label: p.name }))]}
                                                value={formData.freeProductId}
                                                onChange={(val) => handleChange({ target: { name: 'freeProductId', value: val } })}
                                            />
                                            {errors.freeProductId && <span className="error-message" style={{ color: 'hsl(var(--destructive))', fontSize: '0.75rem', marginTop: '4px' }}>{errors.freeProductId}</span>}
                                        </div>
                                        
                                        {/* FREE PRODUCT VARIANT SELECTOR - ONLY SHOW IF PRODUCT HAS VARIANTS IN THE MAP */}
                                        {formData.freeProductId && productVariantsMap[formData.freeProductId]?.length > 0 && (
                                            <div className="product-field-group animate-in">
                                                <label className="product-label">Select Specific Variant</label>
                                                <CustomSelect 
                                                    options={[
                                                        { value: '', label: '-- Choose Variant --' }, 
                                                        ...(productVariantsMap[formData.freeProductId] || []).map(v => ({ 
                                                            value: v._id, 
                                                            label: v.attributes?.map(a => a.valueId?.name || '').join(' ') || v.sku || 'Variant' 
                                                        }))
                                                    ]}
                                                    value={formData.freeProductVariantId}
                                                    onChange={(val) => handleChange({ target: { name: 'freeProductVariantId', value: val } })}
                                                />
                                                {errors.freeProductVariantId && <span className="error-message" style={{ color: 'hsl(var(--destructive))', fontSize: '0.75rem', marginTop: '4px' }}>{errors.freeProductVariantId}</span>}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* 3. APPLICABILITY */}
                        <div style={{ marginBottom: '2rem' }}>
                            <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid hsl(var(--border)/0.2)', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Layers size={18} className="text-primary" />
                                <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'hsl(var(--foreground))', margin: 0 }}>Applicability Scope</h3>
                            </div>

                            <div className="product-grid">
                                <div className="product-field-group" style={{ gridColumn: '1 / -1' }}>
                                    <label className="product-label">Apply Offer On</label>
                                    <CustomSelect options={[{ value: 'ALL', label: 'Entire Cart / All Products' }, { value: 'PRODUCT', label: 'Specific Products Only' }, { value: 'CATEGORY', label: 'Specific Categories Only' }]} value={formData.applicableType} onChange={(val) => handleChange({ target: { name: 'applicableType', value: val } })} />
                                </div>

                                {formData.applicableType === 'PRODUCT' && (
                                    <div className="product-field-group animate-in" style={{ gridColumn: '1 / -1' }}>
                                        <label className="product-label">Select Products ({formData.productIds.length} products, {formData.variantIds.length} variants selected)</label>
                                        <div className="attr-values-panel" style={{ padding: '1rem', maxHeight: '400px', overflowY: 'auto' }}>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                                                {products.map(p => {
                                                    const isSelected = formData.productIds.includes(p._id);
                                                    const variants = productVariantsMap[p._id] || [];
                                                    const hasVariants = variants.length > 0;
                                                    const selectedInProduct = variants.filter(v => formData.variantIds.includes(v._id)).length;

                                                    return (
                                                        <div key={p._id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '200px', padding: '0.5rem', border: '1px solid hsl(var(--border)/0.2)', borderRadius: '8px', background: isSelected ? 'hsl(var(--primary)/0.03)' : 'transparent', transition: 'all 0.2s ease' }}>
                                                            <button type="button" onClick={() => handleProductSelect(p._id, hasVariants)} className={`attr-value-chip ${isSelected ? 'selected' : ''}`} style={{ width: '100%', justifyContent: 'space-between' }}>
                                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>{hasVariants ? <Layers size={12} className="text-muted-foreground" /> : <Package size={12} className="text-muted-foreground" />}{p.name}</span>
                                                                {isSelected && <CheckCircle2 size={12} />}
                                                            </button>
                                                            
                                                            {/* VARIANT BOX - ONLY SHOW IF PRODUCT IS SELECTED AND ACTUALLY HAS VARIANTS IN THE MAP */}
                                                            {isSelected && hasVariants && (
                                                                <div className="animate-in" style={{ paddingLeft: '0.5rem', borderLeft: '2px solid hsl(var(--primary)/0.2)', marginTop: '0.25rem', background: 'hsl(var(--primary)/0.02)', padding: '0.5rem', borderRadius: '4px' }}>
                                                                    <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'hsl(var(--muted-foreground))', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Select Variants ({selectedInProduct}/{variants.length})</p>
                                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                                                                        {variants.map(v => {
                                                                            const isVarSelected = formData.variantIds.includes(v._id);
                                                                            const varName = v.attributes?.map(a => a.valueId?.name || '').join(' ') || v.sku || 'Variant';
                                                                            return (
                                                                                <button key={v._id} type="button" onClick={() => handleVariantSelect(v._id)} className={`attr-value-chip ${isVarSelected ? 'selected' : ''}`} style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem' }}>
                                                                                    {varName}{isVarSelected && <CheckCircle2 size={10} />}
                                                                                </button>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                        {errors.productIds && <span className="error-message" style={{ color: 'hsl(var(--destructive))', fontSize: '0.75rem', marginTop: '4px' }}>{errors.productIds}</span>}
                                    </div>
                                )}

                                {formData.applicableType === 'CATEGORY' && (
                                    <div className="product-field-group animate-in" style={{ gridColumn: '1 / -1' }}>
                                        <label className="product-label">Select Categories ({formData.categoryIds.length} selected)</label>
                                        <div className="attr-values-panel" style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                {categories.map(c => {
                                                    const isSelected = formData.categoryIds.includes(c._id);
                                                    return (
                                                        <button key={c._id} type="button" onClick={() => handleCategorySelect(c._id)} className={`attr-value-chip ${isSelected ? 'selected' : ''}`}>{c.name}{isSelected && <CheckCircle2 size={12} />}</button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 4. LIMITS & CONDITIONS */}
                        <div className="product-grid" style={{ marginBottom: '2rem' }}>
                            <div style={{ gridColumn: '1' }}>
                                <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid hsl(var(--border)/0.2)', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <AlertCircle size={18} className="text-primary" />
                                    <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'hsl(var(--foreground))', margin: 0 }}>Conditions</h3>
                                </div>
                                <div className="product-field-group">
                                    <label className="product-label">Min. Order Amount (&#8377;)</label>
                                    <input type="number" name="minOrderAmount" className="product-input" value={formData.minOrderAmount} onChange={handleChange} />
                                </div>
                                <div className="product-field-group" style={{ marginTop: '1rem' }}>
                                    <div className="luxury-toggle-container" onClick={() => handleChange({ target: { name: 'isFirstOrderOnly', type: 'checkbox', checked: !formData.isFirstOrderOnly } })}>
                                        <div className="luxury-toggle-info">
                                            <span className="luxury-toggle-label">First Order Only</span>
                                            <span className="luxury-toggle-sub">New customers only</span>
                                        </div>
                                        <div className={`luxury-switch ${formData.isFirstOrderOnly ? 'active' : ''}`}><div className="luxury-knob" /></div>
                                    </div>
                                </div>
                            </div>
                            <div style={{ gridColumn: '2' }}>
                                <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid hsl(var(--border)/0.2)', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Save size={18} className="text-primary" />
                                    <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'hsl(var(--foreground))', margin: 0 }}>Usage Limits</h3>
                                </div>
                                <div className="product-field-group">
                                    <label className="product-label">Total Usage Limit</label>
                                    <input type="number" name="usageLimit" className="product-input" placeholder="0 for unlimited" value={formData.usageLimit} onChange={handleChange} />
                                </div>
                                <div className="product-field-group" style={{ marginTop: '1rem' }}>
                                    <label className="product-label">Per User Limit</label>
                                    <input type="number" name="perUserLimit" className="product-input" value={formData.perUserLimit} onChange={handleChange} />
                                </div>
                            </div>
                        </div>

                        {/* 5. VALIDITY & STATUS */}
                        <div style={{ marginBottom: '2rem' }}>
                            <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid hsl(var(--border)/0.2)', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Calendar size={18} className="text-primary" />
                                <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'hsl(var(--foreground))', margin: 0 }}>Validity & Status</h3>
                            </div>
                            <div className="product-grid">
                                <div className="product-field-group"><CustomDatePicker label="Start Date" value={formData.validFrom} onChange={(val) => handleChange({ target: { name: 'validFrom', value: val } })} /></div>
                                <div className="product-field-group"><CustomDatePicker label="Expiry Date" value={formData.validTo} onChange={(val) => handleChange({ target: { name: 'validTo', value: val } })} />{errors.validTo && <span className="error-message" style={{ color: 'hsl(var(--destructive))', fontSize: '0.75rem', marginTop: '4px' }}>{errors.validTo}</span>}</div>
                                <div className="product-field-group" style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
                                    <div className="luxury-toggle-container" onClick={() => handleChange({ target: { name: 'isActive', type: 'checkbox', checked: !formData.isActive } })}>
                                        <div className="luxury-toggle-info"><span className="luxury-toggle-label">Offer Status</span><span className="luxury-toggle-sub">Should this offer be active and usable?</span></div>
                                        <div className={`luxury-switch ${formData.isActive ? 'active' : ''}`}><div className="luxury-knob" /></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default OfferForm;
