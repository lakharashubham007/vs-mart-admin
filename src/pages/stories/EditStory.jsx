import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ImageIcon, LayoutGrid, X, RefreshCw, Calendar, Clock, AlertCircle, Video, PlayCircle, UploadCloud } from 'lucide-react';
import toast from 'react-hot-toast';
import storyService from '../../services/storyService';
import { BASE_URL as SERVICE_URL } from '../../config/env';
import Loader from '../../components/Loader';
import './Story.css';

const EditStory = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        mediaType: 'image',
        duration: 5,
        expireAt: '',
        isActive: true,
        media: null,
        thumbnail: null
    });

    const [previewUrl, setPreviewUrl] = useState(null);
    const [thumbPreviewUrl, setThumbPreviewUrl] = useState(null);
    const fileInputRef = useRef(null);
    const thumbInputRef = useRef(null);
    const ROOT_URL = SERVICE_URL.replace('/v1', '');

    useEffect(() => {
        fetchStoryDetails();
    }, [id]);

    const fetchStoryDetails = async () => {
        try {
            const res = await storyService.getStoryById(id);
            const story = res.data;
            setFormData({
                title: story.title || '',
                mediaType: story.mediaType,
                duration: story.duration,
                expireAt: new Date(story.expireAt).toISOString().slice(0, 16),
                isActive: story.isActive,
                media: null,
                thumbnail: null
            });
            
            // Set previews
            if (story.media.startsWith('http')) {
                setPreviewUrl(story.media);
            } else {
                setPreviewUrl(`${ROOT_URL}/${story.media}`);
            }

            if (story.thumbnail) {
                setThumbPreviewUrl(story.thumbnail);
            }
        } catch (error) {
            console.error('Error loading story:', error);
            toast.error('Failed to load story details');
            navigate('/stories-list');
        } finally {
            setIsLoading(false);
        }
    };

    const handleMediaChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const type = file.type.startsWith('video/') ? 'video' : 'image';
        
        setFormData(prev => ({ 
            ...prev, 
            media: file,
            mediaType: type
        }));
        setPreviewUrl(URL.createObjectURL(file));
    };

    const handleThumbChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setFormData(prev => ({ ...prev, thumbnail: file }));
        setThumbPreviewUrl(URL.createObjectURL(file));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        setIsSaving(true);
        try {
            const data = new FormData();
            data.append('title', formData.title);
            data.append('mediaType', formData.mediaType);
            data.append('duration', formData.duration);
            data.append('expireAt', formData.expireAt);
            data.append('isActive', formData.isActive);
            if (formData.media) {
                data.append('media', formData.media);
            }
            if (formData.thumbnail) {
                data.append('thumbnail', formData.thumbnail);
            }

            await storyService.updateStory(id, data);
            toast.success('Story Updated Successfully! 🚀');
            navigate('/stories-list');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update story');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <Loader />;

    return (
        <div className="category-page-container fade-in">
            <div className="category-content-pane category-form-view absolute-unified power-ui">
                <header className="internal-page-header">
                    <div className="page-header-content">
                        <h1>Edit Story</h1>
                        <p>Modify story details or update media assets.</p>
                    </div>
                    <div className="header-actions">
                        <button type="button" className="secondary-button" onClick={() => navigate('/stories-list')}>Cancel</button>
                        <button type="submit" form="edit-story-form" className="primary-button" disabled={isSaving}>
                            <Save size={18} /> {isSaving ? 'Updating...' : 'Update Story'}
                        </button>
                    </div>
                </header>

                <hr className="header-divider-internal" />

                <form id="edit-story-form" className="category-glass-card" onSubmit={handleSubmit}>
                    <div className="banner-form-flex">
                        <div className="banner-inputs-column">
                            <div className="banner-form-group">
                                <label><LayoutGrid size={14} /> Story Title</label>
                                <input
                                    type="text"
                                    className="banner-input-fancy"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>

                            <div className="banner-field-row">
                                <div className="banner-form-group" style={{ flex: 1 }}>
                                    <label><Clock size={14} /> Duration (sec)</label>
                                    <input
                                        type="number"
                                        className="banner-input-fancy"
                                        value={formData.duration}
                                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                    />
                                </div>
                                <div className="banner-form-group" style={{ flex: 2 }}>
                                    <label><Calendar size={14} /> Expiry Time</label>
                                    <input
                                        type="datetime-local"
                                        className="banner-input-fancy"
                                        value={formData.expireAt}
                                        onChange={(e) => setFormData({ ...formData, expireAt: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Thumbnail Upload Field */}
                            <div className="banner-form-group">
                                <label><ImageIcon size={14} /> Story Thumbnail</label>
                                <div 
                                    className={`thumbnail-upload-zone ${thumbPreviewUrl ? 'has-file' : ''}`}
                                    onClick={() => !thumbPreviewUrl && thumbInputRef.current.click()}
                                >
                                    {thumbPreviewUrl ? (
                                        <div className="thumbnail-file-info">
                                            <div className="file-name-container">
                                                <ImageIcon size={18} />
                                                <span className="file-name">
                                                    {formData.thumbnail ? formData.thumbnail.name : 'Existing Thumbnail'}
                                                </span>
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
                                            <span>Upload New Thumbnail</span>
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
                        </div>

                        <div className="banner-preview-column">
                            <div className="banner-form-group">
                                <label><ImageIcon size={14} /> Media Preview</label>
                                <div
                                    className={`banner-upload-zone story-preview-zone has-media`}
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
                                    {previewUrl && (
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
                                    )}
                                    {formData.mediaType === 'video' ? (
                                        <video src={previewUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} autoPlay muted loop />
                                    ) : (
                                        <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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

export default EditStory;
