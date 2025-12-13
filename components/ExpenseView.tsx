

import React, { useState, useMemo } from 'react';
import { Expense } from '../types';
import { Plus, Search, Trash2, Edit2, X, DollarSign, Calendar as CalendarIcon, Tag, FileText, ChevronDown, PieChart as PieIcon, Filter, BookOpen } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ExpenseViewProps {
    expenses: Expense[];
    onAddExpense: (expense: Expense) => void;
    onUpdateExpense: (expense: Expense) => void;
    onDeleteExpense: (id: string) => void;
    readOnly?: boolean;
    categories?: string[]; // New Prop
}

export const ExpenseView: React.FC<ExpenseViewProps> = ({ expenses, onAddExpense, onUpdateExpense, onDeleteExpense, readOnly = false, categories = [] }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);

    // Month Selection State
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    
    // Category Filter State
    const [selectedCategory, setSelectedCategory] = useState('');

    const initialFormState: Partial<Expense> = {
        date: new Date().toISOString().split('T')[0],
        title: '',
        category: categories[0] || '', // Fallback
        amount: 0,
        note: ''
    };
    const [formData, setFormData] = useState<Partial<Expense>>(initialFormState);

    // Date Logic for Dropdowns
    const [yearStr, monthStr] = selectedMonth.split('-');
    const currentYear = parseInt(yearStr);
    const currentMonth = parseInt(monthStr) - 1;
    
    const years = Array.from({length: 11}, (_, i) => currentYear - 5 + i);
    const months = Array.from({length: 12}, (_, i) => i);

    const handleYearChange = (y: number) => {
        setSelectedMonth(`${y}-${String(currentMonth + 1).padStart(2, '0')}`);
    };

    const handleMonthChange = (m: number) => {
        setSelectedMonth(`${currentYear}-${String(m + 1).padStart(2, '0')}`);
    };

    // Filter Logic
    const filteredExpenses = useMemo(() => {
        return expenses.filter(e => {
            const matchesSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory ? e.category === selectedCategory : true;
            const matchesDate = e.date.startsWith(selectedMonth);
            
            return matchesSearch && matchesCategory && matchesDate;
        }).sort((a, b) => b.date.localeCompare(a.date));
    }, [expenses, searchTerm, selectedCategory, selectedMonth]);

    // Pie Chart Data
    const pieData = useMemo(() => {
        const counts: Record<string, number> = {};
        filteredExpenses.forEach(e => {
            counts[e.category] = (counts[e.category] || 0) + e.amount;
        });
        return Object.keys(counts).map(cat => ({ name: cat, value: counts[cat] }));
    }, [filteredExpenses]);

    const totalAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

    const handleOpenAdd = () => {
        setEditingExpense(null);
        setFormData(initialFormState);
        setShowModal(true);
    };

    const handleOpenEdit = (expense: Expense) => {
        setEditingExpense(expense);
        setFormData({ ...expense });
        setShowModal(true);
    };

    const handleSave = () => {
        if (!formData.title || !formData.amount) {
            alert("請填寫項目名稱與金額");
            return;
        }

        const expenseData: Expense = {
            id: editingExpense ? editingExpense.id : `exp-${Date.now()}`,
            date: formData.date!,
            title: formData.title!,
            category: formData.category || categories[0],
            amount: Number(formData.amount),
            note: formData.note
        };

        if (editingExpense) {
            onUpdateExpense(expenseData);
        } else {
            onAddExpense(expenseData);
        }
        setShowModal(false);
    };

    const confirmDelete = () => {
        if (deleteTarget) {
            onDeleteExpense(deleteTarget.id);
            setDeleteTarget(null);
        }
    };

    const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];

    return (
        <div className="space-y-6">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-800">成本統計</h2>
                
                <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                    {/* Month Selection Dropdowns */}
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <select 
                                value={currentYear} 
                                onChange={(e) => handleYearChange(parseInt(e.target.value))}
                                className="appearance-none bg-white border border-gray-200 text-gray-700 py-2 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm font-bold cursor-pointer hover:bg-gray-50 transition-colors h-10"
                            >
                                {years.map(y => <option key={y} value={y}>{y}年</option>)}
                            </select>
                            <ChevronDown className="w-4 h-4 text-slate-900 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                        <div className="relative">
                            <select 
                                value={currentMonth} 
                                onChange={(e) => handleMonthChange(parseInt(e.target.value))}
                                className="appearance-none bg-white border border-gray-200 text-gray-700 py-2 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm font-bold cursor-pointer hover:bg-gray-50 transition-colors h-10"
                            >
                                {months.map(m => <option key={m} value={m}>{m + 1}月</option>)}
                            </select>
                            <ChevronDown className="w-4 h-4 text-slate-900 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                    </div>

                    {/* Category Filter */}
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <select 
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="bg-white border border-gray-200 rounded-xl pl-10 pr-8 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none appearance-none h-10 cursor-pointer"
                        >
                            <option value="">所有類別</option>
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none"/>
                    </div>

                    {!readOnly && (
                        <button 
                            onClick={handleOpenAdd}
                            className="flex items-center px-4 py-2 bg-rose-600 text-white rounded-xl hover:bg-rose-700 shadow-sm transition-colors font-medium h-10 text-sm whitespace-nowrap"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            新增支出
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Stats & Chart */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-gradient-to-br from-rose-500 to-orange-500 rounded-xl p-6 text-white shadow-lg">
                        <p className="text-white/80 mb-1">期間總支出</p>
                        <h3 className="text-3xl font-bold">${totalAmount.toLocaleString()}</h3>
                        <p className="text-xs text-white/60 mt-2">{currentYear}年{currentMonth + 1}月</p>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col h-[300px]">
                        <h4 className="font-bold text-gray-700 mb-4 flex items-center">
                            <PieIcon className="w-4 h-4 mr-2" /> 支出類別佔比
                        </h4>
                        <div className="flex-1 w-full min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(val: number) => `$${val.toLocaleString()}`} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle"/>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                         <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input 
                                type="text" 
                                placeholder="搜尋項目名稱..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-sm"
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto max-h-[600px] custom-scrollbar">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">日期</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">類別</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">項目名稱</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">金額</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredExpenses.map(expense => (
                                    <tr key={expense.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm text-gray-600 font-mono">{expense.date}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                                                {expense.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{expense.title}</div>
                                            {expense.note && <div className="text-xs text-gray-400">{expense.note}</div>}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-rose-600">
                                            ${expense.amount.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button onClick={() => handleOpenEdit(expense)} className="p-1 text-gray-400 hover:text-blue-600">
                                                    {readOnly ? <BookOpen className="w-4 h-4"/> : <Edit2 className="w-4 h-4"/>}
                                                </button>
                                                {!readOnly && (
                                                    <button onClick={() => setDeleteTarget(expense)} className="p-1 text-gray-400 hover:text-red-500">
                                                        <Trash2 className="w-4 h-4"/>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredExpenses.length === 0 && (
                                    <tr><td colSpan={5} className="p-8 text-center text-gray-400">查無支出紀錄</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-800">
                                {editingExpense ? (readOnly ? '支出詳情' : '編輯支出') : '新增支出'}
                            </h3>
                            <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700 block mb-1">日期</label>
                                <div className="relative">
                                    <CalendarIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"/>
                                    <input 
                                        type="date" 
                                        value={formData.date} 
                                        onChange={e => setFormData({...formData, date: e.target.value})} 
                                        className="w-full pl-9 h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50" 
                                        disabled={readOnly}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 block mb-1">類別</label>
                                <div className="relative">
                                    <Tag className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"/>
                                    <select 
                                        value={formData.category} 
                                        onChange={e => setFormData({...formData, category: e.target.value})} 
                                        className="w-full pl-9 h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white disabled:bg-gray-50"
                                        disabled={readOnly}
                                    >
                                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none"/>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 block mb-1">項目名稱</label>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"/>
                                    <input 
                                        type="text" 
                                        value={formData.title} 
                                        onChange={e => setFormData({...formData, title: e.target.value})} 
                                        placeholder="例如：購買教材" 
                                        className="w-full pl-9 h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50" 
                                        disabled={readOnly}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 block mb-1">金額</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"/>
                                    <input 
                                        type="number" 
                                        value={formData.amount} 
                                        onChange={e => setFormData({...formData, amount: Number(e.target.value)})} 
                                        className="w-full pl-9 h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50" 
                                        disabled={readOnly}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 block mb-1">備註 (選填)</label>
                                <textarea 
                                    value={formData.note || ''} 
                                    onChange={e => setFormData({...formData, note: e.target.value})} 
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-20 resize-none disabled:bg-gray-50" 
                                    placeholder="詳細說明..." 
                                    disabled={readOnly}
                                />
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg">
                                {readOnly ? '關閉' : '取消'}
                            </button>
                            {!readOnly && (
                                <button onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editingExpense ? '儲存' : '新增'}</button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Alert */}
            {deleteTarget && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
                        <h4 className="text-xl font-bold text-slate-800 mb-2 text-center">確定刪除此筆支出？</h4>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 bg-gray-100 rounded-xl text-gray-700">取消</button>
                            <button onClick={confirmDelete} className="flex-1 py-2.5 bg-rose-600 text-white rounded-xl">刪除</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};