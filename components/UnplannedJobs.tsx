
import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as LucideIcons from 'lucide-react';
import { fetchSheetData, saveSheetData } from '../services/sheetService';
import { SHEET_NAMES } from '../constants';

const Swal = (window as any).Swal;
const Chart = (window as any).Chart;

// --- TYPES ---
interface ProblemItem {
    id: string;
    jobRef: string;
    sku: string;
    stage: string;
    inputKg: number;
    stdYield: number;
    actualOutputKg: number;
    actualYield: number;
    status: 'Open' | 'Investigating' | 'Critical' | 'Warning' | 'Closed';
    issues: string[];
    rootCause: string;
    pic: string;
    reportedAt?: string;
}

// --- CONSTANTS ---
const PROCESS_STAGES = [
    { id: 'Mixing', icon: 'chef-hat', color: '#5185A6' },
    { id: 'Forming', icon: 'component', color: '#D9B036' },
    { id: 'Steaming', icon: 'thermometer', color: '#D94A3D' },
    { id: 'Cooling', icon: 'snowflake', color: '#64748B' },
    { id: 'Packing', icon: 'package', color: '#323640' },
    { id: 'Warehouse', icon: 'archive', color: '#9AA66F' }
];

const INITIAL_PROBLEMS: ProblemItem[] = [
    { id: 'VAR-001', jobRef: 'JO-2602-015', sku: 'CP Frank Cocktail', stage: 'Investigation Required', inputKg: 800, stdYield: 92.0, actualOutputKg: 710, actualYield: 88.75, status: 'Open', issues: [], rootCause: '', pic: '' },
    { id: 'VAR-002', jobRef: 'JO-2602-022', sku: 'Ham Slice 500g', stage: 'Investigation Required', inputKg: 500, stdYield: 90.0, actualOutputKg: 420, actualYield: 84.0, status: 'Critical', issues: [], rootCause: '', pic: '' },
    { id: 'VAR-003', jobRef: 'JO-2602-008', sku: 'Spicy Sausage', stage: 'Investigation Required', inputKg: 600, stdYield: 85.0, actualOutputKg: 490, actualYield: 81.6, status: 'Open', issues: [], rootCause: '', pic: '' },
    { id: 'VAR-004', jobRef: 'JO-2602-005', sku: 'Cheese Sausage 4"', stage: 'Packing', inputKg: 400, stdYield: 94.0, actualOutputKg: 370, actualYield: 92.5, status: 'Investigating', issues: [], rootCause: 'Sealant defect #2', pic: 'Somchai' },
    { id: 'VAR-005', jobRef: 'JO-2602-033', sku: 'Chicken Breast', stage: 'Cutting', inputKg: 1200, stdYield: 88.0, actualOutputKg: 1000, actualYield: 83.3, status: 'Warning', issues: [], rootCause: '', pic: '' },
    { id: 'VAR-006', jobRef: 'JO-2602-041', sku: 'Pork Meatball', stage: 'Forming', inputKg: 950, stdYield: 96.0, actualOutputKg: 880, actualYield: 92.6, status: 'Warning', issues: [], rootCause: '', pic: '' },
    { id: 'VAR-007', jobRef: 'JO-2602-019', sku: 'Vienna Sausage', stage: 'Investigation Required', inputKg: 2500, stdYield: 90.0, actualOutputKg: 2150, actualYield: 86.0, status: 'Critical', issues: [], rootCause: '', pic: '' },
    { id: 'VAR-008', jobRef: 'JO-2602-065', sku: 'Smoked Bratwurst', stage: 'Mixing', inputKg: 1000, stdYield: 98.0, actualOutputKg: 950, actualYield: 95.0, status: 'Investigating', issues: [], rootCause: 'Spillage transfer', pic: 'Wichai' },
    { id: 'VAR-009', jobRef: 'JO-2602-070', sku: 'Chicken Frank', stage: 'Investigation Required', inputKg: 1500, stdYield: 88.0, actualOutputKg: 1250, actualYield: 83.3, status: 'Critical', issues: [], rootCause: '', pic: '' },
    { id: 'VAR-010', jobRef: 'JO-2602-072', sku: 'Fish Tofu', stage: 'Cooling', inputKg: 800, stdYield: 95.0, actualOutputKg: 750, actualYield: 93.75, status: 'Open', issues: [], rootCause: '', pic: '' }
];

