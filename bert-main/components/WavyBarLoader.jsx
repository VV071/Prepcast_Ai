import React from 'react';
import { motion } from 'framer-motion';

export const WavyBarLoader = ({
    activeColor = '#FA5C5C',
    inactiveColor = 'rgba(250, 92, 92, 0.1)',
    className = ''
}) => {
    const variants = {
        initial: {
            scaleY: 0.3,
            opacity: 0,
            backgroundColor: inactiveColor,
        },
        animate: {
            scaleY: 1,
            opacity: 1,
            backgroundColor: activeColor,
            transition: {
                repeat: Infinity,
                repeatType: "mirror",
                duration: 0.8,
                ease: "easeInOut",
            },
        },
    };

    return (
        <motion.div
            transition={{
                staggerChildren: 0.15,
            }}
            initial="initial"
            animate="animate"
            className={`flex gap-1.5 ${className}`}
        >
            <motion.div variants={variants} className="h-14 w-2.5 rounded-full shadow-aura-violet" />
            <motion.div variants={variants} className="h-14 w-2.5 rounded-full shadow-aura-violet" />
            <motion.div variants={variants} className="h-14 w-2.5 rounded-full shadow-aura-violet" />
            <motion.div variants={variants} className="h-14 w-2.5 rounded-full shadow-aura-violet" />
            <motion.div variants={variants} className="h-14 w-2.5 rounded-full shadow-aura-violet" />
        </motion.div>
    );
};

// Compact version for inline loading
export const WavyBarLoaderSmall = ({
    activeColor = '#FA5C5C',
    inactiveColor = 'rgba(250, 92, 92, 0.1)',
    className = ''
}) => {
    const variants = {
        initial: {
            scaleY: 0.4,
            opacity: 0,
            backgroundColor: inactiveColor,
        },
        animate: {
            scaleY: 1,
            opacity: 1,
            backgroundColor: activeColor,
            transition: {
                repeat: Infinity,
                repeatType: "mirror",
                duration: 0.6,
                ease: "easeInOut",
            },
        },
    };

    return (
        <motion.div
            transition={{
                staggerChildren: 0.12,
            }}
            initial="initial"
            animate="animate"
            className={`flex gap-1 ${className}`}
        >
            <motion.div variants={variants} className="h-7 w-1.5 rounded-full shadow-aura-violet" />
            <motion.div variants={variants} className="h-7 w-1.5 rounded-full shadow-aura-violet" />
            <motion.div variants={variants} className="h-7 w-1.5 rounded-full shadow-aura-violet" />
            <motion.div variants={variants} className="h-7 w-1.5 rounded-full shadow-aura-violet" />
            <motion.div variants={variants} className="h-7 w-1.5 rounded-full shadow-aura-violet" />
        </motion.div>
    );
};

// Full page loader with centered positioning
export const WavyBarLoaderFullPage = ({
    activeColor = '#FA5C5C',
    inactiveColor = 'rgba(250, 92, 92, 0.1)',
    message = 'Syncing Crystals...'
}) => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-10 bg-bg-0">
            <WavyBarLoader activeColor={activeColor} inactiveColor={inactiveColor} />
            {message && (
                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="aura-text-gradient text-xs font-black uppercase tracking-[0.4em]"
                >
                    {message}
                </motion.p>
            )}
        </div>
    );
};
