import React, { useState, useCallback, useRef } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { TrendingUp, FileSpreadsheet, Upload as UploadIcon, Database, RefreshCw, Zap, ArrowRight, RotateCcw, Target, FileText, Download, CheckCircle, LogOut, LineChart, Brain, Loader2 } from 'lucide-react';
import StepIndicator from './StepIndicator';
import Sidebar from './Sidebar';
import { Logo } from './Logo';
import { DOMAIN_INFO } from '../constants';
import { detectDomainWithGemini } from '../services/geminiService';
import { cleanData, calculateWeights } from '../services/dataProcessor';
import { detectTimeSeriesColumn, autoForecast, validateForecastingSuitability } from '../utils/forecasting';
import { generateHTMLReport } from '../utils/reportGenerator';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '../supabaseClient';
import { updateSession, uploadSessionFile, updateFileProcessingStatus, subscribeToFileProcessing } from '../services/sessionService';

const INITIAL_STATE = {
    currentStep: 0,
    rawData: [],
    processedData: [],
    columns: [],
    cleaningConfig: {
        missingValueMethod: 'mean',
        outlierMethod: 'iqr',
        outlierThreshold: 1.5,
        enableRuleValidation: true
    },
    weightConfig: {
        weightColumn: '',
        designWeights: true,
        computeMarginOfError: true
    },
    processingLogs: [],
    statistics: {},
    isProcessing: false,
    detectedDomain: 'general',
    fileName: '',
    changedCells: new Map(),
    forecastData: null,
    isForecastLoading: false,
    forecastError: null
};

