import React from 'react';
import { Lightbulb, AlertTriangle, TrendingUp } from 'lucide-react';

export const RecommendationCard = ({ recommendation, outlierCount = 0, metrics = null }) => {
    if (!recommendation) {
        return null;
    }

    const getMethodIcon = (method) => {
        switch (method) {
            case 'zscore':
                return '📊';
            case 'iqr':
                return '📐';
            case 'winsorize':
                return '✂️';
            default:
                return '🔧';
        }
    };

    const getMethodName = (method) => {
        switch (method) {
            case 'zscore':
                return 'Z-Score Method';
            case 'iqr':
                return 'IQR Method';
            case 'winsorize':
                return 'Winsorization';
            default:
                return 'Custom Method';
        }
    };

    // Determine warnings based on metrics
    const warnings = [];
    if (metrics) {
        if (!metrics.isNormal) warnings.push('Not normally distributed');
        if (Math.abs(metrics.skewness) > 0.5)
            warnings.push(`${metrics.skewnessLabel}`);
        if (metrics.kurtosis > 4)
            warnings.push('Heavy tails detected');
        if (outlierCount > 0)
            warnings.push(`${outlierCount} outlier${outlierCount > 1 ? 's' : ''} detected`);
    }

    return (
        <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-lg p-4 border border-blue-500/20">
            <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Lightbulb size={18} className="text-blue-400" />
                </div>
                <h3 className="font-semibold text-slate-200">AI Recommendation</h3>
            </div>

            {warnings.length > 0 && (
                <div className="space-y-1 mb-3">
                    {warnings.map((warning, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-amber-300">
                            <AlertTriangle size={14} />
                            <span>{warning}</span>
                        </div>
                    ))}
                </div>
            )}

            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{getMethodIcon(recommendation.method)}</span>
                    <div>
                        <div className="text-sm font-semibold text-slate-200">
                            {getMethodName(recommendation.method)}
                        </div>
                        <div className="text-xs text-slate-400">
                            Threshold: {recommendation.threshold}
                        </div>
                    </div>
                </div>

                <p className="text-sm text-slate-300 leading-relaxed">
                    {recommendation.reason}
                </p>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-700/30">
                <div className="flex items-center gap-2 text-xs text-blue-300">
                    <TrendingUp size={14} />
                    <span>
                        This method is automatically selected based on your data distribution
                    </span>
                </div>
            </div>
        </div>
    );
};
