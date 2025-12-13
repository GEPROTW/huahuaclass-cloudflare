
import React, { useState } from 'react';
import { AppUser, SystemConfig } from '../types';
import { Music, ArrowRight, Lock, User, RefreshCw, Key, ChevronLeft } from 'lucide-react';

interface LoginViewProps {
    users: AppUser[];
    onLogin: (user: AppUser) => void;
    onUpdateUser: (user: AppUser) => void;
    systemConfig: SystemConfig;
    onBack?: () => void; // New prop for going back to website
}

export const LoginView: React.FC<LoginViewProps> = ({ users, onLogin, onUpdateUser, systemConfig, onBack }) => {
    // Mode: 'login' or 'reset'
    const [mode, setMode] = useState<'login' | 'reset'>('login');
    const [currentUser, setCurrentUser] = useState<AppUser | null>(null);

    // Login Form State
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    // Reset Form State
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [resetError, setResetError] = useState('');

    const handleLoginSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const user = users.find(u => u.username === username && u.password === password);
        
        if (user) {
            if (user.isFirstLogin) {
                // Trigger Reset Flow
                setCurrentUser(user);
                setNewUsername(user.username); // Pre-fill with current name
                setMode('reset');
            } else {
                onLogin(user);
            }
        } else {
            setError('帳號或密碼錯誤');
        }
    };

    const handleResetSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setResetError('');

        if (!newUsername.trim()) {
            setResetError('請輸入新的使用者帳號');
            return;
        }

        if (newPassword.length < 6) {
            setResetError('新密碼長度至少需 6 碼');
            return;
        }

        if (newPassword !== confirmPassword) {
            setResetError('兩次密碼輸入不一致');
            return;
        }
        
        // Check username uniqueness (if changed)
        if (newUsername !== currentUser?.username && users.some(u => u.username === newUsername)) {
            setResetError('此帳號已存在，請更換一個');
            return;
        }

        if (currentUser) {
            // Update User
            const updatedUser: AppUser = {
                ...currentUser,
                username: newUsername,
                password: newPassword,
                isFirstLogin: false
            };
            
            // Persist to DB
            onUpdateUser(updatedUser);
            
            // Auto login
            onLogin(updatedUser);
        }
    };

    if (mode === 'reset') {
        return (
             <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                    <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-8 text-center relative">
                        <button onClick={() => setMode('login')} className="absolute top-4 left-4 text-white/80 hover:text-white p-2">
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                            <RefreshCw className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">啟用您的帳戶</h1>
                        <p className="text-amber-100 text-sm">為了安全起見，首次登入請重設帳號與密碼</p>
                    </div>
                    
                    <div className="p-8">
                        <form onSubmit={handleResetSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">設定新帳號</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input 
                                        type="text" 
                                        value={newUsername}
                                        onChange={(e) => setNewUsername(e.target.value)}
                                        className="w-full h-11 pl-10 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                                        placeholder="輸入您的專屬帳號"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">設定新密碼</label>
                                <div className="relative">
                                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input 
                                        type="password" 
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full h-11 pl-10 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                                        placeholder="至少 6 碼"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">確認新密碼</label>
                                <div className="relative">
                                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input 
                                        type="password" 
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full h-11 pl-10 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                                        placeholder="再次輸入密碼"
                                    />
                                </div>
                            </div>

                            {resetError && (
                                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center justify-center font-medium animate-in fade-in slide-in-from-top-1">
                                    {resetError}
                                </div>
                            )}

                            <button 
                                type="submit"
                                className="w-full h-12 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 transition-colors flex items-center justify-center group shadow-lg shadow-amber-500/30"
                            >
                                確認啟用
                                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 relative">
                {onBack && (
                    <button 
                        onClick={onBack}
                        className="absolute top-4 left-4 z-10 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
                        title="返回官網"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                )}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                        <Music className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">{systemConfig.appInfo.loginTitle}</h1>
                    <p className="text-blue-100 text-sm">{systemConfig.appInfo.loginSubtitle}</p>
                </div>
                
                <div className="p-8">
                    <form onSubmit={handleLoginSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">使用者帳號</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input 
                                    type="text" 
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full h-11 pl-10 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    placeholder="輸入使用者帳號"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">密碼</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input 
                                    type="password" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full h-11 pl-10 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    placeholder="輸入登入密碼"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center justify-center font-medium animate-in fade-in slide-in-from-top-1">
                                {error}
                            </div>
                        )}

                        <button 
                            type="submit"
                            className="w-full h-12 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors flex items-center justify-center group"
                        >
                            登入系統
                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </form>

                    <div className="mt-8 text-center text-xs text-gray-400">
                        &copy; {new Date().getFullYear()} {systemConfig.appInfo.loginTitle}. All rights reserved.
                        <div className="mt-2 text-[10px] text-slate-500 opacity-60 font-mono">
                            System v1.1 • Cloudflare D1 Active
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
