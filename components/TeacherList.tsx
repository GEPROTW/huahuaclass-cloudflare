import React, { useState } from 'react';
import { Teacher } from '../types';
import { Mail, Phone, Music, Plus, X, User, DollarSign, Trash2, AlertTriangle, Edit2, Search, BookOpen } from 'lucide-react';

interface TeacherListProps {
    teachers: Teacher[];
    onAddTeacher: (teacher: Teacher) => void;
    onUpdateTeacher: (teacher: Teacher) => void;
    onDeleteTeacher: (id: string) => void;
    readOnly?: boolean;
}

export const TeacherList: React.FC<TeacherListProps> = ({ teachers, onAddTeacher, onUpdateTeacher, onDeleteTeacher, readOnly = false }) => {
    const [showModal, setShowModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{ id: string, name: string } | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formError, setFormError] = useState('');
    
    // Default form state
    const defaultFormState: Partial<Teacher> = {
        name: '',
        email: '',
        phone: '',
        commissionRate: 60 // Default 60%
    };

    const [formData, setFormData] = useState<Partial<Teacher>>(defaultFormState);

    const TEACHER_COLORS = [
        'bg-blue-100 text-blue-800 border-blue-200',
        'bg-green-100 text-green-800 border-green-200',
        'bg-purple-100 text-purple-800 border-purple-200',
        'bg-orange-100 text-orange-800 border-orange-200',
        'bg-pink-100 text-pink-800 border-pink-200',
        'bg-teal-100 text-teal-800 border-teal-200',
    ];

    const handleDeleteClick = (id: string, name: string) => {
        setDeleteTarget({ id, name });
    };

    const handleEditClick = (teacher: Teacher) => {
        setFormData({ ...teacher });
        setIsEditMode(true);
        setShowModal(true);
        setFormError('');
    };

    const openAddModal = () => {
        setFormData(defaultFormState);
        setIsEditMode(false);
        setShowModal(true);
        setFormError('');
    };

    const confirmDelete = () => {
        if (deleteTarget) {
            onDeleteTeacher(deleteTarget.id);
            setDeleteTarget(null);
        }
    };

    const handleSave = () => {
        setFormError('');
        if (!formData.name || !formData.phone) {
            setFormError("請填寫姓名與電話");
            return;
        }

        const rate = Number(formData.commissionRate);
        if (isNaN(rate) || rate < 0 || rate > 100) {
            setFormError("抽成比例請輸入 0-100 之間的數字");
            return;
        }

        if (isEditMode && formData.id) {
            onUpdateTeacher(formData as Teacher);
        } else {
            const teacherData: Teacher = {
                id: `t-${Date.now()}`,
                name: formData.name!,
                email: formData.email || '',
                phone: formData.phone!,
                color: TEACHER_COLORS[Math.floor(Math.random() * TEACHER_COLORS.length)],
                commissionRate: rate
            };
            onAddTeacher(teacherData);
        }
        setShowModal(false);
    };

    const filteredTeachers = teachers.filter(t => 
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        t.phone.includes(searchTerm)
    );

    return (
        <div className="space-y-6 relative">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-800">師資陣容</h2>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-none">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input 
                            type="text" 
                            placeholder="搜尋教師..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64 shadow-sm h-10 text-sm"
                        />
                    </div>
                    {!readOnly && (
                        <button 
                            onClick={openAddModal}
                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-sm transition-colors font-medium h-10 text-sm whitespace-nowrap"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            新增教師
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">教師姓名</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">聯絡電話</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">抽成比例</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredTeachers.map(teacher => (
                            <tr key={teacher.id} className="hover:bg-gray-50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mr-3 ${teacher.color.split(' ')[0]} ${teacher.color.split(' ')[1]}`}>
                                            {teacher.name[0]}
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900">{teacher.name}</div>
                                            <div className="text-xs text-gray-400 flex items-center">
                                                <Music className="w-3 h-3 mr-1" /> 音樂教師
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center text-sm text-gray-600">
                                        <Mail className="w-3.5 h-3.5 mr-2 text-gray-400" />
                                        {teacher.email || '-'}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center text-sm text-gray-600">
                                        <Phone className="w-3.5 h-3.5 mr-2 text-gray-400" />
                                        {teacher.phone}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center text-blue-600 font-bold bg-blue-50 px-2.5 py-0.5 rounded-full text-sm">
                                        {teacher.commissionRate}%
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end space-x-2">
                                        <button 
                                            onClick={() => handleEditClick(teacher)}
                                            className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                                            title="詳情"
                                        >
                                            {readOnly ? <BookOpen className="w-4 h-4"/> : <Edit2 className="w-4 h-4" />}
                                        </button>
                                        {!readOnly && (
                                            <button 
                                                onClick={() => handleDeleteClick(teacher.id, teacher.name)}
                                                className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                                title="刪除"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredTeachers.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                                    找不到相符的教師資料
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Edit/Add Teacher Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-800">
                                {isEditMode ? (readOnly ? '教師詳細資料' : '編輯教師資料') : '新增教師資料'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">教師姓名</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                                    <input 
                                        type="text" 
                                        className="w-full h-10 pl-9 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50"
                                        value={formData.name}
                                        onChange={e => setFormData({...formData, name: e.target.value})}
                                        placeholder="輸入姓名"
                                        disabled={readOnly}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input 
                                        type="email" 
                                        className="w-full h-10 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50"
                                        value={formData.email}
                                        onChange={e => setFormData({...formData, email: e.target.value})}
                                        placeholder="example@mail.com"
                                        disabled={readOnly}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">聯絡電話</label>
                                    <input 
                                        type="tel" 
                                        className="w-full h-10 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50"
                                        value={formData.phone}
                                        onChange={e => setFormData({...formData, phone: e.target.value})}
                                        placeholder="0912-345-678"
                                        disabled={readOnly}
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100 mt-4">
                                <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                                    <DollarSign className="w-4 h-4 mr-1 text-gray-500" />
                                    薪資設定
                                </h4>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">抽成比例</label>
                                    <p className="text-xs text-gray-500 mb-2">設定每堂課學費中，教師可獲得的比例。</p>
                                    <div className="relative w-1/3">
                                        <input 
                                            type="number"
                                            className="w-full h-10 pl-3 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50"
                                            value={formData.commissionRate}
                                            onChange={e => setFormData({
                                                ...formData, 
                                                commissionRate: Number(e.target.value)
                                            })}
                                            min="0"
                                            max="100"
                                            disabled={readOnly}
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">%</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-gray-50 flex justify-end items-center gap-3 border-t border-gray-100">
                             {formError && (
                                <div className="flex-1 text-red-500 text-sm flex items-center animate-in fade-in">
                                    <AlertTriangle className="w-4 h-4 mr-1.5" />
                                    {formError}
                                </div>
                            )}
                            <button 
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                {readOnly ? '關閉' : '取消'}
                            </button>
                            {!readOnly && (
                                <button 
                                    onClick={handleSave}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition-colors"
                                >
                                    {isEditMode ? '儲存變更' : '新增'}
                                </button>
                            )}
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
                        <h4 className="text-xl font-bold text-slate-800 text-center mb-2">確定移除此教師？</h4>
                        <p className="text-slate-500 text-center mb-6 text-sm">
                            您即將移除「<span className="font-bold text-slate-700">{deleteTarget.name}</span>」老師的資料，此動作無法復原。
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
                                確認移除
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};