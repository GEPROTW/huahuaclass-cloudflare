import React, { useState, useMemo } from 'react';
import { Lesson, SystemConfig, Teacher, Student, AppUser, getClassTypeName } from '../types';
import { MapPin, Plus, Trash2, Edit2, Check, X, Calendar as CalendarIcon, Clock, Users, User, ArrowRight, ChevronLeft, ChevronRight, Box } from 'lucide-react';

interface ClassroomViewProps {
    lessons: Lesson[];
    teachers: Teacher[];
    students: Student[];
    systemConfig: SystemConfig;
    onUpdateSystemConfig: (config: SystemConfig) => void;
    readOnly?: boolean;
    currentUser: AppUser;
}

export const ClassroomView: React.FC<ClassroomViewProps> = ({ 
    lessons, teachers, students, systemConfig, onUpdateSystemConfig, readOnly 
}) => {
    const classrooms = systemConfig.classrooms || [];
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(classrooms.length > 0 ? classrooms[0].id : null);
    
    // Edit state
    const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
    const [editRoomName, setEditRoomName] = useState('');
    
    // Add state
    const [isAdding, setIsAdding] = useState(false);
    const [newRoomName, setNewRoomName] = useState('');

    const [currentDate, setCurrentDate] = useState(new Date());

    const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

    const handleSaveRoom = (id: string) => {
        if (!editRoomName.trim()) return;
        const newClassrooms = classrooms.map(r => r.id === id ? { ...r, name: editRoomName.trim() } : r);
        onUpdateSystemConfig({ ...systemConfig, classrooms: newClassrooms });
        setEditingRoomId(null);
    };

    const handleAddRoom = () => {
        if (!newRoomName.trim()) return;
        const newRoom = { id: crypto.randomUUID(), name: newRoomName.trim() };
        const newClassrooms = [...classrooms, newRoom];
        onUpdateSystemConfig({ ...systemConfig, classrooms: newClassrooms });
        setIsAdding(false);
        setNewRoomName('');
        if (!selectedRoomId) setSelectedRoomId(newRoom.id);
    };

    const handleDeleteRoom = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('確定要刪除此教室嗎？')) {
            const newClassrooms = classrooms.filter(r => r.id !== id);
            onUpdateSystemConfig({ ...systemConfig, classrooms: newClassrooms });
            if (selectedRoomId === id) {
                setSelectedRoomId(newClassrooms.length > 0 ? newClassrooms[0].id : null);
            }
        }
    };

    const getLessonsForRoom = (roomId: string) => {
        return lessons.filter(l => l.classroomId === roomId);
    };

    const handlePrevWeek = () => {
        const d = new Date(currentDate);
        d.setDate(d.getDate() - 7);
        setCurrentDate(d);
    };

    const handleNextWeek = () => {
        const d = new Date(currentDate);
        d.setDate(d.getDate() + 7);
        setCurrentDate(d);
    };

    const handleToday = () => {
        setCurrentDate(new Date());
    };

    const weekDays = useMemo(() => {
        const d = new Date(currentDate);
        const day = d.getDay();
        const diff = d.getDate() - day;
        const weekStart = new Date(d.setDate(diff));
        return Array.from({ length: 7 }, (_, i) => {
            const dayDate = new Date(weekStart);
            dayDate.setDate(dayDate.getDate() + i);
            return dayDate;
        });
    }, [currentDate]);

    const formatDateLocal = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const formatTimeWithPeriod = (time: string) => {
        if (!time) return '';
        const [hourStr, minuteStr] = time.split(':');
        const hour = parseInt(hourStr, 10);
        const period = hour < 12 ? '上午' : '下午';
        const displayHour = hour % 12 || 12; 
        const displayHourStr = String(displayHour).padStart(2, '0');
        return `${period} ${displayHourStr}:${minuteStr}`;
    };

    return (
        <div className="flex flex-col md:flex-row gap-6 h-full">
            {/* Classroom List (Side Panel) */}
            <div className="md:w-64 flex-shrink-0 flex flex-col gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center">
                            <MapPin className="w-5 h-5 mr-2 text-indigo-500" />
                            教室列表
                        </h2>
                        {!readOnly && (
                            <button 
                                onClick={() => setIsAdding(true)}
                                className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                    
                    <div className="space-y-2 max-h-[calc(100vh-250px)] overflow-y-auto custom-scrollbar">
                        {isAdding && (
                            <div className="flex items-center gap-2 mb-2 bg-indigo-50 p-2 rounded-xl border border-indigo-100">
                                <input 
                                    className="flex-1 min-w-0 bg-white border border-indigo-200 rounded px-2 py-1 text-sm outline-none focus:border-indigo-400"
                                    value={newRoomName}
                                    onChange={e => setNewRoomName(e.target.value)}
                                    placeholder="教室..."
                                    autoFocus
                                    onKeyDown={e => { if (e.key === 'Enter') handleAddRoom(); if (e.key === 'Escape') setIsAdding(false); }}
                                />
                                <button onClick={handleAddRoom} className="p-1 text-emerald-600 hover:text-emerald-700 flex-shrink-0 bg-emerald-100 hover:bg-emerald-200 rounded"><Check className="w-4 h-4" /></button>
                                <button onClick={() => setIsAdding(false)} className="p-1 text-slate-400 hover:text-slate-600 flex-shrink-0 bg-slate-200 hover:bg-slate-300 rounded"><X className="w-4 h-4" /></button>
                            </div>
                        )}
                        
                        {classrooms.length === 0 && !isAdding && (
                            <div className="text-center py-6 text-sm text-slate-400 border border-dashed border-slate-200 rounded-xl">
                                尚未設定教室
                            </div>
                        )}

                        {classrooms.map(room => (
                            <div 
                                key={room.id}
                                onClick={() => setSelectedRoomId(room.id)}
                                className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${selectedRoomId === room.id ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 border border-transparent hover:border-indigo-100'}`}
                            >
                                {editingRoomId === room.id ? (
                                    <div className="flex items-center gap-2 w-full" onClick={e => e.stopPropagation()}>
                                        <input 
                                            className="flex-1 min-w-0 bg-white border border-indigo-300 text-slate-800 rounded px-2 py-1 text-sm outline-none"
                                            value={editRoomName}
                                            onChange={e => setEditRoomName(e.target.value)}
                                            autoFocus
                                            onKeyDown={e => { if (e.key === 'Enter') handleSaveRoom(room.id); if (e.key === 'Escape') setEditingRoomId(null); }}
                                        />
                                        <button onClick={() => handleSaveRoom(room.id)} className="p-1 text-emerald-600 hover:text-emerald-700 flex-shrink-0 bg-emerald-100/50 hover:bg-emerald-200/50 rounded"><Check className="w-4 h-4" /></button>
                                        <button onClick={() => setEditingRoomId(null)} className="p-1 text-slate-400 hover:text-slate-600 flex-shrink-0 bg-slate-200/50 hover:bg-slate-300/50 rounded"><X className="w-4 h-4" /></button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="font-bold whitespace-nowrap overflow-hidden text-ellipsis flex-1">
                                            {room.name}
                                        </div>
                                        {!readOnly && (
                                            <div className={`flex items-center opacity-0 group-hover:opacity-100 transition-opacity ${selectedRoomId === room.id ? 'text-indigo-200' : 'text-slate-400'}`}>
                                                <button onClick={(e) => { e.stopPropagation(); setEditingRoomId(room.id); setEditRoomName(room.name); }} className="p-1 hover:text-white transition-colors">
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                                <button onClick={(e) => handleDeleteRoom(room.id, e)} className="p-1 hover:text-red-400 transition-colors">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Weekly Schedule Area */}
            <div className="flex-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col min-w-0">
                {selectedRoomId ? (
                    <>
                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">
                                    {classrooms.find(r => r.id === selectedRoomId)?.name} 一般排程
                                </h3>
                                <p className="text-sm text-slate-500 mt-1">查看此教室在本週的使用狀況</p>
                            </div>
                            
                            <div className="flex items-center gap-1 sm:gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 shadow-sm">
                                <button onClick={handlePrevWeek} className="p-1 sm:p-2 hover:bg-white rounded-lg transition-colors text-slate-600 hover:shadow-sm" title="上週">
                                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                                </button>
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="date"
                                        className="bg-transparent border-none text-xs sm:text-sm font-bold text-slate-700 outline-none cursor-pointer hover:bg-white px-1 sm:px-2 py-1 sm:py-1.5 rounded-lg transition-colors"
                                        value={formatDateLocal(currentDate)}
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                setCurrentDate(new Date(e.target.value));
                                            }
                                        }}
                                    />
                                    <button onClick={handleToday} className="px-2 sm:px-3 py-1 font-bold text-xs bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-lg transition-all" title="回到本週">
                                        本週
                                    </button>
                                </div>
                                <button onClick={handleNextWeek} className="p-1 sm:p-2 hover:bg-white rounded-lg transition-colors text-slate-600 hover:shadow-sm" title="下週">
                                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-x-auto custom-scrollbar pb-4 relative">
                            <div className="min-w-[800px] h-full flex flex-col">
                                {/* Week Days Header */}
                                <div className="grid grid-cols-7 gap-2 mb-4 border-b border-slate-100 pb-2">
                                    {weekDays.map((d, i) => {
                                        const isToday = formatDateLocal(d) === formatDateLocal(new Date());
                                        const dayNames = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
                                        return (
                                            <div key={i} className={`flex flex-col items-center justify-center p-2 rounded-xl ${isToday ? 'bg-indigo-50 border border-indigo-100' : ''}`}>
                                                <span className={`text-xs font-bold ${isToday ? 'text-indigo-600' : 'text-slate-500'}`}>{dayNames[d.getDay()]}</span>
                                                <span className={`text-lg font-black mt-1 ${isToday ? 'text-indigo-700' : 'text-slate-700'}`}>{d.getDate()}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                                
                                {/* Schedule Columns */}
                                <div className="flex-1 grid grid-cols-7 gap-2 relative min-h-[300px]">
                                    {weekDays.map((dateObj, colIndex) => {
                                        const dateStr = formatDateLocal(dateObj);
                                        const dayLessons = getLessonsForRoom(selectedRoomId).filter(l => l.date === dateStr).sort((a,b) => a.startTime.localeCompare(b.startTime));
                                        
                                        return (
                                            <div key={colIndex} className="bg-slate-50/50 rounded-xl p-2 flex flex-col gap-2 border border-slate-100/50 relative pt-2">
                                                {dayLessons.map(lesson => {
                                                    const teacher = teachers.find(t => t.id === lesson.teacherId);
                                                    return (
                                                        <div 
                                                            key={lesson.id} 
                                                            onClick={() => setSelectedLesson(lesson)}
                                                            className="bg-white border-l-4 border-indigo-500 p-2.5 rounded-lg shadow-sm hover:shadow-md transition-shadow text-xs group relative overflow-hidden cursor-pointer"
                                                        >
                                                            <div className="font-bold text-slate-800 flex items-center mb-1">
                                                                <Clock className="w-3 h-3 mr-1 text-slate-400" />
                                                                {lesson.startTime}
                                                                <span className="text-slate-400 font-normal ml-1">({lesson.durationMinutes}m)</span>
                                                            </div>
                                                            <div className="font-bold mb-1 truncate text-indigo-700">{lesson.title}</div>
                                                            <div className="flex items-center text-slate-600 mb-1">
                                                                <User className="w-3 h-3 mr-1 text-slate-400" />
                                                                <span className="truncate">{teacher ? teacher.name : '未定'}</span>
                                                            </div>
                                                            <div className="flex flex-wrap gap-1 mt-1.5">
                                                                {lesson.studentIds?.length > 0 ? lesson.studentIds.map(sid => {
                                                                    const s = students.find(s => s.id === sid);
                                                                    return s ? <span key={sid} className="bg-slate-100 text-slate-600 px-1 py-0.5 rounded text-[10px] truncate max-w-[80px]" title={s.name}>{s.name}</span> : null;
                                                                }) : <span className="text-[10px] text-slate-400">無學生</span>}
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="h-full flex items-center justify-center flex-col text-slate-400">
                        <MapPin className="w-16 h-16 mb-4 text-slate-300" />
                        <h4 className="text-xl font-bold text-slate-500 mb-2">選擇或新增一個教室</h4>
                        <p>左側點擊教室以查看其排程狀況</p>
                    </div>
                )}
            </div>

            {/* Lesson Detail Modal */}
            {selectedLesson && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center">
                                <Clock className="w-5 h-5 mr-2 text-indigo-500" />
                                課程詳細資訊
                            </h3>
                            <button onClick={() => setSelectedLesson(null)} className="p-1 text-slate-400 hover:text-slate-600 bg-slate-200/50 hover:bg-slate-200 rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex flex-col mb-4">
                                <span className="text-sm text-slate-500 font-bold mb-1">課程標題</span>
                                <span className="text-lg font-black text-slate-800">{selectedLesson.title}</span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <span className="text-xs text-slate-500 font-bold">日期與時間</span>
                                    <div className="font-medium text-slate-700">{selectedLesson.date} {selectedLesson.startTime} ({selectedLesson.durationMinutes}m)</div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs text-slate-500 font-bold">授課教師</span>
                                    <div className="font-medium text-slate-700">{teachers.find(t => t.id === selectedLesson.teacherId)?.name || '未定'}</div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs text-slate-500 font-bold">科目 / 類型</span>
                                    <div className="font-medium text-slate-700">{selectedLesson.subject} / {getClassTypeName(selectedLesson.type)}</div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs text-slate-500 font-bold">教室</span>
                                    <div className="font-medium text-slate-700">
                                        {systemConfig.classrooms?.find(c => c.id === selectedLesson.classroomId)?.name || '未指定教室'}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1 pt-2">
                                <span className="text-xs text-slate-500 font-bold">使用教具</span>
                                <div className="flex flex-wrap gap-2">
                                    {selectedLesson.teachingAidIds && selectedLesson.teachingAidIds.length > 0 ? (
                                        selectedLesson.teachingAidIds.map(aidId => {
                                            const aidName = systemConfig.teachingAids?.find(a => a.id === aidId)?.name || '未知教具';
                                            return <span key={aidId} className="bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-100 px-2 py-1 rounded text-xs font-medium">{aidName}</span>;
                                        })
                                    ) : (
                                        <span className="text-sm text-slate-400">無使用教具</span>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-1 pt-2">
                                <span className="text-xs text-slate-500 font-bold">上課學生 ({selectedLesson.studentIds.length})</span>
                                <div className="flex flex-wrap gap-2">
                                    {selectedLesson.studentIds.length > 0 ? selectedLesson.studentIds.map(sid => {
                                        const s = students.find(xs => xs.id === sid);
                                        return s ? <span key={sid} className="bg-blue-50 text-blue-700 border border-blue-100 px-2 py-1 rounded text-xs font-medium">{s.name}</span> : null;
                                    }) : <span className="text-sm text-slate-400">無學生</span>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
