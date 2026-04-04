import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { ShoppingBag, Zap, ChevronRight, Package, Truck, ShieldCheck } from 'lucide-react';
import Loader from '../components/Loader';
import { BASE_URL } from '../config/env';

const PublicProductView = () => {
    const { slug } = useParams();
    const [searchParams] = useSearchParams();
    const variantId = searchParams.get('v');

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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

    if (loading) return <Loader />;
    if (error) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center">
            <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full border border-red-100">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package size={32} />
                </div>
                <h1 className="text-2xl font-bold text-slate-800 mb-2">Oops!</h1>
                <p className="text-slate-500 mb-6">{error}</p>
                <a href="/" className="inline-block bg-slate-800 text-white px-6 py-3 rounded-xl font-semibold">Go to Home</a>
            </div>
        </div>
    );

    const { data, deepLink } = product;

    return (
        <div className="public-landing-wrapper">
            <style>{`
                .public-landing-wrapper {
                    --primary: #1A6B3A;
                    --primary-hover: #155a30;
                    --glass: rgba(255, 255, 255, 0.92);
                    min-height: 100vh;
                    height: auto;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: flex-start;
                    padding: 4rem 1.25rem 12rem; /* Even more bottom space */
                    background: linear-gradient(135deg, #1A6B3A 0%, #064E3B 100%);
                    font-family: 'Outfit', sans-serif;
                    position: relative;
                    width: 100%;
                }
                html, body {
                    height: auto !important;
                    overflow: auto !important;
                    margin: 0;
                    padding: 0;
                }
                .public-landing-wrapper::before {
                    content: '';
                    position: absolute;
                    top: -10%; left: -10%;
                    width: 50%; height: 50%;
                    background: rgba(45, 154, 84, 0.4);
                    filter: blur(120px);
                    border-radius: 50%;
                    z-index: 0;
                    pointer-events: none;
                }
                .landing-card {
                    background: var(--glass);
                    backdrop-filter: blur(40px);
                    -webkit-backdrop-filter: blur(40px);
                    border-radius: 2.5rem;
                    padding: 2.5rem 2rem;
                    width: 92%; /* Slightly narrower for floating feel */
                    max-width: 450px;
                    margin: 2rem 0; /* Clear vertical margins for separation */
                    box-shadow: 0 40px 100px rgba(0, 0, 0, 0.5);
                    border: 1px solid rgba(255, 255, 255, 0.6);
                    text-align: center;
                    z-index: 1;
                    animation: floatIn 0.8s cubic-bezier(0.16, 1, 0.3, 1);
                    position: relative;
                    flex-shrink: 0;
                }
                @keyframes floatIn {
                    from { opacity: 0; transform: translateY(60px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .brand-tag {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: rgba(26, 107, 58, 0.12);
                    color: var(--primary);
                    padding: 0.5rem 1.25rem;
                    border-radius: 100px;
                    font-size: 0.75rem;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    margin-bottom: 2rem;
                }
                .discount-tag {
                    position: absolute;
                    top: 1rem;
                    right: 1rem;
                    background: #ff4b4b;
                    color: white;
                    padding: 0.5rem 1rem;
                    border-radius: 1rem;
                    font-size: 0.875rem;
                    font-weight: 800;
                    box-shadow: 0 10px 20px rgba(255, 75, 75, 0.3);
                    z-index: 2;
                    animation: pulse 2s infinite;
                }
                @keyframes pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                    100% { transform: scale(1); }
                }
                .product-image-box {
                    width: 240px;
                    height: 240px;
                    margin: 0 auto 2rem;
                    background: white;
                    border-radius: 2rem;
                    padding: 1.5rem;
                    box-shadow: 0 15px 30px -5px rgba(0,0,0,0.1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                }
                .product-image-box img {
                    max-width: 100%;
                    max-height: 100%;
                    object-fit: contain;
                    transition: transform 0.5s ease;
                }
                .product-image-box:hover img {
                    transform: scale(1.1);
                }
                .product-name {
                    font-size: 1.875rem;
                    font-weight: 800;
                    color: #111827;
                    margin-bottom: 0.75rem;
                    line-height: 1.1;
                    letter-spacing: -0.02em;
                }
                .variant-badge {
                    display: inline-block;
                    background: rgba(26, 107, 58, 0.08);
                    color: var(--primary);
                    padding: 0.4rem 1rem;
                    border-radius: 100px;
                    font-size: 0.9rem;
                    font-weight: 700;
                    margin-bottom: 1.5rem;
                    border: 1px solid rgba(26, 107, 58, 0.1);
                }
                .price-container {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.75rem;
                    margin-bottom: 2.5rem;
                }
                .current-price {
                    font-size: 2.75rem;
                    font-weight: 900;
                    color: var(--primary);
                    letter-spacing: -0.04em;
                }
                .old-price-group {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                }
                .old-price {
                    font-size: 1.125rem;
                    color: #9ca3af;
                    text-decoration: line-through;
                    line-height: 1;
                }
                .save-banner {
                    font-size: 0.75rem;
                    font-weight: 800;
                    color: #ff4b4b;
                    text-transform: uppercase;
                }
                .action-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.75rem;
                    width: 100%;
                    background: linear-gradient(135deg, #1A6B3A 0%, #2D9A54 100%);
                    color: white;
                    padding: 1.25rem 1rem;
                    border-radius: 1.25rem;
                    font-size: 1.125rem;
                    font-weight: 700;
                    text-decoration: none;
                    box-shadow: 0 10px 25px -5px rgba(26, 107, 58, 0.4);
                    transition: all 0.3s ease;
                    border: 1px solid rgba(255,255,255,0.1);
                    position: relative;
                }
                .action-btn:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 20px 40px -10px rgba(26, 107, 58, 0.5);
                }
                .action-btn:active {
                    transform: translateY(-1px);
                }
                .promo-pill {
                    position: absolute;
                    top: -22px; /* Moved even higher to completely clear the text */
                    right: 8px;
                    background: #FFD700;
                    color: #1a1a1a;
                    padding: 0.35rem 0.85rem;
                    border-radius: 0.75rem;
                    font-size: 0.75rem;
                    font-weight: 900;
                    box-shadow: 0 5px 15px rgba(255, 215, 0, 0.5);
                    border: 2px solid white;
                    z-index: 10;
                    white-space: nowrap;
                    letter-spacing: 0.02em;
                    animation: bounce 2s infinite;
                }
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-4px); }
                }
                .app-benefits {
                    margin-top: 2rem;
                    background: rgba(255, 255, 255, 0.4);
                    border-radius: 1.5rem;
                    padding: 1.25rem;
                    text-align: left;
                    border: 1px solid rgba(255, 255, 255, 0.3);
                }
                .benefit-title {
                    font-size: 0.875rem;
                    font-weight: 800;
                    color: var(--primary);
                    margin-bottom: 0.75rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .benefit-list {
                    list-style: none;
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }
                .benefit-item {
                    font-size: 0.8rem;
                    color: #4b5563;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-weight: 600;
                }
                .benefit-dot {
                    width: 6px;
                    height: 6px;
                    background: var(--primary);
                    border-radius: 50%;
                }
                .features-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 1rem;
                    margin-top: 2.5rem;
                    padding-top: 2rem;
                    border-top: 1px solid rgba(0,0,0,0.05);
                }
                .feature-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.5rem;
                }
                .feature-icon {
                    width: 42px;
                    height: 42px;
                    background: white;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--primary);
                    box-shadow: 0 5px 15px rgba(0,0,0,0.05);
                    transition: all 0.3s ease;
                }
                .feature-item:hover .feature-icon {
                    transform: translateY(-5px);
                    background: var(--primary);
                    color: white;
                }
                .feature-text {
                    font-size: 0.65rem;
                    font-weight: 800;
                    color: #6b7280;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                @media (max-width: 480px) {
                    .landing-card { padding: 2rem 1.5rem; border-radius: 2rem; }
                    .product-image-box { width: 220px; height: 220px; }
                    .product-name { font-size: 1.6rem; }
                    .current-price { font-size: 2.25rem; }
                    .action-btn { padding: 1.1rem; }
                    .app-benefits { padding: 1rem; }
                }
            `}</style>

            <div className="landing-card">
                <div className="brand-tag">
                    <ShoppingBag size={14} strokeWidth={3} />
                    VS Mart Exclusive
                </div>

                <div className="product-image-box">
                    {data.discountPercentage > 0 && (
                        <div className="discount-tag">
                            {data.discountPercentage}% OFF
                        </div>
                    )}
                    <img
                        src={data.image}
                        alt={data.name}
                        onError={(e) => {
                            e.target.src = 'https://placehold.co/400x400/FFFFFF/1A6B3A?text=Product+Image';
                        }}
                    />
                </div>

                <h1 className="product-name">{data.name}</h1>

                {data.variantText && (
                    <div className="variant-badge">{data.variantText}</div>
                )}

                <div className="price-container">
                    <span className="current-price">RS{data.price}</span>
                    {data.mrp > data.price && (
                        <div className="old-price-group">
                            <span className="old-price">RS{data.mrp}</span>
                            <span className="save-banner">Save RS{data.mrp - data.price}</span>
                        </div>
                    )}
                </div>

                <a href={deepLink} className="action-btn">
                    <Zap size={22} fill="currentColor" />
                    Open in VSMart App
                    <div className="promo-pill">FLASH DEAL</div>
                </a>

                <div className="app-benefits">
                    <div className="benefit-title">
                        <Zap size={14} fill="currentColor" />
                        Why use the App?
                    </div>
                    <ul className="benefit-list">
                        <li className="benefit-item"><div className="benefit-dot" /> Extra 10% Off on First Order</li>
                        <li className="benefit-item"><div className="benefit-dot" /> Live Order Tracking</li>
                        <li className="benefit-item"><div className="benefit-dot" /> Instant Customer Support</li>
                    </ul>
                </div>

                <div className="features-grid">
                    <div className="feature-item">
                        <div className="feature-icon"><Truck size={20} /></div>
                        <span className="feature-text">Express</span>
                    </div>
                    <div className="feature-item">
                        <div className="feature-icon"><ShieldCheck size={20} /></div>
                        <span className="feature-text">Secured</span>
                    </div>
                    <div className="feature-item">
                        <div className="feature-icon"><Package size={20} /></div>
                        <span className="feature-text">Premium</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PublicProductView;
