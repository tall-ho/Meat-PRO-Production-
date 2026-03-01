import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import * as LucideIcons from 'lucide-react';
import { fetchSheetData, saveSheetData } from '../services/sheetService';
import { SHEET_NAMES } from '../constants';
import { MasterItem } from '../types';
import { DraggableModalWrapper } from './DraggableModalWrapper';

const Swal = (window as any).Swal;
const Papa = (window as any).Papa;

const STYLES = {
    th: "text-[12px] uppercase tracking-[0.05em] text-white px-4 py-3.5 font-bold bg-[#2E3338] border-b-2 border-[#C22D2E] whitespace-nowrap",
    td: "px-4 py-3 align-middle text-[#2E395F] text-[12px] border-b border-gray-200",
    dragActive: "border-[#C22D2E] bg-[rgba(194,45,46,0.05)]"
};

const INITIAL_FG_DATA: MasterItem[] = [
    { sku: 'FG-1001', name: 'ไส้กรอกไก่จัมโบ้ ARO 1kg', category: 'Sausage', brand: 'ARO', weight: 1000, pieces: 20, status: 'Active', updated: '01/02/2026' },
    { sku: 'FG-1002', name: 'ไส้กรอกไก่จัมโบ้ CP 500g', category: 'Sausage', brand: 'CP', weight: 500, pieces: 10, status: 'Active', updated: '01/02/2026' },
    { sku: 'FG-2001', name: 'ไส้กรอกคอกเทล ARO 1kg', category: 'Sausage', brand: 'ARO', weight: 1000, pieces: 40, status: 'Active', updated: '01/02/2026' },
    { sku: 'FG-3001', name: 'ลูกชิ้นหมู ARO 1kg', category: 'Meatball', brand: 'ARO', weight: 1000, pieces: 50, status: 'Active', updated: '02/02/2026' },
    { sku: 'FG-4001', name: 'โบโลน่าพริก CP 1kg (Sliced)', category: 'Bologna', brand: 'CP', weight: 1000, pieces: 45, status: 'Active', updated: '03/02/2026' },
    { sku: 'FG-5001', name: 'ไส้กรอกชีสลาวา 500g', category: 'Sausage', brand: 'BKP', weight: 500, pieces: 15, status: 'Active', updated: '03/02/2026' },
    { sku: 'FG-6001', name: 'ไก่จ๊อห่อฟองเต้าหู้ 1kg', category: 'NPD', brand: 'Mungmee', weight: 1000, pieces: 30, status: 'Inactive', updated: '01/01/2026' },
    { sku: 'FG-8001', name: 'แซนวิชไก่แฮม 500g', category: 'Sliced', brand: 'SAVE', weight: 500, pieces: 12, status: 'Active', updated: '04/02/2026' },
    { sku: 'FG-8002', name: 'ไก่ยอไส้ผักโขม 200g', category: 'Loaf', brand: 'Generic', weight: 200, pieces: 1, status: 'Active', updated: '04/02/2026' },
    { sku: 'FG-8003', name: 'ไส้กรอกระเบิดซอส 120g', category: 'Sausage', brand: 'BKP', weight: 120, pieces: 4, status: 'Draft', updated: '05/02/2026' }
];

const CATEGORIES = ['All', 'Sausage', 'Meatball', 'Bologna', 'Ham', 'Sliced', 'Loaf', 'NPD'];
const BRANDS = ['ARO', 'CP', 'BKP', 'SAVE', 'Mungmee', 'Generic', 'No Brand'];

const LucideIcon = ({ name, size = 16, className = "", style }: any) => {
    const iconName = name.split('-').map((part: string) => part.charAt(0).toUpperCase() + part.slice(1)).join('');
    const IconComponent = (LucideIcons as any)[iconName] || (LucideIcons as any)[name] || LucideIcons.HelpCircle;
    return <IconComponent size={size} className={className} style={style} />;
};

