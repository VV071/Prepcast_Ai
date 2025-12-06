import React, { useState, useEffect } from 'react';
import { runCompleteSetup } from '../supabaseSetup';

/**
 * Supabase Connection Status Component
 * Shows real-time connection status and verification results
 */
export const SupabaseStatus = ({ user }) => {
    const [status, setStatus] = useState({
        loading: true,
        connected: false,
        tables: 0,
        buckets: 0,
        writeTest: null
    });
    const [showDetails, setShowDetails] = useState(false);

    useEffect(() => {
        if (user?.id) {
            checkConnection();
        }
    }, [user]);

    const checkConnection = async () => {
        setStatus(prev => ({ ...prev, loading: true }));

        try {
            const results = await runCompleteSetup(user.id);

            const tablesOk = Object.values(results.tables).filter(r => r.status === 'success').length;
            const bucketsOk = Object.values(results.buckets).filter(r => r.status === 'success' || r.exists).length;

            setStatus({
                loading: false,
                connected: results.allGood,
                tables: tablesOk,
                buckets: bucketsOk,
                writeTest: results.writeTest?.status,
                details: results
            });
        } catch (error) {
            console.error('Status check failed:', error);
            setStatus(prev => ({ ...prev, loading: false, connected: false }));
        }
    };

    if (!user) return null;

    return (
        <div className="fixed bottom-6 right-6 z-30">
            <div className="glass-strong rounded-xl shadow-2xl border border-white/10 p-4 max-w-xs elevation-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${status.loading ? 'bg-yellow-500 animate-pulse' :
                            status.connected ? 'bg-green-500' : 'bg-red-500'
                            }`}></div>
                        <span className="font-semibold text-sm text-white">
                            {status.loading ? 'Checking...' :
                                status.connected ? 'Connected' : 'Issues Detected'}
                        </span>
                    </div>
                    <button
                        onClick={() => setShowDetails(!showDetails)}
                        className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                    >
                        {showDetails ? 'Hide' : 'Details'}
                    </button>
                </div>

                {/* Quick Stats */}
                {!status.loading && (
                    <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center">
                            <div className="font-semibold text-white">{status.tables}/10</div>
                            <div className="text-slate-400">Tables</div>
                        </div>
                        <div className="text-center">
                            <div className="font-semibold text-white">{status.buckets}/2</div>
                            <div className="text-slate-400">Buckets</div>
                        </div>
                        <div className="text-center">
                            <div className={`font-semibold ${status.writeTest === 'success' ? 'text-green-400' : 'text-red-400'
                                }`}>
                                {status.writeTest === 'success' ? '✓' : '✗'}
                            </div>
                            <div className="text-slate-400">Write</div>
                        </div>
                    </div>
                )}

                {/* Detailed Status */}
                {showDetails && status.details && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                        <div className="text-xs space-y-1">
                            <div className="font-semibold mb-1 text-white">Tables:</div>
                            {Object.entries(status.details.tables).map(([name, result]) => (
                                <div key={name} className="flex items-center gap-1 text-xs">
                                    <span className={result.status === 'success' ? 'text-green-400' : 'text-red-400'}>
                                        {result.status === 'success' ? '✓' : '✗'}
                                    </span>
                                    <span className="text-slate-300">{name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Refresh Button */}
                <button
                    onClick={checkConnection}
                    disabled={status.loading}
                    className="mt-3 w-full py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-500 disabled:bg-slate-700 transition-colors shadow-lg shadow-blue-500/20"
                >
                    {status.loading ? 'Checking...' : 'Refresh Status'}
                </button>
            </div>
        </div>
    );
};
