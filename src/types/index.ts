export type PackageStatus = 
  | 'in_use' 
  | 'recycled' 
  | 'cleaning' 
  | 'cleaned' 
  | 'sterilizing' 
  | 'sterilized' 
  | 'expired' 
  | 'abnormal';

export interface InstrumentPackage {
  id: string;
  barcode: string;
  name: string;
  instruments: string[];
  status: PackageStatus;
  createTime: string;
  sterilizationExpireAt?: string;
  lastUsedAt?: string;
  currentPatient?: string;
  currentChair?: string;
}

export interface CleaningSteps {
  initialWash: boolean;
  enzymeWash: boolean;
  rinse: boolean;
  finalRinse: boolean;
  disinfection: boolean;
  drying: boolean;
}

export interface CleaningParams {
  enzymeConcentration: number;
  washTemperature: number;
  washTime: number;
  disinfectionTemp: number;
  disinfectionTime: number;
}

export interface QualityCheck {
  passed: boolean;
  inspector: string;
  checkTime: string;
  remark?: string;
}

export interface CleaningRecord {
  id: string;
  packageId: string;
  packageBarcode: string;
  packageName: string;
  recycleTime: string;
  patientName: string;
  chairNumber: string;
  steps: CleaningSteps;
  params: CleaningParams;
  qualityCheck: QualityCheck | null;
  operator: string;
  createdAt: string;
}

export type SterilizationMethod = 'pressure_steam' | 'ethylene_oxide' | 'plasma';

export type SterilizationStatus = 'running' | 'completed' | 'released' | 'failed';

export interface SterilizationParams {
  temperature: number;
  pressure: number;
  duration: number;
}

export interface SterilizationBatch {
  id: string;
  batchNo: string;
  sterilizer: string;
  sterilizationMethod: SterilizationMethod;
  params: SterilizationParams;
  startTime: string;
  endTime?: string;
  biologicalTest: 'pending' | 'passed' | 'failed';
  packageIds: string[];
  operator: string;
  releaser1?: string;
  releaser2?: string;
  releaseTime?: string;
  status: SterilizationStatus;
  validDays: number;
}

export type ExceptionType = 'missing' | 'damaged' | 'cleaning_failed' | 'sterilization_failed' | 'other';

export type ExceptionStatus = 'pending' | 'processing' | 'closed';

export interface ExceptionRecord {
  id: string;
  type: ExceptionType;
  relatedPackageId?: string;
  relatedPackageBarcode?: string;
  relatedPackageName?: string;
  relatedBatchId?: string;
  relatedBatchNo?: string;
  description: string;
  reporter: string;
  reportTime: string;
  status: ExceptionStatus;
  handler?: string;
  handleResult?: string;
  handleTime?: string;
}

export interface UsageRecord {
  id: string;
  packageId: string;
  packageBarcode: string;
  packageName: string;
  patientName: string;
  patientId?: string;
  chairNumber: string;
  doctor: string;
  openTime: string;
  usedAt: string;
}

export interface BorrowRecord {
  id: string;
  packageId: string;
  packageBarcode: string;
  packageName: string;
  borrower: string;
  borrowTime: string;
  returnTime?: string;
  status: 'borrowed' | 'returned';
  remark?: string;
}

export interface TraceEvent {
  id: string;
  type: string;
  title: string;
  time: string;
  operator: string;
  details: Record<string, any>;
}

export const STATUS_LABELS: Record<PackageStatus, string> = {
  in_use: '使用中',
  recycled: '已回收',
  cleaning: '清洗中',
  cleaned: '已清洗',
  sterilizing: '灭菌中',
  sterilized: '已灭菌',
  expired: '已过期',
  abnormal: '异常',
};

export const EXCEPTION_TYPE_LABELS: Record<ExceptionType, string> = {
  missing: '缺件',
  damaged: '破损',
  cleaning_failed: '清洗不合格',
  sterilization_failed: '灭菌失败',
  other: '其他',
};

export const STERILIZATION_METHOD_LABELS: Record<SterilizationMethod, string> = {
  pressure_steam: '压力蒸汽',
  ethylene_oxide: '环氧乙烷',
  plasma: '等离子',
};

export const CLEANING_STEP_LABELS: Record<keyof CleaningSteps, string> = {
  initialWash: '初洗',
  enzymeWash: '酶洗',
  rinse: '漂洗',
  finalRinse: '终末漂洗',
  disinfection: '消毒',
  drying: '干燥',
};
