

import React, { useState, useMemo } from 'react';
import { Student, Lesson, Teacher, AppUser, SystemConfig } from '../types';
import { Search, Phone, Calendar, Edit2, X, User, GraduationCap, StickyNote, ArrowUpDown, ArrowUp, ArrowDown, Plus, Trash2, AlertTriangle, BookOpen, Clock, CalendarDays, ChevronDown, ChevronUp, UserCheck } from 'lucide-react';
import { CalendarView } from './CalendarView';

interface StudentListProps {
    students: Student[];
    lessons: Lesson[];
    teachers: Teacher[];
    onUpdateStudent: (student: Student) => void;
    onAddStudent: (student: Student) => void;
    onDeleteStudent: (id: string) => void;
    readOnly?: boolean;
    currentUser?: AppUser | null;
    subjects?: string[]; // New Prop
    systemConfig?: SystemConfig;
}

type SortKey = keyof Student;
type SortDirection = 'asc' | 'desc';

export const StudentList: React.FC<StudentListProps> = ({ students, lessons, teachers, onUpdateStudent, onAddStudent, onDeleteStudent, readOnly = false, currentUser, subjects = [], systemConfig }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [isAddMode, setIsAddMode] = useState(false);
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection } | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<{ id: string, name: string } | null>(null);
    const [formError, setFormError] = useState('');
    
    // Expandable Row State
    const [expandedRow, setExpandedRow] = useState<{ studentId: string, type: 'progress' | 'calendar' } | null>(null);
    // History Search State
    const [historySearchTerm, setHistorySearchTerm] = useState('');
    
    const filteredStudents = useMemo(() => {
        let result = students.filter(s => 
            s.name.includes(searchTerm) || 
            s.phone.includes(searchTerm) ||
            s.parentName.includes(searchTerm)
        );

        if (sortConfig) {
            result.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return result;
    }, [students, searchTerm, sortConfig]);

    // Completed Lessons with Progress (Used in Expanded Progress View)
    const getCompletedLessons = (studentId: string) => {
        let history = lessons
            .filter(l => l.studentIds.includes(studentId) && l.isCompleted)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        if (historySearchTerm.trim()) {
            const term = historySearchTerm.toLowerCase();
            history = history.filter(l => {
                const teacher = teachers.find(t => t.id === l.teacherId);
                return (
                    l.date.includes(term) ||
                    l.title.toLowerCase().includes(term) ||
                    l.subject.toLowerCase().includes(term) ||
                    (teacher?.name || '').toLowerCase().includes(term) ||
                    (l.lessonPlan || '').toLowerCase().includes(term) ||
                    (l.studentNotes?.[studentId] || '').toLowerCase().includes(term)
                );
            });
        }
        return history;
    };

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

    const toggleExpand = (studentId: string, type: 'progress' | 'calendar') => {
        if (expandedRow && expandedRow.studentId === studentId && expandedRow.type === type) {
            setExpandedRow(null); // Collapse if clicking same
        } else {
            setExpandedRow({ studentId, type });
            setHistorySearchTerm(''); // Reset search on expand
        }
    };

    const openAddModal = () => {
        setEditingStudent({
            id: '',
            name: '',
            grade: '',
            phone: '',
            parentName: '',
            notes: '',
            joinedDate: new Date().toISOString().split('T')[0]
        });
        setIsAddMode(true);
        setFormError('');
    };

    const handleDeleteClick = (id: string, name: string) => {
        setDeleteTarget({ id, name });
    };

    const confirmDelete = () => {
        if (deleteTarget) {
            onDeleteStudent(deleteTarget.id);
            setDeleteTarget(null);
        }
    };

    const handleSave = () => {
        setFormError('');
        if (!editingStudent) return;
        
        if (!editingStudent.name) {
            setFormError("請輸入學生姓名");
            return;
        }

        if (isAddMode) {
            onAddStudent({
                ...editingStudent,
                id: `s-${Date.now()}`
            });
        } else {
            onUpdateStudent(editingStudent);
        }
        setEditingStudent(null);
        setIsAddMode(false);
    };

    // Dummy no-op for CalendarView inside read-only context
    const noOp = () => {};

    return (
        <div className="space-y-6 relative">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-800">學生管理</h2>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-none">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input 
                            type="text" 
                            placeholder="搜尋學生姓名或電話..." 
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
                            新增學生
                        </button>
                    )}
                </div>
            </div>

            {/* Updated Table Container */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th onClick={() => requestSort('name')} className="px-4 py-3 md:px-6 md:py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none">
                                <div className="flex items-center">學生姓名 <SortIcon column="name"/></div>
                            </th>
                            <th onClick={() => requestSort('grade')} className="hidden md:table-cell px-4 py-3 md:px-6 md:py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none">
                                <div className="flex items-center">學習階段 <SortIcon column="grade"/></div>
                            </th>
                            <th onClick={() => requestSort('phone')} className="px-4 py-3 md:px-6 md:py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none">
                                <div className="flex items-center">聯絡方式 <SortIcon column="phone"/></div>
                            </th>
                            <th onClick={() => requestSort('parentName')} className="hidden lg:table-cell px-4 py-3 md:px-6 md:py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none">
                                <div className="flex items-center">家長 <SortIcon column="parentName"/></div>
                            </th>
                             <th className="hidden sm:table-cell px-4 py-3 md:px-6 md:py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                上課紀錄
                            </th>
                             <th className="hidden sm:table-cell px-4 py-3 md:px-6 md:py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                課程行事曆
                            </th>
                            <th className="px-4 py-3 md:px-6 md:py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredStudents.map((student) => (
                            <React.Fragment key={student.id}>
                                <tr className={`hover:bg-gray-50 transition-colors group ${expandedRow?.studentId === student.id ? 'bg-blue-50/50' : ''}`}>
                                    <td className="px-4 py-3 md:px-6 md:py-4">
                                        <div className="font-medium text-gray-900 whitespace-nowrap">{student.name}</div>
                                        {/* Mobile View Extra Info */}
                                        <div className="md:hidden text-[10px] text-gray-500 mt-0.5">{student.grade}</div>
                                    </td>
                                    <td className="hidden md:table-cell px-4 py-3 md:px-6 md:py-4 text-sm text-gray-600">
                                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs font-medium">{student.grade}</span>
                                    </td>
                                    <td className="px-4 py-3 md:px-6 md:py-4">
                                        <div className="flex items-center text-sm text-gray-600">
                                            <Phone className="w-3 h-3 mr-1 md:mr-2 flex-shrink-0" />
                                            <span className="truncate">{student.phone}</span>
                                        </div>
                                    </td>
                                    <td className="hidden lg:table-cell px-4 py-3 md:px-6 md:py-4 text-sm text-gray-600">{student.parentName}</td>
                                    
                                    {/* Desktop Actions */}
                                    <td className="hidden sm:table-cell px-4 py-3 md:px-6 md:py-4">
                                        <button 
                                            onClick={() => toggleExpand(student.id, 'progress')}
                                            className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center border whitespace-nowrap ${
                                                expandedRow?.studentId === student.id && expandedRow.type === 'progress' 
                                                ? 'bg-blue-100 text-blue-800 border-blue-200' 
                                                : 'bg-white text-blue-600 border-blue-100 hover:bg-blue-50'
                                            }`}
                                        >
                                            <BookOpen className="w-3.5 h-3.5 mr-1" />
                                            {expandedRow?.studentId === student.id && expandedRow.type === 'progress' ? '收起' : '紀錄'}
                                        </button>
                                    </td>
                                    <td className="hidden sm:table-cell px-4 py-3 md:px-6 md:py-4">
                                        <button 
                                            onClick={() => toggleExpand(student.id, 'calendar')}
                                            className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center border whitespace-nowrap ${
                                                expandedRow?.studentId === student.id && expandedRow.type === 'calendar'
                                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                                                : 'bg-white text-emerald-600 border-emerald-100 hover:bg-emerald-50'
                                            }`}
                                        >
                                            <CalendarDays className="w-3.5 h-3.5 mr-1" />
                                            {expandedRow?.studentId === student.id && expandedRow.type === 'calendar' ? '收起' : '行事曆'}
                                        </button>
                                    </td>

                                    <td className="px-4 py-3 md:px-6 md:py-4 text-right">
                                        <div className="flex items-center justify-end space-x-1 md:space-x-2">
                                            {/* Mobile Expand Buttons */}
                                            <div className="flex sm:hidden space-x-1 mr-2">
                                                <button 
                                                    onClick={() => toggleExpand(student.id, 'progress')}
                                                    className={`p-1.5 rounded border ${expandedRow?.studentId === student.id && expandedRow.type === 'progress' ? 'bg-blue-100 border-blue-200 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}
                                                >
                                                    <BookOpen className="w-3.5 h-3.5" />
                                                </button>
                                                <button 
                                                    onClick={() => toggleExpand(student.id, 'calendar')}
                                                    className={`p-1.5 rounded border ${expandedRow?.studentId === student.id && expandedRow.type === 'calendar' ? 'bg-emerald-100 border-emerald-200 text-emerald-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}
                                                >
                                                    <CalendarDays className="w-3.5 h-3.5" />
                                                </button>
                                            </div>

                                            <button 
                                                onClick={() => {
                                                    setEditingStudent({...student});
                                                    setIsAddMode(false);
                                                    setFormError('');
                                                }}
                                                className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                                                title="編輯/詳情"
                                            >
                                                {readOnly ? <BookOpen className="w-4 h-4"/> : <Edit2 className="w-4 h-4" />}
                                            </button>
                                            {!readOnly && (
                                                <button 
                                                    onClick={() => handleDeleteClick(student.id, student.name)}
                                                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                                    title="刪除"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                                
                                {/* Expanded Row Content */}
                                {expandedRow?.studentId === student.id && (
                                    <tr>
                                        <td colSpan={8} className="p-0 border-b border-gray-200 bg-slate-100 shadow-inner border-l-4 border-blue-500">
                                            <div className="p-4 animate-in slide-in-from-top-2 duration-200">
                                                {expandedRow.type === 'progress' && (
                                                    <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar p-2">
                                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-2">
                                                            <h4 className="text-sm font-bold text-slate-700 flex items-center">
                                                                <BookOpen className="w-4 h-4 mr-2 text-blue-500" />
                                                                {student.name} 的上課紀錄
                                                            </h4>
                                                            
                                                            {/* History Search Input */}
                                                            <div className="relative w-full sm:w-64">
                                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                                                                <input 
                                                                    type="text" 
                                                                    placeholder="搜尋日期、課堂、教師或內容..." 
                                                                    value={historySearchTerm}
                                                                    onChange={(e) => setHistorySearchTerm(e.target.value)}
                                                                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                />
                                                            </div>
                                                        </div>

                                                        {getCompletedLessons(student.id).length > 0 ? (
                                                            getCompletedLessons(student.id).map(lesson => {
                                                                const studentNote = lesson.studentNotes?.[student.id];
                                                                const hasStudentNote = studentNote && studentNote.trim().length > 0;
                                                                const syllabus = lesson.lessonPlan;
                                                                const hasSyllabus = syllabus && syllabus.trim().length > 0;
                                                                const teacher = teachers.find(t => t.id === lesson.teacherId);
                                                                
                                                                // Use subject as title or strip student name from title for cleaner history view
                                                                const displayTitle = lesson.title.replace(student.name, '').trim() || lesson.subject;

                                                                return (
                                                                    <div key={lesson.id} className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                                                        <div className="flex justify-between items-start mb-3 border-b border-gray-100 pb-2">
                                                                            <div>
                                                                                <div className="flex items-center gap-2">
                                                                                    <div className="font-bold text-gray-800 text-base">{displayTitle}</div>
                                                                                    <span className="text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 flex items-center">
                                                                                        <User className="w-3 h-3 mr-1" />
                                                                                        {teacher?.name || '未知教師'}
                                                                                    </span>
                                                                                </div>
                                                                                <div className="text-xs text-gray-500 flex items-center mt-1">
                                                                                    <Calendar className="w-3 h-3 mr-1" /> {lesson.date} 
                                                                                    <Clock className="w-3 h-3 ml-2 mr-1" /> {lesson.startTime}
                                                                                </div>
                                                                            </div>
                                                                            <span className="px-2 py-1 bg-gray-50 border border-gray-100 text-gray-600 rounded text-xs font-medium">{lesson.subject}</span>
                                                                        </div>
                                                                        
                                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                            {/* Left: Syllabus (Class Progress) */}
                                                                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                                                <div className="text-xs font-bold text-slate-500 mb-2 flex items-center justify-between border-b border-slate-200 pb-1">
                                                                                    <span>課堂進度</span>
                                                                                    <span className={`text-[10px] px-1.5 rounded ${hasSyllabus ? 'text-green-600 bg-green-100' : 'text-amber-600 bg-amber-100'}`}>
                                                                                        {hasSyllabus ? '課堂進度已填寫' : '課堂進度未填寫'}
                                                                                    </span>
                                                                                </div>
                                                                                <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap break-words">
                                                                                    {syllabus || <span className="text-slate-400 italic">無內容</span>}
                                                                                </div>
                                                                            </div>

                                                                            {/* Right: Individual Note (Student Progress) */}
                                                                            <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                                                                                <div className="text-xs font-bold text-slate-500 mb-2 flex items-center justify-between border-b border-blue-200 pb-1">
                                                                                    <span>上課進度</span>
                                                                                    <span className={`text-[10px] px-1.5 rounded ${hasStudentNote ? 'text-green-600 bg-green-100' : 'text-amber-600 bg-amber-100'}`}>
                                                                                        {hasStudentNote ? '上課進度已填寫' : '上課進度未填寫'}
                                                                                    </span>
                                                                                </div>
                                                                                <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap break-words">
                                                                                    {studentNote || <span className="text-slate-400 italic">無內容</span>}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })
                                                        ) : (
                                                            <div className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-white">
                                                                <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                                                {historySearchTerm ? '找不到相符的紀錄' : '尚無已完成的上課紀錄'}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {expandedRow.type === 'calendar' && (
                                                     <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-[500px] flex flex-col">
                                                        <div className="px-4 py-2 bg-emerald-50 border-b border-emerald-100 flex justify-between items-center">
                                                            <h4 className="text-sm font-bold text-emerald-800 flex items-center">
                                                                <CalendarDays className="w-4 h-4 mr-2" />
                                                                {student.name} 的專屬課程行事曆
                                                            </h4>
                                                        </div>
                                                        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                                                            <CalendarView 
                                                                lessons={lessons.filter(l => l.studentIds.includes(student.id))}
                                                                teachers={teachers}
                                                                students={students}
                                                                onAddLesson={noOp}
                                                                onUpdateLesson={noOp}
                                                                onDeleteLesson={noOp}
                                                                readOnly={true}
                                                                strictReadOnly={true}
                                                                currentUser={currentUser}
                                                                subjects={subjects}
                                                                systemConfig={systemConfig}
                                                            />
                                                        </div>
                                                     </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Edit/Add Student Modal (Existing) */}
            {editingStudent && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-800">
                                {isAddMode ? '新增學生' : (readOnly ? '學生資料詳情' : '編輯學生資料')}
                            </h3>
                            <button onClick={() => setEditingStudent(null)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">學生姓名</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                                    <input 
                                        type="text" 
                                        className="w-full h-10 pl-9 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50"
                                        value={editingStudent.name}
                                        onChange={e => setEditingStudent({...editingStudent, name: e.target.value})}
                                        placeholder="輸入姓名"
                                        disabled={readOnly}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">學習階段</label>
                                    <div className="relative">
                                        <GraduationCap className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                                        <input 
                                            type="text" 
                                            className="w-full h-10 pl-9 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50"
                                            value={editingStudent.grade}
                                            onChange={e => setEditingStudent({...editingStudent, grade: e.target.value})}
                                            placeholder="例如：小三"
                                            disabled={readOnly}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">入學日期</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                                        <input 
                                            type="date" 
                                            className="w-full h-10 pl-9 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50"
                                            value={editingStudent.joinedDate}
                                            onChange={e => setEditingStudent({...editingStudent, joinedDate: e.target.value})}
                                            disabled={readOnly}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">家長姓名</label>
                                    <input 
                                        type="text" 
                                        className="w-full h-10 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50"
                                        value={editingStudent.parentName}
                                        onChange={e => setEditingStudent({...editingStudent, parentName: e.target.value})}
                                        placeholder="聯絡人"
                                        disabled={readOnly}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">聯絡電話</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                                        <input 
                                            type="tel" 
                                            className="w-full h-10 pl-9 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50"
                                            value={editingStudent.phone}
                                            onChange={e => setEditingStudent({...editingStudent, phone: e.target.value})}
                                            placeholder="0912-345-678"
                                            disabled={readOnly}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">備註事項</label>
                                <div className="relative">
                                    <StickyNote className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                                    <textarea 
                                        className="w-full p-3 pl-9 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none disabled:bg-gray-50"
                                        value={editingStudent.notes}
                                        onChange={e => setEditingStudent({...editingStudent, notes: e.target.value})}
                                        placeholder="學生狀況備註..."
                                        disabled={readOnly}
                                    />
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
                                onClick={() => setEditingStudent(null)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                {readOnly ? '關閉' : '取消'}
                            </button>
                            {!readOnly && (
                                <button 
                                    onClick={handleSave}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition-colors"
                                >
                                    {isAddMode ? '新增' : '儲存'}
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
                        <h4 className="text-xl font-bold text-slate-800 text-center mb-2">確定移除此學生？</h4>
                        <p className="text-slate-500 text-center mb-6 text-sm">
                            您即將移除「<span className="font-bold text-slate-700">{deleteTarget.name}</span>」的資料，此動作無法復原。
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
