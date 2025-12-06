import React, { useState } from 'react';
import { Modal3D } from './3D/Modal3D';
import { Input3D } from './3D/Input3D';
import { Button3D } from './3D/Button3D';
import { FileText, Tag, Lock, Unlock } from 'lucide-react';

export const SessionModal = ({ onClose, onCreate }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        type: 'survey',
        tags: '',
        isPublic: false
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            alert('Please enter a session name');
            return;
        }
        onCreate(formData);
    };

    return (
        <Modal3D
            isOpen={true}
            onClose={onClose}
            title="Create New Session"
            size="md"
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Session Name */}
                <Input3D
                    label="Session Name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Monthly Survey Data - Nov 2024"
                    leftIcon={<FileText className="w-5 h-5" />}
                    helperText="Give your session a descriptive name"
                    required
                />

                {/* Description */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-300 ml-1">
                        Description
                    </label>
                    <div className="glass-light rounded-xl elevation-1 transition-all duration-300 focus-within:elevation-2 focus-within:border-blue-500/50">
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-3 bg-transparent text-white placeholder:text-slate-600 focus:outline-none resize-none"
                            placeholder="Optional: Add more details about this session..."
                            rows={3}
                        />
                    </div>
                    <span className="text-xs text-slate-500 ml-1">
                        Provide context for your team (optional)
                    </span>
                </div>

                {/* Session Type */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-300 ml-1">
                        Session Type
                    </label>
                    <div className="glass-light rounded-xl p-1">
                        <div className="grid grid-cols-2 gap-1">
                            {[
                                { value: 'survey', label: 'Survey Data', desc: 'Process survey responses' },
                                { value: 'dynamic', label: 'Dynamic File', desc: 'Real-time data processing' }
                            ].map((type) => (
                                <button
                                    key={type.value}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: type.value })}
                                    className={`p-3 rounded-lg transition-all duration-200 text-left ${formData.type === type.value
                                            ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 elevation-1'
                                            : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                                        }`}
                                >
                                    <div className="font-medium text-sm">{type.label}</div>
                                    <div className="text-xs mt-0.5 opacity-70">{type.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Tags */}
                <Input3D
                    label="Tags"
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="e.g., Q4, customer-feedback, urgent"
                    leftIcon={<Tag className="w-5 h-5" />}
                    helperText="Comma-separated tags for organization"
                />

                {/* Privacy Toggle */}
                <div className="flex items-center justify-between p-4 glass-light rounded-xl">
                    <div className="flex items-center gap-3">
                        {formData.isPublic ? (
                            <Unlock className="w-5 h-5 text-green-400" />
                        ) : (
                            <Lock className="w-5 h-5 text-slate-400" />
                        )}
                        <div>
                            <div className="text-sm font-medium text-white">
                                {formData.isPublic ? 'Public Session' : 'Private Session'}
                            </div>
                            <div className="text-xs text-slate-500">
                                {formData.isPublic
                                    ? 'Visible to all team members'
                                    : 'Only you can access this session'}
                            </div>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setFormData({ ...formData, isPublic: !formData.isPublic })}
                        className={`relative w-12 h-6 rounded-full transition-all duration-300 ${formData.isPublic ? 'bg-green-500/30' : 'bg-slate-700'
                            }`}
                    >
                        <div
                            className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-lg transition-all duration-300 ${formData.isPublic ? 'left-6' : 'left-0.5'
                                }`}
                        />
                    </button>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                    <Button3D
                        type="button"
                        variant="ghost"
                        size="lg"
                        onClick={onClose}
                        fullWidth
                    >
                        Cancel
                    </Button3D>
                    <Button3D
                        type="submit"
                        variant="primary"
                        size="lg"
                        fullWidth
                    >
                        Create Session
                    </Button3D>
                </div>
            </form>
        </Modal3D>
    );
};
