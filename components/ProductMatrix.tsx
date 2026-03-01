import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import * as LucideIcons from 'lucide-react';
import { fetchSheetData, saveSheetData } from '../services/sheetService';
import { SHEET_NAMES } from '../constants';
import { MasterItem, ProductMatrixItem, ProductionStandard } from '../types';

const Swal = (window as any).Swal;
const Papa = (window as any).Papa;

const STYLES = {
    th: "text-[12px] uppercase tracking-[0.05em] text-white px-4 py-3.5 font-bold bg-[#2E3338] border-b-2 border-[#C22D2E] whitespace-nowrap",
    td: "px-4 py-3 align-top text-[#2E395F] text-[12px] border-b border-gray-200",
    dragActive: "border-[#C22D2E] bg-[rgba(194,45,46,0.05)]"
};

const LucideIcon = ({ name, size = 16, className = "", style }: any) => {
    const iconName = name.split('-').map((part: string) => part.charAt(0).toUpperCase() + part.slice(1)).join('');
    const IconComponent = (LucideIcons as any)[iconName] || (LucideIcons as any)[name] || LucideIcons.HelpCircle;
    return <IconComponent size={size} className={className} style={style} />;
};

// ... (UserGuidePanel, CsvUploadModal, MatrixConfigModal helpers omitted for brevity but preserved) ...
function UserGuidePanel({ isOpen, onClose }: any) {
    if (typeof document === 'undefined') return null;
    return createPortal(
        <>
            <div className={`fixed inset-0 z-[190] bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={onClose}/>
            <div className={`fixed inset-y-0 right-0 z-[200] w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="p-5 bg-[#2E3338] text-white flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3"><LucideIcon name="book-open" size={24} style={{color: '#DCBC1B'}}/><h3 className="font-bold text-lg font-sans tracking-tight">คู่มือการใช้งาน</h3></div>
                    <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full transition-colors"><LucideIcon name="x" size={20}/></button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 font-sans">
                    <section>
                        <h4 className="font-bold text-[#C22D2E] text-sm mb-3 flex items-center gap-2 border-b border-gray-200 pb-2"><LucideIcon name="git-merge" size={16}/> Product Structure</h4>
                        <ul className="list-disc list-outside ml-4 text-xs text-gray-600 space-y-2 leading-relaxed">
                            <li><strong>SFG Definition:</strong> กำหนดสินค้ากึ่งสำเร็จรูปที่เป็นแกนหลักในการผลิต</li>
                            <li><strong>Batter Config:</strong> กำหนดสูตร Batter หรือส่วนผสมที่ใช้ (รองรับหลาย Layer/Filling) โดยต้องระบุสัดส่วนรวมกันให้ได้ 100%</li>
                            <li><strong>FG Mapping:</strong> จับคู่สินค้าขาย (SKU) ที่เกิดจาก SFG ตัวนี้</li>
                        </ul>
                    </section>
                </div>
            </div>
        </>, document.body
    );
}

function CsvUploadModal({ isOpen, onClose, onUpload }: any) {
    const [dragActive, setDragActive] = useState(false);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<any>(null);

    if (!isOpen) return null;

    const handleDrag = (e: any) => { e.preventDefault(); e.stopPropagation(); if (e.type === "dragenter" || e.type === "dragover") setDragActive(true); else setDragActive(false); };
    const handleDrop = (e: any) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); if (e.dataTransfer.files && e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]); };
    const handleChange = (e: any) => { if (e.target.files && e.target.files[0]) processFile(e.target.files[0]); };
    
    const processFile = (file: any) => {
        setError(null);
        if(!Papa) { setError("CSV Parser not loaded"); return; }
        Papa.parse(file, { header: true, skipEmptyLines: true, complete: function (results: any) {
            if (results.errors.length > 0) { setError("Error parsing CSV: " + results.errors[0].message); return; }
            const requiredHeaders = ["SFG_ID", "SFG_Name", "FG_SKU", "FG_Name", "Brand", "Weight", "Pieces"];
            const missing = requiredHeaders.filter(h => !results.meta.fields.includes(h));
            if (!results.meta.fields.includes("Batter_ID") && !results.meta.fields.includes("Batter_IDs")) { setError("Missing columns: Batter_ID or Batter_IDs"); return; }
            if (missing.length > 0) { setError(`Missing columns: ${missing.join(", ")}`); return; }
            setPreviewData(results.data);
        }});
    };

    const confirmUpload = () => {
        const newSfgsMap: any = {};
        previewData.forEach(row => {
            let batters = [];
            if (row.Batter_IDs) {
                const ids = row.Batter_IDs.split(',').map((s: string) => s.trim()).filter((s: string) => s);
                const defaultRatio = ids.length > 0 ? Math.floor(100 / ids.length) : 0;
                batters = ids.map((id: string) => ({ id, ratio: defaultRatio }));
            } else if (row.Batter_ID) {
                batters = [{ id: row.Batter_ID.trim(), ratio: 100 }];
            }
            if (!newSfgsMap[row.SFG_ID]) {
                newSfgsMap[row.SFG_ID] = { id: row.SFG_ID, name: row.SFG_Name, batterConfig: batters, fgs: [] };
            }
            if (row.FG_SKU) {
                newSfgsMap[row.SFG_ID].fgs.push({ sku: row.FG_SKU, name: row.FG_Name, brand: row.Brand, weight: parseFloat(row.Weight) || 0, pieces: parseInt(row.Pieces) || 0 });
            }
        });
        onUpload(Object.values(newSfgsMap)); onClose(); setPreviewData([]); setError(null);
        if(Swal) Swal.fire({ icon: 'success', title: 'Imported!', timer: 1500, showConfirmButton: false });
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn font-sans">
            <DraggableModalWrapper className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-[#2E3338] text-white">
                    <h3 className="font-bold flex items-center gap-2"><LucideIcon name="upload-cloud" /> Import CSV</h3>
                    <button onClick={onClose}><LucideIcon name="x" /></button>
                </div>
                <div className="p-6 flex-1 overflow-y-auto">
                    {!previewData.length ? (
                        <div className={`border-2 border-dashed rounded-xl p-10 text-center transition-all ${dragActive ? STYLES.dragActive : 'border-gray-300'}`} onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}>
                            <p className="text-gray-600 font-bold mb-2">Drag & Drop CSV file here</p>
                            <button onClick={() => fileInputRef.current.click()} className="bg-[#C22D2E] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#BB8588] transition-colors">Browse File</button>
                            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleChange} />
                        </div>
                    ) : (
                        <div className="overflow-x-auto border border-gray-200 rounded-lg max-h-[300px]">
                            <table className="w-full text-left text-xs whitespace-nowrap"><thead className="bg-gray-50 text-gray-500 sticky top-0"><tr><th className="p-2 border-b">SFG_ID</th><th className="p-2 border-b">FG_SKU</th><th className="p-2 border-b">FG_Name</th></tr></thead><tbody className="divide-y divide-gray-100">{previewData.slice(0, 10).map((row, i) => (<tr key={i}><td className="p-2 font-mono text-[#3A5E7A]">{row.SFG_ID}</td><td className="p-2 font-mono">{row.FG_SKU}</td><td className="p-2">{row.FG_Name}</td></tr>))}</tbody></table>
                        </div>
                    )}
                    {error && <div className="mt-4 p-3 bg-red-50 text-red-600 text-xs rounded-lg border border-red-100 flex items-center gap-2"><LucideIcon name="alert-circle" size={16}/> {error}</div>}
                </div>
                {previewData.length > 0 && <div className="p-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50"><button onClick={onClose} className="px-4 py-2 text-gray-500 font-bold text-sm">Cancel</button><button onClick={confirmUpload} className="px-6 py-2 bg-green-600 text-white font-bold text-sm rounded-lg shadow-lg">Confirm</button></div>}
            </DraggableModalWrapper>
        </div>
    );
}

