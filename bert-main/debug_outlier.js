import { cleanData } from './services/dataProcessor.js';

const testData = [
    { id: 1, val: 10 },
    { id: 2, val: 10 },
    { id: 3, val: "oops_text" },
    { id: 4, val: 1000 },
    { id: 5, val: 10 }
];

const config = {
    missingValueMethod: 'median',
    outlierMethod: 'iqr',
    outlierThreshold: 1.5
};

console.log('Original Data:', testData);
const cleaned = cleanData(testData, ['val'], config);
console.log('Cleaned Data:', cleaned);
console.log('\nRow 3 (text error):', cleaned[2]);
console.log('Row 4 (outlier):', cleaned[3]);
