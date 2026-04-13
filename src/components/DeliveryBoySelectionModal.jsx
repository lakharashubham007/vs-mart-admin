import { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { 
    X, Search, Phone, User, CheckCircle2, 
    ArrowRight, MapPin, Truck
} from 'lucide-react';
import toast from 'react-hot-toast';
import deliveryBoyService from '../services/deliveryBoyService';
import Loader from './Loader';
import { BASE_URL } from '../config/env';
import './DeliveryBoySelectionModal.css';

const DeliveryBoySelectionModal = ({ isOpen, onClose, onSelect, orderId }) => {
    const [deliveryBoys, setDeliveryBoys] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBoy, setSelectedBoy] = useState(null);
    const [isAssigning, setIsAssigning] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchDeliveryBoys();
        }
    }, [isOpen]);

    const fetchDeliveryBoys = async () => {
        setLoading(true);
        try {
            const data = await deliveryBoyService.getAll({ limit: 100 });
            // Only show active delivery boys
            const activeBoys = (data.data || []).filter(boy => boy.status);
            setDeliveryBoys(activeBoys);
        } catch (error) {
            toast.error('Failed to load delivery boys');
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async () => {
        if (!selectedBoy) return;
        
        setIsAssigning(true);
        try {
            await deliveryBoyService.assignOrder(orderId, selectedBoy._id);
            toast.success(`Successfully assigned to ${selectedBoy.firstName}`);
            onSelect(selectedBoy);
            onClose();
        } catch (error) {
            toast.error(error.message || 'Failed to assign order');
        } finally {
            setIsAssigning(false);
        }
    };

    const filteredBoys = deliveryBoys.filter(boy => 
        `${boy.firstName} ${boy.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        boy.mobile.includes(searchTerm)
    );

    if (!isOpen) return null;

    const modalContent = (
        <div className="delivery-modal-overlay" onClick={onClose}>
            <div className="delivery-selection-modal fade-in-up" onClick={e => e.stopPropagation()}>
                <header className="delivery-modal-header">
                    <div className="header-title">
                        <div className="icon-box">
                            <Truck size={20} />
                        </div>
                        <div>
                            <h2>Assign Delivery Boy</h2>
                            <p>Select a courier for Order #{orderId.slice(-6).toUpperCase()}</p>
                        </div>
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </header>

                <div className="delivery-modal-search">
                    <Search size={18} />
                    <input 
                        type="text" 
                        placeholder="Search by name or mobile number..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="delivery-boys-grid custom-scrollbar">
                    {loading ? (
                        <div className="modal-loader-container">
                            <Loader />
                        </div>
                    ) : filteredBoys.length > 0 ? (
                        filteredBoys.map((boy) => (
                            <div 
                                key={boy._id} 
                                className={`delivery-boy-card ${selectedBoy?._id === boy._id ? 'selected' : ''}`}
                                onClick={() => setSelectedBoy(boy)}
                            >
                                <div className="card-selection-indicator">
                                    <CheckCircle2 size={16} />
                                </div>
                                <div className="boy-avatar">
                                    {boy.profileImage ? (
                                        <img src={`${BASE_URL.replace('/v1', '')}/${boy.profileImage}`} alt={boy.firstName} />
                                    ) : (
                                        <User size={24} />
                                    )}
                                </div>
                                <div className="boy-info">
                                    <h3>{boy.firstName} {boy.lastName}</h3>
                                    <div className="contact-info">
                                        <Phone size={12} />
                                        <span>{boy.mobile}</span>
                                    </div>
                                    <div className="location-info">
                                        <MapPin size={12} />
                                        <span>{boy.address?.fullAddress?.split(',')[0] || 'Available'}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="empty-state">
                            <Truck size={40} />
                            <p>No active delivery boys found</p>
                        </div>
                    )}
                </div>

                <footer className="delivery-modal-footer">
                    <button className="cancel-btn" onClick={onClose}>
                        Cancel
                    </button>
                    <button 
                        className="assign-btn" 
                        disabled={!selectedBoy || isAssigning}
                        onClick={handleAssign}
                    >
                        {isAssigning ? 'Assigning...' : 'Confirm Assignment'}
                        <ArrowRight size={18} />
                    </button>
                </footer>
            </div>
        </div>
    );

    return ReactDOM.createPortal(modalContent, document.body);
};

export default DeliveryBoySelectionModal;
