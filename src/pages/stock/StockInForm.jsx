import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Save, X, Package, Box, ArrowLeft,
    DollarSign, Tag, Percent, Layers,
    Landmark, ShieldCheck, Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';
import productService from '../../services/productService';
import stockService from '../../services/stockService';
import Loader from '../../components/Loader';
import CustomSelect from '../../components/CustomSelect';
import { BASE_IMAGE_URL } from '../../config/env';
import './Stock.css';

const StockInForm = () => {
    const { productId: pId, batchId } = useParams();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);

    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [variants, setVariants] = useState([]);
    const [taxes, setTaxes] = useState([]);

    const [formData, setFormData] = useState({
        productId: pId || '',
        variantId: '',
        batchNo: '',
        quantity: '',
        mrp: '',
        sellingPrice: '',
        finalSellingPrice: '',
        costPrice: '',
        discountType: 'Fixed',
        discountValue: 0,
        taxId: '',
        status: true
    });

    useEffect(() => {
        const initializeForm = async () => {
            await Promise.all([fetchProducts(), fetchTaxes()]);
            if (batchId) {
                setIsEditMode(true);
                await fetchBatchDetails(batchId);
            } else if (pId) {
                handleProductChange(pId);
            }
        };
        initializeForm();
    }, [pId, batchId]);

    // Recalculate Final Selling Price whenever SP, Discount, or Tax changes
    useEffect(() => {
        calculateFinalPrice();
    }, [formData.sellingPrice, formData.discountType, formData.discountValue, formData.taxId]);

    const fetchProducts = async () => {
        try {
            const data = await productService.getProducts({ limit: 1000 });
            setProducts(data.products || []);
        } catch (error) {
            console.error('Failed to load products');
        }
    };

    const fetchTaxes = async () => {
        try {
            const response = await productService.getTaxes();
            if (response.success) {
                setTaxes(response.taxes || []);
            }
        } catch (error) {
            console.error('Failed to load taxes');
        }
    };

    const calculateFinalPrice = () => {
        const sp = Number(formData.sellingPrice) || 0;
        const discVal = Number(formData.discountValue) || 0;
        
        // Removed taxRate addition here - price is now exclusive of GST
        // const selectedTax = taxes.find(t => t._id === formData.taxId);
        // const taxRate = selectedTax ? Number(selectedTax.rate) : 0;

        let afterDiscount = sp;
        if (formData.discountType === 'Percentage') {
            afterDiscount = sp - (sp * (discVal / 100));
        } else {
            afterDiscount = sp - discVal;
        }

        // Final price is now simply the discounted base price, rounded to integer
        const final = Math.round(afterDiscount); 
        setFormData(prev => ({ ...prev, finalSellingPrice: final.toString() }));
    };

    const fetchBatchDetails = async (id) => {
        setIsLoading(true);
        try {
            const response = await stockService.getStockInById(id);
            const batch = response.data || response;

            // Set Form Data
            setFormData({
                productId: batch.productId?._id || batch.productId || '',
                variantId: batch.variantId?._id || batch.variantId || '',
                batchNo: batch.batchNo || '',
                quantity: batch.quantity || '',
                mrp: batch.pricing?.mrp || '',
                sellingPrice: batch.pricing?.sellingPrice || '',
                finalSellingPrice: batch.pricing?.finalSellingPrice || '',
                costPrice: batch.pricing?.costPrice || '',
                discountType: batch.pricing?.discountType || 'Fixed',
                discountValue: batch.pricing?.discountValue || 0,
                taxId: batch.pricing?.taxId?._id || batch.pricing?.taxId || '',
                status: batch.status ?? true
            });

            // Load associated product and variants
            if (batch.productId) {
                const prodResponse = await productService.getProductById(batch.productId?._id || batch.productId);
                const product = prodResponse.product || prodResponse;
                setSelectedProduct(product);
                setVariants(product.variants || []);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to load batch details');
            navigate('/stock');
        } finally {
            setIsLoading(false);
        }
    };

    const handleProductChange = async (val) => {
        setFormData(prev => ({ ...prev, productId: val, variantId: '' }));
        if (!val) {
            setSelectedProduct(null);
            setVariants([]);
            return;
        }

        setIsLoading(true);
        try {
            const response = await productService.getProductById(val);
            const product = response.product || response;

            setSelectedProduct(product);
            setVariants(product.variants || []);

            if (product.productType === 'Single' && product.pricing) {
                setFormData(prev => ({
                    ...prev,
                    mrp: product.pricing.mrp || '',
                    sellingPrice: product.pricing.sellingPrice || '',
                    costPrice: product.pricing.costPrice || '',
                    discountType: product.pricing.discountType || 'Fixed',
                    discountValue: product.pricing.discountValue || 0,
                    taxId: product.pricing.taxId?._id || product.pricing.taxId || ''
                }));
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to load product details');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVariantChange = (val) => {
        const variant = variants.find(v => v._id === val);
        setFormData(prev => ({
            ...prev,
            variantId: val,
            mrp: variant?.pricing?.mrp || '',
            sellingPrice: variant?.pricing?.sellingPrice || '',
            costPrice: variant?.pricing?.costPrice || '',
            discountType: variant?.pricing?.discountType || 'Fixed',
            discountValue: variant?.pricing?.discountValue || 0,
            taxId: variant?.pricing?.taxId?._id || variant?.pricing?.taxId || ''
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.productId) return toast.error('Please select a product');
        
        // Final protection: if product is Single, variantId MUST be null
        const isSingle = selectedProduct?.productType === 'Single';
        
        if (selectedProduct?.productType === 'Variant' && !formData.variantId) {
            return toast.error('Please select a variant for this product');
        }
        if (!formData.quantity || formData.quantity <= 0) return toast.error('Please enter valid quantity');

        setIsSaving(true);
        try {
            const payload = {
                ...formData,
                productId: formData.productId,
                variantId: isSingle ? null : formData.variantId, // Explicitly enforce null for Single
                quantity: Number(formData.quantity),
                pricing: {
                    mrp: Number(formData.mrp),
                    sellingPrice: Number(formData.sellingPrice),
                    finalSellingPrice: Number(formData.finalSellingPrice),
                    costPrice: Number(formData.costPrice),
                    discountType: formData.discountType,
                    discountValue: Number(formData.discountValue),
                    taxId: formData.taxId
                }
            };

            if (isEditMode) {
                await stockService.updateStockIn(batchId, payload);
                toast.success('Batch updated successfully!');
            } else {
                await stockService.addStockIn(payload);
                toast.success('Stock added successfully!');
            }
            navigate('/stock');
        } catch (error) {
            console.error('Submission error:', error);
            const errorMessage = error.response?.data?.message || error.message || `Failed to ${isEditMode ? 'update' : 'add'} stock`;
            toast.error(errorMessage);
        } finally {
            setIsSaving(false);
        }
    };

    const productOptions = products.map(p => ({
        value: p._id,
        label: p.name
    }));

    const variantOptions = variants.map(v => ({
        value: v._id,
        label: v.attributes?.map(attr => attr.valueName || attr.valueId?.name || attr.valueId?.value).join(' / ') || `SKU: ${v.sku}`
    }));

    const taxOptions = taxes.map(t => ({
        value: t._id,
        label: `${t.name} (${t.rate}%)`
    }));

    if (isLoading) return <Loader />;

    return (
        <div className="stock-page-container fade-in">
            <div className="stock-content-pane">
                <header className="stock-header-section">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <button onClick={() => navigate('/stock')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: 'hsl(var(--foreground))' }}>
                            <ArrowLeft size={18} />
                        </button>
                        <span style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'hsl(var(--primary))' }}>
                            Masters / Inventory {isEditMode ? 'Management' : 'Check-In'}
                        </span>
                    </div>
                    <h1 className="stock-header-title">
                        {isEditMode ? `Editing Batch: ${formData.batchNo}` : (selectedProduct ? `Stock for ${selectedProduct.name}` : 'Create New Stock Batch')}
                    </h1>
                    <p className="stock-header-sub">
                        {isEditMode ? 'Update existing batch parameters and pricing signals.' : 'Record incoming stock batches and update pricing signals for the mobile application.'}
                    </p>
                </header>

                <div className="stock-glass-card">
                    <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid hsl(var(--border)/0.2)', paddingBottom: '1rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'hsl(var(--primary))', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Batch Configuration
                        </h3>
                    </div>

                    <form onSubmit={handleSubmit} className="stock-grid">
                        {/* Product Selection - Disabled in Edit Mode */}
                        <div className="stock-field-group">
                            <CustomSelect
                                label={<span><Box size={14} style={{ marginRight: '6px' }} /> Search Product</span>}
                                options={productOptions}
                                value={formData.productId}
                                onChange={handleProductChange}
                                placeholder="-- Select or Search for Product --"
                                disabled={isEditMode}
                            />
                        </div>

                        {/* Variant Selector — only shown when product is explicitly 'Variant' type */}
                        {selectedProduct && selectedProduct.productType === 'Variant' && (
                        <div className="stock-field-group">
                            <CustomSelect
                                label={<span><Layers size={14} style={{ marginRight: '6px' }} /> Select Variant</span>}
                                options={variantOptions}
                                value={formData.variantId}
                                onChange={handleVariantChange}
                                placeholder={variants.length > 0 ? "-- Choose Variant --" : "No variants found"}
                                disabled={isEditMode || variants.length === 0}
                            />
                        </div>
                        )}

                        {/* Batch Number */}
                        <div className="stock-field-group">
                            <label className="stock-label"><Tag size={14} /> Batch Number</label>
                            <input
                                type="text"
                                className="stock-input"
                                value={formData.batchNo}
                                onChange={(e) => setFormData(prev => ({ ...prev, batchNo: e.target.value }))}
                                placeholder="Auto-generated if empty"
                            />
                        </div>

                        {/* Quantity */}
                        <div className="stock-field-group">
                            <label className="stock-label"><Package size={14} /> {isEditMode ? 'Total Opening Quantity' : 'Received Quantity'}</label>
                            <input
                                type="number"
                                className="stock-input"
                                style={{ fontWeight: 800, fontSize: '1.1rem' }}
                                value={formData.quantity}
                                onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                                placeholder="0.00"
                                required
                            />
                        </div>

                        <div className="stock-field-group">
                            <label className="stock-label"><DollarSign size={14} /> Cost Price (CP)</label>
                            <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: 900, opacity: 0.6 }}>RS</span>
                                <input
                                    type="number"
                                    className="stock-input"
                                    style={{ paddingLeft: '2.5rem' }}
                                    value={formData.costPrice}
                                    onChange={(e) => setFormData(prev => ({ ...prev, costPrice: e.target.value }))}
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                        </div>

                        <div className="stock-field-group">
                            <label className="stock-label"><Tag size={14} /> MRP (Maximum Retail Price)</label>
                            <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: 900, opacity: 0.6 }}>RS</span>
                                <input
                                    type="number"
                                    className="stock-input"
                                    style={{ paddingLeft: '2.5rem' }}
                                    value={formData.mrp}
                                    onChange={(e) => setFormData(prev => ({ ...prev, mrp: e.target.value }))}
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                        </div>

                        <div className="stock-field-group">
                            <label className="stock-label"><DollarSign size={14} /> Base Selling Price (SP)</label>
                            <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: 900, opacity: 0.6 }}>RS</span>
                                <input
                                    type="number"
                                    className="stock-input"
                                    style={{ paddingLeft: '2.5rem' }}
                                    value={formData.sellingPrice}
                                    onChange={(e) => setFormData(prev => ({ ...prev, sellingPrice: e.target.value }))}
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                        </div>

                        <div className="stock-field-group">
                            <CustomSelect
                                label={<span><Percent size={14} style={{ marginRight: '6px' }} /> Discount Type</span>}
                                options={[
                                    { value: 'Fixed', label: 'Fixed Amount (RS)' },
                                    { value: 'Percentage', label: 'Percentage (%)' }
                                ]}
                                value={formData.discountType}
                                onChange={(val) => setFormData(prev => ({ ...prev, discountType: val }))}
                                placeholder="-- Select Discount Type --"
                            />
                        </div>

                        <div className="stock-field-group">
                            <label className="stock-label"><Tag size={14} /> Discount Value</label>
                            <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: 900, opacity: 0.6 }}>
                                    {formData.discountType === 'Percentage' ? '%' : 'RS'}
                                </span>
                                <input
                                    type="number"
                                    className="stock-input"
                                    style={{ paddingLeft: '2.5rem' }}
                                    value={formData.discountValue}
                                    onChange={(e) => setFormData(prev => ({ ...prev, discountValue: e.target.value }))}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        <div className="stock-field-group">
                            <CustomSelect
                                label={<span><Landmark size={14} style={{ marginRight: '6px' }} /> Applied Tax (GST)</span>}
                                options={taxOptions}
                                value={formData.taxId}
                                onChange={(val) => setFormData(prev => ({ ...prev, taxId: val }))}
                                placeholder="-- Select Tax Bracket --"
                            />
                        </div>

                        <div className="stock-field-group" style={{ gridColumn: 'span 1' }}>
                            <label className="stock-label" style={{ color: 'hsl(var(--primary))', fontWeight: '800' }}>
                                <ShieldCheck size={14} /> Final Selling Price (Excl. GST)
                            </label>
                            <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: 900, opacity: 0.6 }}>RS</span>
                                <input
                                    type="text"
                                    className="stock-input"
                                    style={{ paddingLeft: '2.5rem', background: 'hsl(var(--primary) / 0.05)', border: '1px dashed hsl(var(--primary))', fontWeight: '900', color: 'hsl(var(--primary))' }}
                                    value={formData.finalSellingPrice}
                                    readOnly
                                />
                            </div>
                        </div>
                    </form>

                    <footer className="stock-action-footer">
                        <button type="button" className="premium-btn-secondary" onClick={() => navigate('/stock')}>
                            {isEditMode ? 'Cancel Edit' : 'Discard Batch'}
                        </button>
                        <button type="button" className="premium-btn-primary" onClick={handleSubmit} disabled={isSaving}>
                            <Save size={18} /> {isSaving ? 'Processing Batch...' : (isEditMode ? 'Update Batch Details' : 'Finalize Check-In')}
                        </button>
                    </footer>
                </div>

                {/* High-Fidelity Preview Section */}
                <div className="stock-preview-section">
                    <div className="preview-badge-header">
                        <div className="preview-badge-icon">
                            <Package size={16} />
                        </div>
                        <h4 style={{ fontSize: '1.25rem', fontWeight: '900', color: 'hsl(var(--foreground))', margin: 0, letterSpacing: '-0.02em' }}>
                            Inventory Signal Preview
                        </h4>
                    </div>

                    <div className="stock-preview-card">
                        <div className="preview-img-box">
                            {selectedProduct?.images?.thumbnail ? (
                                <img src={`${BASE_IMAGE_URL}/${selectedProduct.images.thumbnail}`} alt="" />
                            ) : (
                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f0f0' }}>
                                    <Box size={32} className="text-muted-foreground" style={{ opacity: 0.3 }} />
                                </div>
                            )}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'hsl(var(--primary))', marginBottom: '4px' }}>
                                {selectedProduct?.name || 'Search for Product'}
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#1a1a1a', letterSpacing: '-0.01em' }}>
                                {formData.quantity || '0.00'} Units
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 15px', marginTop: '8px' }}>
                                <div style={{ fontSize: '0.9rem', color: '#666' }}>
                                    MRP: <strong>RS{formData.mrp || '0'}</strong>
                                </div>
                                <div style={{ fontSize: '0.9rem', color: '#1A6B3A' }}>
                                    Base SP: <strong>RS{formData.sellingPrice || '0'}</strong>
                                </div>
                                <div style={{ fontSize: '0.9rem', color: '#d97706' }}>
                                    Discount: <strong>{formData.discountType === 'Percentage' ? `${formData.discountValue}%` : `RS${formData.discountValue}`}</strong>
                                </div>
                                <div style={{ fontSize: '0.9rem', color: 'hsl(var(--primary))', fontWeight: '800' }}>
                                    Final Price: <strong>RS{formData.finalSellingPrice || '0'}</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                    <p style={{ marginTop: '2rem', fontSize: '0.95rem', color: 'hsl(var(--muted-foreground))', fontStyle: 'italic', fontWeight: '500', lineHeight: 1.6 }}>
                        * This preview displays how the batch will be registered. The **Final Price** is now **exclusive** of GST. GST will be calculated and added separately during the checkout process based on the selected tax bracket.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default StockInForm;
