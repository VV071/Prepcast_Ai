import React, { useState, useEffect } from 'react';
import { Upload, Download, FileText, CheckCircle, AlertCircle, BarChart2 } from 'lucide-react';
import { Card3D } from './3D/Card3D';
import { Button3D } from './3D/Button3D';
import { motion } from 'framer-motion';
import { WavyBarLoaderSmall } from './WavyBarLoader';

export const SessionFileHandler = ({ session, user, onUpdate }) => {
    const [uploading, setUploading] = useState(false);
    const [downloadUrls, setDownloadUrls] = useState({});
    const [loadingUrls, setLoadingUrls] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (session) {
            loadDownloadUrls();
        }
    }, [session]);

    const loadDownloadUrls = async () => {
        setLoadingUrls(true);
        try {
            // Generate download URLs for files if they exist
            const urls = {};

            if (session.raw_file_path) {
                // In a real implementation, you would generate signed URLs here
                urls.raw = session.raw_file_path;
            }

            if (session.cleaned_file_path) {
                urls.cleaned = session.cleaned_file_path;
            }

            if (session.report_file_path) {
                urls.report = session.report_file_path;
            }

            setDownloadUrls(urls);
        } catch (err) {
            console.error("Failed to load download URLs:", err);
        } finally {
            setLoadingUrls(false);
        }
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setUploading(true);
        setError(null);

        try {
            // In a real implementation, you would upload the file here
            // For now, we'll just simulate the upload
            console.log('Uploading file:', file.name);

            // Simulate upload delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            if (onUpdate) {
                onUpdate({ ...session, raw_file_path: file.name });
            }

            // Refresh URLs
            loadDownloadUrls();
        } catch (err) {
            console.error("Upload failed:", err);
            setError(err.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    if (!session) return null;

    return (
        <Card3D
            elevation={2}
            glassType="medium"
            padding="lg"
            className="w-full"
        >
            <div className="flex items-center gap-2 mb-6">
                <FileText className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-bold text-white">Session Files</h3>
            </div>

            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg flex items-center text-sm"
                >
                    <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                    {error}
                </motion.div>
            )}

            <div className="space-y-3">
                {/* 1. RAW FILE */}
                <div className="flex items-center justify-between p-4 glass-light rounded-xl border border-white/5 hover:border-white/10 transition-all">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${session.raw_file_path
                            ? 'bg-slate-500/20 text-slate-300'
                            : 'bg-white/5 text-slate-600'
                            }`}>
                            <FileText className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="font-medium text-white text-sm">Raw Data File</p>
                            <p className="text-xs text-slate-500">
                                {session.raw_file_path ? 'Uploaded' : 'Not uploaded yet'}
                            </p>
                        </div>
                    </div>

                    <div>
                        {session.raw_file_path ? (
                            <Button3D
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(downloadUrls.raw, '_blank')}
                                disabled={!downloadUrls.raw}
                                leftIcon={<Download className="w-4 h-4" />}
                            >
                                Download
                            </Button3D>
                        ) : (
                            <label>
                                <Button3D
                                    variant="primary"
                                    size="sm"
                                    disabled={uploading}
                                    leftIcon={uploading ? <WavyBarLoaderSmall activeColor="#ffffff" inactiveColor="rgba(255, 255, 255, 0.3)" className="scale-75" /> : <Upload className="w-4 h-4" />}
                                    as="div"
                                >
                                    {uploading ? 'Uploading...' : 'Upload'}
                                </Button3D>
                                <input
                                    type="file"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                    disabled={uploading}
                                    accept=".csv,.xlsx,.xls"
                                />
                            </label>
                        )}
                    </div>
                </div>

                {/* 2. CLEANED FILE */}
                <div className="flex items-center justify-between p-4 glass-light rounded-xl border border-white/5 hover:border-white/10 transition-all">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${session.cleaned_file_path || session.processed_data
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-white/5 text-slate-600'
                            }`}>
                            <CheckCircle className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="font-medium text-white text-sm">Cleaned Data</p>
                            <p className="text-xs text-slate-500">
                                {session.cleaned_file_path || session.processed_data ? 'Ready' : 'Pending processing'}
                            </p>
                        </div>
                    </div>

                    <div>
                        {session.cleaned_file_path || session.processed_data ? (
                            <Button3D
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(downloadUrls.cleaned, '_blank')}
                                disabled={!downloadUrls.cleaned}
                                leftIcon={<Download className="w-4 h-4" />}
                            >
                                Download
                            </Button3D>
                        ) : (
                            <span className="text-xs text-slate-500 italic">Processing...</span>
                        )}
                    </div>
                </div>

                {/* 3. REPORT FILE */}
                <div className="flex items-center justify-between p-4 glass-light rounded-xl border border-white/5 hover:border-white/10 transition-all">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${session.report_file_path || session.statistics
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-white/5 text-slate-600'
                            }`}>
                            <BarChart2 className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="font-medium text-white text-sm">Final Report</p>
                            <p className="text-xs text-slate-500">
                                {session.report_file_path || session.statistics ? 'Ready' : 'Pending analysis'}
                            </p>
                        </div>
                    </div>

                    <div>
                        {session.report_file_path || session.statistics ? (
                            <Button3D
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(downloadUrls.report, '_blank')}
                                disabled={!downloadUrls.report}
                                leftIcon={<Download className="w-4 h-4" />}
                            >
                                Download
                            </Button3D>
                        ) : (
                            <span className="text-xs text-slate-500 italic">Pending...</span>
                        )}
                    </div>
                </div>
            </div>
        </Card3D>
    );
};
