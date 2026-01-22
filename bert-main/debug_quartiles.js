import { statsUtils } from './services/sharedUtils.js';

// Simulating what happens in cleanData
const values = [10, 10, 10, 1000]; // Valid numeric values from original data

console.log('Values:', values);
console.log('Mean:', statsUtils.mean(values));
console.log('Median:', statsUtils.median(values));

const quartiles = statsUtils.quartiles(values);
console.log('\nQuartiles:', quartiles);

// IQR outlier detection
const threshold = 1.5;
const lowerBound = quartiles.q1 - threshold * quartiles.iqr;
const upperBound = quartiles.q3 + threshold * quartiles.iqr;

console.log('\nIQR Outlier Detection:');
console.log('Lower Bound:', lowerBound);
console.log('Upper Bound:', upperBound);
console.log('Is 1000 an outlier?', 1000 > upperBound ? 'YES' : 'NO');
