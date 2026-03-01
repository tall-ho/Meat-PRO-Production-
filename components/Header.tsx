import React from 'react';
import { Bell, User, Search, Settings } from 'lucide-react';

interface HeaderProps {
  user?: { name: string; position: string; avatar?: string };
}

export const Header: React.FC<HeaderProps> = ({ user }) => {
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md shadow-soft sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search orders, items..." 
            className="pl-10 pr-4 py-2 rounded-full bg-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-64 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative cursor-pointer group">
          <Bell size={20} className="text-gray-500 group-hover:text-primary transition-colors" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
        </div>
        
        <div className="flex items-center gap-3 pl-6 border-l border-gray-200">
          <div className="text-right hidden md:block">
            <p className="text-sm font-bold text-gray-800">{user?.name || 'Guest User'}</p>
            <p className="text-xs text-gray-500">{user?.position || 'Production Staff'}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary p-[2px] cursor-pointer hover:shadow-lg transition-shadow">
            <div className="w-full h-full rounded-full bg-white overflow-hidden">
              {user?.avatar ? (
                <img src={user.avatar} alt="User" className="w-full h-full object-cover" />
              ) : (
                <User className="w-full h-full p-2 text-gray-400" />
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
