import React from 'react';
import { motion } from 'framer-motion';
import Tilt from 'react-parallax-tilt';

export const Card3D = ({
    children,
    elevation = 3,
    glassType = 'medium',
    enableTilt = true,
    enableLighting = true,
    enableLiquidGlass = true,
    className = '',
    padding = 'lg',
    layerDepth = 40, // Default depth for layers
    ...props
}) => {
    const paddingClasses = {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
        xl: 'p-10'
    };

    const glassClasses = {
        'ultra-light': 'glass-ultra-light',
        light: 'glass-light',
        medium: 'glass-medium',
        strong: 'glass-strong',
        'ultra-strong': 'glass-ultra-strong'
    };

    const elevationClass = `elevation-${elevation}`;
    const lightingClass = enableLighting ? 'reactive-lighting' : '';

    const cardContent = (
        <div
            className={`
        liquid-glass-card group relative rounded-2xl transition-all duration-500 transform-3d
        ${glassClasses[glassType]}
        ${elevationClass}
        ${paddingClasses[padding]}
        ${lightingClass}
        ${className}
      `}
            style={{
                isolation: 'isolate',
                boxShadow: '0px 10px 40px -15px rgba(191, 0, 255, 0.3), inset 0 0 0 1px rgba(255,255,255,0.1)'
            }}
            {...props}
        >
            {/* Crystal Refraction Layer */}
            <div className="absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity duration-700 pointer-events-none"
                style={{
                    background: 'linear-gradient(135deg, var(--color-aura-violet), var(--color-aura-teal))',
                    filter: 'blur(40px)',
                    zIndex: -1
                }}
            />

            {/* Backdrop distortion layer */}
            {enableLiquidGlass && (
                <div
                    className="absolute inset-0 rounded-2xl pointer-events-none"
                    style={{
                        zIndex: 0,
                        background: 'linear-gradient(135deg, rgba(191, 0, 255, 0.05), rgba(0, 245, 255, 0.05))',
                        filter: 'url(#glass-distortion)',
                        WebkitFilter: 'url(#glass-distortion)',
                    }}
                />
            )}

            {/* Edge Prism Effect */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-0 group-hover:opacity-50 transition-all duration-700" style={{ zIndex: 11 }} />

            {/* Content Container with depth support */}
            <div className="relative z-10 transform-3d">
                {children}
            </div>

            {/* Reflection Shine */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl" style={{ zIndex: 12 }}>
                <div className="absolute -inset-[100%] bg-gradient-to-tr from-white/0 via-white/5 to-white/0 transform rotate-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
            </div>
        </div>
    );

    if (enableTilt) {
        return (
            <Tilt
                tiltMaxAngleX={10}
                tiltMaxAngleY={10}
                scale={1.03}
                transitionSpeed={2000}
                glareEnable={true}
                glareMaxOpacity={0.3}
                glareColor="#ffffff"
                glarePosition="all"
                glareBorderRadius="1.5rem"
                gyroscope={true}
                perspective={2000}
            >
                {cardContent}
            </Tilt>
        );
    }

    return <motion.div whileHover={{ scale: 1.01 }}>{cardContent}</motion.div>;
};
