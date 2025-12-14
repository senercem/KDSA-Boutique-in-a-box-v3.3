import React from 'react';
import { LayoutDashboard, Activity, BrainCircuit, ShieldCheck, Settings, LogOut } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onChangeView: (view: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, onChangeView }) => {
  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'm1', label: 'M1: ACORE', icon: Activity },
    { id: 'm2', label: 'M2: Decision Engine', icon: BrainCircuit },
    { id: 'm3', label: 'M3: Alexandra', icon: ShieldCheck },
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">K</span>
             </div>
             <div>
                <h1 className="font-bold text-slate-900 tracking-tight">KDSA v3.3</h1>
                <p className="text-xs text-slate-500">Prototype MVP</p>
             </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                    <button
                        key={item.id}
                        onClick={() => onChangeView(item.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                            isActive 
                            ? 'bg-slate-900 text-white' 
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                        <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                        {item.label}
                    </button>
                )
            })}
        </nav>

        <div className="p-4 border-t border-slate-100 space-y-1">
             <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
                <Settings className="w-5 h-5 text-slate-400" />
                Settings
            </button>
             <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
                <LogOut className="w-5 h-5 text-slate-400" />
                Log Out
            </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-8">
            {children}
        </div>
      </main>
    </div>
  );
};