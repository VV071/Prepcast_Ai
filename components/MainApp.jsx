import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
    Search,
    Bell
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
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { ShareModal } from './ShareModal';

import { StaggerContainer, StaggerItem, FloatingElement } from './MotionWrapper';

export const MainApp = ({ user, onLogout }) => {
    const [currentView, setCurrentView] = useState('dashboard');
    const [sessions, setSessions] = useState([]);
    const [sharedSessions, setSharedSessions] = useState([]);
    const [currentSession, setCurrentSession] = useState(null);
    const [showSessionModal, setShowSessionModal] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [sessionToShare, setSessionToShare] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sessionsLoading, setSessionsLoading] = useState(true);

    const [userProfile, setUserProfile] = useState(null);

    useEffect(() => {
        loadSessions();
        loadUserProfile();
    }, []);

    const loadUserProfile = async () => {
        if (user.user_metadata?.full_name) {
            setUserProfile({ full_name: user.user_metadata.full_name });
            return;
        }

        try {
            try {
                const profileData = await getUserProfile(user.id);
                if (profileData && profileData.full_name) {
                    setUserProfile(profileData);
                    return;
                }
            } catch (profileError) {
                console.log('⚠️ user_profiles check failed:', profileError.message);
            }

            const { data: userData } = await supabase
                .from('users')
                .select('full_name')
                .eq('id', user.id)
                .single();

            if (userData && userData.full_name) {
                setUserProfile(userData);
                return;
            }

            const emailName = user.email.split('@')[0];
            const displayName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
            setUserProfile({ full_name: displayName });

        } catch (error) {
            const emailName = user.email.split('@')[0];
            const displayName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
            setUserProfile({ full_name: displayName });
        }
    };

    const loadSessions = async () => {
        try {
            setSessionsLoading(true);
            const userSessions = await getSessions(user.id);
            setSessions(userSessions || []);
        } catch (error) {
            console.error('Failed to load sessions:', error);
            setSessions([]);
        } finally {
            setSessionsLoading(false);
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
            setCurrentView(sessionData.type === 'survey' ? 'survey' : 'dynamic');

            return data;
        } catch (error) {
            console.error('Failed to create session:', error);
        }
    };

    const openSession = async (session) => {
        setCurrentSession(session);
        try {
            await updateSession(session.id, { last_accessed: new Date().toISOString() });
        } catch (err) {
            console.error("Failed to update last_accessed", err);
        }
        setCurrentView(session.session_type === 'survey' ? 'survey' : 'dynamic');
    };

    const deleteSession = async (sessionId) => {
        if (!confirm('Are you sure you want to delete this session?')) return;

        try {
            await deleteSessionService(sessionId);
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
        <div className="flex h-screen overflow-hidden bg-[#0f172a] text-slate-200">
            {/* Sidebar - Enhanced 3D */}
            <div className={`${sidebarOpen ? 'w-72' : 'w-0'} transition-all duration-300 glass-medium border-r border-white/10 flex flex-col elevation-2 overflow-hidden`}>
                {/* Logo */}
                <div className="p-6 border-b border-white/10">
                    <Logo variant="light" />
                </div>

                {/* Navigation */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    <div>
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2 mb-2">
                            Main Menu
                        </div>
                        <div className="space-y-1">
                            {[
                                { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
                                { id: 'survey', icon: FileSpreadsheet, label: 'Survey Processing' },
                                { id: 'dynamic', icon: RefreshCw, label: 'Dynamic Sources' },
                                { id: 'templates', icon: Layers, label: 'Templates' }
                            ].map(item => (
                                <motion.button
                                    key={item.id}
                                    whileHover={{ x: 4 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setCurrentView(item.id)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${currentView === item.id
                                        ? 'glass-strong text-blue-400 border border-blue-500/30 elevation-1'
                                        : 'text-slate-400 hover:glass-light hover:text-slate-200'
                                        }`}
                                >
                                    <item.icon className="w-5 h-5" />
                                    <span className="font-medium">{item.label}</span>
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    {/* Recent Sessions */}
                    <div>
                        <div className="flex items-center justify-between px-3 py-2 mb-2">
                            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Recent Sessions
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.1, rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setShowSessionModal(true)}
                                className="text-blue-400 hover:text-blue-300 transition-colors"
                            >
                                <PlusCircle className="w-4 h-4" />
                            </motion.button>
                        </div>
                        <div className="space-y-1">
                            {sessions.slice(0, 5).map(session => (
                                <motion.button
                                    key={session.id}
                                    whileHover={{ x: 4 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => openSession(session)}
                                    className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-200 group ${currentSession?.id === session.id
                                        ? 'glass-strong text-white border border-white/10'
                                        : 'text-slate-400 hover:glass-light hover:text-slate-200'
                                        }`}
                                >
                                    <div className="text-sm font-medium truncate group-hover:text-blue-400 transition-colors">
                                        {session.session_name}
                                    </div>
                                    <div className="text-xs text-slate-600 group-hover:text-slate-500">
                                        {formatTimeAgo(session.updated_at)}
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* User Profile */}
                <div className="p-4 border-t border-white/10 glass-light">
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="flex items-center gap-3 p-2 rounded-lg hover:glass-medium cursor-pointer transition-all duration-200"
                    >
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold shadow-lg elevation-1">
                            {getInitials(userProfile?.full_name || user.user_metadata?.full_name || user.email)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-white truncate">
                                {userProfile?.full_name || user.user_metadata?.full_name || 'User'}
                            </div>
                            <div className="text-xs text-slate-500 truncate">
                                {user.email}
                            </div>
                        </div>
                        <motion.div
                            animate={{ rotate: [0, 180] }}
                            transition={{ duration: 0.3 }}
                        >
                            <ChevronDown className="w-4 h-4 text-slate-500" />
                        </motion.div>
                    </motion.div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#0f172a] relative">
                {/* Background Gradients */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[-20%] left-[20%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px]" />
                    <div className="absolute bottom-[-20%] right-[20%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px]" />
                </div>

                {/* Top Bar - Enhanced 3D */}
                <div className="h-16 glass-strong border-b border-white/10 flex items-center justify-between px-6 sticky top-0 z-20 elevation-3">
                    <div className="flex items-center gap-4">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 text-slate-400 hover:text-white glass-light hover:glass-medium rounded-lg transition-all duration-200"
                        >
                            <Menu className="w-5 h-5" />
                        </motion.button>
                        <div className="flex items-center gap-3">
                            <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full" />
                            <h2 className="text-lg font-semibold text-white">
                                {currentView === 'dashboard' ? 'Dashboard' :
                                    currentView === 'survey' ? 'Survey Processing' :
                                        currentView === 'dynamic' ? 'Dynamic Sources' :
                                            'Templates'}
                            </h2>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Search Bar - Enhanced */}
                        <div className="hidden md:flex items-center glass-light rounded-xl px-4 py-2 border border-white/5 focus-within:glass-medium focus-within:border-blue-500/30 transition-all duration-300 w-64 elevation-1">
                            <Search className="w-4 h-4 text-slate-500 mr-2" />
                            <input
                                type="text"
                                placeholder="Search sessions..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-transparent border-none focus:outline-none text-sm text-white placeholder:text-slate-400 w-full"
                            />
                        </div>

                        {/* Theme Toggle */}
                        <ThemeToggle />

                        {/* Notification Bell - Enhanced */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="relative p-2 text-slate-400 hover:text-white glass-light hover:glass-medium rounded-lg transition-all duration-200"
                        >
                            <Bell className="w-5 h-5" />
                            <motion.span
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0f172a]"
                            />
                        </motion.button>

                        {(currentView === 'survey' || currentView === 'dynamic') && currentSession && (
                            <div className="flex items-center gap-2 border-l border-white/10 pl-4 ml-2">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="p-2 text-slate-400 hover:text-blue-400 glass-light hover:bg-blue-500/10 rounded-lg transition-all duration-200"
                                    title="Save"
                                >
                                    <Save className="w-4 h-4" />
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="p-2 text-slate-400 hover:text-green-400 glass-light hover:bg-green-500/10 rounded-lg transition-all duration-200"
                                    title="Export"
                                >
                                    <Download className="w-4 h-4" />
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="p-2 text-slate-400 hover:text-purple-400 glass-light hover:bg-purple-500/10 rounded-lg transition-all duration-200"
                                    title="Share"
                                >
                                    <Share2 className="w-4 h-4" />
                                </motion.button>
                            </div>
                        )}

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onLogout}
                            className="flex items-center gap-2 px-4 py-2 glass-light hover:glass-medium text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/40 rounded-xl transition-all duration-200 ml-2 text-sm font-medium elevation-1"
                        >
                            <LogOut className="w-4 h-4" />
                            <span>Logout</span>
                        </motion.button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-auto p-6 relative z-10">
                    {currentView === 'dashboard' && (
                        <div className="max-w-7xl mx-auto">
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                                className="mb-8"
                            >
                                <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
                                    Welcome back, <FloatingElement duration={5} yOffset={5} className="inline-block"><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-[length:200%_auto] animate-shimmer">{(userProfile?.full_name || user.user_metadata?.full_name || 'User').split(' ')[0]}</span></FloatingElement>
                                </h1>
                                <p className="text-lg text-slate-400">
                                    Here's what's happening with your data processing sessions.
                                </p>
                            </motion.div>

                            <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {sessionsLoading ? (
                                    [1, 2, 3].map(i => (
                                        <StaggerItem key={`skeleton-${i}`}>
                                            <div className="glass-card border border-white/10 p-6 rounded-2xl min-h-[240px] animate-pulse">
                                                <div className="h-4 bg-white/10 rounded w-3/4 mb-4"></div>
                                                <div className="h-3 bg-white/5 rounded w-1/2 mb-2"></div>
                                                <div className="h-3 bg-white/5 rounded w-2/3"></div>
                                            </div>
                                        </StaggerItem>
                                    ))
                                ) : (
                                    <>
                                        {sessions
                                            .filter(session =>
                                                !searchQuery ||
                                                session.session_name.toLowerCase().includes(searchQuery.toLowerCase())
                                            )
                                            .map(session => (
                                                <StaggerItem key={session.id}>
                                                    <SessionCard
                                                        session={session}
                                                        onOpen={() => openSession(session)}
                                                        onDelete={() => deleteSession(session.id)}
                                                        onShare={() => handleShareSession(session)}
                                                        formatTimeAgo={formatTimeAgo}
                                                    />
                                                </StaggerItem>
                                            ))}

                                        <StaggerItem>
                                            <motion.button
                                                onClick={() => setShowSessionModal(true)}
                                                whileHover={{ scale: 1.02, borderColor: 'rgba(59, 130, 246, 0.5)' }}
                                                whileTap={{ scale: 0.98 }}
                                                className="group relative flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-slate-700 hover:bg-blue-500/5 transition-all duration-300 min-h-[240px] w-full"
                                            >
                                                <motion.div
                                                    animate={{ rotate: [0, 5, -5, 0] }}
                                                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                                                    className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4 group-hover:bg-blue-500/20"
                                                >
                                                    <PlusCircle className="w-8 h-8 text-slate-400 group-hover:text-blue-400 transition-colors" />
                                                </motion.div>
                                                <h3 className="text-lg font-semibold text-slate-300 group-hover:text-blue-400 mb-1 transition-colors">Create New Session</h3>
                                                <p className="text-sm text-slate-500 text-center max-w-[200px]">Start a new data processing project</p>
                                            </motion.button>
                                        </StaggerItem>
                                    </>
                                )}
                            </StaggerContainer>
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
                        <div className="max-w-4xl mx-auto">
                            <h2 className="text-2xl font-bold text-white mb-4">Processing Templates</h2>
                            <p className="text-slate-400 mb-6">Save and reuse your data processing configurations.</p>
                            <div className="text-center py-20 bg-white/5 rounded-2xl border border-dashed border-slate-700">
                                <Layers className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-slate-300 mb-2">No templates yet</h3>
                                <p className="text-slate-500">Create templates from your existing sessions to speed up your workflow.</p>
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


        </div>
    );
};
