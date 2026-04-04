import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, ChevronDown, ShieldCheck } from 'lucide-react';
import './Sidebar.css';

import { BASE_URL } from '../../config/env';

const Sidebar = ({ isCollapsed }) => {
    const [menus, setMenus] = useState([]);
    const [expandedGroups, setExpandedGroups] = useState({});
    const location = useLocation();

    useEffect(() => {
        const fetchMenus = async () => {
            try {
                const res = await fetch(`${BASE_URL}/private/sidebar/get-menus`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                const data = await res.json();
                setMenus(data);
            } catch (error) {
                console.error('Failed to fetch sidebar menus:', error);
            }
        };
        fetchMenus();
    }, []);

    const isActive = (path) => {
        if (!path) return false;
        const currentPath = location.pathname.substring(1);
        const targetPath = path.toString().replace(/^\//, '');
        return currentPath === targetPath;
    };

    const toggleGroup = (id) => {
        setExpandedGroups(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const renderIcon = (iconStyle) => {
        if (!iconStyle) return null;
        // Basic extraction of class if it's like <i className='...' />
        const match = iconStyle.match(/className=['"]([^'"]+)['"]/);
        const className = match ? match[1] : 'la la-circle';
        return <i className={className} style={{ fontSize: '20px' }}></i>;
    };

    const headers = Array.isArray(menus) ? menus.filter(m => m.classChange === 'menu-title') : [];
    const standaloneItems = Array.isArray(menus) ? menus.filter(m => !m.classChange && m.parent_module_id === '-1') : [];

    return (
        <aside className={`sidebar-container glass ${isCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
                <div className="logo-container">
                    <div className="logo-icon">VS</div>
                    {!isCollapsed && (
                        <div className="logo-text-wrapper" style={{ display: 'flex', flexDirection: 'column' }}>
                            <span className="logo-text">VS MART</span>
                            <span className="powered-by-sidebar" style={{ fontSize: '0.55rem', color: 'hsl(var(--muted-foreground))', letterSpacing: '0.5px' }}>POWERED BY DEXTERDIGI.COM</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="sidebar-content">
                <ul className="menu-list">
                    {standaloneItems.map((item) => (
                        <li key={item._id} className={`menu-item ${isActive(item.to) ? 'active' : ''}`}>
                            <Link to={`/${item.to}`} className="menu-link">
                                <span className="menu-icon">{renderIcon(item.iconStyle)}</span>
                                {!isCollapsed && <span className="menu-label">{item.title}</span>}
                                {isCollapsed && <div className="tooltip">{item.title}</div>}
                            </Link>
                        </li>
                    ))}
                </ul>

                {headers.map((header) => {
                    const groupItems = menus.filter(m => m.parent_module_id === header.module_id);
                    if (groupItems.length === 0) return null;

                    return (
                        <div key={header._id} className="menu-group">
                            {!isCollapsed && <h4 className="group-title">{header.title}</h4>}
                            <ul className="menu-list">
                                {groupItems.map((item) => {
                                    const hasSubmenu = item.content && item.content.length > 0;
                                    const isExpanded = expandedGroups[item._id];

                                    return (
                                        <li key={item._id} className={`menu-item ${isActive(item.to) ? 'active' : ''} ${isExpanded ? 'active' : ''}`}>
                                            {hasSubmenu ? (
                                                <div className="menu-link" onClick={() => toggleGroup(item._id)}>
                                                    <span className="menu-icon">{renderIcon(item.iconStyle)}</span>
                                                    {!isCollapsed && <span className="menu-label">{item.title}</span>}
                                                    {!isCollapsed && (isExpanded ? <ChevronDown size={14} className="chevron" /> : <ChevronRight size={14} className="chevron" />)}
                                                </div>
                                            ) : (
                                                <Link to={`/${item.to}`} className="menu-link">
                                                    <span className="menu-icon">{renderIcon(item.iconStyle)}</span>
                                                    {!isCollapsed && <span className="menu-label">{item.title}</span>}
                                                </Link>
                                            )}

                                            {hasSubmenu && isExpanded && !isCollapsed && (
                                                <ul className="submenu-list">
                                                    {item.content.map((sub, idx) => (
                                                        <li key={idx} className={`submenu-item ${isActive(sub.to) ? 'active' : ''}`}>
                                                            <Link to={`/${sub.to}`} className="submenu-link">
                                                                <span className="submenu-prefix">-</span>
                                                                <span className="submenu-label">{sub.title}</span>
                                                            </Link>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}

                                            {isCollapsed && <div className="tooltip">{item.title}</div>}
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    );
                })}
            </div>

            <div className="sidebar-footer">
                <div className="pro-card glass">
                    {!isCollapsed ? (
                        <>
                            <h5>Enterprise Plan</h5>
                            <p>Dynamic RBAC Active</p>
                        </>
                    ) : (
                        <ShieldCheck size={20} />
                    )}
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
