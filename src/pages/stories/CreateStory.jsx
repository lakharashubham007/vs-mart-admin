import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, ImageIcon, LayoutGrid, X, RefreshCw, Calendar, Clock, AlertCircle, Video, PlayCircle, UploadCloud } from 'lucide-react';
import toast from 'react-hot-toast';
import storyService from '../../services/storyService';
import Loader from '../../components/Loader';
import './Story.css';

const CreateStory = () => {
    const navigate = useNavigate();
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        mediaType: 'image',
        duration: 5,
        expireAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16), // Default 24h
        isActive: true,
        media: null,
        thumbnail: null
    });

    const [previewUrl, setPreviewUrl] = useState(null);
    const [thumbPreviewUrl, setThumbPreviewUrl] = useState(null);
    const fileInputRef = useRef(null);
    const thumbInputRef = useRef(null);

    const handleMediaChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Auto-detect media type
        const type = file.type.startsWith('video/') ? 'video' : 'image';
        
        setFormData(prev => ({ 
            ...prev, 
            media: file,
            mediaType: type,
            duration: type === 'video' ? 15 : 5 // Default video duration longer
        }));
        setPreviewUrl(URL.createObjectURL(file));
        toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} selected! Previewing asset.`);
    };

    const handleThumbChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            return toast.error('Thumbnail must be an image');
        }

        setFormData(prev => ({ ...prev, thumbnail: file }));
        setThumbPreviewUrl(URL.createObjectURL(file));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.media) return toast.error('Please upload an image or video for the story');
        if (formData.mediaType === 'video' && !formData.thumbnail) {
            return toast.error('Thumbnail is required for video stories');
        }
        if (!formData.expireAt) return toast.error('Expiry time is required');

        setIsSaving(true);
        try {
            const data = new FormData();
            data.append('title', formData.title);
            data.append('mediaType', formData.mediaType);
            data.append('duration', formData.duration);
            data.append('expireAt', formData.expireAt);
            data.append('isActive', formData.isActive);
            data.append('media', formData.media);
            if (formData.thumbnail) {
                data.append('thumbnail', formData.thumbnail);
            }

            await storyService.createStory(data);
            toast.success('Story Published Successfully! 🚀');
            navigate('/stories-list');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create story');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="category-page-container fade-in">
            <div className="category-content-pane category-form-view absolute-unified power-ui">
                <header className="internal-page-header">
                    <div className="page-header-content">
                        <h1>Create New Story</h1>
                        <p>Upload a 24h status update for your customers (9:16 aspect ratio recommended).</p>
                    </div>
                    <div className="header-actions">
                        <button type="button" className="secondary-button" onClick={() => navigate('/stories-list')}>Cancel</button>
                        <button type="submit" form="create-story-form" className="primary-button" disabled={isSaving}>
                            <Save size={18} /> {isSaving ? 'Uploading...' : 'Publish Story'}
                        </button>
                    </div>
                </header>

                <hr className="header-divider-internal" />

                <form id="create-story-form" className="category-glass-card" onSubmit={handleSubmit}>
                    <div className="banner-form-flex">
                        {/* Left Column: Details */}
                        <div className="banner-inputs-column">
                            <div className="banner-form-group">
                                <label><LayoutGrid size={14} /> Story Title (Optional)</label>
                                <input
                                    type="text"
                                    className="banner-input-fancy"
                                    placeholder="e.g. Flash Sale Live Now!"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    autoFocus
                                />
                            </div>

                            <div className="banner-field-row">
                                <div className="banner-form-group" style={{ flex: 1 }}>
                                    <label><Clock size={14} /> Auto-Display Duration (sec)</label>
                                    <input
                                        type="number"
                                        className="banner-input-fancy"
                                        min="1"
                                        max="60"
                                        value={formData.duration}
                                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                    />
                                </div>
                                <div className="banner-form-group" style={{ flex: 2 }}>
                                    <label><Calendar size={14} /> Expiry Time (Auto-Delete)</label>
                                    <input
                                        type="datetime-local"
                                        className="banner-input-fancy"
                                        value={formData.expireAt}
                                        onChange={(e) => setFormData({ ...formData, expireAt: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Thumbnail Upload Field (Important for Videos) */}
                            <div className="banner-form-group">
                                <label><ImageIcon size={14} /> Story Thumbnail (Required for Videos)</label>
                                <div 
                                    className={`thumbnail-upload-zone ${formData.thumbnail ? 'has-file' : ''}`}
                                    onClick={() => !formData.thumbnail && thumbInputRef.current.click()}
                                >
                                    {formData.thumbnail ? (
                                        <div className="thumbnail-file-info">
                                            <div className="file-name-container">
                                                <ImageIcon size={18} />
                                                <span className="file-name">{formData.thumbnail.name || 'Selected Image'}</span>
                                            </div>
                                            <button 
                                                type="button" 
                                                className="thumbnail-clear-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setFormData(prev => ({ ...prev, thumbnail: null }));
                                                    setThumbPreviewUrl(null);
                                                    if (thumbInputRef.current) thumbInputRef.current.value = '';
                                                }}
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="thumbnail-label">
                                            <UploadCloud size={24} />
                                            <span>Upload Thumbnail</span>
                                        </div>
                                    )}
                                    <input 
                                        type="file" 
                                        ref={thumbInputRef} 
                                        hidden 
                                        accept="image/*"
                                        onChange={handleThumbChange}
                                    />
                                </div>
                            </div>

                            <div className="banner-form-group">
                                <label>Visibility Control</label>
                                <div
                                    className="luxury-toggle-container"
                                    onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                                >
                                    <div className="luxury-toggle-info">
                                        <span className="luxury-toggle-label">Active Status</span>
                                        <span className="luxury-toggle-sub">If disabled, story won't appear in the app.</span>
                                    </div>
                                    <div className={`luxury-switch ${formData.isActive ? 'active' : ''}`}>
                                        <div className="luxury-knob" />
                                    </div>
                                </div>
                            </div>

                            <div className="banner-glass-card" style={{ padding: '1rem', marginTop: '1rem', border: '1px dashed hsl(var(--primary) / 0.3)' }}>
                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                    <AlertCircle size={18} color="hsl(var(--primary))" style={{ marginTop: '2px' }} />
                                    <div>
                                        <p style={{ fontWeight: '700', fontSize: '0.9rem', marginBottom: '4px' }}>Story Guidelines</p>
                                        <ul style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))', paddingLeft: '1.2rem' }}>
                                            <li>Use **9:16 (Vertical)** media for best results.</li>
                                            <li>Videos will be stored on-server (**1GB Limit**).</li>
                                            <li>Thumbnails are stored on Cloudinary for fast CDN access.</li>
                                            <li>Stories auto-delete after the expiry time.</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Mobile-Style Preview */}
                        <div className="banner-preview-column">
                            <div className="banner-form-group">
                                <label><ImageIcon size={14} /> Mobile View Preview</label>
                                <div
                                    className={`banner-upload-zone story-preview-zone ${previewUrl ? 'has-media' : ''}`}
                                    onClick={() => fileInputRef.current.click()}
                                    style={{ 
                                        aspectRatio: '9/16', 
                                        width: '220px', 
                                        margin: '0 auto', 
                                        overflow: 'hidden',
                                        border: previewUrl ? 'none' : '2px dashed hsl(var(--border))',
                                        backgroundColor: previewUrl ? '#000' : 'hsl(var(--secondary) / 0.2)'
                                    }}
                                >
                                    {previewUrl ? (
                                        <>
                                            <button
                                                type="button"
                                                className="preview-clear-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setFormData({ ...formData, media: null, mediaType: 'image' });
                                                    setPreviewUrl(null);
                                                    if (fileInputRef.current) fileInputRef.current.value = '';
                                                }}
                                            >
                                                <X size={18} />
                                            </button>
                                            {formData.mediaType === 'video' ? (
                                                <video src={previewUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} autoPlay muted loop />
                                            ) : (
                                                <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <PlayCircle size={40} strokeWidth={1} style={{ marginBottom: '1rem', color: 'hsl(var(--muted-foreground))' }} />
                                            <div style={{ textAlign: 'center' }}>
                                                <p style={{ fontWeight: '800', fontSize: '0.9rem', marginBottom: '4px' }}>UPLOAD STORY MEDIA</p>
                                                <p style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>Images or MP4 Videos</p>
                                            </div>
                                        </>
                                    )}
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        hidden
                                        accept="image/*,video/*"
                                        onChange={handleMediaChange}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
            {isSaving && <Loader />}
        </div>
    );
};

export default CreateStory;
