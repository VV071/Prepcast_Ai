import React from 'react';
import { Play, Share2, Trash2, Clock, Pin, FileText, BarChart2, CheckCircle2 } from 'lucide-react';
import { Card3D } from './3D/Card3D';
import { Button3D } from './3D/Button3D';
import { motion } from 'framer-motion';
import { FuzzyText } from './FuzzyText';

export const SessionCard = ({ session, onOpen, onDelete, onShare, onPin, formatTimeAgo }) => {
    const getSessionTypeBadge = (type) => {
        const badges = {
            survey: 'aura-gradient-violet text-white border-aura-violet/30 shadow-aura-violet',
            dynamic: 'aura-gradient-teal text-white border-aura-teal/30 shadow-aura-teal',
            batch: 'bg-pink-500/10 text-pink-400 border-pink-500/30'
        };
        return badges[type] || badges.survey;
    };

    // Calculate progress percentage for progress ring
    const progress = Math.round((session.current_step / (session.total_steps || 6)) * 100);
    const radius = 18;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <Card3D
            elevation={session.is_pinned ? 4 : 3}
            glassType="medium"
            enableTilt={true}
            enableLighting={true}
            padding="lg"
            className={`group cursor-pointer border border-white/5 transition-all duration-500 ${session.is_pinned ? 'ring-2 ring-aura-violet shadow-aura-violet elevation-4 scale-[1.02]' : ''}`}
            onClick={onOpen}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-4 relative z-10">
                <div className="flex-1 min-w-0 pr-4">
                    <h3 className="text-xl font-black text-white mb-2 truncate group-hover:aura-text-gradient transition-all duration-500 uppercase tracking-tight">
                        {session.session_name}
                    </h3>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black border ${getSessionTypeBadge(session.session_type)}`}>
                        <FuzzyText original={session.session_type}>{session.session_type}</FuzzyText>
                    </span>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                            e.stopPropagation();
                            onPin && onPin(session);
                        }}
                        className={`p-2 rounded-lg transition-all duration-300 ${session.is_pinned
                            ? 'text-white aura-gradient-violet shadow-aura-violet'
                            : 'text-slate-400 hover:text-aura-violet glass-light'
                            }`}
                        title={session.is_pinned ? "Unpin session" : "Pin session"}
                    >
                        <Pin className={`w-4 h-4 ${session.is_pinned ? 'fill-current' : ''}`} />
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                            e.stopPropagation();
                            onShare && onShare();
                        }}
                        className="p-2 text-slate-400 hover:text-aura-teal glass-light rounded-lg transition-all"
                        title="Share session"
                    >
                        <Share2 className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        className="p-2 text-slate-400 hover:text-red-400 glass-light hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Delete session"
                    >
                        <Trash2 className="w-4 h-4" />
                    </motion.button>
                </div>
            </div>

            {/* Description */}
            <p className="text-sm text-slate-400 mb-6 line-clamp-2 min-h-[2.5rem] relative z-10">
                {session.description || 'No description provided for this session.'}
            </p>

            {/* Progress & Status */}
            <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/10 relative z-10">
                <div className="flex items-center gap-3">
                    {/* Progress Ring */}
                    <div className="relative w-12 h-12 flex items-center justify-center">
                        <svg className="transform -rotate-90 w-12 h-12">
                            <circle
                                cx="24"
                                cy="24"
                                r={radius}
                                stroke="currentColor"
                                strokeWidth="3"
                                fill="transparent"
                                className="text-white/10"
                            />
                            <circle
                                cx="24"
                                cy="24"
                                r={radius}
                                stroke="currentColor"
                                strokeWidth="3"
                                fill="transparent"
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                className="text-aura-violet transition-all duration-500 ease-in-out"
                            />
                        </svg>
                        <span className="absolute text-xs font-semibold text-white">{progress}%</span>
                    </div>
                    <div className="text-xs text-slate-400">
                        <p className="font-black text-white uppercase tracking-tighter">Step {session.current_step || 0} of {session.total_steps || 6}</p>
                        <p>{session.processed_record_count || 0} records</p>
                    </div>
                </div>
            </div>

            {/* File Status Badges */}
            <div className="flex gap-2 mb-6 relative z-10">
                <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${session.raw_file_path || session.processed_data
                    ? 'aura-gradient-violet text-white shadow-aura-violet'
                    : 'bg-white/5 text-slate-600 border border-white/5'
                    }`}>
                    <FileText className="w-3.5 h-3.5" />
                    Raw
                </div>
                <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${session.cleaned_file_path || session.processed_data
                    ? 'aura-gradient-teal text-white shadow-aura-teal'
                    : 'bg-white/5 text-slate-600 border border-white/5'
                    }`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Cleaned
                </div>
                <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${session.report_file_path || session.statistics
                    ? 'bg-aura-pink text-white shadow-[0_0_15px_rgba(253,138,107,0.3)]'
                    : 'bg-white/5 text-slate-600 border border-white/5'
                    }`}>
                    <BarChart2 className="w-3.5 h-3.5" />
                    Report
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Clock className="w-3.5 h-3.5" />
                    Updated {formatTimeAgo(session.updated_at)}
                </div>

                <Button3D
                    variant="primary"
                    size="sm"
                    onClick={(e) => {
                        e.stopPropagation();
                        onOpen();
                    }}
                    rightIcon={<Play className="w-3.5 h-3.5" />}
                >
                    Open
                </Button3D>
            </div>
        </Card3D>
    );
};
