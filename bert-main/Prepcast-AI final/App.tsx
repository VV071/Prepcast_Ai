import React, { useState, useCallback, useRef } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { TrendingUp, FileSpreadsheet, Upload as UploadIcon, Database, RefreshCw, Zap, ArrowRight, RotateCcw, Target, FileText, Download, CheckCircle } from 'lucide-react';
import StepIndicator from './components/StepIndicator';
import Sidebar from './components/Sidebar';
import { AppState, DataRow, ProcessingLog, DomainType, StatisticalSummary } from './types';
import { DOMAIN_INFO } from './constants';
import { detectDomainWithGemini } from './services/geminiService';
import { cleanData, calculateWeights } from './services/dataProcessor';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const INITIAL_STATE: AppState = {
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
  changedCells: new Map()
};

function App() {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addLog = useCallback((type: ProcessingLog['type'], message: string) => {
    setState(prev => ({
      ...prev,
      processingLogs: [
        ...prev.processingLogs,
        {
          id: Date.now(),
          type,
          message,
          timestamp: new Date().toLocaleTimeString()
        }
      ]
    }));
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setState(prev => ({ ...prev, isProcessing: true, fileName: file.name }));
    addLog('info', `Uploading file: ${file.name}`);

    const processData = async (data: any[], columns: string[]) => {
      // Basic validation
      if (data.length === 0 || columns.length === 0) {
          addLog('error', 'File appears to be empty or invalid.');
          setState(prev => ({ ...prev, isProcessing: false }));
          return;
      }
      
      addLog('success', `Loaded ${data.length} records, ${columns.length} columns.`);
      
      // Domain Detection
      addLog('info', 'Analyzing data structure with Gemini AI...');
      const domain = await detectDomainWithGemini(columns, data.slice(0, 5));
      addLog('success', `Domain detected: ${domain.toUpperCase()}`);

      // Apply default config based on domain
      const defaultConfig = DOMAIN_INFO[domain].defaultConfig;

      setState(prev => ({
        ...prev,
        rawData: data,
        processedData: data, // Initially same
        columns,
        detectedDomain: domain,
        cleaningConfig: { ...prev.cleaningConfig, ...defaultConfig },
        currentStep: 1,
        isProcessing: false
      }));
    };

    if (file.name.endsWith('.csv')) {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
            processData(results.data as any[], results.meta.fields || []);
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
             processData(json, Object.keys(json[0] as object));
          } else {
             throw new Error("Empty Excel sheet");
          }
        } catch (err: any) {
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
            changedCells: new Map() // Reset changes when full clean happens
        }));
        addLog('success', 'Full data cleaning completed.');
    }, 500); // UI delay for feel
  };

  const executeDeltaCleaning = () => {
      if (state.changedCells.size === 0) return;
      setState(prev => ({ ...prev, isProcessing: true }));
      
      const rowsToUpdate = new Set<number>();
      state.changedCells.forEach(val => rowsToUpdate.add(val.row));

      addLog('info', `Delta cleaning ${rowsToUpdate.size} modified rows...`);

      setTimeout(() => {
          // We re-clean ONLY the rows that were manually edited, but using statistics from the WHOLE dataset
          // Note: Ideally we re-calc stats, but for Delta we assume stats are stable-ish or we accept small variance for speed.
          // For correctness in this demo, we re-run clean logic on specific rows against the *current* processedData array state.
          
          const reCleaned = cleanData(state.processedData, state.columns, state.cleaningConfig, rowsToUpdate);
          
          setState(prev => ({
              ...prev,
              processedData: reCleaned,
              changedCells: new Map(),
              isProcessing: false
          }));
          addLog('success', 'Delta cleaning completed.');
      }, 300);
  };

  const handleCellEdit = (rowIndex: number, col: string, value: string) => {
      const newData = [...state.processedData];
      const oldValue = newData[rowIndex][col];
      
      // Basic type coercion try
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
          addLog('success', 'Statistical analysis completed.');
      }, 500);
  };

  const exportData = (data: DataRow[], filename: string) => {
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

  // --- Renders ---

  const renderUploadStep = () => (
    <div className="bg-white rounded-xl shadow-lg p-10 text-center animate-fade-in">
        <div className="border-2 border-dashed border-slate-300 rounded-xl p-16 hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer group"
             onClick={() => fileInputRef.current?.click()}>
            <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <FileSpreadsheet className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Upload Survey Data</h3>
            <p className="text-slate-500 mb-6">Supports .csv, .xlsx, .xls</p>
            <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium shadow-md hover:bg-blue-700 transition-colors">
                Select File
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv,.xlsx,.xls" className="hidden" />
        </div>
    </div>
  );

  const renderSchemaStep = () => (
      <div className="bg-white rounded-xl shadow-lg p-8 animate-fade-in">
          <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900 flex items-center">
                  <Database className="w-6 h-6 mr-3 text-blue-600" />
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
                  <h3 className="font-semibold text-slate-700 mb-4">Detected Columns</h3>
                  <div className="bg-slate-50 rounded-lg p-4 max-h-96 overflow-y-auto border border-slate-200">
                      {state.columns.map(col => (
                          <div key={col} className="flex justify-between items-center py-2 border-b last:border-0 border-slate-200">
                              <span className="font-medium text-slate-700">{col}</span>
                              <span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded">
                                  {typeof state.rawData[0][col]}
                              </span>
                          </div>
                      ))}
                  </div>
              </div>
              <div className="space-y-6">
                  <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                      <h3 className="font-semibold text-blue-900 mb-2">Dataset Summary</h3>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <p className="text-sm text-blue-600">Total Records</p>
                              <p className="text-2xl font-bold text-blue-800">{state.rawData.length}</p>
                          </div>
                          <div>
                              <p className="text-sm text-blue-600">Columns</p>
                              <p className="text-2xl font-bold text-blue-800">{state.columns.length}</p>
                          </div>
                      </div>
                  </div>
                  <div className="bg-purple-50 p-6 rounded-xl border border-purple-100">
                      <h3 className="font-semibold text-purple-900 mb-2">AI Insight</h3>
                      <p className="text-sm text-purple-800">{DOMAIN_INFO[state.detectedDomain].description}</p>
                  </div>
                  <div className="flex justify-end pt-4">
                      <button onClick={() => setState(prev => ({ ...prev, currentStep: 2 }))} 
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition flex items-center">
                          Configure Cleaning <ArrowRight className="ml-2 w-4 h-4" />
                      </button>
                  </div>
              </div>
          </div>
      </div>
  );

  const renderCleaningStep = () => (
      <div className="bg-white rounded-xl shadow-lg p-8 animate-fade-in">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
              <RefreshCw className="w-6 h-6 mr-3 text-blue-600" />
              Cleaning Configuration
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                  <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Missing Value Imputation</label>
                      <select 
                        value={state.cleaningConfig.missingValueMethod}
                        onChange={(e) => setState(prev => ({ ...prev, cleaningConfig: { ...prev.cleaningConfig, missingValueMethod: e.target.value as any } }))}
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                          <option value="mean">Mean Substitution</option>
                          <option value="median">Median Substitution</option>
                          <option value="multiple">Multiple Imputation (Simulated)</option>
                      </select>
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Outlier Detection</label>
                      <select 
                        value={state.cleaningConfig.outlierMethod}
                        onChange={(e) => setState(prev => ({ ...prev, cleaningConfig: { ...prev.cleaningConfig, outlierMethod: e.target.value as any } }))}
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                          <option value="iqr">Interquartile Range (IQR)</option>
                          <option value="zscore">Z-Score</option>
                          <option value="winsorize">Winsorization</option>
                      </select>
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Threshold</label>
                      <input 
                        type="number" 
                        step="0.1"
                        value={state.cleaningConfig.outlierThreshold}
                        onChange={(e) => setState(prev => ({ ...prev, cleaningConfig: { ...prev.cleaningConfig, outlierThreshold: parseFloat(e.target.value) } }))}
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                      />
                  </div>
              </div>
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                  <h3 className="font-semibold text-slate-900 mb-4">Preview Configuration</h3>
                  <ul className="space-y-3 text-sm text-slate-600">
                      <li className="flex items-center"><Zap className="w-4 h-4 mr-2 text-amber-500" /> Domain: {state.detectedDomain}</li>
                      <li className="flex items-center"><Zap className="w-4 h-4 mr-2 text-amber-500" /> Method: {state.cleaningConfig.missingValueMethod}</li>
                      <li className="flex items-center"><Zap className="w-4 h-4 mr-2 text-amber-500" /> Outlier Logic: {state.cleaningConfig.outlierMethod} ({state.cleaningConfig.outlierThreshold})</li>
                  </ul>
                  <div className="mt-8 flex justify-end">
                      <button onClick={executeCleaning} disabled={state.isProcessing}
                        className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition flex items-center shadow-lg shadow-green-200">
                          {state.isProcessing ? 'Processing...' : 'Start Cleaning'} <Zap className="ml-2 w-4 h-4" />
                      </button>
                  </div>
              </div>
          </div>
      </div>
  );

  const renderLiveEditStep = () => (
      <div className="bg-white rounded-xl shadow-lg p-8 animate-fade-in flex flex-col h-[600px]">
          <div className="flex justify-between items-center mb-4 shrink-0">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center">
                <FileSpreadsheet className="w-6 h-6 mr-3 text-blue-600" />
                Live Edit Mode
            </h2>
            <div className="flex gap-3">
                <div className="px-4 py-2 bg-purple-50 text-purple-700 rounded-lg border border-purple-200 text-sm font-medium flex items-center">
                    <Zap className="w-4 h-4 mr-2" />
                    Delta Mode: {state.changedCells.size} edits
                </div>
                {state.changedCells.size > 0 && (
                    <button onClick={executeDeltaCleaning} disabled={state.isProcessing}
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm flex items-center transition">
                        {state.isProcessing ? 'Re-cleaning...' : 'Re-Clean Deltas'}
                    </button>
                )}
                 <button onClick={() => setState(prev => ({...prev, currentStep: 4}))}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm flex items-center transition">
                        Next: Weights <ArrowRight className="ml-2 w-4 h-4" />
                </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto border border-slate-200 rounded-lg relative">
             <table className="min-w-full divide-y divide-slate-200">
                 <thead className="bg-slate-50 sticky top-0 z-10">
                     <tr>
                         <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider sticky left-0 bg-slate-50 z-20 border-r">#</th>
                         {state.columns.map(col => (
                             <th key={col} className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider min-w-[150px]">{col}</th>
                         ))}
                     </tr>
                 </thead>
                 <tbody className="bg-white divide-y divide-slate-200">
                     {state.processedData.slice(0, 100).map((row, idx) => (
                         <tr key={idx} className="hover:bg-slate-50">
                             <td className="px-4 py-2 text-xs text-slate-400 border-r bg-slate-50 sticky left-0">{idx + 1}</td>
                             {state.columns.map(col => {
                                 const cellKey = `${idx}-${col}`;
                                 const isDirty = state.changedCells.has(cellKey);
                                 return (
                                     <td key={col} 
                                        className={`px-2 py-1 text-sm border-r border-transparent ${isDirty ? 'bg-amber-50' : ''}`}
                                     >
                                         <input 
                                            className={`w-full bg-transparent outline-none px-2 py-1 rounded ${isDirty ? 'text-amber-800 font-medium' : 'text-slate-700'}`}
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
             <div className="p-4 text-center text-sm text-slate-500 bg-slate-50 border-t sticky bottom-0">
                 Showing first 100 rows for performance. Edits apply to actual data.
             </div>
          </div>
      </div>
  );

  const renderWeightStep = () => (
      <div className="bg-white rounded-xl shadow-lg p-8 animate-fade-in">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
              <Target className="w-6 h-6 mr-3 text-blue-600" />
              Weights & Analysis
          </h2>
          <div className="max-w-xl mx-auto space-y-6">
              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Weight Column (Optional)</label>
                  <select 
                    value={state.weightConfig.weightColumn}
                    onChange={(e) => setState(prev => ({ ...prev, weightConfig: { ...prev.weightConfig, weightColumn: e.target.value } }))}
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                      <option value="">-- No Weighting (Equal Weights) --</option>
                      {state.columns.map(col => <option key={col} value={col}>{col}</option>)}
                  </select>
              </div>
              <div className="flex items-center space-x-3 bg-slate-50 p-4 rounded-lg">
                  <input 
                    type="checkbox" 
                    checked={state.weightConfig.computeMarginOfError}
                    onChange={(e) => setState(prev => ({ ...prev, weightConfig: { ...prev.weightConfig, computeMarginOfError: e.target.checked } }))}
                    className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500" 
                  />
                  <span className="text-slate-700 font-medium">Compute 95% Confidence Intervals</span>
              </div>
              <button onClick={executeWeighting} disabled={state.isProcessing}
                className="w-full bg-blue-600 text-white px-6 py-4 rounded-lg hover:bg-blue-700 transition flex items-center justify-center font-semibold text-lg shadow-lg">
                  {state.isProcessing ? 'Calculating...' : 'Generate Statistics'} <Target className="ml-2 w-5 h-5" />
              </button>
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
        <div className="bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Weighted Statistical Estimates</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Variable</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Weighted Mean</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Std Error</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Margin of Error (±)</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Sample Size</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {Object.entries(state.statistics).map(([col, stats]: [string, StatisticalSummary]) => (
                            <tr key={col} className="hover:bg-slate-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{col}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{stats.mean.toFixed(4)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{stats.standardError.toFixed(4)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">±{stats.marginOfError.toFixed(4)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{stats.sampleSize}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Chart */}
        <div className="bg-white rounded-xl shadow-lg p-8 h-96">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Distribution Overview</h3>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={Object.entries(state.statistics).map(([name, stat]: [string, StatisticalSummary]) => ({ name, mean: stat.mean, moe: stat.marginOfError }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="mean" fill="#4f46e5" name="Weighted Mean" />
                </BarChart>
            </ResponsiveContainer>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-4">
             <button onClick={() => setState(INITIAL_STATE)} 
                className="bg-slate-200 text-slate-700 px-6 py-3 rounded-lg hover:bg-slate-300 transition flex items-center">
                <RotateCcw className="mr-2 w-4 h-4" /> Process New File
             </button>
             <button onClick={() => {
                 const reportText = JSON.stringify({ meta: { domain: state.detectedDomain, file: state.fileName }, stats: state.statistics }, null, 2);
                 const blob = new Blob([reportText], {type: 'application/json'});
                 const url = URL.createObjectURL(blob);
                 const a = document.createElement('a'); a.href = url; a.download = 'report.json'; a.click();
             }} 
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition flex items-center shadow-lg">
                <FileText className="mr-2 w-4 h-4" /> Download Full Report
             </button>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-slate-900 mb-2 flex items-center justify-center">
            <TrendingUp className="w-10 h-10 mr-3 text-blue-600" />
            prepcast-Ai
          </h1>
          <p className="text-slate-500 text-lg">Survey Data Processing for Official Statistics</p>
        </div>

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
    </div>
  );
}

export default App;