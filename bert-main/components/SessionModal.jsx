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
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                        Description
                    </label>
                    <div className="glass-light rounded-2xl border border-white/5 transition-all duration-300 focus-within:border-aura-violet/50 shadow-inner">
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-3 bg-transparent text-white placeholder:text-slate-600 focus:outline-none resize-none"
                            placeholder="Optional: Add more details about this session..."
                            rows={3}
                        />
                    </div>
                    <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider ml-1">
                        Provide context for your team (optional)
                    </span>
                </div>

                {/* Session Type */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
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
                                    className={`p-4 rounded-xl transition-all duration-500 text-left border ${formData.type === type.value
                                        ? 'aura-gradient-teal text-white shadow-aura-teal border-transparent elevation-2'
                                        : 'glass-light text-slate-400 hover:text-white border-white/5'
                                        }`}
                                >
                                    <div className="font-black text-xs uppercase tracking-tight">{type.label}</div>
                                    <div className="text-[10px] mt-1 opacity-70 font-medium">{type.desc}</div>
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
                <div className="flex items-center justify-between p-4 glass-light rounded-2xl border border-white/5">
                    <div className="flex items-center gap-3">
                        {formData.isPublic ? (
                            <Unlock className="w-5 h-5 text-aura-teal animate-pulse-glow" />
                        ) : (
                            <Lock className="w-5 h-5 text-aura-violet" />
                        )}
                        <div>
                            <div className="text-xs font-black text-white uppercase tracking-wider">
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
                        className={`relative w-12 h-6 rounded-full transition-all duration-500 ${formData.isPublic ? 'aura-gradient-teal shadow-aura-teal' : 'bg-slate-800 border border-white/5'
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
                        className="aura-gradient-teal shadow-aura-teal"
                    >
                        Create Prep-Ai Session
                    </Button3D>
                </div>
            </form>
        </Modal3D>
    );
};
