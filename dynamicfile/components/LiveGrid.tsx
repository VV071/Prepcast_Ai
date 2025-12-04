import React from 'react';
import { ArrowRight, AlertTriangle, Wand2, RefreshCcw } from 'lucide-react';
import { CleanedDataRow } from '../types';
import { STATUS_COLORS } from '../constants';

interface LiveGridProps {
  data: CleanedDataRow[];
}

const LiveGrid: React.FC<LiveGridProps> = ({ data }) => {
  if (data.length === 0) return null;

  // Extract headers from the first row, filtering out internal fields
  const headers = Object.keys(data[0]).filter(k => !k.startsWith('_'));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[400px]">
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/80 backdrop-blur">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <DatabaseIcon className="w-4 h-4 text-primary-500" />
          Live Data Stream
        </h3>
        <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">
          Showing last {data.length} records
        </span>
      </div>

      <div className="overflow-auto flex-1">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-950 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 text-xs font-medium text-slate-400 border-b border-slate-800 w-[100px]">STATUS</th>
              {headers.map(h => (
                <th key={h} className="px-4 py-3 text-xs font-medium text-slate-400 border-b border-slate-800 uppercase">
                  {h.replace(/_/g, ' ')}
                </th>
              ))}
              <th className="px-4 py-3 text-xs font-medium text-slate-400 border-b border-slate-800">NOTES</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {data.map((row) => (
              <tr key={row.id} className="hover:bg-slate-800/30 transition-colors group">
                <td className="px-4 py-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${STATUS_COLORS[row._status] || 'bg-slate-700 text-slate-300'}`}>
                    {row._status}
                  </span>
                </td>
                {headers.map(col => {
                  const isModified = row._originalValues && row._originalValues.hasOwnProperty(col);
                  const originalVal = isModified ? row._originalValues![col] : null;
                  
                  return (
                    <td key={`${row.id}-${col}`} className="px-4 py-2 text-slate-300 font-mono text-xs relative">
                      {isModified ? (
                         <div className="flex flex-col">
                           <span className="text-primary-400 font-bold flex items-center gap-1">
                             {String(row[col])}
                             <Wand2 className="w-3 h-3" />
                           </span>
                           <span className="text-[10px] text-slate-500 line-through decoration-slate-600">
                             {String(originalVal)}
                           </span>
                         </div>
                      ) : (
                        <span className={row._status === 'ANOMALY' ? 'text-red-400 font-bold' : ''}>
                          {row[col] === null ? <span className="text-slate-600 italic">null</span> : String(row[col])}
                        </span>
                      )}
                    </td>
                  );
                })}
                <td className="px-4 py-2">
                  {row._cleaningNotes && row._cleaningNotes.length > 0 && (
                    <div className="flex gap-1 flex-wrap max-w-[200px]">
                      {row._cleaningNotes.map((note, i) => (
                        <span key={i} className="text-[10px] bg-slate-800 text-slate-400 px-1.5 rounded border border-slate-700">
                          {note}
                        </span>
                      ))}
                    </div>
                  )}
                  {row._anomalyScore && row._anomalyScore > 0.5 && (
                    <span className="text-[10px] text-red-500 flex items-center gap-1 mt-1">
                      <AlertTriangle className="w-3 h-3" /> Score: {row._anomalyScore.toFixed(2)}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const DatabaseIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s 9-1.34 9-3V5"></path></svg>
);

export default LiveGrid;