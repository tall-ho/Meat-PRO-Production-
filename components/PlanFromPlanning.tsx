import React, { useState, useEffect, useMemo } from 'react';
import * as LucideIcons from 'lucide-react';
import { fetchSheetData, saveSheetData } from '../services/sheetService';
import { SHEET_NAMES } from '../constants';
import { PlanItem } from '../types';

const Swal = (window as any).Swal;

// --- Constants & Mock Data ---
const MOCK_PLANS: PlanItem[] = [
    { id: 1700000001, planId: '260225-001', type: 'Normal', shift: 'Morning', time: '12:00', sku: 'FG-1001', qty: 500, fgName: 'ไส้กรอกไก่จัมโบ้ ARO 1kg', status: 'Approved' },
    { id: 1700000002, planId: '260225-002', type: 'Normal', shift: 'Morning', time: '12:00', sku: 'FG-2001', qty: 300, fgName: 'ไส้กรอกคอกเทล ARO 1kg', status: 'Approved' },
    { id: 1700000003, planId: '260225-003', type: 'Replacement', shift: 'Afternoon', time: '16:00', sku: 'FG-3001', qty: 200, fgName: 'ลูกชิ้นหมู ARO 1kg', status: 'Draft' },
    { id: 1700000004, planId: '260225-004', type: 'Normal', shift: 'Afternoon', time: '16:00', sku: 'FG-4001', qty: 400, fgName: 'โบโลน่าพริก CP 1kg (Sliced)', status: 'Approved' },
    { id: 1700000005, planId: '260225-005', type: 'Normal', shift: 'Night', time: '24:00', sku: 'FG-5001', qty: 150, fgName: 'ไส้กรอกชีสลาวา 500g', status: 'Approved' },
    { id: 1700000006, planId: '260225-006', type: 'Normal', shift: 'Night', time: '24:00', sku: 'FG-1001', qty: 600, fgName: 'ไส้กรอกไก่จัมโบ้ ARO 1kg', status: 'Approved' },
];

const FG_DATABASE = [
    { sku: 'FG-1001', name: 'ไส้กรอกไก่จัมโบ้ ARO 1kg', weight: 1.0, sfg: 'SFG-SMC-001' },
    { sku: 'FG-1002', name: 'ไส้กรอกไก่จัมโบ้ CP 500g', weight: 0.5, sfg: 'SFG-SMC-001' },
    { sku: 'FG-2001', name: 'ไส้กรอกคอกเทล ARO 1kg', weight: 1.0, sfg: 'SFG-002' },
    { sku: 'FG-3001', name: 'ลูกชิ้นหมู ARO 1kg', weight: 1.0, sfg: 'SFG-MTB-002' },
    { sku: 'FG-4001', name: 'โบโลน่าพริก CP 1kg (Sliced)', weight: 1.0, sfg: 'SFG-BOL-004' },
    { sku: 'FG-5001', name: 'ไส้กรอกชีสลาวา 500g', weight: 0.5, sfg: 'SFG-CHE-009' },
    { sku: 'FG-6001', name: 'ไก่จ๊อห่อฟองเต้าหู้ 1kg', weight: 1.0, sfg: 'SFG-CKN-010' },
    { sku: 'FG-8001', name: 'แซนวิชไก่แฮม 500g', weight: 0.5, sfg: 'SFG-SND-020' },
    { sku: 'FG-8002', name: 'ไก่ยอไส้ผักโขม 200g', weight: 0.2, sfg: 'SFG-TRI-030' },
    { sku: 'FG-8003', name: 'ไส้กรอกระเบิดซอส 120g', weight: 0.12, sfg: 'SFG-SPY-040' }
];

const LucideIcon = ({ name, size = 16, className = "", style }: any) => {
    const iconName = name.split('-').map((part: string) => part.charAt(0).toUpperCase() + part.slice(1)).join('');
    const IconComponent = (LucideIcons as any)[iconName] || (LucideIcons as any)[name] || LucideIcons.HelpCircle;
    return <IconComponent size={size} className={className} style={style} />;
};