function MatrixConfigModal({ isOpen, onClose, sfgData, onSave, batters, fgDatabase }: any) {
    const [formData, setFormData] = useState<ProductMatrixItem | null>(null);
    const [selectedFgSku, setSelectedFgSku] = useState('');
    const [selectedBatterId, setSelectedBatterId] = useState('');

    useEffect(() => {
        if (isOpen && sfgData) {
            const data = JSON.parse(JSON.stringify(sfgData));
            if (!data.batterConfig) data.batterConfig = (data as any).batterId ? [{ id: (data as any).batterId, ratio: 100 }] : [];
            setFormData(data); 
        } else if (isOpen) {
            setFormData({ id: '', name: '', batterConfig: [], fgs: [] }); 
        }
        setSelectedFgSku(''); setSelectedBatterId('');
    }, [isOpen, sfgData]);

    if (!isOpen || !formData) return null;

    const totalRatio = formData.batterConfig.reduce((acc, curr) => acc + (parseFloat(String(curr.ratio)) || 0), 0);
    const isRatioValid = Math.abs(totalRatio - 100) < 0.1;

    const handleSave = () => {
        if (formData.batterConfig.length > 0 && !isRatioValid) { if(Swal) Swal.fire({ icon: 'warning', title: 'Ratio Mismatch', text: `Total ratio is ${totalRatio}%. It must be 100%.` }); return; }
        onSave(formData); onClose();
    };

    const handleAddBatter = () => {
        if (selectedBatterId && !formData.batterConfig.some(b => b.id === selectedBatterId)) {
            const currentTotal = formData.batterConfig.reduce((acc, curr) => acc + (parseFloat(String(curr.ratio)) || 0), 0);
            const remaining = Math.max(0, 100 - currentTotal);
            setFormData({ ...formData, batterConfig: [...formData.batterConfig, { id: selectedBatterId, ratio: remaining }] });
            setSelectedBatterId('');
        }
    };

    const handleAddFgFromDb = () => {
        if (!selectedFgSku) return;
        const fgMaster = fgDatabase.find((f: any) => f.sku === selectedFgSku);
        if (fgMaster) {
            if (formData.fgs.some(f => f.sku === fgMaster.sku)) { if(Swal) Swal.fire({ icon: 'warning', title: 'Duplicate', text: 'SKU already mapped.', timer: 1000 }); return; }
            setFormData({ ...formData, fgs: [...formData.fgs, { sku: fgMaster.sku, name: fgMaster.name, brand: fgMaster.brand, weight: fgMaster.weight, pieces: 0 }] });
            setSelectedFgSku('');
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in font-sans">
            <DraggableModalWrapper className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden border-t-8 border-[#C22D2E]">
                <div className="bg-white px-6 py-4 flex justify-between items-center shrink-0 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-[#2E3338]">Product Structure Config</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-600"><LucideIcon name="x" size={24} /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-8 bg-[#F9F8F4]">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-6">
                        <div className="grid grid-cols-3 gap-6">
                            <div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">SFG Code</label><input type="text" value={formData.id} onChange={e => setFormData({...formData, id: e.target.value})} className="w-full border rounded p-2 text-sm font-mono font-bold focus:border-[#C22D2E] outline-none" disabled={!!sfgData} /></div>
                            <div className="col-span-2"><label className="text-xs font-bold text-gray-500 uppercase block mb-1">SFG Name</label><input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border rounded p-2 text-sm font-bold focus:border-[#C22D2E] outline-none" /></div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col">
                            <h4 className="text-sm font-bold text-[#2E3338] border-b border-gray-100 pb-2 mb-4 uppercase flex justify-between"><span>Batter Composition</span><span className={`text-[10px] px-2 py-0.5 rounded ${isRatioValid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>Total: {totalRatio}%</span></h4>
                            <div className="flex gap-2 mb-4"><select value={selectedBatterId} onChange={e => setSelectedBatterId(e.target.value)} className="flex-1 border rounded p-2 text-xs bg-gray-50 outline-none"><option value="">-- Select Batter --</option>{batters.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}</select><button onClick={handleAddBatter} className="bg-[#55738D] text-white px-3 py-1 rounded"><LucideIcon name="plus" size={16}/></button></div>
                            <div className="flex-1 overflow-y-auto max-h-[300px] space-y-2 custom-scrollbar pr-1">{formData.batterConfig.map((b, idx) => (<div key={idx} className="flex justify-between p-2 border border-gray-100 rounded bg-gray-50 text-xs"><div className="flex-1 font-bold">{batters.find((x: any) => x.id === b.id)?.name || b.id}</div><div className="flex items-center gap-2"><input type="number" value={b.ratio} onChange={e => {const newC = [...formData.batterConfig]; newC[idx].ratio = parseFloat(e.target.value)||0; setFormData({...formData, batterConfig: newC})}} className="w-12 text-right border rounded p-1 font-bold" /><span className="text-gray-500">%</span><button onClick={() => setFormData({...formData, batterConfig: formData.batterConfig.filter(x=>x.id!==b.id)})} className="text-red-400"><LucideIcon name="x" size={14}/></button></div></div>))}</div>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col">
                            <h4 className="text-sm font-bold text-[#2E3338] border-b border-gray-100 pb-2 mb-4 uppercase">Mapped SKUs (FGs)</h4>
                             <div className="flex gap-2 mb-4"><input type="text" list="fgList" value={selectedFgSku} onChange={e => setSelectedFgSku(e.target.value)} className="w-full border rounded p-2 text-xs bg-gray-50 outline-none" placeholder="Search SKU..." /><datalist id="fgList">{fgDatabase.map((fg: any) => <option key={fg.sku} value={fg.sku}>{fg.name}</option>)}</datalist><button onClick={handleAddFgFromDb} className="bg-[#C22D2E] text-white px-3 py-1 rounded"><LucideIcon name="plus" size={16}/></button></div>
                            <div className="flex-1 overflow-y-auto max-h-[300px] space-y-2 custom-scrollbar pr-1">{formData.fgs.map((fg, idx) => (<div key={idx} className="p-2 border border-gray-100 rounded bg-gray-50 text-xs relative group"><div className="flex justify-between items-start mb-1"><span className="font-bold text-[#2E395F]">{fg.sku}</span><button onClick={() => setFormData({...formData, fgs: formData.fgs.filter((_, i) => i !== idx)})} className="text-gray-300 hover:text-red-500"><LucideIcon name="trash-2" size={12}/></button></div><div className="text-gray-600 truncate mb-2">{fg.name}</div></div>))}</div>
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 shrink-0"><button onClick={onClose} className="px-6 py-2 text-gray-500 font-bold text-sm">Cancel</button><button onClick={handleSave} className="px-8 py-2 bg-[#C22D2E] text-white font-bold text-sm rounded-lg shadow-lg">Save Config</button></div>
            </DraggableModalWrapper>
        </div>
    );
}

export const ProductMatrix: React.FC = () => {
    const [searchTerm, setSearchQuery] = useState('');
    const [matrixData, setMatrixData] = useState<ProductMatrixItem[]>([]);
    const [masterItems, setMasterItems] = useState<MasterItem[]>([]);
    const [batters, setBatters] = useState<any[]>([]);
    const [modal, setModal] = useState<{ isOpen: boolean, data: ProductMatrixItem | null }>({ isOpen: false, data: null });
    const [csvModalOpen, setCsvModalOpen] = useState(false);
    const [showGuide, setShowGuide] = useState(false);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const [mItems, pStds, matrix] = await Promise.all([
                fetchSheetData<MasterItem>(SHEET_NAMES.MASTER_ITEMS),
                fetchSheetData<ProductionStandard>(SHEET_NAMES.PRODUCTION_STANDARDS),
                fetchSheetData<ProductMatrixItem>(SHEET_NAMES.MATRIX)
            ]);
            setMasterItems(mItems || []);
            setBatters((pStds || []).map(p => ({ id: p.id, name: p.name })));
            if (matrix && matrix.length > 0) setMatrixData(matrix);
            setLoading(false);
        };
        load();
    }, []);

    const filteredData = useMemo(() => matrixData.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.id.toLowerCase().includes(searchTerm.toLowerCase())), [searchTerm, matrixData]);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    const saveData = async (data: ProductMatrixItem[]) => saveSheetData(SHEET_NAMES.MATRIX, data, ['id', 'name', 'batterConfig', 'fgs']);
    const handleSave = (item: ProductMatrixItem) => { const newData = modal.data ? matrixData.map(i => i.id === item.id ? item : i) : [...matrixData, item]; setMatrixData(newData); saveData(newData); };
    const handleDelete = (id: string) => { if(Swal) Swal.fire({ title: 'Are you sure?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33' }).then((r: any) => { if(r.isConfirmed) { const n = matrixData.filter(i => i.id !== id); setMatrixData(n); saveData(n); } }); };

    if(loading) return <div className="flex h-full items-center justify-center"><LucideIcon name="loader-2" size={40} className="animate-spin text-[#C22D2E]" /></div>;

    return (
        <div className="flex h-full flex-col font-sans overflow-hidden bg-[#F2F4F6]">
            <UserGuidePanel isOpen={showGuide} onClose={() => setShowGuide(false)} />
            <CsvUploadModal isOpen={csvModalOpen} onClose={() => setCsvModalOpen(false)} onUpload={(d: any) => { const n = [...matrixData, ...d]; setMatrixData(n); saveData(n); }} />
            <MatrixConfigModal isOpen={modal.isOpen} onClose={() => setModal({ ...modal, isOpen: false })} sfgData={modal.data} onSave={handleSave} batters={batters} fgDatabase={masterItems} />

            {/* HEADER SECTION */}
            <div className="px-8 py-6 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-[#C22D2E] text-white shadow-lg shadow-[#C22D2E]/20 border border-white/20">
                        <LucideIcon name="git-merge" size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-[#2E3338] tracking-tight uppercase leading-none">PRODUCT MATRIX</h1>
                        <p className="text-sm text-[#64748B] font-medium mt-1">กำหนดโครงสร้างความสัมพันธ์ Batter &rarr; SFG &rarr; FG</p>
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
                                <span>SFG Master List</span>
                            </div>
                            <span className="text-gray-300">|</span>
                            <div className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded">{filteredData.length} Records</div>
                        </div>
                        <div className="flex gap-2">
                            <div className="relative">
                                <LucideIcon name="search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                                <input type="text" placeholder="Search SFG..." value={searchTerm} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#C22D2E] w-56 font-sans bg-gray-50 focus:bg-white transition-all" />
                            </div>
                            <button onClick={() => setCsvModalOpen(true)} className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-all"><LucideIcon name="upload" size={14} /> Import</button>
                            <button onClick={() => setModal({ isOpen: true, data: null })} className="bg-[#C22D2E] hover:bg-[#BB8588] text-white px-4 py-2 rounded-lg font-bold text-xs shadow-md flex items-center gap-2 transition-all active:scale-95 uppercase tracking-wide"><LucideIcon name="plus" size={16} /> New SFG</button>
                        </div>
                    </div>

                    {/* TABLE */}
                    <div className="flex-1 overflow-hidden flex flex-col">
                        <div className="overflow-y-auto flex-1 custom-scrollbar">
                            <table className="w-full text-left font-sans">
                                <thead className="sticky top-0 z-10"><tr><th className={`${STYLES.th} pl-6`}>SFG Code</th><th className={STYLES.th}>SFG Name</th><th className={STYLES.th}>Batter Config</th><th className={STYLES.th}>Mapped FGs</th><th className={`${STYLES.th} text-center pr-6`}>Action</th></tr></thead>
                                <tbody className="divide-y divide-gray-100 text-sm">
                                    {currentItems.map(item => (
                                        <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                                            <td className={`${STYLES.td} pl-6 font-bold font-mono text-[#C22D2E]`}>{item.id}</td>
                                            <td className={`${STYLES.td} font-bold text-gray-700`}>{item.name}</td>
                                            <td className={STYLES.td}><div className="flex flex-wrap gap-1">{item.batterConfig?.map((b, i) => (<span key={i} className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#55738D]/10 text-[#55738D] border border-[#55738D]/20">{b.id} ({b.ratio}%)</span>))}{(!item.batterConfig?.length) && <span className="text-gray-300 italic text-xs">-</span>}</div></td>
                                            <td className={STYLES.td}><div className="flex flex-col gap-1">{item.fgs?.slice(0, 3).map((f, i) => (<span key={i} className="text-xs text-gray-600 flex items-center gap-1"><LucideIcon name="check" size={10} className="text-green-500"/> {f.sku}</span>))}{item.fgs && item.fgs.length > 3 && <span className="text-[10px] text-gray-400 italic">+{item.fgs.length - 3} more...</span>}</div></td>
                                            <td className={`${STYLES.td} text-center pr-6`}><div className="flex justify-center gap-0.5"><button onClick={() => setModal({ isOpen: true, data: item })} className="w-8 h-8 flex items-center justify-center border border-gray-200 hover:bg-[#4F5E75]/10 text-[#4F5E75] rounded-lg transition-colors"><LucideIcon name="pencil" size={16} /></button><button onClick={() => handleDelete(item.id)} className="w-8 h-8 flex items-center justify-center border border-gray-200 hover:bg-red-50 text-red-500 rounded-lg transition-colors"><LucideIcon name="trash-2" size={16} /></button></div></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-4"><span className="text-xs text-gray-500 font-medium">Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredData.length)} of {filteredData.length} entries</span><select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))} className="text-xs border border-gray-300 rounded p-1 text-gray-600 focus:border-[#C22D2E] outline-none bg-white cursor-pointer"><option value={10}>10 / page</option><option value={20}>20 / page</option><option value={50}>50 / page</option></select></div>
                            <div className="flex items-center gap-2"><button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-gray-600"><LucideIcon name="chevron-left" size={16} /></button><span className="text-xs font-bold text-gray-600 min-w-[60px] text-center">Page {currentPage} of {totalPages || 1}</span><button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-gray-600"><LucideIcon name="chevron-right" size={16} /></button></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};