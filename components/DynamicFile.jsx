import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Activity, AlertTriangle, Cpu, Layers, Database, Play, Loader2, Info, AlertCircle, CheckCircle } from 'lucide-react';
import { CleaningDomain } from '../dynamicTypes';
import { STATUS_COLORS } from '../dynamicConstants';
import { detectSourceInfo, processBatchWithAI } from '../services/dynamicGeminiService';
import { addSessionDataSource, logActivity } from '../services/sessionService';

// Utility to generate random data for simulation
const generateMockRow = (domain, id) => {
    const timestamp = new Date().toISOString();
    const isDirty = Math.random() < 0.3;

    if (domain === CleaningDomain.HEALTHCARE) {
        return {
            id: id.toString(),
            timestamp,
            patient_id: `P-${Math.floor(Math.random() * 1000)}`,
            heart_rate: isDirty ? (Math.random() > 0.5 ? null : 220) : 60 + Math.floor(Math.random() * 40),
            temp: 97 + Math.random() * 2,
            location: isDirty ? (Math.random() > 0.5 ? 'NYC' : 'New  York') : 'New York'
        };
    } else {
        return {
            id: id.toString(),
            timestamp,
            txn_id: `TX-${Math.floor(Math.random() * 10000)}`,
            amount: isDirty ? -50000 : Math.floor(Math.random() * 5000),
            category: isDirty ? 'Grocries' : 'Groceries',
            status: 'pending'
        };
    }
};

