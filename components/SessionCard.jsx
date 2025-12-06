import React from 'react';
import { Play, Share2, Trash2, Clock, Database, CheckCircle2, Layers } from 'lucide-react';
import { Card3D } from './3D/Card3D';
import { Button3D } from './3D/Button3D';
import { motion } from 'framer-motion';

export const SessionCard = ({ session, onOpen, onDelete, onShare, formatTimeAgo }) => {
    const getSessionTypeBadge = (type) => {
        const badges = {
            survey: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
            dynamic: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
            batch: 'bg-green-500/10 text-green-400 border-green-500/30'
        };
        return badges[type] || badges.survey;
    };

    return (
        <Card3D
            elevation={3}
            glassType="medium"
            enableTilt={true}
            enableLighting={true}
            padding="lg"
            className="group cursor-pointer"
            onClick={onOpen}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-4 relative z-10">
                <div className="flex-1 min-w-0 pr-4">
                    <h3 className="text-lg font-semibold text-white mb-2 truncate group-hover:text-blue-400 transition-colors">
                        {session.session_name}
                    </h3>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getSessionTypeBadge(session.session_type)}`}>
                        {session.session_type}
                    </span>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                            e.stopPropagation();
                            onShare && onShare();
                        }}
                        className="p-2 text-slate-400 hover:text-white glass-light rounded-lg transition-colors"
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

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 mb-6 pb-6 border-b border-white/10 relative z-10">
                <div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                        <Database className="w-3.5 h-3.5" />
                        Records
                    </div>
                    <div className="text-lg font-semibold text-white">
                        {session.original_record_count || 0}
                    </div>
                </div>
                <div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Processed
                    </div>
                    <div className="text-lg font-semibold text-white">
                        {session.processed_record_count || 0}
                    </div>
                </div>
                <div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                        <Layers className="w-3.5 h-3.5" />
                        Steps
                    </div>
                    <div className="text-lg font-semibold text-white">
                        {session.current_step || 0}/{session.total_steps || 6}
                    </div>
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
