import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Activity, AlertTriangle, Cpu, Layers, Database, Play, Loader2, Info, AlertCircle, CheckCircle, Globe, FileSpreadsheet, Server, Upload } from 'lucide-react';
import { CleaningDomain } from '../dynamicTypes';
import { STATUS_COLORS } from '../dynamicConstants';
import { detectSourceInfo, processBatchWithAI } from '../services/dynamicGeminiService';
import { addSessionDataSource, logActivity } from '../services/sessionService';
import { Card3D } from './3D/Card3D';
import { Input3D } from './3D/Input3D';
import { Button3D } from './3D/Button3D';
import { StaggerContainer, StaggerItem, FloatingElement } from './MotionWrapper';
import { motion, AnimatePresence } from 'framer-motion';

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
        <Card3D elevation={2} glassType="medium" enableTilt={true} padding="md">
            <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">{title}</span>
                <div className={`p-2 rounded-lg bg-white/5 ${colorClass}`}>
                    {icon}
                </div>
            </div>
            <div className="text-3xl font-bold text-white">{value}</div>
            {trend && <div className="text-xs text-slate-500 mt-1">{trend}</div>}
        </Card3D>
    );

    const sourceTypes = [
        { id: 'SHEET', icon: FileSpreadsheet, label: 'Google Sheet', desc: 'Connect to live sheets' },
        { id: 'API', icon: Globe, label: 'REST API', desc: 'Poll JSON endpoints' },
        { id: 'SCRAPER', icon: Database, label: 'Web Scraper', desc: 'Extract from websites' },
        { id: 'UPLOAD', icon: Upload, label: 'File Upload', desc: 'Watch local files' }
    ];

    return (
        <div className="max-w-7xl mx-auto p-6">
            <AnimatePresence mode="wait">
                {!sourceConfig ? (
                    <motion.div
                        key="config"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Card3D elevation={4} glassType="strong" className="max-w-3xl mx-auto" enableTilt={false}>
                            <div className="flex items-center gap-4 mb-8">
                                <FloatingElement>
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                                        <Database className="w-6 h-6 text-white" />
                                    </div>
                                </FloatingElement>
                                <div>
                                    <h2 className="text-2xl font-bold text-white">Add Data Source</h2>
                                    <p className="text-slate-400">Connect a live data stream for real-time processing</p>
                                </div>
                            </div>

                            <form onSubmit={startMonitoring} className="space-y-8">
                                <div className="grid grid-cols-2 gap-4">
                                    {sourceTypes.map((type) => (
                                        <motion.button
                                            key={type.id}
                                            type="button"
                                            whileHover={{ scale: 1.02, y: -2 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => setSourceType(type.id)}
                                            className={`relative p-4 rounded-xl border transition-all duration-300 text-left group ${sourceType === type.id
                                                ? 'bg-blue-600/20 border-blue-500/50 shadow-lg shadow-blue-500/20'
                                                : 'bg-black/20 border-white/10 hover:border-blue-500/30'
                                                }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`p-2 rounded-lg transition-colors ${sourceType === type.id ? 'bg-blue-500 text-white' : 'bg-white/5 text-slate-400 group-hover:text-blue-400'}`}>
                                                    <type.icon className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className={`font-semibold transition-colors ${sourceType === type.id ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                                                        {type.label}
                                                    </div>
                                                    <div className="text-xs text-slate-500 mt-1">{type.desc}</div>
                                                </div>
                                            </div>
                                        </motion.button>
                                    ))}
                                </div>

                                <div className="space-y-6">
                                    <Input3D
                                        label="Source URL"
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        placeholder="https://docs.google.com/spreadsheets/d/..."
                                        leftIcon={<Globe className="w-5 h-5" />}
                                        required
                                    />

                                    <div className="grid grid-cols-2 gap-6">
                                        <Input3D
                                            label="Source Name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="e.g., COVID-19 Daily Data"
                                            leftIcon={<FileSpreadsheet className="w-5 h-5" />}
                                        />

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-300 ml-1">Auto-Refresh Interval</label>
                                            <div className="glass-light rounded-xl p-1 border border-white/10">
                                                <select
                                                    value={interval}
                                                    onChange={(e) => setInterval(e.target.value)}
                                                    className="w-full bg-transparent text-white px-4 py-3 outline-none cursor-pointer [&>option]:bg-slate-900"
                                                >
                                                    <option value="1">Every 1 Minute (Live Demo)</option>
                                                    <option value="5">Every 5 Minutes</option>
                                                    <option value="15">Every 15 Minutes</option>
                                                    <option value="60">Every 1 Hour</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <Button3D
                                        type="submit"
                                        variant="primary"
                                        size="lg"
                                        fullWidth
                                        isLoading={isProcessing}
                                        disabled={!url}
                                        leftIcon={!isProcessing && <Play className="w-5 h-5" />}
                                    >
                                        {isProcessing ? 'Initializing Pipeline...' : 'Start Monitoring'}
                                    </Button3D>
                                </div>

                                <div className="flex justify-center gap-4 text-xs text-slate-500 pt-4 border-t border-white/5">
                                    <span className="opacity-50 mt-2">Quick Fill:</span>
                                    <Button3D
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => { setSourceType('SHEET'); setUrl('https://docs.google.com/spreadsheets/d/covid-data'); setName('COVID-19 Tracker'); }}
                                    >
                                        COVID Sheet
                                    </Button3D>
                                    <Button3D
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => { setSourceType('API'); setUrl('https://api.weather.gov/stations/KXYZ'); setName('Weather Station API'); }}
                                    >
                                        Weather API
                                    </Button3D>
                                </div>
                            </form>
                        </Card3D>
                    </motion.div>
                ) : (
                    <StaggerContainer className="space-y-6">
                        {/* Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <StaggerItem>
                                <StatCard
                                    title="Processed Rows"
                                    value={stats.totalProcessed.toLocaleString()}
                                    icon={<Activity className="w-5 h-5" />}
                                    colorClass="text-blue-400"
                                />
                            </StaggerItem>
                            <StaggerItem>
                                <StatCard
                                    title="Active Domain"
                                    value={stats.currentDomain}
                                    icon={<Layers className="w-5 h-5" />}
                                    colorClass="text-emerald-400"
                                />
                            </StaggerItem>
                            <StaggerItem>
                                <StatCard
                                    title="Anomalies"
                                    value={stats.anomaliesDetected}
                                    icon={<AlertTriangle className="w-5 h-5" />}
                                    colorClass="text-red-400"
                                    trend="+12%"
                                />
                            </StaggerItem>
                            <StaggerItem>
                                <StatCard
                                    title="AI Imputations"
                                    value={stats.valuesImputed}
                                    icon={<Cpu className="w-5 h-5" />}
                                    colorClass="text-purple-400"
                                    trend="Active"
                                />
                            </StaggerItem>
                        </div>

                        {/* Main Split View */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Logs */}
                            <StaggerItem className="lg:col-span-1">
                                <Card3D elevation={3} glassType="medium" className="h-[600px] flex flex-col" padding="none">
                                    <div className="p-4 border-b border-white/10 flex items-center gap-2">
                                        <div className="p-2 rounded-lg bg-blue-500/10">
                                            <Server className="w-4 h-4 text-blue-400" />
                                        </div>
                                        <h3 className="text-white font-semibold">Processing Log</h3>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-xs scrollbar-hide">
                                        <AnimatePresence initial={false}>
                                            {logs.map(log => (
                                                <motion.div
                                                    key={log.id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    className={`p-3 rounded-lg border ${log.level === 'ERROR' ? 'bg-red-500/10 border-red-500/20 text-red-300' :
                                                        log.level === 'WARN' ? 'bg-amber-500/10 border-amber-500/20 text-amber-300' :
                                                            log.level === 'SUCCESS' ? 'bg-green-500/10 border-green-500/20 text-green-300' :
                                                                'bg-blue-500/10 border-blue-500/20 text-blue-300'
                                                        }`}
                                                >
                                                    <div className="flex items-start gap-2">
                                                        {log.level === 'ERROR' && <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />}
                                                        {log.level === 'SUCCESS' && <CheckCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />}
                                                        {log.level === 'WARN' && <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />}
                                                        {log.level === 'INFO' && <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />}
                                                        <div className="flex-1">
                                                            <div className="opacity-50 text-[10px] mb-0.5">{log.timestamp.toLocaleTimeString()}</div>
                                                            <div className="font-medium">[{log.module}]</div>
                                                            <div className="opacity-90">{log.message}</div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                </Card3D>
                            </StaggerItem>

                            {/* Data Grid */}
                            <StaggerItem className="lg:col-span-2">
                                <Card3D elevation={3} glassType="medium" className="h-[600px] flex flex-col" padding="none">
                                    <div className="p-4 border-b border-white/10 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 rounded-lg bg-emerald-500/10">
                                                <Activity className="w-4 h-4 text-emerald-400" />
                                            </div>
                                            <h3 className="text-white font-semibold">Live Data Stream</h3>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                            Live
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-auto">
                                        <table className="min-w-full text-sm">
                                            <thead className="bg-white/5 sticky top-0 backdrop-blur-md z-10">
                                                <tr>
                                                    {cleanedData[0] && Object.keys(cleanedData[0]).filter(k => !k.startsWith('_')).map(key => (
                                                        <th key={key} className="px-6 py-3 text-left text-slate-400 font-medium border-b border-white/10">{key}</th>
                                                    ))}
                                                    <th className="px-6 py-3 text-left text-slate-400 font-medium border-b border-white/10">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <AnimatePresence initial={false}>
                                                    {cleanedData.map((row, idx) => (
                                                        <motion.tr
                                                            key={idx}
                                                            initial={{ opacity: 0, y: -10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            className="border-b border-white/5 hover:bg-white/5 transition-colors"
                                                        >
                                                            {Object.entries(row).filter(([k]) => !k.startsWith('_')).map(([key, value]) => (
                                                                <td key={key} className="px-6 py-3 text-slate-300">{value?.toString() || '-'}</td>
                                                            ))}
                                                            <td className="px-6 py-3">
                                                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[row._status] || 'bg-slate-700/50 border-slate-600 text-slate-300'}`}>
                                                                    {row._status}
                                                                </span>
                                                            </td>
                                                        </motion.tr>
                                                    ))}
                                                </AnimatePresence>
                                            </tbody>
                                        </table>
                                    </div>
                                </Card3D>
                            </StaggerItem>
                        </div>
                    </StaggerContainer>
                )}
            </AnimatePresence>
        </div>
    );
};
