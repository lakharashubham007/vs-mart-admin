import React, { useState } from 'react';
import { User, Mail, Shield, Save, Key, Camera, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import * as authService from '../services/authService';
import './Profile.css';
import Loader from '../components/Loader';
import { BASE_IMAGE_URL } from '../config/env';

const Profile = () => {
    const { user, setUser } = useAuth();
    const navigate = useNavigate();
    const [isSaving, setIsSaving] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(user?.profileImage ? `${BASE_IMAGE_URL}/${user.profileImage}` : null);

    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleDeleteImage = async () => {
        try {
            await authService.deleteProfileImage();
            setImagePreview(null);
            setImageFile(null);
            setUser(prev => ({ ...prev, profileImage: null }));
            toast.success('Profile image removed');
        } catch (error) {
            toast.error('Failed to remove image');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
            return toast.error('Passwords do not match');
        }

        setIsSaving(true);
        try {
            const data = new FormData();
            data.append('name', formData.name);
            if (imageFile) data.append('profileImage', imageFile);
            if (formData.currentPassword && formData.newPassword) {
                data.append('currentPassword', formData.currentPassword);
                data.append('newPassword', formData.newPassword);
            }

            const response = await authService.updateProfile(data);
            setUser(prev => ({
                ...prev,
                name: response.user.name,
                profileImage: response.user.profileImage
            }));

            setFormData(prev => ({
                ...prev,
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            }));
            setImageFile(null);

            toast.success('Profile updated successfully!');
        } catch (error) {
            toast.error(error.message || 'Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="profile-page-container fade-in">
            <div className="profile-content-pane">
                <header className="profile-header">
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <button className="profile-btn-icon" onClick={() => navigate(-1)} title="Back">
                                <ArrowLeft size={16} />
                            </button>
                            <h1>Personal Profile</h1>
                        </div>
                        <p>Manage your account settings and personal information.</p>
                    </div>
                </header>

                <div className="profile-layout-grid">
                    {/* Identity Card */}
                    <div className="profile-glass-card identity-card">
                        <div className="identity-header">
                            <div className="profile-avatar-large">
                                {imagePreview ? (
                                    <img src={imagePreview} alt="Profile" className="avatar-img-large" />
                                ) : (
                                    <User size={48} />
                                )}
                                <label className="avatar-edit-btn" htmlFor="profile-upload" style={{ cursor: 'pointer' }}>
                                    <Camera size={14} />
                                </label>
                                <input
                                    type="file"
                                    id="profile-upload"
                                    hidden
                                    accept="image/*"
                                    onChange={handleImageChange}
                                />
                            </div>
                            {imagePreview && (
                                <button className="delete-image-btn" onClick={handleDeleteImage}>
                                    Remove Photo
                                </button>
                            )}
                            <div className="identity-details">
                                <h2>{user?.name}</h2>
                                <div className="role-tag">
                                    <Shield size={12} />
                                    {user?.role}
                                </div>
                            </div>
                        </div>
                        <div className="identity-stats">
                            <div className="stat-item">
                                <span className="stat-label">Member Since</span>
                                <span className="stat-value">Feb 2026</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Last Login</span>
                                <span className="stat-value">Today</span>
                            </div>
                        </div>
                    </div>

                    {/* Form Card */}
                    <div className="profile-glass-card form-card">
                        <form onSubmit={handleSubmit} className="profile-form">
                            <h3 className="section-title">Account Information</h3>
                            <div className="profile-form-grid">
                                <div className="profile-form-group">
                                    <label><User size={14} /> Full Name</label>
                                    <div className="profile-input-wrapper">
                                        <User size={16} />
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            className="enterprise-input"
                                            placeholder="Your name"
                                        />
                                    </div>
                                </div>
                                <div className="profile-form-group">
                                    <label><Mail size={14} /> Email Address</label>
                                    <div className="profile-input-wrapper">
                                        <Mail size={16} />
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="enterprise-input"
                                            placeholder="Your email"
                                            disabled // Prevent changing email for now
                                        />
                                    </div>
                                </div>
                            </div>

                            <h3 className="section-title" style={{ marginTop: '2rem' }}>Security & Password</h3>
                            <div className="profile-form-grid">
                                <div className="profile-form-group">
                                    <label><Key size={14} /> Current Password</label>
                                    <div className="profile-input-wrapper">
                                        <Key size={16} />
                                        <input
                                            type="password"
                                            name="currentPassword"
                                            value={formData.currentPassword}
                                            onChange={handleChange}
                                            className="enterprise-input"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                                <div className="profile-form-group">
                                    <label><Key size={14} /> New Password</label>
                                    <div className="profile-input-wrapper">
                                        <Key size={16} />
                                        <input
                                            type="password"
                                            name="newPassword"
                                            value={formData.newPassword}
                                            onChange={handleChange}
                                            className="enterprise-input"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                                <div className="profile-form-group">
                                    <label><Key size={14} /> Confirm New Password</label>
                                    <div className="profile-input-wrapper">
                                        <Key size={16} />
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            className="enterprise-input"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="profile-form-footer">
                                <button type="submit" className="primary-button" disabled={isSaving}>
                                    <Save size={18} /> {isSaving ? 'Updating...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            {isSaving && <Loader message="Updating Secure Profile..." />}
        </div>
    );
};

export default Profile;
