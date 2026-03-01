import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import * as LucideIcons from 'lucide-react';
import { fetchSheetData, saveSheetData } from '../services/sheetService';
import { SHEET_NAMES } from '../constants';
import { ProductionTrackingItem } from '../types';

// --- CONSTANTS ---
const STAGES = [
    { key: 'mixing', label: 'Mixing', icon: 'chef-hat', color: '#5185A6', id: 'Mixing' },
    { key: 'forming', label: 'Forming', icon: 'component', color: '#D9B036', id: 'Forming' },
    { key: 'steaming', label: 'Steaming', icon: 'thermometer', color: '#D94A3D', id: 'Steaming' },
    { key: 'cooling', label: 'Cooling', icon: 'snowflake', color: '#64748B', id: 'Cooling' },
    { key: 'cutting', label: 'Cut/Peel', icon: 'scissors', color: '#A6374B', id: 'Cutting' },
    { key: 'packing', label: 'Packing', icon: 'package', color: '#323640', id: 'Packing' },
    { key: 'warehouse', label: 'Warehouse (FG)', icon: 'archive', color: '#9AA66F', id: 'Warehouse' }
];

// --- Mock Data ---
const INITIAL_ORDERS: ProductionTrackingItem[] = [
    { id: 'JO-2602-001', sku: 'SMC ไส้กรอกไก่ ARO 125g', client: 'ARO (Makro)', totalBatches: 200, 
      stages: { mixing: 150, forming: 120, steaming: 90, cooling: 85, cutting: 80, packing: 50, warehouse: 20 }, 
      stageUpdates: { mixing: '10:30', forming: '10:45', steaming: '11:10', cooling: '11:50', packing: '13:00' }, 
      status: 'In Progress' 
    },
    { id: 'JO-2602-002', sku: 'CP Frank Cocktail 500g', client: 'CP All', totalBatches: 100, 
      stages: { mixing: 100, forming: 100, steaming: 100, cooling: 100, cutting: 100, packing: 100, warehouse: 100 }, 
      stageUpdates: { warehouse: '11:15', packing: '10:00', cutting: '09:30' },
      status: 'Completed',
      lastUpdated: 'Today 11:15'
    },
    { id: 'JO-2602-003', sku: 'BKP Chili Bologna', client: 'Betagro', totalBatches: 50, 
      stages: { mixing: 50, forming: 45, steaming: 40, cooling: 0, cutting: 0, packing: 0, warehouse: 0 }, 
      stageUpdates: { steaming: '09:00', forming: '08:45', mixing: '08:00' },
      status: 'In Progress' 
    },
    { id: 'JO-2602-004', sku: 'Ham Slice 500g', client: 'Foodland', totalBatches: 30, 
      stages: { mixing: 30, forming: 30, steaming: 30, cooling: 30, cutting: 30, packing: 5, warehouse: 0 }, 
      stageUpdates: { cutting: '08:30', cooling: '08:00' },
      status: 'In Progress' 
    },
    { id: 'JO-2602-005', sku: 'Cheese Sausage 4 inch', client: 'Big C', totalBatches: 80, stages: { mixing: 80, forming: 60, steaming: 0, cooling: 0, cutting: 0, packing: 0, warehouse: 0 }, stageUpdates: { forming: '11:00' }, status: 'In Progress' },
    { id: 'JO-2602-006', sku: 'Spicy Sausage 150g', client: 'Tops', totalBatches: 120, stages: { mixing: 40, forming: 0, steaming: 0, cooling: 0, cutting: 0, packing: 0, warehouse: 0 }, stageUpdates: { mixing: '11:20' }, status: 'In Progress' },
    { id: 'JO-2602-007', sku: 'Chicken Breast Sliced', client: 'Makro', totalBatches: 200, stages: { mixing: 200, forming: 180, steaming: 150, cooling: 150, cutting: 150, packing: 10, warehouse: 0 }, stageUpdates: { steaming: '10:50' }, status: 'In Progress' },
    { id: 'JO-2602-008', sku: 'Pork Meatball 500g', client: 'Lotus', totalBatches: 60, stages: { mixing: 0, forming: 0, steaming: 0, cooling: 0, cutting: 0, packing: 0, warehouse: 0 }, stageUpdates: {}, status: 'Pending' },
    { id: 'JO-2602-009', sku: 'Vienna Sausage', client: 'Tops', totalBatches: 80, stages: { mixing: 80, forming: 80, steaming: 80, cooling: 80, cutting: 80, packing: 80, warehouse: 80 }, stageUpdates: { warehouse: '14:20' }, status: 'Completed', lastUpdated: 'Today 14:20' },
];

