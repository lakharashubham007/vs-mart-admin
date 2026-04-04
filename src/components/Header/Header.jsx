import React, { useState, useEffect } from 'react';
import {
    Menu,
    Search,
    Bell,
    User,
    Settings,
    LogOut,
    ChevronDown,
    X,
    Sun,
    Moon,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import './Header.css';

import { BASE_IMAGE_URL as IMAGE_BASE_URL } from '../../config/env';

const Header = ({ isSidebarCollapsed, toggleSidebar }) => {
    const { theme, toggleTheme } = useTheme();
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const { adminUnreadCount, resetUnreadCount, setAdminUnreadCount } = useSocket();

    // Seed the initial unread count from the API once on mount
    useEffect(() => {
        import('../../services/notificationService').then(mod => {
            mod.default.getNotifications().then(res => {
                const count = (res.data || []).filter(n => !n.isRead).length;
                setAdminUnreadCount(count);
            }).catch(() => {});
        });
    }, []);

    const handleBellClick = () => {
        navigate('/notifications');
        resetUnreadCount(); // Clear badge when navigating to notifications page
    };

    return (
        <header className="header-container glass">
            <div className="header-left">
                <button className="icon-button menu-toggle" onClick={toggleSidebar}>
                    {isSidebarCollapsed ? <Menu size={20} /> : <X size={20} />}
                </button>
                <div className="search-wrapper">
                    <Search size={18} className="search-icon" />
                    <input type="text" placeholder="Search for products, orders or customers..." />
                </div>
            </div>

            <div className="header-right">
                <button
                    className="icon-button theme-toggle"
                    onClick={toggleTheme}
                    title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                >
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>

                {/* Live notification bell → navigates to /notifications */}
                <div className="notification-wrapper">
                    <button
                        className="icon-button"
                        onClick={handleBellClick}
                        title="View Notifications"
                    >
                        <Bell size={20} />
                        {adminUnreadCount > 0 && (
                            <span className="badge">{adminUnreadCount > 99 ? '99+' : adminUnreadCount}</span>
                        )}
                    </button>
                </div>

                <div className="profile-container">
                    <button
                        className="profile-trigger"
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                    >
                        <div className="avatar">
                            {user?.profileImage ? (
                                <img src={`${IMAGE_BASE_URL}/${user.profileImage}`} alt="Profile" className="avatar-img-small" />
                            ) : (
                                <User size={18} />
                            )}
                        </div>
                        <div className="user-info">
                            <span className="user-name">{user?.name || 'Guest'}</span>
                            <span className="user-role">{user?.role || 'User'}</span>
                        </div>
                        <ChevronDown size={14} className={`chevron ${showProfileMenu ? 'rotate' : ''}`} />
                    </button>

                    {showProfileMenu && (
                        <div className="profile-dropdown fade-in">
                            <div className="dropdown-info">
                                <div className="dropdown-avatar">
                                    {user?.profileImage ? (
                                        <img src={`${IMAGE_BASE_URL}/${user.profileImage}`} alt="Profile" className="avatar-img-small" />
                                    ) : (
                                        <User size={20} />
                                    )}
                                </div>
                                <div className="dropdown-user-details">
                                    <p className="full-name">{user?.name || 'User Profile'}</p>
                                    <p className="email">{user?.email || ''}</p>
                                </div>
                            </div>
                            <div className="dropdown-divider"></div>
                            <button
                                className="dropdown-item"
                                onClick={() => { setShowProfileMenu(false); navigate('/profile'); }}
                            >
                                <User size={16} /> My Profile
                            </button>
                            <button className="dropdown-item">
                                <Settings size={16} /> Account Settings
                            </button>
                            <div className="dropdown-divider"></div>
                            <button className="dropdown-item logout-btn" onClick={logout}>
                                <LogOut size={16} /> Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
