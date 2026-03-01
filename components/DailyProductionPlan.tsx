import React, { useState, useEffect, useMemo } from 'react';
import * as LucideIcons from 'lucide-react';
import { fetchSheetData, saveSheetData } from '../services/sheetService';
import { SHEET_NAMES } from '../constants';
import { PlanItem } from '../types';

const Swal = (window as any).Swal;

// --- Mock Data ---
const MOCK_PLANS: PlanItem[] = [
    { id: 1700000001, planId: '260215-001', type: 'Normal', shift: 'Morning', time: '12:00', sku: 'FG-8001', qty: 6000, fgName: 'แซนวิชไก่แฮม 500g', status: 'Approved' },
    { id: 1700000003, planId: '260215-003', type: 'Replacement', shift: 'Morning', time: '12:00', sku: 'FG-5001', qty: 2000, fgName: 'ไส้กรอกชีสลาวา 500g', status: 'Approved' },
    { id: 1700000010, planId: '260215-010', type: 'Normal', shift: 'Afternoon', time: '16:00', sku: 'FG-1001', qty: 2972, fgName: 'ไส้กรอกไก่จัมโบ้ ARO 1kg', status: 'Draft' },
    { id: 1700000013, planId: '260215-013', type: 'Normal', shift: 'Night', time: '24:00', sku: 'FG-2001', qty: 3052, fgName: 'ไส้กรอกคอกเทล ARO 1kg', status: 'Draft' },
];

const FG_DATABASE = [
    { sku: 'FG-1001', name: 'ไส้กรอกไก่จัมโบ้ ARO 1kg', weight: 1.0 },
    { sku: 'FG-2001', name: 'ไส้กรอกคอกเทล ARO 1kg', weight: 1.0 },
    { sku: 'FG-5001', name: 'ไส้กรอกชีสลาวา 500g', weight: 0.5 },
    { sku: 'FG-8001', name: 'แซนวิชไก่แฮม 500g', weight: 0.5 },
];