const LucideIcon = ({ name, size = 16, className = "", style, color }: any) => {
    const iconName = name.split('-').map((part: string) => part.charAt(0).toUpperCase() + part.slice(1)).join('');
    const IconComponent = (LucideIcons as any)[iconName] || (LucideIcons as any)[name] || LucideIcons.HelpCircle;
    return <IconComponent size={size} className={className} style={{...style, color: color}} />;
};

function VarianceAnalytics({ problems }: { problems: ProblemItem[] }) {
    const barChartRef = useRef<HTMLCanvasElement>(null);
    const lineChartRef = useRef<HTMLCanvasElement>(null);
    const doughnutChartRef = useRef<HTMLCanvasElement>(null);
    const chartInstances = useRef<any[]>([]);

    useEffect(() => {
        // Cleanup old charts
        chartInstances.current.forEach(c => c.destroy());
        chartInstances.current = [];

        if (typeof Chart === 'undefined') return;

        if (barChartRef.current && lineChartRef.current && doughnutChartRef.current) {
            // 1. Loss by Stage (Bar)
            const lossByStage: Record<string, number> = {};
            problems.forEach(p => {
                const stage = p.stage.replace(' (Logged)', '');
                const loss = (p.inputKg * (p.stdYield/100)) - p.actualOutputKg;
                lossByStage[stage] = (lossByStage[stage] || 0) + Math.max(0, loss);
            });

            const barChart = new Chart(barChartRef.current.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: Object.keys(lossByStage),
                    datasets: [{
                        label: 'Loss Weight (Kg)',
                        data: Object.values(lossByStage),
                        backgroundColor: '#D94A3D',
                        borderRadius: 4
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
            });
            chartInstances.current.push(barChart);

            // 2. Trend (Line - Mocked Data for Demo Logic)
            const lineChart = new Chart(lineChartRef.current.getContext('2d'), {
                type: 'line',
                data: {
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    datasets: [{
                        label: 'Issues Reported',
                        data: [2, 4, 1, 5, 8, 3, problems.length > 5 ? problems.length - 5 : 2],
                        borderColor: '#5185A6',
                        backgroundColor: 'rgba(81, 133, 166, 0.1)',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
            });
            chartInstances.current.push(lineChart);

            // 3. Stage Distribution (Doughnut)
            const stageCounts: Record<string, number> = {};
            problems.forEach(p => {
                const stage = p.stage.replace(' (Logged)', '');
                stageCounts[stage] = (stageCounts[stage] || 0) + 1;
            });
            
            const doughnutChart = new Chart(doughnutChartRef.current.getContext('2d'), {
               type: 'doughnut',
               data: {
                   labels: Object.keys(stageCounts),
                   datasets: [{
                       data: Object.values(stageCounts),
                       backgroundColor: ['#D94A3D', '#D9B036', '#5185A6', '#64748B', '#323640', '#9AA66F'],
                       borderWidth: 0
                   }]
               },
               options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }
           });
           chartInstances.current.push(doughnutChart);
        }
    }, [problems]);

    // Summary Stats
    const totalLoss = problems.reduce((sum, p) => sum + Math.max(0, (p.inputKg * (p.stdYield/100)) - p.actualOutputKg), 0);
    const avgYieldGap = problems.length > 0 
       ? (problems.reduce((sum, p) => sum + (p.stdYield - p.actualYield), 0) / problems.length)
       : 0;

    return (
        <div className="space-y-6 pb-8 animate-fade-in font-sans">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs text-gray-500 font-bold uppercase">Total Loss Impact</p>
                        <h3 className="text-2xl font-black text-[#D94A3D]">{totalLoss.toLocaleString(undefined, {maximumFractionDigits:1})} <span className="text-sm text-gray-400">Kg</span></h3>
                    </div>
                    <div className="p-3 bg-red-50 rounded-full text-[#D94A3D]"><LucideIcon name="scale" size={24}/></div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs text-gray-500 font-bold uppercase">Avg. Yield Gap</p>
                        <h3 className="text-2xl font-black text-[#D9B036]">{avgYieldGap.toFixed(2)} <span className="text-sm text-gray-400">%</span></h3>
                    </div>
                    <div className="p-3 bg-yellow-50 rounded-full text-[#D9B036]"><LucideIcon name="percent" size={24}/></div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs text-gray-500 font-bold uppercase">Wkly Issue Trend</p>
                        <h3 className="text-2xl font-black text-[#5185A6]">+12% <span className="text-sm text-gray-400">vs last wk</span></h3>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-full text-[#5185A6]"><LucideIcon name="trending-up" size={24}/></div>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-80">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col">
                    <h4 className="text-sm font-bold text-[#323640] uppercase mb-4 flex items-center gap-2"><LucideIcon name="bar-chart-2" size={16}/> Total Loss by Stage (Kg)</h4>
                    <div className="flex-1 relative"><canvas ref={barChartRef}></canvas></div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col">
                    <h4 className="text-sm font-bold text-[#323640] uppercase mb-4 flex items-center gap-2"><LucideIcon name="activity" size={16}/> 7-Day Issue Trend</h4>
                    <div className="flex-1 relative"><canvas ref={lineChartRef}></canvas></div>
                </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-80 flex flex-col">
                <h4 className="text-sm font-bold text-[#323640] uppercase mb-4 flex items-center gap-2"><LucideIcon name="pie-chart" size={16}/> Issue Distribution by Stage</h4>
                <div className="flex-1 relative"><canvas ref={doughnutChartRef}></canvas></div>
            </div>
        </div>
    );
}

export const UnplannedJobs: React.FC = () => {
    const [activeView, setActiveView] = useState<'board' | 'analytics'>('board');
    const [problems, setProblems] = useState<ProblemItem[]>([]);
    const [filter, setFilter] = useState('All');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const data = await fetchSheetData<ProblemItem>(SHEET_NAMES.DAILY_PROBLEMS);
            if (data && data.length > 0) {
                setProblems(data);
            } else {
                setProblems(INITIAL_PROBLEMS);
                const headers = ['id', 'jobRef', 'sku', 'stage', 'inputKg', 'stdYield', 'actualOutputKg', 'actualYield', 'status', 'issues', 'rootCause', 'pic'];
                saveSheetData(SHEET_NAMES.DAILY_PROBLEMS, INITIAL_PROBLEMS, headers);
            }
            setLoading(false);
        };
        load();
    }, []);

    const saveUpdates = async (updatedProblems: ProblemItem[]) => {
        setProblems(updatedProblems);
        const headers = ['id', 'jobRef', 'sku', 'stage', 'inputKg', 'stdYield', 'actualOutputKg', 'actualYield', 'status', 'issues', 'rootCause', 'pic'];
        await saveSheetData(SHEET_NAMES.DAILY_PROBLEMS, updatedProblems, headers);
    };

    const handleLogIssue = async (id: string) => {
        if (!Swal) return;
        const { value: formValues } = await Swal.fire({
            title: 'Log Root Cause & Stage',
            html: `
                <div class="text-left mb-1 text-xs font-bold text-gray-500 uppercase">Process Stage</div>
                <select id="swal-stage" class="swal2-input mb-3" style="margin: 0 0 1em 0; width: 100%; font-size: 0.9em;">
                    <option value="" disabled selected>-- Select Stage --</option>
                    ${PROCESS_STAGES.map(s => `<option value="${s.id}">${s.id}</option>`).join('')}
                </select>
                <div class="text-left mb-1 text-xs font-bold text-gray-500 uppercase">Description</div>
                <textarea id="swal-reason" class="swal2-textarea" style="margin: 0; font-size: 0.9em;" placeholder="Explain why yield/output is low..."></textarea>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonColor: '#D94A3D',
            confirmButtonText: 'Save',
            preConfirm: () => {
                return [
                    (document.getElementById('swal-stage') as HTMLSelectElement).value,
                    (document.getElementById('swal-reason') as HTMLTextAreaElement).value
                ]
            }
        });

        if (formValues) {
            const [stage, reason] = formValues;
            if(stage && reason) {
                const updated = problems.map(p => {
                    if (p.id === id) return { 
                        ...p, 
                        status: 'Investigating' as const, 
                        rootCause: reason, 
                        stage: stage, 
                        pic: 'Admin' 
                    };
                    return p;
                });
                saveUpdates(updated);
                Swal.fire({ icon: 'success', title: 'Logged Successfully', timer: 1000, showConfirmButton: false });
            }
        }
    };

    const groupedProblems = useMemo(() => {
        const groups: Record<string, ProblemItem[]> = {};
        problems.forEach(p => {
            if (filter !== 'All' && p.status !== filter) return;
            
            const stageKey = p.stage;
            if (!groups[stageKey]) groups[stageKey] = [];
            groups[stageKey].push(p);
        });
        return groups;
    }, [problems, filter]);

    const sortedStages = Object.keys(groupedProblems).sort((a, b) => {
        if (a === 'Investigation Required') return -1;
        if (b === 'Investigation Required') return 1;
        return a.localeCompare(b);
    });

    const totalIssues = problems.length;
    const criticalIssues = problems.filter(p => p.status === 'Critical').length;
    const filters = ['Open', 'Investigating', 'Critical', 'Closed', 'All'];

    if (loading) return <div className="flex h-full items-center justify-center"><LucideIcon name="loader-2" size={40} className="animate-spin text-[#D94A3D]" /></div>;

    return (
        <div className="flex flex-col font-sans bg-[#D9D7D8] h-full overflow-hidden">
            
            {/* Header - Sticky */}
            <div className="px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 animate-fade-in bg-[#D9D7D8]/95 backdrop-blur-md shadow-sm border-b border-white/20 shrink-0 z-20">
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#D94A3D] text-white shadow-lg flex-shrink-0 border border-white/20">
                        <LucideIcon name="alert-octagon" size={20} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-[#323640] tracking-tight uppercase leading-none">VARIANCE BOARD</h1>
                        <p className="text-[#64748B] text-[10px] mt-0.5 font-sans">วิเคราะห์และติดตามปัญหาส่วนสูญเสีย</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                        {/* View Toggle */}
                        <div className="flex bg-white/50 p-1 rounded-lg border border-white/30 shadow-inner">
                        <button 
                            onClick={() => setActiveView('board')} 
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${activeView === 'board' ? 'bg-white shadow text-[#D94A3D]' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <LucideIcon name="layout-grid" size={14}/> Visual Board
                        </button>
                        <button 
                            onClick={() => setActiveView('analytics')} 
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${activeView === 'analytics' ? 'bg-white shadow text-[#D94A3D]' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <LucideIcon name="bar-chart-2" size={14}/> Analytics Dashboard
                        </button>
                    </div>

                    <div className="h-6 w-px bg-gray-300 mx-2 hidden md:block"></div>

                    <div className="flex gap-3 items-center">
                        <div className="bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm flex items-center gap-2">
                            <span className="text-[10px] font-bold text-gray-500 uppercase">Total</span>
                            <span className="text-lg font-black text-[#323640] leading-none">{totalIssues}</span>
                        </div>
                        <div className="bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 shadow-sm flex items-center gap-2">
                            <span className="text-[10px] font-bold text-red-400 uppercase">Critical</span>
                            <span className="text-lg font-black text-red-500 leading-none">{criticalIssues}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Bar - Below header (Only show in Board view) */}
            {activeView === 'board' && (
                <div className="px-6 pb-2 flex gap-2 overflow-x-auto no-scrollbar bg-[#D9D7D8]/95 backdrop-blur-sm pt-1 shrink-0 z-10">
                    {filters.map(f => (
                        <button 
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all border shadow-sm whitespace-nowrap ${
                                filter === f 
                                ? 'bg-[#323640] text-white border-[#323640] shadow-md transform scale-105' 
                                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-700'
                            }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            )}

            {/* Content */}
            <main className="px-6 pb-12 pt-4 flex-1 overflow-y-auto custom-scrollbar">
                {activeView === 'board' ? (
                    <div className="space-y-6">
                        {sortedStages.map(stage => {
                            const isUnknown = stage === 'Investigation Required';
                            const stageInfo = PROCESS_STAGES.find(s => s.id === stage);
                            
                            return (
                                <div key={stage} className="animate-fade-in">
                                    {/* Stage Header */}
                                    <div className={`flex items-center gap-2 mb-2 pb-1 border-b ${isUnknown ? 'border-red-200' : 'border-gray-200'}`}>
                                        <div className={`p-1 rounded-md shadow-sm ${isUnknown ? 'bg-red-500 text-white' : 'bg-white text-gray-600'}`}>
                                            <LucideIcon name={isUnknown ? 'search' : (stageInfo?.icon || 'layers')} size={14} />
                                        </div>
                                        <div>
                                            <h3 className={`font-bold text-sm ${isUnknown ? 'text-red-600' : 'text-[#323640]'}`}>
                                                {isUnknown ? 'Pending Investigation' : `${stage} Stage`}
                                            </h3>
                                        </div>
                                        <span className="ml-auto text-[10px] font-bold bg-white px-2 py-0.5 rounded-full border border-gray-200 text-gray-500">
                                            {groupedProblems[stage].length}
                                        </span>
                                    </div>

                                    {/* Cards Grid - Compact Mode */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                                        {groupedProblems[stage].map(prob => {
                                            const loss = (prob.inputKg * (prob.stdYield/100)) - prob.actualOutputKg;
                                            const isCritical = prob.status === 'Critical';

                                            return (
                                                <div key={prob.id} className={`bg-white rounded-lg border p-2 flex flex-col relative overflow-hidden group transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${isCritical ? 'border-red-200 shadow-red-50' : 'border-gray-200'} h-full`}>
                                                    {/* Status Bar */}
                                                    <div className={`absolute top-0 left-0 w-1 h-full ${isCritical ? 'bg-[#D94A3D]' : 'bg-[#D9B036]'}`}></div>

                                                    {/* Card Header */}
                                                    <div className="flex justify-between items-start mb-1 pl-2">
                                                        <div className="bg-gray-100 text-gray-600 px-1 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border border-gray-200 truncate max-w-[60px]">
                                                            {prob.stage.replace(' (Logged)', '')}
                                                        </div>
                                                        <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase border ${
                                                            prob.status === 'Open' ? 'bg-red-50 text-red-600 border-red-100' : 
                                                            prob.status === 'Investigating' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' : 
                                                            'bg-gray-50 text-gray-600'
                                                        }`}>
                                                            {prob.status}
                                                        </span>
                                                    </div>

                                                    {/* SKU & ID */}
                                                    <div className="pl-2 mb-1.5">
                                                        <h4 className="font-bold text-gray-800 text-xs truncate leading-tight" title={prob.sku}>{prob.sku}</h4>
                                                        <div className="text-[9px] text-gray-400 font-mono">{prob.id}</div>
                                                    </div>

                                                    {/* Metrics Grid - Compact */}
                                                    <div className="grid grid-cols-2 gap-1 mb-2 bg-gray-50 p-1.5 rounded border border-gray-100 ml-2">
                                                        <div className="text-center border-r border-gray-200">
                                                            <span className="block text-[8px] text-gray-400 uppercase">Std</span>
                                                            <span className="block text-[10px] font-bold text-gray-600">{prob.stdYield}%</span>
                                                        </div>
                                                        <div className="text-center">
                                                            <span className="block text-[8px] text-gray-400 uppercase">Act</span>
                                                            <span className="block text-[10px] font-black text-red-500">{prob.actualYield}%</span>
                                                        </div>
                                                        <div className="col-span-2 border-t border-gray-200 mt-1 pt-1 flex justify-between items-center px-1">
                                                            <span className="text-[8px] text-red-400 uppercase font-bold">Loss</span>
                                                            <span className="text-[10px] font-black text-red-600">-{Math.max(0, loss).toFixed(1)} Kg</span>
                                                        </div>
                                                    </div>

                                                    {/* Root Cause Log */}
                                                    {prob.rootCause ? (
                                                        <div className="mb-2 ml-2 text-[9px] text-gray-600 bg-yellow-50 p-1 rounded border border-yellow-100 line-clamp-2 leading-tight" title={prob.rootCause}>
                                                            <span className="font-bold text-yellow-700">Log:</span> {prob.rootCause}
                                                        </div>
                                                    ) : (
                                                        <div className="mb-2 ml-2 py-1.5 text-center border border-dashed border-gray-200 rounded bg-gray-50/50">
                                                            <p className="text-[8px] text-gray-400">Waiting analysis</p>
                                                        </div>
                                                    )}

                                                    {/* Action Button */}
                                                    <button 
                                                        onClick={() => handleLogIssue(prob.id)}
                                                        className={`mt-auto ml-2 py-1 rounded border text-[9px] font-bold transition-all flex items-center justify-center gap-1 shadow-sm active:scale-95 ${
                                                            prob.rootCause 
                                                            ? 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50' 
                                                            : 'bg-[#D94A3D] border-transparent text-white hover:bg-[#A6374B]'
                                                        }`}
                                                    >
                                                        <LucideIcon name="file-edit" size={10}/> 
                                                        {prob.rootCause ? 'Edit' : 'Log Cause'}
                                                    </button>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <VarianceAnalytics problems={problems} />
                )}
            </main>
        </div>
    );
}