// --- Helper Functions ---
const generatePlanId = (dateObj: Date, index: number) => {
    const y = dateObj.getFullYear().toString().slice(-2);
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}${m}${d}-${String(index).padStart(3, '0')}`;
};

const calculateResources = (sku: string, qty: number) => {
    const fg = FG_DATABASE.find(f => f.sku === sku);
    if (!fg) return null;
    const totalFgWeight = qty * fg.weight;
    return { 
        fgWeight: totalFgWeight, 
        sfgWeight: totalFgWeight, // Simplified 1:1 ratio
        totalBatterWeight: totalFgWeight * 1.1, 
    };
};

const KPICard = ({ title, val, unit, color, icon }: any) => (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-start justify-between relative overflow-hidden group">
        <div className="relative z-10">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{title}</p>
            <h3 className="text-3xl font-black font-mono tracking-tight" style={{color: color}}>
                {val} <span className="text-sm font-bold text-gray-400 ml-1">{unit}</span>
            </h3>
        </div>
        <div className="absolute right-[-10px] bottom-[-10px] opacity-10 group-hover:scale-110 transition-transform duration-500 pointer-events-none">
            <LucideIcon name={icon} size={80} style={{color: color}} />
        </div>
        <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 group-hover:bg-white transition-colors relative z-10">
            <LucideIcon name={icon} size={24} style={{color: color}} />
        </div>
    </div>
);

export const PlanFromPlanning: React.FC = () => {
    const [activeMainTab, setActiveMainTab] = useState('today');
    const [planDate, setPlanDate] = useState(new Date().toISOString().split('T')[0]);
    const [plans, setPlans] = useState<PlanItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeShift, setActiveShift] = useState('All'); // Morning, Afternoon, Night, All

    // Form State
    const [formShift, setFormShift] = useState('Morning');
    const [formTime, setFormTime] = useState('12:00');
    const [formSku, setFormSku] = useState('');
    const [formQty, setFormQty] = useState('');
    const [formType, setFormType] = useState('Normal');

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const data = await fetchSheetData<PlanItem>(SHEET_NAMES.PLAN_FROM_PLANNING);
            if(data && data.length > 0) setPlans(data); else { setPlans(MOCK_PLANS); saveSheetData(SHEET_NAMES.PLAN_FROM_PLANNING, MOCK_PLANS, ['id', 'planId', 'type', 'shift', 'time', 'sku', 'qty', 'fgName', 'status']); }
            setLoading(false);
        };
        load();
    }, []);

    const handleDelete = (id: number | string) => { const u = plans.filter(p => p.id !== id); setPlans(u); saveSheetData(SHEET_NAMES.PLAN_FROM_PLANNING, u, ['id', 'planId', 'type', 'shift', 'time', 'sku', 'qty', 'fgName', 'status']); };
    
    const handleAddPlan = () => {
        if (!formSku || !formQty) return;
        const fg = FG_DATABASE.find(f => f.sku === formSku);
        const newPlan = { 
            id: Date.now(), 
            planId: generatePlanId(new Date(planDate), plans.length+1), 
            type: formType, 
            shift: formShift, 
            time: formTime, 
            sku: formSku, 
            qty: parseInt(formQty), 
            fgName: fg?.name || 'Unknown', 
            status: 'Draft' 
        };
        const updated = [...plans, newPlan];
        setPlans(updated);
        saveSheetData(SHEET_NAMES.PLAN_FROM_PLANNING, updated, ['id', 'planId', 'type', 'shift', 'time', 'sku', 'qty', 'fgName', 'status']);
        setFormSku(''); setFormQty('');
        if(Swal) Swal.fire({ icon: 'success', title: 'Added', timer: 1000, showConfirmButton: false });
    };

    const totalSummary = useMemo(() => { 
        let s = { batterTotal: 0, sfgTotal: 0, fgTotal: 0 }; 
        plans.forEach(p => { 
            const r = calculateResources(p.sku, p.qty); 
            if(r) { s.batterTotal += r.totalBatterWeight; s.sfgTotal += r.sfgWeight; s.fgTotal += r.fgWeight; } 
        }); 
        return s; 
    }, [plans]);

    const filteredPlans = useMemo(() => {
        if (activeShift === 'All') return plans;
        return plans.filter(p => p.shift === activeShift);
    }, [plans, activeShift]);

    if(loading) return <div className="flex h-full items-center justify-center"><LucideIcon name="loader-2" size={40} className="animate-spin text-[#C22D2E]" /></div>;

    return (
        <div className="flex h-full flex-col font-sans overflow-hidden bg-[#F2F4F6]">
            
            {/* --- HEADER --- */}
            <div className="px-8 py-6 flex justify-between items-center shrink-0 bg-white/50 backdrop-blur-sm border-b border-white/20">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-[#C22D2E] text-white shadow-lg shadow-[#C22D2E]/20 border border-white/20">
                        <LucideIcon name="calendar-days" size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-[#2E3338] tracking-tight uppercase leading-none">PLAN FROM PLANNING</h1>
                        <p className="text-sm text-[#64748B] font-medium mt-1">รับแผนจากฝ่ายวางแผน (Planning Dept)</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 bg-[#2E3338]/5 p-1 rounded-lg border border-[#2E3338]/5">
                    <button onClick={() => setActiveMainTab('today')} className={`px-5 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 uppercase tracking-wide ${activeMainTab === 'today' ? 'bg-[#C22D2E] text-white shadow-md' : 'text-gray-500 hover:text-gray-800 hover:bg-white/50'}`}>
                        <LucideIcon name="calendar" size={16} /> Today
                    </button>
                    <button onClick={() => setActiveMainTab('history')} className={`px-5 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 uppercase tracking-wide ${activeMainTab === 'history' ? 'bg-[#C22D2E] text-white shadow-md' : 'text-gray-500 hover:text-gray-800 hover:bg-white/50'}`}>
                        <LucideIcon name="history" size={16} /> History
                    </button>
                </div>
            </div>

            {/* --- KPI SECTION --- */}
            <div className="px-8 pt-6 grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
                <KPICard title="Total FG Needed" val={totalSummary.fgTotal.toLocaleString()} unit="Kg" color="#2E395F" icon="package-check" />
                <KPICard title="Total SFG Required" val={totalSummary.sfgTotal.toLocaleString()} unit="Kg" color="#DCBC1B" icon="layers" />
                <KPICard title="Total Batter Mix" val={Math.ceil(totalSummary.batterTotal).toLocaleString()} unit="Kg" color="#C22D2E" icon="chef-hat" />
            </div>

            {/* --- MAIN CONTENT (SPLIT LAYOUT) --- */}
            <div className="flex-1 overflow-hidden px-8 py-6 flex gap-6">
                
                {/* LEFT: PLAN LIST */}
                <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
                    {/* Toolbar */}
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex gap-2">
                            {['All', 'Morning', 'Afternoon', 'Night'].map(shift => (
                                <button 
                                    key={shift} 
                                    onClick={() => setActiveShift(shift)}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 border ${activeShift === shift ? 'bg-[#55738D] text-white border-[#55738D]' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'}`}
                                >
                                    {shift === 'Morning' && <LucideIcon name="sun" size={12}/>}
                                    {shift === 'Afternoon' && <LucideIcon name="sunset" size={12}/>}
                                    {shift === 'Night' && <LucideIcon name="moon" size={12}/>}
                                    {shift === 'All' && <LucideIcon name="layers" size={12}/>}
                                    {shift}
                                </button>
                            ))}
                        </div>
                        <div className="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1.5 rounded-lg">{filteredPlans.length} Items</div>
                    </div>

                    {/* Table */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-[#F8FAFC] text-gray-500 uppercase text-[10px] font-bold sticky top-0 z-10 border-b border-gray-100">
                                <tr>
                                    <th className="p-4 pl-6">Plan ID</th>
                                    <th className="p-4">Product Name</th>
                                    <th className="p-4 text-center">Qty (Packs)</th>
                                    <th className="p-4 text-center">Weight (Kg)</th>
                                    <th className="p-4 text-center">Status</th>
                                    <th className="p-4 text-center pr-6">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredPlans.map(item => {
                                    const resources = calculateResources(item.sku, item.qty);
                                    return (
                                        <tr key={item.id} className="hover:bg-[#FDFDFD] group transition-colors">
                                            <td className="p-4 pl-6">
                                                <div className="font-mono font-bold text-[#2E3338]">{item.planId}</div>
                                                {item.type === 'Replacement' && <span className="text-[9px] bg-red-100 text-red-600 px-1.5 rounded uppercase font-bold tracking-wide">Replacement</span>}
                                            </td>
                                            <td className="p-4">
                                                <div className="font-bold text-[#2E395F]">{item.fgName}</div>
                                                <div className="text-xs text-gray-400 font-mono mt-0.5">{item.sku}</div>
                                            </td>
                                            <td className="p-4 text-center font-mono font-bold text-lg">{item.qty.toLocaleString()}</td>
                                            <td className="p-4 text-center font-mono text-gray-500">{resources?.fgWeight.toLocaleString()}</td>
                                            <td className="p-4 text-center">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${item.status === 'Approved' ? 'bg-[#537E72]/10 text-[#537E72] border-[#537E72]/20' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center pr-6">
                                                <button onClick={() => handleDelete(item.id)} className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all">
                                                    <LucideIcon name="trash-2" size={14}/>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* RIGHT: FORM */}
                <div className="w-[380px] bg-white rounded-2xl shadow-xl border border-gray-200 flex flex-col shrink-0 overflow-hidden">
                    <div className="p-5 bg-[#2E3338] text-white flex justify-between items-center shrink-0">
                        <h3 className="font-bold text-lg flex items-center gap-2"><LucideIcon name="plus-circle" size={20} className="text-[#DCBC1B]"/> Add Order</h3>
                        <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-lg border border-white/10">
                            <LucideIcon name="calendar" size={14} className="text-[#DCBC1B]"/>
                            <input type="date" value={planDate} onChange={(e) => setPlanDate(e.target.value)} className="bg-transparent text-xs font-mono font-bold text-white outline-none w-24 text-center" />
                        </div>
                    </div>
                    <div className="p-6 flex-1 overflow-y-auto space-y-6">
                        {/* Time & Shift */}
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">1. Delivery Deadline</label>
                            <div className="flex gap-2">
                                <button onClick={()=>setFormTime('12:00')} className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${formTime==='12:00'?'bg-[#C22D2E] text-white border-[#C22D2E]':'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>12:00</button>
                                <button onClick={()=>setFormTime('16:00')} className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${formTime==='16:00'?'bg-[#C22D2E] text-white border-[#C22D2E]':'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>16:00</button>
                                <button onClick={()=>setFormTime('24:00')} className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${formTime==='24:00'?'bg-[#C22D2E] text-white border-[#C22D2E]':'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>24:00</button>
                            </div>
                            <div className="mt-2 text-[10px] text-red-500 bg-red-50 p-2 rounded border border-red-100 text-center font-bold">⚠️ Warning: Morning capacity is full.</div>
                        </div>

                        {/* Job Type */}
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">2. Job Type</label>
                            <div className="flex bg-gray-100 p-1 rounded-lg">
                                <button onClick={()=>setFormType('Normal')} className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${formType==='Normal'?'bg-white text-[#2E3338] shadow-sm':'text-gray-400 hover:text-gray-600'}`}>Normal</button>
                                <button onClick={()=>setFormType('Replacement')} className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${formType==='Replacement'?'bg-white text-[#2E3338] shadow-sm':'text-gray-400 hover:text-gray-600'}`}>Replacement</button>
                            </div>
                        </div>

                        {/* Product Select */}
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">3. Finished Goods (FG)</label>
                            <select value={formSku} onChange={(e) => setFormSku(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-[#2E3338] outline-none focus:border-[#C22D2E] focus:ring-1 focus:ring-[#C22D2E] transition-all">
                                <option value="">-- Select Product --</option>
                                {FG_DATABASE.map((f:any) => <option key={f.sku} value={f.sku}>{f.name}</option>)}
                            </select>
                        </div>

                        {/* Quantity */}
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">4. Quantity (Packs)</label>
                            <div className="relative">
                                <input type="number" value={formQty} onChange={(e) => setFormQty(e.target.value)} className="w-full p-3 bg-white border border-gray-200 rounded-xl text-lg font-mono font-bold text-right outline-none focus:border-[#C22D2E] focus:ring-1 focus:ring-[#C22D2E] transition-all" placeholder="0" />
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">PCK</span>
                            </div>
                        </div>
                    </div>
                    <div className="p-6 pt-0">
                        <button onClick={handleAddPlan} className="w-full py-4 bg-[#C22D2E] hover:bg-[#A91B18] text-white rounded-xl font-bold text-sm shadow-lg shadow-[#C22D2E]/30 flex items-center justify-center gap-2 transition-all active:scale-95">
                            <LucideIcon name="plus-circle" size={18}/> Add to Plan
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}