


import React, { useMemo, useState } from 'react';
import { Lesson, Teacher, PayrollRecord, AppUser, SystemConfig } from '../types';
import { analyzePayroll } from '../services/geminiService';
import { Sparkles, Loader2, Download, List, X, FileText, Clock, Search, ArrowUpDown, ArrowUp, ArrowDown, ChevronDown } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface PayrollViewProps {
    lessons: Lesson[];
    teachers: Teacher[];
    currentUser?: AppUser | null;
    systemConfig: SystemConfig;
}

type SortDirection = 'asc' | 'desc';

export const PayrollView: React.FC<PayrollViewProps> = ({ lessons, teachers, currentUser, systemConfig }) => {
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [aiAnalysis, setAiAnalysis] = useState<string>("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [searchTerm, setSearchTerm] = useState(''); // Teacher Filter
    
    // Details Modal State
    const [detailsTeacher, setDetailsTeacher] = useState<{id: string, name: string} | null>(null);
    
    // Sorting State: key can be 'teacherName', 'total', or a classType ID
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: SortDirection } | null>({ key: 'total', direction: 'desc' });

    // Helper to check role
    const isAdmin = currentUser?.role === 'admin';

    // Get Active Class Types from Config
    const activeClassTypes = systemConfig.classTypes;

    // Date Logic for Dropdowns
    const [yearStr, monthStr] = selectedMonth.split('-');
    const currentYear = parseInt(yearStr);
    const currentMonth = parseInt(monthStr) - 1; 
    
    // Generate years range centered on current selection
    const years = Array.from({length: 11}, (_, i) => currentYear - 5 + i);
    const months = Array.from({length: 12}, (_, i) => i);

    const handleYearChange = (y: number) => {
        setSelectedMonth(`${y}-${String(currentMonth + 1).padStart(2, '0')}`);
    };

    const handleMonthChange = (m: number) => {
        // m is 0-11
        setSelectedMonth(`${currentYear}-${String(m + 1).padStart(2, '0')}`);
    };

    // Calculate Total Revenue (Tuition)
    const totalRevenue = useMemo(() => {
        let relevantLessons = lessons.filter(l => l.date.startsWith(selectedMonth) && l.isCompleted);
        
        // Privacy Check
        if (currentUser && currentUser.role !== 'admin' && currentUser.teacherId) {
            relevantLessons = relevantLessons.filter(l => l.teacherId === currentUser.teacherId);
        }
        
        return relevantLessons.reduce((sum, l) => sum + (l.price || 0), 0);
    }, [lessons, selectedMonth, currentUser]);

    // Calculate Payroll Logic
    const payrollData: PayrollRecord[] = useMemo(() => {
        // Privacy Filter
        let visibleTeachers = teachers;
        if (currentUser && currentUser.role !== 'admin' && currentUser.teacherId) {
            visibleTeachers = teachers.filter(t => t.id === currentUser.teacherId);
        }

        const data = visibleTeachers.map(teacher => {
            const teacherLessons = lessons.filter(l => 
                l.teacherId === teacher.id && 
                l.date.startsWith(selectedMonth) && 
                l.isCompleted // Only pay for completed lessons
            );

            const record: PayrollRecord = {
                teacherId: teacher.id,
                teacherName: teacher.name,
                totalHours: 0,
                totalLessons: teacherLessons.length,
                totalPay: 0,
                breakdown: {}
            };

            // Initialize breakdown for all active class types
            activeClassTypes.forEach(ct => {
                record.breakdown[ct.id] = { count: 0, hours: 0, amount: 0 };
            });

            teacherLessons.forEach(lesson => {
                const hours = lesson.durationMinutes / 60;
                const amount = lesson.cost || 0; 

                record.totalHours += hours;
                record.totalPay += amount;
                
                // Handle lesson types that might have been deleted from config but exist in history
                if (!record.breakdown[lesson.type]) {
                    record.breakdown[lesson.type] = { count: 0, hours: 0, amount: 0 };
                }

                record.breakdown[lesson.type].count += 1;
                record.breakdown[lesson.type].hours += hours;
                record.breakdown[lesson.type].amount += amount;
            });

            return record;
        });

        // Search Filter
        const filteredData = data.filter(r => r.teacherName.toLowerCase().includes(searchTerm.toLowerCase()));

        // Sorting Logic
        if (sortConfig) {
            filteredData.sort((a, b) => {
                let aValue: number | string = 0;
                let bValue: number | string = 0;

                if (sortConfig.key === 'teacherName') {
                    aValue = a.teacherName;
                    bValue = b.teacherName;
                } else if (sortConfig.key === 'total') {
                    aValue = a.totalPay;
                    bValue = b.totalPay;
                } else {
                    // Sort by specific class type amount
                    aValue = a.breakdown[sortConfig.key]?.amount || 0;
                    bValue = b.breakdown[sortConfig.key]?.amount || 0;
                }

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return filteredData;

    }, [lessons, teachers, selectedMonth, sortConfig, searchTerm, currentUser, activeClassTypes]);

    // Detailed Lessons for Modal
    const detailedLessons = useMemo(() => {
        if (!detailsTeacher) return [];
        return lessons.filter(l => 
            l.teacherId === detailsTeacher.id && 
            l.date.startsWith(selectedMonth) && 
            l.isCompleted
        ).sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
    }, [lessons, detailsTeacher, selectedMonth]);

    const requestSort = (key: string) => {
        let direction: SortDirection = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const SortIcon = ({ column }: { column: string }) => {
        if (sortConfig?.key !== column) return <ArrowUpDown className="w-3 h-3 ml-1 text-slate-300" />;
        return sortConfig.direction === 'asc' 
            ? <ArrowUp className="w-3 h-3 ml-1 text-blue-500" /> 
            : <ArrowDown className="w-3 h-3 ml-1 text-blue-500" />;
    };

    // Pie Chart Data
    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
    const pieData = useMemo(() => {
        return activeClassTypes.map((ct, index) => {
            let total = 0;
            payrollData.forEach(p => {
                total += p.breakdown[ct.id]?.amount || 0;
            });
            return {
                name: ct.name,
                value: total,
                color: COLORS[index % COLORS.length]
            };
        }).filter(d => d.value > 0);
    }, [payrollData, activeClassTypes]);

    const totalCost = payrollData.reduce((acc, curr) => acc + curr.totalPay, 0);

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        setAiAnalysis("");
        const result = await analyzePayroll(payrollData, selectedMonth);
        setAiAnalysis(result);
        setIsAnalyzing(false);
    };

    const handleExportCSV = () => {
        const header = ['教師姓名', '總堂數', '總時數', ...activeClassTypes.map(ct => `${ct.name}薪資`), '總薪資'];
        const rows = payrollData.map(record => [
            record.teacherName,
            record.totalLessons,
            record.totalHours.toFixed(1),
            ...activeClassTypes.map(ct => record.breakdown[ct.id]?.amount || 0),
            record.totalPay
        ]);

        const csvContent = [
            '\uFEFF' + header.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `薪資報表_${selectedMonth}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Helper to get Class Type Name safely
    const getTypeName = (id: string) => {
        const found = activeClassTypes.find(ct => ct.id === id);
        return found ? found.name : id;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-800">薪酬結算系統</h2>
                <div className="flex items-center space-x-3">
                    {/* Explicit Year/Month Selectors */}
                    <div className="flex items-center gap-2">
                         <div className="relative">
                            <select 
                                value={currentYear} 
                                onChange={(e) => handleYearChange(parseInt(e.target.value))}
                                className="appearance-none bg-white border border-gray-200 text-gray-700 py-2 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm font-bold cursor-pointer hover:bg-gray-50 transition-colors"
                            >
                                {years.map(y => <option key={y} value={y}>{y}年</option>)}
                            </select>
                            <ChevronDown className="w-4 h-4 text-slate-900 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                        <div className="relative">
                            <select 
                                value={currentMonth} 
                                onChange={(e) => handleMonthChange(parseInt(e.target.value))}
                                className="appearance-none bg-white border border-gray-200 text-gray-700 py-2 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm font-bold cursor-pointer hover:bg-gray-50 transition-colors"
                            >
                                {months.map(m => <option key={m} value={m}>{m + 1}月</option>)}
                            </select>
                            <ChevronDown className="w-4 h-4 text-slate-900 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                    </div>

                    <button 
                        onClick={handleExportCSV}
                        className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 shadow-sm transition-colors"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        匯出報表
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className={`grid grid-cols-1 md:grid-cols-${isAdmin ? '4' : '3'} gap-6`}>
                 {/* New Revenue Card - Only visible for Admin */}
                 {isAdmin && (
                     <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
                        <p className="text-emerald-100 mb-1">本月總收入</p>
                        <h3 className="text-3xl font-bold">
                            ${totalRevenue.toLocaleString()}
                        </h3>
                    </div>
                 )}

                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
                    <p className="text-blue-100 mb-1">本月總薪酬</p>
                    <h3 className="text-3xl font-bold">
                        ${totalCost.toLocaleString()}
                    </h3>
                </div>
                <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                    <p className="text-gray-500 mb-1">總授課時數</p>
                    <h3 className="text-3xl font-bold text-gray-800">
                        {payrollData.reduce((acc, curr) => acc + curr.totalHours, 0).toFixed(1)} <span className="text-sm font-normal text-gray-500">小時</span>
                    </h3>
                </div>
                 <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                    <p className="text-gray-500 mb-1">完成課程數</p>
                    <h3 className="text-3xl font-bold text-gray-800">
                        {payrollData.reduce((acc, curr) => acc + curr.totalLessons, 0)} <span className="text-sm font-normal text-gray-500">堂</span>
                    </h3>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col max-h-[600px]">
                    <div className="p-4 border-b border-gray-100 bg-gray-50 font-semibold text-gray-700 sticky top-0 z-10 flex justify-between items-center">
                        <span>{isAdmin ? '教師薪資明細' : '薪資明細'}</span>
                        {/* Search Bar for Table */}
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                            <input 
                                type="text" 
                                placeholder="搜尋教師..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-40 bg-white"
                            />
                        </div>
                    </div>
                    <div className="overflow-x-auto flex-1 custom-scrollbar">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
                                <tr>
                                    <th onClick={() => requestSort('teacherName')} className="px-4 py-3 text-xs font-semibold text-gray-500 bg-gray-50 cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap">
                                        <div className="flex items-center">教師 <SortIcon column="teacherName"/></div>
                                    </th>
                                    {activeClassTypes.map(ct => (
                                        <th key={ct.id} onClick={() => requestSort(ct.id)} className="px-4 py-3 text-xs font-semibold text-gray-500 text-right bg-gray-50 cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap">
                                            <div className="flex items-center justify-end">{ct.name} <SortIcon column={ct.id}/></div>
                                        </th>
                                    ))}
                                    <th onClick={() => requestSort('total')} className="px-4 py-3 text-xs font-semibold text-gray-500 text-right bg-gray-50 cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap">
                                        <div className="flex items-center justify-end">總薪酬 <SortIcon column="total"/></div>
                                    </th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 text-center bg-gray-50 whitespace-nowrap">明細</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {payrollData.length > 0 ? payrollData.map(record => (
                                    <tr key={record.teacherId} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{record.teacherName}</td>
                                        {activeClassTypes.map(ct => (
                                            <td key={ct.id} className="px-4 py-3 text-right text-sm text-gray-600 whitespace-nowrap">
                                                ${(record.breakdown[ct.id]?.amount || 0).toLocaleString()}
                                            </td>
                                        ))}
                                        <td className="px-4 py-3 text-right font-bold text-blue-600 whitespace-nowrap">${record.totalPay.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-center whitespace-nowrap">
                                            <button 
                                                onClick={() => setDetailsTeacher({id: record.teacherId, name: record.teacherName})}
                                                className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                                                title="查看明細"
                                            >
                                                <List className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={activeClassTypes.length + 3} className="px-4 py-8 text-center text-gray-400">本月尚無薪資資料</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* AI Analysis & Chart */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-80 relative flex flex-col">
                         <h4 className="font-bold text-gray-700 mb-2">{isAdmin ? '薪資結構分佈' : '我的薪資結構'}</h4>
                         <div className="flex-1 w-full min-h-0 relative">
                             {totalCost > 0 ? (
                                <>
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
                                                    <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                                                ))}
                                            </Pie>
                                            <Tooltip 
                                                formatter={(value: number) => `$${value.toLocaleString()}`}
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            />
                                            <Legend verticalAlign="bottom" height={36}/>
                                        </PieChart>
                                    </ResponsiveContainer>
                                    
                                    {/* Center Text Overlay */}
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                                        <span className="text-xs text-gray-400 font-medium">總薪酬</span>
                                        <span className="text-xl font-bold text-gray-800">${totalCost.toLocaleString()}</span>
                                    </div>
                                </>
                             ) : (
                                 <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                                     尚無數據可供分析
                                 </div>
                             )}
                         </div>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-indigo-900 flex items-center">
                                <Sparkles className="w-5 h-5 mr-2 text-indigo-600" />
                                AI 財務顧問
                            </h3>
                            <button 
                                onClick={handleAnalyze}
                                disabled={isAnalyzing}
                                className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center"
                            >
                                {isAnalyzing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                {isAnalyzing ? '分析中...' : '生成分析報告'}
                            </button>
                        </div>
                        <div className="min-h-[100px] text-sm text-indigo-800 leading-relaxed whitespace-pre-line">
                            {aiAnalysis ? aiAnalysis : "點擊按鈕，讓 AI 為您分析本月的薪資結構、教師績效以及營運優化建議。"}
                        </div>
                    </div>
                </div>
            </div>

            {/* Course Details Modal */}
            {detailsTeacher && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">{detailsTeacher.name} - 課程明細</h3>
                                <p className="text-xs text-gray-500 mt-1">{currentYear}年{currentMonth + 1}月</p>
                            </div>
                            <button onClick={() => setDetailsTeacher(null)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-0 flex-1 overflow-y-auto custom-scrollbar">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-100 sticky top-0">
                                    <tr>
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">日期/時間</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">課程</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">類型</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-right">學費</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-center">抽成</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-right">薪資</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {detailedLessons.length > 0 ? detailedLessons.map(lesson => (
                                        <tr key={lesson.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-3">
                                                <div className="text-sm font-medium text-gray-900">{lesson.date}</div>
                                                <div className="text-xs text-gray-500 flex items-center">
                                                    <Clock className="w-3 h-3 mr-1" />
                                                    {lesson.startTime} ({lesson.durationMinutes}m)
                                                </div>
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="text-sm text-gray-800">{lesson.title}</div>
                                                <div className="text-xs text-gray-500">{lesson.subject}</div>
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className="text-[10px] px-2 py-1 rounded font-medium bg-slate-100 text-slate-600">
                                                    {getTypeName(lesson.type)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 text-right text-sm text-gray-500">
                                                ${(lesson.price || 0).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-3 text-center">
                                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600">
                                                    {lesson.price ? Math.round(((lesson.cost || 0) / lesson.price) * 100) : 0}%
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 text-right font-bold text-blue-600">
                                                ${(lesson.cost || 0).toLocaleString()}
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                                                <FileText className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                                查無課程明細
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                            <span className="text-sm text-gray-500">共 {detailedLessons.length} 堂課</span>
                            <div className="text-right">
                                <span className="text-sm text-gray-600 mr-3">薪資總計</span>
                                <span className="text-xl font-bold text-blue-600">
                                    ${detailedLessons.reduce((sum, l) => sum + (l.cost || 0), 0).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
