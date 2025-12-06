import React from 'react';
import { motion } from 'framer-motion';
import Tilt from 'react-parallax-tilt';

export const Card3D = ({
    children,
    elevation = 2,
    glassType = 'medium',
    enableTilt = true,
    enableLighting = true,
    className = '',
    padding = 'lg',
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
        relative rounded-2xl transition-all duration-300
        ${glassClasses[glassType]}
        ${elevationClass}
        ${paddingClasses[padding]}
        ${lightingClass}
        ${className}
      `}
            {...props}
        >
            {/* Edge glow effect */}
            <div className="absolute inset-0 rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))',
                    filter: 'blur(8px)'
                }}
            />

            {/* Content */}
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );

    if (enableTilt) {
        return (
            <Tilt
                tiltMaxAngleX={8}
                tiltMaxAngleY={8}
                scale={1.02}
                transitionSpeed={1500}
                glareEnable={true}
                glareMaxOpacity={0.2}
                glareColor="#ffffff"
                glarePosition="all"
                glareBorderRadius="1rem"
                gyroscope={true}
            >
                {cardContent}
            </Tilt>
        );
    }

    return <motion.div whileHover={{ scale: 1.01 }}>{cardContent}</motion.div>;
};
