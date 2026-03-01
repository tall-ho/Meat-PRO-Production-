import React, { useState, useEffect } from 'react';
import { fetchSheetData, saveSheetData } from '../services/sheetService';
import { SHEET_NAMES } from '../constants';
import { ProductionOrder } from '../types';
import { Loader2, Calendar, Plus, Save, X } from 'lucide-react';
import { DraggableModalWrapper } from './DraggableModalWrapper';

export const ProductionPlan: React.FC = () => {
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [newItem, setNewItem] = useState<Partial<ProductionOrder>>({
    status: 'Pending',
    quantity: 100,
    date: new Date().toISOString().split('T')[0]
  });

  const loadData = async () => {
    setLoading(true);
    const data = await fetchSheetData<ProductionOrder>(SHEET_NAMES.PRODUCTION_PLAN);
    setOrders(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddOrder = async () => {
    if (!newItem.itemName) return alert('Please enter Item Name');
    
    setSubmitting(true);
    const newOrder: ProductionOrder = {
        id: `PO-${Date.now().toString().slice(-6)}`,
        date: newItem.date || '',
        itemName: newItem.itemName || '',
        quantity: Number(newItem.quantity),
        status: 'Pending',
        assignedTo: 'Admin' // In real app, get from current user
    };

    const updatedList = [...orders, newOrder];
    
    // Save to Cloud with explicit headers to ensure sheet creation
    const headers = ['id', 'date', 'itemName', 'quantity', 'status', 'assignedTo'];
    const success = await saveSheetData(SHEET_NAMES.PRODUCTION_PLAN, updatedList, headers);
    
    if (success) {
        setOrders(updatedList);
        setIsModalOpen(false);
        setNewItem({ status: 'Pending', quantity: 100, date: new Date().toISOString().split('T')[0], itemName: '' });
    } else {
        alert('Failed to save to Google Sheet');
    }
    setSubmitting(false);
  };

  if (loading) return <div className="p-10 text-center text-slate-400"><Loader2 className="animate-spin inline mr-2"/> Loading Plan...</div>;

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="text-red-600" /> Production Plan
        </h2>
        <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-800 transition-colors"
        >
            <Plus size={16} /> New Order
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-10 bg-slate-50 rounded-lg border border-dashed border-slate-300">
            <p className="text-slate-400">No active production orders.</p>
            <button onClick={() => setIsModalOpen(true)} className="mt-2 text-red-600 font-bold hover:underline">Create First Order</button>
        </div>
      ) : (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500">
                    <tr>
                        <th className="p-3">Order ID</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">Item</th>
                        <th className="p-3 text-right">Qty</th>
                        <th className="p-3 text-center">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {orders.map((o, i) => (
                        <tr key={i}>
                            <td className="p-3 font-mono text-xs">{o.id}</td>
                            <td className="p-3">{o.date}</td>
                            <td className="p-3 font-medium">{o.itemName}</td>
                            <td className="p-3 text-right">{o.quantity}</td>
                            <td className="p-3 text-center">
                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                    o.status === 'Completed' ? 'bg-green-100 text-green-700' : 
                                    o.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 
                                    'bg-slate-100 text-slate-700'
                                }`}>
                                    {o.status}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      )}

      {/* Modal for New Order */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <DraggableModalWrapper className="bg-white p-6 rounded-xl w-full max-w-md shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">New Production Order</h3>
                    <button onClick={() => setIsModalOpen(false)}><X className="text-slate-400 hover:text-slate-600"/></button>
                </div>
                <div className="space-y-3">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Date</label>
                        <input type="date" className="w-full border p-2 rounded" value={newItem.date} onChange={e => setNewItem({...newItem, date: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Product Name</label>
                        <input type="text" className="w-full border p-2 rounded" placeholder="e.g. Pork Loin" value={newItem.itemName} onChange={e => setNewItem({...newItem, itemName: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Quantity (Kg/Pack)</label>
                        <input type="number" className="w-full border p-2 rounded" value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: Number(e.target.value)})} />
                    </div>
                    <button 
                        onClick={handleAddOrder} 
                        disabled={submitting}
                        className="w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 mt-4 flex justify-center items-center gap-2"
                    >
                        {submitting ? <Loader2 className="animate-spin"/> : <Save size={18} />}
                        Confirm Order
                    </button>
                </div>
            </DraggableModalWrapper>
        </div>
      )}
    </div>
  );
};