// ... (UserGuidePanel, CsvUploadModal, ItemModal remain the same, ommitted for brevity to focus on layout) ...
function UserGuidePanel({ isOpen, onClose }: any) {
    if (typeof document === 'undefined') return null;
    return createPortal(
        <>
            <div className={`fixed inset-0 z-[190] bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={onClose}/>
            <div className={`fixed inset-y-0 right-0 z-[200] w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="p-5 bg-[#2E3338] text-white flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3"><LucideIcon name="book-open" size={24} style={{color: '#DCBC1B'}}/><h3 className="font-bold text-lg font-sans tracking-tight">คู่มือการใช้งาน</h3></div>
                    <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full transition-colors"><LucideIcon name="x" size={20}/></button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 font-sans">
                    <section>
                        <h4 className="font-bold text-[#C22D2E] text-sm mb-3 flex items-center gap-2 border-b border-gray-200 pb-2"><LucideIcon name="database" size={16}/> Master Item Database</h4>
                        <ul className="list-disc list-outside ml-4 text-xs text-gray-600 space-y-2 leading-relaxed">
                            <li><strong>Purpose:</strong> หน้านี้ใช้สำหรับจัดการข้อมูล "สินค้าสำเร็จรูป (Finished Goods)" ทั้งหมดในระบบ</li>
                            <li><strong>SKU Code:</strong> รหัสสินค้าต้องไม่ซ้ำกัน (Unique) ใช้สำหรับอ้างอิงในระบบผลิตและคลังสินค้า</li>
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
    const fileInputRef = React.useRef<any>(null);

    if (!isOpen) return null;

    const handleDrag = (e: any) => { e.preventDefault(); e.stopPropagation(); if (e.type === "dragenter" || e.type === "dragover") setDragActive(true); else if (e.type === "dragleave") setDragActive(false); };
    const handleDrop = (e: any) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); if (e.dataTransfer.files && e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]); };
    const handleChange = (e: any) => { if (e.target.files && e.target.files[0]) processFile(e.target.files[0]); };
    
    const processFile = (file: any) => {
        setError(null);
        if(!Papa) { setError("CSV Parser not loaded"); return; }
        Papa.parse(file, { header: true, skipEmptyLines: true, complete: function (results: any) {
            if (results.errors.length > 0) { setError("Error parsing CSV: " + results.errors[0].message); return; }
            const requiredHeaders = ["SKU", "Name", "Category", "Brand", "Weight", "Pieces", "Status"];
            const headers = results.meta.fields;
            const missing = requiredHeaders.filter(h => !headers.includes(h));
            if (missing.length > 0) { setError(`Missing columns: ${missing.join(", ")}`); return; }
            setPreviewData(results.data);
        }});
    };

    const confirmUpload = () => {
        const newData = previewData.map(row => ({
            sku: row.SKU, name: row.Name, category: row.Category, brand: row.Brand,
            weight: parseFloat(row.Weight) || 0, pieces: parseInt(row.Pieces) || 0,
            status: row.Status || 'Active', updated: new Date().toLocaleDateString('en-GB')
        }));
        onUpload(newData); onClose(); setPreviewData([]); setError(null);
        if(Swal) Swal.fire({ icon: 'success', title: 'Imported!', timer: 1500, showConfirmButton: false });
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
                        <div className={`border-2 border-dashed rounded-xl p-10 text-center transition-all ${dragActive ? STYLES.dragActive : 'border-gray-300'}`} onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}>
                            <p className="text-gray-600 font-bold mb-2">Drag & Drop CSV file here</p>
                            <button onClick={() => fileInputRef.current.click()} className="bg-[#C22D2E] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#BB8588] transition-colors">Browse File</button>
                            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleChange} />
                        </div>
                    ) : (
                        <div className="overflow-x-auto border border-gray-200 rounded-lg max-h-[300px]">
                            <table className="w-full text-left text-xs whitespace-nowrap">
                                <thead className="bg-gray-50 text-gray-500 sticky top-0"><tr><th className="p-2 border-b">SKU</th><th className="p-2 border-b">Name</th></tr></thead>
                                <tbody className="divide-y divide-gray-100">{previewData.slice(0, 10).map((row, i) => (<tr key={i}><td className="p-2">{row.SKU}</td><td className="p-2">{row.Name}</td></tr>))}</tbody>
                            </table>
                        </div>
                    )}
                    {error && <div className="mt-4 p-3 bg-red-50 text-red-600 text-xs rounded-lg border border-red-100 flex items-center gap-2"><LucideIcon name="alert-circle" size={16}/> {error}</div>}
                </div>
                {previewData.length > 0 && <div className="p-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50"><button onClick={onClose} className="px-4 py-2 text-gray-500 font-bold text-sm">Cancel</button><button onClick={confirmUpload} className="px-6 py-2 bg-green-600 text-white font-bold text-sm rounded-lg shadow-lg">Confirm</button></div>}
            </DraggableModalWrapper>
        </div>
    );
}

