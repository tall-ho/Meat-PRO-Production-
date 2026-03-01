import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import * as LucideIcons from 'lucide-react';
import { fetchSheetData, saveSheetData } from '../services/sheetService';
import { SHEET_NAMES } from '../constants';
import { MixingBatch } from '../types';

const Swal = (window as any).Swal;

// --- CONSTANTS ---
const THEME = { primary: '#C22D2E', secondary: '#BB8588', accent: '#DCBC1B', success: '#537E72', info: '#55738D' };

const PROCESS_FLOW = [
    { id: 'mixing', label: 'Mixing', icon: 'chef-hat', duration: 15 },
    { id: 'forming', label: 'Forming', icon: 'component', duration: 15 },
    { id: 'steaming', label: 'Steaming', icon: 'thermometer', duration: 30 },
    { id: 'cooling', label: 'Cooling', icon: 'snowflake', duration: 20 },
    { id: 'peeling', label: 'Peeling', icon: 'layers', duration: 10 },
    { id: 'cutting', label: 'Cutting', icon: 'scissors', duration: 15 } 
];

const BASE_PRODUCTS = [
    { code: 'SFG-SMC-001', name: 'SFG Smoked Sausage (Standard)', type: 'Sausage', stdBatchesPerSet: 6 }, 
    { code: 'SFG-MTB-002', name: 'SFG Pork Meatball Grade A', type: 'Meatball', stdBatchesPerSet: 6 },
    { code: 'SFG-BOL-004', name: 'SFG Chili Bologna Bar', type: 'Bologna', stdBatchesPerSet: 4 },
    { code: 'SFG-CHE-009', name: 'SFG Cheese Sausage Lava', type: 'Sausage', stdBatchesPerSet: 6 },
    { code: 'SFG-CKN-010', name: 'SFG Chicken Jor (Tofu Skin)', type: 'Sausage', stdBatchesPerSet: 6 }
];

const MOCK_WAITING_SFG = [
    { id: 'W-001', code: 'SFG-SMC-001', name: 'SFG Smoked Sausage (Standard)', batchSet: 'SET #105', steamingFinish: new Date(Date.now() - 1000 * 60 * 60 * 4.5).toISOString(), cuttingFinish: null, weight: 450, location: 'Cooling Room A' },
    { id: 'W-002', code: 'SFG-BOL-004', name: 'SFG Chili Bologna Bar', batchSet: 'SET #88', steamingFinish: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), cuttingFinish: new Date(Date.now() - 1000 * 60 * 60 * 1.5).toISOString(), weight: 300, location: 'Buffer Zone 2' },
    { id: 'W-004', code: 'SFG-SMC-001', name: 'SFG Smoked Sausage (Standard)', batchSet: 'SET #106', steamingFinish: new Date(Date.now() - 1000 * 60 * 60 * 1.2).toISOString(), cuttingFinish: null, weight: 450, location: 'Cooling Room A' },
    { id: 'W-005', code: 'SFG-MTB-002', name: 'SFG Pork Meatball Grade A', batchSet: 'SET #112', steamingFinish: new Date(Date.now() - 1000 * 60 * 45).toISOString(), cuttingFinish: null, weight: 500, location: 'Cooling Room B' },
];

const MOCK_BATCHES: MixingBatch[] = [
    { id: 'SMC-8821', jobId: 'JOB-001', name: 'SFG Smoked Sausage (Standard)', step: 'mixing', status: 'Processing', timeLeft: 300, startTime: '08:00', setNo: 1 },
    { id: 'SMC-8822', jobId: 'JOB-001', name: 'SFG Smoked Sausage (Standard)', step: 'mixing', status: 'Processing', timeLeft: 300, startTime: '08:00', setNo: 1 },
    { id: 'SMC-8823', jobId: 'JOB-001', name: 'SFG Smoked Sausage (Standard)', step: 'mixing', status: 'Processing', timeLeft: 300, startTime: '08:00', setNo: 1 },
    { id: 'MTB-1102', jobId: 'JOB-002', name: 'SFG Pork Meatball Grade A', step: 'forming', status: 'Waiting', timeLeft: 900, startTime: '09:30', setNo: 2 }
];

// Helper Components
const LucideIcon = ({ name, size = 16, className = "", color, style }: any) => {
    const iconName = name.split('-').map((part: string) => part.charAt(0).toUpperCase() + part.slice(1)).join('');
    const IconComponent = (LucideIcons as any)[iconName] || (LucideIcons as any)[name] || LucideIcons.HelpCircle;
    return <IconComponent size={size} className={className} style={{...style, color: color}} />;
};

