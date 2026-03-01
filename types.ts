export interface User {
  id: string;
  name: string;
  email: string;
  position: string;
  avatar?: string;
  isDev?: boolean;
  permissions?: Record<string, number[]>; // JSON stringified in Sheet
}

export interface MasterItem {
  sku: string; 
  name: string;
  category: string;
  brand: string;
  weight: number;
  pieces: number;
  status: string;
  updated: string;
  id?: string;
  unit?: string;
  price?: number;
}

export interface EquipmentItem {
  id: string;
  name: string;
  step: string;
  qty: number;
  note: string;
}

// Production Standards Types
export interface ProcessStandard {
  id: number;
  [key: string]: any;
}

export interface ProductionStandard {
  id: string;
  name: string;
  category: string;
  rawWeightPerBatch: number;
  yieldPercent: number;
  status: string;
  updateDate: string;
  specPiecesPerKg?: number;
  pieceWeightG?: number;
  mixingStandards: ProcessStandard[];
  formingStandards: ProcessStandard[];
  cookingStandards: ProcessStandard[];
  coolingStandards: ProcessStandard[];
  peelingStandards: ProcessStandard[];
  cuttingStandards: ProcessStandard[];
  packingStandards: ProcessStandard[];
  packVariants: ProcessStandard[];
}

// Product Matrix Types
export interface BatterConfig {
  id: string;
  ratio: number;
}

export interface MappedFG {
  sku: string;
  name: string;
  brand: string;
  weight: number;
  pieces: number;
}

export interface ProductMatrixItem {
  id: string; // SFG Code
  name: string; // SFG Name
  batterConfig: BatterConfig[];
  fgs: MappedFG[];
}

export interface ProductionOrder {
  id: string;
  date: string;
  itemName: string;
  quantity: number;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
  assignedTo: string;
}

export interface PlanItem {
  id: number | string;
  planId: string;
  type: string;
  shift: string;
  time: string;
  sku: string;
  qty: number;
  fgName: string;
  status: string;
}

export interface ProductionTrackingItem {
  id: string;
  sku: string;
  client: string;
  totalBatches: number;
  stages: {
    mixing: number;
    forming: number;
    steaming: number;
    cooling: number;
    cutting: number;
    packing: number;
    warehouse: number;
  };
  stageUpdates: {
    [key: string]: string;
  };
  status: 'Pending' | 'In Progress' | 'Completed';
  lastUpdated?: string;
}

export interface MixingBatch {
    id: string;
    jobId: string;
    name: string;
    step: string;
    status: 'Waiting' | 'Processing' | 'Completed';
    timeLeft: number;
    startTime: string;
    setNo: number;
}

export type ViewState = 'dashboard' | 'production' | 'inventory' | 'users' | 'settings' | string;
