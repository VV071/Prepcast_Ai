export enum CleaningDomain {
  HEALTHCARE = 'HEALTHCARE',
  FINANCE = 'FINANCE',
  ECOMMERCE = 'ECOMMERCE',
  HR = 'HR',
  GENERAL = 'GENERAL'
}

export enum AnomalyType {
  OUTLIER = 'OUTLIER',
  FORMAT_ERROR = 'FORMAT_ERROR',
  MISSING_CRITICAL = 'MISSING_CRITICAL',
  NONE = 'NONE'
}

export interface RawDataRow {
  id: string;
  timestamp: string;
  [key: string]: any;
}

export interface CleanedDataRow extends RawDataRow {
  _status: 'CLEAN' | 'IMPUTED' | 'ANOMALY' | 'NORMALIZED';
  _originalValues?: Record<string, any>;
  _anomalyScore?: number;
  _cleaningNotes?: string[];
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'INFO' | 'WARN' | 'SUCCESS' | 'ERROR';
  module: 'DomainDetector' | 'AnomalyDetector' | 'Imputer' | 'TextNormalizer' | 'System';
  message: string;
}

export interface SystemStats {
  totalProcessed: number;
  anomaliesDetected: number;
  valuesImputed: number;
  currentDomain: CleaningDomain;
  lastUpdate: Date;
}

export interface SourceConfig {
  type: 'SHEET' | 'API' | 'SCRAPER';
  url: string;
  name: string;
  frequency: number; // in seconds
  isActive: boolean;
}