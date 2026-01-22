import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronRight, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { histogramUtils } from '../services/sharedUtils';
import { cleanData } from '../services/dataProcessor';
import { HistogramChart } from './HistogramChart';
import { MetricsPanel } from './MetricsPanel';
import { RecommendationCard } from './RecommendationCard';

export const DistributionPanel = ({
    data,
    columns,
    cleaningConfig,
    onConfigChange
}) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [selectedColumn, setSelectedColumn] = useState('');
    const [binCount, setBinCount] = useState(10);
    const [viewMode, setViewMode] = useState('before'); // 'before', 'after', 'sidebyside'
    const [previewData, setPreviewData] = useState(null);

    // Get numeric columns only
    const numericColumns = useMemo(() => {
        if (!data || !columns) return [];
        return columns.filter(col => {
            const values = data.map(r => r[col]).filter(v => v !== null && v !== undefined);
            const numericValues = values.filter(v => !isNaN(parseFloat(v)));
            return numericValues.length > values.length * 0.7; // At least 70% numeric
        });
    }, [data, columns]);

    // Auto-select first numeric column
    useEffect(() => {
        if (numericColumns.length > 0 && !selectedColumn) {
            setSelectedColumn(numericColumns[0]);
        }
    }, [numericColumns, selectedColumn]);

    // Extract column values
    const getColumnValues = (dataset, column) => {
        if (!dataset || !column) return [];
        return dataset
            .map(r => parseFloat(r[column]))
            .filter(v => !isNaN(v) && isFinite(v));
    };

    // Get raw data values
    const rawValues = useMemo(() =>
        getColumnValues(data, selectedColumn),
        [data, selectedColumn]
    );

    // Generate preview of cleaned data with proper debugging
    useEffect(() => {
        if (data && selectedColumn && cleaningConfig) {
            try {
                console.log('🔍 CLEANING PREVIEW START');
                console.log('Original data sample:', data.slice(0, 3));
                console.log('Selected column:', selectedColumn);
                console.log('Cleaning config:', cleaningConfig);

                // Apply cleaning to get preview
                const cleaned = cleanData(data, [selectedColumn], cleaningConfig);

                // Extract values for comparison
                const originalVals = data.map(r => parseFloat(r[selectedColumn])).filter(v => !isNaN(v));
                const cleanedVals = cleaned.map(r => parseFloat(r[selectedColumn])).filter(v => !isNaN(v));

                console.log('📊 BEFORE CLEANING:');
                console.log('  Count:', originalVals.length);
                console.log('  Min:', Math.min(...originalVals).toFixed(2));
                console.log('  Max:', Math.max(...originalVals).toFixed(2));
                console.log('  Mean:', (originalVals.reduce((a, b) => a + b, 0) / originalVals.length).toFixed(2));

                console.log('📊 AFTER CLEANING:');
                console.log('  Count:', cleanedVals.length);
                console.log('  Min:', Math.min(...cleanedVals).toFixed(2));
                console.log('  Max:', Math.max(...cleanedVals).toFixed(2));
                console.log('  Mean:', (cleanedVals.reduce((a, b) => a + b, 0) / cleanedVals.length).toFixed(2));

                const valuesChanged = originalVals.some((val, idx) => val !== cleanedVals[idx]);
                console.log('✅ Values changed:', valuesChanged);
                console.log('🔍 CLEANING PREVIEW END\n');

                setPreviewData(cleaned);
            } catch (error) {
                console.error('❌ Preview cleaning error:', error);
                setPreviewData(null);
            }
        }
    }, [data, selectedColumn, cleaningConfig]);

    // Get cleaned data values
    const cleanedValues = useMemo(() => {
        const vals = getColumnValues(previewData, selectedColumn);
        console.log(`📈 Cleaned values extracted: ${vals.length} values`);
        return vals;
    }, [previewData, selectedColumn]);

    // Generate histograms
    const rawHistogram = useMemo(() => {
        if (rawValues.length === 0) return null;
        const hist = histogramUtils.generateHistogram(rawValues, binCount);
        console.log('📊 RAW Histogram generated:', hist?.bins?.length, 'bins');
        return hist;
    }, [rawValues, binCount]);

    const cleanedHistogram = useMemo(() => {
        if (cleanedValues.length === 0) return null;
        const hist = histogramUtils.generateHistogram(cleanedValues, binCount);
        console.log('📊 CLEANED Histogram generated:', hist?.bins?.length, 'bins');
        return hist;
    }, [cleanedValues, binCount]);

    // Calculate metrics
    const rawMetrics = useMemo(() => {
        if (rawValues.length === 0) return null;
        const metrics = histogramUtils.calculateDistributionMetrics(rawValues);
        console.log('📐 RAW Metrics:', {
            mean: metrics?.mean?.toFixed(2),
            skewness: metrics?.skewness?.toFixed(3),
            outliers: 'calculated separately'
        });
        return metrics;
    }, [rawValues]);

    const cleanedMetrics = useMemo(() => {
        if (cleanedValues.length === 0) return null;
        const metrics = histogramUtils.calculateDistributionMetrics(cleanedValues);
        console.log('📐 CLEANED Metrics:', {
            mean: metrics?.mean?.toFixed(2),
            skewness: metrics?.skewness?.toFixed(3)
        });
        return metrics;
    }, [cleanedValues]);

    // Get recommendation based on raw data
    const recommendation = useMemo(() => {
        if (!rawMetrics) return null;
        const rec = histogramUtils.recommendOutlierMethod(rawMetrics);
        console.log('💡 AI Recommendation:', rec?.method, 'threshold:', rec?.threshold);
        return rec;
    }, [rawMetrics]);

    // Count outliers in RAW data
    const outlierCount = useMemo(() => {
        if (!rawValues.length || !cleaningConfig) return 0;
        const count = histogramUtils.countOutliers(
            rawValues,
            cleaningConfig.outlierMethod,
            cleaningConfig.outlierThreshold
        );
        console.log(`⚠️ Outliers detected in RAW data: ${count}`);
        return count;
    }, [rawValues, cleaningConfig]);

    // Count outliers in CLEANED data (should be 0 or much less)
    const cleanedOutlierCount = useMemo(() => {
        if (!cleanedValues.length || !cleaningConfig) return 0;
        const count = histogramUtils.countOutliers(
            cleanedValues,
            cleaningConfig.outlierMethod,
            cleaningConfig.outlierThreshold
        );
        console.log(`✅ Outliers remaining in CLEANED data: ${count}`);
        return count;
    }, [cleanedValues, cleaningConfig]);

    // Auto-apply recommendation to config (ONLY ONCE)
    useEffect(() => {
        if (recommendation && onConfigChange && !cleaningConfig.outlierMethod) {
            console.log('🔧 Auto-applying recommendation:', recommendation.method);
            onConfigChange({
                ...cleaningConfig,
                outlierMethod: recommendation.method,
                outlierThreshold: recommendation.threshold
            });
        }
    }, [recommendation]); // Only run when recommendation changes

    if (!data || numericColumns.length === 0) {
        return null;
    }

    return (
        <div className="mb-6 bg-slate-800/30 rounded-xl border border-slate-700/50 overflow-hidden">
            {/* Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-700/20 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-blue-500/20">
                        <span className="text-xl">📊</span>
                    </div>
                    <div className="text-left">
                        <h3 className="font-semibold text-slate-200 text-lg">
                            Distribution Analysis & Cleaning Preview
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Visualize data distribution and preview cleaning effects
                        </p>
                    </div>
                </div>
                {isExpanded ? (
                    <ChevronDown className="text-slate-400" size={20} />
                ) : (
                    <ChevronRight className="text-slate-400" size={20} />
                )}
            </button>

            {/* Content */}
            {isExpanded && (
                <div className="px-6 pb-6 space-y-6">
                    {/* Controls Row */}
                    <div className="flex items-center gap-4 flex-wrap bg-slate-900/50 p-4 rounded-lg border border-slate-700/30">
                        {/* Column Selector */}
                        <div className="flex-1 min-w-[200px]">
                            <label className="text-xs text-slate-400 mb-1.5 block">
                                Select Column
                            </label>
                            <select
                                value={selectedColumn}
                                onChange={(e) => setSelectedColumn(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            >
                                {numericColumns.map(col => (
                                    <option key={col} value={col}>{col}</option>
                                ))}
                            </select>
                        </div>

                        {/* Bin Count Slider */}
                        <div className="flex-1 min-w-[200px]">
                            <label className="text-xs text-slate-400 mb-1.5 block">
                                Bins: {binCount}
                            </label>
                            <input
                                type="range"
                                min="5"
                                max="20"
                                value={binCount}
                                onChange={(e) => setBinCount(parseInt(e.target.value))}
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                        </div>

                        {/* View Toggle */}
                        <div className="flex-1 min-w-[200px]">
                            <label className="text-xs text-slate-400 mb-1.5 block">
                                View Mode
                            </label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setViewMode('before')}
                                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'before'
                                        ? 'bg-slate-600 text-slate-100'
                                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                        }`}
                                >
                                    Before
                                </button>
                                <button
                                    onClick={() => setViewMode('after')}
                                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'after'
                                        ? 'bg-green-600 text-white'
                                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                        }`}
                                >
                                    After
                                </button>
                                <button
                                    onClick={() => setViewMode('sidebyside')}
                                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'sidebyside'
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                        }`}
                                >
                                    Compare
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Histogram Display */}
                    <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
                        {viewMode === 'sidebyside' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30">
                                    <div className="mb-2 flex items-center gap-2">
                                        <span className="px-2 py-1 bg-slate-600 text-slate-100 text-xs font-medium rounded">
                                            BEFORE CLEANING
                                        </span>
                                    </div>
                                    <HistogramChart
                                        histogramData={rawHistogram}
                                        title={selectedColumn}
                                        color="#64748b"
                                        showLabel={false}
                                    />
                                </div>
                                <div className="bg-slate-900/50 rounded-lg p-4 border border-green-500/20">
                                    <div className="mb-2 flex items-center gap-2">
                                        <span className="px-2 py-1 bg-green-600 text-white text-xs font-medium rounded">
                                            AFTER CLEANING
                                        </span>
                                    </div>
                                    <HistogramChart
                                        histogramData={cleanedHistogram}
                                        title={selectedColumn}
                                        color="#22c55e"
                                        showLabel={false}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-700/30">
                                <div className="mb-4 flex items-center justify-between">
                                    <span className={`px-3 py-1.5 text-xs font-medium rounded-lg ${viewMode === 'before'
                                        ? 'bg-slate-600 text-slate-100'
                                        : 'bg-green-600 text-white'
                                        }`}>
                                        {viewMode === 'before' ? 'BEFORE CLEANING' : 'AFTER CLEANING'}
                                    </span>
                                </div>
                                <HistogramChart
                                    histogramData={viewMode === 'before' ? rawHistogram : cleanedHistogram}
                                    title={selectedColumn}
                                    color={viewMode === 'before' ? '#64748b' : '#22c55e'}
                                    showLabel={true}
                                />
                            </div>
                        )}
                    </div>

                    {/* Metrics and Recommendation */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <MetricsPanel
                            metrics={viewMode === 'after' ? cleanedMetrics : rawMetrics}
                            compareMetrics={viewMode === 'after' ? rawMetrics : null}
                            showComparison={viewMode === 'after'}
                        />
                        <RecommendationCard
                            recommendation={recommendation}
                            outlierCount={outlierCount}
                            metrics={rawMetrics}
                        />
                    </div>

                    {/* Validation Summary (only show in after/compare view) */}
                    {(viewMode === 'after' || viewMode === 'sidebyside') && cleanedMetrics && (
                        <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-lg p-4 border border-green-500/20">
                            <h4 className="font-medium text-slate-200 mb-2 flex items-center gap-2">
                                <span className="text-green-400">✓</span>
                                Cleaning Validation Summary
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                    <div className="text-slate-400 text-xs">Skewness Change</div>
                                    <div className="text-slate-100 font-medium">
                                        {rawMetrics.skewness.toFixed(2)} → {cleanedMetrics.skewness.toFixed(2)}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-slate-400 text-xs">Outliers</div>
                                    <div className="text-slate-100 font-medium">
                                        {outlierCount} → {cleanedOutlierCount}
                                        {outlierCount > cleanedOutlierCount && (
                                            <span className="text-green-400 ml-1">✓</span>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-slate-400 text-xs">Distribution</div>
                                    <div className="text-slate-100 font-medium">
                                        {cleanedMetrics.isNormal ? '✓ Normal' : '⚠ Skewed'}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-slate-400 text-xs">Data Quality</div>
                                    <div className={`font-medium ${Math.abs(cleanedMetrics.skewness) < Math.abs(rawMetrics.skewness)
                                            ? 'text-green-400'
                                            : 'text-amber-400'
                                        }`}>
                                        {Math.abs(cleanedMetrics.skewness) < Math.abs(rawMetrics.skewness)
                                            ? 'Improved'
                                            : 'Check Config'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
