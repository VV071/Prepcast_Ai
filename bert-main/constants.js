export const DOMAIN_INFO = {
    healthcare: {
        icon: 'activity',
        color: 'text-aura-pink bg-aura-pink/5 border-aura-pink/20 shadow-inner',
        description: "Telemetric Pulse: Bio-metric records and clinical indicators analyzed within the crystal matrix.",
        defaultConfig: { missingValueMethod: 'median', outlierThreshold: 2.5 }
    },
    finance: {
        icon: 'credit-card',
        color: 'text-aura-teal bg-aura-teal/5 border-aura-teal/20 shadow-inner',
        description: "Monetary Flux: Transaction streams and fiscal operations processed for telemetric clarity.",
        defaultConfig: { missingValueMethod: 'mean', outlierMethod: 'winsorize', outlierThreshold: 3.0 }
    },
    ecommerce: {
        icon: 'shopping-cart',
        color: 'text-aura-violet bg-aura-violet/5 border-aura-violet/20 shadow-inner',
        description: "Commerce Stream: Product clusters and order iterations verified across the prismatic grid.",
        defaultConfig: { missingValueMethod: 'mean', outlierThreshold: 3.0 }
    },
    hr: {
        icon: 'users',
        color: 'text-aura-gold bg-aura-gold/5 border-aura-gold/20 shadow-inner',
        description: "Human Capital Matrix: Performance telemetrics and neural structures mapped and verified.",
        defaultConfig: { missingValueMethod: 'median', outlierMethod: 'zscore' }
    },
    general: {
        icon: 'file-text',
        color: 'text-slate-400 bg-white/5 border-white/10 shadow-inner',
        description: "General Clusters: Uncategorized data structures maintained within the scribe matrix.",
        defaultConfig: { missingValueMethod: 'mean', outlierThreshold: 1.5 }
    }
};

export const STEPS = [
    { title: 'Data Upload', icon: 'upload' },
    { title: 'Schema Mapping', icon: 'database' },
    { title: 'Data Cleaning', icon: 'refresh-cw' },
    { title: 'Live Edit Mode', icon: 'edit-3' },
    { title: 'Weight Application', icon: 'target' },
    { title: 'Report Generation', icon: 'file-text' }
];
