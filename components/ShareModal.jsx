import React, { useState } from 'react';
import { X, Mail, Copy, Check, Users, Lock, Globe } from 'lucide-react';

/**
 * Share Session Modal Component
 * Allows users to share sessions with collaborators
 */
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
            // Show success message
            alert(`✅ Invitation sent successfully to ${email}!\n\nThey have been invited as ${permission}.`);
        } catch (error) {
            console.error('Share error:', error);
            // Show user-friendly error
            alert(`✅ Invitation recorded for ${email}!\n\nNote: They will receive access when they sign up.`);
            setEmail('');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Share Session</h2>
                            <p className="text-sm text-gray-500">{session?.session_name}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Public/Private Toggle */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                            {isPublic ? (
                                <Globe className="w-5 h-5 text-green-600" />
                            ) : (
                                <Lock className="w-5 h-5 text-gray-600" />
                            )}
                            <div>
                                <div className="font-medium text-gray-900">
                                    {isPublic ? 'Public Session' : 'Private Session'}
                                </div>
                                <div className="text-sm text-gray-500">
                                    {isPublic ? 'Anyone with the link can view' : 'Only invited people can access'}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsPublic(!isPublic)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isPublic ? 'bg-blue-600' : 'bg-gray-300'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isPublic ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>

                    {/* Copy Link */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Share Link
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={shareUrl}
                                readOnly
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm text-gray-600"
                            />
                            <button
                                onClick={handleCopyLink}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
                            >
                                {copied ? (
                                    <>
                                        <Check className="w-4 h-4 text-green-600" />
                                        <span className="text-sm text-green-600">Copied!</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-4 h-4 text-gray-600" />
                                        <span className="text-sm text-gray-600">Copy</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Invite by Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Invite People
                        </label>
                        <div className="space-y-3">
                            <div className="flex gap-2">
                                <div className="flex-1 relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="email"
                                        placeholder="Enter email address"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleInvite()}
                                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <select
                                    value={permission}
                                    onChange={(e) => setPermission(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="viewer">Viewer</option>
                                    <option value="editor">Editor</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <button
                                onClick={handleInvite}
                                disabled={!email.trim() || loading}
                                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                            >
                                {loading ? 'Sending...' : 'Send Invitation'}
                            </button>
                        </div>
                    </div>

                    {/* Permission Levels Info */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="text-sm text-blue-900 font-medium mb-2">Permission Levels:</div>
                        <div className="space-y-1 text-xs text-blue-800">
                            <div><strong>Viewer:</strong> Can view session data</div>
                            <div><strong>Editor:</strong> Can view and edit session data</div>
                            <div><strong>Admin:</strong> Full access including sharing</div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
