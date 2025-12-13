import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Sale, Student } from '../types';
import { Plus, Search, Trash2, Edit2, X, DollarSign, Calendar as CalendarIcon, Package, User, ChevronDown, Filter, BookOpen } from 'lucide-react';

interface SalesViewProps {
    sales: Sale[];
    students: Student[];
    onAddSale: (sale: Sale) => void;
    onUpdateSale: (sale: Sale) => void;
    onDeleteSale: (id: string) => void;
    readOnly?: boolean;
}

export const SalesView: React.FC<SalesViewProps> = ({ sales, students, onAddSale, onUpdateSale, onDeleteSale, readOnly = false }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingSale, setEditingSale] = useState<Sale | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Sale | null>(null);
    
    // Month Selection State
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

    // Student Filter State (Searchable - Top Filter)
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [studentFilterTerm, setStudentFilterTerm] = useState('');
    const [showStudentFilterDropdown, setShowStudentFilterDropdown] = useState(false);
    const studentFilterRef = useRef<HTMLDivElement>(null);

    // Modal Student Search State
    const [modalStudentSearchTerm, setModalStudentSearchTerm] = useState('');
    const [showModalStudentDropdown, setShowModalStudentDropdown] = useState(false);
    const modalStudentSearchRef = useRef<HTMLDivElement>(null);

    // Click outside listener
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (studentFilterRef.current && !studentFilterRef.current.contains(event.target as Node)) {
                setShowStudentFilterDropdown(false);
            }
            if (modalStudentSearchRef.current && !modalStudentSearchRef.current.contains(event.target as Node)) {
                setShowModalStudentDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const initialFormState: Partial<Sale> = {
        date: new Date().toISOString().split('T')[0],
        studentId: '',
        itemName: '',
        quantity: 1,
        price: 0,
        total: 0
    };
    const [formData, setFormData] = useState<Partial<Sale>>(initialFormState);

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

    // Filter Logic for List
    const filteredSales = useMemo(() => {
        return sales.filter(s => {
            const matchesSearch = s.itemName.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStudent = selectedStudentId ? s.studentId === selectedStudentId : true;
            const matchesDate = s.date.startsWith(selectedMonth);
            
            return matchesSearch && matchesStudent && matchesDate;
        }).sort((a, b) => b.date.localeCompare(a.date));
    }, [sales, students, searchTerm, selectedStudentId, selectedMonth]);

    const totalRevenue = filteredSales.reduce((sum, s) => sum + s.total, 0);

    // Auto-calc total in form
    const updateFormTotal = (price: number, qty: number) => {
        setFormData(prev => ({ ...prev, price, quantity: qty, total: price * qty }));
    };

    const handleOpenAdd = () => {
        setEditingSale(null);
        setFormData(initialFormState);
        setModalStudentSearchTerm('');
        setShowModal(true);
    };

    const handleOpenEdit = (sale: Sale) => {
        setEditingSale(sale);
        setFormData({ ...sale });
        const student = students.find(s => s.id === sale.studentId);
        setModalStudentSearchTerm(student ? student.name : '');
        setShowModal(true);
    };

    const handleSave = () => {
        if (!formData.itemName || !formData.studentId || !formData.price) {
            alert("請填寫完整資訊");
            return;
        }

        const saleData: Sale = {
            id: editingSale ? editingSale.id : `sale-${Date.now()}`,
            date: formData.date!,
            studentId: formData.studentId!,
            itemName: formData.itemName!,
            quantity: Number(formData.quantity),
            price: Number(formData.price),
            total: Number(formData.total)
        };

        if (editingSale) {
            onUpdateSale(saleData);
        } else {
            onAddSale(saleData);
        }
        setShowModal(false);
    };

    const confirmDelete = () => {
        if (deleteTarget) {
            onDeleteSale(deleteTarget.id);
            setDeleteTarget(null);
        }
    };

    // Filter students for the top dropdown
    const filteredStudentsForDropdown = students.filter(s => 
        s.name.includes(studentFilterTerm) || s.phone.includes(studentFilterTerm)
    );

    // Filter students for the modal dropdown
    const filteredModalStudents = students.filter(s => 
        s.name.includes(modalStudentSearchTerm) || s.phone.includes(modalStudentSearchTerm)
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-800">銷售紀錄 (進銷存)</h2>
                
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

                    {/* Student Filter (Searchable) */}
                    <div className="relative" ref={studentFilterRef}>
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder={selectedStudentId ? students.find(s => s.id === selectedStudentId)?.name : "篩選學生..."}
                            value={studentFilterTerm}
                            onChange={(e) => {
                                setStudentFilterTerm(e.target.value);
                                setShowStudentFilterDropdown(true);
                                setSelectedStudentId(''); // Reset selection on type
                            }}
                            onFocus={() => setShowStudentFilterDropdown(true)}
                            className="bg-white border border-gray-200 rounded-xl pl-10 pr-8 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none h-10 w-[180px]"
                        />
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none"/>
                        
                        {/* Dropdown */}
                        {showStudentFilterDropdown && (
                             <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-slate-100 max-h-60 overflow-y-auto z-50">
                                <div 
                                    className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm text-slate-500 border-b border-slate-50"
                                    onClick={() => {
                                        setSelectedStudentId('');
                                        setStudentFilterTerm('');
                                        setShowStudentFilterDropdown(false);
                                    }}
                                >
                                    所有學生
                                </div>
                                {filteredStudentsForDropdown.length > 0 ? (
                                    filteredStudentsForDropdown.map(s => (
                                        <div 
                                            key={s.id}
                                            className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm text-slate-700 border-b border-slate-50 last:border-0"
                                            onClick={() => {
                                                setSelectedStudentId(s.id);
                                                setStudentFilterTerm(s.name);
                                                setShowStudentFilterDropdown(false);
                                            }}
                                        >
                                            {s.name}
                                        </div>
                                    ))
                                ) : (
                                    <div className="px-4 py-4 text-center text-xs text-slate-400">
                                        無符合學生
                                    </div>
                                )}
                             </div>
                        )}
                    </div>

                    {!readOnly && (
                        <button 
                            onClick={handleOpenAdd}
                            className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 shadow-sm transition-colors font-medium h-10 text-sm whitespace-nowrap"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            新增銷售
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl p-6 text-white shadow-lg">
                    <p className="text-white/80 mb-1">期間銷售總額</p>
                    <h3 className="text-3xl font-bold">${totalRevenue.toLocaleString()}</h3>
                    <p className="text-xs text-white/60 mt-2">{currentYear}年{currentMonth + 1}月</p>
                </div>
                <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                    <p className="text-gray-500 mb-1">銷售筆數</p>
                    <h3 className="text-3xl font-bold text-gray-800">{filteredSales.length} <span className="text-sm font-normal text-gray-400">筆</span></h3>
                </div>
                <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                    <p className="text-gray-500 mb-1">銷售商品數</p>
                    <h3 className="text-3xl font-bold text-gray-800">{filteredSales.reduce((acc, curr) => acc + curr.quantity, 0)} <span className="text-sm font-normal text-gray-400">件</span></h3>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                 <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                     <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input 
                            type="text" 
                            placeholder="搜尋商品名稱..." 
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
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">購買學生</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">商品名稱</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-center">數量</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">單價</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">總計</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredSales.map(sale => {
                                const student = students.find(s => s.id === sale.studentId);
                                return (
                                    <tr key={sale.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm text-gray-600 font-mono">{sale.date}</td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{student?.name || '未知'}</div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-800">{sale.itemName}</td>
                                        <td className="px-6 py-4 text-center">{sale.quantity}</td>
                                        <td className="px-6 py-4 text-right text-gray-600">${sale.price.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right font-bold text-emerald-600">${sale.total.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button onClick={() => handleOpenEdit(sale)} className="p-1 text-gray-400 hover:text-blue-600">
                                                    {readOnly ? <BookOpen className="w-4 h-4"/> : <Edit2 className="w-4 h-4" />}
                                                </button>
                                                {!readOnly && (
                                                    <button onClick={() => setDeleteTarget(sale)} className="p-1 text-gray-400 hover:text-red-500">
                                                        <Trash2 className="w-4 h-4"/>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                             {filteredSales.length === 0 && (
                                <tr><td colSpan={7} className="p-8 text-center text-gray-400">查無銷售紀錄</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
             {showModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-800">
                                {editingSale ? (readOnly ? '銷售詳情' : '編輯銷售單') : '新增銷售單'}
                            </h3>
                            <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
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
                                <div ref={modalStudentSearchRef}>
                                    <label className="text-sm font-medium text-gray-700 block mb-1">購買學生</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"/>
                                        <input
                                            type="text"
                                            placeholder={formData.studentId ? students.find(s => s.id === formData.studentId)?.name : "搜尋學生..."}
                                            value={modalStudentSearchTerm}
                                            onChange={(e) => {
                                                setModalStudentSearchTerm(e.target.value);
                                                setShowModalStudentDropdown(true);
                                                setFormData({ ...formData, studentId: '' }); // Clear ID when typing
                                            }}
                                            onFocus={() => setShowModalStudentDropdown(true)}
                                            className="w-full pl-9 h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50"
                                            disabled={readOnly}
                                        />
                                        <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none"/>

                                        {showModalStudentDropdown && !readOnly && (
                                            <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-slate-100 max-h-48 overflow-y-auto z-50">
                                                {filteredModalStudents.length > 0 ? (
                                                    filteredModalStudents.map(s => (
                                                        <div 
                                                            key={s.id}
                                                            className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm text-slate-700 border-b border-slate-50 last:border-0"
                                                            onClick={() => {
                                                                setFormData({ ...formData, studentId: s.id });
                                                                setModalStudentSearchTerm(s.name);
                                                                setShowModalStudentDropdown(false);
                                                            }}
                                                        >
                                                            <span className="font-medium">{s.name}</span>
                                                            <span className="text-xs text-slate-400 ml-2">{s.phone}</span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="px-4 py-4 text-center text-xs text-slate-400">
                                                        無符合學生
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <label className="text-sm font-medium text-gray-700 block mb-1">商品名稱</label>
                                <div className="relative">
                                    <Package className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"/>
                                    <input 
                                        type="text" 
                                        value={formData.itemName} 
                                        onChange={e => setFormData({...formData, itemName: e.target.value})} 
                                        placeholder="例如：樂理課本" 
                                        className="w-full pl-9 h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50" 
                                        disabled={readOnly}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 block mb-1">單價</label>
                                    <input 
                                        type="number" 
                                        value={formData.price} 
                                        onChange={e => updateFormTotal(Number(e.target.value), formData.quantity || 1)} 
                                        className="w-full h-10 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50" 
                                        disabled={readOnly}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 block mb-1">數量</label>
                                    <input 
                                        type="number" 
                                        min="1" 
                                        value={formData.quantity} 
                                        onChange={e => updateFormTotal(formData.price || 0, Number(e.target.value))} 
                                        className="w-full h-10 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50" 
                                        disabled={readOnly}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 block mb-1">總計</label>
                                    <div className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center font-bold text-gray-700">
                                        ${formData.total?.toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        </div>
                         <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg">
                                {readOnly ? '關閉' : '取消'}
                            </button>
                            {!readOnly && (
                                <button onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editingSale ? '儲存' : '新增'}</button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Alert */}
            {deleteTarget && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
                        <h4 className="text-xl font-bold text-slate-800 mb-2 text-center">確定刪除此銷售單？</h4>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 bg-gray-100 rounded-xl text-gray-700">取消</button>
                            <button onClick={confirmDelete} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl">刪除</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};