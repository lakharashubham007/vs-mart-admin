import React, { useState } from 'react';

/**
 * A premium image component that handles loading errors by 
 * displaying a deterministic, color-coded letter badge.
 */
const OptimizedImage = ({ src, alt, className, style, onClick }) => {
    const [error, setError] = useState(false);

    // Curated luxury gradients for fallback icons
    const fallbackGradients = [
        'linear-gradient(135deg, #10b981, #059669)', // Emerald
        'linear-gradient(135deg, #6366f1, #4f46e5)', // Indigo
        'linear-gradient(135deg, #f59e0b, #d97706)', // Amber
        'linear-gradient(135deg, #ec4899, #db2777)', // Pink
        'linear-gradient(135deg, #8b5cf6, #7c3aed)', // Violet
    ];

    const getDeterministicGradient = (str) => {
        if (!str) return fallbackGradients[0];
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        return fallbackGradients[Math.abs(hash) % fallbackGradients.length];
    };

    const handleImageError = () => {
        setError(true);
    };

    if (!src || error) {
        const initial = alt ? alt.charAt(0).toUpperCase() : '?';
        return (
            <div 
                className={`${className} fallback-image-container`}
                onClick={onClick}
                style={{ 
                    ...style, 
                    background: getDeterministicGradient(alt || ''), 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: '900',
                    fontSize: '1.1rem',
                    textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    userSelect: 'none'
                }}
                title={alt}
            >
                {initial}
            </div>
        );
    }

    return (
        <img 
            src={src} 
            alt={alt} 
            className={className} 
            style={style} 
            onError={handleImageError} 
            onClick={onClick}
        />
    );
};

export default OptimizedImage;
