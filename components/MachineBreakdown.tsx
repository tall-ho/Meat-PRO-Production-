import React, { useState, useEffect } from 'react';
import * as LucideIcons from 'lucide-react';
import Swal from 'sweetalert2';

// --- Lucide Icon Wrapper ---
const LucideIcon = ({ name, size = 16, className = "", style, strokeWidth = 2 }: any) => {
    if (!name) return <LucideIcons.HelpCircle size={size} className={className} style={style} strokeWidth={strokeWidth} />;
    const iconName = name.split('-').map((part: string) => part.charAt(0).toUpperCase() + part.slice(1)).join('');
    const IconComponent = (LucideIcons as any)[iconName] || (LucideIcons as any)[name] || LucideIcons.HelpCircle;
    return <IconComponent size={size} className={className} style={style} strokeWidth={strokeWidth} />;
};

const MOCK_MACHINES = [
    { id: 'M-001', name: 'Meat Grinder A', location: 'Line A', status: 'Operational' },
    { id: 'M-002', name: 'Mixer B', location: 'Line B', status: 'Operational' },
    { id: 'M-003', name: 'Sausage Filler C', location: 'Line C', status: 'Maintenance' },
    { id: 'M-004', name: 'Oven D', location: 'Cooking Area', status: 'Operational' },
    { id: 'M-005', name: 'Packer E', location: 'Packing Area', status: 'Breakdown' },
];

const MOCK_BREAKDOWNS = [
    { id: 'BD-2402-001', machineId: 'M-005', machineName: 'Packer E', issue: 'Sealing bar overheating', reportedBy: 'Somchai', reportedAt: '2024-02-28T08:30:00', status: 'Pending', priority: 'High' },
    { id: 'BD-2402-002', machineId: 'M-003', machineName: 'Sausage Filler C', issue: 'Hydraulic leak', reportedBy: 'Wichai', reportedAt: '2024-02-27T14:15:00', status: 'In Progress', priority: 'Medium' },
];