const LucideIcon = ({ name, size = 16, className = "", style }: any) => {
    const iconName = name.split('-').map((part: string) => part.charAt(0).toUpperCase() + part.slice(1)).join('');
    const IconComponent = (LucideIcons as any)[iconName] || (LucideIcons as any)[name] || LucideIcons.HelpCircle;
    return <IconComponent size={size} className={className} style={style} />;
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

const OrderEntryView = ({ plans, setPlans }: any) => {
    const [activeShift, setActiveShift] = useState('All');
    const [formDate, setFormDate] = useState('2026-02-15');
    const [formSku, setFormSku] = useState('');
    const [formQty, setFormQty] = useState('');
    const [formType, setFormType] = useState('Normal');
    const [formTime, setFormTime] = useState('12:00');

    const filteredPlans = useMemo(() => {
        if (activeShift === 'All') return plans;
        return plans.filter((p: any) => p.shift === activeShift);
    }, [plans, activeShift]);

    const handleAddPlan = () => {
        if (!formSku || !formQty) return;
        const fg = FG_DATABASE.find(f => f.sku === formSku);
        const shiftMap: any = { '12:00': 'Morning', '16:00': 'Afternoon', '24:00': 'Night' };
        
        const newPlan = { 
            id: Date.now(), 
            planId: `260215-${String(plans.length+1).padStart(3, '0')}`, 
            type: formType, 
            shift: shiftMap[formTime] || 'Morning', 
            time: formTime, 
            sku: formSku, 
            qty: parseInt(formQty), 
            fgName: fg?.name || 'Unknown', 
            status: 'Draft' 
        };
        const updated = [...plans, newPlan];
        setPlans(updated);
        saveSheetData(SHEET_NAMES.DAILY_PRODUCTION_PLAN, updated, ['id', 'planId', 'type', 'shift', 'time', 'sku', 'qty', 'fgName', 'status']);
        setFormSku(''); setFormQty('');
        if(Swal) Swal.fire({ icon: 'success', title: 'Order Added', timer: 1000, showConfirmButton: false });
    };

    const handleDelete = (id: any) => {
        const u = plans.filter((p: any) => p.id !== id); 
        setPlans(u);
        saveSheetData(SHEET_NAMES.DAILY_PRODUCTION_PLAN, u, ['id', 'planId', 'type', 'shift', 'time', 'sku', 'qty', 'fgName', 'status']);
    };

    return (
        <div className="flex flex-1 gap-6 overflow-hidden">
            {/* Left Column: List */}
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center gap-2">
                    {['Morning', 'Afternoon', 'Night', 'All Day'].map((shift) => (
                        <button 
                            key={shift}
                            onClick={() => setActiveShift(shift === 'All Day' ? 'All' : shift)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 border ${
                                (activeShift === shift || (activeShift === 'All' && shift === 'All Day'))
                                ? 'bg-[#55738D] text-white border-[#55738D]' 
                                : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                            }`}
                        >
                            {shift === 'Morning' && <LucideIcon name="sun" size={12}/>}
                            {shift === 'Afternoon' && <LucideIcon name="sunset" size={12}/>}
                            {shift === 'Night' && <LucideIcon name="moon" size={12}/>}
                            {shift === 'All Day' && <LucideIcon name="layers" size={12}/>}
                            {shift}
                        </button>
                    ))}
                </div>
                
                <div className="bg-[#F8FAFC] px-4 py-2 border-b border-gray-100 flex justify-between items-center text-[#55738D]">
                    <div className="flex items-center gap-2 font-bold text-sm">
                        <LucideIcon name={activeShift === 'Morning' ? 'sun' : 'layers'} size={16} />
                        {activeShift === 'All' ? 'All Shifts' : `${activeShift} Shift`} 
                        <span className="text-xs font-normal opacity-70">(Deadline: {activeShift === 'Morning' ? '12:00' : 'VARIES'})</span>
                    </div>
                    <span className="text-xs font-bold bg-white px-2 py-0.5 rounded border border-gray-200">{filteredPlans.length} Items</span>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white text-gray-400 uppercase text-[10px] font-bold border-b border-gray-100 sticky top-0 z-10">
                            <tr>
                                <th className="p-4 pl-6">Plan ID</th>
                                <th className="p-4">Product</th>
                                <th className="p-4 text-center">Order Qty</th>
                                <th className="p-4 text-center">FG Kg</th>
                                <th className="p-4 text-center">Status</th>
                                <th className="p-4 text-center pr-6">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredPlans.map((item: any) => {
                                const fgWeight = item.qty * (FG_DATABASE.find(f=>f.sku===item.sku)?.weight || 1);
                                return (
                                    <tr key={item.id} className="hover:bg-[#FDFDFD] transition-colors group">
                                        <td className="p-4 pl-6">
                                            <div className="font-mono font-bold text-[#2E3338]">{item.planId}</div>
                                            {item.type === 'Replacement' && <span className="text-[9px] bg-red-100 text-red-600 px-1.5 rounded uppercase font-bold tracking-wide">Replacement</span>}
                                        </td>
                                        <td className="p-4">
                                            <div className="text-xs text-gray-400 font-mono mb-0.5">{item.sku}</div>
                                            <div className="font-bold text-[#2E395F]">{item.fgName}</div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="font-mono font-black text-lg">{item.qty.toLocaleString()}</span>
                                            <span className="text-[10px] text-gray-400 ml-1">pks</span>
                                        </td>
                                        <td className="p-4 text-center font-mono text-gray-500">{fgWeight.toLocaleString()}</td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${item.status === 'Approved' ? 'bg-[#537E72]/10 text-[#537E72] border-[#537E72]/20' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center pr-6">
                                            <div className="flex items-center justify-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                <button className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 text-blue-500 hover:border-blue-200 hover:bg-blue-50 transition-all"><LucideIcon name="pencil" size={14}/></button>
                                                <button onClick={() => handleDelete(item.id)} className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 text-red-500 hover:border-red-200 hover:bg-red-50 transition-all"><LucideIcon name="trash-2" size={14}/></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Right Column: Form */}
            <div className="w-[380px] bg-white rounded-2xl shadow-xl border border-gray-200 flex flex-col shrink-0 overflow-hidden">
                <div className="p-5 bg-[#2E3338] text-white flex justify-between items-center shrink-0">
                    <h3 className="font-bold text-lg flex items-center gap-2"><LucideIcon name="plus-circle" size={20} className="text-[#DCBC1B]"/> Add Order</h3>
                    <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-lg border border-white/10">
                        <LucideIcon name="calendar" size={14} className="text-[#DCBC1B]"/>
                        <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} className="bg-transparent text-xs font-mono font-bold text-white outline-none w-24 text-center" />
                    </div>
                </div>
                <div className="p-6 flex-1 overflow-y-auto space-y-6">
                    {/* Time */}
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">1. Delivery Deadline</label>
                        <div className="flex gap-2">
                            <button onClick={()=>setFormTime('12:00')} className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${formTime==='12:00'?'bg-[#C22D2E] text-white border-[#C22D2E]':'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>12:00</button>
                            <button onClick={()=>setFormTime('16:00')} className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${formTime==='16:00'?'bg-[#C22D2E] text-white border-[#C22D2E]':'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>16:00</button>
                            <button onClick={()=>setFormTime('24:00')} className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${formTime==='24:00'?'bg-[#C22D2E] text-white border-[#C22D2E]':'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>24:00</button>
                        </div>
                        <div className="mt-2 flex justify-between items-center text-[10px] px-2 py-1 rounded bg-red-50 border border-red-100 text-red-600 font-bold">
                            <span>Current Load: 130.7%</span>
                            <span className="flex items-center gap-1"><LucideIcon name="alert-triangle" size={10}/> Over Capacity</span>
                        </div>
                    </div>

                    {/* Job Type */}
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">2. Job Type</label>
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            <button onClick={()=>setFormType('Normal')} className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${formType==='Normal'?'bg-white text-blue-600 shadow-sm border border-blue-200':'text-gray-400 hover:text-gray-600'}`}>Normal</button>
                            <button onClick={()=>setFormType('Replacement')} className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${formType==='Replacement'?'bg-white text-blue-600 shadow-sm border border-blue-200':'text-gray-400 hover:text-gray-600'}`}>Replacement</button>
                        </div>
                    </div>

                    {/* Product */}
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">3. Finished Goods (FG)</label>
                        <select value={formSku} onChange={(e) => setFormSku(e.target.value)} className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-[#2E3338] outline-none focus:border-[#C22D2E] focus:ring-1 focus:ring-[#C22D2E] transition-all cursor-pointer">
                            <option value="">-- Select Product --</option>
                            {FG_DATABASE.map((f:any) => <option key={f.sku} value={f.sku}>{f.name}</option>)}
                        </select>
                    </div>

                    {/* Qty */}
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">4. Quantity (Packs)</label>
                        <div className="relative">
                            <input type="number" value={formQty} onChange={(e) => setFormQty(e.target.value)} className="w-full p-3 bg-white border border-gray-200 rounded-xl text-lg font-mono font-bold text-right outline-none focus:border-[#C22D2E] focus:ring-1 focus:ring-[#C22D2E] transition-all" />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col">
                                <button className="text-gray-300 hover:text-gray-500"><LucideIcon name="chevron-up" size={12}/></button>
                                <button className="text-gray-300 hover:text-gray-500"><LucideIcon name="chevron-down" size={12}/></button>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="p-6 pt-0">
                    <button onClick={handleAddPlan} className="w-full py-4 bg-[#D8A48F] hover:bg-[#C22D2E] text-white rounded-xl font-bold text-lg shadow-lg shadow-[#D8A48F]/30 hover:shadow-[#C22D2E]/40 flex items-center justify-center gap-2 transition-all active:scale-95">
                        <LucideIcon name="plus-circle" size={20}/> Add to Plan
                    </button>
                </div>
            </div>
        </div>
    );
};

const PlaceholderView = ({ title }: { title: string }) => <div className="flex-1 flex items-center justify-center text-gray-300 font-bold text-2xl uppercase tracking-widest">{title} Placeholder</div>;

export const DailyProductionPlan: React.FC = () => {
    const [activeTab, setActiveTab] = useState('entry');
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const data = await fetchSheetData<PlanItem>(SHEET_NAMES.DAILY_PRODUCTION_PLAN);
            if(data && data.length > 0) setPlans(data); else { setPlans(MOCK_PLANS); saveSheetData(SHEET_NAMES.DAILY_PRODUCTION_PLAN, MOCK_PLANS, ['id', 'planId', 'type', 'shift', 'time', 'sku', 'qty', 'fgName', 'status']); }
            setLoading(false);
        };
        load();
    }, []);

    if(loading) return <div className="flex h-full items-center justify-center"><LucideIcon name="loader-2" size={40} className="animate-spin text-[#C22D2E]" /></div>;

    // Calc KPI
    const totalFg = plans.reduce((s,i) => s + (i.qty * (FG_DATABASE.find(f=>f.sku===i.sku)?.weight || 1)), 0);
    const totalSfg = totalFg; 
    const totalBatter = totalFg * 1.1;

    return (
        <div className="flex h-full flex-col font-sans overflow-hidden bg-[#F2F4F6]">
            
            {/* --- HEADER --- */}
            <div className="px-8 py-6 flex justify-between items-center shrink-0 bg-white/50 backdrop-blur-sm border-b border-white/20">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-[#C22D2E] text-white shadow-lg shadow-[#C22D2E]/20 border border-white/20">
                        <LucideIcon name="clipboard-list" size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-[#2E3338] tracking-tight uppercase leading-none">DAILY PRODUCTION PLAN (BY PROD)</h1>
                        <p className="text-sm text-[#64748B] font-medium mt-1">แผนการผลิตประจำวัน (PROD Execution)</p>
                    </div>
                </div>
                
                {/* TABS */}
                <div className="flex bg-[#999798] p-1 rounded-md shadow-inner">
                    <button onClick={() => setActiveTab('entry')} className={`px-5 py-2.5 rounded-sm text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${activeTab === 'entry' ? 'bg-[#C22D2E] text-white shadow-md' : 'text-white/70 hover:text-white hover:bg-white/10'}`}>
                        <LucideIcon name="list-plus" size={14} /> Order Entry
                    </button>
                    <button onClick={() => setActiveTab('advisor')} className={`px-5 py-2.5 rounded-sm text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${activeTab === 'advisor' ? 'bg-[#C22D2E] text-white shadow-md' : 'text-white/70 hover:text-white hover:bg-white/10'}`}>
                        <LucideIcon name="lightbulb" size={14} /> Advisor
                    </button>
                    <button onClick={() => setActiveTab('mixing')} className={`px-5 py-2.5 rounded-sm text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${activeTab === 'mixing' ? 'bg-[#C22D2E] text-white shadow-md' : 'text-white/70 hover:text-white hover:bg-white/10'}`}>
                        <LucideIcon name="chef-hat" size={14} /> Mixing Plan
                    </button>
                    <button onClick={() => setActiveTab('packing')} className={`px-5 py-2.5 rounded-sm text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${activeTab === 'packing' ? 'bg-[#C22D2E] text-white shadow-md' : 'text-white/70 hover:text-white hover:bg-white/10'}`}>
                        <LucideIcon name="package" size={14} /> Packing Plan
                    </button>
                </div>
            </div>

            {/* --- KPI SECTION --- */}
            <div className="px-8 pt-6 grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
                <KPICard title="TOTAL FG NEEDED" val={totalFg.toLocaleString()} unit="Kg" color="#2E395F" icon="package-check" />
                <KPICard title="TOTAL SFG REQUIRED" val={totalSfg.toLocaleString()} unit="Kg" color="#DCBC1B" icon="layers" />
                <KPICard title="TOTAL BATTER MIX" val={Math.ceil(totalBatter).toLocaleString()} unit="Kg" color="#C22D2E" icon="chef-hat" />
            </div>

            {/* --- MAIN CONTENT --- */}
            <main className="flex-1 overflow-hidden px-8 py-6 flex flex-col">
                {activeTab === 'entry' && <OrderEntryView plans={plans} setPlans={setPlans} />}
                {activeTab === 'advisor' && <PlaceholderView title="Advisor" />}
                {activeTab === 'mixing' && <PlaceholderView title="Mixing Plan" />}
                {activeTab === 'packing' && <PlaceholderView title="Packing Plan" />}
            </main>
        </div>
    );
}