const KPICard = ({ title, val, color, icon, desc }: any) => (
    <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-soft hover:shadow-lg transition-all duration-500 border border-white/50 relative overflow-hidden group h-full hover:-translate-y-1">
        <div className="absolute -right-8 -bottom-8 opacity-[0.08] transform rotate-[15deg] group-hover:scale-110 group-hover:opacity-[0.15] group-hover:rotate-[5deg] transition-all duration-700 pointer-events-none z-0">
            <LucideIcon name={icon} size={140} color={color} />
        </div>
        <div className="relative z-10 flex justify-between items-start">
            <div className="flex-1 min-w-0 flex flex-col gap-1">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest font-mono opacity-90 truncate" title={title}>{title}</p>
                <div className="flex items-baseline gap-2 mt-1">
                    <h4 className="text-3xl font-black tracking-tight font-mono leading-tight truncate drop-shadow-sm" style={{color: color}}>{val}</h4>
                </div>
                {desc && (
                    <p className="text-[10px] text-[#55738D] font-medium font-sans mt-2 flex items-center gap-1.5 truncate">
                        <span className="w-2 h-2 rounded-sm" style={{backgroundColor: color}}></span>
                        {desc}
                    </p>
                )}
            </div>
            <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0 shadow-sm border border-white/80 group-hover:shadow-md transition-all duration-300 bg-gradient-to-br from-white/80 to-transparent" style={{backgroundColor: color + '15'}}>
                <LucideIcon name={icon} size={24} color={color} />
            </div>
        </div>
    </div>
);

