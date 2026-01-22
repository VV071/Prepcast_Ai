/* =====================================================
   DOMAIN CONFIG
===================================================== */

export const domainPatterns = {
  healthcare: {
    description: "Healthcare medical clinical patient data",
    keywords: ["patient", "bp", "heart", "diagnosis", "hospital"],
    semanticTerms: ["blood pressure", "clinical", "symptom"],
    contextPatterns: ["bp\\s*\\d+", "heart\\s*rate"],
    cleaningConfig: {
      missingValueMethod: "median",
      outlierMethod: "iqr",
      outlierThreshold: 1.5,
    },
    confidence: 0,
  },
  finance: {
    description: "Finance banking transactions payments",
    keywords: ["amount", "transaction", "account", "balance"],
    semanticTerms: ["credit", "debit", "loan"],
    contextPatterns: ["₹\\s*\\d+", "txn"],
    cleaningConfig: {
      missingValueMethod: "mean",
      outlierMethod: "zscore",
      outlierThreshold: 3,
    },
    confidence: 0,
  },
  ecommerce: {
    description: "Ecommerce orders products customers",
    keywords: ["order", "product", "customer", "price"],
    semanticTerms: ["cart", "sku"],
    contextPatterns: ["order\\s*id"],
    cleaningConfig: {
      missingValueMethod: "median",
      outlierMethod: "winsorize",
      outlierThreshold: 0.05,
    },
    confidence: 0,
  },
  hr: {
    description: "Human resources employees payroll",
    keywords: ["employee", "salary", "department"],
    semanticTerms: ["attendance", "leave"],
    contextPatterns: ["emp\\s*id"],
    cleaningConfig: {
      missingValueMethod: "mean",
      outlierMethod: "iqr",
      outlierThreshold: 1.5,
    },
    confidence: 0,
  },
  general: {
    confidence: 0,
    cleaningConfig: {
      missingValueMethod: "mean", // Default fallback
      outlierMethod: "zscore",
      outlierThreshold: 3
    },
  },
};

/* =====================================================
   NLP + MATH UTILS
===================================================== */

export const cosineSimilarity = (a, b) => {
  let dot = 0,
    na = 0,
    nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
};

export const tokenize = (text) =>
  text.toLowerCase().match(/\b[a-z_]+\b/g) || [];

/* ---------------- TEXT PROCESSING ---------------- */

export const textUtils = {
  levenshtein(a, b) {
    const m = Array(b.length + 1)
      .fill()
      .map(() => Array(a.length + 1).fill(0));
    for (let i = 0; i <= a.length; i++) m[0][i] = i;
    for (let j = 0; j <= b.length; j++) m[j][0] = j;
    for (let j = 1; j <= b.length; j++) {
      for (let i = 1; i <= a.length; i++) {
        m[j][i] =
          a[i - 1] === b[j - 1]
            ? m[j - 1][i - 1]
            : Math.min(
              m[j - 1][i] + 1,
              m[j][i - 1] + 1,
              m[j - 1][i - 1] + 1
            );
      }
    }
    return m[b.length][a.length];
  },
};

/* ---------------- STATISTICS ---------------- */

export const statsUtils = {
  mean: (v) => v.reduce((a, b) => a + b, 0) / v.length,
  median: (v) => {
    const s = [...v].sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  },
  std: (v) => {
    const m = statsUtils.mean(v);
    return Math.sqrt(
      v.reduce((s, x) => s + Math.pow(x - m, 2), 0) / v.length
    );
  },
  quartiles: (v) => {
    const s = [...v].sort((a, b) => a - b);
    const q1 = statsUtils.median(s.slice(0, s.length / 2));
    const q3 = statsUtils.median(s.slice(Math.ceil(s.length / 2)));
    return { q1, q3, iqr: q3 - q1 };
  },
};

/* ---------------- HISTOGRAM & DISTRIBUTION ANALYSIS ---------------- */

