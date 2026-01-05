import React from 'react';
import { Info, Settings, Upload, Download, Database, CheckCircle, AlertTriangle, AlertCircle, Zap } from 'lucide-react';

const Sidebar = ({
    logs,
    onUploadClick,
    onExportRaw,
    onExportProcessed,
    canExport,
    canExportProcessed
}) => {
    return (
        <div className="space-y-6">
            {/* Logs Panel */}
            <div className="glass-card rounded-2xl p-6 shadow-aura-violet border border-aura-violet/10">
                <h3 className="text-lg font-black text-white mb-4 flex items-center uppercase tracking-tighter">
                    <Info className="w-5 h-5 mr-2 text-aura-violet animate-pulse-glow" />
                    Processing Log
                </h3>
                <div className="space-y-3 max-h-80 overflow-y-auto pr-2 scrollbar-none">
                    {logs.length === 0 ? (
                        <p className="text-slate-500 text-sm italic font-medium">Listening for your signals...</p>
                    ) : (
                        [...logs].reverse().map(log => (
                            <div
                                key={log.id}
                                className={`p-3 rounded-xl text-xs border transition-all duration-300 ${log.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                                    log.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                                        log.type === 'success' ? 'bg-aura-teal/10 border-aura-teal/20 text-aura-teal shadow-[0_0_10px_rgba(0,245,255,0.1)]' :
                                            'bg-aura-violet/10 border-aura-violet/20 text-aura-violet-light'
                                    }`}
                            >
                                <div className="flex items-start">
                                    {log.type === 'error' && <AlertCircle className="w-4 h-4 mr-2 mt-0.5 shrink-0" />}
                                    {log.type === 'warning' && <AlertTriangle className="w-4 h-4 mr-2 mt-0.5 shrink-0" />}
                                    {log.type === 'success' && <CheckCircle className="w-4 h-4 mr-2 mt-0.5 shrink-0" />}
                                    {log.type === 'info' && <Info className="w-4 h-4 mr-2 mt-0.5 shrink-0" />}
                                    <div>
                                        <p className="font-bold tracking-tight">{log.message}</p>
                                        <p className="text-[10px] opacity-50 mt-1 uppercase font-black">{log.timestamp}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="glass-card rounded-2xl p-6 shadow-aura-teal border border-aura-teal/10">
                <h3 className="text-lg font-black text-white mb-4 flex items-center uppercase tracking-tighter">
                    <Settings className="w-5 h-5 mr-2 text-aura-teal/70" />
                    Quick Actions
                </h3>
                <div className="space-y-3">
                    <button
                        onClick={onUploadClick}
                        className="w-full text-left p-3 glass-light hover:glass-medium border border-white/5 rounded-xl transition-all flex items-center group"
                    >
                        <Upload className="w-4 h-4 mr-3 text-aura-violet group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-black text-slate-300 group-hover:text-white uppercase tracking-wider">Upload New File</span>
                    </button>

                    <button
                        onClick={onExportRaw}
                        disabled={!canExport}
                        className={`w-full text-left p-3 rounded-xl transition-all flex items-center group border border-white/5 ${canExport ? 'glass-light hover:glass-medium' : 'bg-white/5 opacity-30 cursor-not-allowed'
                            }`}
                    >
                        <Download className="w-4 h-4 mr-3 text-aura-teal group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-black text-slate-300 group-hover:text-white uppercase tracking-wider">Export Raw Data</span>
                    </button>

                    <button
                        onClick={onExportProcessed}
                        disabled={!canExportProcessed}
                        className={`w-full text-left p-3 rounded-xl transition-all flex items-center group border border-white/5 ${canExportProcessed ? 'glass-light hover:glass-medium' : 'bg-white/5 opacity-30 cursor-not-allowed'
                            }`}
                    >
                        <Database className="w-4 h-4 mr-3 text-aura-pink group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-black text-slate-300 group-hover:text-white uppercase tracking-wider">Download Prep Data</span>
                    </button>
                </div>
            </div>

            {/* Features */}
            <div className="aura-gradient-violet rounded-2xl shadow-aura-violet p-6 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-150 transition-transform duration-1000">
                    <Zap className="w-20 h-20" />
                </div>
                <h3 className="text-lg font-black mb-4 uppercase tracking-tighter">PrepCast Intelligence</h3>
                <div className="space-y-3 text-xs font-bold uppercase tracking-widest text-white/80">
                    <div className="flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2 text-aura-teal" />
                        AI Domain Detection
                    </div>
                    <div className="flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2 text-aura-teal" />
                        Smart Delta Cleaning
                    </div>
                    <div className="flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2 text-aura-teal" />
                        Weighted Statistics
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