const UserGuidePanel = ({ isOpen, onClose }: any) => {
    if (typeof document === 'undefined') return null;
    return createPortal(
        <>
            <div 
                className={`fixed inset-0 z-[190] bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} 
                onClick={onClose}
            />
            <div className={`fixed inset-y-0 right-0 z-[200] w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="p-5 bg-[#2E3338] text-white flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3"><LucideIcon name="book-open" size={24} style={{color:'#DCBC1B'}}/><h3 className="font-bold text-lg font-sans tracking-tight">คู่มือการใช้งาน</h3></div>
                    <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full transition-colors"><LucideIcon name="x" size={20}/></button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 font-sans">
                    <div className="space-y-2">
                        <h4 className="text-sm font-bold text-[#2E3338] flex items-center gap-2 border-b pb-2"><span className="w-5 h-5 rounded bg-[#C22D2E] text-white flex items-center justify-center text-[10px]">1</span> Overview (ภาพรวม)</h4>
                        <p className="text-xs text-gray-500 pl-7">หน้านี้แสดงแผนการผลิต SFG ประจำวัน โดยข้อมูลจะ <strong>Sync อัตโนมัติ</strong> มาจากไฟล์แผนผลิต</p>
                    </div>
                    <div className="space-y-2">
                        <h4 className="text-sm font-bold text-[#2E3338] flex items-center gap-2 border-b pb-2"><span className="w-5 h-5 rounded bg-[#DCBC1B] text-white flex items-center justify-center text-[10px]">2</span> Batter &rarr; SFG (การผลิต)</h4>
                        <p className="text-xs text-gray-500 pl-7">หน้าจอสำหรับควบคุมการผลิตและปล่อยงาน (Release Job)</p>
                        <ul className="list-disc list-inside text-xs text-gray-500 pl-7 space-y-1">
                            <li>เลือก <strong>Base Product Selection</strong> (Dropdown จะแสดงเฉพาะสินค้าที่มีในแผนวันนี้)</li>
                            <li>ระบุจำนวน Sets ที่จะผสม</li>
                            <li>กด <strong>START JOB</strong> เพื่อเริ่มขั้นตอนการผสม</li>
                        </ul>
                    </div>
                    <div className="space-y-2">
                        <h4 className="text-sm font-bold text-[#2E3338] flex items-center gap-2 border-b pb-2"><span className="w-5 h-5 rounded bg-[#55738D] text-white flex items-center justify-center text-[10px]">3</span> SFG Waiting (รอแพ็ค)</h4>
                        <p className="text-xs text-gray-500 pl-7">แสดงรายการสินค้าที่ผลิตเสร็จแล้วและกำลังรอส่งไปบรรจุ</p>
                    </div>
                </div>
                <div className="bg-gray-50 px-6 py-4 flex justify-end border-t border-gray-100">
                    <button onClick={onClose} className="px-6 py-2 bg-[#2E3338] text-white rounded-lg text-xs font-bold hover:bg-gray-800 transition-colors shadow-sm">ปิด (Close)</button>
                </div>
            </div>
        </>,
        document.body
    );
};

const QrCodeModal = ({ isOpen, onClose, data }: any) => {
    if (!isOpen || !data) return null;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=BATCH:${data.items[0].id}`;
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
            <DraggableModalWrapper className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden transform scale-100 transition-all">
                <div className="p-6 text-center">
                    <div className="w-16 h-16 bg-[#2E3338] rounded-full flex items-center justify-center mx-auto mb-4 text-white shadow-lg"><LucideIcon name="qr-code" size={32} /></div>
                    <h3 className="text-xl font-bold text-[#2E395F] mb-1">Scan to Operate</h3>
                    <p className="text-xs text-gray-400 mb-6">Use mobile device to scan this code</p>
                    <div className="bg-white p-4 rounded-xl border-2 border-dashed border-gray-300 inline-block mb-6 relative group">
                        <img src={qrUrl} alt="QR Code" className="w-48 h-48 mix-blend-multiply opacity-90 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="text-left bg-gray-50 p-3 rounded-lg text-xs border border-gray-100 font-sans">
                        <div className="flex justify-between mb-1"><span className="text-gray-400">Set No:</span><span className="font-bold">{data.setNo}</span></div>
                        <div className="flex justify-between mb-1"><span className="text-gray-400">Product:</span><span className="font-bold truncate max-w-[150px]">{data.productName}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Items:</span><span className="font-bold">{data.items.length} Batches</span></div>
                    </div>
                </div>
                <div className="p-4 bg-gray-50 text-center border-t border-gray-100"><button onClick={onClose} className="text-gray-400 hover:text-[#C22D2E] text-sm font-bold">Close</button></div>
            </DraggableModalWrapper>
        </div>
    );
};

const BatchDetailModal = ({ sfg, onClose }: any) => {
    if (!sfg) return null;
    const batchCount = Math.ceil(sfg.weight / 150);
    const batches = Array.from({ length: batchCount }, (_, i) => ({
        id: i + 1,
        weight: (sfg.weight / batchCount).toFixed(1),
        temp: (4 + Math.random()).toFixed(1),
        qc: 'Pass',
        time: new Date(new Date(sfg.steamingFinish).getTime() + (i * 15 * 60000)).toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'})
    }));

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
            <DraggableModalWrapper className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                <div className="p-5 bg-[#2E3338] text-white flex justify-between items-center shrink-0">
                    <div><h3 className="font-bold text-lg flex items-center gap-2"><LucideIcon name="layers" size={20} /> Batch Details: {sfg.batchSet}</h3><p className="text-xs text-gray-300 mt-1">{sfg.name}</p></div>
                    <button onClick={onClose} className="hover:text-white/80 transition-colors"><LucideIcon name="x" size={24}/></button>
                </div>
                <div className="p-6 overflow-y-auto custom-scrollbar font-sans">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-200"><p className="text-[10px] uppercase text-gray-400 font-bold">Total Weight</p><p className="text-2xl font-black text-[#2E3338]">{sfg.weight} <span className="text-sm font-medium text-gray-500">Kg</span></p></div>
                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-200"><p className="text-[10px] uppercase text-gray-400 font-bold">Location</p><p className="text-2xl font-black text-[#2E3338]">{sfg.location}</p></div>
                    </div>
                    <h4 className="text-sm font-bold text-[#2E3338] mb-3 flex items-center gap-2 border-b pb-2"><LucideIcon name="list" size={16}/> Batch List</h4>
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-100 text-gray-600 font-bold uppercase text-[10px]"><tr><th className="p-3 rounded-l-lg">Batch #</th><th className="p-3 text-right">Weight (Kg)</th><th className="p-3 text-center">Core Temp (°C)</th><th className="p-3 text-center">Finish Time</th><th className="p-3 rounded-r-lg text-center">QC</th></tr></thead>
                        <tbody className="divide-y divide-gray-100">
                            {batches.map(b => (
                                <tr key={b.id} className="hover:bg-gray-50"><td className="p-3 font-mono font-bold text-[#2E3338]">#{b.id}</td><td className="p-3 text-right font-mono">{b.weight}</td><td className="p-3 text-center font-mono">{b.temp}</td><td className="p-3 text-center text-gray-500">{b.time}</td><td className="p-3 text-center"><span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold">PASS</span></td></tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 bg-gray-50 border-t border-gray-100 text-right"><button onClick={onClose} className="px-4 py-2 bg-[#2E3338] text-white rounded-lg text-sm font-bold hover:bg-gray-800 transition-colors shadow-sm">Close</button></div>
            </DraggableModalWrapper>
        </div>
    );
};

// --- SUB-COMPONENTS ---

const SFGWaitingView = () => {
    const [now, setNow] = useState(new Date());
    const [selectedSFG, setSelectedSFG] = useState(null);
    useEffect(() => { const interval = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(interval); }, []);
    
    const formatDelay = (isoTime: string) => { 
        if (!isoTime) return { text: '-', isHigh: false }; 
        const finish = new Date(isoTime); 
        const diffMs = now.getTime() - finish.getTime(); 
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60)); 
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)); 
        const isHigh = diffHrs >= 4; 
        return { text: `${diffHrs}h ${diffMins}m`, isHigh }; 
    };

    return (
        <div className="w-full h-full font-sans animate-fadeIn flex flex-col">
            {selectedSFG && <BatchDetailModal sfg={selectedSFG} onClose={() => setSelectedSFG(null)} />}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col flex-1">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center shrink-0">
                    <h3 className="font-bold text-[#2E3338] flex items-center gap-2"><LucideIcon name="package-open" size={20} color="#C22D2E" /> SFG Waiting for Packing</h3>
                    <span className="text-xs text-gray-500 flex items-center gap-1"><LucideIcon name="refresh-ccw" size={12} /> Auto-refresh delay times</span>
                </div>
                <div className="overflow-x-auto flex-1 custom-scrollbar">
                    <table className="w-full text-left">
                        <thead className="sticky top-0 z-10"><tr>
                            <th className="text-[11px] uppercase tracking-[0.05em] text-white px-4 py-3 font-bold bg-[#2E3338] border-b-2 border-[#C22D2E] whitespace-nowrap pl-6">SFG Code</th>
                            <th className="text-[11px] uppercase tracking-[0.05em] text-white px-4 py-3 font-bold bg-[#2E3338] border-b-2 border-[#C22D2E] whitespace-nowrap">Product Name</th>
                            <th className="text-[11px] uppercase tracking-[0.05em] text-white px-4 py-3 font-bold bg-[#2E3338] border-b-2 border-[#C22D2E] whitespace-nowrap text-center">Batch Set</th>
                            <th className="text-[11px] uppercase tracking-[0.05em] text-white px-4 py-3 font-bold bg-[#2E3338] border-b-2 border-[#C22D2E] whitespace-nowrap text-center">Location</th>
                            <th className="text-[11px] uppercase tracking-[0.05em] text-white px-4 py-3 font-bold bg-[#2E3338] border-b-2 border-[#C22D2E] whitespace-nowrap text-right">Weight (Kg)</th>
                            <th className="text-[11px] uppercase tracking-[0.05em] text-white px-4 py-3 font-bold bg-[#2E3338] border-b-2 border-[#C22D2E] whitespace-nowrap text-center">Delay (Steam)</th>
                            <th className="text-[11px] uppercase tracking-[0.05em] text-white px-4 py-3 font-bold bg-[#2E3338] border-b-2 border-[#C22D2E] whitespace-nowrap text-center">Status</th>
                        </tr></thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {MOCK_WAITING_SFG.map((item) => {
                                const delaySteam = formatDelay(item.steamingFinish);
                                return (
                                    <tr key={item.id} onClick={() => setSelectedSFG(item)} className="hover:bg-blue-50/50 transition-colors cursor-pointer group">
                                        <td className="px-4 py-3 pl-6 font-bold text-gray-600 font-mono group-hover:text-[#C22D2E] transition-colors">{item.code}</td>
                                        <td className="px-4 py-3 font-bold text-[#2E395F]">{item.name}</td>
                                        <td className="px-4 py-3 text-center text-xs font-mono bg-gray-50 rounded px-1">{item.batchSet}</td>
                                        <td className="px-4 py-3 text-center text-xs text-gray-500">{item.location}</td>
                                        <td className="px-4 py-3 text-right font-mono font-bold text-[#2E3338]">{item.weight}</td>
                                        <td className="px-4 py-3 text-center"><span className={`font-mono font-bold ${delaySteam.isHigh ? 'text-red-500' : 'text-gray-600'}`}>{delaySteam.text}</span></td>
                                        <td className="px-4 py-3 text-center"><span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase border bg-yellow-50 text-yellow-700 border-yellow-200">Waiting</span></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const MixOverview = () => {
    return (
        <div className="w-full h-full font-sans animate-fadeIn flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 shrink-0">
                <KPICard title="Total Daily Plan" val="120 Batches" color={THEME.primary} icon="clipboard-list" desc="Target for Today" />
                <KPICard title="Produced (Finished)" val="45 Batches" color={THEME.success} icon="check-circle" desc="Completed Base" />
                <KPICard title="Work In Process" val="12 Batches" color={THEME.info} icon="activity" desc="On Production Line" />
                <KPICard title="Overall Progress" val="37.5%" color={THEME.accent} icon="pie-chart" desc="Completion Rate" />
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col flex-1">
                 <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-[#2E3338] flex items-center gap-2"><LucideIcon name="calendar-days" size={18} color="#C22D2E" /> Daily SFG Production Plan (Synced)</h3>
                </div>
                <div className="overflow-x-auto flex-1 custom-scrollbar">
                    <table className="w-full text-left">
                        <thead className="sticky top-0 z-10"><tr>
                            <th className="text-[11px] uppercase tracking-[0.05em] text-white px-4 py-3 font-bold bg-[#2E3338] border-b-2 border-[#C22D2E] whitespace-nowrap pl-6">Job ID</th>
                            <th className="text-[11px] uppercase tracking-[0.05em] text-white px-4 py-3 font-bold bg-[#2E3338] border-b-2 border-[#C22D2E] whitespace-nowrap">SFG Name</th>
                            <th className="text-[11px] uppercase tracking-[0.05em] text-white px-4 py-3 font-bold bg-[#2E3338] border-b-2 border-[#C22D2E] whitespace-nowrap text-center">Code</th>
                            <th className="text-[11px] uppercase tracking-[0.05em] text-white px-4 py-3 font-bold bg-[#2E3338] border-b-2 border-[#C22D2E] whitespace-nowrap text-center">Target</th>
                            <th className="text-[11px] uppercase tracking-[0.05em] text-white px-4 py-3 font-bold bg-[#2E3338] border-b-2 border-[#C22D2E] whitespace-nowrap text-center">Produced</th>
                            <th className="text-[11px] uppercase tracking-[0.05em] text-white px-4 py-3 font-bold bg-[#2E3338] border-b-2 border-[#C22D2E] whitespace-nowrap text-center">WIP</th>
                            <th className="text-[11px] uppercase tracking-[0.05em] text-white px-4 py-3 font-bold bg-[#2E3338] border-b-2 border-[#C22D2E] whitespace-nowrap text-center">Progress</th>
                            <th className="text-[11px] uppercase tracking-[0.05em] text-white px-4 py-3 font-bold bg-[#2E3338] border-b-2 border-[#C22D2E] whitespace-nowrap text-center">Status</th>
                        </tr></thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            <tr className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3 pl-6 font-bold text-[#C22D2E] font-mono">JOB-SMC-001</td>
                                <td className="px-4 py-3 font-bold text-gray-700">SFG Smoked Sausage (Standard)</td>
                                <td className="px-4 py-3 text-center text-xs text-gray-500 font-mono">SFG-SMC-001</td>
                                <td className="px-4 py-3 text-center font-mono font-bold">60</td>
                                <td className="px-4 py-3 text-center font-mono font-bold text-green-600">30</td>
                                <td className="px-4 py-3 text-center font-mono font-bold text-blue-600">6</td>
                                <td className="px-4 py-3 text-center w-32"><div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden"><div className="bg-[#C22D2E] h-full rounded-full" style={{ width: `50%` }}></div></div><span className="text-[10px] text-gray-400 mt-1 block font-mono">50%</span></td>
                                <td className="px-4 py-3 text-center"><span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase border bg-blue-50 text-blue-700 border-blue-200">In Progress</span></td>
                            </tr>
                            <tr className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3 pl-6 font-bold text-[#C22D2E] font-mono">JOB-BOL-004</td>
                                <td className="px-4 py-3 font-bold text-gray-700">SFG Chili Bologna Bar</td>
                                <td className="px-4 py-3 text-center text-xs text-gray-500 font-mono">SFG-BOL-004</td>
                                <td className="px-4 py-3 text-center font-mono font-bold">40</td>
                                <td className="px-4 py-3 text-center font-mono font-bold text-green-600">10</td>
                                <td className="px-4 py-3 text-center font-mono font-bold text-blue-600">6</td>
                                <td className="px-4 py-3 text-center w-32"><div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden"><div className="bg-[#C22D2E] h-full rounded-full" style={{ width: `25%` }}></div></div><span className="text-[10px] text-gray-400 mt-1 block font-mono">25%</span></td>
                                <td className="px-4 py-3 text-center"><span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase border bg-blue-50 text-blue-700 border-blue-200">In Progress</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const BaseProductionView = ({ activeBatches, setActiveBatches }: any) => {
    const [baseProduct, setBaseProduct] = useState(BASE_PRODUCTS[0].code);
    const [selectedStep, setSelectedStep] = useState('mixing');
    const [simSpeed, setSimSpeed] = useState(1);
    const [setsInput, setSetsInput] = useState(1);
    const [batchSequence, setBatchSequence] = useState(1);
    const [qrModalOpen, setQrModalOpen] = useState(false);
    const [selectedSetForQr, setSelectedSetForQr] = useState(null);

    // Simulated Timer Logic (Runs locally to avoid API spam)
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveBatches((current: MixingBatch[]) => {
                return current.map(b => {
                    if (b.status === 'Processing' && b.timeLeft > 0) {
                        const newTime = Math.max(0, b.timeLeft - (1 * simSpeed));
                        if (newTime === 0) {
                            // Move to next step logic would go here in full implementation
                            // For demo, we just stop at 0
                            return { ...b, timeLeft: 0, status: 'Completed' as const };
                        }
                        return { ...b, timeLeft: newTime };
                    }
                    return b;
                });
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [simSpeed, setActiveBatches]);

    const handleStart = () => {
        if (setsInput <= 0) { if(Swal) Swal.fire('Error', 'Please enter quantity > 0', 'warning'); return; }
        const product = BASE_PRODUCTS.find(p => p.code === baseProduct);
        if (!product) return;
        const firstStep = PROCESS_FLOW[0];
        const nowStr = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
        
        const stdBatchesPerSet = product.stdBatchesPerSet;
        const batchesToRelease = setsInput * stdBatchesPerSet;

        const newBatches: MixingBatch[] = Array.from({ length: batchesToRelease }, (_, i) => ({
            id: `${product.code.split('-')[1]}-${String(Math.floor(Math.random()*10000)).padStart(4,'0')}`,
            jobId: 'JOB-NEW',
            name: product.name,
            step: firstStep.id,
            status: 'Processing',
            timeLeft: firstStep.duration * 60,
            startTime: nowStr,
            setNo: Math.ceil((batchSequence + i) / stdBatchesPerSet) 
        }));
        
        const updatedBatches = [...activeBatches, ...newBatches];
        setActiveBatches(updatedBatches);
        setBatchSequence(prev => prev + batchesToRelease);
        
        // Save to Cloud
        const headers = ['id', 'jobId', 'name', 'step', 'status', 'timeLeft', 'startTime', 'setNo'];
        saveSheetData(SHEET_NAMES.MIXING_EXECUTION, updatedBatches, headers);

        if(Swal) Swal.fire({ 
            icon: 'success', 
            title: 'Production Started', 
            html: `Releasing <b>${setsInput} Sets</b><br/>(${batchesToRelease} Batches)`, 
            confirmButtonColor: THEME.primary, 
            timer: 1500 
        });
    };

    const handleSetAction = (setNo: number, action: string) => {
        const updated = activeBatches.map((b: MixingBatch) => {
            if (b.setNo === setNo && b.step === selectedStep) { 
                if (action === 'start' && b.status === 'Waiting') {
                     const stepObj = PROCESS_FLOW.find(s => s.id === b.step);
                     return { ...b, status: 'Processing', timeLeft: stepObj ? stepObj.duration * 60 : 0 };
                } else if (action === 'force' && b.status === 'Processing') {
                     return { ...b, timeLeft: 0, status: 'Completed' };
                }
            }
            return b;
        });
        setActiveBatches(updated);
        // Save state change
        const headers = ['id', 'jobId', 'name', 'step', 'status', 'timeLeft', 'startTime', 'setNo'];
        saveSheetData(SHEET_NAMES.MIXING_EXECUTION, updated, headers);
    };

    const getSetsInStep = (stepId: string) => {
        const batches = activeBatches.filter((b: MixingBatch) => b.step === stepId);
        const grouped = batches.reduce((acc: any, b: MixingBatch) => {
            if (!acc[b.setNo]) acc[b.setNo] = [];
            acc[b.setNo].push(b);
            return acc;
        }, {});
        return Object.entries(grouped).map(([setNo, items]: any) => ({
            setNo: Number(setNo),
            items: items,
            productName: items[0].name,
            jobId: items[0].jobId
        })).sort((a: any, b: any) => a.setNo - b.setNo);
    };

    const currentProductObj = BASE_PRODUCTS.find(p => p.code === baseProduct) || BASE_PRODUCTS[0];
    const batchesToRelease = setsInput * currentProductObj.stdBatchesPerSet;

    return (
        <div className="w-full h-full font-sans animate-fadeIn flex flex-col gap-6 pb-6">
            <QrCodeModal isOpen={qrModalOpen} onClose={() => setQrModalOpen(false)} data={selectedSetForQr} />

            <div className="bg-white p-5 shadow-sm border border-gray-200 rounded-xl mb-2 shrink-0">
                <div className="grid grid-cols-12 gap-4 items-end">
                    <div className="col-span-12 lg:col-span-4 flex flex-col">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-wider pl-1">Base Product Selection (SFG)</label>
                        <div className="relative h-14 w-full">
                            <select value={baseProduct} onChange={e => setBaseProduct(e.target.value)} className="w-full h-full bg-white border border-gray-200 rounded-xl pl-4 pr-10 text-sm font-bold text-[#2E3338] focus:outline-none focus:border-[#C22D2E] focus:ring-1 focus:ring-[#C22D2E] appearance-none shadow-sm transition-all cursor-pointer">
                                {BASE_PRODUCTS.map(p => <option key={p.code} value={p.code}>{p.code} : {p.name}</option>)}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-400"><LucideIcon name="chevron-down" size={18}/></div>
                        </div>
                    </div>
                    <div className="col-span-6 lg:col-span-2 flex flex-col">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-wider pl-1">Total Plan</label>
                        <div className="h-14 bg-gray-50 border border-gray-200 rounded-xl flex flex-col justify-center px-4 relative overflow-hidden group hover:border-gray-300 transition-all">
                            <div className="flex items-baseline gap-1.5"><span className="text-xl font-black text-gray-700 leading-none">120</span><span className="text-[10px] font-bold text-gray-400 uppercase">Batches</span></div>
                            <span className="text-[10px] text-gray-400 font-mono mt-0.5">≈ 18,000 Kg</span>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-10"><LucideIcon name="clipboard-list" size={24}/></div>
                        </div>
                    </div>
                    <div className="col-span-6 lg:col-span-2 flex flex-col">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-wider pl-1">Remaining</label>
                        <div className={`h-14 border rounded-xl flex flex-col justify-center px-4 relative overflow-hidden transition-all bg-blue-50/50 border-blue-100`}>
                            <div className="flex items-baseline gap-1.5"><span className={`text-xl font-black leading-none text-blue-600`}>75</span><span className={`text-[10px] font-bold uppercase text-blue-400`}>Left</span></div>
                            <div className="w-full bg-white/60 h-1.5 mt-1.5 rounded-full overflow-hidden"><div className={`h-full bg-blue-400`} style={{width: `40%`}}></div></div>
                        </div>
                    </div>
                    <div className="col-span-6 lg:col-span-2 flex flex-col">
                        <div className="flex justify-between items-center mb-2 pl-1 pr-1"><label className="text-[10px] font-bold text-[#C22D2E] uppercase tracking-wider">Order Sets</label><span className="text-[9px] text-gray-400 bg-gray-100 px-1.5 rounded">1S={currentProductObj.stdBatchesPerSet}B</span></div>
                        <div className="relative h-14"><input type="number" min="1" value={setsInput} onChange={e=>setSetsInput(Number(e.target.value))} className="w-full h-full bg-white border-2 border-[#C22D2E]/20 hover:border-[#C22D2E] focus:border-[#C22D2E] rounded-xl text-center font-black text-2xl text-[#C22D2E] focus:outline-none shadow-sm transition-colors" /></div>
                    </div>
                    <div className="col-span-6 lg:col-span-2 flex flex-col">
                        <div className="h-4 mb-2"></div>
                        <button onClick={handleStart} disabled={batchesToRelease <= 0} className="w-full h-14 bg-[#C22D2E] hover:bg-[#BB8588] text-white rounded-xl font-bold shadow-lg shadow-[#C22D2E]/20 flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none">
                            <div className="flex items-center gap-2"><LucideIcon name="play" size={16} fill="currentColor" /><span className="text-sm uppercase tracking-wide">START JOB</span></div>
                            <span className="text-[9px] opacity-80 font-normal tracking-wide">+{batchesToRelease} Batches</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 shrink-0">
                {PROCESS_FLOW.map((step, idx) => {
                    const sets = getSetsInStep(step.id);
                    const count = sets.length;
                    const isActive = selectedStep === step.id;
                    return (
                        <div key={step.id} onClick={() => setSelectedStep(step.id)} className={`relative p-3 rounded-xl border-2 transition-all cursor-pointer group flex flex-col justify-between min-h-[110px] ${isActive ? 'bg-white border-[#C22D2E] shadow-md scale-105 z-10' : 'bg-white/60 border-white hover:border-[#C22D2E]/30'}`}>
                            <div className="flex justify-between items-start">
                                <div className={`p-1.5 rounded-lg ${isActive ? 'bg-[#C22D2E]/10 text-[#C22D2E]' : 'bg-gray-100 text-gray-400 group-hover:text-[#C22D2E]'}`}><LucideIcon name={step.icon} size={18} /></div>
                                <div className="flex flex-col items-end"><span className="text-[9px] font-bold text-gray-400 font-mono">0{idx + 1}</span></div>
                            </div>
                            <div className="mt-2"><h4 className={`text-xs font-bold uppercase ${isActive ? 'text-[#323640]' : 'text-gray-500'}`}>{step.label}</h4></div>
                            <div className={`absolute top-8 right-2 text-3xl font-black font-mono tracking-tighter ${count > 0 ? 'text-[#DCBC1B]' : 'text-gray-200'}`}>{count} <span className="text-[10px] font-normal tracking-normal ml-[-5px]">Sets</span></div>
                            {idx < PROCESS_FLOW.length - 1 && <div className="absolute -right-[18px] top-1/2 w-4 h-0.5 bg-gray-300 hidden md:block z-0"></div>}
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-0 flex-1 overflow-hidden">
                <div className="md:col-span-1 bg-[#2E3338] rounded-xl p-6 text-white shadow-lg flex flex-col items-center text-center relative overflow-hidden h-full">
                        <div className="absolute -right-6 -bottom-6 text-white/5 transform rotate-12"><LucideIcon name="layers" size={140}/></div>
                        <div className="flex-1 flex flex-col justify-center w-full relative z-10">
                            <h3 className="text-xs font-bold uppercase text-gray-400 mb-4 tracking-widest border-b border-white/10 pb-2">Completed</h3>
                            <div className="flex flex-col gap-1 mb-8"><span className="text-5xl font-black font-mono text-white tracking-tight">{activeBatches.filter((b: MixingBatch) => b.status === 'Completed').length} <span className="text-sm font-bold text-gray-500">Batches</span></span></div>
                        </div>
                </div>

                <div className="md:col-span-4 bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col h-full overflow-hidden">
                    <div className="px-6 py-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center shrink-0">
                        <h3 className="font-bold text-[#323640] flex items-center gap-2 uppercase tracking-wide"><LucideIcon name="list" size={18} className="text-[#C22D2E]" /> {PROCESS_FLOW.find(s => s.id === selectedStep)?.label} List (Sets)</h3>
                        <div className="flex items-center gap-2"><label className="text-[9px] font-bold text-gray-400 uppercase">Sim Speed:</label><div className="flex bg-white border border-gray-200 rounded p-0.5 gap-1">{[1, 10, 60].map(s => <button key={s} onClick={()=>setSimSpeed(s)} className={`px-2 py-0.5 text-[9px] font-bold rounded ${simSpeed===s ? 'bg-[#2E3338] text-white shadow-sm':'text-gray-400 hover:bg-gray-100'}`}>{s}x</button>)}</div></div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 bg-gray-50/30 custom-scrollbar">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {getSetsInStep(selectedStep).map((set: any) => {
                                const processingCount = set.items.filter((b: any) => b.status === 'Processing').length;
                                const waitingCount = set.items.filter((b: any) => b.status === 'Waiting').length;
                                const totalInSet = set.items.length;
                                const processingBatch = set.items.find((b: any) => b.status === 'Processing');
                                const progress = processingBatch ? 100 - ((processingBatch.timeLeft / (PROCESS_FLOW.find(s=>s.id===processingBatch.step)?.duration || 15 * 60)) * 100) : (waitingCount === totalInSet ? 0 : 100);
                                return (
                                    <div key={set.setNo} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm relative overflow-hidden animate-fade-in group">
                                        <div className={`absolute top-0 left-0 w-1 h-full ${processingCount > 0 ? 'bg-green-500' : 'bg-orange-400'}`}></div>
                                        <div className="flex justify-between mb-2 pl-2">
                                            <span className="font-bold text-[#323640] text-sm">SET #{set.setNo}</span>
                                            <div className="flex gap-1">
                                                    <button onClick={() => { setSelectedSetForQr(set); setQrModalOpen(true); }} className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-[#2E395F]" title="Show QR"><LucideIcon name="qr-code" size={14}/></button>
                                                    <span className={`text-[9px] px-2 py-0.5 rounded border font-bold ${processingCount > 0 ? 'bg-green-50 text-green-600 border-green-200':'bg-orange-50 text-orange-600 border-orange-200'}`}>{processingCount > 0 ? 'Processing' : 'Waiting'}</span>
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-gray-500 pl-2 mb-2 truncate font-bold">{set.productName}</p>
                                        <div className="pl-2 mb-2 flex justify-between text-[10px] text-gray-400 bg-gray-50 p-1.5 rounded"><span>Batches: <b className="text-[#2E3338]">{totalInSet}</b></span><span>Active: <b className="text-[#C22D2E]">{processingCount}</b></span></div>
                                        {processingCount > 0 && (<div className="pl-2 mb-3"><div className="flex justify-between text-[10px] mb-1"><span>Est. Progress</span><span className="font-mono text-[#C22D2E]">{Math.floor(progress)}%</span></div><div className="w-full bg-gray-100 h-1 rounded-full"><div className="bg-green-500 h-1 rounded-full transition-all duration-1000" style={{width: `${progress}%`}}></div></div></div>)}
                                        <div className="pl-2 pt-2 border-t border-gray-50 flex gap-2">{waitingCount > 0 ? <button onClick={()=>handleSetAction(set.setNo, 'start')} className="flex-1 bg-[#2E3338] text-white py-1.5 rounded text-xs hover:bg-[#C22D2E] transition-colors shadow-sm">Start Set</button> : <button onClick={()=>handleSetAction(set.setNo, 'force')} className="flex-1 bg-white border border-gray-300 text-gray-600 py-1.5 rounded text-xs hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors">Force Finish</button>}</div>
                                    </div>
                                );
                            })}
                            {getSetsInStep(selectedStep).length === 0 && <div className="col-span-full py-10 text-center text-gray-400 text-sm">No sets in this stage</div>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const MixingPlan: React.FC = () => {
    const [activeTab, setActiveTab] = useState('base_production');
    const [activeBatches, setActiveBatches] = useState<MixingBatch[]>([]);
    const [loading, setLoading] = useState(true);
    const [showGuide, setShowGuide] = useState(false);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const data = await fetchSheetData<MixingBatch>(SHEET_NAMES.MIXING_EXECUTION);
            if (data && data.length > 0) {
                setActiveBatches(data);
            } else {
                // Fallback to Mock Data and Initialize Sheet if empty
                setActiveBatches(MOCK_BATCHES);
                const headers = ['id', 'jobId', 'name', 'step', 'status', 'timeLeft', 'startTime', 'setNo'];
                saveSheetData(SHEET_NAMES.MIXING_EXECUTION, MOCK_BATCHES, headers);
            }
            setLoading(false);
        };
        load();
    }, []);

    if(loading) return <div className="flex h-full items-center justify-center"><LucideIcon name="loader-2" size={40} className="animate-spin text-[#C22D2E]" /></div>;

    return (
        <div className="flex h-screen flex-col font-sans overflow-hidden bg-[#D9D7D8]">
            <UserGuidePanel isOpen={showGuide} onClose={() => setShowGuide(false)} />
            
            {/* Header */}
            <div className="px-8 py-6 flex flex-col md:flex-row justify-between items-center gap-6 flex-shrink-0 z-10 animate-fade-in bg-[#D9D7D8]/50 backdrop-blur-sm">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-[#C22D2E] text-white shadow-lg flex-shrink-0 border border-white/20">
                        <LucideIcon name="chef-hat" size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-[#2E3338] tracking-tight uppercase leading-none">SFG PRODUCTION PLAN</h1>
                        <p className="text-[#64748B] text-xs mt-1 font-sans">ระบบวางแผนและติดตามการผสมไส้กรอก</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="flex bg-[#999798] p-1 rounded-md border border-white/5 shadow-inner w-fit flex-shrink-0 backdrop-blur-sm">
                        <button onClick={() => setActiveTab('base_production')} className={`px-6 py-2.5 rounded-sm text-sm font-bold transition-all duration-300 flex items-center gap-2 whitespace-nowrap font-mono uppercase tracking-wider ${activeTab === 'base_production' ? 'bg-[#C22D2E] text-white shadow-md transform scale-100' : 'text-white/70 hover:text-white hover:bg-white/10'}`}><LucideIcon name="layers" size={16} /> Batter &rarr; SFG</button>
                        <button onClick={() => setActiveTab('sfg_waiting')} className={`px-6 py-2.5 rounded-sm text-sm font-bold transition-all duration-300 flex items-center gap-2 whitespace-nowrap font-mono uppercase tracking-wider ${activeTab === 'sfg_waiting' ? 'bg-[#C22D2E] text-white shadow-md transform scale-100' : 'text-white/70 hover:text-white hover:bg-white/10'}`}><LucideIcon name="package-open" size={16} /> SFG Waiting</button>
                        <button onClick={() => setActiveTab('overview')} className={`px-6 py-2.5 rounded-sm text-sm font-bold transition-all duration-300 flex items-center gap-2 whitespace-nowrap font-mono uppercase tracking-wider ${activeTab === 'overview' ? 'bg-[#C22D2E] text-white shadow-md transform scale-100' : 'text-white/70 hover:text-white hover:bg-white/10'}`}><LucideIcon name="layout-dashboard" size={16} /> Overview</button>
                    </div>
                    <button onClick={() => setShowGuide(true)} className="p-2 text-gray-500 hover:text-[#C22D2E] transition-all opacity-80 hover:opacity-100" title="User Guide">
                        <LucideIcon name="help-circle" size={24} />
                    </button>
                </div>
            </div>

            <main className="flex-1 overflow-hidden flex flex-col relative z-10 px-8 pb-8">
                {activeTab === 'overview' && <MixOverview />}
                {activeTab === 'base_production' && <BaseProductionView activeBatches={activeBatches} setActiveBatches={setActiveBatches} />}
                {activeTab === 'sfg_waiting' && <SFGWaitingView />}
            </main>
        </div>
    );
};