import React from 'react';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const Button3D = ({
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    disabled = false,
    fullWidth = false,
    leftIcon,
    rightIcon,
    className = '',
    ...props
}) => {
    const baseClasses = "relative inline-flex items-center justify-center font-medium transition-all duration-250 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent will-change-transform disabled:opacity-50 disabled:cursor-not-allowed";

    const sizeClasses = {
        sm: 'px-3 py-1.5 text-sm rounded-lg',
        md: 'px-4 py-2.5 text-base rounded-xl',
        lg: 'px-6 py-3 text-lg rounded-xl',
        xl: 'px-8 py-4 text-xl rounded-2xl'
    };

    const variantClasses = {
        primary: 'bg-gradient-to-br from-blue-600 to-blue-700 text-white hover:from-blue-500 hover:to-blue-600 focus:ring-blue-500 elevation-2 hover:elevation-3',
        secondary: 'bg-gradient-to-br from-purple-600 to-purple-700 text-white hover:from-purple-500 hover:to-purple-600 focus:ring-purple-500 elevation-2 hover:elevation-3',
        accent: 'bg-gradient-to-br from-cyan-600 to-cyan-700 text-white hover:from-cyan-500 hover:to-cyan-600 focus:ring-cyan-500 elevation-2 hover:elevation-3',
        outline: 'glass-medium border-2 border-blue-500/50 text-blue-400 hover:bg-blue-500/10 hover:border-blue-400 focus:ring-blue-500',
        ghost: 'text-slate-300 hover:bg-white/5 hover:text-white',
        danger: 'bg-gradient-to-br from-red-600 to-red-700 text-white hover:from-red-500 hover:to-red-600 focus:ring-red-500 elevation-2 hover:elevation-3'
    };

    const widthClass = fullWidth ? 'w-full' : '';

    return (
        <motion.button
            whileHover={{ scale: variant !== 'ghost' ? 1.02 : 1 }}
            whileTap={{ scale: 0.98 }}
            className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${widthClass} ${className} reactive-lighting`}
            disabled={isLoading || disabled}
            {...props}
        >
            {/* Glossy overlay */}
            {variant !== 'ghost' && variant !== 'outline' && (
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent rounded-inherit opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            )}

            {/* Content */}
            <span className="relative flex items-center gap-2">
                {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <>
                        {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
                        {children}
                        {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
                    </>
                )}
            </span>
        </motion.button>
    );
};
