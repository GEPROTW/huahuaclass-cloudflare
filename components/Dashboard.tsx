import React, { useState, useMemo, useEffect } from 'react';
import { Lesson, Student, Teacher, AppUser, getClassTypeName, SystemConfig, Announcement } from '../types';
import { Users, BookOpen, Clock, Calendar, User, CheckCircle, Circle, TrendingUp, PieChart as PieChartIcon, X, UserCheck, GraduationCap, DollarSign, Calendar as CalendarIcon, Radio, Megaphone, Plus, Trash2, Edit } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { db } from '../services/db';

interface DashboardProps {
    lessons: Lesson[];
    students: Student[];
    teachers: Teacher[];
    onUpdateLesson?: (lesson: Lesson) => void;
    currentUser?: AppUser | null;
    systemConfig?: SystemConfig;
}

type TimeView = 'day' | 'week' | 'month';

const formatTimeWithPeriod = (time: string) => {
    if (!time) return '';
    const [hourStr, minuteStr] = time.split(':');
    const hour = parseInt(hourStr, 10);
    const period = hour < 12 ? '上午' : '下午';
    const displayHour = hour % 12 || 12; 
    const displayHourStr = String(displayHour).padStart(2, '0');
    return `${period} ${displayHourStr}:${minuteStr}`;
};

