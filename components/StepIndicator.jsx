import React from 'react';
import { CheckCircle } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { STEPS } from '../constants';

const StepIndicator = ({ currentStep }) => {
    return (
        <div className="flex items-center justify-between mb-12 px-6 w-full overflow-x-auto pb-6 scrollbar-none">
            {STEPS.map((step, index) => {
                const IconComponent = LucideIcons[step.icon
                    .split('-')
                    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
                    .join('')];

                const isCompleted = index < currentStep;
                const isCurrent = index === currentStep;

                return (
                    <React.Fragment key={index}>
                        <div className="flex flex-col items-center min-w-fit group">
                            <div
                                className={`flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-500 transform-3d ${isCompleted || isCurrent
                                    ? 'aura-gradient-violet text-white shadow-aura-violet scale-110 elevation-3 rotate-3'
                                    : 'glass-medium border border-white/10 text-slate-500 hover:border-aura-violet/50'
                                    }`}
                                style={{
                                    boxShadow: isCurrent ? '0 0 20px rgba(250, 92, 92, 0.4), inset 0 0 10px rgba(255,255,255,0.4)' : ''
                                }}
                            >
                                {isCompleted ? (
                                    <CheckCircle className="w-6 h-6 animate-pulse" />
                                ) : (
                                    IconComponent && <IconComponent className={`w-6 h-6 ${isCurrent ? 'animate-pulse-glow' : ''}`} />
                                )}
                            </div>
                            <span className={`mt-3 text-xs font-black uppercase tracking-tighter transition-all duration-300 ${isCompleted || isCurrent ? 'aura-text-gradient opacity-100' : 'text-slate-600 opacity-50 group-hover:opacity-100'
                                }`}>
                                {step.title}
                            </span>
                        </div>
                        {index < STEPS.length - 1 && (
                            <div className="flex-1 px-4 min-w-[30px]">
                                <div className={`h-1 rounded-full transition-all duration-700 ${index < currentStep
                                    ? 'aura-gradient-teal shadow-aura-teal'
                                    : 'bg-white/5 border border-white/5'
                                    }`} />
                            </div>
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

export default StepIndicator;
