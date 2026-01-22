import React, { useState } from 'react';
import { DistributionPanel } from './DistributionPanel';

// Sample healthcare data for testing
const sampleData = [
    { id: 1, patient_name: 'John', heart_rate: 72, bp_systolic: 120, age: 45 },
    { id: 2, patient_name: 'Mary', heart_rate: 75, bp_systolic: 125, age: 38 },
    { id: 3, patient_name: 'Bob', heart_rate: 68, bp_systolic: 115, age: 52 },
    { id: 4, patient_name: 'Alice', heart_rate: 78, bp_systolic: 130, age: 41 },
    { id: 5, patient_name: 'Charlie', heart_rate: 71, bp_systolic: 118, age: 47 },
    { id: 6, patient_name: 'Diana', heart_rate: 74, bp_systolic: 122, age: 39 },
    { id: 7, patient_name: 'Eve', heart_rate: 69, bp_systolic: 116, age: 44 },
    { id: 8, patient_name: 'Frank', heart_rate: 76, bp_systolic: 128, age: 50 },
    { id: 9, patient_name: 'Grace', heart_rate: 73, bp_systolic: 121, age: 43 },
    { id: 10, patient_name: 'Henry', heart_rate: 77, bp_systolic: 127, age: 48 },
    { id: 11, patient_name: 'Ivy', heart_rate: 70, bp_systolic: 119, age: 40 },
    { id: 12, patient_name: 'Jack', heart_rate: 120, bp_systolic: 180, age: 65 }, // Outlier
    { id: 13, patient_name: 'Kate', heart_rate: 72, bp_systolic: 120, age: 42 },
    { id: 14, patient_name: 'Leo', heart_rate: 75, bp_systolic: 124, age: 46 },
    { id: 15, patient_name: 'Mia', heart_rate: 71, bp_systolic: 117, age: 37 },
];

export const HistogramDemo = () => {
    const [cleaningConfig, setCleaningConfig] = useState({
        missingValueMethod: 'median',
        outlierMethod: 'iqr',
        outlierThreshold: 1.5
    });

    const columns = ['heart_rate', 'bp_systolic', 'age'];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-100 mb-2">
                        📊 Histogram Distribution Analysis Demo
                    </h1>
                    <p className="text-slate-400">
                        Enterprise-grade inline distribution analysis with before/after preview
                    </p>
                </div>

                <DistributionPanel
                    data={sampleData}
                    columns={columns}
                    cleaningConfig={cleaningConfig}
                    onConfigChange={setCleaningConfig}
                />

                <div className="mt-6 bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
                    <h3 className="text-slate-200 font-semibold mb-4">Current Cleaning Configuration</h3>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                            <label className="text-slate-400 block mb-2">Missing Value Method</label>
                            <select
                                value={cleaningConfig.missingValueMethod}
                                onChange={(e) => setCleaningConfig({
                                    ...cleaningConfig,
                                    missingValueMethod: e.target.value
                                })}
                                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200"
                            >
                                <option value="mean">Mean</option>
                                <option value="median">Median</option>
                                <option value="multiple">Multiple Imputation</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-slate-400 block mb-2">Outlier Method</label>
                            <select
                                value={cleaningConfig.outlierMethod}
                                onChange={(e) => setCleaningConfig({
                                    ...cleaningConfig,
                                    outlierMethod: e.target.value
                                })}
                                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200"
                            >
                                <option value="zscore">Z-Score</option>
                                <option value="iqr">IQR</option>
                                <option value="winsorize">Winsorize</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-slate-400 block mb-2">
                                Threshold ({cleaningConfig.outlierThreshold})
                            </label>
                            <input
                                type="range"
                                min="0.5"
                                max="5"
                                step="0.1"
                                value={cleaningConfig.outlierThreshold}
                                onChange={(e) => setCleaningConfig({
                                    ...cleaningConfig,
                                    outlierThreshold: parseFloat(e.target.value)
                                })}
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500 mt-2"
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-6 bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
                    <h4 className="text-blue-300 font-medium mb-2">💡 Features Demonstrated:</h4>
                    <ul className="text-sm text-slate-300 space-y-1 list-disc list-inside">
                        <li>Automatic bin calculation using Sturges' rule</li>
                        <li>Skewness and kurtosis analysis</li>
                        <li>AI-powered outlier method recommendation</li>
                        <li>Before/After toggle with live preview</li>
                        <li>Side-by-side comparison view</li>
                        <li>Real-time metric updates</li>
                        <li>Smooth animations and transitions</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};
