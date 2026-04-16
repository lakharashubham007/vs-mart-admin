import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { 
    ShoppingBag, Zap, ChevronRight, Package, Truck, 
    ShieldCheck, Star, Heart, Share2, ArrowLeft, 
    Plus, Minus, ShoppingCart 
} from 'lucide-react';
import Loader from '../components/Loader';
import { BASE_URL } from '../config/env';

const PublicProductView = () => {
    const { slug } = useParams();
    const [searchParams] = useSearchParams();
    const variantId = searchParams.get('v');

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [qty, setQty] = useState(1);
    const [isAdded, setIsAdded] = useState(false);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const url = `${BASE_URL}/public/product-details/${slug}${variantId ? `?v=${variantId}` : ''}`;
                const response = await fetch(url);
                const result = await response.json();

                if (result.success) {
                    setProduct(result);
                } else {
                    setError(result.message || 'Product not found');
                }
            } catch (err) {
                console.error('Fetch error:', err);
                setError('Failed to load product details');
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [slug, variantId]);

    const handleAddToCart = () => {
        setIsAdded(true);
        setTimeout(() => setIsAdded(false), 2000);
    };

    if (loading) return <Loader />;
    if (error) return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-6 text-center">
            <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl max-w-sm w-full border border-red-100">
                <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Package size={40} />
                </div>
                <h1 className="text-3xl font-black text-slate-800 mb-3">Oops!</h1>
                <p className="text-slate-500 mb-8 leading-relaxed">{error}</p>
                <a href="/" className="inline-block bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold transition-transform hover:scale-105 active:scale-95 shadow-lg">Go to Home</a>
            </div>
        </div>
    );

    const { data, deepLink } = product;

    return (
        <div className="premium-landing-container">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');

                :root {
                    --primary: #1A6B3A;
                    --primary-light: #2D9A54;
                    --primary-dark: #064E3B;
                    --accent: #FFD700;
                    --white: #FFFFFF;
                    --bg-soft: #F0F9F4;
                    --text-main: #111827;
                    --text-soft: #4B5563;
                    --glass: rgba(255, 255, 255, 0.85);
                }

                .premium-landing-container {
                    height: 100vh;
                    overflow-y: auto;
                    -webkit-overflow-scrolling: touch;
                    background: var(--bg-soft);
                    font-family: 'Outfit', sans-serif;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    position: relative;
                }
                
                body, html {
                    margin: 0;
                    padding: 0;
                    overflow: hidden;
                    height: 100%;
                }

                /* Decorative Background Blobs */
                .blob {
                    position: absolute;
                    filter: blur(80px);
                    z-index: 0;
                    border-radius: 50%;
                    opacity: 0.6;
                    pointer-events: none;
                }
                .blob-1 { top: -100px; right: -100px; width: 400px; height: 400px; background: var(--primary-light); }
                .blob-2 { bottom: 10%; left: -150px; width: 500px; height: 500px; background: #DAF5E6; }

                /* Header */
                .header {
                    width: 100%;
                    max-width: 500px;
                    padding: 1.5rem;
                    display: flex;
                    justify-content: center; /* Center the logo */
                    align-items: center;
                    z-index: 10;
                }
                .header-logo {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-weight: 900;
                    font-size: 1.4rem;
                    color: var(--primary-dark);
                    letter-spacing: 0.05em;
                }
                .icon-circle {
                    width: 40px;
                    height: 40px;
                    background: var(--white);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                    color: var(--text-main);
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .icon-circle:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.1); }

                /* Main Content Card */
                .content-card {
                    width: 92%;
                    max-width: 480px;
                    background: var(--white);
                    border-radius: 3rem;
                    padding: 1rem;
                    box-shadow: 0 30px 60px -12px rgba(26, 107, 58, 0.12);
                    z-index: 5;
                    margin-top: 1rem;
                    margin-bottom: 2rem;
                    position: relative;
                }

                /* Image Gallery UI */
                .image-container {
                    width: 100%;
                    aspect-ratio: 1;
                    background: #F8FAFC;
                    border-radius: 2.5rem;
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                }
                .image-container img {
                    width: 75%;
                    height: 75%;
                    object-fit: contain;
                    transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .image-container:hover img { transform: scale(1.1); }

                .badge-floating {
                    position: absolute;
                    top: 1.5rem;
                    left: 1.5rem;
                    background: var(--white);
                    padding: 0.5rem 1rem;
                    border-radius: 1rem;
                    font-size: 0.75rem;
                    font-weight: 800;
                    color: var(--primary);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
                    text-transform: uppercase;
                }

                .discount-pill {
                    position: absolute;
                    top: 1.5rem;
                    right: 1.5rem;
                    background: #ff4b4b;
                    color: var(--white);
                    padding: 0.5rem 1rem;
                    border-radius: 1rem;
                    font-weight: 900;
                    font-size: 0.875rem;
                    box-shadow: 0 8px 20px rgba(255, 75, 75, 0.3);
                }

                /* Text Content */
                .details-wrap {
                    padding: 2rem 1.5rem 1.5rem;
                }
                .category-label {
                    color: var(--primary);
                    font-size: 0.8rem;
                    font-weight: 800;
                    letter-spacing: 0.1em;
                    text-transform: uppercase;
                    margin-bottom: 0.5rem;
                    display: block;
                }
                .prod-title {
                    font-size: 2rem;
                    font-weight: 900;
                    color: var(--text-main);
                    line-height: 1.1;
                    margin-bottom: 0.75rem;
                    letter-spacing: -0.02em;
                }
                .rating-line {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-bottom: 1rem;
                }
                .stars { display: flex; color: var(--accent); gap: 2px; }
                .reviewer-count { font-size: 0.85rem; color: var(--text-soft); font-weight: 600; }

                .price-grid {
                    display: flex;
                    align-items: baseline;
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                }
                .price-actual { font-size: 2.5rem; font-weight: 900; color: var(--text-main); letter-spacing: -0.04em; }
                .price-mrp { font-size: 1.1rem; color: var(--text-soft); text-decoration: line-through; }

                /* App Promotion Footer */
                .app-promo-bar {
                    position: sticky;
                    bottom: 1.5rem;
                    width: 90%;
                    max-width: 440px;
                    background: var(--primary-dark);
                    padding: 1rem 1.25rem;
                    border-radius: 2rem;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    color: var(--white);
                    box-shadow: 0 20px 40px rgba(0,0,0,0.3);
                    z-index: 100;
                    margin-top: 1rem;
                    margin-bottom: 1rem;
                    animation: slideUp 0.6s cubic-bezier(0.23, 1, 0.32, 1);
                }
                @keyframes slideUp { from { transform: translate(-50%, 100px); opacity: 0; } to { transform: translate(0, 0); opacity: 1; } }

                .app-info { display: flex; align-items: center; gap: 0.75rem; }
                .app-logo-mini { width: 44px; height: 44px; background: var(--white); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: var(--primary-dark); }
                .app-text p { margin: 0; font-size: 0.75rem; opacity: 0.8; font-weight: 600; }
                .app-text h4 { margin: 0; font-size: 1rem; font-weight: 900; }

                .open-app-link {
                    background: var(--accent);
                    color: #000;
                    padding: 0.75rem 1.25rem;
                    border-radius: 1.25rem;
                    font-weight: 900;
                    font-size: 0.85rem;
                    text-decoration: none;
                    box-shadow: 0 8px 15px rgba(255, 215, 0, 0.3);
                    transition: transform 0.2s;
                }
                .open-app-link:hover { transform: scale(1.05); }

                /* Trust Features */
                .trust-badges {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 0.75rem;
                    margin-top: 0;
                }
                .trust-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 1rem 0.5rem;
                    background: var(--bg-soft);
                    border-radius: 1.5rem;
                    border: 1px solid rgba(0,0,0,0.03);
                }
                .trust-icon { color: var(--primary); }
                .trust-text { font-size: 0.6rem; font-weight: 900; color: var(--text-soft); text-transform: uppercase; }

            `}</style>

            <div className="blob blob-1"></div>
            <div className="blob blob-2"></div>

            <header className="header">
                <div className="header-logo">
                    <ShoppingBag size={26} fill="currentColor" />
                    <span>VS MART</span>
                </div>
            </header>

            <main className="content-card">
                <div className="image-container">
                    <span className="badge-floating">Exclusive</span>
                    {data.discountPercentage > 0 && (
                        <div className="discount-pill">-{data.discountPercentage}%</div>
                    )}
                    <img
                        src={data.image}
                        alt={data.name}
                        onError={(e) => {
                            e.target.src = 'https://placehold.co/600x600/FFFFFF/1A6B3A?text=Product+Image';
                        }}
                    />
                </div>

                <div className="details-wrap">
                    <span className="category-label">Fresh & Premium</span>
                    <h1 className="prod-title">{data.name}</h1>
                    
                    <div className="rating-line">
                        <div className="stars">
                            {[1, 2, 3, 4, 5].map(i => <Star key={i} size={14} fill="currentColor" />)}
                        </div>
                        <span className="reviewer-count">(120+ Reviews)</span>
                        {data.variantText && (
                            <span className="ml-auto bg-[#F0FDF4] text-[#166534] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                                {data.variantText}
                            </span>
                        )}
                    </div>

                    <div className="price-grid">
                        <span className="price-actual">₹{data.price}</span>
                        {data.mrp > data.price && (
                            <span className="price-mrp">₹{data.mrp}</span>
                        )}
                    </div>

                    <p className="text-slate-500 text-sm leading-relaxed mb-6">
                        Experience the finest quality {data.name} picked just for you. 
                        Premium quality, locally sourced, and delivered with care.
                    </p>

                    <div className="trust-badges">
                        <div className="trust-item">
                            <Truck size={20} className="trust-icon" />
                            <span className="trust-text">Fast Delivery</span>
                        </div>
                        <div className="trust-item">
                            <ShieldCheck size={20} className="trust-icon" />
                            <span className="trust-text">100% Secure</span>
                        </div>
                        <div className="trust-item">
                            <Package size={20} className="trust-icon" />
                            <span className="trust-text">Stay Fresh</span>
                        </div>
                    </div>
                </div>
            </main>

            <section className="app-promo-bar">
                <div className="app-info">
                    <div className="app-logo-mini">
                        <Zap size={24} fill="currentColor" />
                    </div>
                    <div className="app-text">
                        <p>Unlock 20% OFF</p>
                        <h4>Get the App</h4>
                    </div>
                </div>
                <a href={deepLink} className="open-app-link">
                    DOWNLOAD
                </a>
            </section>
        </div>
    );
};

export default PublicProductView;
