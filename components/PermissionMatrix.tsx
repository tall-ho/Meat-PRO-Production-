import React, { useState, useEffect } from 'react';
import * as LucideIcons from 'lucide-react';
import Swal from 'sweetalert2';
import { SYSTEM_MODULES } from '../constants';

// --- Lucide Icon Wrapper (Same as App.tsx) ---
const LucideIcon = ({ name, size = 16, className = "", style, strokeWidth = 2 }: any) => {
    // Handle cases where name might be undefined or null
    if (!name) return <LucideIcons.HelpCircle size={size} className={className} style={style} strokeWidth={strokeWidth} />;
    
    const iconName = name.split('-').map((part: string) => part.charAt(0).toUpperCase() + part.slice(1)).join('');
    const IconComponent = (LucideIcons as any)[iconName] || (LucideIcons as any)[name] || LucideIcons.HelpCircle;
    return <IconComponent size={size} className={className} style={style} strokeWidth={strokeWidth} />;
};

const PERMISSION_LEVELS = [
    { level: 0, label: 'No Access', icon: 'ban', color: '#94A3B8', bg: '#F1F5F9' },
    { level: 1, label: 'Viewer', icon: 'eye', color: '#3B82F6', bg: '#EFF6FF' },
    { level: 2, label: 'Editor', icon: 'edit', color: '#F59E0B', bg: '#FFFBEB' },
    { level: 3, label: 'Verifier', icon: 'check-square', color: '#8B5CF6', bg: '#F5F3FF' },
    { level: 4, label: 'Approver', icon: 'award', color: '#10B981', bg: '#ECFDF5' },
];

const MOCK_USERS = [
    { id: 1, name: 'Somchai Jaidee', position: 'Plant Manager', email: 'somchai@craftmate.com', avatar: 'https://i.pravatar.cc/150?img=11' },
    { id: 2, name: 'Suda Rakdee', position: 'Sales Head', email: 'suda@craftmate.com', avatar: 'https://i.pravatar.cc/150?img=5' },
    { id: 3, name: 'Wichai Mechanic', position: 'Production Supervisor', email: 'wichai@craftmate.com', avatar: 'https://i.pravatar.cc/150?img=3' },
    { id: 4, name: 'Emily Chen', position: 'Procurement Officer', email: 'emily@craftmate.com', avatar: 'https://i.pravatar.cc/150?img=9' },
    { id: 5, name: 'Admin System', position: 'System Admin', email: 'admin@craftmate.com', avatar: 'https://i.pravatar.cc/150?img=12' },
    { id: 6, name: 'T-DCC Developer', position: 'Lead Developer', email: 'tallintelligence.dcc@gmail.com', avatar: 'https://lh3.googleusercontent.com/d/1Z_fRbN9S4aA7OkHb3mlim_t60wIT4huY' },
    { id: 7, name: 'T-HO Developer', position: 'Senior Developer', email: 'tallintelligence.ho@gmail.com', avatar: 'https://lh3.googleusercontent.com/d/1H_HIcz3rovDJJBszvPSUoMh2rDayOnmQ' }
];

const DEV_CONFIG: any = {
    'tallintelligence.dcc@gmail.com': {
        name: 'T-DCC Developer',
        position: 'Lead Developer',
        avatar: 'https://lh3.googleusercontent.com/d/1Z_fRbN9S4aA7OkHb3mlim_t60wIT4huY' // Direct Link Stable
    },
    'tallintelligence.ho@gmail.com': {
        name: 'T-HO Developer',
        position: 'Senior Developer',
        avatar: 'https://lh3.googleusercontent.com/d/1H_HIcz3rovDJJBszvPSUoMh2rDayOnmQ' // Direct Link Stable
    }
};

