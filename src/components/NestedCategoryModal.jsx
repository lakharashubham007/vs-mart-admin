import React, { useState, useEffect } from 'react';
import { X, Layers, Image as ImageIcon, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import productService from '../services/productService';

const NestedCategoryModal = ({ isOpen, onClose, masters = {}, onSuccess }) => {
    const [level, setLevel] = useState(1); // 1 = Main, 2 = Sub, 3 = Sub-Sub
    const [name, setName] = useState('');
    const [level1Parent, setLevel1Parent] = useState('');
    const [level2Parent, setLevel2Parent] = useState('');
    const [image, setImage] = useState(null);
    const [status, setStatus] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    // Reset when closed or opened
    useEffect(() => {
        if (isOpen) {
            setLevel(1);
            setName('');
            setLevel1Parent('');
            setLevel2Parent('');
            setImage(null);
            setStatus(true);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // Derived parent options
    const categories = masters.categories || [];
    const mainCategories = categories.filter(c => !c.parentId);
    // Find subcategories belonging to the selected main category
    const subCategories = level1Parent ? categories.filter(c => c.parentId && (c.parentId._id === level1Parent || c.parentId === level1Parent)) : [];

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name) return toast.error('Category Name is required');

        if (level === 2 && !level1Parent) return toast.error('Please select a Main Category parent');
        if (level === 3 && !level2Parent) return toast.error('Please select a Subcategory parent');

        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append('name', name);
            formData.append('status', status);

            // Set the correct parentId based on level
            if (level === 2) {
                formData.append('parentId', level1Parent);
            } else if (level === 3) {
                formData.append('parentId', level2Parent);
            }

            if (image) {
                formData.append('image', image);
            }

            // Category APIs do not require Authorization any more
            console.log('--- CATEGORY API SUBMISSION ---');
            console.log('Level:', level);
            console.log('Payload Name:', name);
            console.log('Payload Status:', status);
            console.log('Payload ParentId:', level === 2 ? level1Parent : (level === 3 ? level2Parent : 'null'));
            console.log('-------------------------------');

            const result = await productService.createCategory(formData);

            toast.success(`${level === 1 ? 'Category' : level === 2 ? 'Subcategory' : 'Sub-Subcategory'} Created!`, {
                icon: '🚀',
                style: { borderRadius: '10px', background: '#333', color: '#fff' }
            });

            onSuccess(result.category);
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create category');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-8 pb-4 px-4 bg-black/60 backdrop-blur-md transition-all duration-300 overflow-y-auto">
            <div className="bg-[hsl(var(--card))] w-full max-w-md rounded-[2rem] border border-white/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden animate-in slide-in-from-top-8 duration-300 mt-4 mb-auto">

                {/* Visual Accent */}
                <div className="h-2 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />

                <div className="p-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
                                <Layers size={18} className="text-primary" />
                                Create Category
                            </h3>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Hierarchical Master Data</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-muted/50 rounded-xl transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Level selection */}
                        <div className="flex bg-secondary/30 p-1.5 rounded-2xl">
                            <button
                                type="button"
                                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${level === 1 ? 'bg-primary text-white shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
                                onClick={() => setLevel(1)}
                            >
                                Main
                            </button>
                            <button
                                type="button"
                                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${level === 2 ? 'bg-primary text-white shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
                                onClick={() => setLevel(2)}
                            >
                                Sub
                            </button>
                            <button
                                type="button"
                                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${level === 3 ? 'bg-primary text-white shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
                                onClick={() => setLevel(3)}
                            >
                                Sub-Sub
                            </button>
                        </div>

                        {/* Dynamic Parent Fields */}
                        {level >= 2 && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                <label className="text-[11px] font-black uppercase tracking-wider text-muted-foreground ml-1">Select Main Category *</label>
                                <select
                                    className="w-full bg-secondary/30 border border-white/5 p-4 rounded-2xl outline-none focus:border-primary/50 transition-all font-semibold appearance-none"
                                    value={level1Parent}
                                    onChange={(e) => {
                                        setLevel1Parent(e.target.value);
                                        setLevel2Parent(''); // Reset child when parent changes
                                    }}
                                >
                                    <option value="">Choose Main Category...</option>
                                    {mainCategories.map(c => (
                                        <option key={c._id} value={c._id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {level >= 3 && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                <label className="text-[11px] font-black uppercase tracking-wider text-muted-foreground ml-1">Select Subcategory *</label>
                                <select
                                    className="w-full bg-secondary/30 border border-white/5 p-4 rounded-2xl outline-none focus:border-primary/50 transition-all font-semibold appearance-none disabled:opacity-50"
                                    value={level2Parent}
                                    onChange={(e) => setLevel2Parent(e.target.value)}
                                    disabled={!level1Parent}
                                >
                                    <option value="">{level1Parent ? 'Choose Subcategory...' : 'Select Main Category first'}</option>
                                    {subCategories.map(c => (
                                        <option key={c._id} value={c._id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Name Field */}
                        <div className="space-y-2">
                            <label className="text-[11px] font-black uppercase tracking-wider text-muted-foreground ml-1">
                                {level === 1 ? 'Main Category Name' : level === 2 ? 'Subcategory Name' : 'Sub-Subcategory Name'} *
                            </label>
                            <input
                                type="text"
                                className="w-full bg-secondary/30 border border-white/5 p-4 rounded-2xl outline-none focus:border-primary/50 focus:bg-secondary/50 transition-all font-semibold"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter name..."
                                autoFocus
                            />
                        </div>

                        {/* Image Field */}
                        <div className="space-y-2">
                            <label className="text-[11px] font-black uppercase tracking-wider text-muted-foreground ml-1">Category Image</label>
                            <input
                                type="file"
                                id="nested-quick-image-input"
                                hidden
                                onChange={(e) => setImage(e.target.files[0])}
                            />
                            <div
                                className="border-2 border-dashed border-white/5 rounded-2xl p-6 text-center cursor-pointer hover:border-primary/30 hover:bg-primary/5 transition-all group"
                                onClick={() => document.getElementById('nested-quick-image-input').click()}
                            >
                                <ImageIcon size={24} className="mx-auto text-muted-foreground group-hover:text-primary transition-colors mb-2" />
                                <p className="text-[10px] font-bold text-muted-foreground group-hover:text-primary transition-colors uppercase">
                                    {image ? image.name : 'Click to upload'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-secondary/20 rounded-2xl border border-white/5">
                            <div>
                                <h4 className="text-xs font-bold">Status</h4>
                                <p className="text-[10px] text-muted-foreground">Active for products</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setStatus(!status)}
                                className={`w-12 h-6 rounded-full transition-all relative ${status ? 'bg-primary' : 'bg-muted/30'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${status ? 'left-7' : 'left-1'}`}></div>
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-primary text-white p-4 rounded-2xl font-black tracking-wide shadow-[0_10px_25px_-10px_hsl(var(--primary))] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            {isLoading ? 'Creating...' : (
                                <>
                                    <Check size={18} strokeWidth={3} />
                                    CREATE {level === 1 ? 'CATEGORY' : level === 2 ? 'SUBCATEGORY' : 'SUB-SUBCATEGORY'}
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default NestedCategoryModal;