export const PrepCastAI = ({ session, onLogout, hideHeader = false }) => {
    const [state, setState] = useState(INITIAL_STATE);
    const fileInputRef = useRef(null);
    const lastSessionIdRef = useRef(null);

    // Load session data on mount
    React.useEffect(() => {
        if (session) {
            const isNewSession = session.id !== lastSessionIdRef.current;
            if (isNewSession) {
                lastSessionIdRef.current = session.id;
            }

            setState(prev => ({
                ...prev,
                fileName: session.session_name || prev.fileName,
                rawData: session.raw_data || prev.rawData,
                processedData: session.processed_data || session.raw_data || prev.processedData,
                columns: session.raw_data && session.raw_data.length > 0 ? Object.keys(session.raw_data[0]) : prev.columns,
                cleaningConfig: session.cleaning_config || prev.cleaningConfig,
                weightConfig: session.weight_config || prev.weightConfig,
                statistics: session.statistics || prev.statistics,
                forecastData: session.forecast_data || prev.forecastData,
                currentStep: isNewSession ? (session.current_step ?? 0) : prev.currentStep
            }));
        }
    }, [session]);

    const [uploadedFileId, setUploadedFileId] = useState(null);

    const saveToDatabase = async (updates) => {
        if (!session?.id) return;

        try {
            await updateSession(session.id, {
                ...updates,
                updated_at: new Date().toISOString()
            });
        } catch (error) {
            // Error handling silent for production
        }
    }


    const addLog = useCallback((type, message) => {
        setState(prev => ({
            ...prev,
            processingLogs: [
                ...prev.processingLogs,
                {
                    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    type,
                    message,
                    timestamp: new Date().toLocaleTimeString()
                }
            ]
        }));
    }, []);

    const handleFileUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setState(prev => ({ ...prev, isProcessing: true, fileName: file.name }));
        addLog('info', `Uploading file: ${file.name}`);

        const processData = async (data, columns) => {
            if (data.length === 0 || columns.length === 0) {
                addLog('error', 'File appears to be empty or invalid.');
                setState(prev => ({ ...prev, isProcessing: false }));
                return;
            }

            addLog('success', `Loaded ${data.length} records, ${columns.length} columns.`);

            let uploadedFile = null;
            if (session?.id) {
                // ADDED: Domain detection logic
                let domain = 'general';
                try {
                    const sampleData = data.slice(0, 5);
                    const detectionResult = await detectDomainWithGemini(columns, sampleData);
                    domain = detectionResult.domain || 'general';
                } catch (err) {
                    addLog('warning', 'Domain detection failed, defaulting to General.');
                }

                addLog('success', `Domain detected: ${domain.toUpperCase()}`);

                const defaultConfig = DOMAIN_INFO[domain].defaultConfig;

                setState(prev => ({
                    ...prev,
                    rawData: data,
                    processedData: data,
                    columns,
                    detectedDomain: domain,
                    cleaningConfig: { ...prev.cleaningConfig, ...defaultConfig },
                    currentStep: 1,
                    isProcessing: false
                }));

                if (uploadedFile?.id) {
                    setUploadedFileId(uploadedFile.id);
                    try {
                        await updateFileProcessingStatus(uploadedFile.id, 'processing');
                        addLog('info', 'File processing status updated to: processing');
                    } catch (error) {
                        // Silent failure
                    }
                }
            }

            saveToDatabase({
                raw_data: data,
                processed_data: data,
                current_step: 1,
                original_record_count: data.length
            });
        };

        if (file.name.endsWith('.csv')) {
            Papa.parse(file, {
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true,
                complete: (results) => {
                    processData(results.data, results.meta.fields || []);
                },
                error: (err) => {
                    addLog('error', `CSV Parse Error: ${err.message}`);
                    setState(prev => ({ ...prev, isProcessing: false }));
                }
            });
        } else {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const workbook = XLSX.read(e.target?.result, { type: 'binary' });
                    const sheetName = workbook.SheetNames[0];
                    const sheet = workbook.Sheets[sheetName];
                    const json = XLSX.utils.sheet_to_json(sheet);
                    if (json.length) {
                        processData(json, Object.keys(json[0]));
                    } else {
                        throw new Error("Empty Excel sheet");
                    }
                } catch (err) {
                    addLog('error', `Excel Parse Error: ${err.message}`);
                    setState(prev => ({ ...prev, isProcessing: false }));
                }
            };
            reader.readAsBinaryString(file);
        }
    };

    const executeCleaning = () => {
        setState(prev => ({ ...prev, isProcessing: true }));
        addLog('info', `Starting cleaning: ${state.cleaningConfig.missingValueMethod} imputation, ${state.cleaningConfig.outlierMethod} outliers.`);

        setTimeout(() => {
            const cleaned = cleanData(state.rawData, state.columns, state.cleaningConfig);
            setState(prev => ({
                ...prev,
                processedData: cleaned,
                currentStep: 3,
                isProcessing: false,
                changedCells: new Map()
            }));

            saveToDatabase({
                processed_data: cleaned,
                cleaning_config: state.cleaningConfig,
                current_step: 3,
                processed_record_count: cleaned.length
            });

            if (uploadedFileId) {
                updateFileProcessingStatus(uploadedFileId, 'completed', {
                    cleaned_row_count: cleaned.length
                }).then(() => {
                    addLog('success', 'File processing completed and status updated.');
                }).catch(error => {
                    // Silent failure
                });
            }

            addLog('success', 'Full data cleaning completed.');
        }, 500);
    };

    const executeDeltaCleaning = () => {
        if (state.changedCells.size === 0) return;
        setState(prev => ({ ...prev, isProcessing: true }));

        const rowsToUpdate = new Set();
        state.changedCells.forEach(val => rowsToUpdate.add(val.row));

        addLog('info', `Delta cleaning ${rowsToUpdate.size} modified rows...`);

        setTimeout(() => {
            const reCleaned = cleanData(state.processedData, state.columns, state.cleaningConfig, rowsToUpdate);

            setState(prev => ({
                ...prev,
                processedData: reCleaned,
                changedCells: new Map(),
                isProcessing: false
            }));

            saveToDatabase({
                processed_data: reCleaned,
                processed_record_count: reCleaned.length
            });

            addLog('success', 'Delta cleaning completed.');
        }, 300);
    };

    const handleCellEdit = (rowIndex, col, value) => {
        const newData = [...state.processedData];
        const oldValue = newData[rowIndex][col];

        let numericVal = parseFloat(value);
        newData[rowIndex] = { ...newData[rowIndex], [col]: isNaN(numericVal) ? value : numericVal };

        const cellKey = `${rowIndex}-${col}`;
        const newChangedCells = new Map(state.changedCells);
        newChangedCells.set(cellKey, { row: rowIndex, col, oldValue, newValue: value });

        setState(prev => ({
            ...prev,
            processedData: newData,
            changedCells: newChangedCells
        }));
    };

    const executeWeighting = () => {
        setState(prev => ({ ...prev, isProcessing: true }));
        addLog('info', 'Calculating weighted statistics...');

        setTimeout(() => {
            const stats = calculateWeights(state.processedData, state.columns, state.weightConfig);
            setState(prev => ({
                ...prev,
                statistics: stats,
                currentStep: 5,
                isProcessing: false
            }));

            saveToDatabase({
                statistics: stats,
                weight_config: state.weightConfig,
                current_step: 5
            });

            addLog('success', 'Statistical analysis completed.');

            // Auto-trigger forecasting
            setTimeout(() => runForecast(), 500);
        }, 500);
    };

    const exportData = (data, filename) => {
        const csv = Papa.unparse(data);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const runForecast = async () => {
        setState(prev => ({ ...prev, isForecastLoading: true, forecastError: null }));
        addLog('info', 'Analyzing data for time-series forecasting...');

        try {
            // Validate suitability
            const suitability = validateForecastingSuitability(
                state.processedData,
                state.columns
            );

            if (!suitability.suitable) {
                addLog('warning', suitability.reason);
                setState(prev => ({
                    ...prev,
                    isForecastLoading: false,
                    forecastError: suitability.reason
                }));
                return;
            }

            // Run forecast
            const tsData = detectTimeSeriesColumn(state.processedData, state.columns);
            const forecast = autoForecast(tsData.values, 5);

            const forecastData = {
                column: tsData.column,
                dataPoints: tsData.values.length,
                ...forecast
            };

            setState(prev => ({
                ...prev,
                forecastData,
                isForecastLoading: false
            }));

            saveToDatabase({
                forecast_data: forecastData
            });

            addLog('success', `Forecast completed using ${forecast.method}`);
        } catch (error) {
            addLog('error', `Forecasting failed: ${error.message}`);
            setState(prev => ({
                ...prev,
                isForecastLoading: false,
                forecastError: error.message
            }));
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        onLogout();
    };

    // --- Renders ---

    const renderUploadStep = () => (
        <div className="glass-card rounded-xl p-10 text-center animate-fade-in">
            <div className="border-2 border-dashed border-white/20 rounded-xl p-16 hover:border-blue-500 hover:bg-blue-500/5 transition-all cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}>
                <div className="w-20 h-20 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                    <FileSpreadsheet className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Upload Survey Data</h3>
                <p className="text-slate-400 mb-6">Supports .csv, .xlsx, .xls</p>
                <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium shadow-lg shadow-blue-500/20 hover:bg-blue-500 transition-colors">
                    Select File
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv,.xlsx,.xls" className="hidden" />
            </div>
        </div>
    );

    const renderSchemaStep = () => (
        <div className="glass-card rounded-xl p-8 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center">
                    <Database className="w-6 h-6 mr-3 text-blue-500" />
                    Schema & Domain
                </h2>
                {state.detectedDomain && (
                    <div className={`px-4 py-2 rounded-full border flex items-center ${DOMAIN_INFO[state.detectedDomain].color}`}>
                        <span className="font-semibold capitalize">{state.detectedDomain} Domain</span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h3 className="font-semibold text-slate-300 mb-4">Detected Columns</h3>
                    <div className="bg-black/20 rounded-lg p-4 max-h-96 overflow-y-auto border border-white/10">
                        {state.columns.map(col => (
                            <div key={col} className="flex justify-between items-center py-2 border-b last:border-0 border-white/5">
                                <span className="font-medium text-slate-300">{col}</span>
                                <span className="text-xs bg-white/10 text-slate-400 px-2 py-1 rounded">
                                    {typeof state.rawData[0][col]}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="space-y-6">
                    <div className="bg-blue-500/10 p-6 rounded-xl border border-blue-500/20">
                        <h3 className="font-semibold text-blue-300 mb-2">Dataset Summary</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-blue-400">Total Records</p>
                                <p className="text-2xl font-bold text-white">{state.rawData.length}</p>
                            </div>
                            <div>
                                <p className="text-sm text-blue-400">Columns</p>
                                <p className="text-2xl font-bold text-white">{state.columns.length}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-purple-500/10 p-6 rounded-xl border border-purple-500/20">
                        <h3 className="font-semibold text-purple-300 mb-2">AI Insight</h3>
                        <p className="text-sm text-purple-200">{DOMAIN_INFO[state.detectedDomain].description}</p>
                    </div>
                    <div className="flex justify-end pt-4">
                        <button onClick={() => setState(prev => ({ ...prev, currentStep: 2 }))}
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-500 transition flex items-center shadow-lg shadow-blue-500/20">
                            Configure Cleaning <ArrowRight className="ml-2 w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderCleaningStep = () => (
        <div className="glass-card rounded-xl p-8 animate-fade-in">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <RefreshCw className="w-6 h-6 mr-3 text-blue-500" />
                Cleaning Configuration
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Missing Value Imputation</label>
                        <select
                            value={state.cleaningConfig.missingValueMethod}
                            onChange={(e) => setState(prev => ({ ...prev, cleaningConfig: { ...prev.cleaningConfig, missingValueMethod: e.target.value } }))}
                            className="w-full p-3 bg-black/20 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                            <option value="mean">Mean Substitution</option>
                            <option value="median">Median Substitution</option>
                            <option value="multiple">Multiple Imputation (Simulated)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Outlier Detection</label>
                        <select
                            value={state.cleaningConfig.outlierMethod}
                            onChange={(e) => setState(prev => ({ ...prev, cleaningConfig: { ...prev.cleaningConfig, outlierMethod: e.target.value } }))}
                            className="w-full p-3 bg-black/20 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                            <option value="iqr">Interquartile Range (IQR)</option>
                            <option value="zscore">Z-Score</option>
                            <option value="winsorize">Winsorization</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Threshold</label>
                        <input
                            type="number"
                            step="0.1"
                            value={state.cleaningConfig.outlierThreshold}
                            onChange={(e) => setState(prev => ({ ...prev, cleaningConfig: { ...prev.cleaningConfig, outlierThreshold: parseFloat(e.target.value) } }))}
                            className="w-full p-3 bg-black/20 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>
                <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                    <h3 className="font-semibold text-white mb-4">Preview Configuration</h3>
                    <ul className="space-y-3 text-sm text-slate-400">
                        <li className="flex items-center"><Zap className="w-4 h-4 mr-2 text-amber-500" /> Domain: {state.detectedDomain}</li>
                        <li className="flex items-center"><Zap className="w-4 h-4 mr-2 text-amber-500" /> Method: {state.cleaningConfig.missingValueMethod}</li>
                        <li className="flex items-center"><Zap className="w-4 h-4 mr-2 text-amber-500" /> Outlier Logic: {state.cleaningConfig.outlierMethod} ({state.cleaningConfig.outlierThreshold})</li>
                    </ul>
                    <div className="mt-8 flex justify-end">
                        <button onClick={executeCleaning} disabled={state.isProcessing}
                            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-500 transition flex items-center shadow-lg shadow-green-500/20">
                            {state.isProcessing ? 'Processing...' : 'Start Cleaning'} <Zap className="ml-2 w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderLiveEditStep = () => (
        <div className="glass-card rounded-xl p-8 animate-fade-in flex flex-col h-[600px]">
            <div className="flex justify-between items-center mb-4 shrink-0">
                <h2 className="text-2xl font-bold text-white flex items-center">
                    <FileSpreadsheet className="w-6 h-6 mr-3 text-blue-500" />
                    Live Edit Mode
                </h2>
                <div className="flex gap-3">
                    <div className="px-4 py-2 bg-purple-500/10 text-purple-300 rounded-lg border border-purple-500/20 text-sm font-medium flex items-center">
                        <Zap className="w-4 h-4 mr-2" />
                        Delta Mode: {state.changedCells.size} edits
                    </div>
                    {state.changedCells.size > 0 && (
                        <button onClick={executeDeltaCleaning} disabled={state.isProcessing}
                            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-500 text-sm flex items-center transition shadow-lg shadow-purple-500/20">
                            {state.isProcessing ? 'Re-cleaning...' : 'Re-Clean Deltas'}
                        </button>
                    )}
                    <button onClick={() => {
                        setState(prev => ({ ...prev, currentStep: 4 }));
                        saveToDatabase({ current_step: 4 });
                    }}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-500 text-sm flex items-center transition shadow-lg shadow-blue-500/20">
                        Next: Weights <ArrowRight className="ml-2 w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-auto border border-white/10 rounded-lg relative bg-black/20">
                <table className="min-w-full divide-y divide-white/10">
                    <thead className="bg-white/5 sticky top-0 z-10">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider sticky left-0 bg-[#1e293b] z-20 border-r border-white/10">#</th>
                            {state.columns.map(col => (
                                <th key={col} className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider min-w-[150px]">{col}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {state.processedData.slice(0, 100).map((row, idx) => (
                            <tr key={idx} className="hover:bg-white/5">
                                <td className="px-4 py-2 text-xs text-slate-500 border-r border-white/10 bg-white/5 sticky left-0">{idx + 1}</td>
                                {state.columns.map(col => {
                                    const cellKey = `${idx}-${col}`;
                                    const isDirty = state.changedCells.has(cellKey);
                                    return (
                                        <td key={col}
                                            className={`px-2 py-1 text-sm border-r border-transparent ${isDirty ? 'bg-amber-500/10' : ''}`}
                                        >
                                            <input
                                                className={`w-full bg-transparent outline-none px-2 py-1 rounded ${isDirty ? 'text-amber-400 font-medium' : 'text-slate-300'}`}
                                                value={row[col] ?? ''}
                                                onChange={(e) => handleCellEdit(idx, col, e.target.value)}
                                            />
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="p-4 text-center text-sm text-slate-500 bg-white/5 border-t border-white/10 sticky bottom-0">
                    Showing first 100 rows for performance. Edits apply to actual data.
                </div>
            </div>
        </div>
    );

    const renderWeightStep = () => (
        <div className="glass-card rounded-xl p-8 animate-fade-in">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <Target className="w-6 h-6 mr-3 text-blue-500" />
                Weights & Analysis
            </h2>
            <div className="max-w-xl mx-auto space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Weight Column (Optional)</label>
                    <select
                        value={state.weightConfig.weightColumn}
                        onChange={(e) => setState(prev => ({ ...prev, weightConfig: { ...prev.weightConfig, weightColumn: e.target.value } }))}
                        className="w-full p-3 bg-black/20 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                        <option value="">-- No Weighting (Equal Weights) --</option>
                        {state.columns.map(col => <option key={col} value={col}>{col}</option>)}
                    </select>
                </div>
                <div className="flex items-center space-x-3 bg-white/5 p-4 rounded-lg border border-white/10">
                    <input
                        type="checkbox"
                        checked={state.weightConfig.computeMarginOfError}
                        onChange={(e) => setState(prev => ({ ...prev, weightConfig: { ...prev.weightConfig, computeMarginOfError: e.target.checked } }))}
                        className="w-5 h-5 text-blue-600 rounded border-slate-600 bg-black/20 focus:ring-blue-500"
                    />
                    <span className="text-slate-300 font-medium">Compute 95% Confidence Intervals</span>
                </div>
                <button onClick={executeWeighting} disabled={state.isProcessing}
                    className="w-full bg-blue-600 text-white px-6 py-4 rounded-lg hover:bg-blue-500 transition flex items-center justify-center font-semibold text-lg shadow-lg shadow-blue-500/20">
                    {state.isProcessing ? 'Calculating...' : 'Generate Statistics'} <Target className="ml-2 w-5 h-5" />
                </button>

                {state.isForecastLoading && (
                    <div className="mt-4 animate-fade-in">
                        <button disabled className="w-full bg-purple-500/10 text-purple-300 border border-purple-500/20 px-6 py-4 rounded-lg flex items-center justify-center font-semibold text-lg animate-pulse">
                            <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                            Predicting Future Trends...
                        </button>
                    </div>
                )}
            </div>
        </div>
    );

    const renderReportStep = () => (
        <div className="space-y-6 animate-fade-in">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex items-center">
                        <Database className="w-8 h-8 mr-4 opacity-80" />
                        <div>
                            <p className="text-blue-100 text-sm">Final Records</p>
                            <p className="text-3xl font-bold">{state.processedData.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex items-center">
                        <CheckCircle className="w-8 h-8 mr-4 opacity-80" />
                        <div>
                            <p className="text-emerald-100 text-sm">Variables Analyzed</p>
                            <p className="text-3xl font-bold">{Object.keys(state.statistics).length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex items-center">
                        <TrendingUp className="w-8 h-8 mr-4 opacity-80" />
                        <div>
                            <p className="text-violet-100 text-sm">Confidence Level</p>
                            <p className="text-3xl font-bold">95%</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Statistical Table */}
            <div className="glass-card rounded-xl p-8">
                <h3 className="text-xl font-bold text-white mb-6">Weighted Statistical Estimates</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-white/10">
                        <thead className="bg-white/5">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Variable</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Weighted Mean</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Std Error</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Margin of Error (±)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Sample Size</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {Object.entries(state.statistics).map(([col, stats]) => (
                                <tr key={col} className="hover:bg-white/5">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{col}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{stats.mean.toFixed(4)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{stats.standardError.toFixed(4)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-400 font-medium">±{stats.marginOfError.toFixed(4)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{stats.sampleSize}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>


            {/* Forecast Results */}
            {state.forecastData && (
                <div className="glass-card rounded-xl p-8 border hover:border-purple-500/30 transition-colors border-purple-500/20 bg-purple-500/5 animate-fade-in-up">
                    <div className="flex justify-between items-start mb-6">
                        <h3 className="text-2xl font-bold text-white flex items-center">
                            <Brain className="w-7 h-7 mr-3 text-purple-400" />
                            AI Forecast Results
                        </h3>
                        <div className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-4 py-2 rounded-full text-sm font-semibold flex items-center">
                            <Zap className="w-4 h-4 mr-2" />
                            {state.forecastData.confidence}% Confidence
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-black/20 rounded-lg p-4 border border-white/5">
                            <p className="text-sm text-purple-400 font-medium mb-1">Target Column</p>
                            <p className="text-xl font-bold text-white truncate" title={state.forecastData.column}>{state.forecastData.column}</p>
                        </div>
                        <div className="bg-black/20 rounded-lg p-4 border border-white/5">
                            <p className="text-sm text-purple-400 font-medium mb-1">Method Used</p>
                            <p className="text-sm font-bold text-white">{state.forecastData.method}</p>
                        </div>
                        <div className="bg-black/20 rounded-lg p-4 border border-white/5">
                            <p className="text-sm text-purple-400 font-medium mb-1">Historical Data</p>
                            <p className="text-xl font-bold text-white">{state.forecastData.dataPoints} Points</p>
                        </div>
                        <div className="bg-black/20 rounded-lg p-4 border border-white/5">
                            <p className="text-sm text-purple-400 font-medium mb-1">Trend Strength</p>
                            <p className="text-xl font-bold text-white">{state.forecastData.trendStrength}%</p>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-purple-500/20">
                        <table className="min-w-full divide-y divide-purple-500/20">
                            <thead className="bg-purple-500/10">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">Future Step</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">Predicted Value</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-purple-500/10 bg-black/10">
                                {state.forecastData.predictions.map((value, index) => (
                                    <tr key={index} className="hover:bg-purple-500/5 transition-colors">
                                        <td className="px-6 py-4 text-sm font-medium text-slate-300">Step {index + 1}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-purple-400">{value.toFixed(4)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Chart */}
            <div className="glass-card rounded-xl p-8 h-96">
                <h3 className="text-xl font-bold text-white mb-6">Distribution Overview</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={Object.entries(state.statistics).map(([name, stat]) => ({ name, mean: stat.mean, moe: stat.marginOfError }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="name" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1e293b', borderColor: 'rgba(255,255,255,0.1)', color: '#f8fafc' }}
                            itemStyle={{ color: '#f8fafc' }}
                        />
                        <Legend />
                        <Bar dataKey="mean" fill="#3b82f6" name="Weighted Mean" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between pt-4">
                <button onClick={() => setState(INITIAL_STATE)}
                    className="bg-white/10 text-white px-6 py-3 rounded-lg hover:bg-white/20 transition flex items-center border border-white/10">
                    <RotateCcw className="mr-2 w-4 h-4" /> Process New File
                </button>
                <button onClick={() => {
                    const formattedDate = new Date().toLocaleString();
                    const reportHTML = generateHTMLReport(state, formattedDate);
                    const blob = new Blob([reportHTML], { type: 'text/html' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `report_${state.fileName.replace(/\.[^/.]+$/, '')}_${Date.now()}.html`;
                    a.click();
                    URL.revokeObjectURL(url);
                }}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-500 transition flex items-center shadow-lg shadow-green-500/20">
                    <Download className="mr-2 w-4 h-4" /> Download HTML Report
                </button>
            </div>
        </div>
    );

    return (
        <div className={hideHeader ? "" : "min-h-screen bg-[#0f172a]"} >
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Header */}
                {!hideHeader && (
                    <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
                        <div className="flex items-center gap-4">
                            <Logo variant="light" className="h-10" />
                            <div className="h-8 w-px bg-white/10 hidden md:block"></div>
                            <p className="text-slate-400 text-sm md:text-base font-medium">Survey Data Processing</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 px-4 py-2 rounded-lg transition flex items-center gap-2 text-sm">
                            <LogOut className="w-4 h-4" />
                            Sign Out
                        </button>
                    </div>
                )}


                {state.currentStep > 0 && <StepIndicator currentStep={state.currentStep} />}

                <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                    {/* Main Content */}
                    <div className="xl:col-span-3">
                        {state.currentStep === 0 && renderUploadStep()}
                        {state.currentStep === 1 && renderSchemaStep()}
                        {state.currentStep === 2 && renderCleaningStep()}
                        {state.currentStep === 3 && renderLiveEditStep()}
                        {state.currentStep === 4 && renderWeightStep()}
                        {state.currentStep === 5 && renderReportStep()}
                    </div>

                    {/* Sidebar */}
                    <div className="xl:col-span-1">
                        <Sidebar
                            logs={state.processingLogs}
                            onUploadClick={() => setState(INITIAL_STATE)}
                            onExportRaw={() => exportData(state.rawData, 'raw_data.csv')}
                            onExportProcessed={() => exportData(state.processedData, 'processed_data.csv')}
                            canExport={state.rawData.length > 0}
                            canExportProcessed={state.processedData.length > 0}
                        />
                    </div>
                </div>
            </div>
        </div >
    );
};
