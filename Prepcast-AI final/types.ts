export type DataRow = Record<string, string | number | null>;

export interface ColumnInfo {
  name: string;
  type: 'string' | 'number' | 'date' | 'unknown';
  missingCount: number;
}

export interface ProcessingLog {
  id: number;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  timestamp: string;
}

export interface CleaningConfig {
  missingValueMethod: 'mean' | 'median' | 'knn' | 'multiple';
  outlierMethod: 'iqr' | 'zscore' | 'winsorize';
  outlierThreshold: number;
  enableRuleValidation: boolean;
}

export interface WeightConfig {
  weightColumn: string;
  designWeights: boolean;
  computeMarginOfError: boolean;
}

export interface StatisticalSummary {
  mean: number;
  standardError: number;
  marginOfError: number;
  sampleSize: number;
}

export type DomainType = 'healthcare' | 'finance' | 'ecommerce' | 'hr' | 'general';

export interface AppState {
  currentStep: number;
  rawData: DataRow[];
  processedData: DataRow[];
  columns: string[];
  cleaningConfig: CleaningConfig;
  weightConfig: WeightConfig;
  processingLogs: ProcessingLog[];
  statistics: Record<string, StatisticalSummary>;
  isProcessing: boolean;
  detectedDomain: DomainType;
  fileName: string;
  changedCells: Map<string, { row: number; col: string; oldValue: any; newValue: any }>;
}
