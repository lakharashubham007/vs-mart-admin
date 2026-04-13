import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2, ShoppingBag, Sparkles, Zap, ShoppingCart, Package, Coffee, Utensils, Store } from 'lucide-react';
import './Login.css';

const Login = () => {
    const [loginType, setLoginType] = useState('staff'); // 'staff' or 'delivery'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    // Memoize background elements data once to keep animations stable during re-renders
    const rainData = useMemo(() => Array.from({ length: 20 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 5}s`,
        duration: `${2 + Math.random() * 3}s`
    })), []);

    const bubbleData = useMemo(() => Array.from({ length: 15 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        size: `${30 + Math.random() * 80}px`,
        delay: `${Math.random() * 10}s`,
        duration: `${15 + Math.random() * 10}s`
    })), []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await login(email, password, loginType);
            navigate('/');
        } catch (err) {
            setError(err.message || 'Invalid email or password');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`login-page-wrapper theme-${loginType}`}>
            {/* Advanced Background Layer */}
            <div className="ecommerce-visual-layer">
                <div className="glow-orb orb-1"></div>
                <div className="glow-orb orb-2"></div>

                {/* Floating Icons Layer - Dynamically switch based on loginType */}
                <div className="floating-marketplace-icons">
                    {loginType === 'staff' ? (
                        <>
                            <div className="float-icon pos-1"><ShoppingCart size={40} /></div>
                            <div className="float-icon pos-2"><Package size={32} /></div>
                            <div className="float-icon pos-3"><Coffee size={28} /></div>
                            <div className="float-icon pos-4"><Utensils size={36} /></div>
                            <div className="float-icon pos-5"><Store size={44} /></div>
                            <div className="float-icon pos-6"><ShoppingBag size={30} /></div>
                        </>
                    ) : (
                        <>
                            <div className="float-icon pos-1"><Zap size={40} /></div>
                            <div className="float-icon pos-2"><Package size={32} /></div>
                            <div className="float-icon pos-3"><Sparkles size={28} /></div>
                            <div className="float-icon pos-4"><Zap size={36} /></div>
                            <div className="float-icon pos-5"><Package size={44} /></div>
                            <div className="float-icon pos-6"><Sparkles size={30} /></div>
                        </>
                    )}
                </div>

                <div className="water-rain">
                    {rainData.map(drop => (
                        <div
                            key={drop.id}
                            className="rain-drop"
                            style={{
                                left: drop.left,
                                animationDelay: drop.delay,
                                animationDuration: drop.duration
                            }}
                        ></div>
                    ))}
                </div>

                <div className="floating-elements">
                    {bubbleData.map(bubble => (
                        <div
                            key={bubble.id}
                            className="eco-bubble pump-up"
                            style={{
                                left: bubble.left,
                                width: bubble.size,
                                height: bubble.size,
                                animationDelay: bubble.delay,
                                animationDuration: bubble.duration
                            }}
                        ></div>
                    ))}
                </div>
            </div>

            <div className="login-container">
                <div className="login-card glass-premium">
                    <div className="login-type-tabs">
                        <button 
                            className={`tab-btn ${loginType === 'staff' ? 'active' : ''}`}
                            onClick={() => { setLoginType('staff'); setError(''); }}
                        >
                            Staff Login
                        </button>
                        <button 
                            className={`tab-btn ${loginType === 'delivery' ? 'active' : ''}`}
                            onClick={() => { setLoginType('delivery'); setError(''); }}
                        >
                            Delivery Partner
                        </button>
                    </div>

                    <div className="login-header">
                        <div className="ecommerce-brand">
                            <div className="brand-icon-wrapper">
                                {loginType === 'staff' ? <ShoppingBag size={32} /> : <Package size={32} />}
                                <div className="sparkle-overlay"><Sparkles size={16} /></div>
                            </div>
                            <div className="brand-glow"></div>
                        </div>
                        <h1 className="premium-title">
                            {loginType === 'staff' ? 'VS MART Admin' : 'Delivery Portal'}
                        </h1>
                        <p className="powered-by-text" style={{ fontSize: '0.65rem', color: 'hsl(var(--muted-foreground))', marginTop: '-0.3rem', letterSpacing: '1px', textAlign: 'center' }}>POWERED BY DEXTERDIGI.COM</p>
                        <p className="premium-subtitle" style={{ marginTop: '0.5rem' }}>
                            {loginType === 'staff' ? 'Manage your luxury retail empire' : 'Deliver happiness to customers'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="login-form">
                        {error && (
                            <div className="premium-error-toast">
                                <Zap size={14} />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="premium-field-group">
                            <label>{loginType === 'staff' ? 'Administrator Email' : 'Partner Email'}</label>
                            <div className="premium-input-container">
                                <Mail size={18} className="field-icon" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder={loginType === 'staff' ? "admin@vs-mart.com" : "partner@vs-mart.com"}
                                    required
                                />
                            </div>
                        </div>

                        <div className="premium-field-group">
                            <label>Secure Key</label>
                            <div className="premium-input-container">
                                <Lock size={18} className="field-icon" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-extra-actions">
                            <label className="checkbox-container">
                                <input type="checkbox" />
                                <span className="checkmark"></span>
                                <span className="label-text">Keep me signed in</span>
                            </label>
                            <button type="button" className="forgot-key-btn">Reset Access?</button>
                        </div>

                        <button type="submit" className={`ecommerce-login-btn action-${loginType}`} disabled={isLoading}>
                            {isLoading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <>
                                    <span>{loginType === 'staff' ? 'Enter Marketplace' : 'Start Delivering'}</span>
                                    <Zap size={18} fill="currentColor" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="login-footer-branding">
                        <p className="copyright">© 2026 VS MART</p>
                        <div className="trust-badges">
                            <div className="badge-item"><Lock size={10} /> Validated</div>
                            <div className="badge-separator"></div>
                            <div className="badge-item">v3.4.0 High-Performance</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
