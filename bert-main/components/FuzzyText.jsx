"use client";

import React, { useRef, useEffect } from "react";
import { cn } from "../lib/utils";

/**
 * FuzzyText component that creates a character-shuffling "hacker" effect on hover.
 */
export function FuzzyText({
    text,
    original,
    children,
    className,
    delay = 30,
    ...props
}) {
    const element = useRef(null);
    const intervalRef = useRef(null);
    const childrenCopy = text || original || (typeof children === 'string' ? children : "");
    const displayOriginal = original || (typeof children === 'string' ? children : "");
    const fuzzyChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";

    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    const animateText = (targetText, callback) => {
        let iteration = 0;
        if (intervalRef.current) clearInterval(intervalRef.current);

        intervalRef.current = setInterval(() => {
            if (!element.current) {
                clearInterval(intervalRef.current);
                return;
            }

            const newText = targetText.split("").map((char, idx) => {
                if (idx < iteration) return targetText[idx];
                const randomIndex = Math.floor(Math.random() * fuzzyChars.length);
                return fuzzyChars[randomIndex];
            }).join("");

            element.current.innerText = newText;
            iteration += 1 / 3;

            if (iteration >= targetText.length) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
                element.current.innerText = targetText; // Ensure final text matches exactly
                if (callback) callback();
            }
        }, delay);
    };

    const handleMouseOver = () => {
        animateText(childrenCopy);
    };

    const handleMouseLeave = () => {
        animateText(displayOriginal);
    };

    if (!displayOriginal && !children) {
        return <span className="text-red-500 text-xs">ERR: NO_TEXT</span>;
    }

    return (
        <span
            ref={element}
            className={cn(
                "cursor-crosshair font-mono uppercase transition-colors duration-200",
                className
            )}
            onMouseOver={handleMouseOver}
            onMouseLeave={handleMouseLeave}
            {...props}
        >
            {children || displayOriginal}
        </span>
    );
}

FuzzyText.displayName = "FuzzyText";
