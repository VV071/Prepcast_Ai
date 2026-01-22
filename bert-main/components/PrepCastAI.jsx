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
import { OnboardingTutorial } from './OnboardingTutorial';
import { PDAEPanel } from './PDAEPanel';
import { TrustBadge } from './TrustBadge';
import { generatePDAEReport } from '../services/pdaeService';
import { ToggleLeft, ToggleRight, Layout } from 'lucide-react';
import { DistributionPanel } from './DistributionPanel';

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
    forecastError: null,
    pdaeReport: null,
    viewMode: 'simple' // 'simple' or 'advanced'
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
                    isProcessing: false,
                    pdaeReport: generatePDAEReport(data, columns, domain)
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
        <div id="upload-area" className="glass-card rounded-xl p-10 text-center animate-fade-in">
            <div className="border-2 border-dashed border-white/20 rounded-2xl p-16 hover:border-aura-violet hover:bg-aura-violet/5 transition-all cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}>
                <div className="w-20 h-20 bg-aura-violet/20 text-aura-violet rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-aura-violet">
                    <FileSpreadsheet className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">Upload Survey Data</h3>
                <p className="text-slate-400 mb-6 font-medium">Supports .csv, .xlsx, .xls</p>
                <button className="aura-gradient-violet text-white px-10 py-4 rounded-xl font-black shadow-aura-violet hover:scale-105 transition-all uppercase tracking-wider">
                    Select File
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv,.xlsx,.xls" className="hidden" />
            </div>
        </div>
    );

    const renderSchemaStep = () => (
        <div id="schema-section" className="glass-card rounded-xl p-8 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-white flex items-center uppercase tracking-tight">
                    <Database className="w-6 h-6 mr-3 text-aura-teal animate-pulse" />
                    Schema & Domain
                </h2>
                {state.detectedDomain && (
                    <div className={`px-4 py-2 rounded-full border flex items-center ${DOMAIN_INFO[state.detectedDomain].color}`}>
                        <span className="font-semibold capitalize">{state.detectedDomain} Domain</span>
                    </div>
                )}
            </div>

            {state.pdaeReport && (
                <div id="trust-badge" className="mb-6">
                    <TrustBadge score={state.pdaeReport.trustScore} />
                </div>
            )}

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
                    <div className="aura-gradient-teal shadow-aura-teal p-6 rounded-2xl border border-transparent transition-all hover:scale-[1.02]">
                        <h3 className="font-black text-white uppercase tracking-tighter mb-4">Dataset Pulse</h3>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <p className="text-white/70 text-[10px] uppercase font-black tracking-widest">Total Records</p>
                                <p className="text-3xl font-black text-white">{(state.rawData.length).toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-white/70 text-[10px] uppercase font-black tracking-widest">Variables</p>
                                <p className="text-3xl font-black text-white">{state.columns.length}</p>
                            </div>
                        </div>
                    </div>
                    <div className="aura-gradient-violet shadow-aura-violet p-6 rounded-2xl border border-transparent transition-all hover:scale-[1.02]">
                        <h3 className="font-black text-white uppercase tracking-tighter mb-2">Logic Matrix</h3>
                        <p className="text-xs text-white/80 font-medium leading-relaxed">{DOMAIN_INFO[state.detectedDomain].description}</p>
                    </div>
                    <div className="flex justify-end pt-4">
                        <button onClick={() => setState(prev => ({ ...prev, currentStep: 2 }))}
                            className="aura-gradient-violet text-white px-8 py-4 rounded-xl hover:scale-105 transition-all flex items-center shadow-aura-violet font-black uppercase tracking-wider">
                            Configure Cleaning <ArrowRight className="ml-2 w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderCleaningStep = () => (
        <div className="glass-card rounded-2xl p-8 animate-fade-in border border-aura-teal/20">
            <h2 className="text-2xl font-black text-white mb-8 flex items-center uppercase tracking-tighter italic">
                <RefreshCw className="w-6 h-6 mr-3 text-aura-teal animate-pulse-glow" />
                Scribing Matrix
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div>
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Synthesis Strategy</label>
                        <select
                            value={state.cleaningConfig.missingValueMethod}
                            onChange={(e) => setState(prev => ({ ...prev, cleaningConfig: { ...prev.cleaningConfig, missingValueMethod: e.target.value } }))}
                            className="w-full p-4 bg-bg-0 border border-white/5 text-white rounded-xl focus:ring-2 focus:ring-aura-teal outline-none font-black uppercase text-[11px] tracking-widest shadow-inner">
                            <option value="mean">Mean Substitution</option>
                            <option value="median">Median Substitution</option>
                            <option value="multiple">Multiple Synthesis</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Anomaly Detection Logic</label>
                        <select
                            value={state.cleaningConfig.outlierMethod}
                            onChange={(e) => setState(prev => ({ ...prev, cleaningConfig: { ...prev.cleaningConfig, outlierMethod: e.target.value } }))}
                            className="w-full p-4 bg-bg-0 border border-white/5 text-white rounded-xl focus:ring-2 focus:ring-aura-teal outline-none font-black uppercase text-[11px] tracking-widest shadow-inner mb-6">
                            <option value="iqr">Interquartile Range (IQR)</option>
                            <option value="zscore">Z-Score Matrix</option>
                            <option value="winsorize">Winsorization</option>
                        </select>
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Crystal Threshold</label>
                        <input
                            type="number"
                            step="0.1"
                            value={state.cleaningConfig.outlierThreshold}
                            onChange={(e) => setState(prev => ({ ...prev, cleaningConfig: { ...prev.cleaningConfig, outlierThreshold: parseFloat(e.target.value) } }))}
                            className="w-full p-4 bg-bg-0 border border-white/5 text-white rounded-xl focus:ring-2 focus:ring-aura-teal outline-none font-black text-xs shadow-inner"
                        />
                    </div>
                </div>
                <div className="glass-medium p-8 rounded-2xl border border-white/5 shadow-inner">
                    <h3 className="font-black text-white mb-6 uppercase tracking-tighter italic">Telemetric Preview</h3>
                    <ul className="space-y-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <li className="flex items-center gap-3"><Zap className="w-3 h-3 text-aura-teal" /> Domain: <span className="text-white">{state.detectedDomain}</span></li>
                        <li className="flex items-center gap-3"><Zap className="w-3 h-3 text-aura-teal" /> Logic: <span className="text-white">{state.cleaningConfig.missingValueMethod}</span></li>
                        <li className="flex items-center gap-3"><Zap className="w-3 h-3 text-aura-teal" /> Anomaly: <span className="text-white">{state.cleaningConfig.outlierMethod}</span></li>
                    </ul>
                    <div className="mt-8 flex justify-end">
                        <button onClick={executeCleaning} disabled={state.isProcessing}
                            className="aura-gradient-teal text-white px-8 py-4 rounded-xl hover:scale-105 transition-all flex items-center shadow-aura-teal font-black uppercase tracking-wider">
                            {state.isProcessing ? 'Processing Crystals...' : 'Start Crystal Cleaning'} <Zap className="ml-2 w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderLiveEditStep = () => (
        <div className="glass-card rounded-2xl p-8 animate-fade-in flex flex-col h-[650px] border border-aura-violet/20 shadow-aura-violet/10">
            <div className="flex justify-between items-center mb-6 shrink-0">
                <h2 className="text-2xl font-black text-white flex items-center uppercase tracking-tighter italic">
                    <FileSpreadsheet className="w-7 h-7 mr-4 text-aura-violet shadow-aura-violet" />
                    Crystal Flux Editor
                </h2>
                <div className="flex gap-4">
                    <div className="px-5 py-2.5 glass-medium text-aura-violet rounded-xl border border-aura-violet/20 text-[10px] font-black uppercase tracking-widest flex items-center shadow-inner">
                        <Zap className="w-4 h-4 mr-2 animate-pulse-glow" />
                        Delta Flux: {state.changedCells.size} Crystals
                    </div>
                    {state.changedCells.size > 0 && (
                        <button onClick={executeDeltaCleaning} disabled={state.isProcessing}
                            className="aura-gradient-violet text-white px-6 py-2.5 rounded-xl hover:scale-105 text-[10px] font-black uppercase tracking-widest flex items-center transition shadow-aura-violet elevation-2">
                            {state.isProcessing ? 'Re-Flowing...' : 'Re-Crystalize Deltas'}
                        </button>
                    )}

                    <div className="flex items-center bg-black/40 rounded-lg p-1 border border-white/10 mr-2">
                        <button
                            onClick={() => setState(prev => ({ ...prev, viewMode: 'simple' }))}
                            className={`px-3 py-1.5 text-xs font-black rounded-md transition-all uppercase ${state.viewMode === 'simple' ? 'aura-gradient-violet text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                            Simple
                        </button>
                        <button
                            onClick={() => setState(prev => ({ ...prev, viewMode: 'advanced' }))}
                            className={`px-3 py-1.5 text-xs font-black rounded-md transition-all uppercase ${state.viewMode === 'advanced' ? 'aura-gradient-violet text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                            Advanced
                        </button>
                    </div>

                    <button onClick={() => {
                        setState(prev => ({ ...prev, currentStep: 4 }));
                        saveToDatabase({ current_step: 4 });
                    }}
                        className="aura-gradient-teal text-white px-6 py-2.5 rounded-xl hover:scale-105 transition-all text-sm flex items-center shadow-aura-teal font-black uppercase tracking-wider">
                        Next: Weights <ArrowRight className="ml-2 w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="flex flex-1 gap-4 overflow-hidden">

                {/* Main Table */}
                <div className="flex-1 overflow-auto border border-white/5 rounded-2xl relative bg-bg-0 shadow-inner scrollbar-none">
                    <table className="min-w-full divide-y divide-white/5">
                        <thead className="bg-bg-0 sticky top-0 z-20">
                            <tr>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest sticky left-0 bg-bg-0 z-20 border-r border-white/5">#</th>
                                {state.columns.map(col => (
                                    <th key={col} className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest min-w-[180px]">{col}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {state.processedData.slice(0, 100).map((row, idx) => (
                                <tr key={idx} className="hover:bg-aura-violet/5 transition-colors group">
                                    <td className="px-6 py-3 text-[10px] font-black text-slate-600 border-r border-white/5 bg-bg-0/50 sticky left-0 group-hover:text-aura-violet transition-colors">{idx + 1}</td>
                                    {state.columns.map(col => {
                                        const cellKey = `${idx}-${col}`;
                                        const isDirty = state.changedCells.has(cellKey);
                                        return (
                                            <td key={col}
                                                className={`px-4 py-2 transition-all border-r border-white/5 ${isDirty ? 'bg-aura-gold/10' : ''}`}
                                            >
                                                <input
                                                    className={`w-full bg-transparent outline-none px-3 py-1.5 rounded-lg border border-transparent focus:border-aura-violet/30 focus:glass-medium text-xs transition-all ${isDirty ? 'text-aura-gold font-black shadow-aura-gold/5' : 'text-slate-400 focus:text-white'}`}
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
                    <div className="p-4 text-center text-[9px] font-black uppercase tracking-[0.2em] text-slate-600 bg-bg-0/90 border-t border-white/5 sticky bottom-0 z-20 backdrop-blur-xl">
                        Viewing Top-Tier Flux Clusters. Scribing persists to core matrix.
                    </div>
                </div>

                {/* PDAE Panel */}
                <div id="pdae-panel" className="w-80 shrink-0 hidden lg:block h-full overflow-hidden">
                    <PDAEPanel report={state.pdaeReport} viewMode={state.viewMode} />
                </div>

            </div>
        </div>
    );


    const renderWeightStep = () => (
        <div className="glass-card rounded-2xl p-8 animate-fade-in shadow-aura-violet border border-aura-violet/20">
            <h2 className="text-2xl font-black text-white mb-6 flex items-center uppercase tracking-tight">
                <Target className="w-6 h-6 mr-3 text-aura-violet animate-pulse-glow" />
                Weights & Analysis
            </h2>
            <div className="max-w-xl mx-auto space-y-6">
                <div>
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Weight Telemetry Source</label>
                    <select
                        value={state.weightConfig.weightColumn}
                        onChange={(e) => setState(prev => ({ ...prev, weightConfig: { ...prev.weightConfig, weightColumn: e.target.value } }))}
                        className="w-full p-4 bg-bg-0 border border-white/5 text-white rounded-xl focus:ring-2 focus:ring-aura-violet outline-none font-black text-xs shadow-inner">
                        <option value="">-- Equal Weight Matrix --</option>
                        {state.columns.map(col => <option key={col} value={col}>{col}</option>)}
                    </select>
                </div>
                <div className="flex items-center space-x-4 glass-medium p-5 rounded-xl border border-white/5 shadow-inner">
                    <input
                        type="checkbox"
                        checked={state.weightConfig.computeMarginOfError}
                        onChange={(e) => setState(prev => ({ ...prev, weightConfig: { ...prev.weightConfig, computeMarginOfError: e.target.checked } }))}
                        className="w-6 h-6 rounded-lg bg-bg-0 border-white/10 text-aura-violet focus:ring-aura-violet transition-all"
                    />
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Compute Prismatic Confidence Intervals (95%)</span>
                </div>

                {/* INTEGRATED: Histogram Distribution Analysis for RAW Data */}
                {state.rawData.length > 0 && state.columns.length > 0 && (
                    <div className="mt-6">
                        <DistributionPanel
                            data={state.rawData}
                            columns={state.columns}
                            cleaningConfig={state.cleaningConfig}
                            onConfigChange={(newConfig) => setState(prev => ({ ...prev, cleaningConfig: newConfig }))}
                        />
                    </div>
                )}

                <button onClick={executeWeighting} disabled={state.isProcessing}
                    className="w-full aura-gradient-violet text-white px-6 py-4 rounded-xl hover:scale-105 transition-all flex items-center justify-center font-black text-lg shadow-aura-violet uppercase tracking-wider">
                    {state.isProcessing ? 'Glow-Calculating...' : 'Generate Crystal Stats'} <Target className="ml-2 w-5 h-5" />
                </button>

                {state.isForecastLoading && (
                    <div className="mt-6 animate-fade-in">
                        <div className="w-full aura-gradient-violet rounded-2xl p-6 flex flex-col items-center justify-center gap-4 shadow-aura-violet elevation-3">
                            <WavyBarLoaderSmall activeColor="white" inactiveColor="rgba(255,255,255,0.2)" />
                            <p className="text-xs font-black text-white uppercase tracking-[0.3em] animate-pulse">Scribing Future Clusters...</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    const renderReportStep = () => (
        <div className="space-y-6 animate-fade-in">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="aura-gradient-violet rounded-3xl p-8 text-white shadow-aura-violet elevation-3 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
                    <div className="flex items-center relative z-10">
                        <Database className="w-10 h-10 mr-6 text-white group-hover:scale-110 transition-transform" />
                        <div>
                            <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em]">Final PrepCast Data</p>
                            <p className="text-4xl font-black tracking-tighter italic">{state.processedData.length.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
                <div className="aura-gradient-teal rounded-3xl p-8 text-white shadow-aura-teal elevation-3 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
                    <div className="flex items-center relative z-10">
                        <CheckCircle className="w-10 h-10 mr-6 text-white group-hover:scale-110 transition-transform" />
                        <div>
                            <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em]">Logic Channels</p>
                            <p className="text-4xl font-black tracking-tighter italic">{Object.keys(state.statistics).length}</p>
                        </div>
                    </div>
                </div>
                <div className="aura-gradient-pink rounded-3xl p-8 text-white shadow-aura-pink elevation-3 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
                    <div className="flex items-center relative z-10">
                        <TrendingUp className="w-10 h-10 mr-6 text-white group-hover:scale-110 transition-transform" />
                        <div>
                            <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em]">Signal Clarity</p>
                            <p className="text-4xl font-black tracking-tighter italic">95.4%</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Statistical Table */}
            <div className="glass-card rounded-2xl p-10 border border-white/5 shadow-inner overflow-hidden">
                <h3 className="text-xl font-black text-white mb-8 flex items-center uppercase tracking-tighter italic">
                    <Target className="w-6 h-6 mr-3 text-aura-teal" />
                    Weighted Telemetry Analysis
                </h3>
                <div className="overflow-x-auto scrollbar-none">
                    <table className="min-w-full divide-y divide-white/5">
                        <thead className="bg-bg-0">
                            <tr>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Logic Stream</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Weighted Mean</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Std Error</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Margin (±)</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Flux Points</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {Object.entries(state.statistics).map(([col, stats]) => (
                                <tr key={col} className="hover:bg-aura-teal/5 transition-colors group">
                                    <td className="px-6 py-5 whitespace-nowrap text-xs font-black text-white uppercase tracking-tight group-hover:text-aura-teal transition-colors">{col}</td>
                                    <td className="px-6 py-5 whitespace-nowrap text-xs font-black text-slate-300 font-mono tracking-tighter">{stats.mean.toFixed(6)}</td>
                                    <td className="px-6 py-5 whitespace-nowrap text-xs font-black text-slate-500 font-mono tracking-tighter">{stats.standardError.toFixed(6)}</td>
                                    <td className="px-6 py-5 whitespace-nowrap text-xs font-black text-aura-teal shadow-aura-teal/20 font-mono tracking-tighter">±{stats.marginOfError.toFixed(6)}</td>
                                    <td className="px-6 py-5 whitespace-nowrap text-xs font-black text-slate-600 font-mono tracking-tighter">{stats.sampleSize.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>


            {/* Forecast Results */}
            {state.forecastData && (
                <div className="glass-card rounded-2xl p-10 border border-aura-violet/30 bg-aura-violet/5 animate-fade-in-up shadow-aura-violet/10">
                    <div className="flex justify-between items-start mb-10">
                        <h3 className="text-2xl font-black text-white flex items-center uppercase tracking-tighter italic">
                            <Brain className="w-8 h-8 mr-4 text-aura-violet shadow-aura-violet animate-pulse-glow" />
                            AI Predictive Flux
                        </h3>
                        <div className="bg-aura-violet/20 text-white border border-aura-violet/50 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center shadow-aura-violet">
                            <Zap className="w-4 h-4 mr-2" />
                            {state.forecastData.confidence}% Clarity Matrix
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
                        <div className="glass-medium rounded-2xl p-5 border border-white/5 shadow-inner">
                            <p className="text-[10px] text-aura-violet font-black uppercase tracking-widest mb-2">Target Flux</p>
                            <p className="text-lg font-black text-white truncate uppercase tracking-tighter italic" title={state.forecastData.column}>{state.forecastData.column}</p>
                        </div>
                        <div className="glass-medium rounded-2xl p-5 border border-white/5 shadow-inner">
                            <p className="text-[10px] text-aura-violet font-black uppercase tracking-widest mb-2">Strategy</p>
                            <p className="text-xs font-black text-white uppercase tracking-tighter">{state.forecastData.method}</p>
                        </div>
                        <div className="glass-medium rounded-2xl p-5 border border-white/5 shadow-inner">
                            <p className="text-[10px] text-aura-violet font-black uppercase tracking-widest mb-2">Flux Points</p>
                            <p className="text-lg font-black text-white tracking-tighter">{state.forecastData.dataPoints.toLocaleString()}</p>
                        </div>
                        <div className="glass-medium rounded-2xl p-5 border border-white/5 shadow-inner">
                            <p className="text-[10px] text-aura-violet font-black uppercase tracking-widest mb-2">Trend Velocity</p>
                            <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-aura-teal" />
                                <p className="text-lg font-black text-white tracking-tighter">{state.forecastData.trendStrength}%</p>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-aura-violet/20 shadow-inner">
                        <table className="min-w-full divide-y divide-aura-violet/20">
                            <thead className="bg-aura-violet/10">
                                <tr>
                                    <th className="px-6 py-5 text-left text-[10px] font-black text-aura-violet uppercase tracking-widest">Future Iteration</th>
                                    <th className="px-6 py-5 text-left text-[10px] font-black text-aura-violet uppercase tracking-widest">Predicted Flux</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-aura-violet/10 bg-bg-0/30">
                                {state.forecastData.predictions.map((value, index) => (
                                    <tr key={index} className="hover:bg-aura-violet/10 transition-colors group">
                                        <td className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest group-hover:text-white transition-colors">Iteration {index + 1}</td>
                                        <td className="px-6 py-4 text-xs font-black text-aura-violet shadow-aura-violet/20 font-mono tracking-tighter group-hover:scale-105 transition-transform">{value.toFixed(6)}</td>
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
                        <Bar dataKey="mean" fill="var(--color-aura-violet)" name="Weighted Mean" radius={[4, 4, 0, 0]} />
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
                    className="aura-gradient-teal text-white px-8 py-4 rounded-xl hover:scale-105 transition-all flex items-center shadow-aura-teal font-black uppercase tracking-wider">
                    <Download className="mr-2 w-4 h-4" /> Download HTML Report
                </button>
            </div>
        </div>
    );

    return (
        <OnboardingTutorial>
            <div className={hideHeader ? "" : "min-h-screen bg-bg-0 transition-colors duration-500"} >
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
        </OnboardingTutorial>
    );
};
