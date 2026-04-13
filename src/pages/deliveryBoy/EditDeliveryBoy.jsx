import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
    ArrowLeft, Save, User, MapPin, 
    Image as ImageIcon, X, Search, Navigation,
    Eye, EyeOff
} from 'lucide-react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import toast from 'react-hot-toast';
import deliveryBoyService from '../../services/deliveryBoyService';
import roleService from '../../services/roleService';
import Loader from '../../components/Loader';
import CustomSelect from '../../components/CustomSelect';
import { BASE_URL, GOOGLE_MAPS_API_KEY } from '../../config/env';
import './DeliveryBoy.css';

const libraries = ['places'];
const mapContainerStyle = {
    width: '100%',
    height: '350px',
    borderRadius: '12px'
};

const EditDeliveryBoy = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        mobile: '',
        alternateMobile: '',
        email: '',
        personalEmail: '',
        password: '',
        confirmPassword: '',
        roleId: '',
        fullAddress: '',
        latitude: 24.585445,
        longitude: 73.712479
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isAutoRole, setIsAutoRole] = useState(false);
    const [roles, setRoles] = useState([]);
    const [isDataLoaded, setIsDataLoaded] = useState(false);

    const [profileImage, setProfileImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [predictions, setPredictions] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [isDraggingMap, setIsDraggingMap] = useState(false);
    const [mapCenter, setMapCenter] = useState({ lat: 24.585445, lng: 73.712479 });

    const firstNameRef = useRef(null);
    const mobileRef = useRef(null);
    const addressRef = useRef(null);
    const mapRef = useRef(null);
    const autocompleteService = useRef(null);
    const placesService = useRef(null);

    // Google Maps Loader
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        libraries
    });

    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const res = await roleService.getRoles();
                setRoles(Array.isArray(res) ? res : (res.roles || []));
            } catch (error) {
                console.error('Failed to fetch roles:', error);
            }
        };
        fetchRoles();
        fetchDeliveryBoy();
    }, [id]);

    const fetchDeliveryBoy = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await deliveryBoyService.getById(id);
            const boy = data.data;
            const fetchedRoleId = boy.roleId?._id || boy.roleId || '';
            
            setFormData({
                firstName: boy.firstName,
                lastName: boy.lastName,
                mobile: boy.mobile,
                alternateMobile: boy.alternateMobile || '',
                email: boy.email,
                personalEmail: boy.personalEmail || '',
                password: '',
                confirmPassword: '',
                roleId: fetchedRoleId,
                fullAddress: boy.address?.fullAddress || '',
                latitude: boy.address?.latitude || 24.585445,
                longitude: boy.address?.longitude || 73.712479
            });

            // Improved role detection: Check populated name or search in roles array
            let roleName = boy.roleId?.name?.toLowerCase() || '';
            
            // If name is not populated, find it in the roles list we fetched
            if (!roleName && fetchedRoleId) {
                const foundRole = roles.find(r => r._id === fetchedRoleId);
                if (foundRole) roleName = foundRole.name.toLowerCase();
            }

            if (roleName.includes('delivery') || roleName.includes('boy') || roleName.includes('agent')) {
                setIsAutoRole(true);
            }

            setMapCenter({
                lat: boy.address?.latitude || 24.585445,
                lng: boy.address?.longitude || 73.712479
            });
            if (boy.profileImage) {
                setPreview(`${BASE_URL.replace('/v1', '')}/${boy.profileImage}`);
            }
            if (boy.address?.fullAddress) {
                setSearchQuery(boy.address.fullAddress);
            }
            setIsDataLoaded(true);
        } catch {
            toast.error('Failed to fetch delivery boy details');
            navigate('/delivery-boy/list');
        } finally {
            setIsLoading(false);
        }
    }, [id, navigate, roles]); // Added roles to dependencies

    // Reactive check for role locking when roles are loaded or roleId changes
    useEffect(() => {
        if (roles.length > 0 && formData.roleId) {
            let roleName = '';
            const foundRole = roles.find(r => r._id === formData.roleId);
            if (foundRole) roleName = foundRole.name.toLowerCase();

            if (roleName.includes('delivery') || roleName.includes('boy') || roleName.includes('agent')) {
                setIsAutoRole(true);
            }
        }
    }, [roles, formData.roleId]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        // Limit mobile numbers to 10 digits
        if (name === 'mobile' || name === 'alternateMobile') {
            const numericValue = value.replace(/\D/g, ''); // Remove non-numbers
            if (numericValue.length > 10) return;
            setFormData(prev => ({ ...prev, [name]: numericValue }));
            return;
        }

        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfileImage(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const removeImage = () => {
        setProfileImage(null);
        setPreview(null);
    };

    const onSearchChange = (e) => {
        const value = e.target.value;
        setSearchQuery(value);

        if (!value) {
            setPredictions([]);
            setShowDropdown(false);
            return;
        }

        if (!autocompleteService.current && window.google) {
            autocompleteService.current = new window.google.maps.places.AutocompleteService();
        }

        if (autocompleteService.current) {
            autocompleteService.current.getPlacePredictions(
                { input: value },
                (results, status) => {
                    if (status === 'OK' && results) {
                        setPredictions(results);
                        setShowDropdown(true);
                    } else {
                        setPredictions([]);
                        setShowDropdown(false);
                    }
                }
            );
        }
    };

    const handleSelectPrediction = (prediction) => {
        setSearchQuery(prediction.description);
        setShowDropdown(false);

        if (!placesService.current && mapRef.current) {
            placesService.current = new window.google.maps.places.PlacesService(mapRef.current);
        }

        if (placesService.current) {
            placesService.current.getDetails(
                { placeId: prediction.place_id },
                (place, status) => {
                    if (status === 'OK' && place.geometry) {
                        const location = place.geometry.location;
                        const newCoords = {
                            lat: location.lat(),
                            lng: location.lng()
                        };
                        setFormData(prev => ({
                            ...prev,
                            fullAddress: place.formatted_address,
                            latitude: newCoords.lat,
                            longitude: newCoords.lng
                        }));
                        setMapCenter(newCoords); // Only update state-center on search
                        mapRef.current?.panTo(newCoords);
                    }
                }
            );
        }
    };

    const onMapIdle = () => {
        // Only trigger geocoding if a drag interaction just finished
        if (isDataLoaded && isDraggingMap && mapRef.current) {
            const center = mapRef.current.getCenter();
            const lat = center.lat();
            const lng = center.lng();
            
            setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));

            // Reverse geocode
            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode({ location: { lat, lng } }, (results, status) => {
                if (status === 'OK' && results[0]) {
                    const addr = results[0].formatted_address;
                    setFormData(prev => ({ ...prev, fullAddress: addr }));
                    setSearchQuery(addr);
                }
            });
        }
        setIsDraggingMap(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Specific field validation with focus
        if (!formData.firstName) {
            toast.error('First Name is empty');
            firstNameRef.current?.focus();
            return;
        }
        if (!formData.mobile) {
            toast.error('Mobile Number is empty');
            mobileRef.current?.focus();
            return;
        }
        if (formData.mobile.length !== 10) {
            toast.error('Mobile Number must be 10 digits');
            mobileRef.current?.focus();
            return;
        }
        if (!formData.fullAddress) {
            toast.error('Address is empty');
            addressRef.current?.focus();
            return;
        }

        if (formData.password && formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (!formData.roleId) {
            toast.error('Role ID is required');
            return;
        }

        setIsLoading(true);
        try {
            const data = new FormData();
            data.append('firstName', formData.firstName);
            data.append('lastName', formData.lastName);
            data.append('mobile', formData.mobile);
            data.append('alternateMobile', formData.alternateMobile);
            data.append('email', formData.email);
            data.append('personalEmail', formData.personalEmail);
            data.append('roleId', formData.roleId);
            
            if (formData.password) {
                data.append('password', formData.password);
            }
            
            const addressData = {
                fullAddress: formData.fullAddress,
                latitude: formData.latitude,
                longitude: formData.longitude
            };
            data.append('address', JSON.stringify(addressData));
            
            if (profileImage) {
                data.append('profileImage', profileImage);
            }

            await deliveryBoyService.update(id, data);
            toast.success('Delivery Boy updated successfully');
            navigate('/delivery-boy/list');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update delivery boy');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="delivery-page-container fade-in">
            <header className="internal-page-header">
                <div>
                    <div className="breadcrumb">
                        <button onClick={() => navigate(-1)} className="back-btn">
                            <ArrowLeft size={18} />
                        </button>
                        <span>Delivery Management / Edit Boy</span>
                    </div>
                    <h1>Update Delivery Boy</h1>
                </div>
                <button className="primary-button" onClick={handleSubmit}>
                    <Save size={18} /> Update Details
                </button>
            </header>

            <div className="delivery-form-grid">
                <div className="form-card glass">
                    <h3 className="section-title"><User size={18} /> Basic Information</h3>
                    <div className="profile-upload-section">
                        <div className="image-preview-container">
                            {preview ? (
                                <>
                                    <img src={preview} alt="Profile" className="profile-preview-img" />
                                    <button className="remove-img-btn" onClick={removeImage}><X size={14} /></button>
                                </>
                            ) : (
                                <div className="image-placeholder">
                                    <ImageIcon size={40} />
                                    <span>Upload Photo</span>
                                    <input type="file" accept="image/*" onChange={handleImageChange} className="file-input" />
                                </div>
                            )}
                        </div>
                        <p className="upload-hint">Upload a professional profile photo for the delivery boy.</p>
                    </div>

                    <div className="input-grid">
                        <div className="form-group">
                            <label>First Name *</label>
                            <input 
                                ref={firstNameRef}
                                name="firstName" 
                                value={formData.firstName} 
                                onChange={handleInputChange} 
                                placeholder="John" 
                                className="form-input" 
                            />
                        </div>
                        <div className="form-group">
                            <label>Last Name</label>
                            <input name="lastName" value={formData.lastName} onChange={handleInputChange} placeholder="Doe" className="form-input" />
                        </div>
                        <div className="form-group">
                            <label>Mobile Number *</label>
                            <input 
                                ref={mobileRef}
                                name="mobile" 
                                value={formData.mobile} 
                                onChange={handleInputChange} 
                                placeholder="9876543210" 
                                className="form-input" 
                                maxLength={10}
                            />
                        </div>
                        <div className="form-group">
                            <label>Alternate Mobile</label>
                            <input 
                                name="alternateMobile" 
                                value={formData.alternateMobile} 
                                onChange={handleInputChange} 
                                placeholder="9876543210" 
                                className="form-input" 
                                maxLength={10}
                            />
                        </div>
                        <div className="form-group">
                            <label>Login Email Address *</label>
                            <input name="email" value={formData.email} onChange={handleInputChange} placeholder="login@vs.com" className="form-input" required />
                        </div>
                        <div className="form-group">
                            <label>Personal Email</label>
                            <input name="personalEmail" value={formData.personalEmail} onChange={handleInputChange} placeholder="personal@gmail.com" className="form-input" />
                        </div>
                        <div className="form-group password-group">
                            <label>New Password (Optional)</label>
                            <div className="password-input-wrapper">
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    name="password" 
                                    value={formData.password} 
                                    onChange={handleInputChange} 
                                    placeholder="••••••••" 
                                    className="form-input" 
                                />
                                <button 
                                    type="button" 
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                        <div className="form-group password-group">
                            <label>Confirm New Password</label>
                            <div className="password-input-wrapper">
                                <input 
                                    type={showConfirmPassword ? "text" : "password"} 
                                    name="confirmPassword" 
                                    value={formData.confirmPassword} 
                                    onChange={handleInputChange} 
                                    placeholder="••••••••" 
                                    className="form-input" 
                                />
                                <button 
                                    type="button" 
                                    className="password-toggle"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                        <div className="form-group full-width-group">
                            <label>Assigned Role *</label>
                            <CustomSelect
                                options={roles.map(r => ({ value: r._id, label: r.name }))}
                                value={formData.roleId}
                                onChange={(val) => setFormData(prev => ({ ...prev, roleId: val }))}
                                placeholder="Select Role"
                                disabled={isAutoRole}
                            />
                        </div>
                    </div>
                </div>

                <div className="form-card glass">
                    <h3 className="section-title"><MapPin size={18} /> Work Location & Address</h3>
                    <div className="map-picker-section">
                        {isLoaded ? (
                            <div className="map-wrapper" onClick={() => setShowDropdown(false)}>
                                <div className="map-search-container" onClick={e => e.stopPropagation()}>
                                    <div className="search-input-wrapper">
                                        <Search size={18} className="search-icon" style={{ color: 'hsl(var(--primary))' }} />
                                        <input
                                            type="text"
                                            placeholder="Search location to pin..."
                                            className="map-search-input"
                                            value={searchQuery}
                                            onChange={onSearchChange}
                                            onFocus={() => searchQuery && setShowDropdown(true)}
                                        />
                                    </div>
                                    
                                    {showDropdown && predictions.length > 0 && (
                                        <div className="search-results-dropdown fade-in">
                                            {predictions.map((p) => (
                                                <div 
                                                    key={p.place_id} 
                                                    className="search-result-item"
                                                    onClick={() => handleSelectPrediction(p)}
                                                >
                                                    <MapPin size={16} className="result-icon" />
                                                    <div className="result-text">
                                                        <span className="main-text">{p.structured_formatting.main_text}</span>
                                                        <span className="secondary-text">{p.structured_formatting.secondary_text}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <GoogleMap
                                    mapContainerStyle={mapContainerStyle}
                                    center={mapCenter}
                                    zoom={15}
                                    onLoad={map => mapRef.current = map}
                                    onDragStart={() => setIsDraggingMap(true)}
                                    onIdle={onMapIdle}
                                    options={{
                                        disableDefaultUI: true,
                                        zoomControl: true,
                                    }}
                                >
                                </GoogleMap>

                                {/* Center Pin Overlay */}
                                <div className={`center-pin-container ${isDraggingMap ? 'lifting' : ''}`}>
                                    <div className="pin-coord-badge">
                                        {formData.latitude.toFixed(5)}, {formData.longitude.toFixed(5)}
                                    </div>
                                    <img 
                                        src="https://maps.google.com/mapfiles/ms/icons/green-dot.png" 
                                        alt="Pin" 
                                        className="custom-pin-icon" 
                                    />
                                    <div className="pin-shadow"></div>
                                </div>
                            </div>
                        ) : (
                            <div className="map-loading-placeholder">
                                <Navigation className="spin" />
                                <p>Loading Maps...</p>
                            </div>
                        )}
                        
                        <div className="form-group" style={{ marginTop: '1.5rem' }}>
                            <label>Selected Full Address *</label>
                            <textarea 
                                ref={addressRef}
                                name="fullAddress" 
                                value={formData.fullAddress} 
                                onChange={handleInputChange} 
                                placeholder="Start typing in search box or drag marker..." 
                                className="form-input form-textarea"
                            />
                        </div>
                        
                        <div className="coord-grid">
                            <div className="coord-box">
                                <label>Latitude</label>
                                <span>{formData.latitude.toFixed(6)}</span>
                            </div>
                            <div className="coord-box">
                                <label>Longitude</label>
                                <span>{formData.longitude.toFixed(6)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {isLoading && <Loader />}
        </div>
    );
};

export default EditDeliveryBoy;