export const histogramUtils = {
  /**
   * Generate histogram bins and frequencies
   * @param {Array} values - Numeric values
   * @param {number} binCount - Number of bins (default: auto-calculate)
   * @returns {Object} - Histogram data with bins, frequencies, and metadata
   */
  generateHistogram(values, binCount = null) {
    if (!values || values.length === 0) return null;

    const optimalBins = binCount || this.getOptimalBins(values.length);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    const binWidth = range / optimalBins;

    const bins = [];
    for (let i = 0; i < optimalBins; i++) {
      const binMin = min + i * binWidth;
      const binMax = min + (i + 1) * binWidth;
      bins.push({
        range: `${binMin.toFixed(1)}-${binMax.toFixed(1)}`,
        min: binMin,
        max: binMax,
        midpoint: (binMin + binMax) / 2,
        count: 0,
        frequency: 0
      });
    }

    values.forEach(val => {
      const binIndex = Math.min(Math.floor((val - min) / binWidth), optimalBins - 1);
      if (binIndex >= 0 && binIndex < bins.length) {
        bins[binIndex].count++;
      }
    });

    const total = values.length;
    bins.forEach(bin => {
      bin.frequency = bin.count / total;
    });

    return { bins, binWidth, min, max, range, binCount: optimalBins, totalValues: total };
  },

  /**
   * Calculate distribution metrics (skewness, kurtosis, normality)
   */
  calculateDistributionMetrics(values) {
    if (!values || values.length < 3) return null;

    const n = values.length;
    const mean = statsUtils.mean(values);
    const std = statsUtils.std(values);
    const median = statsUtils.median(values);

    // Calculate mode
    const freq = {};
    values.forEach(v => {
      const rounded = Math.round(v * 10) / 10;
      freq[rounded] = (freq[rounded] || 0) + 1;
    });
    const mode = parseFloat(Object.keys(freq).reduce((a, b) => freq[a] > freq[b] ? a : b));

    // Skewness
    let skewnessSum = 0;
    values.forEach(x => {
      skewnessSum += Math.pow((x - mean) / std, 3);
    });
    const skewness = skewnessSum / n;

    // Kurtosis
    let kurtosisSum = 0;
    values.forEach(x => {
      kurtosisSum += Math.pow((x - mean) / std, 4);
    });
    const kurtosis = kurtosisSum / n;

    const isNormal = Math.abs(skewness) < 0.5 && Math.abs(kurtosis - 3) < 1;

    let skewnessLabel = "Symmetric";
    if (skewness > 0.5) skewnessLabel = "Right-skewed";
    else if (skewness < -0.5) skewnessLabel = "Left-skewed";

    let kurtosisLabel = "Normal tails";
    if (kurtosis > 4) kurtosisLabel = "Heavy tails";
    else if (kurtosis < 2) kurtosisLabel = "Light tails";

    return {
      mean, median, mode, std,
      skewness: parseFloat(skewness.toFixed(3)),
      skewnessLabel,
      kurtosis: parseFloat(kurtosis.toFixed(3)),
      kurtosisLabel,
      isNormal,
      sampleSize: n
    };
  },

  getOptimalBins(n) {
    return Math.max(5, Math.min(20, Math.ceil(1 + 3.322 * Math.log10(n))));
  },

  recommendOutlierMethod(metrics) {
    if (!metrics) return { method: "zscore", threshold: 3, reason: "Default" };

    const { skewness, kurtosis, isNormal } = metrics;

    if (isNormal) {
      return {
        method: "zscore",
        threshold: 3.0,
        reason: "Normal distribution detected"
      };
    }

    if (Math.abs(skewness) > 0.5) {
      return {
        method: "iqr",
        threshold: 1.5,
        reason: `${metrics.skewnessLabel} - IQR is more robust`
      };
    }

    if (kurtosis > 4) {
      return {
        method: "winsorize",
        threshold: 0.05,
        reason: "Heavy tails - Cap extreme values"
      };
    }

    return { method: "zscore", threshold: 3.0, reason: "Standard method" };
  },

  countOutliers(values, method, threshold) {
    if (!values || values.length === 0) return 0;

    const mean = statsUtils.mean(values);
    const std = statsUtils.std(values);
    const { q1, q3, iqr } = statsUtils.quartiles(values);

    let count = 0;
    values.forEach(val => {
      let isOutlier = false;
      if (method === "zscore") {
        if (std > 0 && Math.abs((val - mean) / std) > threshold) isOutlier = true;
      } else if (method === "iqr") {
        if (val < q1 - threshold * iqr || val > q3 + threshold * iqr) isOutlier = true;
      } else if (method === "winsorize") {
        const lower = mean - 2 * std;
        const upper = mean + 2 * std;
        if (val < lower || val > upper) isOutlier = true;
      }
      if (isOutlier) count++;
    });

    return count;
  }
};
