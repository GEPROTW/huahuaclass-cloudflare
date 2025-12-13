
import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Users, Calculator, GraduationCap, LayoutDashboard, BarChart2, Receipt, ShoppingBag, ToggleLeft, ToggleRight, LogOut, Shield, Key, X, ChevronLeft, ChevronRight, Repeat, Menu as MenuIcon, Settings, MessageSquare, Clock, Globe } from 'lucide-react';
import { AppUser, ModuleId, SystemConfig } from '../types';

interface SidebarProps {
    currentTab: string;
    setCurrentTab: (tab: string) => void;
    isTestMode: boolean;
    onToggleTestMode: () => void;
    currentUser: AppUser | null;
    onLogout: () => void;
    onUpdateUser: (user: AppUser) => void;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    // Impersonation Props
    users?: AppUser[];
    originalAdmin?: AppUser | null;
    onImpersonate?: (user: AppUser) => void;
    onStopImpersonation?: () => void;
    systemConfig: SystemConfig;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
    currentTab, setCurrentTab, isTestMode, onToggleTestMode, currentUser, onLogout, onUpdateUser, isOpen, setIsOpen,
    users = [], originalAdmin, onImpersonate, onStopImpersonation, systemConfig
}) => {
    
    // Password Modal State
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');

    // User Menu State (The "Three Bars" Menu)
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);

    // Impersonation Sub-menu State (inside the main menu)
    const [showUserSwitch, setShowUserSwitch] = useState(false);

    // Real-time Clock State
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatDateTime = (date: Date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        const h = String(date.getHours()).padStart(2, '0');
        const min = String(date.getMinutes()).padStart(2, '0');
        const s = String(date.getSeconds()).padStart(2, '0');
        return `${y}-${m}-${d} ${h}:${min}:${s}`;
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
                setShowUserSwitch(false); // Close sub-menu too
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Define all possible items
    const allNavItems = [
        { id: 'dashboard', label: '總覽儀表板', icon: LayoutDashboard },
        { id: 'calendar', label: '派課行事曆', icon: Calendar },
        { id: 'inquiries', label: '預約諮詢', icon: MessageSquare }, 
        { id: 'students', label: '學生管理', icon: GraduationCap },
        { id: 'teachers', label: '師資列表', icon: Users },
        { id: 'sales', label: '銷售紀錄', icon: ShoppingBag },
        { id: 'expenses', label: '成本統計', icon: Receipt },
        { id: 'payroll', label: '薪酬結算', icon: Calculator },
        { id: 'reports', label: '詳細報表', icon: BarChart2 },
        { id: 'website', label: '官網設定', icon: Globe }, // New Item
        { id: 'users', label: '權限管理', icon: Shield },
        { id: 'settings', label: '系統設定', icon: Settings },
    ];

    // Filter based on permissions
    const navItems = allNavItems.filter(item => {
        if (!currentUser) return false;
        if (currentUser.role === 'admin') return true;
        return currentUser.permissions[item.id as ModuleId]?.view;
    });

    const canViewTestMode = currentUser && (currentUser.role === 'admin' || currentUser.permissions['test_mode']?.view);

    const handleChangePassword = () => {
        setPasswordError('');
        if (newPassword.length < 6) {
            setPasswordError('密碼長度至少需 6 碼');
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError('兩次密碼輸入不一致');
            return;
        }
        if (currentUser) {
            onUpdateUser({
                ...currentUser,
                password: newPassword
            });
            alert('密碼修改成功！下次登入請使用新密碼。');
            setShowPasswordModal(false);
            setNewPassword('');
            setConfirmPassword('');
        }
    };

    // Filter available staff users for impersonation
    const staffUsers = users.filter(u => u.role === 'staff');

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div 
                    className="md:hidden fixed inset-0 bg-black/50 z-20 backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <div className={`flex flex-col text-white h-[100dvh] fixed left-0 top-0 overflow-visible z-30 shadow-xl transition-all duration-300 md:translate-x-0 ${isTestMode ? 'bg-slate-900 border-r-4 border-amber-500' : 'bg-slate-900'} ${isOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0 md:w-20'}`}>
                {/* Toggle Button - Visible on Desktop only (Mobile uses header burger) */}
                <button 
                    onClick={() => setIsOpen(!isOpen)}
                    className={`hidden md:flex absolute top-7 right-[-12px] bg-white text-slate-600 w-6 h-6 items-center justify-center shadow-md border border-slate-200 z-50 hover:bg-slate-50 transition-all rounded-full`}
                    title={isOpen ? "收起側邊欄" : "展開側邊欄"}
                >
                    {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>

                {/* Mobile Close Button */}
                <button 
                    onClick={() => setIsOpen(false)}
                    className="md:hidden absolute top-4 right-4 text-slate-400 hover:text-white"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="p-6 border-b border-slate-800 bg-slate-900 sticky top-0 z-10 min-h-[90px] flex flex-col justify-center">
                    <div className={`flex items-center ${!isOpen && 'md:justify-center'}`}>
                        {isOpen ? (
                            <div className="overflow-hidden">
                                <h1 className={`text-2xl font-bold bg-clip-text text-transparent whitespace-nowrap ${isTestMode ? 'bg-gradient-to-r from-amber-400 to-orange-400' : 'bg-gradient-to-r from-blue-400 to-teal-400'}`}>
                                    {systemConfig.appInfo.sidebarTitle}
                                </h1>
                                <p className={`text-sm mt-1 whitespace-nowrap ${isTestMode ? 'text-amber-400 font-bold' : 'text-slate-400'}`}>
                                    {isTestMode ? '⚠️ 測試資料庫' : systemConfig.appInfo.sidebarSubtitle}
                                </p>
                            </div>
                        ) : (
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xl ${isTestMode ? 'bg-amber-50 text-white' : 'bg-blue-600 text-white'}`}>
                                {systemConfig.appInfo.sidebarTitle[0]}
                            </div>
                        )}
                    </div>
                    
                    {/* Test Mode Toggle - Permission Controlled */}
                    {canViewTestMode && isOpen && (
                        <div className="mt-4 flex items-center justify-between bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/50 animate-in fade-in">
                            <span className="text-sm text-slate-400 font-medium whitespace-nowrap ml-1">測試環境</span>
                            <button 
                                onClick={onToggleTestMode}
                                className={`transition-colors focus:outline-none ${isTestMode ? 'text-amber-500' : 'text-slate-500'}`}
                                title={isTestMode ? "切換回正式環境" : "切換至測試環境"}
                            >
                                {isTestMode ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                            </button>
                        </div>
                    )}
                </div>

                <nav className="flex-1 min-h-0 p-4 space-y-2.5 overflow-y-auto custom-scrollbar">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => {
                                setCurrentTab(item.id);
                                // Close sidebar on mobile when clicking a link
                                if (window.innerWidth < 768) setIsOpen(false);
                            }}
                            className={`flex items-center w-full px-5 py-4 rounded-xl transition-all duration-200 group relative ${
                                currentTab === item.id 
                                ? (isTestMode ? 'bg-amber-600 text-white shadow-md' : 'bg-blue-600 text-white shadow-md')
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            } ${!isOpen && 'md:justify-center'}`}
                            title={!isOpen ? item.label : ''}
                        >
                            <item.icon className={`w-6 h-6 flex-shrink-0 transition-colors ${currentTab === item.id ? 'text-white' : 'text-slate-500 group-hover:text-white'} ${isOpen && 'mr-4'}`} />
                            {isOpen && <span className="font-bold text-lg whitespace-nowrap">{item.label}</span>}
                        </button>
                    ))}
                </nav>
                
                {/* Revised Bottom User Section with "Three Bars" Menu */}
                <div className={`p-5 border-t border-slate-800 bg-slate-900 sticky bottom-0 relative group ${originalAdmin ? 'bg-amber-900/20 border-t-amber-600/30' : ''}`} ref={userMenuRef}>
                    
                    {/* Clock Display */}
                    {isOpen && (
                        <div className="mb-4 flex items-center justify-center bg-slate-800/50 rounded-lg py-2 border border-slate-700/50">
                            <Clock className="w-3.5 h-3.5 text-slate-400 mr-2" />
                            <span className="text-slate-300 text-sm font-mono tracking-wider font-medium">
                                {formatDateTime(currentTime)}
                            </span>
                        </div>
                    )}

                    {/* Impersonation Indicator */}
                    {originalAdmin && isOpen && (
                        <div className="absolute -top-10 left-0 right-0 px-5">
                             <div className="text-xs bg-amber-500/20 text-amber-300 px-2 py-1 rounded border border-amber-500/30 text-center animate-pulse truncate">
                                預覽身分: {currentUser?.name}
                            </div>
                        </div>
                    )}

                    <div className={`flex items-center ${isOpen ? 'justify-between' : 'justify-center flex-col gap-4'}`}>
                        {/* User Identity */}
                        <div className={`flex items-center overflow-hidden ${!isOpen && 'justify-center'}`}>
                            <div className={`w-11 h-11 rounded-full flex-shrink-0 flex items-center justify-center text-base font-bold text-white shadow-md border-2 border-slate-800 ${currentUser?.role === 'admin' ? 'bg-purple-500' : 'bg-blue-500'}`} title={currentUser?.name}>
                                {currentUser?.name?.[0] || 'U'}
                            </div>
                            {isOpen && (
                                <div className="ml-3 truncate">
                                    <p className="text-lg font-bold text-white truncate max-w-[110px]">{currentUser?.name}</p>
                                    <p className="text-sm text-slate-500 truncate">
                                        {currentUser?.role === 'admin' ? '系統管理員' : '一般成員'}
                                    </p>
                                </div>
                            )}
                        </div>
                        
                        {/* The "Three Bars" Trigger */}
                        <button 
                            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                            className={`p-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors ${isOpen ? '' : ''}`}
                            title="開啟功能選單"
                        >
                            <MenuIcon className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Extended Menu (To the Right) */}
                    {isUserMenuOpen && (
                        <div className="absolute left-[105%] bottom-4 ml-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-left-2 duration-200">
                            {/* Header inside menu for context */}
                            <div className="bg-slate-50 px-6 py-5 border-b border-slate-100 flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-lg font-bold text-white ${currentUser?.role === 'admin' ? 'bg-purple-500' : 'bg-blue-500'}`}>
                                    {currentUser?.name?.[0] || 'U'}
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-lg font-bold text-slate-800 truncate">{currentUser?.name}</p>
                                    <p className="text-sm text-slate-500 truncate">{currentUser?.username}</p>
                                </div>
                            </div>

                            <div className="p-2 space-y-1">
                                {/* Function 1: Switch Identity (Or Return) */}
                                {originalAdmin ? (
                                    <button
                                        onClick={() => { onStopImpersonation && onStopImpersonation(); setIsUserMenuOpen(false); }}
                                        className="w-full text-left px-5 py-3.5 hover:bg-amber-50 text-base text-amber-700 flex items-center transition-colors rounded-xl font-medium"
                                    >
                                        <LogOut className="w-5 h-5 mr-3 rotate-180" />
                                        返回管理員身分
                                    </button>
                                ) : (
                                    currentUser?.role === 'admin' && (
                                        <div className="relative">
                                            <button 
                                                onClick={() => setShowUserSwitch(!showUserSwitch)}
                                                className={`w-full text-left px-5 py-3.5 hover:bg-blue-50 text-base flex items-center transition-colors rounded-xl ${showUserSwitch ? 'text-blue-600 bg-blue-50' : 'text-slate-700'}`}
                                            >
                                                <Repeat className="w-5 h-5 mr-3" />
                                                切換預覽身分
                                                {showUserSwitch ? <ChevronLeft className="w-4 h-4 ml-auto rotate-90" /> : <ChevronRight className="w-4 h-4 ml-auto" />}
                                            </button>
                                            
                                            {/* Sub-menu for Switching */}
                                            {showUserSwitch && (
                                                <div className="bg-slate-50 border-y border-slate-100 max-h-48 overflow-y-auto custom-scrollbar my-1 rounded-lg">
                                                    {staffUsers.length > 0 ? staffUsers.map(u => (
                                                        <button
                                                            key={u.id}
                                                            onClick={() => {
                                                                if(onImpersonate) onImpersonate(u);
                                                                setIsUserMenuOpen(false);
                                                            }}
                                                            className="w-full text-left px-10 py-3 hover:bg-blue-100 text-sm text-slate-600 flex items-center transition-colors font-medium"
                                                        >
                                                            <div className="w-2 h-2 rounded-full bg-blue-400 mr-3"></div>
                                                            {u.name}
                                                        </button>
                                                    )) : (
                                                        <div className="px-10 py-3 text-sm text-slate-400">無其他成員</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )
                                )}

                                {/* Function 2: Change Password */}
                                <button 
                                    onClick={() => { setShowPasswordModal(true); setIsUserMenuOpen(false); }}
                                    className="w-full text-left px-5 py-3.5 hover:bg-slate-50 text-base text-slate-700 flex items-center transition-colors rounded-xl"
                                >
                                    <Key className="w-5 h-5 mr-3" />
                                    修改密碼
                                </button>

                                {/* Divider */}
                                <div className="h-px bg-slate-100 my-1 mx-3"></div>

                                {/* Function 3: Logout */}
                                <button 
                                    onClick={() => { onLogout(); setIsUserMenuOpen(false); }}
                                    className="w-full text-left px-5 py-3.5 hover:bg-red-50 text-base text-red-600 flex items-center transition-colors rounded-xl group font-medium"
                                >
                                    <LogOut className="w-5 h-5 mr-3 group-hover:translate-x-1 transition-transform" />
                                    登出系統
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Password Change Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-2xl font-bold text-gray-800">修改密碼</h3>
                            <button onClick={() => setShowPasswordModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div>
                                <label className="block text-lg font-medium text-gray-700 mb-2">新密碼</label>
                                <input 
                                    type="password" 
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full h-12 px-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-lg"
                                    placeholder="至少 6 碼"
                                />
                            </div>
                            <div>
                                <label className="block text-lg font-medium text-gray-700 mb-2">確認新密碼</label>
                                <input 
                                    type="password" 
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full h-12 px-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-lg"
                                    placeholder="再次輸入新密碼"
                                />
                            </div>
                            {passwordError && (
                                <div className="text-red-500 text-base flex items-center font-medium">
                                    <Shield className="w-5 h-5 mr-2" />
                                    {passwordError}
                                </div>
                            )}
                        </div>
                        <div className="px-8 py-5 bg-gray-50 flex justify-end space-x-3 border-t border-gray-100">
                            <button 
                                onClick={() => setShowPasswordModal(false)}
                                className="px-6 py-3 text-gray-600 hover:bg-gray-200 rounded-xl transition-colors text-lg font-medium"
                            >
                                取消
                            </button>
                            <button 
                                onClick={handleChangePassword}
                                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-sm transition-colors text-lg font-medium flex items-center"
                            >
                                <Key className="w-5 h-5 mr-2" />
                                確認修改
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
