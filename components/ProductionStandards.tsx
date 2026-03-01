import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import * as LucideIcons from 'lucide-react';
import { fetchSheetData, saveSheetData } from '../services/sheetService';
import { SHEET_NAMES } from '../constants';
import { ProductionStandard } from '../types';
import { DraggableModalWrapper } from './DraggableModalWrapper';

const Swal = (window as any).Swal;
const Papa = (window as any).Papa;

const INITIAL_CATEGORIES = ['Sausage', 'Meatball', 'Ham', 'Bologna', 'WIP-Emulsion'];
const STANDARD_BATCH_SIZES = [100, 150];

const MOCK_STANDARDS: ProductionStandard[] = [
    {
        id: 'STD-001', name: 'Standard Smoked Sausage', category: 'Sausage', rawWeightPerBatch: 150, yieldPercent: 88.5, status: 'Active', updateDate: '26/02/2025',
        mixingStandards: [{ id: 1, machine: 'Vacuum Mixer', batter: 'Standard Pork', batchPerCycle: 1, cycleTimeMin: 15, yieldPercent: 100 }],
        formingStandards: [{ id: 1, batter: 'Standard Pork', size: 'Jumbo', type: 'Twist Linker', casing: 'Cellulose', stuffed: true, capacityKgHr: 2000 }],
        cookingStandards: [{ id: 1, oven: 'Smoke House 6T', program: 'Smoke_Std', cycleTimeMin: 120, capacityBatch: 10 }],
        coolingStandards: [{ id: 1, unit: 'Rapid Chill Tunnel', program: 'Shower_Fast', cycleTimeMin: 60, capacityBatch: 10 }],
        peelingStandards: [{ id: 1, method: 'Machine Only', capacityKgHr: 1500 }],
        cuttingStandards: [],
        packingStandards: [{ id: 1, machine: 'Thermoformer', packSize: '1kg', format: 'Bag', sfgSize: 'Jumbo', capacityKgHr: 1000 }],
        packVariants: []
    },
    {
        id: 'STD-002', name: 'Premium Meatball', category: 'Meatball', rawWeightPerBatch: 100, yieldPercent: 95, status: 'Active', updateDate: '25/02/2025',
        mixingStandards: [{ id: 1, machine: 'Bowl Cutter 200L', batter: 'Premium Beef', batchPerCycle: 1, cycleTimeMin: 12, yieldPercent: 100 }],
        formingStandards: [{ id: 1, batter: 'Premium Beef', size: 'M', type: 'Belt Former', casing: '', stuffed: false, capacityKgHr: 1500 }],
        cookingStandards: [{ id: 1, oven: 'Smoke House 4T', program: 'Steam_01', cycleTimeMin: 60, capacityBatch: 8 }],
        coolingStandards: [{ id: 1, unit: 'Shower Tunnel', program: 'Chill_Std', cycleTimeMin: 40, capacityBatch: 8 }],
        peelingStandards: [],
        cuttingStandards: [],
        packingStandards: [{ id: 1, machine: 'Flow Pack', packSize: '500g', format: 'Bag', sfgSize: 'M', capacityKgHr: 800 }],
        packVariants: []
    }
];

const LucideIcon = ({ name, size = 16, className = "", style }: any) => {
    const iconName = name.split('-').map((part: string) => part.charAt(0).toUpperCase() + part.slice(1)).join('');
    const IconComponent = (LucideIcons as any)[iconName] || (LucideIcons as any)[name] || LucideIcons.HelpCircle;
    return <IconComponent size={size} className={className} style={style} />;
};

// ... (UserGuidePanel, CsvUploadModal, ListManagerModal, ConfigModal, ConfigTableSection helpers omitted for brevity but preserved) ...
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
                        <LucideIcon name="book-open" size={24} style={{color:'#DCBC1B'}}/>
                        <h3 className="font-bold text-lg font-sans tracking-tight">คู่มือการใช้งาน</h3>
                    </div>
                    <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full transition-colors"><LucideIcon name="x" size={20}/></button>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 font-sans">
                    <section>
                        <h4 className="font-bold text-[#C22D2E] text-sm mb-3 flex items-center gap-2 border-b border-gray-200 pb-2">
                            <LucideIcon name="settings-2" size={16}/> Production Standards
                        </h4>
                        <ul className="list-disc list-outside ml-4 text-xs text-gray-600 space-y-2 leading-relaxed">
                            <li><strong>Batch Size:</strong> กำหนดขนาด Batch มาตรฐาน (kg) เพื่อคำนวณ Yield</li>
                            <li><strong>Process Steps:</strong> กำหนดค่ามาตรฐานของเครื่องจักรในแต่ละขั้นตอน (Mixing, Cooking, etc.) เพื่อใช้ในการวางแผนผลิต</li>
                            <li><strong>History:</strong> สามารถดูประวัติการแก้ไขได้จากแท็บ History Log ในหน้าต่างแก้ไข</li>
                        </ul>
                    </section>
                    <section>
                        <h4 className="font-bold text-[#C22D2E] text-sm mb-3 flex items-center gap-2 border-b border-gray-200 pb-2">
                            <LucideIcon name="upload-cloud" size={16}/> Importing Data
                        </h4>
                        <p className="text-xs text-gray-600 mb-2">สามารถนำเข้าข้อมูลพื้นฐานผ่านไฟล์ CSV ได้ โดยมี Header ดังนี้:</p>
                        <code className="block bg-gray-100 p-2 rounded border border-gray-300 text-[10px] font-mono text-gray-500 overflow-x-auto">
                            ID, Name, Category, Raw_Batch, Yield, Status
                        </code>
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

