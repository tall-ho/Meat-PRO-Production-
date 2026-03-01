
// ---------------------------------------------------------
// การตั้งค่าการเชื่อมต่อ (CONNECTION CONFIG)
// ---------------------------------------------------------

// URL ของ Master Registry (สมุดโทรศัพท์)
// ⚠️ ผมใส่ URL ที่คุณให้มาเรียบร้อยแล้วครับ ใช้งานได้เลย
export const MASTER_REGISTRY_URL = 'https://script.google.com/macros/s/AKfycbz7MwtLM9MZB8SeT-QI5dnI1W0GsdmNfef0RH6nx2Y0Gux1ZsZS2Zb_FbEJgo7HarVe/exec'; 

export const STORAGE_KEYS = {
  API_URL: 'meatpro_api_url',
  ORG_NAME: 'meatpro_org_name',
  LICENSE_KEY: 'meatpro_license_key',
  USER_DATA: 'meatpro_user_data'
};

export const SHEET_NAMES = {
  USERS: 'Users',
  MASTER_ITEMS: 'MasterItems',
  PRODUCTION_PLAN: 'ProductionPlan',
  EQUIPMENT: 'Equipment', 
  MATRIX: 'ProductMatrix',
  PRODUCTION_STANDARDS: 'ProductionStandards',
  PLAN_FROM_PLANNING: 'PlanFromPlanning', 
  DAILY_PRODUCTION_PLAN: 'DailyProductionPlan',
  PRODUCTION_TRACKING: 'ProductionTracking',
  MIXING_EXECUTION: 'MixingExecution',
  DAILY_PROBLEMS: 'DailyProblems', // New: สำหรับ Unplanned Jobs / Variance Board
  SETTINGS: 'Settings',
  ACTIVITY_LOG: 'ActivityLog'
};

export const DEV_LICENSE_KEY = 'DEV-MODE-ACCESS';
export const DEMO_LICENSE_KEY = 'DEMO-CLIENT-TEST';

// การตั้งค่า Developer Default (Superuser)
export const DEV_CONFIG = {
  'tallintelligence.dcc@gmail.com': {
    name: 'T-DCC Developer',
    position: 'Lead Developer',
    avatar: 'https://lh3.googleusercontent.com/d/1Z_fRbN9S4aA7OkHb3mlim_t60wIT4huY' 
  },
  'tallintelligence.ho@gmail.com': {
    name: 'T-HO Developer',
    position: 'Senior Developer',
    avatar: 'https://lh3.googleusercontent.com/d/1H_HIcz3rovDJJBszvPSUoMh2rDayOnmQ'
  }
};

export const SYSTEM_MODULES = [
    { id: 'home', label: 'HOME', icon: 'home' },
    { id: 'planning', label: 'PLANNING', icon: 'calendar-clock', 
      subItems: [ { id: 'plan_fr_planning', label: 'PLAN FR PLANNING' }, { id: 'plan_by_prod', label: 'PLAN BY PRODUCTION' } ] },
    { id: 'daily_board', label: 'DAILY BOARD', icon: 'clipboard-list',
        subItems: [ { id: 'prod_tracking', label: 'PRODUCTION TRACKING' }, { id: 'mixing_plan', label: 'MIXING PLAN' }, { id: 'packing_plan', label: 'PACKING PLAN' } ] },
    { id: 'daily_problem', label: 'DAILY PROBLEM', icon: 'alert-triangle',
        subItems: [ { id: 'unplanned_jobs', label: 'UNPLANNED JOBS' }, { id: 'machine_breakdown', label: 'MACHINE BREAKDOWN' } ] },
    { id: 'process', label: 'PROCESS', icon: 'factory',
        subItems: [ { id: 'premix', label: 'PREMIX' }, { id: 'mixing', label: 'MIXING' }, { id: 'forming', label: 'FORMING' }, { id: 'cooking', label: 'COOKING' }, { id: 'cooling', label: 'COOLING' }, { id: 'cut_peel', label: 'CUT & PEEL' }, { id: 'packing', label: 'PACKING' } ] },
    { id: 'prod_config', label: 'PROD CONFIG', icon: 'settings-2',
        subItems: [ 
            { id: 'master_items', label: 'MASTER ITEM' }, 
            { id: 'production_standards', label: 'STD PROCESS' },
            { id: 'product_matrix', label: 'PRODUCT MATRIX' },
            { id: 'equipment', label: 'EQUIPMENT' } 
        ] 
    },
    { id: 'setting', label: 'SETTING', icon: 'user-cog',
        subItems: [ { id: 'user_setting', label: 'USER SETTING' } ] }
];
