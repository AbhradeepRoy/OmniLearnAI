import { motion } from 'motion/react';
import { BookOpen, Camera, MessageSquare, User, LayoutDashboard, Settings } from 'lucide-react';
import React from 'react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Navbar({ activeTab, setActiveTab }: NavbarProps) {
  const tabs = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Home' },
    { id: 'scanner', icon: Camera, label: 'Scanner' },
    { id: 'tutors', icon: BookOpen, label: 'Tutors' },
    { id: 'chat', icon: MessageSquare, label: 'Companion' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 md:top-0 md:bottom-auto bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-t md:border-t-0 md:border-b border-slate-200 dark:border-slate-800 z-50 px-4 py-2 md:py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="hidden md:flex items-center gap-2">
          <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-200">
            <BookOpen size={24} />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-800 dark:text-white">OmniLearn AI</span>
        </div>

        <div className="flex flex-1 justify-around md:justify-end md:gap-8 items-center">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`nav-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex flex-col md:flex-row items-center gap-1 md:gap-2 p-2 rounded-xl transition-colors ${
                  isActive ? 'text-brand-600' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100'
                }`}
              >
                <Icon size={22} />
                <span className="text-[10px] md:text-sm font-medium">{tab.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute -bottom-2 md:bottom-auto md:-bottom-5 left-0 right-0 h-1 bg-brand-600 rounded-full"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="hidden md:block ml-8">
           <button className="p-2 text-slate-500 hover:text-slate-800 bg-slate-100 rounded-full">
             <Settings size={20} />
           </button>
        </div>
      </div>
    </nav>
  );
}