export const Dashboard: React.FC<DashboardProps> = ({ lessons, students, teachers, currentUser, systemConfig }) => {
    const [timeView, setTimeView] = useState<TimeView>('day');
    const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [isEditingAnnouncement, setIsEditingAnnouncement] = useState(false);
    const [currentAnnouncement, setCurrentAnnouncement] = useState<Partial<Announcement>>({});

    useEffect(() => {
        const fetchAnnouncements = async () => {
            try {
                const data = await db.getCollection('announcements');
                setAnnouncements(data || []);
            } catch (e) {
                console.error(e);
            }
        };
        fetchAnnouncements();
    }, []);

    const handleSaveAnnouncement = async () => {
        if (!currentAnnouncement.title || !currentAnnouncement.content) return;
        const isNew = !currentAnnouncement.id;
        const payload = {
            ...currentAnnouncement,
            id: currentAnnouncement.id || `ann-${Date.now()}`,
            date: currentAnnouncement.date || new Date().toISOString(),
            authorName: currentUser?.name || '管理員',
            isPinned: !!currentAnnouncement.isPinned
        };
        try {
            if (isNew) {
                await db.add('announcements', payload);
                setAnnouncements([...announcements, payload as Announcement]);
            } else {
                await db.update('announcements', payload);
                setAnnouncements(announcements.map(a => a.id === payload.id ? payload as Announcement : a));
            }
            setIsEditingAnnouncement(false);
        } catch(e) {
            console.error(e);
        }
    };

    const handleDeleteAnnouncement = async (id: string) => {
        if (!confirm('確定要刪除這則佈告嗎？')) return;
        try {
            await db.delete('announcements', id);
            setAnnouncements(announcements.filter(a => a.id !== id));
        } catch(e) {
            console.error(e);
        }
    };

    // Update time every minute to refresh "In Progress" status
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const checkIsInProgress = (lesson: Lesson) => {
        const now = currentTime;
        const lessonDate = new Date(lesson.date);
        
        // Check date match (Local Time)
        if (now.getFullYear() !== lessonDate.getFullYear() || 
            now.getMonth() !== lessonDate.getMonth() || 
            now.getDate() !== lessonDate.getDate()) {
            return false;
        }

        const [startH, startM] = lesson.startTime.split(':').map(Number);
        const startMinutes = startH * 60 + startM;
        const endMinutes = startMinutes + lesson.durationMinutes;
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    };

    const formatDateLocal = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const now = new Date();
    const todayStr = formatDateLocal(now);
    const currentMonthPrefix = todayStr.substring(0, 7); 

    const monthlyHours = lessons
        .filter(l => l.date.startsWith(currentMonthPrefix))
        .reduce((acc, curr) => acc + (curr.durationMinutes / 60), 0);
    
    const isAdmin = currentUser?.role === 'admin';

    const stats = [
        { label: '今日課程', value: lessons.filter(l => l.date === todayStr).length, icon: BookOpen, color: 'bg-emerald-500', visible: true },
        { label: '合作教師', value: teachers.length, icon: Users, color: 'bg-purple-500', visible: isAdmin },
        { label: '本月累計課時', value: `${monthlyHours.toFixed(1)}h`, icon: Clock, color: 'bg-amber-500', visible: isAdmin },
        { label: '活躍學生', value: students.length, icon: Users, color: 'bg-blue-500', visible: isAdmin },
    ].filter(s => s.visible);

    // Chart Data Preparation
    const subjectData = useMemo<{ name: string; value: number }[]>(() => {
        const counts: Record<string, number> = {};
        lessons.filter(l => l.date.startsWith(currentMonthPrefix)).forEach(l => {
            const subject = l.subject.split(' ')[0];
            counts[subject] = (counts[subject] || 0) + 1;
        });
        return Object.keys(counts)
            .map(name => ({ name, value: counts[name] }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
    }, [lessons, currentMonthPrefix]);

    const dailyData = useMemo<{ date: string; count: number }[]>(() => {
        const counts: Record<string, number> = {};
        // Get last 7 days including today
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = formatDateLocal(d);
            const shortDate = dateStr.slice(5); // MM-DD
            counts[shortDate] = lessons.filter(l => l.date === dateStr).length;
        }
        return Object.keys(counts).map(date => ({ date, count: counts[date] }));
    }, [lessons]);

    const filteredLessons = useMemo(() => {
        const getStartOfWeek = (d: Date) => {
            const date = new Date(d);
            const day = date.getDay();
            const diff = date.getDate() - day; 
            return new Date(date.setDate(diff));
        };

        const startOfWeek = getStartOfWeek(new Date());
        startOfWeek.setHours(0,0,0,0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        endOfWeek.setHours(23,59,59,999);

        return lessons.filter(l => {
            const lessonDate = new Date(l.date);
            if (timeView === 'day') {
                return l.date === todayStr;
            } else if (timeView === 'week') {
                return lessonDate >= startOfWeek && lessonDate <= endOfWeek;
            } else {
                return l.date.startsWith(currentMonthPrefix);
            }
        }).sort((a, b) => {
            const dateCompare = a.date.localeCompare(b.date);
            if (dateCompare !== 0) return dateCompare;
            return a.startTime.localeCompare(b.startTime);
        });
    }, [lessons, timeView, todayStr, currentMonthPrefix]);

    const groupedLessons = useMemo(() => {
        const groups: Record<string, Lesson[]> = {};
        filteredLessons.forEach(l => {
            if (!groups[l.date]) groups[l.date] = [];
            groups[l.date].push(l);
        });
        return groups;
    }, [filteredLessons]);

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

    return (
        <div className="flex flex-col space-y-6 pb-6">
            {/* Header Section */}
            <div className="flex flex-col gap-6">
                <h2 className="text-2xl font-bold text-gray-800">總覽儀表板</h2>
                
                {/* Stats Cards - Adjusted alignment */}
                <div className={`w-full gap-4 ${isAdmin ? 'grid grid-cols-2 lg:grid-cols-4' : 'flex flex-wrap'}`}>
                    {stats.map((stat, idx) => (
                        <div 
                            key={idx} 
                            className={`bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center transition-all hover:shadow-md ${isAdmin ? 'w-full' : 'w-full sm:w-64'}`}
                        >
                            <div className={`p-3 rounded-lg ${stat.color} text-white mr-3 shadow-sm flex-shrink-0`}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                            <div className="truncate flex-1">
                                <p className="text-xs text-gray-500 font-medium mb-0.5">{stat.label}</p>
                                <h3 className="text-xl font-bold text-gray-800 truncate">{stat.value}</h3>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Reports & Announcements Section */}
            <div className={`grid grid-cols-1 ${isAdmin ? 'xl:grid-cols-2' : ''} gap-6`}>
                {/* Bulletin Board - Visible to All */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col h-[450px]">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-800 flex items-center text-sm">
                            <Megaphone className="w-4 h-4 mr-2 text-emerald-500" />
                            內部佈告欄
                        </h3>
                        {isAdmin && (
                            <button 
                                onClick={() => {
                                    setCurrentAnnouncement({});
                                    setIsEditingAnnouncement(true);
                                }}
                                className="text-emerald-700 font-bold flex items-center text-xs bg-emerald-50 hover:bg-emerald-100 transition-colors px-2 py-1.5 rounded"
                            >
                                <Plus className="w-3 h-3 mr-1" /> 新增
                            </button>
                        )}
                    </div>
                    <div className="flex-1 w-full min-h-0 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                        {announcements
                            .sort((a,b) => {
                                if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
                                return new Date(b.date).getTime() - new Date(a.date).getTime();
                            })
                            .map(ann => (
                            <div key={ann.id} className={`p-4 rounded-lg border ${ann.isPinned ? 'border-amber-200 bg-amber-50/50' : 'border-gray-100 bg-gray-50/50'} hover:bg-opacity-80 transition-colors`}>
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-gray-800 text-sm flex items-center">
                                        {ann.isPinned && <span className="bg-amber-100 text-amber-700 border border-amber-200 text-[10px] px-1.5 py-0.5 rounded mr-2 font-bold whitespace-nowrap">置頂</span>}
                                        {ann.title}
                                    </h4>
                                    {isAdmin && (
                                        <div className="flex items-center space-x-2 ml-2">
                                            <button onClick={() => { setCurrentAnnouncement(ann); setIsEditingAnnouncement(true); }} className="text-gray-400 hover:text-blue-500 bg-white p-1 rounded shadow-sm border border-gray-100"><Edit className="w-3 h-3" /></button>
                                            <button onClick={() => handleDeleteAnnouncement(ann.id)} className="text-gray-400 hover:text-red-500 bg-white p-1 rounded shadow-sm border border-gray-100"><Trash2 className="w-3 h-3" /></button>
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">{ann.content}</p>
                                <div className="mt-3 flex items-center justify-between text-[10px] text-gray-400 font-medium">
                                    <span>由 {ann.authorName} 發布</span>
                                    <span>{new Date(ann.date).toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))}
                        {announcements.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                <Megaphone className="w-8 h-8 mb-2 opacity-20" />
                                <span className="text-sm">目前沒有公告</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Popular Subjects Chart - Admin Only */}
                {isAdmin && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col h-[450px]">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center text-sm">
                            <PieChartIcon className="w-4 h-4 mr-2 text-blue-500" />
                            本月熱門科目 (Top 5)
                        </h3>
                        <div className="flex-1 w-full min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={subjectData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80} 
                                        paddingAngle={2}
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        labelLine={false}
                                    >
                                        {subjectData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: number) => [value + ' 堂', '課程數']} contentStyle={{ fontSize: '12px' }} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </div>

            {/* Course Schedule Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-[400px]">
                <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center self-start sm:self-center">
                        <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                        課程安排
                    </h3>
                    
                    <div className="flex bg-white border border-gray-200 p-1 rounded-lg shadow-sm w-full sm:w-auto">
                        {(['day', 'week', 'month'] as const).map((view) => (
                            <button
                                key={view}
                                onClick={() => setTimeView(view)}
                                className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                                    timeView === view 
                                    ? 'bg-slate-800 text-white shadow-md' 
                                    : 'text-slate-500 hover:bg-slate-100'
                                }`}
                            >
                                {view === 'day' ? '今日' : (view === 'week' ? '本週' : '本月')}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-4 md:p-6 bg-white">
                    {Object.keys(groupedLessons).length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-gray-400 py-12">
                            <BookOpen className="w-12 h-12 mb-3 opacity-20" />
                            <p>此時段無安排課程</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {Object.entries(groupedLessons).sort((a, b) => a[0].localeCompare(b[0])).map(([date, lessons]: [string, Lesson[]]) => {
                                const dateObj = new Date(date);
                                const weekDay = ['週日','週一','週二','週三','週四','週五','週六'][dateObj.getDay()];
                                const dateDisplay = `${dateObj.getFullYear()}/${dateObj.getMonth() + 1}/${dateObj.getDate()}`;
                                
                                return (
                                    <div key={date} className="relative">
                                        <div className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur-sm py-2 px-3 -mx-2 mb-3 border-y border-slate-200 shadow-sm flex items-center justify-between rounded-lg">
                                            <div className="flex items-center">
                                                <div className="w-1 h-5 bg-blue-500 rounded-full mr-3"></div>
                                                <span className="text-slate-800 font-bold text-sm mr-2">
                                                    {dateDisplay}
                                                </span>
                                                <span className="text-slate-500 font-medium text-xs">
                                                    {weekDay}
                                                </span>
                                            </div>
                                            <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-500 font-medium">
                                                {lessons.length} 堂
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 gap-3">
                                            {lessons.map(lesson => {
                                                const teacher = teachers.find(t => t.id === lesson.teacherId);
                                                const isMyLesson = currentUser?.teacherId === lesson.teacherId;
                                                const isInProgress = checkIsInProgress(lesson);

                                                return (
                                                    <div 
                                                        key={lesson.id} 
                                                        onClick={() => setSelectedLesson(lesson)}
                                                        className={`relative flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border transition-all hover:shadow-md cursor-pointer ${
                                                            isInProgress
                                                            ? 'bg-red-50/50 border-red-200 ring-1 ring-red-200 shadow-md'
                                                            : (isMyLesson 
                                                                ? 'bg-blue-50/30 border-blue-200' 
                                                                : 'bg-white border-gray-100')
                                                        }`}
                                                    >
                                                        {isInProgress && (
                                                            <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-red-500 rounded-l-xl"></div>
                                                        )}

                                                        <div className="absolute top-3 right-3 flex items-center gap-2">
                                                            {isInProgress && (
                                                                <span className="bg-red-100 text-red-600 text-[10px] px-2 py-0.5 rounded-full font-bold border border-red-200 flex items-center animate-pulse">
                                                                    <Radio className="w-3 h-3 mr-1" />
                                                                    上課中
                                                                </span>
                                                            )}
                                                            {isMyLesson && (
                                                                <span className="bg-blue-100 text-blue-600 text-[10px] px-2 py-0.5 rounded-full font-bold border border-blue-200">
                                                                    您的課程
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className={`flex items-center gap-3 ${isInProgress ? 'pl-2' : ''}`}>
                                                            <div className={`flex flex-col items-center justify-center rounded-lg p-2 min-w-[50px] text-center border ${
                                                                isInProgress ? 'bg-white border-red-200 text-red-600' : (isMyLesson ? 'bg-white border-blue-100' : 'bg-slate-50 border-slate-100')
                                                            }`}>
                                                                <div className="text-base font-black leading-none tracking-tight">{lesson.startTime}</div>
                                                                <div className="text-[9px] font-medium opacity-60 mt-0.5">{lesson.durationMinutes} min</div>
                                                            </div>
                                                            
                                                            <div>
                                                                <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                                                    {lesson.title}
                                                                </h4>
                                                                
                                                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                                                    <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                                                        {lesson.subject}
                                                                    </span>
                                                                    <div className="flex items-center text-[10px] text-gray-500">
                                                                        <User className="w-3 h-3 mr-1" />
                                                                        <span className={`${isMyLesson ? 'font-bold text-blue-600' : ''}`}>
                                                                            {teacher?.name}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="mt-2 sm:mt-0 sm:ml-auto flex items-center justify-end pr-4 sm:pr-16">
                                                            {!isInProgress && (
                                                                lesson.isCompleted ? (
                                                                    <div className="flex items-center text-emerald-600 text-[10px] font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                                                                        <CheckCircle className="w-3 h-3 mr-1" />
                                                                        已完課
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex items-center text-slate-400 text-[10px] font-medium bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100">
                                                                        <Circle className="w-3 h-3 mr-1" />
                                                                        未完課
                                                                    </div>
                                                                )
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Detailed Lesson View Modal */}
            {selectedLesson && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 relative flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    課程詳細資訊
                                    <span className="text-xs font-mono font-normal text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded">ID: {selectedLesson.id}</span>
                                </h3>
                                <p className="text-xs text-slate-500 mt-1">{selectedLesson.title}</p>
                            </div>
                            <button onClick={() => setSelectedLesson(null)} className="bg-white p-1 rounded-full border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                            {/* Header Status */}
                            <div className="flex items-center justify-between">
                                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${selectedLesson.isCompleted ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                    {selectedLesson.isCompleted ? <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> : <Clock className="w-3.5 h-3.5 mr-1.5" />}
                                    {selectedLesson.isCompleted ? '已完成課程' : '尚未完課'}
                                </div>
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <div className="text-xs text-slate-500 mb-1 flex items-center"><CalendarIcon className="w-3 h-3 mr-1"/> 日期時間</div>
                                    <div className="font-bold text-slate-800">{selectedLesson.date}</div>
                                    <div className="text-sm text-blue-600 font-medium">{formatTimeWithPeriod(selectedLesson.startTime)}</div>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <div className="text-xs text-slate-500 mb-1 flex items-center"><Clock className="w-3 h-3 mr-1"/> 時長與類型</div>
                                    <div className="font-bold text-slate-800">{selectedLesson.durationMinutes} 分鐘</div>
                                    <div className="text-sm text-slate-600">{getClassTypeName(selectedLesson.type)}</div>
                                </div>
                            </div>

                            {/* Teacher Info */}
                            <div>
                                <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center"><UserCheck className="w-4 h-4 mr-1.5 text-blue-500"/> 授課教師</h4>
                                {(() => {
                                    const t = teachers.find(teacher => teacher.id === selectedLesson.teacherId);
                                    return t ? (
                                        <div className="flex items-center p-3 rounded-xl border border-slate-100 bg-white shadow-sm">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mr-3 ${t.color.split(' ')[0]} ${t.color.split(' ')[1]}`}>
                                                {t.name[0]}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-800">{t.name}</div>
                                                <div className="text-xs text-slate-500">{t.phone}</div>
                                            </div>
                                        </div>
                                    ) : <div className="text-sm text-slate-400 italic">未知教師</div>;
                                })()}
                            </div>

                            {/* Students List */}
                            <div>
                                <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center"><GraduationCap className="w-4 h-4 mr-1.5 text-emerald-500"/> 出席學生 ({selectedLesson.studentIds.length})</h4>
                                <div className="space-y-2">
                                    {selectedLesson.studentIds.map(sid => {
                                        const s = students.find(stu => stu.id === sid);
                                        const note = selectedLesson.studentNotes?.[sid];
                                        return s ? (
                                            <div key={sid} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-sm">
                                                <div className="font-bold text-slate-700 flex justify-between">
                                                    {s.name}
                                                    <span className="text-xs font-normal text-slate-400">{s.grade}</span>
                                                </div>
                                                {note && (
                                                    <div className="mt-1.5 pt-1.5 border-t border-slate-200 text-xs text-slate-600 leading-relaxed">
                                                        <span className="font-medium text-slate-400 mr-1">評語:</span>
                                                        {note}
                                                    </div>
                                                )}
                                            </div>
                                        ) : null;
                                    })}
                                </div>
                            </div>

                            {/* Lesson Plan */}
                            {selectedLesson.lessonPlan && (
                                <div>
                                    <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center"><BookOpen className="w-4 h-4 mr-1.5 text-purple-500"/> 教學大綱</h4>
                                    <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 text-sm text-purple-900 leading-relaxed whitespace-pre-wrap">
                                        {selectedLesson.lessonPlan}
                                    </div>
                                </div>
                            )}

                            {/* Financials (Permission Check) */}
                            {(() => {
                                const canView = !currentUser || currentUser.role === 'admin' || (selectedLesson.teacherId && currentUser.teacherId === selectedLesson.teacherId);
                                if (!canView) return null;
                                
                                return (
                                    <div className="pt-4 border-t border-slate-100">
                                        <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center"><DollarSign className="w-4 h-4 mr-1.5 text-slate-400"/> 財務資訊 (僅授權可見)</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                                <div className="text-xs text-slate-500 mb-1">本堂學費</div>
                                                <div className="font-bold text-slate-800 text-lg">${(selectedLesson.price || 0).toLocaleString()}</div>
                                            </div>
                                            <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                                                <div className="text-xs text-blue-600 mb-1">教師薪資</div>
                                                <div className="font-bold text-blue-700 text-lg">${(selectedLesson.cost || 0).toLocaleString()}</div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                        
                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                            <button onClick={() => setSelectedLesson(null)} className="px-6 py-2 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 shadow-sm transition-colors text-sm">
                                關閉視窗
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Announcement Editor Modal */}
            {isEditingAnnouncement && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md z-[70] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="text-lg font-bold text-slate-800">
                                {currentAnnouncement.id ? '編輯公告' : '新增公告'}
                            </h3>
                            <button onClick={() => setIsEditingAnnouncement(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">標題 <span className="text-red-500">*</span></label>
                                <input 
                                    type="text" 
                                    value={currentAnnouncement.title || ''}
                                    onChange={e => setCurrentAnnouncement({...currentAnnouncement, title: e.target.value})}
                                    className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    placeholder="輸入公告標題..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">內容 <span className="text-red-500">*</span></label>
                                <textarea 
                                    value={currentAnnouncement.content || ''}
                                    onChange={e => setCurrentAnnouncement({...currentAnnouncement, content: e.target.value})}
                                    className="w-full border border-gray-300 rounded-lg py-2 px-3 h-32 focus:outline-none focus:ring-2 focus:ring-emerald-500 custom-scrollbar"
                                    placeholder="輸入公告內容..."
                                />
                            </div>
                            <div className="flex items-center">
                                <input 
                                    type="checkbox" 
                                    id="isPinned"
                                    checked={!!currentAnnouncement.isPinned}
                                    onChange={e => setCurrentAnnouncement({...currentAnnouncement, isPinned: e.target.checked})}
                                    className="mr-2"
                                />
                                <label htmlFor="isPinned" className="text-sm font-bold text-amber-600">
                                    置頂此公告
                                </label>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end space-x-3">
                            <button 
                                onClick={() => setIsEditingAnnouncement(false)}
                                className="px-5 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                            >
                                取消
                            </button>
                            <button 
                                onClick={handleSaveAnnouncement}
                                disabled={!currentAnnouncement.title || !currentAnnouncement.content}
                                className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                儲存發布
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
