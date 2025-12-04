import React from 'react';
import { LucideIcon, CheckCircle } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { STEPS } from '../constants';

interface StepIndicatorProps {
  currentStep: number;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
  return (
    <div className="flex items-center justify-between mb-8 px-4 w-full overflow-x-auto pb-4">
      {STEPS.map((step, index) => {
        const IconComponent = (LucideIcons as any)[step.icon
            .split('-')
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join('')] as LucideIcon;

        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;

        return (
          <React.Fragment key={index}>
            <div className="flex items-center min-w-fit">
              <div 
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                  isCompleted || isCurrent
                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200'
                    : 'bg-white border-gray-300 text-gray-400'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  IconComponent && <IconComponent className="w-5 h-5" />
                )}
              </div>
              <span className={`ml-3 text-sm font-medium hidden md:block ${
                isCompleted || isCurrent ? 'text-blue-700' : 'text-gray-400'
              }`}>
                {step.title}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-4 min-w-[20px] ${
                index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
              }`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default StepIndicator;
