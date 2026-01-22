import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            className="relative p-2 glass-light hover:glass-medium rounded-lg transition-all duration-200 overflow-hidden"
            aria-label="Toggle theme"
        >
            <div className="relative w-5 h-5">
                {/* Sun icon */}
                <motion.div
                    initial={false}
                    animate={{
                        scale: isDark ? 0 : 1,
                        opacity: isDark ? 0 : 1,
                        rotate: isDark ? 90 : 0
                    }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="absolute inset-0"
                >
                    <Sun className="w-5 h-5 text-amber-400" />
                </motion.div>

                {/* Moon icon */}
                <motion.div
                    initial={false}
                    animate={{
                        scale: isDark ? 1 : 0,
                        opacity: isDark ? 1 : 0,
                        rotate: isDark ? 0 : -90
                    }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="absolute inset-0"
                >
                    <Moon className="w-5 h-5 text-blue-400" />
                </motion.div>
            </div>

            {/* Glow effect */}
            <motion.div
                initial={false}
                animate={{
                    opacity: isDark ? 0.2 : 0.3,
                    backgroundColor: isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(251, 191, 36, 0.3)'
                }}
                className="absolute inset-0 rounded-lg blur-xl -z-10"
            />
        </motion.button>
    );
};
