import React, { useRef } from 'react';
import {
    motion,
    useScroll,
    useSpring,
    useTransform,
} from 'framer-motion';

function useParallax(value, distance) {
    return useTransform(value, [0, 1], [-distance, distance]);
}

export const ParallaxSection = ({ children, distance = 300, className = '' }) => {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({ target: ref });
    const y = useParallax(scrollYProgress, distance);

    return (
        <section className={`relative ${className}`} ref={ref}>
            <motion.div style={{ y }}>
                {children}
            </motion.div>
        </section>
    );
};

export const ParallaxImage = ({ src, alt, id, distance = 300 }) => {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({ target: ref });
    const y = useParallax(scrollYProgress, distance);

    return (
        <section className="h-screen flex justify-center items-center relative snap-start">
            <div ref={ref} className="w-[300px] h-[400px] md:w-[400px] md:h-[500px] m-5 bg-slate-800/50 overflow-hidden rounded-2xl glass-medium border border-white/10">
                <img
                    src={src}
                    alt={alt}
                    className="w-full h-full object-cover"
                />
            </div>
            <motion.h2
                initial={{ visibility: "hidden" }}
                animate={{ visibility: "visible" }}
                style={{ y }}
                className="text-blue-400 m-0 font-bold text-5xl absolute top-1/2 left-[calc(50%+120px)] -translate-y-1/2"
            >
                {id && `#${String(id).padStart(3, '0')}`}
            </motion.h2>
        </section>
    );
};

export const ScrollProgress = () => {
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001,
    });

    return (
        <motion.div
            className="fixed left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 bottom-0 z-50"
            style={{ scaleX, transformOrigin: '0%' }}
        />
    );
};

export const ParallaxContainer = ({ children, enableProgress = true }) => {
    return (
        <div className="snap-y snap-mandatory overflow-y-scroll h-screen">
            {children}
            {enableProgress && <ScrollProgress />}
        </div>
    );
};

// Parallax text effect
export const ParallaxText = ({ children, distance = 100, className = '' }) => {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({ target: ref });
    const y = useParallax(scrollYProgress, distance);

    return (
        <div ref={ref}>
            <motion.div style={{ y }} className={className}>
                {children}
            </motion.div>
        </div>
    );
};

// Parallax scale effect
export const ParallaxScale = ({ children, scaleRange = [0.8, 1.2], className = '' }) => {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({ target: ref });
    const scale = useTransform(scrollYProgress, [0, 1], scaleRange);

    return (
        <div ref={ref} className={className}>
            <motion.div style={{ scale }}>
                {children}
            </motion.div>
        </div>
    );
};

// Parallax opacity effect
export const ParallaxOpacity = ({ children, opacityRange = [0, 1], className = '' }) => {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({ target: ref });
    const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [opacityRange[0], 1, opacityRange[1]]);

    return (
        <div ref={ref} className={className}>
            <motion.div style={{ opacity }}>
                {children}
            </motion.div>
        </div>
    );
};
