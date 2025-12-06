import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export const Input3D = ({
    label,
    error,
    success,
    helperText,
    leftIcon,
    rightIcon,
    type = 'text',
    className = '',
    id,
    ...props
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    const hasValue = props.value && props.value.length > 0;

    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            {label && (
                <label
                    htmlFor={inputId}
                    className="text-sm font-medium text-slate-300 ml-1"
                >
                    {label}
                </label>
            )}

            <div className="relative group">
                {/* Glass input container */}
                <div className={`
          relative glass-light rounded-xl transition-all duration-300
          ${error ? 'border-red-500/50' : success ? 'border-green-500/50' : 'border-white/10'}
          ${isFocused ? 'elevation-2 border-blue-500/50' : 'elevation-1'}
        `}>
                    {/* Left icon */}
                    {leftIcon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors z-10">
                            {leftIcon}
                        </div>
                    )}

                    {/* Input field */}
                    <input
                        id={inputId}
                        type={type}
                        className={`
              w-full px-4 py-3 bg-transparent text-white
              placeholder:text-slate-400
              focus:outline-none
              transition-all duration-300
              ${leftIcon ? 'pl-11' : ''}
              ${rightIcon ? 'pr-11' : ''}
            `}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        {...props}
                    />

                    {/* Right icon */}
                    {rightIcon && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 z-10">
                            {rightIcon}
                        </div>
                    )}

                    {/* Focus glow effect */}
                    {isFocused && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0 rounded-xl pointer-events-none"
                            style={{
                                boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)'
                            }}
                        />
                    )}
                </div>

                {/* Floating label effect (if needed in future) */}
            </div>

            {/* Error message */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-1.5 text-sm text-red-400 ml-1"
                >
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                </motion.div>
            )}

            {/* Success message */}
            {success && !error && (
                <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-1.5 text-sm text-green-400 ml-1"
                >
                    <AlertCircle className="w-4 h-4" />
                    <span>{success}</span>
                </motion.div>
            )}

            {/* Helper text */}
            {helperText && !error && !success && (
                <span className="text-xs text-slate-500 ml-1">
                    {helperText}
                </span>
            )}
        </div>
    );
};
