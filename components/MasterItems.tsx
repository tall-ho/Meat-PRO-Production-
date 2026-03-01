import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { fetchSheetData, saveSheetData } from '../services/sheetService';
import { SHEET_NAMES } from '../constants';
import { MasterItem } from '../types';
import { Loader2, Package, Search, BookOpen, X } from 'lucide-react';

function UserGuidePanel({ isOpen, onClose }: any) {
    if (typeof document === 'undefined') return null;
    return createPortal(
        <>
            <div className={`fixed inset-0 z-[190] bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={onClose}/>
            <div className={`fixed inset-y-0 right-0 z-[200] w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="p-5 bg-[#2E3338] text-white flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <BookOpen size={24} style={{color: '#DCBC1B'}}/>
                        <h3 className="font-bold text-lg font-sans tracking-tight">คู่มือการใช้งาน</h3>
                    </div>
                    <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full transition-colors"><X size={20}/></button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 font-sans">
                    <section>
                        <h4 className="font-bold text-[#C22D2E] text-sm mb-3 flex items-center gap-2 border-b border-gray-200 pb-2"><Package size={16}/> Master Item Database</h4>
                        <p className="text-xs text-gray-600">This is a legacy view. Please use the advanced configuration in Prod Config.</p>
                    </section>
                </div>
            </div>
        </>, document.body
    );
}

export const MasterItems: React.FC = () => {
  const [items, setItems] = useState<MasterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchSheetData<MasterItem>(SHEET_NAMES.MASTER_ITEMS);
    setItems(data);
    setLoading(false);
  };

  const handleQuickAdd = async () => {
    const name = prompt('Enter Item Name:');
    if (!name) return;

    setAdding(true);
    const sku = `SKU-${Date.now().toString().slice(-4)}`;
    
    const newItem: MasterItem = {
        sku: sku,
        id: sku,
        name,
        category: 'General',
        brand: 'Generic',
        weight: 0,
        pieces: 1,
        status: 'Active',
        updated: new Date().toLocaleDateString('en-GB'),
        unit: 'kg'
    };
    
    const newItems = [...items, newItem];
    const headers = ['sku', 'id', 'name', 'category', 'brand', 'weight', 'pieces', 'status', 'updated', 'unit', 'price'];
    const success = await saveSheetData(SHEET_NAMES.MASTER_ITEMS, newItems, headers);
    
    if (success) setItems(newItems);
    setAdding(false);
  };

  if (loading) return <div className="p-10 text-center text-slate-400"><Loader2 className="animate-spin inline mr-2"/> Loading Items...</div>;

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200 font-sans">
      <UserGuidePanel isOpen={showGuide} onClose={() => setShowGuide(false)} />
      
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Package className="text-red-600" /> Master Items Database
        </h2>
        <div className="flex gap-2">
             <div className="relative">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={16}/>
                <input type="text" placeholder="Search SKU..." className="pl-9 pr-4 py-2 border rounded-lg text-sm w-full md:w-64" />
             </div>
             <button 
                onClick={handleQuickAdd}
                disabled={adding}
                className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 disabled:opacity-50"
             >
                {adding ? 'Saving...' : '+ Add Item'}
             </button>
        </div>
      </div>

       {items.length === 0 ? (
        <div className="text-center py-10 bg-slate-50 rounded-lg border border-dashed border-slate-300">
            <p className="text-slate-400">Database is empty.</p>
        </div>
      ) : (
        <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500">
                <tr>
                    <th className="p-3">SKU / ID</th>
                    <th className="p-3">Item Name</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Unit</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {items.map((item, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-mono text-xs text-slate-500">{item.sku || item.id}</td>
                        <td className="p-3 font-bold text-slate-700">{item.name}</td>
                        <td className="p-3 text-slate-500">{item.category}</td>
                        <td className="p-3 text-slate-500">{item.unit || '-'}</td>
                    </tr>
                ))}
            </tbody>
        </table>
      )}
    </div>
  );
};