import React from 'react';
import { createPortal } from 'react-dom';
import { ShoppingBasket } from 'lucide-react';
import './Loader.css';

const Loader = ({ message = 'Processing...' }) => {
    return createPortal(
        <div className="dexterdigi-loader-overlay">
            <div className="dexterdigi-loader-content">
                <div className="basket-icon-container">
                    <ShoppingBasket className="basket-icon" size={42} />
                    <div className="basket-pulse"></div>
                </div>
                <div className="loader-text-container">
                    <h2 className="loader-title">VS MART</h2>
                    <p className="powered-by-loader" style={{ fontSize: '0.65rem', marginTop: '4px', letterSpacing: '1px', color: 'hsl(var(--muted-foreground))', textAlign: 'center' }}>POWERED BY DEXTERDIGI.COM</p>
                    <p className="loader-message">{message}</p>
                </div>
                <div className="loading-bar-container">
                    <div className="loading-bar-progress"></div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default Loader;
