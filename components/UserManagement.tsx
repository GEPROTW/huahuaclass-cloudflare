import React, { useState } from 'react';
import { AppUser, ModuleId, MODULE_NAMES, Permission } from '../types';
import { Plus, Edit2, Trash2, Shield, Check, X, User, AlertTriangle } from 'lucide-react';

interface UserManagementProps {
    users: AppUser[];
    onAddUser: (user: AppUser) => void;
    onUpdateUser: (user: AppUser) => void;
    onDeleteUser: (id: string) => void;
    currentUser: AppUser;
}

export const UserManagement: React.FC<UserManagementProps> = ({ users, onAddUser, onUpdateUser, onDeleteUser, currentUser }) => {
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<AppUser | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<AppUser | null>(null);
    
    // Default empty permissions for new user
    const defaultPermissions: Record<ModuleId, Permission> = Object.keys(MODULE_NAMES).reduce((acc, key) => {
        acc[key as ModuleId] = { view: false, edit: false };
        return acc;
    }, {} as Record<ModuleId, Permission>);

    const initialFormState: Partial<AppUser> = {
        username: '',
        password: '',
        name: '',
        role: 'staff',
        permissions: JSON.parse(JSON.stringify(defaultPermissions))
    };

    const [formData, setFormData] = useState<Partial<AppUser>>(initialFormState);

    const handleOpenAdd = () => {
        setEditingUser(null);
        setFormData(initialFormState);
        setShowModal(true);
    };

    const handleOpenEdit = (user: AppUser) => {
        setEditingUser(user);
        setFormData(JSON.parse(JSON.stringify(user))); // Deep copy
        setShowModal(true);
    };

    const handleTriggerDelete = (user: AppUser) => {
        // Protection 1: Cannot delete the Root Admin (username: admin)
        if (user.username === 'admin') {
            alert("系統預設管理員 (Root) 無法被刪除");
            return;
        }
        
        // Protection 2: Cannot delete yourself
        if (user.id === currentUser.id) {
            alert("您無法刪除自己的帳號");
            return;
        }

        setDeleteTarget(user);
    };

    const confirmDelete = () => {
        if (deleteTarget) {
            onDeleteUser(deleteTarget.id);
            setDeleteTarget(null);
        }
    };

    const handleSave = () => {
        if (!formData.username || !formData.password || !formData.name) {
            alert("請填寫所有必要欄位");
            return;
        }
        
        // Check username uniqueness
        if (!editingUser && users.some(u => u.username === formData.username)) {
            alert("此帳號已存在");
            return;
        }

        // Construct user data
        // CRITICAL FIX: Separate optional fields to prevent passing 'undefined' to Firestore
        const baseUserData = {
            id: editingUser ? editingUser.id : `user-${Date.now()}`,
            username: formData.username!,
            password: formData.password!,
            name: formData.name!,
            role: (formData.role as 'admin' | 'staff') || 'staff',
            permissions: formData.permissions as Record<ModuleId, Permission>,
            // New users force reset (true), Edited users keep existing status unless undefined
            isFirstLogin: editingUser ? (formData.isFirstLogin ?? false) : true, 
        };

        // Only add teacherId if it truly exists (not undefined/null/empty)
        const userData: AppUser = {
            ...baseUserData,
            ...(formData.teacherId ? { teacherId: formData.teacherId } : {})
        };

        if (editingUser) {
            onUpdateUser(userData);
        } else {
            onAddUser(userData);
        }
        setShowModal(false);
    };

    const togglePermission = (moduleId: ModuleId, type: 'view' | 'edit') => {
        const currentPerms = { ...formData.permissions! };
        currentPerms[moduleId] = { ...currentPerms[moduleId], [type]: !currentPerms[moduleId][type] };
        
        // Logic: If edit is enabled, view must be enabled
        if (type === 'edit' && currentPerms[moduleId].edit) {
            currentPerms[moduleId].view = true;
        }
        // Logic: If view is disabled, edit must be disabled
        if (type === 'view' && !currentPerms[moduleId].view) {
            currentPerms[moduleId].edit = false;
        }

        setFormData({ ...formData, permissions: currentPerms });
    };

    return (
        <div className="space-y-6 relative">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">權限管理</h2>
                    <p className="text-sm text-gray-500">設定後台成員帳號與功能存取權限</p>
                </div>
                <button 
                    onClick={handleOpenAdd}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-sm transition-colors font-medium"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    新增成員
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">使用者</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">帳號</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">角色</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">權限概覽</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {users.map(user => (
                            <tr key={user.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="flex items-center">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center mr-3">
                                            <User className="w-4 h-4 text-slate-500" />
                                        </div>
                                        <span className="font-medium text-gray-900">{user.name}</span>
                                        {user.id === currentUser.id && (
                                            <span className="ml-2 px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] rounded font-bold">IT'S YOU</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600 font-mono">{user.username}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-50 text-blue-600'}`}>
                                        {user.role === 'admin' ? '系統管理員' : '一般成員'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-xs text-gray-500 max-w-xs truncate">
                                    {user.role === 'admin' ? '全權限' : (
                                        Object.entries(user.permissions)
                                            .filter(([_, p]) => (p as Permission).view)
                                            .map(([key]) => MODULE_NAMES[key as ModuleId])
                                            .join(', ') || '無權限'
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end space-x-2">
                                        <button 
                                            onClick={() => handleOpenEdit(user)}
                                            className="p-1 text-gray-400 hover:text-blue-600"
                                            title="編輯"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => handleTriggerDelete(user)} 
                                            className={`p-1 transition-colors ${
                                                user.username === 'admin' || user.id === currentUser.id 
                                                ? 'text-gray-200 cursor-not-allowed' 
                                                : 'text-gray-400 hover:text-red-500'
                                            }`}
                                            disabled={user.username === 'admin' || user.id === currentUser.id}
                                            title="刪除"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Edit/Add Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-800">{editingUser ? '編輯使用者' : '新增使用者'}</h3>
                            <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
                        </div>
                        
                        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 block mb-1">姓名</label>
                                    <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full h-10 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="例如：王小明" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 block mb-1">帳號</label>
                                    <input type="text" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full h-10 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="登入用帳號" disabled={!!editingUser} />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 block mb-1">密碼</label>
                                    <input type="text" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full h-10 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="登入密碼" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 block mb-1">角色</label>
                                    <select 
                                        value={formData.role} 
                                        onChange={e => setFormData({...formData, role: e.target.value as any})}
                                        className="w-full h-10 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                        disabled={formData.username === 'admin'}
                                    >
                                        <option value="staff">一般成員 (Staff)</option>
                                        <option value="admin">系統管理員 (Admin)</option>
                                    </select>
                                </div>
                            </div>

                            {formData.role !== 'admin' && (
                                <div>
                                    <h4 className="font-bold text-gray-800 mb-4 flex items-center">
                                        <Shield className="w-4 h-4 mr-2 text-blue-600" />
                                        模組權限設定
                                    </h4>
                                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                                        <table className="w-full text-left">
                                            <thead className="bg-gray-50 border-b border-gray-200">
                                                <tr>
                                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500">功能模組</th>
                                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 text-center">顯示 (View)</th>
                                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 text-center">編輯 (Edit)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {(Object.keys(MODULE_NAMES) as ModuleId[]).map(key => (
                                                    <tr key={key} className="hover:bg-slate-50">
                                                        <td className="px-4 py-3 text-sm font-medium text-gray-700">
                                                            {MODULE_NAMES[key]}
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={formData.permissions?.[key]?.view} 
                                                                onChange={() => togglePermission(key, 'view')}
                                                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={formData.permissions?.[key]?.edit} 
                                                                onChange={() => togglePermission(key, 'edit')}
                                                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                            {formData.role === 'admin' && (
                                <div className="p-4 bg-purple-50 text-purple-800 rounded-xl text-sm text-center">
                                    系統管理員擁有所有模組的完整存取權限。
                                </div>
                            )}
                        </div>

                        <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg">取消</button>
                            <button onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editingUser ? '儲存' : '新增'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteTarget && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-in zoom-in-95 duration-200">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                            <AlertTriangle className="w-6 h-6 text-red-600" />
                        </div>
                        <h4 className="text-xl font-bold text-slate-800 text-center mb-2">確定刪除此使用者？</h4>
                        <p className="text-slate-500 text-center mb-6 text-sm">
                            您即將刪除「<span className="font-bold text-slate-700">{deleteTarget.name} ({deleteTarget.username})</span>」。
                            <br/>此帳號將無法再登入系統。
                        </p>
                        <div className="flex space-x-3">
                            <button 
                                onClick={() => setDeleteTarget(null)}
                                className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors"
                            >
                                取消
                            </button>
                            <button 
                                onClick={confirmDelete}
                                className="flex-1 px-4 py-2.5 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 shadow-lg shadow-red-500/30 transition-colors"
                            >
                                確認刪除
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};