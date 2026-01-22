import { useEffect } from 'react';

export const MouseReactiveLighting = ({ children }) => {
    useEffect(() => {
        const updateMousePosition = (e) => {
            const { clientX, clientY } = e;
            const { innerWidth, innerHeight } = window;

            // Calculate percentage positions
            const mouseX = (clientX / innerWidth) * 100;
            const mouseY = (clientY / innerHeight) * 100;

            // Calculate light intensity based on movement (optional enhancement)
            const intensity = 0.5;

            // Update CSS custom properties
            document.documentElement.style.setProperty('--mouse-x', `${mouseX}%`);
            document.documentElement.style.setProperty('--mouse-y', `${mouseY}%`);
            document.documentElement.style.setProperty('--light-intensity', intensity);
        };

        // Throttle function for performance
        let ticking = false;
        const handleMouseMove = (e) => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    updateMousePosition(e);
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('mousemove', handleMouseMove, { passive: true });

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    return children;
};
