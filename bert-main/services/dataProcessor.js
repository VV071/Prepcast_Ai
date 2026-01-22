import { statsUtils } from './sharedUtils.js';

// Helper for numeric check
const isNumeric = (n) => !isNaN(parseFloat(n)) && isFinite(n);

/* =====================================================
   DATA CLEANING
===================================================== */

export const cleanData = (
    data,
    columns,
    cleaningConfig,
    rowsToProcess // Optional optimization for delta cleaning
) => {
    // Deep copy to avoid mutation issues
    // Using simple spread map for performance if structure allows, 
    // but sticking to JSON parse/stringify guarantees deep integrity.
    let processed = JSON.parse(JSON.stringify(data));

    // Calculate Global Stats for columns (on the full original dataset to be stable)
    const colStats = {};
    columns.forEach(col => {
        const values = data.map(r => r[col]).filter(v => isNumeric(v)).map(v => Number(v));
        if (!values.length) return;

        colStats[col] = {
            mean: statsUtils.mean(values),
            median: statsUtils.median(values),
            std: statsUtils.std(values),
            quartiles: statsUtils.quartiles(values) // returns {q1, q3, iqr}
        };
    });

    // Determine rows to iterate
    const indicesToProcess = rowsToProcess || processed.map((_, i) => i);

    indicesToProcess.forEach(rowIndex => {
        const row = processed[rowIndex];

        columns.forEach((col) => {
            const stats = colStats[col];
            if (!stats) return; // Skip if no stats (e.g. empty or non-numeric column)

            // Current value
            let val = row[col];

            // 1. Missing Value Imputation
            if (val == null || val === "" || Number.isNaN(Number(val))) {
                if (cleaningConfig.missingValueMethod === "mean") {
                    row[col] = stats.mean;
                } else if (cleaningConfig.missingValueMethod === "median") {
                    row[col] = stats.median;
                } else if (cleaningConfig.missingValueMethod === "multiple") {
                    // Noise injection
                    row[col] = stats.median + (Math.random() - 0.5) * stats.std * 0.1;
                } else {
                    row[col] = stats.median; // Default fallback
                }
                // Update val for outlier check
                val = row[col];
            }

            const numVal = Number(val);
            if (isNaN(numVal)) return;

            // 2. Outlier Handling
            let isOutlier = false;
            const mean = stats.mean;
            const std = stats.std;
            const { q1, q3, iqr } = stats.quartiles;

            if (cleaningConfig.outlierMethod === "zscore") {
                if (std > 0 && Math.abs((numVal - mean) / std) > cleaningConfig.outlierThreshold) {
                    isOutlier = true;
                }
            } else if (cleaningConfig.outlierMethod === "iqr") {
                if (
                    numVal < q1 - cleaningConfig.outlierThreshold * iqr ||
                    numVal > q3 + cleaningConfig.outlierThreshold * iqr
                ) {
                    isOutlier = true;
                }
            } else if (cleaningConfig.outlierMethod === "winsorize") {
                // Determine implicit outlier by bounds
                const lower = mean - 2 * std; // Approx 5th percentile
                const upper = mean + 2 * std; // Approx 95th percentile
                if (numVal < lower || numVal > upper) isOutlier = true;
            }

            if (isOutlier) {
                if (cleaningConfig.outlierMethod === "zscore") {
                    // Clamp to mean (or threshold) - User snippet says "r[col] = mean"
                    row[col] = mean;
                } else if (cleaningConfig.outlierMethod === "iqr") {
                    // User snippet says "r[col] = median"
                    row[col] = stats.median;
                } else if (cleaningConfig.outlierMethod === "winsorize") {
                    const lower = mean - 2 * std;
                    const upper = mean + 2 * std;
                    row[col] = Math.max(lower, Math.min(upper, numVal));
                }
            }
        });
    });

    return processed;
};

/* =====================================================
   WEIGHTED STATISTICS
===================================================== */

export const calculateWeights = (
    data,
    columns,
    config
) => {
    const result = {};

    // Identify numeric columns
    const numericCols = columns.filter(col => {
        const validCount = data.filter(r => isNumeric(r[col])).length;
        return validCount > data.length * 0.5;
    });

    numericCols.forEach(col => {
        if (col === config.weightColumn) return;

        const values = [];
        const weights = [];

        data.forEach(row => {
            const val = parseFloat(row[col]);
            if (!isNaN(val)) {
                let w = 1;
                if (config.weightColumn && isNumeric(row[config.weightColumn])) {
                    w = parseFloat(row[config.weightColumn]);
                }
                // Clamp negative weights
                if (w < 0) w = 0;

                values.push(val);
                weights.push(w);
            }
        });

        if (values.length === 0) return;

        const sumWeights = weights.reduce((a, b) => a + b, 0);
        const sumWeightsSq = weights.reduce((a, b) => a + (b * b), 0);

        if (sumWeights === 0) return;

        // Weighted Mean
        const weightedSum = values.reduce((sum, val, idx) => sum + (val * weights[idx]), 0);
        const weightedMean = weightedSum / sumWeights;

        // Weighted Variance
        const varianceNum = values.reduce((sum, val, idx) => {
            return sum + weights[idx] * Math.pow(val - weightedMean, 2);
        }, 0);
        const variance = varianceNum / sumWeights;

        // Effective Sample Size
        const effectiveN = (sumWeights * sumWeights) / sumWeightsSq;

        // Standard Error (using effective N)
        const stdError = Math.sqrt(variance / effectiveN);

        // Margin of Error (95%)
        const moe = 1.96 * stdError;

        result[col] = {
            mean: weightedMean,
            standardError: stdError,
            marginOfError: moe,
            sampleSize: values.length,
            effectiveSampleSize: effectiveN
        };
    });

    return result;
};

// Backwards compatibility alias if needed
export const computeStatistics = calculateWeights;
