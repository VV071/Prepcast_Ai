// Mock initial data to populate the grid before "live" data comes in
export const INITIAL_MOCK_DATA = [
    { id: '101', timestamp: '2023-10-27T10:00:00Z', patient_id: 'P-992', heart_rate: 72, temp: 98.6, city: 'New York' },
    { id: '102', timestamp: '2023-10-27T10:05:00Z', patient_id: 'P-881', heart_rate: null, temp: 99.1, city: 'NYC' }, // Missing HR
    { id: '103', timestamp: '2023-10-27T10:10:00Z', patient_id: 'P-774', heart_rate: 180, temp: 104.2, city: 'N.Y.' }, // Anomaly
];

export const DOMAIN_COLORS = {
    HEALTHCARE: '#10b981', // Emerald
    FINANCE: '#f59e0b', // Amber
    ECOMMERCE: '#8b5cf6', // Violet
    HR: '#ec4899', // Pink
    GENERAL: '#64748b' // Slate
};

export const STATUS_COLORS = {
    CLEAN: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    IMPUTED: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    ANOMALY: 'bg-red-500/10 text-red-500 border-red-500/20',
    NORMALIZED: 'bg-purple-500/10 text-purple-500 border-purple-500/20'
};