const LucideIcon = ({ name, size = 16, className = "", color, style }: any) => {
    const iconName = name.split('-').map((part: string) => part.charAt(0).toUpperCase() + part.slice(1)).join('');
    const IconComponent = (LucideIcons as any)[iconName] || (LucideIcons as any)[name] || LucideIcons.HelpCircle;
    return <IconComponent size={size} className={className} style={{...style, color: color}} />;
};

const KPICard = ({ title, val, color, icon, desc, trend }: any) => (
    <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100/80 relative overflow-hidden group h-full">
        <div className="absolute -right-6 -bottom-6 opacity-[0.08] transform rotate-12 group-hover:scale-110 group-hover:opacity-[0.12] transition-all duration-500 pointer-events-none z-0">
            <LucideIcon name={icon} size={120} color={color} />
        </div>
        <div className="relative z-10 flex justify-between items-start">
            <div className="flex-1 min-w-0 flex flex-col gap-1">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest font-mono opacity-90 truncate">{title}</p>
                <div className="flex items-baseline gap-2 mt-1">
                    <h4 className="text-3xl font-extrabold tracking-tight font-mono leading-tight truncate" style={{color: color}}>{val}</h4>
                </div>
                <p className="text-[10px] text-gray-400 font-medium font-mono mt-2 flex items-center gap-1 truncate">
                    {trend === 'up' && <LucideIcon name="trending-up" size={12} color="#9AA66F" />}
                    {trend === 'down' && <LucideIcon name="trending-down" size={12} color="#D94A3D" />}
                    <span className="w-1.5 h-1.5 rounded-full" style={{backgroundColor: color}}></span>
                    {desc}
                </p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-white" style={{backgroundColor: color + '15'}}>
                <LucideIcon name={icon} size={24} color={color} />
            </div>
        </div>
    </div>
);

