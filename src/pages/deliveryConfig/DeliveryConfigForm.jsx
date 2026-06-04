import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, X, Plus, Trash2, Info, MapPin, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
import deliveryConfigService from '../../services/deliveryConfigService';
import Loader from '../../components/Loader';
import '../category/Category.css';

const DeliveryConfigForm = () => {
    const { id } = useParams();
    const isEditMode = !!id;
    const navigate = useNavigate();

    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        maxRadius: '',
        isActive: true,
        buckets: []
    });

    useEffect(() => {
        if (isEditMode) {
            fetchConfigData();
        } else {
            // Initialize with one empty bucket having a default base rule (Amount ₹0)
            setFormData(prev => ({
                ...prev,
                buckets: [{ 
                    minDistance: '', 
                    maxDistance: '', 
                    pricingRules: [{ minOrderAmount: 0, deliveryCharge: '' }], 
                    estimatedTime: '' 
                }]
            }));
        }
    }, [isEditMode]);

    const fetchConfigData = async () => {
        setIsLoading(true);
        try {
            const data = await deliveryConfigService.getDeliveryConfigById(id);
            setFormData({
                name: data.name,
                maxRadius: data.maxRadius,
                isActive: data.isActive,
                buckets: data.buckets?.length ? data.buckets : []
            });
        } catch (error) {
            toast.error('Failed to load configuration data');
            navigate('/delivery-list');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleBucketChange = (index, field, value) => {
        const newBuckets = [...formData.buckets];
        newBuckets[index][field] = value;
        setFormData(prev => ({ ...prev, buckets: newBuckets }));
    };

    const addBucket = () => {
        setFormData(prev => ({
            ...prev,
            buckets: [...prev.buckets, { 
                minDistance: '', 
                maxDistance: '', 
                pricingRules: [{ minOrderAmount: 0, deliveryCharge: '' }], 
                estimatedTime: '' 
            }]
        }));
    };

    const removeBucket = (index) => {
        const newBuckets = [...formData.buckets];
        newBuckets.splice(index, 1);
        setFormData(prev => ({ ...prev, buckets: newBuckets }));
    };

    const handleRuleChange = (bucketIndex, ruleIndex, field, value) => {
        const newBuckets = [...formData.buckets];
        newBuckets[bucketIndex].pricingRules[ruleIndex][field] = value;
        setFormData(prev => ({ ...prev, buckets: newBuckets }));
    };

    const addRule = (bucketIndex) => {
        const newBuckets = [...formData.buckets];
        newBuckets[bucketIndex].pricingRules.push({ minOrderAmount: '', deliveryCharge: '' });
        setFormData(prev => ({ ...prev, buckets: newBuckets }));
    };

    const removeRule = (bucketIndex, ruleIndex) => {
        const newBuckets = [...formData.buckets];
        newBuckets[bucketIndex].pricingRules.splice(ruleIndex, 1);
        setFormData(prev => ({ ...prev, buckets: newBuckets }));
    };

    const validateForm = () => {
        if (!formData.name.trim()) return "Zone Name is required.";
        if (!formData.maxRadius || Number(formData.maxRadius) <= 0) return "Max Radius must be greater than 0.";
        
        for (let i = 0; i < formData.buckets.length; i++) {
            const b = formData.buckets[i];
            if (b.minDistance === '' || b.maxDistance === '') {
                return `Bucket ${i + 1}: Please fill in min and max distance.`;
            }
            if (Number(b.minDistance) >= Number(b.maxDistance)) {
                return `Bucket ${i + 1}: Minimum distance must be less than maximum distance.`;
            }
            if (Number(b.maxDistance) > Number(formData.maxRadius)) {
                return `Bucket ${i + 1}: Maximum distance cannot exceed the total zone maxRadius (${formData.maxRadius} KM).`;
            }

            // Validate Pricing Rules
            if (!b.pricingRules || b.pricingRules.length === 0) {
                return `Bucket ${i + 1}: At least one pricing rule is required.`;
            }

            const ruleAmounts = new Set();
            for (let j = 0; j < b.pricingRules.length; j++) {
                const r = b.pricingRules[j];
                if (r.minOrderAmount === '' || r.deliveryCharge === '') {
                    return `Bucket ${i + 1}, Rule ${j + 1}: Please fill in order amount and charge.`;
                }
                if (ruleAmounts.has(Number(r.minOrderAmount))) {
                    return `Bucket ${i + 1}: Duplicate order amount detected: ${r.minOrderAmount}`;
                }
                ruleAmounts.add(Number(r.minOrderAmount));
            }
        }
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const error = validateForm();
        if (error) {
            toast.error(error);
            return;
        }

        setIsLoading(true);
        try {
            // Process payload: ensure numeric types and sorted rules
            const payload = {
                ...formData,
                maxRadius: Number(formData.maxRadius),
                buckets: formData.buckets.map(b => ({
                    ...b,
                    minDistance: Number(b.minDistance),
                    maxDistance: Number(b.maxDistance),
                    pricingRules: b.pricingRules
                        .map(r => ({
                            minOrderAmount: Number(r.minOrderAmount),
                            deliveryCharge: Number(r.deliveryCharge)
                        }))
                        .sort((a, b) => a.minOrderAmount - b.minOrderAmount)
                }))
            };

            if (isEditMode) {
                await deliveryConfigService.updateDeliveryConfig(id, payload);
                toast.success('Configuration updated successfully');
            } else {
                await deliveryConfigService.createDeliveryConfig(payload);
                toast.success('Configuration created successfully');
            }
            navigate('/delivery-list');
        } catch (err) {
            toast.error(err.message || 'Failed to save configuration');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="category-page-container fade-in">
            <div className="category-content-pane">
                <header className="internal-page-header" style={{ padding: '0 0 1.5rem 0' }}>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>
                            {isEditMode ? 'Edit Delivery Zone' : 'Create Delivery Zone'}
                        </h1>
                        <p style={{ margin: 0, color: 'hsl(var(--muted-foreground))', fontSize: '0.9rem' }}>
                            Configure geographical delivery limits and distance-based pricing.
                        </p>
                    </div>
                </header>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="category-glass-card">
                        <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <MapPin size={18} /> Basic Configuration
                        </h2>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                            <div className="form-group">
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 500, marginBottom: '0.5rem' }}>Zone Name <span style={{ color: 'hsl(var(--destructive))' }}>*</span></label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="e.g., Downtown City Area"
                                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid hsl(var(--border) / 0.5)', background: 'hsl(var(--background))', outline: 'none', color: 'hsl(var(--foreground))' }}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 500, marginBottom: '0.5rem' }}>Max Delivery Radius (KM) <span style={{ color: 'hsl(var(--destructive))' }}>*</span></label>
                                <input
                                    type="number"
                                    name="maxRadius"
                                    value={formData.maxRadius}
                                    onChange={handleChange}
                                    placeholder="e.g., 10"
                                    min="0"
                                    step="0.1"
                                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid hsl(var(--border) / 0.5)', background: 'hsl(var(--background))', outline: 'none', color: 'hsl(var(--foreground))' }}
                                    required
                                />
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem', fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>
                                    <Info size={12} /> Orders beyond this radius will be rejected.
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="category-glass-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h2 style={{ fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Truck size={18} /> Pricing Buckets
                            </h2>
                            <button type="button" onClick={addBucket} className="primary-button" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                                <Plus size={16} /> Add Range
                            </button>
                        </div>
                        
                        <p style={{ margin: '0 0 1.5rem 0', color: 'hsl(var(--muted-foreground))', fontSize: '0.85rem' }}>
                            Define delivery charges based on distance ranges and order amounts.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            {formData.buckets.map((bucket, index) => (
                                <div key={index} style={{ padding: '1.5rem', background: 'hsl(var(--background) / 0.5)', border: '1px solid hsl(var(--border) / 0.5)', borderRadius: '12px', position: 'relative', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    
                                    {formData.buckets.length > 1 && (
                                        <button 
                                            type="button" 
                                            onClick={() => removeBucket(index)}
                                            style={{ position: 'absolute', top: '10px', right: '10px', background: 'hsl(var(--destructive) / 0.1)', color: 'hsl(var(--destructive))', border: 'none', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                            title="Remove Bucket"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem', color: 'hsl(var(--foreground))' }}>Min Distance (KM)</label>
                                            <input
                                                type="number"
                                                value={bucket.minDistance}
                                                onChange={(e) => handleBucketChange(index, 'minDistance', e.target.value)}
                                                placeholder="e.g. 0"
                                                min="0"
                                                step="0.1"
                                                style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid hsl(var(--border) / 0.5)', background: 'hsl(var(--card))', outline: 'none' }}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem', color: 'hsl(var(--foreground))' }}>Max Distance (KM)</label>
                                            <input
                                                type="number"
                                                value={bucket.maxDistance}
                                                onChange={(e) => handleBucketChange(index, 'maxDistance', e.target.value)}
                                                placeholder="e.g. 2"
                                                min="0"
                                                step="0.1"
                                                style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid hsl(var(--border) / 0.5)', background: 'hsl(var(--card))', outline: 'none' }}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem', color: 'hsl(var(--foreground))' }}>Est. Time (Optional)</label>
                                            <input
                                                type="text"
                                                value={bucket.estimatedTime}
                                                onChange={(e) => handleBucketChange(index, 'estimatedTime', e.target.value)}
                                                placeholder="e.g. 15-20 mins"
                                                style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid hsl(var(--border) / 0.5)', background: 'hsl(var(--card))', outline: 'none' }}
                                            />
                                        </div>
                                    </div>

                                    {/* Pricing Rules Section */}
                                    <div style={{ background: 'hsl(var(--muted) / 0.3)', padding: '1.25rem', borderRadius: '10px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                            <h3 style={{ fontSize: '0.9rem', margin: 0, fontWeight: 700, color: 'hsl(var(--primary))' }}>Order Amount Based Pricing</h3>
                                            <button 
                                                type="button" 
                                                onClick={() => addRule(index)} 
                                                className="secondary-button"
                                                style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                            >
                                                <Plus size={14} /> Add Rule
                                            </button>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            {bucket.pricingRules.map((rule, ruleIndex) => (
                                                <div key={ruleIndex} style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem' }}>
                                                    <div style={{ flex: 1 }}>
                                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.4rem' }}>Min Order Amount (₹)</label>
                                                        <input 
                                                            type="number"
                                                            value={rule.minOrderAmount}
                                                            onChange={(e) => handleRuleChange(index, ruleIndex, 'minOrderAmount', e.target.value)}
                                                            placeholder="e.g. 0"
                                                            min="0"
                                                            style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid hsl(var(--border) / 0.5)', background: 'hsl(var(--background))' }}
                                                            required
                                                        />
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.4rem' }}>Delivery Charge (₹)</label>
                                                        <input 
                                                            type="number"
                                                            value={rule.deliveryCharge}
                                                            onChange={(e) => handleRuleChange(index, ruleIndex, 'deliveryCharge', e.target.value)}
                                                            placeholder="e.g. 20"
                                                            min="0"
                                                            style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid hsl(var(--border) / 0.5)', background: 'hsl(var(--background))' }}
                                                            required
                                                        />
                                                    </div>
                                                    {bucket.pricingRules.length > 1 && (
                                                        <button 
                                                            type="button" 
                                                            onClick={() => removeRule(index, ruleIndex)} 
                                                            style={{ padding: '0.6rem', color: 'hsl(var(--destructive))', background: 'hsl(var(--destructive) / 0.1)', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                                                            title="Remove Rule"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {formData.buckets.length === 0 && (
                                <div style={{ padding: '2rem', textAlign: 'center', color: 'hsl(var(--muted-foreground))', border: '1px dashed hsl(var(--border))', borderRadius: '8px' }}>
                                    No pricing buckets defined. Click "Add Range" to set up pricing.
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <button 
                            type="button" 
                            className="secondary-button" 
                            onClick={() => navigate('/delivery-list')}
                            style={{ padding: '0.6rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <X size={18} /> Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="primary-button" 
                            disabled={isLoading}
                            style={{ padding: '0.6rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            {isLoading ? <Loader /> : <Save size={18} />}
                            {isEditMode ? 'Save Changes' : 'Create Zone'}
                        </button>
                    </div>
                </form>
            </div>
            {isLoading && <Loader />}
        </div>
    );
};

export default DeliveryConfigForm;