function ItemModal({ isOpen, onClose, data, onSave, categories, brands }: any) {
    const [formData, setFormData] = useState<MasterItem>({ sku: '', name: '', category: '', brand: '', weight: 0, pieces: 0, status: 'Active', updated: '' });

    useEffect(() => {
        if (isOpen) {
            setFormData(data ? { ...data } : { sku: '', name: '', category: categories[1], brand: brands[0], weight: 0, pieces: 0, status: 'Active', updated: '' });
        }
    }, [isOpen, data, categories, brands]);

    if (!isOpen) return null;

    const handleSave = () => {
        if (!formData.sku || !formData.name) { if(Swal) Swal.fire({ icon: 'error', title: 'Error', text: 'SKU and Name are required.' }); return; }
        onSave(formData); onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn font-sans">
            <DraggableModalWrapper className="bg-white rounded-2xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden border-t-8 border-[#C22D2E]">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-[#2E395F] text-lg">{data ? 'Edit Item' : 'New Item'}</h3>
                    <button onClick={onClose}><LucideIcon name="x" className="text-gray-400 hover:text-red-600"/></button>
                </div>
                <div className="p-6 space-y-4 bg-[#F9F8F4]">
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">SKU Code</label><input type="text" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} disabled={!!data} className="w-full border rounded p-2 text-sm font-bold font-mono focus:border-[#C22D2E] outline-none" /></div>
                        <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Brand</label><select value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} className="w-full border rounded p-2 text-sm bg-white outline-none">{brands.map((b: string) => <option key={b} value={b}>{b}</option>)}</select></div>
                    </div>
                    <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Product Name</label><input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border rounded p-2 text-sm font-bold focus:border-[#C22D2E] outline-none" /></div>
                    <div className="grid grid-cols-3 gap-4">
                        <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Category</label><select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full border rounded p-2 text-sm bg-white outline-none">{categories.filter((c: string) => c !== 'All').map((c: string) => <option key={c} value={c}>{c}</option>)}</select></div>
                        <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Weight (g)</label><input type="number" value={formData.weight} onChange={e => setFormData({...formData, weight: parseFloat(e.target.value)})} className="w-full border rounded p-2 text-sm text-right font-mono outline-none" /></div>
                        <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Pieces/Pack</label><input type="number" value={formData.pieces} onChange={e => setFormData({...formData, pieces: parseInt(e.target.value)})} className="w-full border rounded p-2 text-sm text-right font-mono outline-none" /></div>
                    </div>
                    <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status</label><select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full border rounded p-2 text-sm bg-white outline-none"><option value="Active">Active</option><option value="Inactive">Inactive</option><option value="Draft">Draft</option></select></div>
                </div>
                <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-2"><button onClick={onClose} className="px-4 py-2 text-gray-500 font-bold text-sm hover:bg-gray-200 rounded-lg">Cancel</button><button onClick={handleSave} className="px-6 py-2 bg-[#C22D2E] text-white font-bold text-sm rounded-lg shadow-lg hover:bg-[#BB8588]">Save</button></div>
            </DraggableModalWrapper>
        </div>
    );
}

export const ProductItemsConfig: React.FC = () => {
    const [searchTerm, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');
    const [items, setItems] = useState<MasterItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState<{ isOpen: boolean, data: MasterItem | null }>({ isOpen: false, data: null });
    const [csvModalOpen, setCsvModalOpen] = useState(false);
    const [showGuide, setShowGuide] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const data = await fetchSheetData<MasterItem>(SHEET_NAMES.MASTER_ITEMS);
            if (data && data.length > 0) { setItems(data); }
            else { setItems(INITIAL_FG_DATA); saveSheetData(SHEET_NAMES.MASTER_ITEMS, INITIAL_FG_DATA, ['sku', 'name', 'category', 'brand', 'weight', 'pieces', 'status', 'updated', 'unit', 'price', 'id']); }
            setLoading(false);
        };
        load();
    }, []);

    const filteredData = useMemo(() => items.filter(item => {
        const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.sku.toLowerCase().includes(searchTerm.toLowerCase());
        const matchCategory = filterCategory === 'All' || item.category === filterCategory;
        return matchSearch && matchCategory;
    }), [searchTerm, items, filterCategory]);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    const saveData = async (newData: MasterItem[]) => { await saveSheetData(SHEET_NAMES.MASTER_ITEMS, newData, ['sku', 'name', 'category', 'brand', 'weight', 'pieces', 'status', 'updated', 'unit', 'price', 'id']); };
    const handleSave = (item: MasterItem) => {
        const newData = modal.data ? items.map(i => i.sku === item.sku ? item : i) : [...items, item];
        setItems(newData); saveData(newData);
    };
    const handleDelete = (sku: string) => {
        if(Swal) Swal.fire({ title: 'Delete?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33' }).then((r: any) => {
            if(r.isConfirmed) { const newData = items.filter(i => i.sku !== sku); setItems(newData); saveData(newData); }
        });
    };

    if (loading) return <div className="flex h-full items-center justify-center"><LucideIcon name="loader-2" size={40} className="animate-spin text-[#C22D2E]" /></div>;

    return (
        <div className="flex h-full flex-col font-sans overflow-hidden bg-[#F2F4F6]">
            <UserGuidePanel isOpen={showGuide} onClose={() => setShowGuide(false)} />
            <CsvUploadModal isOpen={csvModalOpen} onClose={() => setCsvModalOpen(false)} onUpload={(d: any) => { const n = [...items, ...d]; setItems(n); saveData(n); }} />
            <ItemModal isOpen={modal.isOpen} onClose={() => setModal({ ...modal, isOpen: false })} data={modal.data} onSave={handleSave} categories={CATEGORIES} brands={BRANDS} />

            {/* HEADER SECTION */}
            <div className="px-8 py-6 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-[#C22D2E] text-white shadow-lg shadow-[#C22D2E]/20 border border-white/20">
                        <LucideIcon name="package" size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-[#2E3338] tracking-tight uppercase leading-none">MASTER ITEMS</h1>
                        <p className="text-sm text-[#64748B] font-medium mt-1">ฐานข้อมูลสินค้าสำเร็จรูป (Finished Goods)</p>
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
                                <span>Item List</span>
                            </div>
                            <span className="text-gray-300">|</span>
                            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="pl-4 pr-8 py-1.5 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:border-[#C22D2E] outline-none cursor-pointer hover:bg-white transition-colors font-bold text-gray-600">{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
                            <div className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded">{filteredData.length} Records</div>
                        </div>
                        <div className="flex gap-2">
                            <div className="relative">
                                <LucideIcon name="search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                                <input type="text" placeholder="Search SKU, Name..." value={searchTerm} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#C22D2E] w-56 font-sans bg-gray-50 focus:bg-white transition-all" />
                            </div>
                            <button onClick={() => setCsvModalOpen(true)} className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-all"><LucideIcon name="upload" size={14} /> Import</button>
                            <button onClick={() => setModal({ isOpen: true, data: null })} className="bg-[#C22D2E] hover:bg-[#BB8588] text-white px-4 py-2 rounded-lg font-bold text-xs shadow-md flex items-center gap-2 transition-all active:scale-95 uppercase tracking-wide"><LucideIcon name="plus" size={16} /> New Item</button>
                        </div>
                    </div>

                    {/* TABLE */}
                    <div className="flex-1 overflow-hidden flex flex-col">
                        <div className="overflow-y-auto flex-1 custom-scrollbar">
                            <table className="w-full text-left font-sans">
                                <thead className="sticky top-0 z-10"><tr><th className={`${STYLES.th} pl-6`}>SKU Code</th><th className={STYLES.th}>Product Name</th><th className={STYLES.th}>Category</th><th className={STYLES.th}>Brand</th><th className={`${STYLES.th} text-right`}>Weight (g)</th><th className={`${STYLES.th} text-center`}>Status</th><th className={`${STYLES.th} text-center pr-6`}>Action</th></tr></thead>
                                <tbody className="divide-y divide-gray-100 text-sm">
                                    {currentItems.map(item => (
                                        <tr key={item.sku} className="hover:bg-gray-50 transition-colors group">
                                            <td className={`${STYLES.td} pl-6 font-bold font-mono text-[#C22D2E]`}>{item.sku}</td>
                                            <td className={`${STYLES.td} font-bold text-gray-700`}>{item.name}</td>
                                            <td className={STYLES.td}><span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-bold border border-gray-200 uppercase">{item.category}</span></td>
                                            <td className={STYLES.td}>{item.brand}</td>
                                            <td className={`${STYLES.td} text-right font-mono`}>{item.weight}</td>
                                            <td className={`${STYLES.td} text-center`}><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shadow-sm ${item.status === 'Active' ? 'bg-[#3A7283] text-white' : 'bg-[#ABB7BF] text-white'}`}>{item.status}</span></td>
                                            <td className={`${STYLES.td} text-center pr-6`}><div className="flex justify-center gap-0.5"><button onClick={() => setModal({ isOpen: true, data: item })} className="w-8 h-8 flex items-center justify-center border border-gray-200 hover:bg-[#4F5E75]/10 text-[#4F5E75] rounded-lg transition-colors"><LucideIcon name="pencil" size={16} /></button><button onClick={() => handleDelete(item.sku)} className="w-8 h-8 flex items-center justify-center border border-gray-200 hover:bg-red-50 text-red-500 rounded-lg transition-colors"><LucideIcon name="trash-2" size={16} /></button></div></td>
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