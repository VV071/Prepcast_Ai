import React from 'react';
import Tilt from 'react-parallax-tilt';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const ThreeDCard = ({
    children,
    className = '',
    glareEnable = true,
    glareMaxOpacity = 0.3,
    glareColor = '#ffffff',
    glarePosition = 'all',
    scale = 1.02,
    tiltMaxAngleX = 5,
    tiltMaxAngleY = 5,
    perspective = 1000,
    ...props
}) => {
    return (
        <Tilt
            className={twMerge("transform-style-3d", className)}
            perspective={perspective}
            glareEnable={glareEnable}
            glareMaxOpacity={glareMaxOpacity}
            glareColor={glareColor}
            glarePosition={glarePosition}
            scale={scale}
            tiltMaxAngleX={tiltMaxAngleX}
            tiltMaxAngleY={tiltMaxAngleY}
            transitionSpeed={1500}
            gyroscope={true}
            {...props}
        >
            <div className="h-full w-full transform-style-3d">
                {children}
            </div>
        </Tilt>
    );
};
