import React, { useState } from 'react';
import { 
  LayoutGrid, 
  Cloud, 
  Globe, 
  FileText, 
  Database, 
  Play, 
  Loader2, 
  CheckSquare 
} from 'lucide-react';

interface SourceInputProps {
  onStart: (config: { type: string, url: string, name: string, interval: number }) => Promise<void>;
  isLoading: boolean;
}

const SourceInput: React.FC<SourceInputProps> = ({ onStart, isLoading }) => {
  const [sourceType, setSourceType] = useState<'SHEET' | 'API' | 'SCRAPER' | 'UPLOAD'>('SHEET');
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [interval, setInterval] = useState('15'); // Default 15 minutes
  const [isActive, setIsActive] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      // Convert UI interval (minutes) to seconds for the backend
      const intervalSeconds = parseInt(interval) * 60;
      onStart({ 
        type: sourceType === 'UPLOAD' ? 'API' : sourceType, // Map Upload to API for now as per logic
        url, 
        name: name || 'Untitled Source', 
        interval: intervalSeconds 
      });
    }
  };

  const sourceTypeOptions = [
    { id: 'SHEET', label: 'Google Sheets', icon: LayoutGrid },
    { id: 'API', label: 'API Endpoint', icon: Cloud },
    { id: 'SCRAPER', label: 'Web Scraping', icon: Globe },
    { id: 'UPLOAD', label: 'File Upload', icon: FileText },
  ] as const;

  return (
    <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl mb-8 shadow-2xl shadow-black/50 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Database className="w-6 h-6 text-white" />
        <h2 className="text-xl font-bold text-white">Add Data Source</h2>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Source Type Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {sourceTypeOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = sourceType === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setSourceType(option.id)}
                className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all duration-200 cursor-pointer group ${
                  isSelected 
                    ? 'bg-primary-600 border-primary-500 shadow-lg shadow-primary-900/50' 
                    : 'bg-slate-950 border-slate-800 hover:border-slate-600 hover:bg-slate-900'
                }`}
              >
                <Icon className={`w-8 h-8 mb-3 transition-colors ${isSelected ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                <span className={`font-medium ${isSelected ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="space-y-6">
          {/* URL Input */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Source URL
            </label>
            <input
              type="text"
              required
              className="block w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              placeholder={sourceType === 'SHEET' ? "https://docs.google.com/spreadsheets/d/..." : "https://api.example.com/v1/data"}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          {/* Name Input */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Source Name
            </label>
            <input
              type="text"
              className="block w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              placeholder="e.g., COVID-19 Daily Data"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Interval Select */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Auto-Refresh Interval
            </label>
            <div className="relative">
              <select
                value={interval}
                onChange={(e) => setInterval(e.target.value)}
                className="block w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none transition-all cursor-pointer"
              >
                <option value="1">Every 1 Minute (Live Demo)</option>
                <option value="5">Every 5 Minutes</option>
                <option value="15">Every 15 Minutes</option>
                <option value="60">Every 1 Hour</option>
                <option value="1440">Daily</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-500">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
              </div>
            </div>
          </div>
          
          {/* Checkbox */}
          <div className="flex items-center gap-2 pt-2">
             <button 
               type="button"
               onClick={() => setIsActive(!isActive)}
               className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isActive ? 'bg-primary-600 border-primary-600' : 'bg-slate-950 border-slate-600'}`}
             >
               {isActive && <CheckSquare className="w-3.5 h-3.5 text-white" />}
             </button>
             <span className="text-sm text-slate-300">Active (Start monitoring immediately)</span>
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-8">
          <button
            type="submit"
            disabled={isLoading || !url}
            className="w-full flex justify-center items-center gap-2 px-6 py-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-primary-900/20 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
          >
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Play className="w-6 h-6" />}
            {isLoading ? 'Initializing Pipeline...' : 'Start Monitoring'}
          </button>
        </div>
        
        {/* Preset Links for Demo */}
        <div className="mt-6 flex justify-center gap-4 text-xs text-slate-500">
          <span className="opacity-50">Quick Fill:</span>
          <button type="button" onClick={() => { setSourceType('SHEET'); setUrl('https://docs.google.com/spreadsheets/d/covid-data'); setName('COVID-19 Tracker'); }} className="hover:text-primary-400 underline">COVID Sheet</button>
          <button type="button" onClick={() => { setSourceType('API'); setUrl('https://api.weather.gov/stations/KXYZ'); setName('Weather Station API'); }} className="hover:text-primary-400 underline">Weather API</button>
        </div>
      </form>
    </div>
  );
};

export default SourceInput;