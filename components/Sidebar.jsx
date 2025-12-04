import React from 'react';
import { Info, Settings, Upload, Download, Database, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';

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
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                    <Info className="w-5 h-5 mr-2 text-blue-600" />
                    Processing Log
                </h3>
                <div className="space-y-3 max-h-80 overflow-y-auto pr-2 scrollbar-hide">
                    {logs.length === 0 ? (
                        <p className="text-slate-400 text-sm italic">No logs yet...</p>
                    ) : (
                        [...logs].reverse().map(log => (
                            <div
                                key={log.id}
                                className={`p-3 rounded-lg text-sm border ${log.type === 'error' ? 'bg-red-50 border-red-100 text-red-800' :
                                        log.type === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-800' :
                                            log.type === 'success' ? 'bg-green-50 border-green-100 text-green-800' :
                                                'bg-blue-50 border-blue-100 text-blue-800'
                                    }`}
                            >
                                <div className="flex items-start">
                                    {log.type === 'error' && <AlertCircle className="w-4 h-4 mr-2 mt-0.5 shrink-0" />}
                                    {log.type === 'warning' && <AlertTriangle className="w-4 h-4 mr-2 mt-0.5 shrink-0" />}
                                    {log.type === 'success' && <CheckCircle className="w-4 h-4 mr-2 mt-0.5 shrink-0" />}
                                    {log.type === 'info' && <Info className="w-4 h-4 mr-2 mt-0.5 shrink-0" />}
                                    <div>
                                        <p className="font-medium">{log.message}</p>
                                        <p className="text-xs opacity-70 mt-1">{log.timestamp}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                    <Settings className="w-5 h-5 mr-2 text-slate-600" />
                    Quick Actions
                </h3>
                <div className="space-y-3">
                    <button
                        onClick={onUploadClick}
                        className="w-full text-left p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors flex items-center group"
                    >
                        <Upload className="w-4 h-4 mr-3 text-slate-500 group-hover:text-blue-600" />
                        <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">Upload New File</span>
                    </button>

                    <button
                        onClick={onExportRaw}
                        disabled={!canExport}
                        className={`w-full text-left p-3 rounded-lg transition-colors flex items-center group ${canExport ? 'bg-slate-50 hover:bg-slate-100' : 'bg-slate-50 opacity-50 cursor-not-allowed'
                            }`}
                    >
                        <Download className="w-4 h-4 mr-3 text-slate-500 group-hover:text-blue-600" />
                        <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">Export Raw Data</span>
                    </button>

                    <button
                        onClick={onExportProcessed}
                        disabled={!canExportProcessed}
                        className={`w-full text-left p-3 rounded-lg transition-colors flex items-center group ${canExportProcessed ? 'bg-slate-50 hover:bg-slate-100' : 'bg-slate-50 opacity-50 cursor-not-allowed'
                            }`}
                    >
                        <Database className="w-4 h-4 mr-3 text-slate-500 group-hover:text-green-600" />
                        <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">Download Processed Data</span>
                    </button>
                </div>
            </div>

            {/* Features */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl shadow-lg p-6 text-white">
                <h3 className="text-lg font-semibold mb-4">System Intelligence</h3>
                <div className="space-y-3 text-sm text-indigo-100">
                    <div className="flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
                        AI Domain Detection
                    </div>
                    <div className="flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
                        Smart Delta Cleaning
                    </div>
                    <div className="flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
                        Weighted Statistics
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
