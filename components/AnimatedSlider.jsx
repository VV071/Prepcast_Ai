"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../lib/utils";
import { FuzzyText } from "./FuzzyText";

const AnimatedCardContext = createContext(null);

export const useAnimatedCard = () => {
    const context = useContext(AnimatedCardContext);
    if (!context) {
        throw new Error("useAnimatedCard must be used within a AnimatedCard Provider");
    }
    return context;
};

/**
 * AnimatedSlider component to wrap AnimatedCards
 */
export function AnimatedSlider({
    title,
    children,
    className,
    gap = 16,
    scrollAmount = 300,
    ...props
}) {
    const sliderRef = useRef(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(true);

    const checkArrows = () => {
        if (!sliderRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
        setShowLeftArrow(scrollLeft > 0);
        setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    };

    useEffect(() => {
        const slider = sliderRef.current;
        if (!slider) return;

        slider.addEventListener("scroll", checkArrows);
        window.addEventListener("resize", checkArrows);
        checkArrows();

        return () => {
            slider.removeEventListener("scroll", checkArrows);
            window.removeEventListener("resize", checkArrows);
        };
    }, []);

    const scrollHandler = (direction) => {
        if (!sliderRef.current) return;
        const currentScroll = sliderRef.current.scrollLeft;
        const newScrollLeft = direction === "left" ? currentScroll - scrollAmount : currentScroll + scrollAmount;
        sliderRef.current.scrollTo({
            left: newScrollLeft,
            behavior: "smooth",
        });
    };

    return (
        <div className={cn("w-full py-4", className)} {...props}>
            {title && (
                <h2 className="aura-text-gradient mb-6 text-2xl font-black uppercase tracking-tight">
                    <FuzzyText original={title}>{title}</FuzzyText>
                </h2>
            )}

            <div className="group relative">
                <div
                    ref={sliderRef}
                    className="scrollbar-hide flex overflow-x-auto pb-6 scroll-smooth"
                    style={{
                        gap: `${gap}px`,
                    }}
                >
                    {children}
                </div>

                {showLeftArrow && (
                    <button
                        onClick={() => scrollHandler("left")}
                        className="absolute top-1/2 left-0 z-20 -translate-x-4 -translate-y-1/2 scale-0 rounded-full glass-strong p-3 text-white transition-all duration-300 group-hover:translate-x-2 group-hover:scale-100 aura-border-glow hover:shadow-aura-violet"
                        aria-label="Scroll left"
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </button>
                )}

                {showRightArrow && (
                    <button
                        onClick={() => scrollHandler("right")}
                        className="absolute top-1/2 right-0 z-20 translate-x-4 -translate-y-1/2 scale-0 rounded-full glass-strong p-3 text-white transition-all duration-300 group-hover:-translate-x-2 group-hover:scale-100 aura-border-glow hover:shadow-aura-teal"
                        aria-label="Scroll right"
                    >
                        <ChevronRight className="h-6 w-6" />
                    </button>
                )}
            </div>
        </div>
    );
}

/**
 * AnimatedCard component for expandable cards
 */
export function AnimatedCard({
    children,
    className,
    defaultWidth = "220px",
    expandedWidth = "380px",
    height = "300px",
    transitionDuration = "0.5s",
    transitionEasing = "cubic-bezier(0.4, 0, 0.2, 1)",
    ...props
}) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <AnimatedCardContext.Provider value={{ isHovered, setIsHovered }}>
            <div
                className={cn(
                    "relative shrink-0 cursor-pointer glass-medium rounded-2xl overflow-hidden aura-border-glow transition-all",
                    isHovered ? "z-10 shadow-aura-violet" : "elevation-3",
                    className
                )}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                    width: isHovered ? expandedWidth : defaultWidth,
                    height,
                    transition: `width ${transitionDuration} ${transitionEasing}, box-shadow 0.3s ease`,
                }}
                {...props}
            >
                {children}
            </div>
        </AnimatedCardContext.Provider>
    );
}

/**
 * CardContent handles aspect ratio changes
 */
export function CardContent({
    className,
    children,
    ...props
}) {
    const { isHovered } = useAnimatedCard();

    return (
        <div
            className={cn(
                "relative h-full w-full overflow-hidden transition-all duration-500 ease-in-out",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}

/**
 * OnHover view visible when card is expanded
 */
export function OnHover({ className, children, fadeInDuration = "0.4s", ...props }) {
    const { isHovered } = useAnimatedCard();

    return (
        <div
            className={cn(
                "absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 transition-all duration-500 ease-in-out",
                isHovered ? "translate-y-0 opacity-100" : "translate-y-full opacity-0",
                className
            )}
            style={{
                transitionDelay: isHovered ? "0.1s" : "0s"
            }}
            {...props}
        >
            {children}
        </div>
    );
}

/**
 * DefaultView visible when card is collapsed
 */
export function DefaultView({ className, children, ...props }) {
    const { isHovered } = useAnimatedCard();

    return (
        <div
            className={cn(
                "absolute right-0 bottom-0 left-0 p-4 text-sm font-bold text-white transition-all duration-300 ease-in-out bg-gradient-to-t from-black/60 to-transparent",
                !isHovered ? "translate-y-0 opacity-100" : "translate-y-full opacity-0",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}