export const PermissionMatrix = () => {
    const [viewMode, setViewMode] = useState('matrix'); // Default to Matrix View
    const [formData, setFormData] = useState({ name: '', position: '', email: '', avatar: '' });
    const [expandedModules, setExpandedModules] = useState<any>({});

    // Initialize Permissions with Array support (Multi-select)
    const [currentPermissions, setCurrentPermissions] = useState<any>({ 'dashboard': [1] }); 
    const [matrixPermissions, setMatrixPermissions] = useState<any>(() => {
        const initial: any = {};
        MOCK_USERS.forEach(user => {
            initial[user.id] = {};
            SYSTEM_MODULES.forEach((mod: any) => {
                initial[user.id][mod.id] = [1]; // Default Viewer
                if (mod.subItems) {
                    mod.subItems.forEach((sub: any) => initial[user.id][sub.id] = [1]);
                }
            });
        });
        return initial;
    });

    // --- HANDLERS ---
    const handleInputChange = (e: any) => {
        const { name, value } = e.target;
        
        if (name === 'email' && DEV_CONFIG[value]) {
            const devData = DEV_CONFIG[value];
            setFormData(prev => ({ 
                ...prev, 
                [name]: value,
                name: devData.name,
                position: devData.position,
                avatar: devData.avatar
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    // Toggle Permission Level (Array Logic)
    const handlePermissionChange = (menuId: string, level: number) => {
        setCurrentPermissions((prev: any) => {
            const currentLevels = prev[menuId] || [];
            let newLevels;
            
            if (level === 0) {
                newLevels = []; 
            } else {
                if (currentLevels.includes(level)) {
                    newLevels = currentLevels.filter((l: number) => l !== level);
                } else {
                    newLevels = [...currentLevels, level].filter((l: number) => l !== 0);
                }
            }
            return { ...prev, [menuId]: newLevels };
        });
    };

    const toggleExpand = (moduleId: string) => {
        setExpandedModules((prev: any) => ({
            ...prev,
            [moduleId]: !prev[moduleId]
        }));
    };

    const getPermissionLevels = (menuId: string) => currentPermissions[menuId] || [];
    const getMatrixPermissionLevels = (userId: number, menuId: string) => matrixPermissions[userId]?.[menuId] || [];

    const handleSave = () => {
        if(!formData.name || !formData.email) {
            Swal.fire('Error', 'Please fill in Name and Email', 'error');
            return;
        }
        Swal.fire({
            title: 'Saving Permissions...',
            text: `Applied to ${formData.name}`,
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
        });
    };

    // --- COMPONENTS ---
    const PermissionToggle = ({ currentLevels, onChange }: any) => (
        <div className="flex bg-white rounded-lg p-1 border border-gray-200 shadow-sm gap-1">
            {PERMISSION_LEVELS.map((p) => {
                const isActive = p.level === 0 
                    ? (currentLevels.length === 0 || currentLevels.includes(0))
                    : currentLevels.includes(p.level);

                return (
                    <button
                        key={p.level}
                        onClick={() => onChange(p.level)}
                        className={`flex items-center justify-center w-7 h-7 rounded transition-all duration-200 relative group
                            ${isActive ? 'shadow-sm scale-105 z-10 ring-1 ring-black/5' : 'hover:bg-gray-50 opacity-60 hover:opacity-100 grayscale hover:grayscale-0'}
                        `}
                        style={{ backgroundColor: isActive ? p.bg : 'transparent' }}
                        title={p.label}
                    >
                        <LucideIcon name={p.icon} size={14} style={{color: isActive ? p.color : '#64748B'}} />
                    </button>
                );
            })}
        </div>
    );

    return (
        <div className="relative z-10 flex-grow p-6 w-full max-w-[1400px] mx-auto flex flex-col h-full animate-fade-in-up font-sans">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-[#C22D2E] text-white shadow-lg shadow-[#C22D2E]/20">
                        <LucideIcon name="shield" size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-[#2E395F] tracking-tight">User Permissions</h1>
                        <p className="text-[#55738D] text-xs font-medium uppercase tracking-widest mt-1">Access Control & Authorization</p>
                    </div>
                </div>
                <div className="bg-white/70 backdrop-blur-md border border-white/50 p-1 rounded-xl flex gap-1 shadow-sm">
                    <button 
                        onClick={() => setViewMode('matrix')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-2 ${viewMode === 'matrix' ? 'bg-[#C22D2E] text-white shadow-md' : 'text-[#55738D] hover:bg-white/50'}`}
                    >
                        <LucideIcon name="layout-dashboard" size={14} /> Summary Matrix
                    </button>
                    <button 
                        onClick={() => setViewMode('single')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-2 ${viewMode === 'single' ? 'bg-[#C22D2E] text-white shadow-md' : 'text-[#55738D] hover:bg-white/50'}`}
                    >
                        <LucideIcon name="user-plus" size={14} /> New / Edit User
                    </button>
                </div>
            </div>

            {/* Single View */}
            {viewMode === 'single' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full pb-10">
                    {/* Form */}
                    <div className="lg:col-span-4 space-y-4">
                        <div className="bg-white/70 backdrop-blur-md border border-white/50 p-6 rounded-2xl shadow-sm h-fit sticky top-4">
                            <h3 className="text-sm font-bold text-[#2E395F] uppercase mb-6 flex items-center gap-2 border-b border-gray-200 pb-2">
                                <LucideIcon name="user" size={16} /> User Details
                            </h3>

                            {/* Avatar Preview */}
                            <div className="flex justify-center mb-6">
                                <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden relative group">
                                    {formData.avatar ? (
                                        <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" onError={(e: any) => {e.target.onerror = null; e.target.src='https://via.placeholder.com/150?text=Error';}} />
                                    ) : (
                                        <LucideIcon name="image" size={32} className="text-gray-300" />
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-[#55738D] uppercase block mb-1">Full Name</label>
                                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full bg-[#F9F8F4] rounded-lg px-4 py-2 text-xs font-medium border border-gray-300 focus:border-[#C22D2E] outline-none transition-all text-[#2E395F]"/>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-[#55738D] uppercase block mb-1">Position</label>
                                    <input type="text" name="position" value={formData.position} onChange={handleInputChange} className="w-full bg-[#F9F8F4] rounded-lg px-4 py-2 text-xs font-medium border border-gray-300 focus:border-[#C22D2E] outline-none transition-all text-[#2E395F]"/>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-[#55738D] uppercase block mb-1">Email Address</label>
                                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full bg-[#F9F8F4] rounded-lg px-4 py-2 text-xs font-medium border border-gray-300 focus:border-[#C22D2E] outline-none transition-all text-[#2E395F]"/>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-[#55738D] uppercase block mb-1">Avatar URL</label>
                                    <input type="text" name="avatar" value={formData.avatar} onChange={handleInputChange} className="w-full bg-[#F9F8F4] rounded-lg px-4 py-2 text-xs font-medium border border-gray-300 focus:border-[#C22D2E] outline-none transition-all text-[#2E395F]"/>
                                </div>
                            </div>
                            <div className="mt-8 pt-4 border-t border-gray-200">
                                <button onClick={handleSave} className="w-full bg-[#2E395F] text-white py-3 rounded-xl text-sm font-bold uppercase tracking-wide hover:bg-[#C22D2E] transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-1">
                                    <LucideIcon name="save" size={16} /> Save Permissions
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Tree */}
                    <div className="lg:col-span-8">
                        <div className="bg-white/70 backdrop-blur-md border border-white/50 p-6 rounded-2xl shadow-sm h-full flex flex-col">
                            <div className="flex items-center justify-between pb-4 border-b border-gray-200 mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-[#2E395F]">Access Rights</h3>
                                    <p className="text-xs text-[#55738D]">Define permissions. Multiple selections allowed.</p>
                                </div>
                            </div>
                            
                            <div className="overflow-y-auto pr-2 space-y-3 flex-1">
                                {SYSTEM_MODULES.map((module: any) => {
                                    const isExpanded = expandedModules[module.id];
                                    const hasSub = module.subItems && module.subItems.length > 0;

                                    return (
                                        <div key={module.id} className="bg-white/60 rounded-xl border border-white p-3 hover:bg-white/80 transition-colors shadow-sm">
                                            <div className="flex items-center justify-between">
                                                <div 
                                                    className={`flex items-center gap-3 ${hasSub ? 'cursor-pointer select-none group' : ''}`}
                                                    onClick={() => hasSub && toggleExpand(module.id)}
                                                >
                                                    <div className="p-2 bg-[#2E395F]/5 rounded-lg text-[#2E395F] group-hover:bg-[#C22D2E] group-hover:text-white transition-colors">
                                                        <LucideIcon name={module.icon} size={18} />
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-[#2E395F] text-xs uppercase tracking-wide flex items-center gap-2">
                                                            {module.label}
                                                            {hasSub && <LucideIcon name="chevron-down" size={12} className={`text-[#55738D] transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}/>}
                                                        </span>
                                                    </div>
                                                </div>
                                                <PermissionToggle currentLevels={getPermissionLevels(module.id)} onChange={(lvl: number) => handlePermissionChange(module.id, lvl)} />
                                            </div>
                                            
                                            {hasSub && (
                                                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-96 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                                                    <div className="pl-11 space-y-1 border-l border-gray-200 ml-4 py-1">
                                                        {module.subItems.map((sub: any) => (
                                                            <div key={sub.id} className="flex items-center justify-between py-1.5 pl-4 pr-1 hover:bg-white/50 rounded-lg transition-colors">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-1 h-1 rounded-full bg-[#C22D2E]"></div>
                                                                    <span className="text-xs font-medium text-[#55738D]">{sub.label}</span>
                                                                </div>
                                                                <div className="scale-90 origin-right">
                                                                    <PermissionToggle currentLevels={getPermissionLevels(sub.id)} onChange={(lvl: number) => handlePermissionChange(sub.id, lvl)} />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Matrix View */}
            {viewMode === 'matrix' && (
                <div className="bg-white/70 backdrop-blur-md border border-white/50 p-0 rounded-lg shadow-sm overflow-hidden flex flex-col h-full">
                    <div className="overflow-auto flex-1">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr>
                                    <th className="sticky left-0 z-20 min-w-[200px] shadow-[2px_0_5px_rgba(0,0,0,0.05)] bg-[#F9FAFB] p-3 text-xs font-bold text-[#55738D] uppercase border-b border-gray-200">Module / User</th>
                                    {MOCK_USERS.map(user => (
                                        <th key={user.id} className="text-center min-w-[100px] p-3 border-b border-gray-200 bg-[#F9FAFB]">
                                            <div className="flex flex-col items-center gap-2">
                                                <img src={user.avatar} className="w-8 h-8 rounded-full border border-white shadow-sm" alt="" />
                                                <span className="text-[10px] font-bold text-[#2E395F] whitespace-nowrap">{user.name.split(' ')[0]}</span>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="text-xs text-gray-600">
                                {SYSTEM_MODULES.map((module: any) => {
                                    const isExpanded = expandedModules[module.id];
                                    const hasSub = module.subItems && module.subItems.length > 0;

                                    return (
                                        <React.Fragment key={module.id}>
                                            <tr className="bg-gray-50/50 hover:bg-gray-100 transition-colors">
                                                <td 
                                                    className="sticky left-0 z-10 bg-[#F9F8F4] p-3 font-bold text-[#2E395F] border-b border-gray-200 shadow-[2px_0_5px_rgba(0,0,0,0.05)] cursor-pointer select-none"
                                                    onClick={() => hasSub && toggleExpand(module.id)}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <LucideIcon name={module.icon} size={14} className="text-[#C22D2E]" />
                                                        {module.label}
                                                        {hasSub && <LucideIcon name="chevron-down" size={12} className={`ml-auto text-[#55738D] transition-transform ${isExpanded ? 'rotate-180' : ''}`} />}
                                                    </div>
                                                </td>
                                                {MOCK_USERS.map(user => {
                                                    const levels = getMatrixPermissionLevels(user.id, module.id);
                                                    return (
                                                        <td key={user.id} className="text-center border-b border-white p-2">
                                                            <div className="flex justify-center gap-1 flex-wrap max-w-[120px] mx-auto">
                                                                {levels.map((lvl: number) => {
                                                                    const pInfo = PERMISSION_LEVELS.find(p => p.level === lvl);
                                                                    if(!pInfo) return null;
                                                                    return (
                                                                        <div key={lvl} className="inline-flex items-center justify-center w-6 h-6 rounded shadow-sm" style={{ backgroundColor: pInfo.bg }} title={pInfo.label}>
                                                                            <LucideIcon name={pInfo.icon} size={12} style={{color: pInfo.color}} />
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                            {/* Sub Items Matrix */}
                                            {hasSub && isExpanded && module.subItems.map((sub: any) => (
                                                <tr key={sub.id} className="hover:bg-white transition-colors bg-white/50">
                                                    <td className="sticky left-0 z-10 bg-white p-3 pl-10 border-b border-gray-100 shadow-[2px_0_5px_rgba(0,0,0,0.05)] text-[#55738D]">
                                                        {sub.label}
                                                    </td>
                                                    {MOCK_USERS.map(user => {
                                                        const levels = getMatrixPermissionLevels(user.id, sub.id);
                                                        return (
                                                            <td key={user.id} className="text-center border-b border-gray-100 p-2">
                                                                <div className="flex justify-center gap-1 flex-wrap max-w-[120px] mx-auto">
                                                                    {levels.map((lvl: number) => {
                                                                        const pInfo = PERMISSION_LEVELS.find(p => p.level === lvl);
                                                                        if(!pInfo) return null;
                                                                        return (
                                                                            <div key={lvl} className="inline-flex items-center justify-center w-6 h-6 rounded shadow-sm" style={{ backgroundColor: pInfo.bg }} title={pInfo.label}>
                                                                                <LucideIcon name={pInfo.icon} size={12} style={{color: pInfo.color}} />
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

        </div>
    );
};
