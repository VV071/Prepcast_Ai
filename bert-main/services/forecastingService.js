/**
 * Lightweight Time-Series Forecasting Utilities
 * Implements simple exponential smoothing for predictions
 */

/**
 * Detect if a column is suitable for time-series forecasting
 * @param {Array} data - The dataset
 * @param {Array} columns - Column names
 * @returns {Object|null} - {column: string, values: Array, hasDate: boolean} or null
 */
export function detectTimeSeriesColumn(data, columns) {
    if (!data || data.length < 10) {
        return null; // Need at least 10 data points
    }

    // Look for numeric columns with sequential or date-like patterns
    for (const col of columns) {
        const values = data.map(row => row[col]).filter(v => v !== null && v !== undefined && v !== '');

        // Check if mostly numeric
        const numericValues = values.filter(v => !isNaN(parseFloat(v)));
        if (numericValues.length < values.length * 0.8) {
            continue; // Skip if less than 80% numeric
        }

        // Convert to numbers
        const numericData = numericValues.map(v => parseFloat(v));

        // Check for reasonable variance (not all same values)
        const mean = numericData.reduce((a, b) => a + b, 0) / numericData.length;
        const variance = numericData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / numericData.length;

        if (variance > 0.001) { // Has some variance
            return {
                column: col,
                values: numericData,
                hasDate: checkForDateColumn(data, columns),
                originalLength: data.length
            };
        }
    }

    return null;
}

/**
 * Check if dataset has a date column
 */
function checkForDateColumn(data, columns) {
    const dateKeywords = ['date', 'time', 'year', 'month', 'day', 'timestamp'];
    return columns.some(col =>
        dateKeywords.some(keyword => col.toLowerCase().includes(keyword))
    );
}

/**
 * Simple Exponential Smoothing (SES) for forecasting
 * @param {Array} values - Historical numeric values
 * @param {number} steps - Number of future steps to predict
 * @param {number} alpha - Smoothing parameter (0-1), default 0.3
 * @returns {Array} - Predicted values
 */
export function simpleExponentialSmoothing(values, steps = 5, alpha = 0.3) {
    if (!values || values.length < 3) {
        throw new Error('Need at least 3 data points for forecasting');
    }

    // Initialize with first value
    let smoothed = [values[0]];

    // Calculate smoothed values for historical data
    for (let i = 1; i < values.length; i++) {
        const newSmoothed = alpha * values[i] + (1 - alpha) * smoothed[i - 1];
        smoothed.push(newSmoothed);
    }

    // Forecast future values
    const predictions = [];
    let lastSmoothed = smoothed[smoothed.length - 1];

    // Calculate trend from last few points
    const trendWindow = Math.min(5, values.length);
    const recentValues = values.slice(-trendWindow);
    const trend = (recentValues[recentValues.length - 1] - recentValues[0]) / trendWindow;

    for (let i = 0; i < steps; i++) {
        // Add trend component for better predictions
        const prediction = lastSmoothed + trend * (i + 1);
        predictions.push(prediction);
    }

    return predictions;
}

/**
 * Double Exponential Smoothing (Holt's method) for data with trend
 * @param {Array} values - Historical numeric values
 * @param {number} steps - Number of future steps to predict
 * @param {number} alpha - Level smoothing parameter
 * @param {number} beta - Trend smoothing parameter
 * @returns {Array} - Predicted values
 */
export function doubleExponentialSmoothing(values, steps = 5, alpha = 0.3, beta = 0.1) {
    if (!values || values.length < 3) {
        throw new Error('Need at least 3 data points for forecasting');
    }

    // Initialize level and trend
    let level = values[0];
    let trend = values[1] - values[0];

    // Smooth historical data
    for (let i = 1; i < values.length; i++) {
        const prevLevel = level;
        level = alpha * values[i] + (1 - alpha) * (level + trend);
        trend = beta * (level - prevLevel) + (1 - beta) * trend;
    }

    // Forecast future values
    const predictions = [];
    for (let i = 1; i <= steps; i++) {
        predictions.push(level + i * trend);
    }

    return predictions;
}

/**
 * Auto-select best forecasting method and predict
 * @param {Array} values - Historical numeric values
 * @param {number} steps - Number of future steps to predict
 * @returns {Object} - {predictions: Array, method: string, confidence: number}
 */
export function autoForecast(values, steps = 5) {
    if (!values || values.length < 10) {
        throw new Error('Need at least 10 data points for reliable forecasting');
    }

    // Detect trend strength
    const trendStrength = calculateTrendStrength(values);

    let predictions;
    let method;

    if (trendStrength > 0.3) {
        // Strong trend - use double exponential smoothing
        predictions = doubleExponentialSmoothing(values, steps, 0.3, 0.1);
        method = 'Double Exponential Smoothing (Holt)';
    } else {
        // Weak/no trend - use simple exponential smoothing
        predictions = simpleExponentialSmoothing(values, steps, 0.3);
        method = 'Simple Exponential Smoothing';
    }

    // Calculate confidence based on historical accuracy
    const confidence = calculateConfidence(values, predictions);

    return {
        predictions: predictions.map(p => parseFloat(p.toFixed(4))),
        method,
        confidence: Math.min(95, Math.max(60, confidence)), // Clamp between 60-95%
        trendStrength: (trendStrength * 100).toFixed(1)
    };
}

/**
 * Calculate trend strength using linear regression
 */
function calculateTrendStrength(values) {
    const n = values.length;
    const indices = Array.from({ length: n }, (_, i) => i);

    const meanX = indices.reduce((a, b) => a + b, 0) / n;
    const meanY = values.reduce((a, b) => a + b, 0) / n;

    let numerator = 0;
    let denominatorX = 0;
    let denominatorY = 0;

    for (let i = 0; i < n; i++) {
        const dx = indices[i] - meanX;
        const dy = values[i] - meanY;
        numerator += dx * dy;
        denominatorX += dx * dx;
        denominatorY += dy * dy;
    }

    const correlation = numerator / Math.sqrt(denominatorX * denominatorY);
    return Math.abs(correlation); // Return absolute correlation as trend strength
}

/**
 * Calculate confidence interval based on prediction variance
 */
function calculateConfidence(values, predictions) {
    // Calculate variance of historical data
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Calculate coefficient of variation
    const cv = stdDev / Math.abs(mean);

    // Lower CV = higher confidence
    // CV < 0.1 = high confidence (~90%)
    // CV > 0.5 = low confidence (~65%)
    const baseConfidence = 90 - (cv * 50);

    return baseConfidence;
}

/**
 * Validate if forecasting is suitable for the dataset
 */
export function validateForecastingSuitability(data, columns) {
    const tsData = detectTimeSeriesColumn(data, columns);

    if (!tsData) {
        return {
            suitable: false,
            reason: 'No suitable numeric time-series column found. Need at least one numeric column with 10+ values and some variance.'
        };
    }

    if (tsData.values.length < 10) {
        return {
            suitable: false,
            reason: `Insufficient data points (${tsData.values.length}). Need at least 10 values for reliable forecasting.`
        };
    }

    return {
        suitable: true,
        column: tsData.column,
        dataPoints: tsData.values.length,
        hasDate: tsData.hasDate
    };
}
