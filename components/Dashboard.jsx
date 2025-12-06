import React, { useState } from 'react';
import { PrepCastAI } from './PrepCastAI';
import { DynamicFile } from './DynamicFile';
import { FileSpreadsheet, Activity, LogOut } from 'lucide-react';
import { supabase } from '../supabaseClient';

import { Logo } from './Logo';

export const Dashboard = ({ onLogout }) => {
    const [activeTab, setActiveTab] = useState('prepcast'); // 'prepcast' or 'dynamic'

    const handleLogout = async () => {
        await supabase.auth.signOut();
        onLogout();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            {/* Header with Navigation */}
            <div className="bg-white border-b border-slate-200 shadow-sm">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-8">
                            <Logo variant="dark" textClassName="text-2xl" />

                            {/* Tab Navigation */}
                            <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setActiveTab('prepcast')}
                                    className={`px-6 py-2 rounded-md font-medium transition-all ${activeTab === 'prepcast'
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <FileSpreadsheet className="w-4 h-4" />
                                        Batch Processing
                                    </div>
                                </button>
                                <button
                                    onClick={() => setActiveTab('dynamic')}
                                    className={`px-6 py-2 rounded-md font-medium transition-all ${activeTab === 'dynamic'
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <Activity className="w-4 h-4" />
                                        Real-Time Streaming
                                    </div>
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition flex items-center gap-2"
                        >
                            <LogOut className="w-4 h-4" />
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="container mx-auto px-4 py-8">
                {activeTab === 'prepcast' ? (
                    <PrepCastAI onLogout={handleLogout} hideHeader={true} />
                ) : (
                    <DynamicFile onLogout={handleLogout} hideHeader={true} />
                )}
            </div>
        </div>
    );
};
