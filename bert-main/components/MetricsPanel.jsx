import React from 'react';
import { TrendingUp, TrendingDown, Minus, AlertCircle, CheckCircle } from 'lucide-react';

export const MetricsPanel = ({ metrics, compareMetrics = null, showComparison = false }) => {
    if (!metrics) {
        return <div className="text-slate-400 text-sm">No metrics available</div>;
    }

    const getDelta = (before, after) => {
        if (!compareMetrics) return null;
        const delta = after - before;
        const percentChange = ((delta / Math.abs(before)) * 100).toFixed(1);
        return { delta, percentChange, isImprovement: Math.abs(delta) < Math.abs(before) };
    };

    const MetricRow = ({ label, value, beforeValue, isGoodDecrease = false }) => {
        const delta = showComparison && beforeValue !== undefined ? getDelta(beforeValue, value) : null;

        return (
            <div className="flex items-center justify-between py-2 border-b border-slate-700/50">
                <span className="text-slate-300 text-sm">{label}</span>
                <div className="flex items-center gap-2">
                    <span className="text-slate-100 font-medium">
                        {typeof value === 'number' ? value.toFixed(3) : value}
                    </span>
                    {delta && (
                        <div className={`flex items-center gap-1 text-xs ${delta.delta < 0 ? 'text-green-400' :
                                delta.delta > 0 ? 'text-red-400' : 'text-slate-400'
                            }`}>
                            {delta.delta < 0 ? <TrendingDown size={14} /> :
                                delta.delta > 0 ? <TrendingUp size={14} /> :
                                    <Minus size={14} />}
                            <span>{Math.abs(delta.delta).toFixed(2)}</span>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <span className="text-lg">📊</span>
                </div>
                <h3 className="font-semibold text-slate-200">Distribution Metrics</h3>
            </div>

            <div className="space-y-1">
                <MetricRow
                    label="Mean"
                    value={metrics.mean}
                    beforeValue={compareMetrics?.mean}
                />
                <MetricRow
                    label="Median"
                    value={metrics.median}
                    beforeValue={compareMetrics?.median}
                />
                <MetricRow
                    label="Std Dev"
                    value={metrics.std}
                    beforeValue={compareMetrics?.std}
                />
                <MetricRow
                    label="Skewness"
                    value={`${metrics.skewness} (${metrics.skewnessLabel})`}
                    beforeValue={compareMetrics?.skewness}
                />
                <MetricRow
                    label="Kurtosis"
                    value={`${metrics.kurtosis} (${metrics.kurtosisLabel})`}
                    beforeValue={compareMetrics?.kurtosis}
                />

                <div className="flex items-center justify-between py-2 pt-3">
                    <span className="text-slate-300 text-sm">Normal Distribution</span>
                    <div className="flex items-center gap-2">
                        {metrics.isNormal ? (
                            <>
                                <CheckCircle size={16} className="text-green-400" />
                                <span className="text-green-400 font-medium text-sm">Yes</span>
                            </>
                        ) : (
                            <>
                                <AlertCircle size={16} className="text-amber-400" />
                                <span className="text-amber-400 font-medium text-sm">No</span>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-between py-2 border-t border-slate-700/50 pt-3">
                    <span className="text-slate-300 text-sm">Sample Size</span>
                    <span className="text-slate-100 font-medium">{metrics.sampleSize}</span>
                </div>
            </div>
        </div>
    );
};