function CsvUploadModal({ isOpen, onClose, onUpload }: any) {
    const [dragActive, setDragActive] = useState(false);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<any>(null);

    if (!isOpen) return null;

    const handleDrag = (e: any) => {
        e.preventDefault(); e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
        else if (e.type === "dragleave") setDragActive(false);
    };

    const handleDrop = (e: any) => {
        e.preventDefault(); e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]);
    };

    const handleChange = (e: any) => {
        if (e.target.files && e.target.files[0]) processFile(e.target.files[0]);
    };

    const processFile = (file: any) => {
        setError(null);
        if(!Papa) { setError("CSV Parser not loaded"); return; }
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: function (results: any) {
                if (results.errors.length > 0) {
                    setError("Error parsing CSV: " + results.errors[0].message);
                    return;
                }
                const requiredHeaders = ["ID", "Name", "Category", "Raw_Batch", "Yield", "Status"];
                const headers = results.meta.fields;
                const missing = requiredHeaders.filter(h => !headers.includes(h));
                if (missing.length > 0) {
                    setError(`Missing columns: ${missing.join(", ")}`);
                    return;
                }
                setPreviewData(results.data);
            }
        });
    };

    const confirmUpload = () => {
        const newData = previewData.map(row => ({
            id: row.ID,
            name: row.Name,
            category: row.Category,
            rawWeightPerBatch: parseFloat(row.Raw_Batch) || 100,
            yieldPercent: parseFloat(row.Yield) || 100,
            status: row.Status || 'Active',
            updateDate: new Date().toLocaleDateString('en-GB'),
            mixingStandards: [], formingStandards: [], cookingStandards: [],
            coolingStandards: [], peelingStandards: [], cuttingStandards: [], packingStandards: [],
            packVariants: []
        }));
        onUpload(newData);
        onClose();
        setPreviewData([]);
        setError(null);
        if(Swal) Swal.fire({ icon: 'success', title: 'Imported!', text: 'Data has been successfully imported.', timer: 1500, showConfirmButton: false });
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn font-sans">
            <DraggableModalWrapper className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-[#2E3338] text-white">
                    <h3 className="font-bold flex items-center gap-2"><LucideIcon name="upload-cloud" /> Import CSV</h3>
                    <button onClick={onClose}><LucideIcon name="x" /></button>
                </div>
                <div className="p-6 flex-1 overflow-y-auto">
                    {!previewData.length ? (
                        <>
                            <div 
                                className={`border-2 border-dashed rounded-xl p-10 text-center transition-all ${dragActive ? 'border-[#C22D2E] bg-[rgba(194,45,46,0.05)]' : 'border-gray-300'}`}
                                onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                            >
                                <LucideIcon name="file-spreadsheet" size={48} className="mx-auto text-gray-300 mb-4" />
                                <p className="text-gray-600 font-bold mb-2">Drag & Drop CSV file here</p>
                                <p className="text-gray-400 text-xs mb-4">or</p>
                                <button onClick={() => fileInputRef.current.click()} className="bg-[#C22D2E] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#BB8588] transition-colors">Browse File</button>
                                <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleChange} />
                            </div>
                            <div className="mt-6 bg-[#55738D]/5 p-4 rounded-lg border border-[#55738D]/20">
                                <h4 className="text-[#55738D] font-bold text-xs uppercase mb-2 flex items-center gap-2"><LucideIcon name="info" size={14}/> CSV Format Guide</h4>
                                <p className="text-xs text-gray-600 mb-2">Please ensure your CSV file has the following headers:</p>
                                <code className="block bg-white p-2 rounded border border-[#55738D]/30 text-[10px] text-gray-500 font-mono overflow-x-auto">
                                    ID, Name, Category, Raw_Batch, Yield, Status
                                </code>
                            </div>
                            {error && <div className="mt-4 p-3 bg-red-50 text-red-600 text-xs rounded-lg border border-red-100 flex items-center gap-2"><LucideIcon name="alert-circle" size={16}/> {error}</div>}
                        </>
                    ) : (
                        <div>
                            <h4 className="font-bold text-gray-700 mb-2 flex justify-between items-center">
                                <span>Preview Data ({previewData.length} rows)</span>
                                <button onClick={() => setPreviewData([])} className="text-xs text-red-500 hover:underline">Clear</button>
                            </h4>
                            <div className="overflow-x-auto border border-gray-200 rounded-lg max-h-[300px]">
                                <table className="w-full text-left text-xs whitespace-nowrap">
                                    <thead className="bg-gray-50 text-gray-500 sticky top-0">
                                        <tr><th className="p-2 border-b">ID</th><th className="p-2 border-b">Name</th><th className="p-2 border-b">Category</th><th className="p-2 border-b text-right">Raw Batch</th><th className="p-2 border-b text-right">Yield</th><th className="p-2 border-b text-center">Status</th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {previewData.slice(0, 10).map((row, i) => (
                                            <tr key={i}>
                                                <td className="p-2 font-mono text-[#55738D] font-bold">{row.ID}</td>
                                                <td className="p-2">{row.Name}</td>
                                                <td className="p-2">{row.Category}</td>
                                                <td className="p-2 text-right">{row.Raw_Batch}</td>
                                                <td className="p-2 text-right">{row.Yield}%</td>
                                                <td className="p-2 text-center">{row.Status}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {previewData.length > 10 && <div className="p-2 text-center text-xs text-gray-400 bg-gray-50">...and {previewData.length - 10} more rows</div>}
                            </div>
                        </div>
                    )}
                </div>
                {previewData.length > 0 && (
                    <div className="p-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50">
                        <button onClick={onClose} className="px-4 py-2 text-gray-500 hover:bg-gray-200 rounded-lg text-sm font-bold">Cancel</button>
                        <button onClick={confirmUpload} className="px-6 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg text-sm font-bold shadow-lg flex items-center gap-2">
                            <LucideIcon name="check" size={16} /> Confirm Import
                        </button>
                    </div>
                )}
            </DraggableModalWrapper>
        </div>
    );
}

const ListManagerModal = ({ title, items, onAdd, onRemove, onClose }: any) => {
    const [newItem, setNewItem] = useState('');
    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/20 backdrop-blur-sm p-4 animate-fadeIn" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <DraggableModalWrapper className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-sm overflow-hidden flex flex-col max-h-[80vh]">
                <div className="bg-[#2E3338] px-4 py-3 flex justify-between items-center text-white shrink-0">
                    <h3 className="text-sm font-bold uppercase tracking-wide flex items-center gap-2"><LucideIcon name="settings" size={14}/> {title}</h3>
                    <button onClick={onClose}><LucideIcon name="x" size={18}/></button>
                </div>
                <div className="p-4 bg-gray-50 flex-1 overflow-hidden flex flex-col">
                    <div className="flex gap-2 mb-4 shrink-0">
                        <input 
                            type="text" 
                            value={newItem} 
                            onChange={(e) => setNewItem(e.target.value)} 
                            className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#C22D2E]" 
                            placeholder="Add new item..."
                            onKeyDown={(e) => { if(e.key === 'Enter' && newItem) { onAdd(newItem); setNewItem(''); }}}
                        />
                        <button onClick={() => { if(newItem) { onAdd(newItem); setNewItem(''); }}} className="bg-[#C22D2E] text-white px-3 py-1.5 rounded-lg hover:bg-[#BB8588] transition-colors shadow-sm">
                            <LucideIcon name="plus" size={16}/>
                        </button>
                    </div>
                    <div className="overflow-y-auto custom-scrollbar space-y-2 pr-1">
                        {items.map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center bg-white border border-gray-200 p-2 rounded-lg shadow-sm group">
                                    <span className="text-xs font-bold text-gray-700">{item}</span>
                                    <button onClick={() => onRemove(item)} className="text-gray-300 hover:text-red-500 transition-colors"><LucideIcon name="trash-2" size={14}/></button>
                            </div>
                        ))}
                    </div>
                </div>
            </DraggableModalWrapper>
        </div>
    );
};