export const DynamicFile = ({ session, onLogout, hideHeader = false }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [sourceConfig, setSourceConfig] = useState(null);
    const [cleanedData, setCleanedData] = useState([]);
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState({
        totalProcessed: 0,
        anomaliesDetected: 0,
        valuesImputed: 0,
        currentDomain: CleaningDomain.GENERAL,
        lastUpdate: new Date()
    });

    // Form state
    const [sourceType, setSourceType] = useState('SHEET');
    const [url, setUrl] = useState('');
    const [name, setName] = useState('');
    const [interval, setInterval] = useState('1');

    const intervalRef = useRef(null);
    const idCounter = useRef(1000);

    const addLog = useCallback(async (level, module, message) => {
        setLogs(prev => [...prev, {
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date(),
            level,
            module,
            message
        }].slice(-50));

        // Persist important logs if session exists
        if (session?.id && (level === 'ERROR' || level === 'WARN' || level === 'SUCCESS')) {
            try {
                await logActivity(session.id, session.user_id, 'process', message, { level, module });
            } catch (err) {
                console.warn('Failed to persist log:', err);
            }
        }
    }, [session]);

    const startMonitoring = async (e) => {
        e.preventDefault();
        if (!url.trim()) return;

        setIsProcessing(true);
        addLog('INFO', 'System', `Initializing connection to ${name || 'Untitled Source'}...`);
        addLog('INFO', 'System', `Target URL: ${url}`);

        try {
            const detection = await detectSourceInfo(url);

            let detectedDomain = CleaningDomain.GENERAL;
            if (url.toLowerCase().includes('hospital') || url.toLowerCase().includes('patient')) {
                detectedDomain = CleaningDomain.HEALTHCARE;
            } else if (url.toLowerCase().includes('finance') || name.toLowerCase().includes('covid')) {
                detectedDomain = CleaningDomain.FINANCE;
            }

            setStats(prev => ({ ...prev, currentDomain: detectedDomain }));

            addLog('SUCCESS', 'System', `Source configured: ${sourceType} (AI Confirmation: ${(detection.confidence * 100).toFixed(0)}%)`);
            addLog('INFO', 'DomainDetector', `Schema inferred: ${detectedDomain} | Strategy: Active Learning`);

            setSourceConfig({
                type: sourceType,
                url,
                name: name || 'Untitled Source',
                frequency: parseInt(interval) * 60,
                isActive: true
            });

            if (session?.id) {
                try {
                    await addSessionDataSource(session.id, {
                        source_type: sourceType,
                        source_name: name || 'Untitled Source',
                        // source_url: url, // Note: Schema might not have source_url, checking schema...
                        // Schema has: source_name, source_type, file_path, bucket_name, record_count, column_mapping
                        // It seems I missed source_url in my schema definition or it's not there.
                        // Let's check the schema provided by user.
                        // session_data_sources: id, session_id, source_name, source_type, file_path, bucket_name, record_count, column_mapping
                        // It doesn't have source_url. I should probably store it in file_path or column_mapping or add it.
                        // For now, I'll store it in file_path as it's a URL.
                        file_path: url,
                        record_count: 0
                    });
                } catch (error) {
                    console.error('Failed to save source:', error);
                }
            }

            setCleanedData([]);
            setIsProcessing(false);

        } catch (err) {
            addLog('ERROR', 'System', 'Failed to connect to source');
            setIsProcessing(false);
        }
    };

    const runBatchProcessor = useCallback(async () => {
        if (!sourceConfig) return;

        const newRawRows = [];
        const count = Math.floor(Math.random() * 2) + 1;
        for (let i = 0; i < count; i++) {
            newRawRows.push(generateMockRow(stats.currentDomain, idCounter.current++));
        }

        addLog('INFO', 'System', `Fetched ${newRawRows.length} new records from ${sourceConfig.name}. Processing...`);

        const result = await processBatchWithAI(newRawRows, stats.currentDomain);

        result.logs.forEach(logMsg => {
            let level = 'INFO';
            let module = 'System';

            if (logMsg.toLowerCase().includes('imput')) { module = 'Imputer'; level = 'WARN'; }
            if (logMsg.toLowerCase().includes('anomal')) { module = 'AnomalyDetector'; level = 'ERROR'; }
            if (logMsg.toLowerCase().includes('normaliz')) { module = 'TextNormalizer'; level = 'SUCCESS'; }

            addLog(level, module, logMsg);
        });

        let newAnomalies = 0;
        let newImputations = 0;

        result.cleanedRows.forEach(row => {
            if (row._status === 'ANOMALY') newAnomalies++;
            if (row._status === 'IMPUTED') newImputations++;
        });

        setStats(prev => ({
            ...prev,
            totalProcessed: prev.totalProcessed + newRawRows.length,
            anomaliesDetected: prev.anomaliesDetected + newAnomalies,
            valuesImputed: prev.valuesImputed + newImputations,
            lastUpdate: new Date()
        }));

        setCleanedData(prev => [...result.cleanedRows, ...prev].slice(0, 50));
    }, [sourceConfig, stats.currentDomain, addLog]);

    useEffect(() => {
        if (!sourceConfig?.isActive) return;

        runBatchProcessor();

        const safeInterval = Math.max(sourceConfig.frequency, 2);
        intervalRef.current = setInterval(runBatchProcessor, safeInterval * 1000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [sourceConfig, runBatchProcessor]);

    const StatCard = ({ title, value, icon, colorClass, trend }) => (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
            <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">{title}</span>
                {icon}
            </div>
            <div className={`text-3xl font-bold ${colorClass}`}>{value}</div>
            {trend && <div className="text-xs text-slate-500 mt-1">{trend}</div>}
        </div>
    );

    return (
        <div>
            {!sourceConfig ? (
                <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl max-w-2xl mx-auto">
                    <div className="flex items-center gap-3 mb-6">
                        <Database className="w-6 h-6 text-white" />
                        <h2 className="text-xl font-bold text-white">Add Data Source</h2>
                    </div>

                    <form onSubmit={startMonitoring}>
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            {['SHEET', 'API', 'SCRAPER', 'UPLOAD'].map((type) => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setSourceType(type)}
                                    className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all ${sourceType === type
                                        ? 'bg-blue-600 border-blue-500 shadow-lg'
                                        : 'bg-slate-950 border-slate-800 hover:border-slate-600'
                                        }`}
                                >
                                    <Database className={`w-8 h-8 mb-3 ${sourceType === type ? 'text-white' : 'text-slate-400'}`} />
                                    <span className={`font-medium ${sourceType === type ? 'text-white' : 'text-slate-400'}`}>
                                        {type}
                                    </span>
                                </button>
                            ))}
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Source URL</label>
                                <input
                                    type="text"
                                    required
                                    className="block w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-600 focus:ring-2 focus:ring-blue-500"
                                    placeholder="https://docs.google.com/spreadsheets/d/..."
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Source Name</label>
                                <input
                                    type="text"
                                    className="block w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-600 focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g., COVID-19 Daily Data"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Auto-Refresh Interval</label>
                                <select
                                    value={interval}
                                    onChange={(e) => setInterval(e.target.value)}
                                    className="block w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="1">Every 1 Minute (Live Demo)</option>
                                    <option value="5">Every 5 Minutes</option>
                                    <option value="15">Every 15 Minutes</option>
                                    <option value="60">Every 1 Hour</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-8">
                            <button
                                type="submit"
                                disabled={isProcessing || !url}
                                className="w-full flex justify-center items-center gap-2 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg disabled:opacity-50 text-lg"
                            >
                                {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Play className="w-6 h-6" />}
                                {isProcessing ? 'Initializing Pipeline...' : 'Start Monitoring'}
                            </button>
                        </div>

                        <div className="mt-6 flex justify-center gap-4 text-xs text-slate-500">
                            <span className="opacity-50">Quick Fill:</span>
                            <button type="button" onClick={() => { setSourceType('SHEET'); setUrl('https://docs.google.com/spreadsheets/d/covid-data'); setName('COVID-19 Tracker'); }} className="hover:text-blue-400 underline">COVID Sheet</button>
                            <button type="button" onClick={() => { setSourceType('API'); setUrl('https://api.weather.gov/stations/KXYZ'); setName('Weather Station API'); }} className="hover:text-blue-400 underline">Weather API</button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <StatCard
                            title="Processed Rows"
                            value={stats.totalProcessed.toLocaleString()}
                            icon={<Activity className="w-5 h-5 text-blue-400" />}
                            colorClass="text-blue-400"
                        />
                        <StatCard
                            title="Active Domain"
                            value={stats.currentDomain}
                            icon={<Layers className="w-5 h-5 text-emerald-400" />}
                            colorClass="text-emerald-400"
                        />
                        <StatCard
                            title="Anomalies"
                            value={stats.anomaliesDetected}
                            icon={<AlertTriangle className="w-5 h-5 text-red-400" />}
                            colorClass="text-red-400"
                            trend="+12%"
                        />
                        <StatCard
                            title="AI Imputations"
                            value={stats.valuesImputed}
                            icon={<Cpu className="w-5 h-5 text-purple-400" />}
                            colorClass="text-purple-400"
                            trend="Active"
                        />
                    </div>

                    {/* Main Split View */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Logs */}
                        <div className="lg:col-span-1">
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 h-[500px] flex flex-col">
                                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                                    <Info className="w-4 h-4" />
                                    Processing Log
                                </h3>
                                <div className="flex-1 overflow-y-auto space-y-2 font-mono text-xs">
                                    {logs.map(log => (
                                        <div key={log.id} className={`p-2 rounded ${log.level === 'ERROR' ? 'bg-red-900/20 text-red-400' :
                                            log.level === 'WARN' ? 'bg-yellow-900/20 text-yellow-400' :
                                                log.level === 'SUCCESS' ? 'bg-green-900/20 text-green-400' :
                                                    'bg-blue-900/20 text-blue-400'
                                            }`}>
                                            <div className="flex items-start gap-2">
                                                {log.level === 'ERROR' && <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />}
                                                {log.level === 'SUCCESS' && <CheckCircle className="w-3 h-3 mt-0.5 shrink-0" />}
                                                {log.level === 'WARN' && <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />}
                                                {log.level === 'INFO' && <Info className="w-3 h-3 mt-0.5 shrink-0" />}
                                                <div className="flex-1">
                                                    <div className="text-slate-400 text-[10px]">{log.timestamp.toLocaleTimeString()}</div>
                                                    <div>[{log.module}] {log.message}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Data Grid */}
                        <div className="lg:col-span-2">
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 h-[500px] flex flex-col">
                                <h3 className="text-white font-semibold mb-4">Live Data Stream</h3>
                                <div className="flex-1 overflow-auto">
                                    <table className="min-w-full text-sm">
                                        <thead className="bg-slate-950 sticky top-0">
                                            <tr>
                                                {cleanedData[0] && Object.keys(cleanedData[0]).filter(k => !k.startsWith('_')).map(key => (
                                                    <th key={key} className="px-4 py-2 text-left text-slate-400 font-medium">{key}</th>
                                                ))}
                                                <th className="px-4 py-2 text-left text-slate-400 font-medium">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {cleanedData.map((row, idx) => (
                                                <tr key={idx} className="border-t border-slate-800 hover:bg-slate-800/50">
                                                    {Object.entries(row).filter(([k]) => !k.startsWith('_')).map(([key, value]) => (
                                                        <td key={key} className="px-4 py-2 text-slate-300">{value?.toString() || '-'}</td>
                                                    ))}
                                                    <td className="px-4 py-2">
                                                        <span className={`px-2 py-1 rounded text-xs border ${STATUS_COLORS[row._status] || 'bg-slate-700 text-slate-300'}`}>
                                                            {row._status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
