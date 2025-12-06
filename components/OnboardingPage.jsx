import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileSpreadsheet, Database, Brain, Sparkles, CheckCircle, ArrowRight, ArrowLeft, X } from 'lucide-react';
import * as THREE from 'three';
import CLOUDS from 'vanta/dist/vanta.clouds.min';
import { Card3D } from './3D/Card3D';
import { Button3D } from './3D/Button3D';
import { FloatingElement } from './MotionWrapper';
import { Logo } from './Logo';

export const OnboardingPage = ({ onComplete, onSkip }) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const vantaRef = useRef(null);

    useEffect(() => {
        let vantaEffect = null;
        if (vantaRef.current) {
            vantaEffect = CLOUDS({
                el: vantaRef.current,
                THREE: THREE,
                mouseControls: true,
                touchControls: true,
                gyroControls: false,
                minHeight: 200.00,
                minWidth: 200.00
            });
        }
        return () => {
            if (vantaEffect) vantaEffect.destroy();
        };
    }, []);

    const slides = [
        {
            title: "Welcome to PrepCast AI",
            subtitle: "Intelligent Data Processing & Cleaning",
            features: [
                {
                    icon: FileSpreadsheet,
                    title: "Static & Dynamic Files",
                    description: "Handle any data source - spreadsheets, APIs, real-time streams, or file uploads",
                    color: "blue"
                },
                {
                    icon: Brain,
                    title: "AI-Powered Detection",
                    description: "Gemini API with BERT fallback automatically detects your domain and schema",
                    color: "purple"
                },
                {
                    icon: Sparkles,
                    title: "Smart Processing",
                    description: "Advanced AI identifies patterns, anomalies, and data quality issues instantly",
                    color: "cyan"
                }
            ]
        },
        {
            title: "4-Step Cleaning Process",
            subtitle: "Automated Pipeline for Perfect Data",
            steps: [
                {
                    number: 1,
                    title: "Domain Detection",
                    description: "AI analyzes your data structure and identifies the domain (Healthcare, Finance, etc.)",
                    icon: Brain,
                    color: "from-blue-500 to-cyan-500"
                },
                {
                    number: 2,
                    title: "Schema Inference",
                    description: "Automatically determines data types, relationships, and validation rules",
                    icon: Database,
                    color: "from-purple-500 to-pink-500"
                },
                {
                    number: 3,
                    title: "Anomaly Detection",
                    description: "Identifies outliers, missing values, and inconsistencies in your dataset",
                    icon: Sparkles,
                    color: "from-amber-500 to-orange-500"
                },
                {
                    number: 4,
                    title: "Data Cleaning",
                    description: "Apply fixes, imputations, and normalizations with AI-powered suggestions",
                    icon: CheckCircle,
                    color: "from-emerald-500 to-green-500"
                }
            ]
        }
    ];

    const nextSlide = () => {
        if (currentSlide < slides.length - 1) {
            setCurrentSlide(prev => prev + 1);
        } else {
            onComplete();
        }
    };

    const prevSlide = () => {
        if (currentSlide > 0) {
            setCurrentSlide(prev => prev - 1);
        }
    };

    return (
        <div ref={vantaRef} className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Effects - Kept as overlay for depth */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <FloatingElement duration={20} yOffset={30}>
                    <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl mix-blend-overlay" />
                </FloatingElement>
                <FloatingElement duration={25} yOffset={40}>
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl mix-blend-overlay" />
                </FloatingElement>
            </div>

            {/* Skip Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onSkip}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white glass-light rounded-lg transition-all z-10"
            >
                <X className="w-5 h-5" />
            </motion.button>

            {/* Main Content */}
            <div className="max-w-7xl w-full relative z-10">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentSlide}
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ duration: 0.5 }}
                    >
                        {currentSlide === 0 ? (
                            <div className="space-y-12">
                                {/* Header */}
                                <div className="text-center space-y-6">
                                    <FloatingElement>
                                        <Logo
                                            className="w-32 h-32 rounded-3xl bg-slate-900/30 mb-6 group cursor-pointer hover:scale-110 transition-transform duration-300 backdrop-blur-md border border-white/10 shadow-2xl"
                                            imgClassName="w-full h-full object-contain rounded-3xl p-2"
                                        />
                                    </FloatingElement>
                                    <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-white drop-shadow-sm">{slides[0].title}</h1>
                                    <p className="text-2xl text-slate-300 font-light tracking-wide">{slides[0].subtitle}</p>
                                </div>

                                {/* Features Grid - BIG CARDS */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    {slides[0].features.map((feature, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, y: 50 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.2, type: "spring", stiffness: 100 }}
                                            className="h-full"
                                        >
                                            <Card3D
                                                elevation={4}
                                                glassType="strong"
                                                enableTilt
                                                className="h-full min-h-[300px] flex flex-col items-center justify-center p-6 group bg-slate-900/40 backdrop-blur-md border-white/10 hover:bg-slate-900/60 transition-colors duration-500"
                                            >
                                                <div className="relative">
                                                    {/* Animated Glow Background */}
                                                    <div className={`absolute inset-0 bg-${feature.color}-500/20 blur-3xl rounded-full scale-0 group-hover:scale-150 transition-transform duration-700 opacity-50`} />

                                                    {/* Icon Container */}
                                                    <motion.div
                                                        animate={{ y: [0, -5, 0] }}
                                                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: index }}
                                                        className={`relative z-10 w-20 h-20 rounded-2xl bg-gradient-to-br from-${feature.color}-500/20 to-${feature.color}-600/10 border border-${feature.color}-500/30 flex items-center justify-center mb-6 backdrop-blur-sm shadow-xl group-hover:shadow-${feature.color}-500/40 transition-all duration-300`}
                                                    >
                                                        <feature.icon className={`w-10 h-10 text-${feature.color}-400 drop-shadow-lg`} />
                                                    </motion.div>
                                                </div>

                                                <h3 className="text-xl font-bold text-white mb-3 text-center group-hover:scale-105 transition-transform duration-300">{feature.title}</h3>
                                                <p className="text-slate-300 text-sm text-center leading-relaxed font-light">{feature.description}</p>
                                            </Card3D>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {/* Header */}
                                <div className="text-center space-y-4">
                                    <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-100 to-white drop-shadow-sm">{slides[1].title}</h1>
                                    <p className="text-2xl text-slate-300 font-light">{slides[1].subtitle}</p>
                                </div>

                                {/* Steps - Compact BIG CARDS 2x2 */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {slides[1].steps.map((step, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, scale: 0.8, rotateX: 20 }}
                                            animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                                            transition={{ delay: index * 0.15, type: "spring" }}
                                            whileHover={{ scale: 1.02 }}
                                        >
                                            <Card3D elevation={3} glassType="medium" className="relative h-full min-h-[180px] overflow-hidden group bg-slate-900/40 backdrop-blur-md border-white/10 hover:bg-slate-900/60 p-6">
                                                {/* Animated Gradient Bar */}
                                                <div className={`absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b ${step.color} group-hover:w-3 transition-all duration-300`} />

                                                {/* Background Blur Spot */}
                                                <div className={`absolute -right-20 -bottom-20 w-40 h-40 bg-gradient-to-br ${step.color} blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity duration-500`} />

                                                <div className="h-full flex flex-col justify-between pl-4">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white font-bold text-lg shadow-lg transform group-hover:-translate-y-1 transition-transform duration-300`}>
                                                            {step.number}
                                                        </div>
                                                        <step.icon className="w-6 h-6 text-white/50 group-hover:text-white transition-colors duration-300" />
                                                    </div>

                                                    <div>
                                                        <h3 className="text-lg font-bold text-white mb-1 group-hover:translate-x-1 transition-transform duration-300">{step.title}</h3>
                                                        <p className="text-sm text-slate-300 leading-relaxed max-w-md">{step.description}</p>
                                                    </div>
                                                </div>
                                            </Card3D>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Navigation */}
                <div className="mt-12 flex items-center justify-between">
                    {/* Progress Dots */}
                    <div className="flex gap-2">
                        {slides.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentSlide(index)}
                                className={`h-2 rounded-full transition-all duration-300 ${index === currentSlide
                                    ? 'w-8 bg-blue-500'
                                    : 'w-2 bg-slate-600 hover:bg-slate-500'
                                    }`}
                            />
                        ))}
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex gap-3">
                        {currentSlide > 0 && (
                            <Button3D
                                variant="secondary"
                                onClick={prevSlide}
                                leftIcon={<ArrowLeft className="w-5 h-5" />}
                            >
                                Previous
                            </Button3D>
                        )}

                        <Button3D
                            variant="primary"
                            onClick={nextSlide}
                            rightIcon={<ArrowRight className="w-5 h-5" />}
                        >
                            {currentSlide === slides.length - 1 ? "Get Started" : "Next"}
                        </Button3D>
                    </div>
                </div>
            </div>
        </div>
    );
};
