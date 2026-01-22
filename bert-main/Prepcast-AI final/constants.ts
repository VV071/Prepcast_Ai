import { DomainType, CleaningConfig } from './types';

export const DOMAIN_INFO: Record<DomainType, { 
  icon: string; 
  color: string; 
  description: string;
  defaultConfig: Partial<CleaningConfig>;
}> = {
  healthcare: {
    icon: 'activity',
    color: 'text-red-600 bg-red-50 border-red-200',
    description: "Healthcare data typically includes patient records, medical measurements, and clinical indicators.",
    defaultConfig: { missingValueMethod: 'median', outlierThreshold: 2.5 }
  },
  finance: {
    icon: 'credit-card',
    color: 'text-green-600 bg-green-50 border-green-200',
    description: "Financial data encompasses transactions, revenues, costs, and monetary operations.",
    defaultConfig: { missingValueMethod: 'mean', outlierMethod: 'winsorize', outlierThreshold: 3.0 }
  },
  ecommerce: {
    icon: 'shopping-cart',
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    description: "E-commerce data includes product information, orders, and transaction details.",
    defaultConfig: { missingValueMethod: 'mean', outlierThreshold: 3.0 }
  },
  hr: {
    icon: 'users',
    color: 'text-purple-600 bg-purple-50 border-purple-200',
    description: "HR data covers employee info, salaries, performance metrics, and structure.",
    defaultConfig: { missingValueMethod: 'median', outlierMethod: 'zscore' }
  },
  general: {
    icon: 'file-text',
    color: 'text-gray-600 bg-gray-50 border-gray-200',
    description: "General data that doesn't fit into specific domains.",
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
