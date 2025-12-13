


import React, { useState, useMemo } from 'react';
import { Lesson, Teacher, Student, ClassType, SystemConfig } from '../types';
import { Calendar as CalendarIcon, DollarSign, Clock, Users, BookOpen, TrendingUp, BarChart2, PieChart as PieChartIcon, ArrowUpDown, ArrowUp, ArrowDown, Download, Search } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface ReportViewProps {
    lessons: Lesson[];
    teachers: Teacher[];
    students: Student[];
    systemConfig?: SystemConfig;
}

type SortKey = 'name' | 'lessons' | 'hours' | 'cost' | 'avg';
type SortDirection = 'asc' | 'desc';

export const ReportView: React.FC<ReportViewProps> = ({ lessons, teachers, students, systemConfig }) => {
    // Helper to format date to YYYY-MM-DD in Local Time (avoiding UTC shifts)
    const formatDateLocal = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Default to current month using Local Time
    const now = new Date();
    const firstDayObj = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayObj = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of current month

    const [startDate, setStartDate] = useState(formatDateLocal(firstDayObj));
    const [endDate, setEndDate] = useState(formatDateLocal(lastDayObj));
    const [teacherSearchTerm, setTeacherSearchTerm] = useState(''); // Teacher Filter

    // Sorting State
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection } | null>({ key: 'cost', direction: 'desc' });

    // Filter Data based on Range
    const filteredLessons = useMemo(() => {
        return lessons.filter(l => l.date >= startDate && l.date <= endDate);
    }, [lessons, startDate, endDate]);

    // Statistics Calculations
    const stats = useMemo(() => {
        const totalLessons = filteredLessons.length;
        const completedLessons = filteredLessons.filter(l => l.isCompleted).length;
        const completionRate = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
        
        const totalCost = filteredLessons.reduce((acc, curr) => acc + (curr.isCompleted ? (curr.cost || 0) : 0), 0);
        const totalHours = filteredLessons.reduce((acc, curr) => acc + (curr.durationMinutes / 60), 0);
        
        const uniqueStudentIds = new Set(filteredLessons.flatMap(l => l.studentIds));
        const activeStudents = uniqueStudentIds.size;

        return { totalLessons, completedLessons, completionRate, totalCost, totalHours, activeStudents };
    }, [filteredLessons]);

    // Subject Distribution Data (Pie Chart)
    const subjectData = useMemo(() => {
        const counts: Record<string, number> = {};
        filteredLessons.forEach(l => {
            const subject = l.subject.split(' ')[0]; // Take only main name "Piano" from "Piano (Piano)"
            counts[subject] = (counts[subject] || 0) + 1;
        });
        return Object.keys(counts)
            .map(name => ({ name, value: counts[name] }))
            .sort((a, b) => b.value - a.value);
    }, [filteredLessons]);

    // Daily Activity Data (Bar Chart)
    const dailyData = useMemo(() => {
        const counts: Record<string, number> = {};
        filteredLessons.forEach(l => {
            const date = l.date.slice(5); // MM-DD
            counts[date] = (counts[date] || 0) + 1;
        });
        return Object.keys(counts)
            .sort()
            .map(date => ({ date, count: counts[date] }));
    }, [filteredLessons]);

    // Teacher Performance Data
    const teacherStats = useMemo(() => {
        const stats: Record<string, { name: string, lessons: number, hours: number, cost: number, avg: number }> = {};
        
        filteredLessons.forEach(l => {
            if (!stats[l.teacherId]) {
                const t = teachers.find(t => t.id === l.teacherId);
                stats[l.teacherId] = { name: t?.name || 'Unknown', lessons: 0, hours: 0, cost: 0, avg: 0 };
            }
            stats[l.teacherId].lessons += 1;
            stats[l.teacherId].hours += (l.durationMinutes / 60);
            if (l.isCompleted) {
                stats[l.teacherId].cost += (l.cost || 0);
            }
        });

        // Calculate Average
        Object.values(stats).forEach(s => {
            s.avg = s.lessons > 0 ? Math.round(s.cost / s.lessons) : 0;
        });

        let result = Object.values(stats);

        // Filter by Search Term
        result = result.filter(t => t.name.toLowerCase().includes(teacherSearchTerm.toLowerCase()));

        // Sorting Logic
        if (sortConfig) {
            result.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
                if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [filteredLessons, teachers, sortConfig, teacherSearchTerm]);

    const requestSort = (key: SortKey) => {
        let direction: SortDirection = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const SortIcon = ({ column }: { column: SortKey }) => {
        if (sortConfig?.key !== column) return <ArrowUpDown className="w-3 h-3 ml-1 text-slate-300" />;
        return sortConfig.direction === 'asc' 
            ? <ArrowUp className="w-3 h-3 ml-1 text-blue-500" /> 
            : <ArrowDown className="w-3 h-3 ml-1 text-blue-500" />;
    };

    const handleExportCSV = () => {
        const header = ['日期', '時間', '課程標題', '科目', '教師', '學生數', '時長(分)', '費用', '狀態'];
        const rows = filteredLessons.map(l => {
            const teacher = teachers.find(t => t.id === l.teacherId)?.name || 'Unknown';
            return [
                l.date,
                l.startTime,
                l.title,
                l.subject,
                teacher,
                l.studentIds.length,
                l.durationMinutes,
                l.cost || 0,
                l.isCompleted ? '已完成' : '未完成'
            ];
        });

        const csvContent = [
            '\uFEFF' + header.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `詳細報表_${startDate}_${endDate}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

    return (
        <div className="space-y-6">
            {/* Header & Filters */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">詳細報表</h2>
                    <p className="text-sm text-gray-500">自訂日期區間查詢營運數據</p>
                </div>
                
                <div className="flex items-center gap-2">
                    <div className="flex items-center space-x-2 bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
                        <div className="relative">
                            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                            <input 
                                type="date" 
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="pl-10 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors h-10 w-[150px]"
                            />
                        </div>
                        <span className="text-gray-400 font-medium">至</span>
                        <div className="relative">
                            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                            <input 
                                type="date" 
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="pl-10 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors h-10 w-[150px]"
                            />
                        </div>
                    </div>
                    <button 
                        onClick={handleExportCSV}
                        className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 shadow-sm transition-colors h-[58px] md:h-auto"
                        title="匯出 CSV"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        匯出
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-gray-500">總課程數</p>
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <BookOpen className="w-5 h-5" />
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800">{stats.totalLessons} <span className="text-sm font-normal text-gray-400">堂</span></h3>
                    <div className="mt-2 text-xs text-gray-500">完成率 {stats.completionRate}%</div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-gray-500">預估/實際支出</p>
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                            <DollarSign className="w-5 h-5" />
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800">${stats.totalCost.toLocaleString()}</h3>
                    <div className="mt-2 text-xs text-gray-500">僅計算已完成課程</div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-gray-500">總授課時數</p>
                        <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                            <Clock className="w-5 h-5" />
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800">{stats.totalHours.toFixed(1)} <span className="text-sm font-normal text-gray-400">小時</span></h3>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-gray-500">活躍學生</p>
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                            <Users className="w-5 h-5" />
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800">{stats.activeStudents} <span className="text-sm font-normal text-gray-400">人</span></h3>
                    <div className="mt-2 text-xs text-gray-500">佔總學生 {(stats.activeStudents / students.length * 100).toFixed(0)}%</div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Subject Distribution */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col h-[500px]">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-gray-800 flex items-center">
                            <PieChartIcon className="w-5 h-5 mr-2 text-blue-500" />
                            熱門課程分佈
                        </h3>
                    </div>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={subjectData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={100} 
                                    paddingAngle={2}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    labelLine={true}
                                >
                                    {subjectData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => [value + ' 堂', '課程數']} />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Daily Trend */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col h-[500px]">
                     <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-gray-800 flex items-center">
                            <TrendingUp className="w-5 h-5 mr-2 text-emerald-500" />
                            每日課程數量趨勢
                        </h3>
                    </div>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dailyData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="date" tick={{fontSize: 12}} stroke="#94a3b8" />
                                <YAxis allowDecimals={false} stroke="#94a3b8" />
                                <Tooltip 
                                    cursor={{fill: '#f8fafc'}}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} name="課程數" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Teacher Performance Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center">
                        <BarChart2 className="w-5 h-5 mr-2 text-gray-500" />
                        <h3 className="font-bold text-gray-800">區間教師績效統計</h3>
                    </div>
                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                        <input 
                            type="text" 
                            placeholder="搜尋教師..." 
                            value={teacherSearchTerm}
                            onChange={(e) => setTeacherSearchTerm(e.target.value)}
                            className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-40 bg-white"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th onClick={() => requestSort('name')} className="px-6 py-3 text-xs font-semibold text-gray-500 cursor-pointer hover:bg-gray-100 select-none">
                                    <div className="flex items-center">教師姓名 <SortIcon column="name"/></div>
                                </th>
                                <th onClick={() => requestSort('lessons')} className="px-6 py-3 text-xs font-semibold text-gray-500 text-right cursor-pointer hover:bg-gray-100 select-none">
                                    <div className="flex items-center justify-end">授課堂數 <SortIcon column="lessons"/></div>
                                </th>
                                <th onClick={() => requestSort('hours')} className="px-6 py-3 text-xs font-semibold text-gray-500 text-right cursor-pointer hover:bg-gray-100 select-none">
                                    <div className="flex items-center justify-end">總時數 (h) <SortIcon column="hours"/></div>
                                </th>
                                <th onClick={() => requestSort('cost')} className="px-6 py-3 text-xs font-semibold text-gray-500 text-right cursor-pointer hover:bg-gray-100 select-none">
                                    <div className="flex items-center justify-end">薪資小計 <SortIcon column="cost"/></div>
                                </th>
                                <th onClick={() => requestSort('avg')} className="px-6 py-3 text-xs font-semibold text-gray-500 text-right cursor-pointer hover:bg-gray-100 select-none">
                                    <div className="flex items-center justify-end">平均單堂產值 <SortIcon column="avg"/></div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {teacherStats.length > 0 ? (
                                teacherStats.map((t, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900">{t.name}</td>
                                        <td className="px-6 py-4 text-right text-gray-600">{t.lessons}</td>
                                        <td className="px-6 py-4 text-right text-gray-600">{t.hours.toFixed(1)}</td>
                                        <td className="px-6 py-4 text-right font-medium text-blue-600">${t.cost.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right text-gray-500">
                                            ${t.lessons > 0 ? Math.round(t.cost / t.lessons).toLocaleString() : 0}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                                        此區間無課程資料
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
