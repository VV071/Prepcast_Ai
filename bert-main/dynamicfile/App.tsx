import React, { useState, useEffect, useCallback, useRef } from 'react';
import Layout from './components/Layout';
import SourceInput from './components/SourceInput';
import { StatCard } from './components/StatCard';
import LogTerminal from './components/LogTerminal';
import LiveGrid from './components/LiveGrid';
import { Activity, AlertTriangle, Cpu, Layers } from 'lucide-react';
import { 
  CleaningDomain, 
  SourceConfig, 
  LogEntry, 
  SystemStats, 
  RawDataRow, 
  CleanedDataRow 
} from './types';
import { detectSourceInfo, processBatchWithAI } from './services/geminiService';
import { INITIAL_MOCK_DATA, DOMAIN_COLORS } from './constants';

// Utility to generate random data for simulation based on domain
const generateMockRow = (domain: CleaningDomain, id: number): RawDataRow => {
  const timestamp = new Date().toISOString();
  
  // 10% chance of generating a "dirty" row
  const isDirty = Math.random() < 0.3; 
  
  if (domain === CleaningDomain.HEALTHCARE) {
    return {
      id: id.toString(),
      timestamp,
      patient_id: `P-${Math.floor(Math.random() * 1000)}`,
      heart_rate: isDirty ? (Math.random() > 0.5 ? null : 220) : 60 + Math.floor(Math.random() * 40), // null or outlier
      temp: 97 + Math.random() * 2,
      location: isDirty ? (Math.random() > 0.5 ? 'NYC' : 'New  York') : 'New York' // Formatting
    };
  } else {
    // Finance/General
    return {
      id: id.toString(),
      timestamp,
      txn_id: `TX-${Math.floor(Math.random() * 10000)}`,
      amount: isDirty ? -50000 : Math.floor(Math.random() * 5000), // Outlier
      category: isDirty ? 'Grocries' : 'Groceries', // Typo
      status: 'pending'
    };
  }
};

const App: React.FC = () => {
  const [hasKey, setHasKey] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sourceConfig, setSourceConfig] = useState<SourceConfig | null>(null);
  
  // Data State
  const [cleanedData, setCleanedData] = useState<CleanedDataRow[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<SystemStats>({
    totalProcessed: 0,
    anomaliesDetected: 0,
    valuesImputed: 0,
    currentDomain: CleaningDomain.GENERAL,
    lastUpdate: new Date()
  });

  const intervalRef = useRef<number | null>(null);
  const idCounter = useRef(1000);

  // Check API Key
  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio && await window.aistudio.hasSelectedApiKey()) {
        setHasKey(true);
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      const has = await window.aistudio.hasSelectedApiKey();
      setHasKey(has);
    }
  };

  const addLog = useCallback((level: LogEntry['level'], module: LogEntry['module'], message: string) => {
    setLogs(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      level,
      module,
      message
    }].slice(-50)); // Keep last 50 logs
  }, []);

  const startMonitoring = async (config: { type: string, url: string, name: string, interval: number }) => {
    setIsProcessing(true);
    addLog('INFO', 'System', `Initializing connection to ${config.name}...`);
    addLog('INFO', 'System', `Target URL: ${config.url}`);

    try {
      // 1. Detect Source Type (AI) - We still run this to get "Confidence" or domain info, 
      // but we respect the user's manual selection for the primary type.
      const detection = await detectSourceInfo(config.url);
      
      let detectedDomain = CleaningDomain.GENERAL;
      if (config.url.toLowerCase().includes('hospital') || config.url.toLowerCase().includes('patient')) detectedDomain = CleaningDomain.HEALTHCARE;
      else if (config.url.toLowerCase().includes('finance') || config.name.toLowerCase().includes('covid')) detectedDomain = CleaningDomain.FINANCE; // Mapping COVID to stats/finance structure for demo
      
      setStats(prev => ({ ...prev, currentDomain: detectedDomain }));
      
      // Log the result
      addLog('SUCCESS', 'System', `Source configured: ${config.type} (AI Confirmation: ${detection.confidence * 100}%)`);
      addLog('INFO', 'DomainDetector', `Schema inferred: ${detectedDomain} | Strategy: Active Learning`);

      setSourceConfig({
        type: config.type as any,
        url: config.url,
        name: config.name,
        frequency: config.interval,
        isActive: true
      });

      // Initialize with some data
      setCleanedData([]);
      
    } catch (err) {
      addLog('ERROR', 'System', 'Failed to connect to source');
      setIsProcessing(false);
    }
  };

  // Main Simulation Loop
  useEffect(() => {
    if (!sourceConfig?.isActive) return;

    // Run immediately once
    runBatchProcessor();

    // Use frequency from config, but ensure it's at least 2 seconds for the demo UI to not spaz out
    const safeInterval = Math.max(sourceConfig.frequency, 2); 
    intervalRef.current = window.setInterval(runBatchProcessor, safeInterval * 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceConfig]);

  const runBatchProcessor = async () => {
    if (!sourceConfig) return;

    // 1. Simulate Fetching New Data (1-3 rows)
    const newRawRows: RawDataRow[] = [];
    const count = Math.floor(Math.random() * 2) + 1; // 1 or 2 rows at a time
    for (let i = 0; i < count; i++) {
      newRawRows.push(generateMockRow(stats.currentDomain, idCounter.current++));
    }

    addLog('INFO', 'System', `Fetched ${newRawRows.length} new records from ${sourceConfig.name}. Processing...`);

    // 2. Send to AI for Cleaning
    const result = await processBatchWithAI(newRawRows, stats.currentDomain);

    // 3. Update Logs from AI
    result.logs.forEach(logMsg => {
      // Parse basic log prefixes if AI returns them
      let level: LogEntry['level'] = 'INFO';
      let module: LogEntry['module'] = 'System';
      
      if (logMsg.toLowerCase().includes('imput')) { module = 'Imputer'; level = 'WARN'; }
      if (logMsg.toLowerCase().includes('anomal')) { module = 'AnomalyDetector'; level = 'ERROR'; }
      if (logMsg.toLowerCase().includes('normaliz')) { module = 'TextNormalizer'; level = 'SUCCESS'; }
      
      addLog(level, module, logMsg);
    });

    // 4. Update Stats & Data
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

    setCleanedData(prev => [...result.cleanedRows, ...prev].slice(0, 50)); // Keep recent 50
  };

  return (
    <Layout apiKeySelected={hasKey} onSelectKey={handleSelectKey}>
      {!sourceConfig ? (
        <SourceInput onStart={startMonitoring} isLoading={isProcessing} />
      ) : (
         <div className="space-y-6 animate-in fade-in duration-700">
           
           {/* Top Stats */}
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
               trend="+12%" // Simulated trend
             />
             <StatCard 
               title="AI Imputations" 
               value={stats.valuesImputed} 
               icon={<Cpu className="w-5 h-5 text-purple-400" />} 
               colorClass="text-purple-400"
               trendUp={true}
               trend="Active"
             />
           </div>

           {/* Main Split View */}
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]">
             {/* Left: Logs */}
             <div className="lg:col-span-1">
               <LogTerminal logs={logs} />
             </div>
             
             {/* Right: Data Grid */}
             <div className="lg:col-span-2">
               <LiveGrid data={cleanedData} />
             </div>
           </div>
         </div>
      )}
    </Layout>
  );
};

export default App;