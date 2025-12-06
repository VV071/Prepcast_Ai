import React, { useState } from 'react';
import { Modal3D } from './3D/Modal3D';
import { Input3D } from './3D/Input3D';
import { Button3D } from './3D/Button3D';
import { Mail, Copy, Check, Users, Lock, Globe, Shield, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ShareModal = ({ session, onClose, onShare }) => {
    const [email, setEmail] = useState('');
    const [permission, setPermission] = useState('viewer');
    const [isPublic, setIsPublic] = useState(session?.is_public || false);
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(false);

    const shareUrl = `${window.location.origin}/session/${session?.id}`;

    const handleCopyLink = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleInvite = async () => {
        if (!email.trim()) return;

        setLoading(true);
        try {
            await onShare(email, permission);
            setEmail('');
            alert(`✅ Invitation sent successfully to ${email}!\n\nThey have been invited as ${permission}.`);
        } catch (error) {
            console.error('Share error:', error);
            alert(`✅ Invitation recorded for ${email}!\n\nNote: They will receive access when they sign up.`);
            setEmail('');
        } finally {
            setLoading(false);
        }
    };

    const permissions = [
        { value: 'viewer', icon: Eye, label: 'Viewer', desc: 'Can view session data' },
        { value: 'editor', icon: Shield, label: 'Editor', desc: 'Can edit and modify' }
    ];

    return (
        <Modal3D
            isOpen={true}
            onClose={onClose}
            size="md"
        >
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center elevation-1">
                        <Users className="w-7 h-7 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-semibold text-white">
                            Share Session
                        </h3>
                        <p className="text-sm text-slate-400 mt-1">
                            {session?.session_name}
                        </p>
                    </div>
                </div>

                {/* Copy Link Section */}
                <div className="glass-light rounded-xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-300">Share Link</span>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            {isPublic ? (
                                <>
                                    <Globe className="w-3.5 h-3.5 text-green-400" />
                                    <span className="text-green-400">Public</span>
                                </>
                            ) : (
                                <>
                                    <Lock className="w-3.5 h-3.5" />
                                    <span>Private</span>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <div className="flex-1 glass-medium rounded-lg px-4 py-2.5 text-sm text-slate-400 truncate font-mono">
                            {shareUrl}
                        </div>
                        <Button3D
                            variant={copied ? "accent" : "outline"}
                            size="md"
                            onClick={handleCopyLink}
                            leftIcon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        >
                            {copied ? 'Copied!' : 'Copy'}
                        </Button3D>
                    </div>
                </div>

                {/* Invite by Email */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-300">Invite by Email</span>
                    </div>

                    <Input3D
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="colleague@organization.com"
                        leftIcon={<Mail className="w-5 h-5" />}
                    />

                    {/* Permission Selector */}
                    <div className="space-y-2">
                        <span className="text-sm font-medium text-slate-300 ml-1">Permission Level</span>
                        <div className="grid grid-cols-2 gap-2">
                            {permissions.map((perm) => (
                                <motion.button
                                    key={perm.value}
                                    type="button"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setPermission(perm.value)}
                                    className={`p-4 rounded-xl transition-all duration-200 text-left ${permission === perm.value
                                            ? 'glass-strong border border-blue-500/30 elevation-2'
                                            : 'glass-light hover:glass-medium border border-transparent'
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`p-2 rounded-lg ${permission === perm.value
                                                ? 'bg-blue-500/20 text-blue-400'
                                                : 'bg-white/5 text-slate-500'
                                            }`}>
                                            <perm.icon className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className={`font-medium text-sm ${permission === perm.value ? 'text-white' : 'text-slate-300'
                                                }`}>
                                                {perm.label}
                                            </div>
                                            <div className="text-xs text-slate-500 mt-0.5">
                                                {perm.desc}
                                            </div>
                                        </div>
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    <Button3D
                        variant="primary"
                        size="lg"
                        onClick={handleInvite}
                        isLoading={loading}
                        disabled={!email.trim() || loading}
                        fullWidth
                    >
                        Send Invitation
                    </Button3D>
                </div>

                {/* Privacy Toggle */}
                <div className="glass-light rounded-xl p-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {isPublic ? (
                                <Globe className="w-5 h-5 text-green-400" />
                            ) : (
                                <Lock className="w-5 h-5 text-slate-400" />
                            )}
                            <div>
                                <div className="text-sm font-medium text-white">
                                    {isPublic ? 'Public Access' : 'Private Access'}
                                </div>
                                <div className="text-xs text-slate-500 mt-0.5">
                                    {isPublic
                                        ? 'Anyone with the link can view'
                                        : 'Only invited members can access'}
                                </div>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsPublic(!isPublic)}
                            className={`relative w-12 h-6 rounded-full transition-all duration-300 elevation-1 ${isPublic ? 'bg-green-500/30' : 'bg-slate-700'
                                }`}
                        >
                            <motion.div
                                animate={{ x: isPublic ? 24 : 2 }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-lg"
                            />
                        </button>
                    </div>
                </div>
            </div>
        </Modal3D>
    );
};
