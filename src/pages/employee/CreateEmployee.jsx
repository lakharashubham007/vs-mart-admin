import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Shield, ArrowLeft, Save, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import employeeService from '../../services/employeeService';
import roleService from '../../services/roleService';
import Loader from '../../components/Loader';
import './Employee.css';

const CreateEmployee = () => {
    const navigate = useNavigate();
    const [roles, setRoles] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        roleId: ''
    });

    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        setIsLoading(true);
        try {
            const data = await roleService.getRoles();
            setRoles(data);
        } catch (error) {
            toast.error('Failed to load roles');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.roleId) {
            toast.error('Please select a role');
            return;
        }

        setIsSaving(true);
        try {
            await employeeService.createEmployee(formData);
            toast.success('Employee created successfully!');
            navigate('/admins/get-admins');
        } catch (error) {
            toast.error(error.message || 'Failed to create employee');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="employee-page-container fade-in">
            <div className="employee-content-pane employee-form-view">
                <header className="employee-header">
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <button className="employee-btn-icon" onClick={() => navigate(-1)} title="Back to list">
                                <ArrowLeft size={16} />
                            </button>
                            <h1>Create New Employee</h1>
                        </div>
                        <p>Configure a new administrative account with precise enterprise permissions.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button type="button" className="secondary-button" onClick={() => navigate(-1)}>Cancel</button>
                        <button type="submit" form="create-employee-form" className="primary-button" disabled={isSaving}>
                            <Save size={18} /> {isSaving ? 'Creating...' : 'Save Employee'}
                        </button>
                    </div>
                </header>

                <div className="employee-glass-card">
                    <form id="create-employee-form" className="employee-form-container" onSubmit={handleSubmit}>
                        <div className="employee-form-grid">
                            <div className="employee-form-group">
                                <label><User size={14} /> Full Name</label>
                                <div className="employee-input-wrapper">
                                    <User size={16} />
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="e.g. John Doe"
                                        className="enterprise-input"
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="employee-form-group">
                                <label><Mail size={14} /> Email Address</label>
                                <div className="employee-input-wrapper">
                                    <Mail size={16} />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="john.doe@dexterdigi.com"
                                        className="enterprise-input"
                                        required
                                        autoComplete="off"
                                    />
                                </div>
                            </div>

                            <div className="employee-form-group">
                                <label><Lock size={14} /> Security Password</label>
                                <div className="employee-input-wrapper">
                                    <Lock size={16} />
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        className="enterprise-input"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="employee-form-group">
                                <label><Shield size={14} /> Access Role</label>
                                <div className="employee-input-wrapper">
                                    <Shield size={16} />
                                    <select
                                        name="roleId"
                                        value={formData.roleId}
                                        onChange={handleChange}
                                        className="enterprise-select"
                                        required
                                    >
                                        <option value="">Select an enterprise role</option>
                                        {roles.map(role => (
                                            <option key={role._id} value={role._id}>
                                                {role.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
            {(isLoading || isSaving) && <Loader message={isSaving ? "Finalizing Employee..." : ""} />}
        </div>
    );
};

export default CreateEmployee;