function UserGuidePanel({ isOpen, onClose }: any) {
    if (typeof document === 'undefined') return null;
    return createPortal(
        <>
            {/* Backdrop */}
            <div 
                className={`fixed inset-0 z-[190] bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} 
                onClick={onClose}
            />
            {/* Side Panel */}
            <div className={`fixed inset-y-0 right-0 z-[200] w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="p-5 bg-[#2E3338] text-white flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <LucideIcon name="book-open" size={24} color="#D9B036"/>
                        <h3 className="font-bold text-lg font-sans tracking-tight">คู่มือการใช้งาน</h3>
                    </div>
                    <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full transition-colors"><LucideIcon name="x" size={20}/></button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 font-sans">
                    <section>
                        <h4 className="font-bold text-[#D94A3D] text-sm mb-3 flex items-center gap-2 border-b border-gray-200 pb-2">
                            <LucideIcon name="layout-dashboard" size={16}/> Daily Monitor
                        </h4>
                        <ul className="list-disc list-outside ml-4 text-xs text-gray-600 space-y-2 leading-relaxed">
                            <li><strong>แสดงสถานะแบบ Real-time:</strong> หน้าจอนี้ใช้สำหรับดูความคืบหน้าของงานที่กำลังผลิต (Active Jobs) โดยข้อมูลจะถูก Sync มาจากแผนการผลิต</li>
                            <li><strong>Completed Jobs:</strong> งานที่เสร็จสมบูรณ์แล้วจะถูกย้ายไปที่แท็บ "Completed Jobs"</li>
                        </ul>
                    </section>
                    <section>
                        <h4 className="font-bold text-[#D94A3D] text-sm mb-3 flex items-center gap-2 border-b border-gray-200 pb-2">
                            <LucideIcon name="package-open" size={16}/> Packing Queue
                        </h4>
                        <p className="text-xs text-gray-600 mb-2">แสดงรายการสินค้าที่ผ่านขั้นตอนการตัด/ลอก (Cutting/Peeling) แล้ว และกำลังรอเข้าสู่กระบวนการแพ็ค</p>
                        <ul className="list-disc list-outside ml-4 text-xs text-gray-600 space-y-2 leading-relaxed">
                            <li><strong>Ready to Pack:</strong> จำนวนที่พร้อมแพ็ค (Waiting)</li>
                            <li><strong>Progress:</strong> แสดงความคืบหน้าของการแพ็คเทียบกับเป้าหมาย</li>
                        </ul>
                    </section>
                </div>
                <div className="p-4 bg-gray-50 border-t text-center text-[10px] text-gray-400 font-mono">
                    MEAT PRO MES V2.0
                </div>
            </div>
        </>,
        document.body
    );
}

function CompactStageCell({ stageKey, label, currentCount, totalTarget, prevStageCount, isFirstStage, lastUpdate, color }: any) {
    const maxPossible = isFirstStage ? totalTarget : prevStageCount;
    const percentage = totalTarget > 0 ? Math.round((currentCount / totalTarget) * 100) : 0;
    const isCompleted = percentage === 100;
    
    return (
        <div className="flex flex-col items-center justify-center relative group/cell h-full px-1 cursor-default font-sans border-l border-gray-100 first:border-l-0">
            <div className={`text-xs font-bold mb-1 ${isCompleted ? 'text-green-600' : 'text-gray-700'}`}>
                {currentCount}
            </div>

            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mb-1 relative">
                <div 
                    className="h-full transition-all duration-500 absolute top-0 left-0"
                    style={{ 
                        width: `${percentage}%`,
                        backgroundColor: isCompleted ? '#16a34a' : (percentage > 0 ? color : 'transparent') 
                    }}
                />
            </div>

            {/* Tooltip */}
            {lastUpdate ? (
                <div className="absolute bottom-full mb-2 hidden group-hover/cell:flex flex-col items-center z-50 w-max pointer-events-none animate-fadeIn">
                    <div className="bg-[#323640]/95 backdrop-blur text-white text-xs rounded-md shadow-xl p-2 flex flex-col gap-1 items-center border border-white/10">
                        <span className="font-bold text-[#D9B036] uppercase tracking-wide">{label} Update</span>
                        <span className="text-[10px] text-gray-300 flex items-center gap-1 font-mono">
                            <LucideIcon name="clock" size={10} /> {lastUpdate}
                        </span>
                    </div>
                    <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-[#323640]/95 mx-auto"></div>
                </div>
            ) : (
                 <div className="absolute bottom-full mb-2 hidden group-hover/cell:flex flex-col items-center z-50 w-max pointer-events-none animate-fadeIn">
                    <div className="bg-gray-800 text-white text-[9px] rounded px-2 py-1 opacity-70">
                        Waiting for update
                    </div>
                    <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-gray-800 mx-auto"></div>
                </div>
            )}
        </div>
    );
}

function OrderRow({ order }: { order: ProductionTrackingItem }) {
    const overallProgress = order.totalBatches > 0 
        ? Math.round((order.stages.warehouse / order.totalBatches) * 100) 
        : 0;

    const latestUpdate = useMemo(() => {
        if (!order.stageUpdates) return null;
        const entries = Object.entries(order.stageUpdates);
        if (entries.length === 0) return null;
        entries.sort((a, b) => b[1].localeCompare(a[1]));
        return { time: entries[0][1], stage: entries[0][0] };
    }, [order.stageUpdates]);

    return (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/60 hover:shadow-md transition-all duration-300 mb-3 p-0 grid grid-cols-12 items-stretch group hover:bg-white font-sans overflow-hidden min-h-[80px] relative hover:z-20">
            <div className="col-span-3 border-r border-gray-100 p-4 flex flex-col justify-center rounded-l-xl">
                <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-bold font-mono">
                        {order.id}
                    </span>
                    <span className="text-[10px] text-gray-400 flex items-center gap-1 font-sans">
                       <LucideIcon name="user" size={10} /> {order.client}
                    </span>
                </div>
                <h3 className="text-sm font-bold truncate leading-tight mb-1 font-sans group-hover:text-[#D94A3D] transition-colors" style={{color: '#D94A3D'}}>
                    {order.sku}
                </h3>
                <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                    <div className="flex items-center gap-1">
                        <LucideIcon name="target" size={12} color="#A6374B"/>
                        <span className="font-semibold font-sans">{order.totalBatches} Batches</span>
                    </div>
                    {latestUpdate && (
                        <div className="group/time relative cursor-help">
                            <div className="flex items-center gap-1 text-[10px] text-gray-400 font-sans bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                                <LucideIcon name="clock" size={10} />
                                <span>{latestUpdate.time}</span>
                            </div>
                            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 hidden group-hover/time:block z-50 w-max pointer-events-none animate-fadeIn">
                                <div className="bg-black text-white text-[9px] px-2 py-1 rounded shadow-lg capitalize">Latest: {latestUpdate.stage}</div>
                                <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-black mx-auto"></div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <div className="col-span-8 grid grid-cols-7 h-full">
                {STAGES.map((stage, index) => {
                    const prevStageKey = index > 0 ? STAGES[index - 1].key : null;
                    const prevStageCount = prevStageKey ? (order.stages as any)[prevStageKey] : order.totalBatches;
                    const stageUpdate = order.stageUpdates ? order.stageUpdates[stage.key] : null;

                    return (
                        <CompactStageCell 
                            key={stage.key}
                            stageKey={stage.key}
                            label={stage.label}
                            color={stage.color}
                            currentCount={(order.stages as any)[stage.key]}
                            totalTarget={order.totalBatches}
                            prevStageCount={prevStageCount}
                            isFirstStage={index === 0}
                            lastUpdate={stageUpdate}
                        />
                    );
                })}
            </div>
            <div className="col-span-1 flex flex-col items-center justify-center border-l border-gray-100 bg-gray-50/30 rounded-r-xl">
                <div className="relative w-12 h-12 flex items-center justify-center">
                   <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path className="text-gray-200" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                        <path className="transition-all duration-1000 ease-out" 
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                            fill="none" 
                            stroke={overallProgress === 100 ? '#16a34a' : '#D9B036'} 
                            strokeWidth="3" 
                            strokeDasharray={`${overallProgress}, 100`} 
                        />
                    </svg>
                    <span className="absolute text-[10px] font-bold text-gray-700 font-sans">{overallProgress}%</span>
                </div>
            </div>
        </div>
    );
}

function DailyMonitor({ data }: { data: ProductionTrackingItem[] }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [subTab, setSubTab] = useState('In Progress'); 
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);

    const filteredData = useMemo(() => {
        let res = data.filter(d => d.status !== 'Completed');
        
        if (subTab === 'Not Started') res = res.filter(d => d.status === 'Pending');
        else if (subTab === 'In Progress') res = res.filter(d => d.status === 'In Progress');

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            res = res.filter(d => d.sku.toLowerCase().includes(q) || d.id.toLowerCase().includes(q) || d.client.toLowerCase().includes(q));
        }
        return res;
    }, [data, subTab, searchQuery]);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentOrders = filteredData.slice(indexOfFirstItem, indexOfLastItem);

    useEffect(() => setCurrentPage(1), [subTab, searchQuery]);

    const SUB_TABS = [
        { id: 'All', label: 'All Active', count: data.filter(d => d.status !== 'Completed').length },
        { id: 'Not Started', label: 'Not Started', count: data.filter(d => d.status === 'Pending').length },
        { id: 'In Progress', label: 'In Progress', count: data.filter(d => d.status === 'In Progress').length },
    ];
    
    return (
        <div className="flex flex-col h-full overflow-hidden animate-fadeIn relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 shrink-0 mb-6 px-1">
                <KPICard title="Total Planned" val={`${data.reduce((s,o)=>s+o.totalBatches,0)} Batches`} color="#D94A3D" icon="target" desc="Target Output" />
                <KPICard title="Pending Start" val={`${data.filter(o=>o.status==='Pending').length} Orders`} color="#64748B" icon="clock" desc="Waiting Queue" />
                <KPICard title="In Progress" val={`${data.filter(o=>o.status==='In Progress').length} Orders`} color="#5185A6" icon="activity" desc="On Production Line" />
                <KPICard title="Total WIP" val={`${data.reduce((s,o)=>s+(o.stages.cutting - o.stages.packing), 0)} Batches`} color="#D9B036" icon="layers" desc="Waiting for Packing" />
            </div>

            <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
                <div className="px-6 py-4 border-b border-gray-200/50 flex flex-col md:flex-row justify-between items-center bg-white/40 shrink-0 gap-4">
                    <div className="flex bg-gray-100/80 p-1 rounded-xl border border-gray-200 shadow-inner w-full md:w-auto overflow-x-auto no-scrollbar">
                        {SUB_TABS.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setSubTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                                    subTab === tab.id 
                                    ? 'bg-white text-[#D94A3D] shadow-sm' 
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                                }`}
                            >
                                {tab.label}
                                <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${
                                    subTab === tab.id ? 'bg-[#D94A3D]/10 text-[#D94A3D]' : 'bg-gray-200 text-gray-400'
                                }`}>
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </div>
                    <div className="relative w-full md:w-64">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><LucideIcon name="search" size={14} /></div>
                        <input type="text" placeholder="Search Active Order..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-gray-200 focus:outline-none focus:border-[#D9B036] bg-white/60 font-sans" />
                    </div>
                </div>

                <div className="grid grid-cols-12 gap-4 px-3 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-gray-50/80 border-b border-gray-200/50 shrink-0 font-sans backdrop-blur-sm z-20">
                    <div className="col-span-3 pl-4">Order / Product Info</div>
                    <div className="col-span-8 grid grid-cols-7 text-center">
                        {STAGES.map(s => (
                            <div key={s.key} className="flex items-center justify-center gap-1">
                                <LucideIcon name={s.icon} size={12} /> <span className="hidden xl:inline">{s.label}</span>
                            </div>
                        ))}
                    </div>
                    <div className="col-span-1 text-center">Progress</div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar bg-gray-50/30">
                    {currentOrders.map(order => (
                        <OrderRow key={order.id} order={order} />
                    ))}
                    <div className="h-4"></div>
                </div>
            </div>
        </div>
    );
}

function PackingQueueBoard({ data }: { data: ProductionTrackingItem[] }) {
    const queueItems = data.filter(d => 
        d.status !== 'Completed' && 
        (d.stages.cutting > d.stages.packing)
    ).map(item => ({
        ...item,
        readyToPack: item.stages.cutting - item.stages.packing,
        packed: item.stages.packing
    }));

    return (
        <div className="h-full flex flex-col animate-fadeIn font-sans">
             <div className="mb-6 flex justify-between items-end shrink-0">
                <div>
                    <h2 className="text-xl font-bold text-[#323640] flex items-center gap-2">
                        <LucideIcon name="package-open" size={24} color="#D9B036" /> PACKING QUEUE
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">รายการสินค้าที่ผ่านขั้นตอนการตัด/ลอก (Cutting/Peeling) แล้ว และกำลังรอเข้าสู่กระบวนการแพ็ค</p>
                </div>
                <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm text-xs font-bold text-gray-600">
                    Pending Items: <span className="text-[#D9B036] text-lg ml-1">{queueItems.length}</span>
                </div>
             </div>

             <div className="flex-1 overflow-y-auto custom-scrollbar pb-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                     {queueItems.map(item => (
                         <div key={item.id} className="card-hover bg-white rounded-xl border border-gray-200 p-4 flex flex-col relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                             <div className="absolute top-0 left-0 w-1.5 h-full bg-[#D9B036]"></div>
                             <div className="flex justify-between items-start mb-2 pl-3">
                                 <span className="text-[10px] font-bold text-gray-400 font-mono">{item.id}</span>
                                 <span className="text-[10px] bg-yellow-50 text-yellow-600 px-2 py-0.5 rounded border border-yellow-100 font-bold uppercase">Ready to Pack</span>
                             </div>
                             <h4 className="font-bold text-gray-800 text-sm mb-4 pl-3 truncate" title={item.sku}>{item.sku}</h4>
                             
                             <div className="grid grid-cols-2 gap-2 pl-3">
                                 <div className="bg-gray-50 p-2 rounded border border-gray-100 text-center">
                                     <span className="block text-[9px] text-gray-400 uppercase">Ready</span>
                                     <span className="block text-xl font-black text-[#D9B036]">{item.readyToPack}</span>
                                 </div>
                                 <div className="bg-gray-50 p-2 rounded border border-gray-100 text-center">
                                     <span className="block text-[9px] text-gray-400 uppercase">Packed</span>
                                     <span className="block text-xl font-bold text-gray-600">{item.packed}</span>
                                 </div>
                             </div>
                             
                             <div className="mt-4 pl-3 pt-3 border-t border-gray-100 flex justify-between items-center text-[10px] text-gray-400">
                                 <span>Total Target: {item.totalBatches}</span>
                                 <span className="text-blue-500 font-bold">{Math.round((item.packed/item.totalBatches)*100)}% Done</span>
                             </div>
                         </div>
                     ))}
                     {queueItems.length === 0 && (
                        <div className="col-span-full h-64 flex flex-col items-center justify-center text-gray-300 opacity-50">
                            <LucideIcon name="check-circle" size={60} className="mb-4 text-green-200"/>
                            <span>All processed items have been packed.</span>
                        </div>
                     )}
                 </div>
             </div>
        </div>
    );
}

