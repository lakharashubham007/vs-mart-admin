import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit3, Trash2, LayoutGrid, Package, Tags, Type, Scale, UtensilsCrossed, ChevronRight, MoreVertical, Layers, X, Filter, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import productService from '../../services/productService';
import Loader from '../../components/Loader';
import QuickCreateModal from '../../components/QuickCreateModal';
import NestedCategoryModal from '../../components/NestedCategoryModal'; // new modal
import { BASE_IMAGE_URL } from '../../config/env';

const MasterManagement = () => {
    const [activeMaster, setActiveMaster] = useState('Category');
    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [quickCreate, setQuickCreate] = useState({ isOpen: false, type: '' });
    const [nestedCategoryModal, setNestedCategoryModal] = useState(false);
    const navigate = useNavigate();
    const tabsRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    const handleMouseDown = (e) => {
        if (!tabsRef.current) return;
        setIsDragging(true);
        setStartX(e.pageX - tabsRef.current.offsetLeft);
        setScrollLeft(tabsRef.current.scrollLeft);
    };

    const handleMouseLeave = () => {
        setIsDragging(false);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleMouseMove = (e) => {
        if (!isDragging || !tabsRef.current) return;
        e.preventDefault();
        const x = e.pageX - tabsRef.current.offsetLeft;
        const walk = (x - startX) * 2; // Scroll speed
        tabsRef.current.scrollLeft = scrollLeft - walk;
    };

    const masters = [
        { name: 'Category', icon: LayoutGrid, count: 0, color: 'var(--primary)', plural: 'Categories' },
        { name: 'Brand', icon: Tags, count: 0, color: '#f59e0b', plural: 'Brands' },
        { name: 'Attribute', icon: Type, count: 0, color: '#10b981', plural: 'Attributes' },
        { name: 'VariantType', icon: Package, count: 0, color: '#6366f1', plural: 'Variant Types' },
        { name: 'Unit', icon: Scale, count: 0, color: '#ec4899', plural: 'Units' },
        { name: 'Addon', icon: UtensilsCrossed, count: 0, color: '#f43f5e', plural: 'Addons' }
    ];

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        fetchMasterData();
        setCurrentPage(1); // Reset page on tab change
    }, [activeMaster]);

    const fetchMasterData = async () => {
        setIsLoading(true);
        try {
            let result = [];
            switch (activeMaster) {
                case 'Category': result = await productService.getCategories(); break;
                case 'Brand': result = await productService.getBrands(); break;
                case 'Attribute': result = await productService.getAttributes(); break;
                case 'VariantType': result = await productService.getVariantTypes(); break;
                case 'Unit': result = await productService.getUnits(); break;
                case 'Addon': result = await productService.getAddons(); break;
            }
            setData(
                Array.isArray(result) ? result :
                    (result.categories || result.brands || result.attributes || result.variantTypes || result.units || result.addons || [])
            );
        } catch (error) {
            console.error(`Fetch ${activeMaster} failed:`, error);
            toast.error(`Failed to load ${activeMasterDetails.plural}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this?')) return;
        try {
            await productService[`delete${activeMaster}`](id);
            toast.success(`${activeMaster} deleted successfully`);
            fetchMasterData();
        } catch (error) {
            toast.error(`Failed to delete ${activeMaster}`);
        }
    };

    const handleEdit = (item) => {
        if (activeMaster === 'Category') {
            navigate(`/products/edit-category/${item._id}`);
        } else {
            toast.info(`Edit for ${activeMaster} is coming soon in modal mode.`);
        }
    };

    const handleAddNew = () => {
        if (activeMaster === 'Category') {
            console.log('Opening NestedCategoryModal from MasterManagement');
            setNestedCategoryModal(true);
        } else {
            setQuickCreate({ isOpen: true, type: activeMaster });
        }
    };

    const filteredData = data.filter(item =>
        (item.name || item.fullName || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    const activeMasterDetails = masters.find(m => m.name === activeMaster);

    const renderImage = (item) => {
        const imageUrl = item.image || item.icon || item.logo;
        if (imageUrl) {
            const fullImageUrl = imageUrl.startsWith('http') ? imageUrl : `${BASE_IMAGE_URL}/${imageUrl}`;
            return <img src={fullImageUrl} alt={item.name} />;
        }
        return <activeMasterDetails.icon size={16} />;
    };

    return (
        <div className="master-page-container fade-in">
            <div className="master-content-pane unified-card power-ui absolute-unified">
                <div className="master-card-header unified-header-compact">
                    <div className="header-main-brand">
                        <div className="brand-badge">
                            <Layers size={18} />
                        </div>
                        <div className="brand-text">
                            <h1>Masters</h1>
                            <span className="brand-tag">Management</span>
                        </div>
                    </div>

                    <div
                        className={`header-navigation-tabs ${isDragging ? 'dragging' : ''}`}
                        ref={tabsRef}
                        onMouseDown={handleMouseDown}
                        onMouseLeave={handleMouseLeave}
                        onMouseUp={handleMouseUp}
                        onMouseMove={handleMouseMove}
                    >
                        <div className="master-horizontal-tabs">
                            {masters.map(m => (
                                <button
                                    key={m.name}
                                    className={`horiz-tab ${activeMaster === m.name ? 'active' : ''}`}
                                    onClick={() => setActiveMaster(m.name)}
                                    style={{ '--accent': m.color }}
                                >
                                    <m.icon size={14} />
                                    <span>{m.plural}</span>
                                    <span className="count-badge">{data.length && activeMaster === m.name ? data.length : '0'}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="header-actions compact">
                        <div className="master-search-mini">
                            <Search size={14} />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="action-divider" />
                        <button className="icon-btn-secondary" onClick={fetchMasterData} title="Refresh">
                            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                        </button>
                        <button className="primary-compact-btn" onClick={handleAddNew}>
                            <Plus size={14} /> <span>New</span>
                        </button>
                    </div>
                </div>

                <div className="master-main-section compact">
                    <div className="master-table-wrapper">
                        <table className="master-table power-table">
                            <thead>
                                <tr>
                                    <th>{activeMaster} Information</th>
                                    <th>Status</th>
                                    <th>Created</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentItems.length > 0 ? currentItems.map((item) => (
                                    <tr key={item._id} className="master-row compact">
                                        <td>
                                            <div className="name-with-image">
                                                <div className="row-image-container">
                                                    {renderImage(item)}
                                                </div>
                                                <div className="master-cell-info compact">
                                                    <span className="master-item-name compact">{item.name || item.fullName}</span>
                                                    <span className="master-item-id compact">ID: {item._id.slice(-6).toUpperCase()}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`status-dot-compact ${item.status !== false ? 'active' : 'inactive'}`}>
                                                {item.status !== false ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="date-text-compact">
                                                {new Date(item.createdAt).toLocaleDateString()}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="master-actions compact">
                                                <button className="action-btn-compact" onClick={() => handleEdit(item)} title="Edit">
                                                    <Edit3 size={14} />
                                                </button>
                                                <button className="action-btn-compact delete" onClick={() => handleDelete(item._id)} title="Delete">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="4" className="empty-state-compact">
                                            No {activeMasterDetails.plural.toLowerCase()} found matching your criteria.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            {isLoading && <Loader />}
            <QuickCreateModal
                isOpen={quickCreate.isOpen}
                onClose={() => setQuickCreate({ isOpen: false, type: '' })}
                type={quickCreate.type}
                onSuccess={fetchMasterData}
            />

            <NestedCategoryModal
                isOpen={nestedCategoryModal}
                onClose={() => setNestedCategoryModal(false)}
                masters={{ categories: data }} // pass current categories
                onSuccess={fetchMasterData}
            />
        </div>
    );
};

export default MasterManagement;
