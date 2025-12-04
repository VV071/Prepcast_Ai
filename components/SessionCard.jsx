import React from 'react';
import { Play, Share2, Trash2 } from 'lucide-react';

export const SessionCard = ({ session, onOpen, onDelete, onShare, formatTimeAgo }) => {
    const getSessionTypeBadge = (type) => {
        const badges = {
            survey: 'bg-blue-100 text-blue-700',
            dynamic: 'bg-purple-100 text-purple-700',
            batch: 'bg-green-100 text-green-700'
        };
        return badges[type] || badges.survey;
    };

    return (
        <div className="bg-white rounded-lg border border-slate-200 hover:shadow-lg transition-shadow p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">
                        {session.session_name}
                    </h3>
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getSessionTypeBadge(session.session_type)}`}>
                        {session.session_type}
                    </span>
                </div>
            </div>

            {/* Description */}
            <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                {session.description || 'No description'}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b border-slate-200">
                <div>
                    <div className="text-lg font-semibold text-slate-900">
                        {session.original_record_count || 0}
                    </div>
                    <div className="text-xs text-slate-500">Records</div>
                </div>
                <div>
                    <div className="text-lg font-semibold text-slate-900">
                        {session.processed_record_count || 0}
                    </div>
                    <div className="text-xs text-slate-500">Processed</div>
                </div>
                <div>
                    <div className="text-lg font-semibold text-slate-900">
                        {session.current_step || 0}/{session.total_steps || 6}
                    </div>
                    <div className="text-xs text-slate-500">Steps</div>
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between">
                <div className="text-xs text-slate-500">
                    Updated {formatTimeAgo(session.updated_at)}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onOpen}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Open session"
                    >
                        <Play className="w-4 h-4" />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onShare && onShare();
                        }}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Share session"
                    >
                        <Share2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete session"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};
