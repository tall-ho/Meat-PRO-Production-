
import React, { useState, useEffect, useRef } from 'react';
import * as LucideIcons from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import { ConnectionScreen } from './components/ConnectionScreen';
import { ProductionPlan } from './components/ProductionPlan';
import { MasterItems } from './components/MasterItems';
import { ProductItemsConfig } from './components/ProductItemsConfig';
import { EquipmentConfig } from './components/EquipmentConfig';
import { PermissionMatrix } from './components/PermissionMatrix';
import { ProductionStandards } from './components/ProductionStandards';
import { ProductMatrix } from './components/ProductMatrix';
import { PlanFromPlanning } from './components/PlanFromPlanning';
import { DailyProductionPlan } from './components/DailyProductionPlan';
import { ProductionTracking } from './components/ProductionTracking';
import { MixingPlan } from './components/MixingPlan';
import { UnplannedJobs } from './components/UnplannedJobs';
import { MachineBreakdown } from './components/MachineBreakdown';
import { STORAGE_KEYS, SYSTEM_MODULES, DEV_CONFIG, SHEET_NAMES } from './constants';

const PALETTE = { glassWhite: 'rgba(239, 235, 206, 0.85)', bgGradientStart: '#F2F4F6', bgGradientEnd: '#E6E1DB' };
const ADMIN_EMAILS = Object.keys(DEV_CONFIG);
const MOCK_DATA = {
    stats: [
        { label: 'Daily Output', value: '2.4 Tons', sub: 'Sausage & Meatball', icon: 'package-check', color: '#C22D2E' },
        { label: 'Pending Orders', value: '฿ 4.2M', sub: 'Hypermarkets & Wholesale', icon: 'shopping-cart', color: '#D8A48F' },
        { label: 'Ingredients', value: 'Fresh', sub: 'Meat & Spices Safe', icon: 'snowflake', color: '#537E72' },
        { label: 'Hygiene Score', value: '99.8%', sub: 'Halal Certified', icon: 'shield-check', color: '#55738D' },
    ],
    production: [
        { id: 'LOT-2401', item: 'Chicken Sausage (Smoked)', stage: 'COOKING', progress: 75, status: 'Active', icon: 'flame', color: '#D8A48F' }, 
        { id: 'LOT-2402', item: 'Beef Burger Patties (Premium)', stage: 'MIXING', progress: 30, status: 'Production', icon: 'beef', color: '#C22D2E' }, 
        { id: 'LOT-2403', item: 'Bologna Chili Grade A', stage: 'PACKING', progress: 95, status: 'QC Check', icon: 'package', color: '#537E72' }, 
        { id: 'LOT-2404', item: 'Fish Balls (Classic)', stage: 'FORMING', progress: 50, status: 'Active', icon: 'waves', color: '#55738D' }, 
    ],
};

const LucideIcon = ({ name, size = 16, className = "", style, strokeWidth = 2 }: any) => {
    const iconName = name.split('-').map((part: string) => part.charAt(0).toUpperCase() + part.slice(1)).join('');
    const IconComponent = (LucideIcons as any)[iconName] || (LucideIcons as any)[name] || LucideIcons.HelpCircle;
    return <IconComponent size={size} className={className} style={style} strokeWidth={strokeWidth} />;
};

const KPICard = ({ title, val, color, icon, desc }: any) => (
    <div className="bg-white/60 backdrop-blur-md rounded-2xl p-6 shadow-soft hover:shadow-lg transition-all duration-500 border border-white/50 relative overflow-hidden group h-full hover:-translate-y-1">
        <div className="absolute -right-8 -bottom-8 opacity-[0.08] transform rotate-[15deg] group-hover:scale-110 group-hover:opacity-[0.15] group-hover:rotate-[5deg] transition-all duration-700 pointer-events-none z-0">
            <LucideIcon name={icon} size={140} style={{color: color}} strokeWidth={1.5} />
        </div>
        <div className="relative z-10 flex justify-between items-start">
            <div className="flex-1 min-w-0 flex flex-col gap-1">
                <p className="text-[10px] font-bold text-[#737597] uppercase tracking-widest font-mono opacity-90 truncate" title={title}>{title}</p>
                <div className="flex items-baseline gap-2 mt-1">
                    <h4 className="text-3xl font-black tracking-tight font-mono leading-tight truncate drop-shadow-sm" style={{color: color}}>{val}</h4>
                </div>
                {desc && <p className="text-[10px] text-[#55738D] font-medium font-mono mt-2 flex items-center gap-1.5 truncate"><span className="w-2 h-2 rounded-sm" style={{backgroundColor: color}}></span>{desc}</p>}
            </div>
            <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0 shadow-sm border border-white/80 group-hover:shadow-md transition-all duration-300 bg-gradient-to-br from-white/80 to-transparent" style={{backgroundColor: color + '40'}}>
                <LucideIcon name={icon} size={24} style={{color: color}} strokeWidth={2.5} />
            </div>
        </div>
    </div>
);