function ConfigModal({ isOpen, onClose, data, onSave, mode, categories }: any) {
    const [topTab, setTopTab] = useState('info'); // 'info' | 'history'
    const [activeTab, setActiveTab] = useState('batter');
    const [config, setConfig] = useState<any>(null);
    const [settingsMode, setSettingsMode] = useState<any>(null);
    const [options, setOptions] = useState<any>({
        machineMixing: ['Bowl Cutter 200L', 'Bowl Cutter 500L', 'Vacuum Mixer', 'Emulsifier'],
        batterFormulas: ['Standard Pork', 'Premium Beef', 'Chicken A'],
        productSizes: ['S', 'M', 'L', 'Jumbo', 'Cocktail'],
        formingTypes: ['Twist Linker', 'Clipper Direct', 'Belt Former'],
        casingTypes: ['Cellulose', 'Collagen', 'Polyamide'],
        cookingOvens: ['Smoke House 4T', 'Smoke House 6T'],
        cookingPrograms: ['Steam_01', 'Smoke_Std'],
        coolingUnits: ['Blast Chiller', 'Shower Tunnel'],
        coolingPrograms: ['Chill_Std', 'Shower_Fast'],
        peelingMethods: ['Machine Only', 'Manual'],
        packingMachines: ['Thermoformer', 'Flow Pack', 'Vacuum Chamber'],
        packSizes: ['500g', '1kg', 'Bulk'],
        packFormats: ['Bag', 'Tray']
    });
    
    const DEFAULT_CONFIG = {
        id: '', name: '', category: categories[0], status: 'Active',
        rawWeightPerBatch: 150.00, yieldPercent: 100, specPiecesPerKg: 0,
        mixingStandards: [], formingStandards: [], cookingStandards: [],
        coolingStandards: [], peelingStandards: [], cuttingStandards: [], packingStandards: [],
        packVariants: []
    };

    useEffect(() => {
        if (isOpen) {
            setTopTab('info');
            if (data) {
                setConfig({
                    ...DEFAULT_CONFIG,
                    ...data,
                    mixingStandards: [...(data.mixingStandards || [])],
                    formingStandards: [...(data.formingStandards || [])],
                    cookingStandards: [...(data.cookingStandards || [])],
                    coolingStandards: [...(data.coolingStandards || [])],
                    peelingStandards: [...(data.peelingStandards || [])],
                    cuttingStandards: [...(data.cuttingStandards || [])],
                    packingStandards: [...(data.packingStandards || [])],
                    packVariants: [...(data.packVariants || [])]
                });
            } else {
                setConfig(DEFAULT_CONFIG);
            }
            setActiveTab('batter');
        }
    }, [isOpen, data]);

    if (!isOpen || !config) return null;

    const isReadOnly = mode === 'view';

    const handleSaveClick = () => {
        onSave(config);
        onClose();
        if(Swal) Swal.fire({ icon: 'success', title: 'Saved Successfully', showConfirmButton: false, timer: 1000 });
    };

    const updateArrayItem = (arrayName: string, id: number, field: string, value: any) => {
        setConfig((prev: any) => ({
            ...prev,
            [arrayName]: prev[arrayName].map((item: any) => item.id === id ? { ...item, [field]: value } : item)
        }));
    };

    const removeArrayItem = (arrayName: string, id: number) => {
        setConfig((prev: any) => ({
            ...prev,
            [arrayName]: prev[arrayName].filter((item: any) => item.id !== id)
        }));
    };

    const addArrayItem = (arrayName: string, newItem: any) => {
        const newId = config[arrayName].length > 0 ? Math.max(...config[arrayName].map((i: any) => i.id)) + 1 : 1;
        setConfig((prev: any) => ({
            ...prev,
            [arrayName]: [...prev[arrayName], { ...newItem, id: newId }]
        }));
    };

    const handleUpdateOption = (key: string, newList: any[]) => {
        setOptions((prev: any) => ({ ...prev, [key]: newList }));
    };

    const TabButton = ({ id, label, icon }: any) => (
        <button 
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-3 px-4 py-3.5 text-left transition-all border-l-4 w-full group ${activeTab === id ? 'border-[#C22D2E] bg-white text-[#C22D2E] font-bold shadow-sm' : 'border-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}
        >
            <div className={`p-1.5 rounded-md shrink-0 transition-colors ${activeTab === id ? 'bg-[#C22D2E]/10' : 'bg-gray-200 group-hover:bg-gray-300'}`}>
                <LucideIcon name={icon} size={16} />
            </div>
            <span className="text-xs uppercase tracking-wide">{label}</span>
        </button>
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn font-sans">
            <DraggableModalWrapper className="bg-white rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl overflow-hidden relative border-t-8 border-[#C22D2E]">
                
                {/* Header */}
                <div className="bg-white px-6 py-4 flex justify-between items-start shrink-0 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${mode === 'view' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                            <LucideIcon name={mode === 'view' ? 'eye' : 'edit-3'} size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-[#2E3338] leading-tight">{config.name || 'New Process Standard'}</h3>
                            <p className="text-xs text-[#737597] font-mono tracking-tighter">ID: {config.id || 'AUTO-GEN'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {data && (
                            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                                <button 
                                    onClick={() => setTopTab('info')}
                                    className={`flex-1 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${topTab === 'info' ? 'bg-white text-[#C22D2E] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Configuration
                                </button>
                                <button 
                                    onClick={() => setTopTab('history')}
                                    className={`flex-1 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${topTab === 'history' ? 'bg-white text-[#C22D2E] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    History Log
                                </button>
                            </div>
                        )}
                        <button onClick={onClose} className="text-gray-400 hover:text-red-600 transition-all"><LucideIcon name="x" size={24} /></button>
                    </div>
                </div>

                {/* Content Layout */}
                {topTab === 'info' ? (
                    <div className="flex flex-1 overflow-hidden">
                        {/* Sidebar Nav */}
                        <div className="w-56 bg-gray-50 border-r border-gray-200 flex flex-col shrink-0 overflow-y-auto">
                            <div className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Process Steps</div>
                            <TabButton id="batter" label="General / Batter" icon="file-text" />
                            <TabButton id="mixing" label="1. Mixing" icon="chef-hat" />
                            <TabButton id="forming" label="2. Forming" icon="component" />
                            <TabButton id="cooking" label="3. Cooking" icon="thermometer" />
                            <TabButton id="cooling" label="4. Cooling" icon="snowflake" />
                            <TabButton id="peeling" label="5. Peeling" icon="scissors" />
                            <TabButton id="cutting" label="6. Cutting" icon="scissors" />
                            <TabButton id="packing" label="7. Packing" icon="package" />
                        </div>

                        {/* Main Content */}
                        <div className="flex-1 overflow-y-auto p-8 bg-[#F9F8F4]">
                            
                            {/* 0. General / Batter */}
                            {activeTab === 'batter' && (
                                <div className="space-y-6 animate-fadeIn">
                                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                        <h4 className="text-sm font-bold text-[#2E3338] border-b border-gray-100 pb-2 mb-4">Product Information</h4>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="col-span-2">
                                                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Standard Name</label>
                                                <input disabled={isReadOnly} type="text" value={config.name} onChange={e=>setConfig({...config, name: e.target.value})} className="w-full border rounded p-2 text-sm font-bold focus:border-[#C22D2E] outline-none" />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Category</label>
                                                <select disabled={isReadOnly} value={config.category} onChange={e=>setConfig({...config, category: e.target.value})} className="w-full border rounded p-2 text-sm bg-white focus:border-[#C22D2E] outline-none">
                                                    {categories.map((c: string) => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Status</label>
                                                <select disabled={isReadOnly} value={config.status || 'Active'} onChange={e=>setConfig({...config, status: e.target.value})} className="w-full border rounded p-2 text-sm bg-white focus:border-[#C22D2E] outline-none">
                                                    <option value="Active">Active</option>
                                                    <option value="Inactive">Inactive</option>
                                                    <option value="Draft">Draft</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                        <h4 className="text-sm font-bold text-[#2E3338] border-b border-gray-100 pb-2 mb-4">Batch Standard</h4>
                                        <div className="grid grid-cols-3 gap-6">
                                            <div>
                                                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Batch Size (Kg)</label>
                                                <div className="relative">
                                                    <input 
                                                        disabled={isReadOnly} 
                                                        type="number" 
                                                        list="batchSizes" 
                                                        value={config.rawWeightPerBatch} 
                                                        onChange={e=>setConfig({...config, rawWeightPerBatch: parseFloat(e.target.value)})} 
                                                        className="w-full border rounded p-2 text-sm font-bold text-right pr-8 focus:border-[#C22D2E] outline-none"
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">Kg</span>
                                                    <datalist id="batchSizes">
                                                        {STANDARD_BATCH_SIZES.map(s => <option key={s} value={s} />)}
                                                    </datalist>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">% Yield Target</label>
                                                <input disabled={isReadOnly} type="number" value={config.yieldPercent} onChange={e=>setConfig({...config, yieldPercent: parseFloat(e.target.value)})} className="w-full border rounded p-2 text-sm font-bold text-right text-[#C22D2E] focus:border-[#C22D2E] outline-none" />
                                            </div>
                                            <div className="bg-blue-50 rounded border border-blue-100 p-2 flex flex-col justify-center">
                                                <span className="text-[10px] text-blue-500 uppercase font-bold">Est. FG Output</span>
                                                <span className="text-xl font-black text-blue-700">{(config.rawWeightPerBatch * (config.yieldPercent/100)).toFixed(1)} <span className="text-sm">Kg</span></span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'mixing' && (
                                <ConfigTableSection 
                                    title="Mixing Process" 
                                    isReadOnly={isReadOnly} 
                                    dropdownOptions={options} 
                                    openMaster={(val: any) => setSettingsMode(val)}
                                    headers={[{label:'Machine', key:'machineMixing', gear:true}, {label:'Batter Formula', key:'batterFormulas', gear:true}, {label:'Batch/Cycle', key:'batchPerCycle'}, {label:'Cycle Time (min)', key:'cycleTimeMin'}, {label:'% Yield', key:'yieldPercent'}]}
                                    items={config.mixingStandards}
                                    fields={[{key:'machine', type:'select', listKey:'machineMixing'}, {key:'batter', type:'select', listKey:'batterFormulas'}, {key:'batchPerCycle', type:'number', align:'text-center'}, {key:'cycleTimeMin', type:'number', align:'text-center'}, {key:'yieldPercent', type:'number', align:'text-right', class:'text-[#C22D2E] font-bold'}]}
                                    onAdd={() => addArrayItem('mixingStandards', {machine:'', batter:'', batchPerCycle:1, cycleTimeMin:10, yieldPercent:100})}
                                    onRemove={(id: number) => removeArrayItem('mixingStandards', id)}
                                    updateArrayItem={(id: number, field: string, val: any) => updateArrayItem('mixingStandards', id, field, val)}
                                />
                            )}
                            {activeTab === 'forming' && (
                                <ConfigTableSection 
                                    title="Forming Process" 
                                    isReadOnly={isReadOnly} 
                                    dropdownOptions={options} 
                                    openMaster={(val: any) => setSettingsMode(val)}
                                    headers={[{label:'Batter', key:'batterFormulas', gear:true}, {label:'Size', key:'productSizes', gear:true}, {label:'Type', key:'formingTypes', gear:true}, {label:'Casing', key:'casingTypes', gear:true}, {label:'Stuffed', key:'stuffed'}, {label:'Capacity (kg/hr)', key:'capacityKgHr'}]}
                                    items={config.formingStandards}
                                    fields={[{key:'batter', type:'select', listKey:'batterFormulas'}, {key:'size', type:'select', listKey:'productSizes'}, {key:'type', type:'select', listKey:'formingTypes'}, {key:'casing', type:'select', listKey:'casingTypes'}, {key:'stuffed', type:'boolean', align:'text-center'}, {key:'capacityKgHr', type:'number', align:'text-right'}]}
                                    onAdd={() => addArrayItem('formingStandards', {batter:'', size:'', type:'', casing:'', stuffed:false, capacityKgHr:1000})}
                                    onRemove={(id: number) => removeArrayItem('formingStandards', id)}
                                    updateArrayItem={(id: number, field: string, val: any) => updateArrayItem('formingStandards', id, field, val)}
                                />
                            )}
                            {activeTab === 'cooking' && (
                                <ConfigTableSection 
                                    title="Cooking Process" 
                                    isReadOnly={isReadOnly} 
                                    dropdownOptions={options} 
                                    openMaster={(val: any) => setSettingsMode(val)}
                                    headers={[{label:'Oven Unit', key:'cookingOvens', gear:true}, {label:'Program', key:'cookingPrograms', gear:true}, {label:'Cycle Time (min)', key:'cycleTimeMin'}, {label:'Capacity (Batch)', key:'capacityBatch'}]}
                                    items={config.cookingStandards}
                                    fields={[{key:'oven', type:'select', listKey:'cookingOvens'}, {key:'program', type:'select', listKey:'cookingPrograms'}, {key:'cycleTimeMin', type:'number', align:'text-center'}, {key:'capacityBatch', type:'number', align:'text-center'}]}
                                    onAdd={() => addArrayItem('cookingStandards', {oven:'', program:'', cycleTimeMin:60, capacityBatch:1})}
                                    onRemove={(id: number) => removeArrayItem('cookingStandards', id)}
                                    updateArrayItem={(id: number, field: string, val: any) => updateArrayItem('cookingStandards', id, field, val)}
                                />
                            )}
                            {activeTab === 'cooling' && (
                                <ConfigTableSection 
                                    title="Cooling Process" 
                                    isReadOnly={isReadOnly} 
                                    dropdownOptions={options} 
                                    openMaster={(val: any) => setSettingsMode(val)}
                                    headers={[{label:'Cooling Unit', key:'coolingUnits', gear:true}, {label:'Program', key:'coolingPrograms', gear:true}, {label:'Cycle Time (min)', key:'cycleTimeMin'}, {label:'Capacity (Batch)', key:'capacityBatch'}]}
                                    items={config.coolingStandards}
                                    fields={[{key:'unit', type:'select', listKey:'coolingUnits'}, {key:'program', type:'select', listKey:'coolingPrograms'}, {key:'cycleTimeMin', type:'number', align:'text-center'}, {key:'capacityBatch', type:'number', align:'text-center'}]}
                                    onAdd={() => addArrayItem('coolingStandards', {unit:'', program:'', cycleTimeMin:30, capacityBatch:1})}
                                    onRemove={(id: number) => removeArrayItem('coolingStandards', id)}
                                    updateArrayItem={(id: number, field: string, val: any) => updateArrayItem('coolingStandards', id, field, val)}
                                />
                            )}
                            {activeTab === 'peeling' && (
                                <ConfigTableSection 
                                    title="Peeling Process" 
                                    isReadOnly={isReadOnly} 
                                    dropdownOptions={options} 
                                    openMaster={(val: any) => setSettingsMode(val)}
                                    headers={[{label:'Method', key:'peelingMethods', gear:true}, {label:'Capacity (kg/hr)', key:'capacityKgHr'}]}
                                    items={config.peelingStandards}
                                    fields={[{key:'method', type:'select', listKey:'peelingMethods'}, {key:'capacityKgHr', type:'number', align:'text-right'}]}
                                    onAdd={() => addArrayItem('peelingStandards', {method:'', capacityKgHr:500})}
                                    onRemove={(id: number) => removeArrayItem('peelingStandards', id)}
                                    updateArrayItem={(id: number, field: string, val: any) => updateArrayItem('peelingStandards', id, field, val)}
                                />
                            )}
                            {activeTab === 'cutting' && (
                                <div className="text-center text-gray-400 italic py-10 border border-dashed border-gray-300 rounded-xl">No cutting process configured for this standard.</div>
                            )}
                            {activeTab === 'packing' && (
                                <ConfigTableSection 
                                    title="Packing Process" 
                                    isReadOnly={isReadOnly} 
                                    dropdownOptions={options} 
                                    openMaster={(val: any) => setSettingsMode(val)}
                                    headers={[{label:'Machine', key:'packingMachines', gear:true}, {label:'Pack Size', key:'packSizes', gear:true}, {label:'Format', key:'packFormats', gear:true}, {label:'SFG Size', key:'productSizes', gear:true}, {label:'Capacity (kg/hr)', key:'capacityKgHr'}]}
                                    items={config.packingStandards}
                                    fields={[{key:'machine', type:'select', listKey:'packingMachines'}, {key:'packSize', type:'select', listKey:'packSizes'}, {key:'format', type:'select', listKey:'packFormats'}, {key:'sfgSize', type:'select', listKey:'productSizes'}, {key:'capacityKgHr', type:'number', align:'text-right'}]}
                                    onAdd={() => addArrayItem('packingStandards', {machine:'', packSize:'', format:'', sfgSize:'', capacityKgHr:500})}
                                    onRemove={(id: number) => removeArrayItem('packingStandards', id)}
                                    updateArrayItem={(id: number, field: string, val: any) => updateArrayItem('packingStandards', id, field, val)}
                                />
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto p-8 bg-[#F9F8F4]">
                        <div className="space-y-4 max-w-2xl mx-auto">
                            <div className="text-center text-gray-400 italic py-10">History log not connected to Cloud yet.</div>
                        </div>
                    </div>
                )}

                {/* Footer */}
                {!isReadOnly && topTab === 'info' && (
                    <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 shrink-0">
                        <button onClick={onClose} className="px-6 py-2 text-gray-500 font-bold text-sm hover:bg-gray-100 rounded-lg transition-all">Cancel</button>
                        <button onClick={handleSaveClick} className="px-8 py-2 bg-[#C22D2E] text-white font-bold text-sm rounded-lg shadow-lg hover:bg-[#BB8588] flex items-center gap-2 transform active:scale-95 transition-all">
                            <LucideIcon name="save" size={18} /> Save Config
                        </button>
                    </div>
                )}
            </DraggableModalWrapper>

            {/* Settings Modal */}
            {settingsMode && (
                <ListManagerModal 
                    title={settingsMode.title} 
                    items={options[settingsMode.key] || []} 
                    onAdd={(val: any) => handleUpdateOption(settingsMode.key, [...(options[settingsMode.key] || []), val])}
                    onRemove={(val: any) => handleUpdateOption(settingsMode.key, (options[settingsMode.key] || []).filter((i: any) => i !== val))}
                    onClose={() => setSettingsMode(null)} 
                />
            )}
        </div>
    );
}

// Helper Component for Tables
const ConfigTableSection = ({ title, isReadOnly, dropdownOptions, openMaster, headers, items, fields, onAdd, onRemove, updateArrayItem }: any) => (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm animate-fadeIn">
        <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
            <h4 className="font-bold text-sm text-[#2E3338] uppercase">{title}</h4>
            {!isReadOnly && <button onClick={onAdd} className="text-xs bg-[#C22D2E] text-white px-3 py-1 rounded hover:bg-[#BB8588] flex items-center gap-1"><LucideIcon name="plus" size={12}/> Add</button>}
        </div>
        <table className="w-full text-left text-xs">
            <thead className="bg-[#2E3338] text-white uppercase">
                <tr>
                    {headers.map((h: any, i: number) => (
                        <th key={i} className={`p-3 ${i > 0 ? 'text-center' : ''}`}>
                            <div className="flex items-center gap-1 justify-center">
                                {h.label}
                                {h.gear && !isReadOnly && <button onClick={() => openMaster({ key: h.key, title: h.label })} className="text-white/50 hover:text-white"><LucideIcon name="settings" size={10} /></button>}
                            </div>
                        </th>
                    ))}
                    {!isReadOnly && <th className="p-3 text-center w-10"></th>}
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {items.map((item: any, idx: number) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                        {fields.map((f: any, i: number) => (
                            <td key={i} className={`p-3 ${f.align || 'text-left'}`}>
                                {isReadOnly ? (
                                    <span className={f.class || 'text-gray-700'}>
                                        {f.type === 'boolean' ? (item[f.key] ? 'Yes' : 'No') : item[f.key]}
                                    </span>
                                ) : (
                                    f.type === 'select' ? (
                                        <select 
                                            value={item[f.key]} 
                                            onChange={e => updateArrayItem(item.id, f.key, e.target.value)}
                                            className={`w-full bg-transparent border-b border-dashed border-gray-300 focus:border-[#C22D2E] outline-none ${f.class || ''}`}
                                        >
                                            <option value="">-Select-</option>
                                            {dropdownOptions[f.listKey]?.map((o: any) => <option key={o} value={o}>{o}</option>)}
                                        </select>
                                    ) : f.type === 'boolean' ? (
                                         <select 
                                            value={item[f.key]} 
                                            onChange={e => updateArrayItem(item.id, f.key, e.target.value === 'true')}
                                            className="w-full bg-transparent border-b border-dashed border-gray-300 focus:border-[#C22D2E] outline-none text-center"
                                        >
                                            <option value="false">No</option>
                                            <option value="true">Yes</option>
                                        </select>
                                    ) : (
                                        <input 
                                            type={f.type || 'text'} 
                                            value={item[f.key]} 
                                            onChange={e => updateArrayItem(item.id, f.key, f.type === 'number' ? parseFloat(e.target.value) : e.target.value)}
                                            className={`w-full bg-transparent border-b border-dashed border-gray-300 focus:border-[#C22D2E] outline-none ${f.class || ''} ${f.align === 'text-center' ? 'text-center' : f.align === 'text-right' ? 'text-right' : 'text-left'}`}
                                        />
                                    )
                                )}
                            </td>
                        ))}
                        {!isReadOnly && (
                            <td className="p-3 text-center">
                                <button onClick={() => onRemove(item.id)} className="text-gray-300 hover:text-red-500"><LucideIcon name="trash-2" size={14}/></button>
                            </td>
                        )}
                    </tr>
                ))}
                {items.length === 0 && <tr><td colSpan={headers.length + 1} className="p-6 text-center text-gray-400 italic">No configuration added.</td></tr>}
            </tbody>
        </table>
    </div>
);

export const ProductionStandards: React.FC = () => {
    const [searchTerm, setSearchQuery] = useState('');
    const [masterData, setMasterData] = useState<ProductionStandard[]>([]);
    const [filterCategory, setFilterCategory] = useState('All');
    const [categories, setCategories] = useState(INITIAL_CATEGORIES);
    const [modalConfig, setModalConfig] = useState({ isOpen: false, mode: 'view', data: null });
    const [showGuide, setShowGuide] = useState(false);
    const [csvModalOpen, setCsvModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Load from Cloud
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const data = await fetchSheetData<ProductionStandard>(SHEET_NAMES.PRODUCTION_STANDARDS);
            if(data && data.length > 0) {
                setMasterData(data);
            } else {
                // FALLBACK TO MOCK DATA FOR DEMO
                setMasterData(MOCK_STANDARDS);
                // Auto Initialize
                const headers = [
                    'id', 'name', 'category', 'rawWeightPerBatch', 'yieldPercent', 'status', 'updateDate',
                    'mixingStandards', 'formingStandards', 'cookingStandards', 'coolingStandards', 
                    'peelingStandards', 'cuttingStandards', 'packingStandards', 'packVariants'
                ];
                saveSheetData(SHEET_NAMES.PRODUCTION_STANDARDS, MOCK_STANDARDS, headers);
            }
            setLoading(false);
        };
        load();
    }, []);

    const filteredData = useMemo(() => {
        return masterData.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  item.id.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
            return matchesSearch && matchesCategory;
        });
    }, [searchTerm, masterData, filterCategory]);

    const saveDataToCloud = async (newData: ProductionStandard[]) => {
         const headers = [
            'id', 'name', 'category', 'rawWeightPerBatch', 'yieldPercent', 'status', 'updateDate',
            'mixingStandards', 'formingStandards', 'cookingStandards', 'coolingStandards', 
            'peelingStandards', 'cuttingStandards', 'packingStandards', 'packVariants'
        ];
        await saveSheetData(SHEET_NAMES.PRODUCTION_STANDARDS, newData, headers);
    };

    const handleDelete = (id: string) => {
        if(Swal) {
            Swal.fire({ title: 'Are you sure?', text: "You won't be able to revert this!", icon: 'warning', showCancelButton: true, confirmButtonColor: '#D94A3D', confirmButtonText: 'Yes, delete it!' }).then((result: any) => { 
                if (result.isConfirmed) { 
                    const newData = masterData.filter(item => item.id !== id);
                    setMasterData(newData); 
                    saveDataToCloud(newData);
                    Swal.fire('Deleted!', 'Record deleted.', 'success'); 
                } 
            });
        }
    };

    const handleSave = (newItem: any) => {
        let newData;
        if (modalConfig.data) {
             newData = masterData.map(i => i.id === newItem.id ? { ...newItem, updateDate: new Date().toLocaleDateString('en-GB') } : i);
        } else {
             const newId = `STD-${Date.now().toString().slice(-6)}`;
             newData = [...masterData, { ...newItem, id: newId, updateDate: new Date().toLocaleDateString('en-GB') }];
        }
        setMasterData(newData);
        saveDataToCloud(newData);
    };

    const handleCsvUpload = (newItems: any[]) => {
        // Merge logic
        const updated = [...masterData];
        newItems.forEach(ni => {
            const idx = updated.findIndex(u => u.id === ni.id);
            if (idx >= 0) updated[idx] = ni; else updated.push(ni);
        });
        setMasterData(updated);
        saveDataToCloud(updated);
    };

    // Pagination
    useEffect(() => { setCurrentPage(1); }, [searchTerm, filterCategory, itemsPerPage]);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    if(loading) return <div className="flex h-full items-center justify-center"><LucideIcon name="loader-2" size={40} className="animate-spin text-[#C22D2E]" /></div>;

    return (
        <div className="flex h-full flex-col font-sans overflow-hidden bg-[#F2F4F6]">
            
            <UserGuidePanel isOpen={showGuide} onClose={() => setShowGuide(false)} />
            <CsvUploadModal isOpen={csvModalOpen} onClose={() => setCsvModalOpen(false)} onUpload={handleCsvUpload} />
            
            <ConfigModal 
                isOpen={modalConfig.isOpen} 
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })} 
                data={modalConfig.data} 
                mode={modalConfig.mode}
                onSave={handleSave} 
                categories={categories}
            />

            {/* HEADER SECTION */}
            <div className="px-8 py-6 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-[#C22D2E] text-white shadow-lg shadow-[#C22D2E]/20 border border-white/20">
                        <LucideIcon name="settings-2" size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-[#2E3338] tracking-tight uppercase leading-none">PRODUCTION STANDARDS</h1>
                        <p className="text-sm text-[#64748B] font-medium mt-1">มาตรฐานการผลิตสินค้า (SFG Standard Process)</p>
                    </div>
                </div>
                <button onClick={() => setShowGuide(true)} className="p-2 text-gray-400 hover:text-[#C22D2E] transition-all opacity-80 hover:opacity-100" title="User Guide">
                    <LucideIcon name="help-circle" size={26} />
                </button>
            </div>

            {/* MAIN CONTENT CARD */}
            <div className="flex-1 px-8 pb-8 overflow-hidden">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full flex flex-col overflow-hidden">
                    
                    {/* TOOLBAR */}
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center z-10 shrink-0 bg-white">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                                <LucideIcon name="list" size={16} className="text-[#C22D2E]"/>
                                <span>Standard List</span>
                            </div>
                            <span className="text-gray-300">|</span>
                            <div className="relative">
                                <LucideIcon name="filter" size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="pl-8 pr-4 py-1.5 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:border-[#C22D2E] outline-none cursor-pointer hover:bg-white transition-colors font-bold text-gray-600">
                                    <option value="All">All Categories</option>
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded">{filteredData.length} Records</div>
                        </div>
                        <div className="flex gap-2">
                            <div className="relative">
                                <LucideIcon name="search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input type="text" placeholder="Search ID, Name..." value={searchTerm} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#C22D2E] w-56 font-sans bg-gray-50 focus:bg-white transition-all" />
                            </div>
                            <button onClick={() => setCsvModalOpen(true)} className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-all">
                                <LucideIcon name="upload" size={14} /> Import
                            </button>
                            <button onClick={() => setModalConfig({ isOpen: true, mode: 'edit', data: null })} className="bg-[#C22D2E] hover:bg-[#BB8588] text-white px-4 py-2 rounded-lg font-bold text-xs shadow-md flex items-center gap-2 transition-all active:scale-95 uppercase tracking-wide">
                                <LucideIcon name="plus" size={16} /> New Standard
                            </button>
                        </div>
                    </div>

                    {/* TABLE */}
                    <div className="flex-1 overflow-hidden flex flex-col">
                        <div className="overflow-y-auto flex-1 custom-scrollbar">
                            <table className="w-full text-left font-sans">
                                <thead className="sticky top-0 z-10">
                                    <tr>
                                        <th className="text-[11px] uppercase tracking-[0.05em] text-white px-4 py-3 font-bold bg-[#2E3338] border-b-2 border-[#C22D2E] whitespace-nowrap pl-6">Standard ID</th>
                                        <th className="text-[11px] uppercase tracking-[0.05em] text-white px-4 py-3 font-bold bg-[#2E3338] border-b-2 border-[#C22D2E] whitespace-nowrap">Standard Name</th>
                                        <th className="text-[11px] uppercase tracking-[0.05em] text-white px-4 py-3 font-bold bg-[#2E3338] border-b-2 border-[#C22D2E] whitespace-nowrap">Category</th>
                                        <th className="text-[11px] uppercase tracking-[0.05em] text-white px-4 py-3 font-bold bg-[#2E3338] border-b-2 border-[#C22D2E] whitespace-nowrap text-center">Batch Size</th>
                                        <th className="text-[11px] uppercase tracking-[0.05em] text-white px-4 py-3 font-bold bg-[#2E3338] border-b-2 border-[#C22D2E] whitespace-nowrap text-center">Yield</th>
                                        <th className="text-[11px] uppercase tracking-[0.05em] text-white px-4 py-3 font-bold bg-[#2E3338] border-b-2 border-[#C22D2E] whitespace-nowrap text-center">Status</th>
                                        <th className="text-[11px] uppercase tracking-[0.05em] text-white px-4 py-3 font-bold bg-[#2E3338] border-b-2 border-[#C22D2E] whitespace-nowrap text-center">Last Update</th>
                                        <th className="text-[11px] uppercase tracking-[0.05em] text-white px-4 py-3 font-bold bg-[#2E3338] border-b-2 border-[#C22D2E] whitespace-nowrap text-center pr-6">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-sm">
                                    {currentItems.map((item: any) => (
                                        <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                                            <td className="px-4 py-3 align-middle text-[#2E395F] text-[12px] border-b border-gray-200 pl-6 font-bold font-mono text-[#C22D2E] cursor-pointer hover:underline" onClick={() => setModalConfig({ isOpen: true, mode: 'view', data: item })}>{item.id}</td>
                                            <td className="px-4 py-3 align-middle text-[#2E395F] text-[12px] border-b border-gray-200 font-bold text-gray-700 cursor-pointer hover:text-[#C22D2E]" onClick={() => setModalConfig({ isOpen: true, mode: 'view', data: item })}>{item.name}</td>
                                            <td className="px-4 py-3 align-middle text-[#2E395F] text-[12px] border-b border-gray-200">
                                                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-bold border border-gray-200 uppercase">{item.category}</span>
                                            </td>
                                            <td className="px-4 py-3 align-middle text-[#2E395F] text-[12px] border-b border-gray-200 text-center font-bold font-mono">{item.rawWeightPerBatch}</td>
                                            <td className="px-4 py-3 align-middle text-[#2E395F] text-[12px] border-b border-gray-200 text-center font-bold text-green-600">{item.yieldPercent}%</td>
                                            <td className="px-4 py-3 align-middle text-[#2E395F] text-[12px] border-b border-gray-200 text-center">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shadow-sm ${item.status === 'Active' ? 'bg-[#3A7283] text-white' : 'bg-[#ABB7BF] text-white'}`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 align-middle text-[#2E395F] text-[12px] border-b border-gray-200 text-center text-xs text-gray-400">{item.updateDate}</td>
                                            <td className="px-4 py-3 align-middle text-[#2E395F] text-[12px] border-b border-gray-200 text-center pr-6">
                                                <div className="flex justify-center gap-0.5 opacity-100">
                                                    <button onClick={() => setModalConfig({ isOpen: true, mode: 'edit', data: item })} className="w-8 h-8 flex items-center justify-center border border-gray-200 hover:bg-[#4F5E75]/10 text-[#4F5E75] rounded-lg transition-colors"><LucideIcon name="pencil" size={16} /></button>
                                                    <button onClick={() => handleDelete(item.id)} className="w-8 h-8 flex items-center justify-center border border-gray-200 hover:bg-red-50 text-red-500 rounded-lg transition-colors"><LucideIcon name="trash-2" size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {currentItems.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-gray-400 italic">No standards found.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                        {/* Pagination */}
                        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-4">
                                <span className="text-xs text-gray-500 font-medium">Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredData.length)} of {filteredData.length} entries</span>
                                <select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))} className="text-xs border border-gray-300 rounded p-1 text-gray-600 focus:border-[#C22D2E] outline-none bg-white cursor-pointer"><option value={10}>10 / page</option><option value={20}>20 / page</option><option value={50}>50 / page</option></select>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-gray-600"><LucideIcon name="chevron-left" size={16} /></button>
                                <span className="text-xs font-bold text-gray-600 min-w-[60px] text-center">Page {currentPage} of {totalPages || 1}</span>
                                <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-gray-600"><LucideIcon name="chevron-right" size={16} /></button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}