import React from 'react';
import { LayoutDashboard, Users, Package, ClipboardList, Settings, LogOut } from 'lucide-react';
import { ViewState } from '../types';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  onLogout: () => void;
  orgName: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, onLogout, orgName }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'production', label: 'Production Plan', icon: ClipboardList },
    { id: 'inventory', label: 'Master Items', icon: Package },
    { id: 'users', label: 'User Access', icon: Users },
    { id: 'settings', label: 'System Settings', icon: Settings },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white flex flex-col h-screen fixed left-0 top-0 shadow-xl z-50">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-xl font-bold tracking-tight">MEAT PRO <span className="text-red-500">CLOUD</span></h1>
        <div className="mt-2 text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1">
           {orgName}
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id as ViewState)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                isActive 
                  ? 'bg-red-600 text-white shadow-lg shadow-red-900/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={18} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-2 px-4 py-2 text-xs text-slate-500 hover:text-red-400 transition-colors"
        >
          <LogOut size={14} /> Sign Out
        </button>
        <div className="mt-4 text-[10px] text-center text-slate-600">
            v1.2.0 • Powered by T-DCC
        </div>
      </div>
    </div>
  );
};