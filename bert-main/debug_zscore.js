import { statsUtils } from './services/sharedUtils.js';

const values = [10, 10, 10, 1000];
const mean = statsUtils.mean(values);
const std = statsUtils.std(values);

console.log('Values:', values);
console.log('Mean:', mean);
console.log('Std Dev:', std);

const zscore1000 = Math.abs((1000 - mean) / std);
console.log('\nZ-score of 1000:', zscore1000);
console.log('Threshold: 3');
console.log('Is outlier?', zscore1000 > 3 ? 'YES' : 'NO');
