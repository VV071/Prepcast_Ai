import React, { useState } from 'react';
import { AlertTriangle, Info, CheckCircle, XCircle, ChevronDown, ChevronUp, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const PDAEPanel = ({ report, viewMode = 'simple' }) => {
    if (!report || report.flags.length === 0) return null;

    const [expandedIds, setExpandedIds] = useState(new Set());

    const toggleExpand = (id) => {
        const newSet = new Set(expandedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setExpandedIds(newSet);
    };

    return (
        <div className="glass-card rounded-2xl border border-aura-violet/20 bg-bg-0/50 flex flex-col h-full overflow-hidden shadow-aura-violet transition-all duration-500">
            <div className="p-4 border-b border-aura-violet/20 aura-gradient-violet shadow-aura-violet relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
                <div className="flex items-center justify-between relative z-10">
                    <h3 className="text-sm font-black text-white flex items-center uppercase tracking-tighter">
                        <Brain className="w-5 h-5 mr-2 text-white animate-pulse-glow" />
                        Crystal Logic Insights
                    </h3>
                    <span className="glass-strong text-white text-[10px] font-black px-2 py-1 rounded-full border border-white/20 uppercase tracking-widest shadow-aura-violet">
                        {report.flaggedCount} Crystals
                    </span>
                </div>
                <p className="text-[10px] text-white/70 mt-1 font-bold uppercase tracking-widest">
                    PDAE Advanced Plausibility Matrix
                </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-none">
                {report.flags.map((flag, idx) => {
                    const uniqueId = `${flag.row}-${flag.column}`;
                    const isExpanded = expandedIds.has(uniqueId);

                    let statusColor = 'text-aura-teal';
                    let statusBg = 'bg-aura-teal/5';
                    let Icon = AlertTriangle;

                    if (flag.status === 'impossible') {
                        statusColor = 'text-aura-pink';
                        statusBg = 'bg-aura-pink/5';
                        Icon = XCircle;
                    }

                    return (
                        <motion.div
                            key={uniqueId}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className={`rounded-xl border ${statusBg} border-white/5 overflow-hidden transition-all duration-300 transform-3d hover:translate-x-1 shadow-sm hover:shadow-aura-violet/20`}
                        >
                            <div
                                className="p-4 cursor-pointer hover:bg-white/5 flex items-start gap-3"
                                onClick={() => toggleExpand(uniqueId)}
                            >
                                <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${statusColor} animate-pulse-glow`} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                                            Index {flag.row + 1} <span className="mx-1 text-slate-600">•</span> {flag.column}
                                        </span>
                                        <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-full border border-white/10 ${statusColor} glass-strong tracking-widest`}>
                                            {flag.status}
                                        </span>
                                    </div>

                                    <div className="text-xs font-black text-white mb-2 flex items-center gap-2">
                                        <span className="opacity-50 uppercase tracking-wider">Value:</span>
                                        <span className={`font-mono ${statusColor} bg-white/5 px-2 py-0.5 rounded-lg border border-white/5`}>{flag.value}</span>
                                    </div>

                                    {viewMode === 'simple' ? (
                                        <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                                            {flag.status === 'impossible'
                                                ? "Critical misalignment with domain invariants."
                                                : "Anomalous pattern detected relative to population norms."}
                                        </p>
                                    ) : (
                                        <p className="text-[11px] text-slate-400 leading-relaxed font-mono opacity-80">
                                            Logic: {flag.reason}
                                        </p>
                                    )}
                                </div>
                                <div className={`text-slate-600 transition-transform duration-500 scale-75 ${isExpanded ? 'rotate-180 text-aura-violet' : ''}`}>
                                    <ChevronDown className="w-5 h-5" />
                                </div>
                            </div>

                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="border-t border-white/5 bg-black/40"
                                    >
                                        <div className="p-4 text-xs space-y-3">
                                            <div>
                                                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest block mb-1">Inference Rationale</span>
                                                <p className="text-slate-300 font-medium leading-relaxed">{flag.reason}</p>
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest block mb-1">Remediation Protocol</span>
                                                <ul className="text-aura-teal space-y-1.5 font-bold text-[11px]">
                                                    {(flag.suggestedActions || []).map((action, i) => (
                                                        <li key={i} className="flex items-start gap-2">
                                                            <div className="w-1 h-1 rounded-full bg-aura-teal mt-1.5" />
                                                            {action}
                                                        </li>
                                                    ))}
                                                    {(!flag.suggestedActions || flag.suggestedActions.length === 0) && (
                                                        <li className="flex items-start gap-2">
                                                            <div className="w-1 h-1 rounded-full bg-aura-teal mt-1.5" />
                                                            Review source telemetry
                                                        </li>
                                                    )}
                                                </ul>
                                            </div>
                                            {viewMode === 'advanced' && (
                                                <div className="pt-3 border-t border-white/5 flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-600">
                                                    <span>Confidence: {(flag.confidence * 100).toFixed(0)}%</span>
                                                    <span className="text-aura-violet">PDAE Master Node</span>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};