function CompletedBoard({ data }: { data: ProductionTrackingItem[] }) {
    const completedItems = data.filter(d => d.status === 'Completed');

    return (
        <div className="h-full flex flex-col animate-fadeIn font-sans">
             <div className="mb-6 flex justify-between items-end shrink-0">
                <div>
                    <h2 className="text-xl font-bold text-[#323640] flex items-center gap-2">
                        <LucideIcon name="archive" size={24} color="#9AA66F" /> COMPLETED JOBS
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">รายการผลิตที่เสร็จสิ้นและส่งเข้าคลังสินค้าแล้ว</p>
                </div>
                <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm text-xs font-bold text-gray-600">
                    Total Finished: <span className="text-green-600 text-lg ml-1">{completedItems.length}</span>
                </div>
             </div>

             <div className="flex-1 overflow-y-auto custom-scrollbar pb-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                     {completedItems.map(item => (
                         <div key={item.id} className="card-hover bg-white rounded-xl border border-gray-200 p-4 flex flex-col relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                             <div className="absolute top-0 left-0 w-1.5 h-full bg-[#9AA66F]"></div>
                             <div className="flex justify-between items-start mb-2 pl-3">
                                 <span className="text-[10px] font-bold text-gray-400 font-mono">{item.id}</span>
                                 <span className="text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded border border-green-100 font-bold uppercase">Finished</span>
                             </div>
                             <h4 className="font-bold text-gray-800 text-sm mb-3 pl-3 truncate" title={item.sku}>{item.sku}</h4>
                             
                             <div className="pl-3 mb-3">
                                 <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                                     <LucideIcon name="package-check" size={14} className="text-green-500"/>
                                     <span>Total Output: <b className="text-gray-800">{item.totalBatches}</b> Batches</span>
                                 </div>
                                 <div className="flex items-center gap-2 text-[10px] text-gray-400">
                                     <LucideIcon name="clock" size={12}/>
                                     <span>Finished: {item.lastUpdated || 'Unknown'}</span>
                                 </div>
                             </div>

                             <div className="mt-auto pl-3 pt-3 border-t border-gray-100">
                                 <button className="w-full py-1.5 rounded border border-gray-200 text-gray-500 text-[10px] font-bold hover:bg-gray-50 hover:text-gray-700 transition-colors flex items-center justify-center gap-2">
                                     <LucideIcon name="file-text" size={12}/> View Summary
                                 </button>
                             </div>
                         </div>
                     ))}
                     {completedItems.length === 0 && (
                        <div className="col-span-full h-64 flex flex-col items-center justify-center text-gray-300 opacity-50">
                            <span>No completed jobs yet today.</span>
                        </div>
                     )}
                 </div>
             </div>
        </div>
    );
}

