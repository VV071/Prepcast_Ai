import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard,
    FileSpreadsheet,
    RefreshCw,
    Layers,
    PlusCircle,
    Menu,
    Save,
    Download,
    Share2,
    LogOut,
    ChevronDown,
    Brain
} from 'lucide-react';
import {
    createSession as createSessionService,
    getSessions,
    deleteSession as deleteSessionService,
    updateSession,
    logActivity,
    getUserProfile
} from '../services/sessionService';
import { addCollaborator } from '../session-management/collaboratorService';
import { supabase } from '../supabaseClient';
import { PrepCastAI } from './PrepCastAI';
import { DynamicFile } from './DynamicFile';
import { SessionModal } from './SessionModal';
import { SessionCard } from './SessionCard';
import { ShareModal } from './ShareModal';
import { SupabaseStatus } from './SupabaseStatus';

export const MainApp = ({ user, onLogout }) => {
    const [currentView, setCurrentView] = useState('dashboard');
    const [sessions, setSessions] = useState([]);
    const [sharedSessions, setSharedSessions] = useState([]);
    const [currentSession, setCurrentSession] = useState(null);
    const [showSessionModal, setShowSessionModal] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [sessionToShare, setSessionToShare] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const [userProfile, setUserProfile] = useState(null);

    useEffect(() => {
        loadSessions();
        loadUserProfile();
    }, []);

    const loadUserProfile = async () => {
        console.log('🔍 Loading user profile for:', user.email);

        // First check user metadata
        if (user.user_metadata?.full_name) {
            console.log('✅ Found name in user_metadata:', user.user_metadata.full_name);
            setUserProfile({ full_name: user.user_metadata.full_name });
            return;
        }

        try {
            // Try user_profiles table first
            console.log('🔍 Checking user_profiles table...');
            try {
                const profileData = await getUserProfile(user.id);
                if (profileData && profileData.full_name) {
                    console.log('✅ Found name in user_profiles:', profileData.full_name);
                    setUserProfile(profileData);
                    return;
                }
            } catch (profileError) {
                console.log('⚠️ user_profiles check failed:', profileError.message);
            }

            // Try users table
            console.log('🔍 Checking users table...');
            const { data: userData, error: usersError } = await supabase
                .from('users')
                .select('full_name')
                .eq('id', user.id)
                .single();

            if (userData && userData.full_name) {
                console.log('✅ Found name in users table:', userData.full_name);
                setUserProfile(userData);
                return;
            }

            if (usersError) {
                console.log('⚠️ users table check failed:', usersError.message);
            }

            // Final fallback to email
            console.warn('⚠️ No full name found, using email username');
            const emailName = user.email.split('@')[0];
            // Capitalize first letter
            const displayName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
            setUserProfile({ full_name: displayName });

        } catch (error) {
            console.error('❌ Error loading user profile:', error);
            // Fallback to email username
            const emailName = user.email.split('@')[0];
            const displayName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
            setUserProfile({ full_name: displayName });
        }
    };

    const loadSessions = async () => {
        try {
            const userSessions = await getSessions(user.id);
            setSessions(userSessions || []);
        } catch (error) {
            console.error('Failed to load sessions:', error);
        }
    };

    const createSession = async (sessionData) => {
        try {
            const tags = sessionData.tags ? sessionData.tags.split(',').map(tag => tag.trim()) : [];

            const data = await createSessionService(
                user.id,
                sessionData.name,
                sessionData.type,
                sessionData.description,
                { tags, isPublic: sessionData.isPublic || false }
            );

            await logActivity(data.id, user.id, 'create', `Created session: ${sessionData.name}`);

            setCurrentSession(data);
            loadSessions();
            setShowSessionModal(false);

            // Navigate to the appropriate view
            setCurrentView(sessionData.type === 'survey' ? 'survey' : 'dynamic');

            return data;
        } catch (error) {
            console.error('Failed to create session:', error);
        }
    };

    const openSession = async (session) => {
        setCurrentSession(session);

        // Update last accessed
        try {
            await updateSession(session.id, { last_accessed: new Date().toISOString() });
        } catch (err) {
            console.error("Failed to update last_accessed", err);
        }

        // Switch to appropriate view
        setCurrentView(session.session_type === 'survey' ? 'survey' : 'dynamic');
    };

    const deleteSession = async (sessionId) => {
        if (!confirm('Are you sure you want to delete this session?')) return;

        try {
            await deleteSessionService(sessionId);
            // Log activity is tricky here since session is gone, but maybe we log before? 
            // The service doesn't log delete of session itself, only files. 
            // We can't log to a deleted session. 
            // So we skip logging or log to a system level if we had one.

            setSessions(sessions.filter(s => s.id !== sessionId));

            if (currentSession?.id === sessionId) {
                setCurrentSession(null);
                setCurrentView('dashboard');
            }
        } catch (error) {
            console.error('Failed to delete session:', error);
        }
    };

    const handleShareSession = (session) => {
        setSessionToShare(session);
        setShowShareModal(true);
    };

    const handleSendInvite = async (email, permissionLevel) => {
        try {
            const result = await addCollaborator(sessionToShare.id, email, user.id, permissionLevel);
            console.log(`✅ Invitation sent to ${email}`, result);

            // Try to log activity, but don't fail if it doesn't work
            try {
                await logActivity(
                    sessionToShare.id,
                    user.id,
                    'update',
                    `Invited ${email} as ${permissionLevel}`
                );
            } catch (logError) {
                console.log('Activity logging skipped:', logError.message);
            }

            return result;
        } catch (error) {
            console.error('Failed to send invitation:', error);
            // Don't throw - let the modal handle it
            return {
                success: false,
                email: email,
                message: 'Invitation recorded'
            };
        }
    };

    const getInitials = (name) => {
        return name
            .split(' ')
            .map(part => part[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    const formatTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="flex h-screen bg-slate-50">
            {/* Sidebar */}
            <div className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 bg-white border-r border-slate-200 flex flex-col overflow-hidden`}>
                {/* Logo */}
                <div className="p-6 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                            <Brain className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold text-slate-900">PrepCast-AI</span>
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex-1 overflow-y-auto p-4">
                    <div className="space-y-1">
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 py-2">
                            Main
                        </div>
                        <button
                            onClick={() => setCurrentView('dashboard')}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${currentView === 'dashboard' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            <LayoutDashboard className="w-5 h-5" />
                            <span className="font-medium">Dashboard</span>
                        </button>
                        <button
                            onClick={() => setCurrentView('survey')}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${currentView === 'survey' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            <FileSpreadsheet className="w-5 h-5" />
                            <span className="font-medium">Survey Processing</span>
                        </button>
                        <button
                            onClick={() => setCurrentView('dynamic')}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${currentView === 'dynamic' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            <RefreshCw className="w-5 h-5" />
                            <span className="font-medium">Dynamic Sources</span>
                        </button>
                        <button
                            onClick={() => setCurrentView('templates')}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${currentView === 'templates' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            <Layers className="w-5 h-5" />
                            <span className="font-medium">Templates</span>
                        </button>
                    </div>

                    {/* Recent Sessions */}
                    <div className="mt-6">
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 py-2">
                            Recent Sessions
                        </div>
                        <div className="space-y-1">
                            {sessions.slice(0, 5).map(session => (
                                <button
                                    key={session.id}
                                    onClick={() => openSession(session)}
                                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${currentSession?.id === session.id ? 'bg-blue-50' : 'hover:bg-slate-50'
                                        }`}
                                >
                                    <div className="text-sm font-medium text-slate-900 truncate">
                                        {session.session_name}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        {formatTimeAgo(session.updated_at)}
                                    </div>
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setShowSessionModal(true)}
                            className="w-full flex items-center gap-2 px-3 py-2 mt-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                            <PlusCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">New Session</span>
                        </button>
                    </div>
                </div>

                {/* User Profile */}
                <div className="p-4 border-t border-slate-200">
                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {getInitials(userProfile?.full_name || user.user_metadata?.full_name || user.email)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-slate-900 truncate">
                                {userProfile?.full_name || user.user_metadata?.full_name || 'User'}
                            </div>
                            <div className="text-xs text-slate-500 truncate">
                                {user.email}
                            </div>
                        </div>
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Bar */}
                <div className="bg-white border-b border-slate-200 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <Menu className="w-5 h-5 text-slate-600" />
                            </button>
                            <div>
                                <h2 className="text-xl font-semibold text-slate-900">
                                    {currentView === 'dashboard' ? 'Dashboard' :
                                        currentView === 'survey' ? 'Survey Processing' :
                                            currentView === 'dynamic' ? 'Dynamic Sources' :
                                                'Templates'}
                                </h2>
                                {currentSession && (
                                    <p className="text-sm text-slate-500">{currentSession.session_name}</p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {(currentView === 'survey' || currentView === 'dynamic') && currentSession && (
                                <>
                                    <button className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                                        <Save className="w-4 h-4" />
                                        <span className="text-sm font-medium">Save</span>
                                    </button>
                                    <button className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                                        <Download className="w-4 h-4" />
                                        <span className="text-sm font-medium">Export</span>
                                    </button>
                                    <button className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                                        <Share2 className="w-4 h-4" />
                                        <span className="text-sm font-medium">Share</span>
                                    </button>
                                </>
                            )}
                            <button
                                onClick={onLogout}
                                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors ml-2"
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="text-sm font-medium">Logout</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-auto p-6">
                    {currentView === 'dashboard' && (
                        <div>
                            <div className="mb-8">
                                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                                    Welcome back, {(userProfile?.full_name || user.user_metadata?.full_name || 'User').split(' ')[0]}!
                                </h1>
                                <p className="text-slate-600">
                                    Here's what's happening with your data processing sessions.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {sessions.map(session => (
                                    <SessionCard
                                        key={session.id}
                                        session={session}
                                        onOpen={() => openSession(session)}
                                        onDelete={() => deleteSession(session.id)}
                                        onShare={() => handleShareSession(session)}
                                        formatTimeAgo={formatTimeAgo}
                                    />
                                ))}

                                {sessions.length === 0 && (
                                    <div className="col-span-full text-center py-12">
                                        <FileSpreadsheet className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                        <h3 className="text-lg font-semibold text-slate-900 mb-2">No sessions yet</h3>
                                        <p className="text-slate-600 mb-4">Create your first data processing session to get started</p>
                                        <button
                                            onClick={() => setShowSessionModal(true)}
                                            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            <PlusCircle className="w-5 h-5" />
                                            Create Session
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {currentView === 'survey' && (
                        <PrepCastAI
                            session={currentSession}
                            onLogout={onLogout}
                            hideHeader={true}
                        />
                    )}

                    {currentView === 'dynamic' && (
                        <DynamicFile
                            session={currentSession}
                            onLogout={onLogout}
                            hideHeader={true}
                        />
                    )}

                    {currentView === 'templates' && (
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-4">Processing Templates</h2>
                            <p className="text-slate-600 mb-6">Save and reuse your data processing configurations.</p>
                            <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-slate-300">
                                <Layers className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                <p className="text-slate-600">No templates yet. Create templates from your sessions.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Session Modal */}
            {showSessionModal && (
                <SessionModal
                    onClose={() => setShowSessionModal(false)}
                    onCreate={createSession}
                />
            )}

            {showShareModal && sessionToShare && (
                <ShareModal
                    session={sessionToShare}
                    onClose={() => {
                        setShowShareModal(false);
                        setSessionToShare(null);
                    }}
                    onShare={handleSendInvite}
                />
            )}

            {/* Status Indicator */}
            <SupabaseStatus user={user} />
        </div>
    );
};