const GlassCard = ({ children, className = '', hoverEffect = true }: any) => (
    <div className={`rounded-3xl p-6 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/40 ${hoverEffect ? 'hover:-translate-y-1 transition-transform duration-300' : ''} ${className}`} style={{ backgroundColor: PALETTE.glassWhite }}>{children}</div>
);

const NavItem = ({ icon, label, active, onClick, isOpen, subItems, isExpanded, onToggleExpand }: any) => {
    const hasSubItems = subItems && subItems.length > 0;
    const isDirectActive = active && !hasSubItems;
    const isParentActive = active && hasSubItems;
    return (
        <div className="mb-2">
            <button onClick={hasSubItems ? onToggleExpand : onClick} className={`w-full flex items-center px-4 py-3 transition-all duration-500 group relative rounded-xl mx-auto overflow-hidden ${isDirectActive ? 'text-white bg-gradient-to-r from-[#A91B18] via-[#96291C] to-[#A91B18] shadow-[0_0_20px_rgba(217,74,61,0.6)] border border-[#FF8A80]/50' : isParentActive ? 'text-[#C22D2E] bg-[#C22D2E]/10 border border-[#C22D2E]/20' : 'text-[#737597] hover:text-[#C22D2E] hover:bg-gradient-to-r hover:from-[#C22D2E]/10 hover:to-transparent hover:border hover:border-[#C22D2E]/30'} ${!isOpen ? 'justify-center w-12 px-0' : 'w-[90%]'}`}>
                <div className={`absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent z-0 pointer-events-none ${isDirectActive ? 'animate-shimmer' : 'group-hover:animate-shimmer'}`} />
                <LucideIcon name={icon} size={22} strokeWidth={isDirectActive || isParentActive ? 2.5 : 2} className={`relative z-10 transition-transform duration-300 ${isDirectActive ? 'scale-110 text-white' : ''} ${isParentActive ? 'text-[#C22D2E]' : ''} ${!isDirectActive && !isParentActive ? 'group-hover:scale-110 group-hover:text-[#C22D2E]' : ''}`} />
                <div className={`relative z-10 overflow-hidden transition-all duration-300 ease-in-out flex items-center justify-between flex-1 ${isOpen ? 'w-auto opacity-100 ml-3' : 'w-0 opacity-0 ml-0'}`}>
                    <span className={`text-sm tracking-wide uppercase ${isDirectActive || isParentActive ? 'font-bold' : 'font-medium group-hover:font-semibold'}`}>{label}</span>
                    {hasSubItems && <LucideIcon name="chevron-down" size={14} className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />}
                </div>
                {isDirectActive && isOpen && <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
            </button>
            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isExpanded && isOpen ? 'max-h-[500px] opacity-100 mt-2 pl-4' : 'max-h-0 opacity-0'}`}>
                <div className="border-l border-[#C22D2E]/20 pl-2 space-y-1">
                {hasSubItems && subItems.map((sub: any, idx: number) => (
                    <button key={idx} onClick={(e) => { e.stopPropagation(); sub.onClick(); }} className={`w-full flex items-center px-4 py-2 rounded-lg transition-all duration-300 text-xs font-medium uppercase relative overflow-hidden group/sub ${sub.active ? 'text-white bg-gradient-to-r from-[#A91B18] via-[#96291C] to-[#A91B18] shadow-[0_0_15px_rgba(217,74,61,0.4)] border border-[#FF8A80]/50 font-bold' : 'text-[#737597] hover:text-[#C22D2E] hover:bg-[#C22D2E]/5'}`}>
                        <div className="absolute inset-0 -translate-x-full group-hover/sub:animate-shimmer bg-gradient-to-r from-transparent via-white/5 to-transparent z-0 pointer-events-none" />
                        <span className={`w-1.5 h-1.5 rounded-full bg-current mr-2 relative z-10 transition-all duration-300 ${sub.active ? 'opacity-100 shadow-[0_0_5px_currentColor] bg-white' : 'opacity-50 group-hover/sub:opacity-100 group-hover/sub:shadow-[0_0_5px_#C22D2E]'}`}></span>
                        <span className="relative z-10">{sub.label}</span>
                    </button>
                ))}
                </div>
            </div>
        </div>
    );
};

const DashboardView = ({ user }: any) => (
    <div className="space-y-6 animate-fadeIn pb-8 px-8">
        <div className="flex justify-between items-center mb-2">
            <div>
                <h1 className="text-3xl font-bold text-[#2E395F] uppercase">SAWASDEE, {user?.name || 'GUEST'}!</h1>
                <p className="text-[#55738D] text-sm">Real-time monitoring & Control • Status: <span className="text-[#537E72] font-bold">Line A-B Running</span></p>
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {MOCK_DATA.stats.map((stat, idx) => (
                <KPICard key={idx} title={stat.label} val={stat.value} color={stat.color} icon={stat.icon} desc={stat.sub} />
            ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <GlassCard className="lg:col-span-2 relative overflow-hidden group bg-gradient-to-br from-white via-[#F8FAFC] to-[#55738D]/10 border-[#55738D]/20">
                    <div className="absolute -bottom-10 -right-10 text-[#55738D] opacity-[0.08] transform -rotate-12 pointer-events-none group-hover:scale-110 group-hover:rotate-6 transition-all duration-700">
                    <LucideIcon name="chef-hat" size={240} />
                </div>
                <div className="flex justify-between items-center mb-6 relative z-10">
                    <h2 className="text-xl font-bold text-[#2E395F] flex items-center gap-2 uppercase">
                        <div className="p-2 bg-[#55738D]/10 rounded-lg text-[#55738D]"><LucideIcon name="chef-hat" size={20} /></div> Live Processing Floor
                    </h2>
                    <span className="text-xs text-[#55738D] font-bold bg-white/60 px-3 py-1 rounded-full border border-[#55738D]/20 shadow-sm flex items-center gap-2"><span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#55738D] opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-[#55738D]"></span></span>Line A, B Active</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                    {MOCK_DATA.production.slice(0, 3).map((job, idx) => (
                        <div key={idx} className="p-4 bg-white/70 backdrop-blur-sm rounded-2xl border border-white/60 hover:bg-white hover:shadow-lg transition-all text-center group/item">
                            <div className="relative inline-block mb-3">
                                <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 shadow-sm mx-auto p-0.5 bg-white flex items-center justify-center group-hover/item:scale-110 transition-transform duration-300" style={{ borderColor: `${job.color}40` }}><LucideIcon name="activity" size={32} style={{ color: job.color }} /></div>
                                <div className="absolute -bottom-1 -right-1 text-white p-1 rounded-lg border-2 border-white shadow-sm" style={{ backgroundColor: job.color }}><LucideIcon name="activity" size={10} /></div>
                            </div>
                            <h4 className="text-sm font-bold text-[#2E395F] truncate w-full">{job.item}</h4>
                            <p className="text-[10px] font-bold mt-1 uppercase tracking-tight" style={{ color: job.color }}>{job.stage}</p>
                            <p className="text-[9px] text-[#737597] mt-0.5 font-mono">{job.id}</p>
                            <div className="mt-3 pt-2 border-t border-gray-100 flex justify-between items-center px-1"><div className="w-full bg-gray-200/50 rounded-full h-1.5 mr-2 overflow-hidden"><div className="h-1.5 rounded-full" style={{width: `${job.progress}%`, backgroundColor: job.color}}></div></div><span className="text-[9px] font-bold" style={{ color: job.color }}>{job.progress}%</span></div>
                        </div>
                    ))}
                </div>
            </GlassCard>
            <GlassCard className="bg-gradient-to-b from-white via-[#FFF5F5] to-[#C22D2E]/10 border-[#C22D2E]/20 relative overflow-hidden group">
                <div className="absolute -bottom-8 -right-8 text-[#C22D2E] opacity-[0.08] transform -rotate-12 pointer-events-none group-hover:scale-110 group-hover:rotate-0 transition-transform duration-700"><LucideIcon name="bell" size={140} /></div>
                <h2 className="text-xl font-bold text-[#2E395F] mb-4 flex items-center gap-2 uppercase relative z-10"><div className="p-2 bg-[#C22D2E]/10 rounded-lg text-[#C22D2E] animate-pulse"><LucideIcon name="alert-triangle" size={20} /></div> PRODUCTION ALERT</h2>
                <div className="space-y-3 relative z-10">
                    <div className="p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-[#C22D2E]/20 flex gap-3 items-start hover:bg-white hover:shadow-md transition-all"><div className="bg-[#C22D2E]/10 p-2 rounded-lg text-[#C22D2E] shadow-sm mt-0.5"><LucideIcon name="thermometer" size={16}/></div><div><p className="text-xs font-bold text-[#C22D2E]">Cold Room Temp High</p><p className="text-[10px] text-gray-500 mt-0.5 font-medium leading-tight">Room C reached -15°C. Check compressor immediately.</p></div></div>
                    <div className="p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-[#DCBC1B]/30 flex gap-3 items-start hover:bg-white hover:shadow-md transition-all"><div className="bg-[#DCBC1B]/10 p-2 rounded-lg text-[#B06821] shadow-sm mt-0.5"><LucideIcon name="shopping-bag" size={16}/></div><div><p className="text-xs font-bold text-[#B06821]">Spice Stock Low</p><p className="text-[10px] text-gray-500 mt-0.5 font-medium leading-tight">Black pepper reserve below 10kg. Reorder needed.</p></div></div>
                </div>
            </GlassCard>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-0">
            <KPICard title="PRODUCTION CAP TODAY" val="2.4 / 2.8 Tons" color="#55738D" icon="bar-chart-2" desc="85.7% Utilization" />
            <KPICard title="% YIELD TODAY" val="98.5%" color="#D8A48F" icon="scale" desc="Target: >98%" />
            <KPICard title="OEE" val="92.4%" color="#BB8588" icon="gauge" desc="World Class > 85%" />
        </div>
    </div>
);

const GenericView = ({ title, icon, desc, children }: any) => (
    <div className="animate-fadeIn w-full h-full flex flex-col px-8 pb-8">
        <div className="flex justify-between items-end mb-6 shrink-0">
            <div><h2 className="text-2xl font-bold text-[#2E395F] uppercase">{title}</h2><p className="text-xs text-[#55738D] mt-1">{desc || 'System Module'}</p></div>
        </div>
        {children ? (<div className="flex-1 min-h-0 overflow-auto">{children}</div>) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <GlassCard className="flex flex-col items-center justify-center min-h-[300px] text-center relative overflow-hidden group">
                    <div className="absolute -right-10 -bottom-10 opacity-[0.05] transform rotate-12 group-hover:scale-110 group-hover:rotate-6 transition-all duration-700 pointer-events-none"><LucideIcon name={icon} size={250} className="text-[#2E395F]" /></div>
                    <div className="relative z-10">
                        <div className="p-6 bg-[#2E395F]/5 rounded-2xl mb-4 inline-block border border-[#2E395F]/10 shadow-sm group-hover:scale-110 transition-transform duration-300"><LucideIcon name={icon} size={48} className="text-[#C22D2E]" /></div>
                        <h3 className="text-lg font-bold text-[#2E395F] uppercase tracking-wide">Module Ready</h3>
                        <p className="text-sm text-[#55738D] max-w-xs mt-2 mx-auto font-medium">This is the placeholder for <span className="text-[#C22D2E]">{title}</span>. <br/>Data visualization for halal meat processing will appear here.</p>
                        <button className="mt-6 px-8 py-2.5 bg-[#2E3338] text-[#EFEBCE] rounded-xl text-xs font-bold uppercase hover:bg-[#C22D2E] transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center gap-2 mx-auto"><LucideIcon name="settings" size={14}/> Manage Data</button>
                    </div>
                </GlassCard>
            </div>
        )}
    </div>
);

import { LoginScreen } from './components/LoginScreen';
import { Watermark } from './components/Watermark';
import { saveSheetData } from './services/sheetService';
import { User } from './types';

const App = () => {
    const { isPaired, isAuthenticated, user, logout, loading } = useAuth();
    const [activeTab, setActiveTab] = useState('home');
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [expandedMenus, setExpandedMenus] = useState<any>({ sales: false, warehouse: false, procurement: false, planning: false, production: false, qc: false, cost: false, bom: false, master: false, setting: false });
    const [visitedTabs, setVisitedTabs] = useState(['home']);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Log user activity on login
    useEffect(() => {
        if (user) {
            saveSheetData(SHEET_NAMES.ACTIVITY_LOG, [{
                timestamp: new Date().toISOString(),
                userId: user.id,
                userName: user.name,
                action: 'LOGIN',
                device: navigator.userAgent
            }]).catch(err => console.error("Failed to log activity", err));
        }
    }, [user]);

    const toggleMenu = (menuKey: string) => { setExpandedMenus((prev: any) => ({ ...prev, [menuKey]: !prev[menuKey] })); if (!isSidebarOpen) setSidebarOpen(true); };
    const handleLogout = () => { if (window.confirm('ต้องการออกจากระบบ?')) { logout(); } };
    useEffect(() => { if (!visitedTabs.includes(activeTab)) { setVisitedTabs(prev => [...prev, activeTab]); } }, [activeTab, visitedTabs]);

    const handleProfileClick = () => {
        if (user && (user.isDev || ADMIN_EMAILS.includes(user.email))) {
            setActiveTab('user_setting');
        }
    };

    const hasPermission = (tabId: string) => {
        if (tabId === 'home') return true;
        if (!user) return false;
        if (user.isDev) return true;
        return user.permissions && user.permissions[tabId] !== undefined;
    };

    const getTabContent = (tabId: string) => {
        if (tabId === 'home') return <DashboardView user={user} />;

        // If not logged in, show LoginScreen for any other tab
        if (!user) {
            return <LoginScreen />;
        }

        // Check permissions
        if (!hasPermission(tabId)) {
             return (
                <div className="flex flex-col items-center justify-center h-full text-[#55738D]">
                    <LucideIcon name="shield-alert" size={64} className="mb-4 text-[#C22D2E]" />
                    <h2 className="text-2xl font-bold uppercase">Access Denied</h2>
                    <p className="text-sm mt-2">You do not have permission to view this module.</p>
                </div>
            );
        }

        if (tabId === 'plan_fr_planning') return <PlanFromPlanning />;
        if (tabId === 'plan_by_prod') return <DailyProductionPlan />;
        if (tabId === 'prod_tracking') return <ProductionTracking />;
        if (tabId === 'mixing_plan') return <MixingPlan />;
        if (tabId === 'master_items') return <ProductItemsConfig />;
        if (tabId === 'equipment') return <EquipmentConfig />;
        if (tabId === 'production_standards') return <ProductionStandards />;
        if (tabId === 'product_matrix') return <ProductMatrix />;
        if (tabId === 'user_setting') return <PermissionMatrix />;
        if (tabId === 'unplanned_jobs') return <UnplannedJobs />;

        if (tabId === 'machine_breakdown') return <MachineBreakdown />;

        switch (tabId) {
            case 'catalogue': return <GenericView title="CATALOGUE" icon="book-open" desc="Sausages, Balls, Burgers listing." />;
            case 'quotation': return <GenericView title="QUOTATION" icon="file-text" desc="Price Quotation Management" />;
            case 'orders': return <GenericView title="SALE ORDERS" icon="shopping-cart" desc="Customer orders and tracking." />;
            case 'analysis': return <GenericView title="SALE ANALYSIS" icon="bar-chart-2" desc="Performance metrics." />;
            case 'customer': return <GenericView title="CUSTOMER" icon="user" desc="Customer Relationship Management" />;
            case 'credit': return <GenericView title="CREDIT ANALYSIS" icon="credit-card" desc="Financial Credit Scoring" />;
            case 'cust_feedback': return <GenericView title="CUST FEEDBACK" icon="message-square" desc="Customer Feedback & Reviews" />;
            case 'csat': return <GenericView title="CSAT" icon="smile" desc="Customer Satisfaction Score" />;
            case 'sale_calendar': return <GenericView title="SALE CALENDAR" icon="calendar" desc="Events and Promotions" />;
            case 'packing_plan': return <GenericView title="PACKING PLAN" icon="package" desc="Daily Packing Schedule" />;
            // case 'unplanned_jobs': return <GenericView title="UNPLANNED JOBS" icon="file-warning" desc="Ad-hoc Production Tasks" />;
            // case 'machine_breakdown': return <GenericView title="MACHINE BREAKDOWN" icon="wrench" desc="Equipment Issues & Maintenance" />;
            case 'premix': return <GenericView title="PREMIX PROCESS" icon="flask-conical" desc="Spices & Additives Preparation" />;
            case 'mixing': return <GenericView title="MIXING PROCESS" icon="utensils-crossed" desc="Meat Grinding & Mixing" />;
            case 'forming': return <GenericView title="FORMING PROCESS" icon="cookie" desc="Sausage/Ball Forming" />;
            case 'cooking': return <GenericView title="COOKING PROCESS" icon="flame" desc="Boiling/Steaming/Smoking" />;
            case 'cooling': return <GenericView title="COOLING PROCESS" icon="snowflake" desc="Blast Freezing / Cooling" />;
            case 'cut_peel': return <GenericView title="CUT & PEEL PROCESS" icon="scissors" desc="Casing Removal & Cutting" />;
            case 'packing': return <GenericView title="PACKING PROCESS" icon="package-check" desc="Final Packing & Labeling" />;
            case 'meat_formula': return <GenericView title="MEAT FORMULA" icon="file-spreadsheet" desc="Central Ingredient Database" />;
            default: return <DashboardView user={user} />;
        }
    };

    if (loading) { return <div className="flex items-center justify-center h-screen bg-[#F2F4F6]"><LucideIcon name="loader-2" size={40} className="animate-spin text-[#C22D2E]" /></div>; }
    if (!isPaired) { return <ConnectionScreen />; }
    
    // Removed the blocking user check here to allow access to Home

    return (
        <div className="flex h-screen w-full font-sans overflow-hidden bg-[#F2F4F6] text-[#2E395F] relative">
            <Watermark user={user} />
            <div className="fixed top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#C22D2E] opacity-5 blur-[120px] rounded-full pointer-events-none"></div>
            <div className="fixed bottom-[-10%] left-[10%] w-[400px] h-[400px] bg-[#E6E1DB] opacity-5 blur-[100px] rounded-full pointer-events-none"></div>
            <aside className={`flex-shrink-0 flex flex-col transition-all duration-500 z-30 shadow-2xl relative bg-[#2E3338] ${isSidebarOpen ? 'w-72' : 'w-24'}`}>
                <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="absolute -right-3 top-10 w-6 h-6 bg-[#A91B18] text-white rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(169,27,24,0.5)] hover:scale-110 transition-transform z-50 border-2 border-[#2E3338]"><LucideIcon name={isSidebarOpen ? "chevron-left" : "chevron-right"} size={12} /></button>
                <div className="h-32 flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="flex items-center gap-3 transition-all duration-300">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#A91B18] to-[#96291C] flex items-center justify-center shadow-lg transform rotate-3"><LucideIcon name="beef" size={26} className="text-[#EFEBCE]" strokeWidth={2.5} /></div>
                        <div className={`transition-all duration-500 overflow-hidden flex flex-col items-center ${isSidebarOpen ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}><h1 className="text-white font-brand text-xl tracking-widest whitespace-nowrap"><span className="font-light">MEAT</span><span className="font-bold text-[#A91B18]">PRO</span></h1><p className="text-[#90B7BF] text-[10px] font-bold uppercase tracking-[0.55em] text-center whitespace-nowrap ml-1 mt-1">Halal MES</p></div>
                    </div>
                </div>
                <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar py-4 relative z-10">
                    {SYSTEM_MODULES.map(module => {
                        // Check permission for the module itself
                        // If user is not logged in, show everything (so they can see what's available).
                        // If logged in, check permissions.
                        if (user && !hasPermission(module.id)) return null;

                        if (module.id === 'home' || !module.subItems) return (<NavItem key={module.id} icon={module.icon} label={module.label} active={activeTab === module.id} onClick={() => setActiveTab(module.id)} isOpen={isSidebarOpen} />);
                        
                        // Filter sub-items based on permissions
                        // Same logic: if !user, show all. If user, filter by permission.
                        const visibleSubItems = module.subItems.filter(sub => !user || hasPermission(sub.id));
                        
                        // If no sub-items are visible, and it's a group, maybe hide it? 
                        // But we already checked the parent permission. Let's assume if parent is permitted, we show it.
                        // But if all children are hidden, it might be empty. 
                        // Let's just pass the filtered subItems.
                        
                        const isActive = [module.id, ...(visibleSubItems.map(s => s.id) || [])].includes(activeTab) || (visibleSubItems.some(s => s.id === activeTab));
                        
                        return (<NavItem key={module.id} icon={module.icon} label={module.label} active={isActive} onClick={() => toggleMenu(module.id)} isOpen={isSidebarOpen} isExpanded={expandedMenus[module.id]} onToggleExpand={() => toggleMenu(module.id)} subItems={visibleSubItems.map(sub => ({ label: sub.label, active: activeTab === sub.id, onClick: () => setActiveTab(sub.id) }))} />);
                    })}
                </nav>
                <div className="p-6 border-t border-white/5 bg-[#141619] relative z-10">
                    <div className={`flex items-center gap-3 ${!isSidebarOpen && 'justify-center'}`}>
                        {user ? (
                            <>
                                <div onClick={handleProfileClick} className={`w-10 h-10 rounded-full border-2 border-[#A91B18] overflow-hidden p-0.5 ${user && (user.isDev || ADMIN_EMAILS.includes(user.email)) ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}><img src={user.avatar} alt="User Profile" className="w-full h-full object-cover rounded-full" /></div>
                                {isSidebarOpen && (<div className="overflow-hidden"><p className="text-[#B7A596] text-sm font-bold uppercase truncate w-32">{user.name}</p><p className="text-[#A91B18] text-[10px] uppercase">Logged in</p></div>)}
                                {isSidebarOpen && <button onClick={handleLogout}><LucideIcon name="log-out" size={18} className="ml-auto text-[#737597] hover:text-[#A91B18] cursor-pointer" /></button>}
                            </>
                        ) : (
                            isSidebarOpen ? (
                                <button onClick={() => setActiveTab('login')} className="w-full bg-[#A91B18] text-white py-2 rounded-lg text-xs font-bold uppercase hover:bg-[#C22D2E] transition-all">Login</button>
                            ) : (
                                <button onClick={() => setActiveTab('login')} className="w-10 h-10 bg-[#A91B18] text-white rounded-full flex items-center justify-center hover:bg-[#C22D2E] transition-all"><LucideIcon name="log-in" size={18} /></button>
                            )
                        )}
                    </div>
                    {isSidebarOpen && (
                        <div className="mt-auto"></div>
                    )}
                </div>
            </aside>
            <main className="flex-1 relative transition-all duration-300 overflow-hidden" style={{ background: `linear-gradient(135deg, ${PALETTE.bgGradientStart} 0%, ${PALETTE.bgGradientEnd} 100%)` }}>
                {activeTab === 'home' && (
                    <header className="h-24 px-8 flex items-center justify-between z-10 absolute top-0 left-0 right-0">
                        <div className="flex items-center gap-4 group select-none">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#C22D2E] to-[#9E2C21] flex items-center justify-center shadow-lg shadow-[#C22D2E]/30 text-white transform group-hover:rotate-12 transition-transform duration-500 border-2 border-[#EFEBCE]/50"><LucideIcon name="shield-check" size={24} strokeWidth={2.5} /></div>
                            <div className="flex flex-col justify-center">
                                <h2 className="text-lg lg:text-xl font-black text-[#2E395F] tracking-tight leading-none drop-shadow-sm">AUTHENTIC <span className="text-[#BB8588] italic">&</span> VARIETY <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#537E72] to-[#184F61]">HALAL FOOD</span></h2>
                                <div className="flex items-center gap-2 mt-1"><div className="h-0.5 w-8 bg-[#DCBC1B] rounded-full shadow-[0_0_5px_#DCBC1B]"></div><p className="text-[10px] font-bold text-[#55738D] tracking-[0.15em] uppercase group-hover:text-[#C22D2E] transition-colors duration-300">High Quality & Safety Product for Consumption</p></div>
                            </div>
                        </div>
                        <div className="flex items-center gap-5">
                            <div className="hidden md:flex items-center gap-4 bg-white/50 rounded-lg pl-4 pr-1 py-1 border border-[#D7CE93]/30 shadow-sm backdrop-blur-sm group hover:bg-white/70 transition-colors">
                                <div className="flex flex-col items-end leading-none"><span className="text-[10px] font-bold text-[#7B555C] tracking-widest uppercase">{currentTime.toLocaleDateString('en-GB', { weekday: 'long' })}</span><span className="text-xs font-bold text-[#2E395F]">{currentTime.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span></div>
                                <div className="h-6 w-[1px] bg-[#90B7BF]/40"></div>
                                <div className="flex items-center gap-2 bg-[#A91B18] text-white px-3 py-1.5 rounded font-mono text-sm tracking-widest shadow-inner"><LucideIcon name="clock" size={14} className="text-white animate-pulse"/> {currentTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</div>
                            </div>
                            <button className="relative p-3 rounded-full bg-white/50 hover:bg-white/70 transition-colors border border-white/60"><LucideIcon name="bell" size={18} className="text-[#2E395F]" /><span className="absolute top-2 right-2.5 w-2 h-2 bg-[#A91B18] rounded-full border border-white"></span></button>
                        </div>
                    </header>
                )}
                <div className={`absolute inset-0 ${activeTab === 'home' ? 'top-24' : 'top-0'} bottom-14`}>
                    {visitedTabs.map(tabId => (
                        <div key={tabId} className="flex-1 overflow-y-auto pb-4 custom-scrollbar flex flex-col absolute inset-0 w-full h-full px-0" style={{ display: activeTab === tabId ? 'flex' : 'none' }}>
                            <div className="flex-1 flex flex-col h-full">{getTabContent(tabId)}</div>
                        </div>
                    ))}
                </div>
                <footer className="absolute bottom-0 left-0 right-0 h-14 bg-[#E6E1DB]/80 backdrop-blur-md border-t border-[#2E395F]/10 flex flex-col items-center justify-center z-20 shadow-[0_-5px_20px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center gap-2 text-[#2E395F] font-bold font-mono tracking-widest text-[10px] uppercase opacity-90">
                        <LucideIcon name="beef" size={16} className="text-[#A91B18]" />
                        <span>MEAT PRO • PRODUCTION INTELLIGENCE SYSTEM • VERSION 1.2.0</span>
                    </div>
                    <div className="flex items-center gap-4 text-[#737597] text-[9px] font-medium mt-1 tracking-wide">
                        <span className="flex items-center gap-1">System by <span className="font-bold text-[#2E395F]">T All Intelligence</span></span>
                        <span className="w-px h-3 bg-[#737597]/30"></span>
                        <span className="flex items-center gap-1 hover:text-[#A91B18] transition-colors cursor-pointer"><LucideIcon name="phone" size={10} /> 082-5695654</span>
                        <span className="w-px h-3 bg-[#737597]/30"></span>
                        <span className="flex items-center gap-1 hover:text-[#A91B18] transition-colors cursor-pointer"><LucideIcon name="mail" size={10} /> tallintelligence.ho@gmail.com</span>
                    </div>
                </footer>
            </main>
        </div>
    );
};

export default App;