export const MachineBreakdown = () => {
    const [breakdowns, setBreakdowns] = useState(MOCK_BREAKDOWNS);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ machineId: '', issue: '', priority: 'Medium', reportedBy: '' });

    const handleInputChange = (e: any) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = () => {
        if (!formData.machineId || !formData.issue) {
            Swal.fire('Error', 'Please fill in all required fields', 'error');
            return;
        }
        
        const machine = MOCK_MACHINES.find(m => m.id === formData.machineId);
        const newBreakdown = {
            id: `BD-2402-${String(breakdowns.length + 1).padStart(3, '0')}`,
            machineId: formData.machineId,
            machineName: machine ? machine.name : 'Unknown',
            issue: formData.issue,
            reportedBy: formData.reportedBy || 'CurrentUser',
            reportedAt: new Date().toISOString(),
            status: 'Pending',
            priority: formData.priority
        };

        setBreakdowns([newBreakdown, ...breakdowns]);
        setShowModal(false);
        setFormData({ machineId: '', issue: '', priority: 'Medium', reportedBy: '' });
        Swal.fire('Success', 'Breakdown reported successfully', 'success');
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Pending': return 'bg-red-100 text-red-700 border-red-200';
            case 'In Progress': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'Resolved': return 'bg-green-100 text-green-700 border-green-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'High': return 'text-red-600';
            case 'Medium': return 'text-yellow-600';
            case 'Low': return 'text-blue-600';
            default: return 'text-gray-600';
        }
    };

    return (
        <div className="h-full flex flex-col p-6 animate-fadeIn">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-[#2E395F] uppercase flex items-center gap-2">
                        <LucideIcon name="wrench" className="text-[#C22D2E]" size={28} />
                        Machine Breakdown
                    </h1>
                    <p className="text-sm text-[#55738D]">Report and track equipment issues</p>
                </div>
                <button 
                    onClick={() => setShowModal(true)}
                    className="bg-[#C22D2E] text-white px-4 py-2 rounded-xl text-sm font-bold uppercase hover:bg-[#A91B18] transition-all shadow-lg flex items-center gap-2"
                >
                    <LucideIcon name="plus" size={16} /> Report Issue
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-bold">Total Issues</p>
                            <h3 className="text-2xl font-bold text-[#2E395F]">{breakdowns.length}</h3>
                        </div>
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><LucideIcon name="clipboard-list" size={20} /></div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-bold">Pending</p>
                            <h3 className="text-2xl font-bold text-[#C22D2E]">{breakdowns.filter(b => b.status === 'Pending').length}</h3>
                        </div>
                        <div className="p-2 bg-red-50 rounded-lg text-red-600"><LucideIcon name="alert-circle" size={20} /></div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-bold">In Progress</p>
                            <h3 className="text-2xl font-bold text-yellow-600">{breakdowns.filter(b => b.status === 'In Progress').length}</h3>
                        </div>
                        <div className="p-2 bg-yellow-50 rounded-lg text-yellow-600"><LucideIcon name="clock" size={20} /></div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-bold">Resolved (Today)</p>
                            <h3 className="text-2xl font-bold text-green-600">{breakdowns.filter(b => b.status === 'Resolved').length}</h3>
                        </div>
                        <div className="p-2 bg-green-50 rounded-lg text-green-600"><LucideIcon name="check-circle" size={20} /></div>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex-1 overflow-hidden flex flex-col">
                <div className="overflow-auto flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[#F9FAFB] sticky top-0 z-10">
                            <tr>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase border-b border-gray-200">ID</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase border-b border-gray-200">Machine</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase border-b border-gray-200">Issue</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase border-b border-gray-200">Priority</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase border-b border-gray-200">Reported By</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase border-b border-gray-200">Date</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase border-b border-gray-200">Status</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase border-b border-gray-200">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {breakdowns.map((item, idx) => (
                                <tr key={idx} className="hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0">
                                    <td className="p-4 text-xs font-mono font-medium text-gray-600">{item.id}</td>
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-[#2E395F]">{item.machineName}</span>
                                            <span className="text-[10px] text-gray-400 font-mono">{item.machineId}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm text-gray-700">{item.issue}</td>
                                    <td className="p-4">
                                        <span className={`text-xs font-bold flex items-center gap-1 ${getPriorityColor(item.priority)}`}>
                                            <LucideIcon name={item.priority === 'High' ? 'alert-octagon' : 'alert-triangle'} size={12} />
                                            {item.priority}
                                        </span>
                                    </td>
                                    <td className="p-4 text-xs text-gray-600">{item.reportedBy}</td>
                                    <td className="p-4 text-xs text-gray-500 font-mono">
                                        {new Date(item.reportedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(item.status)}`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <button className="text-gray-400 hover:text-[#2E395F] transition-colors">
                                            <LucideIcon name="more-horizontal" size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scaleIn">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#F9FAFB]">
                            <h3 className="text-lg font-bold text-[#2E395F]">Report Breakdown</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                                <LucideIcon name="x" size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Machine</label>
                                <select 
                                    name="machineId" 
                                    value={formData.machineId} 
                                    onChange={handleInputChange}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#C22D2E] outline-none"
                                >
                                    <option value="">Select Machine</option>
                                    {MOCK_MACHINES.map(m => (
                                        <option key={m.id} value={m.id}>{m.name} ({m.location})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Issue Description</label>
                                <textarea 
                                    name="issue" 
                                    value={formData.issue} 
                                    onChange={handleInputChange}
                                    rows={3}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#C22D2E] outline-none"
                                    placeholder="Describe the problem..."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Priority</label>
                                    <select 
                                        name="priority" 
                                        value={formData.priority} 
                                        onChange={handleInputChange}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#C22D2E] outline-none"
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Reported By</label>
                                    <input 
                                        type="text" 
                                        name="reportedBy" 
                                        value={formData.reportedBy} 
                                        onChange={handleInputChange}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#C22D2E] outline-none"
                                        placeholder="Your Name"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 bg-[#F9FAFB] flex justify-end gap-3">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700">Cancel</button>
                            <button onClick={handleSubmit} className="px-6 py-2 bg-[#C22D2E] text-white rounded-lg text-sm font-bold shadow-md hover:bg-[#A91B18] transition-all">Submit Report</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