export const ProductionTracking: React.FC = () => {
    const [activeTab, setActiveTab] = useState('monitor');
    const [orders, setOrders] = useState<ProductionTrackingItem[]>([]);
    const [showGuide, setShowGuide] = useState(false);
    const [loading, setLoading] = useState(true);

    // Load Data
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const data = await fetchSheetData<ProductionTrackingItem>(SHEET_NAMES.PRODUCTION_TRACKING);
            if(data && data.length > 0) {
                setOrders(data);
            } else {
                // Initial Seed if Empty
                const initialData = INITIAL_ORDERS;
                setOrders(initialData);
                // Save Initial Structure
                const headers = ['id', 'sku', 'client', 'totalBatches', 'stages', 'stageUpdates', 'status', 'lastUpdated'];
                saveSheetData(SHEET_NAMES.PRODUCTION_TRACKING, initialData, headers);
            }
            setLoading(false);
        };
        load();
    }, []);

    if(loading) return <div className="flex h-full items-center justify-center"><LucideIcon name="loader-2" size={40} className="animate-spin text-[#D94A3D]" /></div>;

    return (
        <div className="flex h-screen flex-col font-sans overflow-hidden bg-[#D9D7D8]">
            
            <UserGuidePanel isOpen={showGuide} onClose={() => setShowGuide(false)} />

            {/* Header Bar */}
            <div className="px-8 py-6 flex flex-col md:flex-row justify-between items-center gap-6 flex-shrink-0 z-10 animate-fade-in bg-[#D9D7D8]/50 backdrop-blur-sm">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-[#D94A3D] text-white shadow-lg flex-shrink-0 border border-white/20">
                        <LucideIcon name="activity" size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-[#323640] tracking-tight uppercase leading-none">PRODUCTION TRACKING</h1>
                        <p className="text-[#64748B] text-xs mt-1 font-sans">ระบบติดตามการผลิตและตรวจสอบความผิดปกติประจำวัน</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    {/* Main Tabs */}
                    <div className="flex bg-[#999798] p-1 rounded-md border border-white/5 shadow-inner w-fit flex-shrink-0 backdrop-blur-sm">
                        <button onClick={() => setActiveTab('monitor')} className={`px-6 py-2.5 rounded-sm text-sm font-bold transition-all duration-300 flex items-center gap-2 whitespace-nowrap font-mono uppercase tracking-wider ${activeTab === 'monitor' ? 'bg-[#D94A3D] text-white shadow-md transform scale-100' : 'text-white/70 hover:text-white hover:bg-white/10'}`}>
                            <LucideIcon name="layout-dashboard" size={16} /> Daily Monitor
                        </button>
                        <button onClick={() => setActiveTab('packing_queue')} className={`px-6 py-2.5 rounded-sm text-sm font-bold transition-all duration-300 flex items-center gap-2 whitespace-nowrap font-mono uppercase tracking-wider ${activeTab === 'packing_queue' ? 'bg-[#D94A3D] text-white shadow-md transform scale-100' : 'text-white/70 hover:text-white hover:bg-white/10'}`}>
                            <LucideIcon name="package-open" size={16} /> Packing Queue
                        </button>
                        <button onClick={() => setActiveTab('completed')} className={`px-6 py-2.5 rounded-sm text-sm font-bold transition-all duration-300 flex items-center gap-2 whitespace-nowrap font-mono uppercase tracking-wider ${activeTab === 'completed' ? 'bg-[#D94A3D] text-white shadow-md transform scale-100' : 'text-white/70 hover:text-white hover:bg-white/10'}`}>
                            <LucideIcon name="archive" size={16} /> Completed
                        </button>
                    </div>
                    
                    {/* Help Button */}
                    <button onClick={() => setShowGuide(true)} className="p-2 text-gray-500 hover:text-[#D94A3D] transition-all opacity-80 hover:opacity-100" title="User Guide">
                        <LucideIcon name="help-circle" size={24} />
                    </button>
                </div>
            </div>

            <main className="flex-1 overflow-y-auto px-8 pb-8 flex flex-col relative z-10 custom-scrollbar">
                {activeTab === 'monitor' && <DailyMonitor data={orders} />}
                {activeTab === 'packing_queue' && <PackingQueueBoard data={orders} />}
                {activeTab === 'completed' && <CompletedBoard data={orders} />}
            </main>
        </div>
    );
}