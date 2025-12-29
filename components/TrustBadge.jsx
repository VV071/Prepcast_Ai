import React from 'react';
import { ShieldCheck, ShieldAlert, BadgeInfo } from 'lucide-react';
import { motion } from 'framer-motion';

export const TrustBadge = ({ score = 100 }) => {
    let color = 'text-aura-teal';
    let bg = 'bg-aura-teal/5';
    let borderColor = 'border-aura-teal/20';
    let shadow = 'shadow-aura-teal';
    let Icon = ShieldCheck;
    let label = 'Pristine Data';

    if (score < 80) {
        color = 'text-aura-gold';
        bg = 'bg-aura-gold/5';
        borderColor = 'border-aura-gold/20';
        shadow = 'shadow-aura-gold';
        Icon = BadgeInfo;
        label = 'Moderate Alignment';
    }
    if (score < 50) {
        color = 'text-aura-pink';
        bg = 'bg-aura-pink/5';
        borderColor = 'border-aura-pink/20';
        shadow = 'shadow-aura-violet';
        Icon = ShieldAlert;
        label = 'Low Consistency';
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-center gap-4 px-5 py-4 rounded-2xl border ${bg} ${borderColor} ${shadow} backdrop-blur-xl relative overflow-hidden group`}
        >
            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />
            <div className={`p-3 rounded-xl glass-medium border border-white/10 ${color} shadow-inner`}>
                <Icon className="w-7 h-7 animate-pulse-glow" />
            </div>
            <div className="relative z-10">
                <div className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-black">Data Trust Signal</div>
                <div className={`text-2xl font-black ${color} flex items-center gap-2 tracking-tighter`}>
                    {score}%
                    <span className="text-xs font-black uppercase tracking-widest text-slate-500">({label})</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1 font-medium italic">
                    Based on PDAE advanced plausibility logic.
                </div>
            </div>
        </motion.div>
    );
};
