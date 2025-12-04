// Helper for numeric check
const isNumeric = (n) => !isNaN(parseFloat(n)) && isFinite(n);

// Statistical Utils
export const getMean = (values) => values.reduce((a, b) => a + b, 0) / values.length;

export const getMedian = (values) => {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

export const getStandardDeviation = (values) => {
    const mean = getMean(values);
    return Math.sqrt(values.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / values.length);
};

export const getQuartiles = (values) => {
    const sorted = [...values].sort((a, b) => a - b);
    const q1 = getMedian(sorted.slice(0, Math.floor(sorted.length / 2)));
    const q3 = getMedian(sorted.slice(Math.ceil(sorted.length / 2)));
    return { q1, q3, iqr: q3 - q1 };
};

export const cleanData = (
    data,
    columns,
    config,
    rowsToProcess // Optional optimization for delta cleaning
) => {
    // Create a deep copy to avoid mutation issues
    let processed = JSON.parse(JSON.stringify(data));

    // Identify numeric columns
    const numericCols = columns.filter(col => {
        const validCount = data.filter(r => isNumeric(r[col])).length;
        return validCount > data.length * 0.5; // If >50% are numbers, treat as numeric
    });

    // Calculate stats for imputation ONCE based on full dataset
    const colStats = {};

    numericCols.forEach(col => {
        const values = data
            .map(r => parseFloat(r[col]))
            .filter(v => !isNaN(v));

        if (values.length > 0) {
            const q = getQuartiles(values);
            colStats[col] = {
                mean: getMean(values),
                median: getMedian(values),
                stdDev: getStandardDeviation(values),
                q1: q.q1,
                q3: q.q3,
                iqr: q.iqr
            };
        }
    });

    // Function to process a single row index
    const processRow = (rowIndex) => {
        const row = processed[rowIndex];

        numericCols.forEach(col => {
            let val = row[col];
            const stats = colStats[col];
            if (!stats) return;

            // 1. Missing Value Imputation
            if (val === null || val === "" || val === undefined || isNaN(Number(val))) {
                if (config.missingValueMethod === 'mean') row[col] = stats.mean;
                else if (config.missingValueMethod === 'median') row[col] = stats.median;
                else if (config.missingValueMethod === 'multiple') {
                    // Simple noise injection for 'multiple' simulation
                    row[col] = stats.median + (Math.random() - 0.5) * stats.stdDev * 0.1;
                }
                else row[col] = stats.mean; // Default
                val = row[col]; // Update val for next step
            }

            // 2. Outlier Handling
            const numVal = parseFloat(val);
            let isOutlier = false;

            if (config.outlierMethod === 'iqr') {
                const lower = stats.q1 - (config.outlierThreshold * stats.iqr);
                const upper = stats.q3 + (config.outlierThreshold * stats.iqr);
                if (numVal < lower || numVal > upper) isOutlier = true;
            } else if (config.outlierMethod === 'zscore') {
                const z = Math.abs((numVal - stats.mean) / stats.stdDev);
                if (z > config.outlierThreshold) isOutlier = true;
            }

            // Winsorize logic (clamp)
            if (isOutlier) {
                // Determine direction
                if (config.outlierMethod === 'iqr') {
                    const lower = stats.q1 - (config.outlierThreshold * stats.iqr);
                    const upper = stats.q3 + (config.outlierThreshold * stats.iqr);
                    row[col] = numVal < lower ? lower : upper;
                } else if (config.outlierMethod === 'zscore') {
                    // Clamp to N std devs
                    const sign = numVal > stats.mean ? 1 : -1;
                    row[col] = stats.mean + (sign * config.outlierThreshold * stats.stdDev);
                } else if (config.outlierMethod === 'winsorize') {
                    // Simple winsorize to 5th/95th percentile approximation via Mean +/- 2SD
                    const lower = stats.mean - 2 * stats.stdDev;
                    const upper = stats.mean + 2 * stats.stdDev;
                    row[col] = Math.max(lower, Math.min(upper, numVal));
                }
            }
        });
    };

    if (rowsToProcess) {
        // Delta cleaning
        rowsToProcess.forEach(idx => processRow(idx));
    } else {
        // Full cleaning
        for (let i = 0; i < processed.length; i++) {
            processRow(i);
        }
    }

    return processed;
};

export const calculateWeights = (
    data,
    columns,
    config
) => {
    const result = {};

    const numericCols = columns.filter(col => {
        const validCount = data.filter(r => isNumeric(r[col])).length;
        return validCount > data.length * 0.5;
    });

    numericCols.forEach(col => {
        if (col === config.weightColumn) return; // Don't analyze the weight column itself

        const values = [];
        const weights = [];

        data.forEach(row => {
            const val = parseFloat(row[col]);
            if (!isNaN(val)) {
                values.push(val);
                const w = config.weightColumn && isNumeric(row[config.weightColumn])
                    ? parseFloat(row[config.weightColumn])
                    : 1;
                weights.push(w);
            }
        });

        if (values.length === 0) return;

        const totalWeight = weights.reduce((a, b) => a + b, 0);
        const weightedSum = values.reduce((sum, val, idx) => sum + (val * weights[idx]), 0);
        const weightedMean = weightedSum / totalWeight;

        // Variance approximation for weighted data
        const variance = values.reduce((sum, val, idx) => {
            return sum + weights[idx] * Math.pow(val - weightedMean, 2);
        }, 0) / totalWeight;

        const stdError = Math.sqrt(variance / values.length);
        const moe = 1.96 * stdError; // 95% CI

        result[col] = {
            mean: weightedMean,
            standardError: stdError,
            marginOfError: moe,
            sampleSize: values.length
        };
    });

    return result;
};
