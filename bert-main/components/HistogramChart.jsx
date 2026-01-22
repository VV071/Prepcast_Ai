import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export const HistogramChart = ({
    histogramData,
    title,
    color = "#3b82f6",
    showLabel = true
}) => {
    if (!histogramData || !histogramData.bins) {
        return (
            <div className="flex items-center justify-center h-64 text-slate-400">
                No data available for histogram
            </div>
        );
    }

    const { bins } = histogramData;

    // Format data for Recharts
    const chartData = bins.map(bin => ({
        range: bin.range,
        count: bin.count,
        frequency: (bin.frequency * 100).toFixed(1) + '%'
    }));

    return (
        <div className="space-y-2">
            {showLabel && (
                <div className="text-center font-medium text-slate-200 text-sm">
                    {title}
                </div>
            )}
            <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(148, 163, 184, 0.1)"
                        vertical={false}
                    />
                    <XAxis
                        dataKey="range"
                        stroke="#94a3b8"
                        fontSize={11}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                    />
                    <YAxis
                        stroke="#94a3b8"
                        fontSize={11}
                        label={{
                            value: 'Frequency',
                            angle: -90,
                            position: 'insideLeft',
                            style: { fill: '#94a3b8', fontSize: 11 }
                        }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'rgba(15, 23, 42, 0.95)',
                            border: '1px solid rgba(148, 163, 184, 0.2)',
                            borderRadius: '8px',
                            fontSize: '12px',
                            color: '#e2e8f0'
                        }}
                        cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={color} fillOpacity={0.9} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};
