import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, LayoutGrid, Save, Plus, X, Users, Lock, ChevronRight, Trash2, Edit3 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import Swal from 'sweetalert2';
import roleService from '../services/roleService';
import permissionService from '../services/permissionService';
import sidebarService from '../services/sidebarService';
import Loader from '../components/Loader';
import './AccessControl.css';

const AccessControl = () => {
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [sidebarMenus, setSidebarMenus] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');

    // View State: 'list' | 'create' | 'edit'
    const [viewState, setViewState] = useState('list');
    const [expandedSidebarMenus, setExpandedSidebarMenus] = useState({}); // Track expanded parent menus
    const [expandedPermissions, setExpandedPermissions] = useState({}); // Track expanded permission modules

    // Form State
    const [formData, setFormData] = useState({
        _id: null,
        name: '',
        permissionIds: [],
        sidebarMenuIds: []
    });

    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        fetchRoles();
        fetchPermissions();
        fetchSidebarMenus();
    }, []);

    useEffect(() => {
        if (location.pathname.includes('create-role')) {
            handleOpenCreate();
        } else {
            setViewState('list');
        }
    }, [location.pathname]);

    const fetchRoles = async () => {
        try {
            const data = await roleService.getRoles();
            if (Array.isArray(data)) {
                const sortedRoles = [...data].sort((a, b) => {
                    if (a.isDefault && !b.isDefault) return -1;
                    if (!a.isDefault && b.isDefault) return 1;
                    return 0;
                });
                setRoles(sortedRoles);
            } else {
                toast.error(data.message || 'Failed to fetch roles');
                setRoles([]);
            }
        } catch (error) {
            console.error('Fetch roles failed:', error);
            setRoles([]);
        }
    };

    const fetchPermissions = async () => {
        try {
            const data = await permissionService.getPermissions();
            if (Array.isArray(data)) {
                setPermissions(data);
            } else {
                setPermissions([]);
            }
        } catch (error) {
            console.error('Fetch permissions failed:', error);
            setPermissions([]);
        }
    };

    const fetchSidebarMenus = async () => {
        try {
            const data = await sidebarService.getAllMenus();
            if (Array.isArray(data)) {
                setSidebarMenus(data);
            } else if (data && Array.isArray(data.data)) {
                setSidebarMenus(data.data);
            } else {
                setSidebarMenus([]);
            }
        } catch (error) {
            console.error('Fetch sidebar menus failed:', error);
            setSidebarMenus([]);
        }
    };

    const handleOpenCreate = () => {
        setFormData({ _id: null, name: '', permissionIds: [], sidebarMenuIds: [] });
        setViewState('create');
    };

    const handleOpenEdit = (role) => {
        setFormData({
            _id: role._id,
            name: role.name,
            permissionIds: role.permissionIds?.map(p => p._id || p) || [],
            sidebarMenuIds: role.sidebarMenuIds?.map(s => s._id || s) || []
        });
        setViewState('edit');
    };

    const handleCancel = () => {
        setViewState('list');
        navigate('/roles/get-roles');
    };

    const handleTogglePermission = (id) => {
        setFormData(prev => {
            const exists = prev.permissionIds.includes(id);
            return {
                ...prev,
                permissionIds: exists ? prev.permissionIds.filter(p => p !== id) : [...prev.permissionIds, id]
            };
        });
    };

    const handleToggleSidebar = (id) => {
        setFormData(prev => {
            const exists = prev.sidebarMenuIds.includes(id);
            return {
                ...prev,
                sidebarMenuIds: exists ? prev.sidebarMenuIds.filter(s => s !== id) : [...prev.sidebarMenuIds, id]
            };
        });
    };

    const handleSelectAllSidebar = (parentMenu) => {
        if (parentMenu) {
            // Toggle specific parent and its children
            const validSidebarMenus = Array.isArray(sidebarMenus) ? sidebarMenus : [];
            const childIds = validSidebarMenus.filter(m => String(m.parent_module_id) === String(parentMenu.module_id)).map(m => m._id);
            const allRelatedIds = [parentMenu._id, ...childIds];

            const allSelected = allRelatedIds.every(id => formData.sidebarMenuIds.includes(id));

            if (allSelected) {
                setFormData(prev => ({ ...prev, sidebarMenuIds: prev.sidebarMenuIds.filter(id => !allRelatedIds.includes(id)) }));
            } else {
                setFormData(prev => ({ ...prev, sidebarMenuIds: [...new Set([...prev.sidebarMenuIds, ...allRelatedIds])] }));
            }
        } else {
            // Toggle entirely all menus
            const validSidebarMenus = Array.isArray(sidebarMenus) ? sidebarMenus : [];
            if (formData.sidebarMenuIds.length === validSidebarMenus.length && validSidebarMenus.length > 0) {
                setFormData(prev => ({ ...prev, sidebarMenuIds: [] }));
            } else {
                setFormData(prev => ({ ...prev, sidebarMenuIds: validSidebarMenus.map(m => m._id) }));
            }
        }
    };

    const handleSelectAllPermissions = (moduleOverrides = null) => {
        // If moduleOverrides is passed, toggle just that module, else toggle all
        if (moduleOverrides) {
            const allModulePermIds = moduleOverrides.map(p => p._id);
            const allSelected = allModulePermIds.every(id => formData.permissionIds.includes(id));
            if (allSelected) {
                setFormData(prev => ({ ...prev, permissionIds: prev.permissionIds.filter(id => !allModulePermIds.includes(id)) }));
            } else {
                setFormData(prev => ({ ...prev, permissionIds: [...new Set([...prev.permissionIds, ...allModulePermIds])] }));
            }
        } else {
            if (formData.permissionIds.length === permissions.length) {
                setFormData(prev => ({ ...prev, permissionIds: [] }));
            } else {
                setFormData(prev => ({ ...prev, permissionIds: permissions.map(p => p._id) }));
            }
        }
    };

    const handleSave = async () => {
        if (!formData.name.trim()) return toast.error('Role name is required');

        setIsLoading(true);
        setLoadingMessage(viewState === 'create' ? 'Creating Role...' : 'Updating Role...');

        try {
            const payload = {
                name: formData.name,
                permissionIds: formData.permissionIds,
                sidebarMenuIds: formData.sidebarMenuIds
            };

            if (viewState === 'create') {
                await roleService.createRole(payload);
            } else {
                await roleService.updateRole(formData._id, payload);
            }

            toast.success(viewState === 'create' ? 'Role created successfully!' : 'Role updated successfully!');
            fetchRoles();
            setViewState('list');
            navigate('/roles/get-roles');
        } catch (error) {
            console.error('Save role failed:', error);
            toast.error(error.message || 'Failed to save role');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Delete Role?',
            text: 'This will permanently remove this role and its associated permissions. Action cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: 'hsl(var(--destructive))',
            cancelButtonColor: 'hsl(var(--secondary))',
            confirmButtonText: 'Yes, Delete Role',
            cancelButtonText: 'Cancel',
            background: 'hsl(var(--card))',
            color: 'hsl(var(--foreground))',
            backdrop: `rgba(0,0,0,0.4) blur(4px)`,
            customClass: {
                popup: 'enterprise-alert-popup',
                title: 'enterprise-alert-title',
                confirmButton: 'enterprise-alert-confirm',
                cancelButton: 'enterprise-alert-cancel'
            }
        });

        if (result.isConfirmed) {
            setIsLoading(true);
            setLoadingMessage('Deleting Role...');

            try {
                console.log('Attempting to delete role with ID:', id);
                await roleService.deleteRole(id);
                toast.success('Role deleted successfully!');
                fetchRoles();
            } catch (error) {
                console.error('Delete role failed:', error);
                toast.error(error.message || 'Failed to delete role');
            } finally {
                setIsLoading(false);
            }
        }
    };


    // Group permissions by module
    const groupedPermissions = permissions.reduce((acc, perm) => {
        const mod = perm.module || 'Other';
        if (!acc[mod]) acc[mod] = [];
        acc[mod].push(perm);
        return acc;
    }, {});

    // Process Sidebar Menus for Hierarchy
    const validSidebarMenus = Array.isArray(sidebarMenus) ? sidebarMenus : [];

    const parentSidebarMenus = validSidebarMenus
        .filter(menu => {
            const pId = menu.parent_module_id;
            // Parent if it has no parent_module_id or it's conventionally set to root ("-1", "0", 0, "")
            return pId == null || pId === "" || pId === "0" || pId === 0 || pId === "-1";
        })
        .sort((a, b) => (Number(a.module_priority) || 0) - (Number(b.module_priority) || 0));

    const getChildMenus = (parentId) => {
        return validSidebarMenus
            .filter(menu => String(menu.parent_module_id) === String(parentId))
            .sort((a, b) => (Number(a.module_priority) || 0) - (Number(b.module_priority) || 0));
    };

    const toggleMenuExpand = (moduleId) => {
        setExpandedSidebarMenus(prev => ({
            ...prev,
            [moduleId]: !prev[moduleId]
        }));
    };

    const togglePermissionExpand = (moduleName) => {
        setExpandedPermissions(prev => ({
            ...prev,
            [moduleName]: !prev[moduleName]
        }));
    };

    return (
        <div className="access-control-container fade-in">
            <div className="content-pane">
                {viewState === 'list' ? (
                    <>
                        <div className="page-header">
                            <div>
                                <h1>Role Management</h1>
                                <p>Manage roles and control access across the enterprise dashboard.</p>
                            </div>
                            <button className="primary-button" onClick={handleOpenCreate}>
                                <Plus size={18} /> Create Role
                            </button>
                        </div>
                        <div className="roles-grid">
                            {roles.map(role => (
                                <div key={role._id} className="role-card glass-card">
                                    <div>
                                        <div className="role-card-header">
                                            <div className="role-icon-wrapper">
                                                <ShieldCheck size={24} />
                                            </div>
                                            <div className="role-card-title">{role.name}</div>
                                        </div>
                                        <div className="role-card-meta">
                                            <div className="meta-badge">
                                                <Lock size={14} /> {role.permissionIds?.length || 0} Permissions
                                            </div>
                                            <div className="meta-badge">
                                                <LayoutGrid size={14} /> {role.sidebarMenuIds?.length || 0} Menus
                                            </div>
                                            {role.isDefault && (
                                                <div className="meta-badge" style={{ color: 'hsl(var(--primary))', borderColor: 'hsl(var(--primary)/0.3)' }}>
                                                    Default
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="role-card-actions">
                                        <button className="secondary-button" onClick={() => handleOpenEdit(role)}>
                                            <Edit3 size={16} /> Edit
                                        </button>
                                        {!role.isDefault && (
                                            <button className="danger-button" onClick={() => handleDelete(role._id)}>
                                                <Trash2 size={16} /> Delete
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="create-role-view">
                        <div className="page-header">
                            <div>
                                <h1>{viewState === 'create' ? 'Create New Role' : `Edit Role: ${formData.name}`}</h1>
                                <p>Configure precise access levels and sidebar visibility for this role.</p>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <button type="button" className="secondary-button" onClick={handleCancel}>Cancel</button>
                                <button type="button" className="primary-button" onClick={handleSave}>
                                    <Save size={18} /> Save Role
                                </button>
                            </div>
                        </div>

                        <div className="form-header">
                            <div className="input-group">
                                <label>Role Name</label>
                                <input
                                    type="text"
                                    className="premium-input"
                                    placeholder="e.g. Regional Manager"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="form-content">
                            {/* Sidebar Selection */}
                            <div className="selection-section">
                                <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <LayoutGrid size={20} /> Sidebar Visibility
                                    </div>
                                    <button
                                        type="button"
                                        className="text-button"
                                        onClick={handleSelectAllSidebar}
                                        style={{ fontSize: '0.85rem', padding: '0.25rem 0.5rem' }}
                                    >
                                        {formData.sidebarMenuIds.length === sidebarMenus.length && sidebarMenus.length > 0 ? 'Deselect All' : 'Select All'}
                                    </button>
                                </div>
                                <div className="sidebar-hierarchical-list">
                                    {parentSidebarMenus.map(parentMenu => {
                                        const children = getChildMenus(parentMenu.module_id);
                                        const isExpanded = expandedSidebarMenus[parentMenu.module_id] || false;

                                        const hasChildren = children.length > 0;
                                        const allRelatedIds = [parentMenu._id, ...children.map(c => c._id)];
                                        const allSelected = allRelatedIds.every(id => formData.sidebarMenuIds.includes(id));

                                        return (
                                            <div key={parentMenu._id} className="sidebar-module-group">
                                                <div className="sidebar-parent-header">
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                                                        {hasChildren ? (
                                                            <button
                                                                type="button"
                                                                className={`expand-toggle-btn ${isExpanded ? 'expanded' : ''}`}
                                                                onClick={() => toggleMenuExpand(parentMenu.module_id)}
                                                            >
                                                                <ChevronRight size={16} />
                                                            </button>
                                                        ) : (
                                                            <div style={{ width: '16px' }} /> // Spacer if no children
                                                        )}
                                                        <label className={`premium-checkbox-label compact-label ${allSelected ? 'selected' : ''}`}>
                                                            <input
                                                                type="checkbox"
                                                                checked={formData.sidebarMenuIds.includes(parentMenu._id)}
                                                                onChange={() => handleToggleSidebar(parentMenu._id)}
                                                            />
                                                            <span className="item-name">{parentMenu.title || parentMenu.name}</span>
                                                        </label>
                                                    </div>

                                                    {hasChildren && (
                                                        <button
                                                            type="button"
                                                            className="text-button"
                                                            onClick={() => handleSelectAllSidebar(parentMenu)}
                                                            style={{ fontSize: '0.75rem', padding: '0.25rem' }}
                                                        >
                                                            {allSelected ? 'Deselect All' : 'Select All'}
                                                        </button>
                                                    )}
                                                </div>

                                                {hasChildren && isExpanded && (
                                                    <div className="sidebar-children-list">
                                                        {children.map(childMenu => {
                                                            const isChildSelected = formData.sidebarMenuIds.includes(childMenu._id);
                                                            return (
                                                                <label key={childMenu._id} className={`premium-checkbox-label child-label ${isChildSelected ? 'selected' : ''}`}>
                                                                    <div className="child-tree-line"></div>
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={isChildSelected}
                                                                        onChange={() => handleToggleSidebar(childMenu._id)}
                                                                    />
                                                                    <span className="item-name">{childMenu.title || childMenu.name}</span>
                                                                </label>
                                                            )
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Permissions Selection */}
                            <div className="selection-section" style={{ background: 'transparent', border: 'none', padding: 0 }}>
                                <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <ShieldCheck size={20} /> Module Permissions
                                    </div>
                                    <button
                                        type="button"
                                        className="text-button"
                                        onClick={() => handleSelectAllPermissions()}
                                        style={{ fontSize: '0.85rem', padding: '0.25rem 0.5rem' }}
                                    >
                                        {formData.permissionIds.length === permissions.length && permissions.length > 0 ? 'Deselect All' : 'Select All'}
                                    </button>
                                </div>
                                <div className="modules-grid">
                                    {Object.keys(groupedPermissions).map(moduleName => {
                                        const isExpanded = expandedPermissions[moduleName] || false;
                                        const allSelected = groupedPermissions[moduleName].every(p => formData.permissionIds.includes(p._id));

                                        return (
                                            <div key={moduleName} className="module-group">
                                                <div
                                                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isExpanded ? '1rem' : '0', cursor: 'pointer' }}
                                                    onClick={() => togglePermissionExpand(moduleName)}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <button
                                                            type="button"
                                                            className={`expand-toggle-btn ${isExpanded ? 'expanded' : ''}`}
                                                            onClick={(e) => { e.stopPropagation(); togglePermissionExpand(moduleName); }}
                                                            style={{ padding: 0 }}
                                                        >
                                                            <ChevronRight size={16} />
                                                        </button>
                                                        <h4 style={{ margin: 0, paddingBottom: 0, borderBottom: 'none' }}>{moduleName}</h4>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className="text-button"
                                                        onClick={(e) => { e.stopPropagation(); handleSelectAllPermissions(groupedPermissions[moduleName]); }}
                                                        style={{ fontSize: '0.75rem', padding: '0.25rem' }}
                                                    >
                                                        {allSelected ? 'Deselect All' : 'Select All'}
                                                    </button>
                                                </div>

                                                {isExpanded && (
                                                    <div className="checkbox-list permission-expanded-list">
                                                        {groupedPermissions[moduleName].map(perm => {
                                                            const isSelected = formData.permissionIds.includes(perm._id);
                                                            return (
                                                                <label key={perm._id} className={`premium-checkbox-label child-label ${isSelected ? 'selected' : ''}`} style={{ marginBottom: '0.25rem' }}>
                                                                    <div className="child-tree-line"></div>
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={isSelected}
                                                                        onChange={() => handleTogglePermission(perm._id)}
                                                                    />
                                                                    <span className="item-name">{perm.name}</span>
                                                                </label>
                                                            )
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )
                }
            </div >
            {isLoading && <Loader message={loadingMessage} />}
        </div >
    );
};

export default AccessControl;
