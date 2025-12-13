import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Lesson, Teacher, Student, ClassType, AppUser, Availability, CalendarNote, getClassTypeName, SystemConfig } from '../types';
import { ChevronLeft, ChevronRight, Plus, Clock, User, Users, Music, Trash2, CheckCircle, XCircle, Search, X, Calendar as CalendarIcon, ChevronDown, ChevronUp, AlertTriangle, Filter, DollarSign, Lock, CalendarDays, Clock as ClockIcon, Edit2, Check, Repeat, ArrowRight, ArrowDownCircle, BookOpen, CalendarCheck, UserCheck, Info, FileText, Download, GraduationCap, Radio, StickyNote, Save } from 'lucide-react';

// --- Helper Functions ---
const formatTimeWithPeriod = (time: string) => {
    if (!time) return '';
    const [hourStr, minuteStr] = time.split(':');
    const hour = parseInt(hourStr, 10);
    const period = hour < 12 ? '上午' : '下午';
    const displayHour = hour % 12 || 12; 
    const displayHourStr = String(displayHour).padStart(2, '0');
    return `${period} ${displayHourStr}:${minuteStr}`;
};

const formatDateLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

interface CalendarViewProps {
    lessons: Lesson[];
    teachers: Teacher[];
    students: Student[];
    availabilities?: Availability[]; 
    calendarNotes?: CalendarNote[];
    onAddLesson: (lesson: Lesson) => void;
    onUpdateLesson: (lesson: Lesson) => void;
    onDeleteLesson: (id: string) => void;
    onUpdateAvailability?: (availability: Availability) => void;
    onAddAvailability?: (availability: Availability) => void; 
    onSaveCalendarNote?: (note: CalendarNote) => void;
    readOnly?: boolean;
    strictReadOnly?: boolean; // Used for Student Calendar View to force pure read-only
    currentUser?: AppUser | null;
    subjects?: string[]; // New Prop
    systemConfig?: SystemConfig;
}

// --- Sub-component for Searchable Preview Item ---
interface PreviewLessonItemProps {
    lesson: Partial<Lesson>;
    index: number;
    teachers: Teacher[];
    students: Student[];
    availabilities?: Availability[];
    canViewFinancials: boolean;
    isTeacherAvailable: (teacherId: string, date: string, startTime: string, duration: number) => boolean;
    onTeacherChange: (index: number, teacherId: string) => void;
}

const PreviewLessonItem: React.FC<PreviewLessonItemProps> = ({ lesson, index, teachers, students, availabilities = [], canViewFinancials, isTeacherAvailable, onTeacherChange }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const selectedTeacher = teachers.find(t => t.id === lesson.teacherId);

    useEffect(() => {
        if (selectedTeacher) {
            setSearchTerm(selectedTeacher.name);
        } else {
            setSearchTerm('');
        }
    }, [lesson.teacherId, teachers]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
                if (selectedTeacher) setSearchTerm(selectedTeacher.name);
                else setSearchTerm('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [selectedTeacher]);

    const sortedTeachers = useMemo(() => {
        const filtered = teachers.filter(t => 
            t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.phone.includes(searchTerm)
        );
        return filtered.sort((a, b) => {
            const aAvail = isTeacherAvailable(a.id, lesson.date || '', lesson.startTime || '00:00', lesson.durationMinutes || 60);
            const bAvail = isTeacherAvailable(b.id, lesson.date || '', lesson.startTime || '00:00', lesson.durationMinutes || 60);
            if (aAvail && !bAvail) return -1;
            if (!aAvail && bAvail) return 1;
            return 0;
        });
    }, [teachers, searchTerm, lesson.date, lesson.startTime, lesson.durationMinutes, isTeacherAvailable]);

    return (
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2 transition-all hover:shadow-md hover:border-blue-200">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                    <div className="bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded text-[10px] flex items-center">
                        <CalendarIcon className="w-3 h-3 mr-1" />
                        {lesson.date}
                    </div>
                    <div className="text-slate-700 font-bold flex items-center text-xs">
                        <Clock className="w-3 h-3 mr-1 text-slate-400" />
                        {lesson.startTime}
                    </div>
                </div>
                <div className="text-[10px] text-slate-400 font-medium">{lesson.durationMinutes} min</div>
            </div>
            
            <div className="flex flex-wrap gap-1 min-h-[20px]">
                {lesson.studentIds?.length ? lesson.studentIds.map(sid => {
                    const sName = students.find(s => s.id === sid)?.name;
                    return sName ? <span key={sid} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full border border-slate-100">{sName}</span> : null;
                }) : <span className="text-[10px] text-slate-300 italic flex items-center"><AlertTriangle className="w-3 h-3 mr-1"/>未指派學生</span>}
            </div>

            <div className="flex justify-between items-center text-sm mt-1 pt-2 border-t border-slate-50">
                <div className="flex items-center text-slate-600 flex-1 mr-4 relative" ref={dropdownRef}>
                    <User className={`w-3.5 h-3.5 mr-2 flex-shrink-0 ${selectedTeacher ? 'text-blue-500' : 'text-slate-300'}`} />
                    <div className="relative flex-1 group">
                        <input
                            type="text"
                            className="w-full bg-transparent border-b border-transparent group-hover:border-slate-200 focus:border-blue-400 text-xs font-medium text-slate-700 placeholder:text-slate-400 outline-none transition-all py-0.5"
                            placeholder="選擇授課教師..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setShowDropdown(true);
                            }}
                            onFocus={() => setShowDropdown(true)}
                        />
                        {selectedTeacher && (
                            <span className="absolute right-0 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono bg-slate-50 px-1 rounded">
                                {selectedTeacher.commissionRate}%
                            </span>
                        )}
                    </div>
                    {showDropdown && (
                        <div className="absolute left-0 top-full mt-1 w-[220px] bg-white rounded-lg shadow-xl border border-slate-100 max-h-56 overflow-y-auto z-50 custom-scrollbar">
                             {sortedTeachers.length > 0 ? (
                                sortedTeachers.map(t => {
                                    const avail = (availabilities || []).find(a => a.date === lesson.date && a.teacherId === t.id);
                                    let relevantSlots = avail?.timeSlots || [];
                                    if (lesson.startTime) {
                                        const startMins = parseInt(lesson.startTime.split(':')[0]) * 60 + parseInt(lesson.startTime.split(':')[1]);
                                        relevantSlots = relevantSlots.filter(s => {
                                            const sStart = parseInt(s.start.split(':')[0]) * 60 + parseInt(s.start.split(':')[1]);
                                            const sEnd = parseInt(s.end.split(':')[0]) * 60 + parseInt(s.end.split(':')[1]);
                                            return startMins >= sStart && startMins < sEnd;
                                        });
                                    }

                                    return (
                                        <div 
                                            key={t.id} 
                                            className="px-3 py-2.5 hover:bg-blue-50 cursor-pointer text-xs border-b border-slate-50 last:border-0 group transition-colors"
                                            onClick={() => {
                                                onTeacherChange(index, t.id);
                                                setSearchTerm(t.name);
                                                setShowDropdown(false);
                                            }}
                                        >
                                            <div className="flex justify-between items-center mb-1">
                                                <div className="flex flex-col">
                                                    <span className={`font-medium ${relevantSlots.length > 0 ? 'text-emerald-700' : 'text-slate-700'}`}>{t.name}</span>
                                                    <span className="text-[10px] text-slate-400">抽成: {t.commissionRate}%</span>
                                                </div>
                                                {relevantSlots.length > 0 && <span className="text-[9px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-full font-bold">有空檔</span>}
                                            </div>
                                            {relevantSlots.length > 0 && (
                                                <div className="flex flex-wrap gap-1">
                                                    {relevantSlots.map((slot, i) => (
                                                        <span key={i} className="text-[9px] text-emerald-600 bg-emerald-50 px-1 rounded border border-emerald-100">
                                                            {formatTimeWithPeriod(slot.start)}-{formatTimeWithPeriod(slot.end)}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                             ) : (
                                 <div className="px-3 py-4 text-xs text-slate-400 text-center">無符合教師</div>
                             )}
                        </div>
                    )}
                </div>
                {canViewFinancials && (
                    <div className="text-right flex-shrink-0 flex flex-col items-end">
                        <div className="text-slate-800 font-bold text-xs flex items-center"><DollarSign className="w-3 h-3 text-slate-400 mr-0.5"/>{lesson.price?.toLocaleString()}</div>
                        <div className="text-[10px] text-blue-600 font-medium bg-blue-50 px-1.5 rounded flex items-center">
                            薪: ${lesson.cost?.toLocaleString()}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

interface BatchTeacherSelectorProps {
    teachers: Teacher[];
    onApply: (teacherId: string) => void;
}

const BatchTeacherSelector: React.FC<BatchTeacherSelectorProps> = ({ teachers, onApply }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedId, setSelectedId] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredTeachers = teachers.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="flex items-center space-x-2 relative" ref={dropdownRef}>
            <div className="relative w-48">
                <input
                    type="text"
                    className="w-full bg-white border border-slate-200 text-xs py-2 pl-3 pr-8 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm placeholder:text-slate-400"
                    placeholder="批量搜尋教師..."
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setShowDropdown(true);
                        setSelectedId('');
                    }}
                    onFocus={() => setShowDropdown(true)}
                />
                <ChevronDown className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>

                {showDropdown && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-slate-100 max-h-60 overflow-y-auto z-50 custom-scrollbar animate-in fade-in zoom-in-95 duration-100">
                        {filteredTeachers.length > 0 ? (
                            filteredTeachers.map(t => (
                                <div 
                                    key={t.id}
                                    className={`px-3 py-2 hover:bg-indigo-50 cursor-pointer text-xs border-b border-slate-50 last:border-0 flex justify-between items-center ${selectedId === t.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700'}`}
                                    onClick={() => {
                                        setSelectedId(t.id);
                                        setSearchTerm(t.name);
                                        setShowDropdown(false);
                                    }}
                                >
                                    <span className="font-medium">{t.name}</span>
                                    <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{t.commissionRate}%</span>
                                </div>
                            ))
                        ) : (
                            <div className="px-3 py-3 text-xs text-slate-400 text-center">無符合結果</div>
                        )}
                    </div>
                )}
            </div>
            <button 
                onClick={() => {
                    if(selectedId) {
                        onApply(selectedId);
                        setSearchTerm('');
                        setSelectedId('');
                    }
                }}
                disabled={!selectedId}
                className="p-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                title="套用至所有課程"
            >
                <ArrowDownCircle className="w-4 h-4" />
            </button>
        </div>
    );
};

export const CalendarView: React.FC<CalendarViewProps> = ({ 
    lessons, teachers, students, availabilities = [], calendarNotes = [],
    onAddLesson, onUpdateLesson, onDeleteLesson, onUpdateAvailability, onAddAvailability, onSaveCalendarNote,
    readOnly = false, strictReadOnly = false, currentUser, subjects = [], systemConfig
}) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
    const [calendarMode, setCalendarMode] = useState<'schedule' | 'availability' | 'booking' | 'text_note'>('schedule');

    // Use systemConfig subjects if subjects prop is empty
    const effectiveSubjects = subjects.length > 0 ? subjects : (systemConfig?.subjects || []);

    // Added state for "Show Only My Lessons"
    const [showOnlyMyLessons, setShowOnlyMyLessons] = useState(false);

    const [bookingSlot, setBookingSlot] = useState<{ start: string, end: string } | null>(null);

    const [showModal, setShowModal] = useState(false);
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);
    const [editingLessonId, setEditingLessonId] = useState<string | null>(null);

    // Report Feature State
    const [showReportMenu, setShowReportMenu] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportType, setReportType] = useState<'day' | 'week' | 'month'>('day');
    const [reportLessons, setReportLessons] = useState<Lesson[]>([]);
    const [selectedReportLesson, setSelectedReportLesson] = useState<Lesson | null>(null);
    const reportMenuRef = useRef<HTMLDivElement>(null);

    // --- Recurring Lesson State ---
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurringStartDate, setRecurringStartDate] = useState(''); 
    const [recurringMonths, setRecurringMonths] = useState<number>(1);
    const [previewLessons, setPreviewLessons] = useState<Partial<Lesson>[]>([]);

    // Availability Modal State
    const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
    const [editingAvailability, setEditingAvailability] = useState<Availability | null>(null);
    const [tempTimeSlots, setTempTimeSlots] = useState<{start: string, end: string}[]>([]);
    const [newSlotStart, setNewSlotStart] = useState('');
    const [newSlotEnd, setNewSlotEnd] = useState('');
    const [editingSlotIndex, setEditingSlotIndex] = useState<number | null>(null);
    const [isNewAvailability, setIsNewAvailability] = useState(false);
    const [slotError, setSlotError] = useState('');
    // New state for expanding a specific teacher's availability list in day view
    const [expandedAvailKey, setExpandedAvailKey] = useState<string | null>(null);

    // Text Note Modal State
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [currentNoteDate, setCurrentNoteDate] = useState('');
    const [currentNoteContent, setCurrentNoteContent] = useState('');
    const [editingNoteId, setEditingNoteId] = useState('');

    // Filters & Search
    const [selectedTeacherFilter, setSelectedTeacherFilter] = useState<string>('');
    const [teacherFilterSearchTerm, setTeacherFilterSearchTerm] = useState('');
    const [showTeacherFilterDropdown, setShowTeacherFilterDropdown] = useState(false);
    const teacherFilterRef = useRef<HTMLDivElement>(null);

    const [studentSearchTerm, setStudentSearchTerm] = useState('');
    const [showStudentDropdown, setShowStudentDropdown] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    const [teacherSearchTerm, setTeacherSearchTerm] = useState('');
    const [showTeacherDropdown, setShowTeacherDropdown] = useState(false);
    const teacherSearchRef = useRef<HTMLDivElement>(null);

    const [formMessage, setFormMessage] = useState<{type: 'error' | 'warning' | 'success', text: string} | null>(null);
    const [pendingConflict, setPendingConflict] = useState(false);
    
    const [toastMessage, setToastMessage] = useState<{type: 'info' | 'error' | 'success', text: string} | null>(null);

    // For In Progress Check
    const [currentTime, setCurrentTime] = useState(new Date());

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

    useEffect(() => {
        if (toastMessage) {
            const timer = setTimeout(() => setToastMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toastMessage]);

    const initialFormState: Partial<Lesson> = {
        type: ClassType.PRIVATE,
        durationMinutes: 60,
        studentIds: [],
        subject: effectiveSubjects[0] || '鋼琴 (Piano)', // Default fallback
        date: formatDateLocal(new Date()), 
        startTime: '10:00',
        price: undefined, // Default empty
        cost: undefined, // Default empty
        lessonPlan: '',
        studentNotes: {}
    };

    const [formLesson, setFormLesson] = useState<Partial<Lesson>>(initialFormState);

    // ... (Rest of the logic)
    useEffect(() => {
        setFormMessage(null);
        setPendingConflict(false);
    }, [formLesson.date, formLesson.startTime, formLesson.teacherId, formLesson.durationMinutes]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) setShowStudentDropdown(false);
            if (teacherSearchRef.current && !teacherSearchRef.current.contains(event.target as Node)) setShowTeacherDropdown(false);
            if (teacherFilterRef.current && !teacherFilterRef.current.contains(event.target as Node)) setShowTeacherFilterDropdown(false);
            if (reportMenuRef.current && !reportMenuRef.current.contains(event.target as Node)) setShowReportMenu(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const isTeacherAvailable = (teacherId: string, date: string, startTime: string, duration: number) => {
        const avail = (availabilities || []).find(a => a.date === date && a.teacherId === teacherId);
        if (!avail || !avail.timeSlots.length) return false;
        const lessonStart = parseInt(startTime.replace(':', ''));
        const startObj = new Date(`2000-01-01T${startTime}`);
        const endObj = new Date(startObj.getTime() + duration * 60000);
        const lessonEndStr = `${String(endObj.getHours()).padStart(2, '0')}:${String(endObj.getMinutes()).padStart(2, '0')}`;
        const lessonEnd = parseInt(lessonEndStr.replace(':', ''));
        return avail.timeSlots.some(slot => {
            const slotStart = parseInt(slot.start.replace(':', ''));
            const slotEnd = parseInt(slot.end.replace(':', ''));
            return lessonStart >= slotStart && lessonEnd <= slotEnd;
        });
    };

    const sortedTeachers = useMemo(() => {
        let filtered = teachers.filter(t => 
            t.name.toLowerCase().includes(teacherSearchTerm.toLowerCase()) ||
            t.phone.includes(teacherSearchTerm)
        );
        let referenceDate = formLesson.date || '';
        if (isRecurring && recurringStartDate) {
             referenceDate = recurringStartDate;
        }
        return filtered.sort((a, b) => {
            const aAvail = isTeacherAvailable(a.id, referenceDate, formLesson.startTime || '00:00', formLesson.durationMinutes || 60);
            const bAvail = isTeacherAvailable(b.id, referenceDate, formLesson.startTime || '00:00', formLesson.durationMinutes || 60);
            if (aAvail && !bAvail) return -1;
            if (!aAvail && bAvail) return 1;
            return 0;
        });
    }, [teachers, teacherSearchTerm, formLesson.date, formLesson.startTime, formLesson.durationMinutes, isRecurring, recurringStartDate, availabilities]);

    const filteredTeachersForModal = sortedTeachers;

    const getWeekDays = (baseDate: Date) => {
        const d = new Date(baseDate);
        const day = d.getDay();
        const diff = d.getDate() - day;
        const weekStart = new Date(d.setDate(diff));
        return Array.from({ length: 7 }, (_, i) => {
            const dayDate = new Date(weekStart);
            dayDate.setDate(dayDate.getDate() + i);
            return dayDate;
        });
    };

    const getMonthDays = (baseDate: Date) => {
        const year = baseDate.getFullYear();
        const month = baseDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const startDay = firstDayOfMonth.getDay(); 
        const startDate = new Date(firstDayOfMonth);
        startDate.setDate(startDate.getDate() - startDay);
        return Array.from({ length: 42 }, (_, i) => {
            const dayDate = new Date(startDate);
            dayDate.setDate(dayDate.getDate() + i);
            return dayDate;
        });
    };

    const displayDays = viewMode === 'week' ? getWeekDays(currentDate) : getMonthDays(currentDate);

    const handlePrev = () => {
        const newDate = new Date(currentDate);
        if (viewMode === 'week') newDate.setDate(newDate.getDate() - 7);
        else newDate.setMonth(newDate.getMonth() - 1);
        setCurrentDate(newDate);
    };
    const handleNext = () => {
        const newDate = new Date(currentDate);
        if (viewMode === 'week') newDate.setDate(newDate.getDate() + 7);
        else newDate.setMonth(newDate.getMonth() + 1);
        setCurrentDate(newDate);
    };
    const jumpToToday = () => { setCurrentDate(new Date()); setViewMode('week'); };
    const jumpToThisMonth = () => { setCurrentDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1)); setViewMode('month'); };

    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const years = Array.from({length: 11}, (_, i) => currentYear - 5 + i);
    const months = Array.from({length: 12}, (_, i) => i);

    const handleYearChange = (y: number) => { const newDate = new Date(currentDate); newDate.setFullYear(y); setCurrentDate(newDate); };
    const handleMonthChange = (m: number) => { const newDate = new Date(currentDate); newDate.setMonth(m); setCurrentDate(newDate); };

    const getLessonsForDay = (date: Date) => {
        const dateStr = formatDateLocal(date);
        return lessons.filter(l => {
            const dateMatch = l.date === dateStr;
            const teacherMatch = selectedTeacherFilter ? l.teacherId === selectedTeacherFilter : true;
            // Filter by "My Lessons" if enabled and user has a teacher ID
            const myLessonsMatch = showOnlyMyLessons && currentUser?.teacherId ? l.teacherId === currentUser.teacherId : true;
            return dateMatch && teacherMatch && myLessonsMatch;
        }).sort((a, b) => a.startTime.localeCompare(b.startTime));
    };

    const getAvailabilityForDay = (date: Date, teacherId: string) => {
        const dateStr = formatDateLocal(date);
        return (availabilities || []).find(a => a.date === dateStr && a.teacherId === teacherId);
    };

    // Helper for Text Note
    const getNoteForDay = (date: Date) => {
        const dateStr = formatDateLocal(date);
        // Filter by current user
        return calendarNotes?.find(n => n.date === dateStr && n.userId === currentUser?.id);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingLessonId(null);
        setBookingSlot(null);
        setFormMessage(null);
        setPendingConflict(false);
        setPreviewLessons([]);
        setIsRecurring(false);
    };

    // --- ID Generation Helper ---
    // Generate YYYYMMDDXXX format
    const generateLessonId = (dateStr: string, existingLessons: Lesson[], extraCount: number = 0) => {
        // dateStr is YYYY-MM-DD
        const datePart = dateStr.replace(/-/g, ''); // YYYYMMDD
        
        // Filter lessons specifically for this date
        const lessonsOnDay = existingLessons.filter(l => l.date === dateStr);
        
        let maxSeq = 0;
        const idPattern = new RegExp(`^${datePart}(\\d{3})$`);
        
        lessonsOnDay.forEach(l => {
            const match = l.id.match(idPattern);
            if (match) {
                const seq = parseInt(match[1], 10);
                if (seq > maxSeq) maxSeq = seq;
            }
        });
        
        // Add extraCount (for when generating IDs in a batch loop)
        const nextSeq = String(maxSeq + 1 + extraCount).padStart(3, '0');
        return `${datePart}${nextSeq}`;
    };

    // --- Report Generation Handler ---
    const handleGenerateReport = (type: 'day' | 'week' | 'month') => {
        setReportType(type);
        setShowReportMenu(false);

        let startDateStr = '';
        let endDateStr = '';
        const baseDate = currentDate; // Based on current view

        if (type === 'day') {
            startDateStr = formatDateLocal(new Date()); // Literal Today
            endDateStr = startDateStr;
        } else if (type === 'week') {
            const d = new Date(baseDate);
            const day = d.getDay(); // 0 is Sunday
            const diff = d.getDate() - day; // Adjust to Sunday
            const start = new Date(d.setDate(diff));
            const end = new Date(d.setDate(diff + 6));
            startDateStr = formatDateLocal(start);
            endDateStr = formatDateLocal(end);
        } else if (type === 'month') {
            const year = baseDate.getFullYear();
            const month = baseDate.getMonth();
            const start = new Date(year, month, 1);
            const end = new Date(year, month + 1, 0);
            startDateStr = formatDateLocal(start);
            endDateStr = formatDateLocal(end);
        }

        const filtered = lessons.filter(l => {
            // Apply current filters as well (Teacher Filter, My Lessons Filter)
            const teacherMatch = selectedTeacherFilter ? l.teacherId === selectedTeacherFilter : true;
            const myLessonsMatch = showOnlyMyLessons && currentUser?.teacherId ? l.teacherId === currentUser.teacherId : true;
            
            return l.date >= startDateStr && l.date <= endDateStr && teacherMatch && myLessonsMatch;
        }).sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));

        setReportLessons(filtered);
        setShowReportModal(true);
    };

    const handleExportReportCSV = () => {
        const header = ['日期', '時間', '課程標題', '科目', '教師', '學生', '狀態'];
        const rows = reportLessons.map(l => {
            const teacher = teachers.find(t => t.id === l.teacherId)?.name || 'Unknown';
            const studentNames = l.studentIds.map(sid => students.find(s => s.id === sid)?.name).join(', ');
            return [
                l.date,
                l.startTime,
                l.title,
                l.subject,
                teacher,
                studentNames,
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
        link.setAttribute('download', `課程報告_${reportType}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    const openAddModal = () => {
        handleCloseModal();
        let defaultTeacherId = selectedTeacherFilter;
        if (!defaultTeacherId && currentUser?.role !== 'admin' && currentUser?.teacherId) defaultTeacherId = currentUser.teacherId;
        if (!defaultTeacherId && currentUser?.teacherId) defaultTeacherId = currentUser.teacherId;

        const todayStr = formatDateLocal(currentDate);

        setFormLesson({
            ...initialFormState,
            date: todayStr,
            teacherId: defaultTeacherId || '',
            lessonPlan: '',
            studentNotes: {},
            subject: effectiveSubjects[0] || initialFormState.subject // Ensure subject is from props
        });
        setRecurringStartDate(todayStr); 

        const preSelectedTeacher = teachers.find(t => t.id === defaultTeacherId);
        setTeacherSearchTerm(preSelectedTeacher ? preSelectedTeacher.name : '');
        setStudentSearchTerm('');
        setShowModal(true);
        setShowDeleteAlert(false);
    };

    const handleBookSlot = (teacherId: string, date: string, time: string, slotEnd: string) => {
        const teacher = teachers.find(t => t.id === teacherId);
        if (!teacher) return;
        
        setEditingLessonId(null);
        setFormMessage(null);
        setPendingConflict(false);
        setPreviewLessons([]);
        setIsRecurring(false);
        setBookingSlot({ start: time, end: slotEnd });

        setFormLesson({
            ...initialFormState,
            date: date,
            startTime: time,
            teacherId: teacherId,
            price: undefined,
            cost: undefined,
            lessonPlan: '',
            studentNotes: {},
            subject: effectiveSubjects[0] || initialFormState.subject
        });
        
        setTeacherSearchTerm(teacher.name);
        setShowModal(true);
        setShowDeleteAlert(false);
    };

    const openEditModal = (lesson: Lesson, slotConstraint?: { start: string, end: string }) => {
        setEditingLessonId(lesson.id);
        setBookingSlot(slotConstraint || null); 
        setFormMessage(null);
        setPendingConflict(false);
        setFormLesson({ ...lesson });
        const teacher = teachers.find(t => t.id === lesson.teacherId);
        setTeacherSearchTerm(teacher ? teacher.name : '');
        setStudentSearchTerm('');
        setIsRecurring(false);
        setPreviewLessons([]);
        setShowModal(true);
        setShowDeleteAlert(false);
    };

    const handleAutoSchedule = () => {
        if (!formLesson.startTime || !recurringStartDate) {
            setFormMessage({type: 'error', text: "請選擇起始日期與開始時間"});
            return;
        }

        const generatedLessons: Partial<Lesson>[] = [];
        const startDate = new Date(recurringStartDate);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + recurringMonths);

        let iteratorDate = new Date(startDate);

        while (iteratorDate < endDate) {
            const dateStr = formatDateLocal(iteratorDate);
            generatedLessons.push({
                ...formLesson,
                date: dateStr,
                cost: 0,
                teacherId: '', // Start empty
                id: `temp-${dateStr}` 
            });
            iteratorDate.setDate(iteratorDate.getDate() + 7);
        }
        setPreviewLessons(generatedLessons);
        setFormMessage({type: 'success', text: "預覽已生成，請為課程指定教師"});
    };

    const handlePreviewTeacherChange = (index: number, teacherId: string) => {
        const newPreview = [...previewLessons];
        const lesson = newPreview[index];
        const teacher = teachers.find(t => t.id === teacherId);
        lesson.teacherId = teacherId;
        if (teacher && lesson.price !== undefined) {
            lesson.cost = Math.round(Number(lesson.price) * (teacher.commissionRate / 100));
        } else {
            lesson.cost = 0;
        }
        setPreviewLessons(newPreview);
    };

    const handleBatchTeacherApply = (teacherId: string) => {
        if (!teacherId) return;
        const newPreview = previewLessons.map(lesson => {
            const teacher = teachers.find(t => t.id === teacherId);
            let newCost = 0;
            if (teacher && lesson.price !== undefined) {
                newCost = Math.round(Number(lesson.price) * (teacher.commissionRate / 100));
            }
            return { ...lesson, teacherId: teacherId, cost: newCost };
        });
        setPreviewLessons(newPreview);
    };

    // --- Ownership & Permission Logic ---
    const isOwner = formLesson.teacherId && currentUser?.teacherId === formLesson.teacherId;
    
    // Logistics: Date, Time, Teacher, Price, Title, Students. (Restricted by global readOnly, except Admin/Owner if allowed by policy)
    // Here we strict to global readOnly for structural changes to prevent conflicts, unless admin.
    // If strictReadOnly is true, no one can edit (e.g. Student View).
    const canEditLogistics = !strictReadOnly && !readOnly && (
        currentUser?.role === 'admin' || 
        isOwner || 
        (!editingLessonId) 
    );

    // Progress: Notes, Plan, Completion. (Allowed for Owner even if readOnly, OR if you have logistics access)
    // This allows teachers to update their own lesson content even if they don't have full calendar edit rights.
    const canEditProgress = !strictReadOnly && (isOwner || canEditLogistics);
    
    // We retain this variable name for backward compat in the file but use the split logic above
    const canEditLesson = canEditLogistics; 

    useEffect(() => {
        if (!isRecurring && canEditLesson && formLesson.teacherId) {
            const teacher = teachers.find(t => t.id === formLesson.teacherId);
            if (teacher && teacher.commissionRate) {
                const calculatedCost = formLesson.price === undefined ? undefined : Math.round(Number(formLesson.price) * (teacher.commissionRate / 100));
                setFormLesson(prev => {
                    if (prev.cost !== calculatedCost) {
                        return { ...prev, cost: calculatedCost };
                    }
                    return prev;
                });
            }
        }
    }, [formLesson.teacherId, formLesson.price, teachers, isRecurring, canEditLesson]);

    const handleSave = () => {
        if (!canEditProgress) return;
        
        if (!formLesson.title || !formLesson.startTime || formLesson.price === undefined) {
            // If editing progress only (e.g. readOnly is true), we might have skipped validation of disabled fields in a real app,
            // but here formLesson state preserves original values so it should be fine.
            setFormMessage({type: 'error', text: "請填寫課程標題、時間與費用"});
            return;
        }

        if (bookingSlot && !isRecurring) {
            const getMinutes = (t: string) => {
                const [h, m] = t.split(':').map(Number);
                return h * 60 + m;
            };
            const formStartMins = getMinutes(formLesson.startTime!);
            const slotStartMins = getMinutes(bookingSlot.start);
            const slotEndMins = getMinutes(bookingSlot.end);
            if (formStartMins < slotStartMins || formStartMins > slotEndMins) {
                setFormMessage({type: 'error', text: `此課程受限於空檔時段 (${bookingSlot.start} - ${bookingSlot.end})。請調整時間。`});
                return;
            }
        }

        if (isRecurring) {
            if (previewLessons.length === 0) { setFormMessage({type: 'error', text: "請先執行自動排課產生預覽"}); return; }
            if (previewLessons.some(l => !l.teacherId)) { setFormMessage({type: 'error', text: "部分預覽課程尚未指定教師，請檢查"}); return; }
            
            // To handle IDs correctly in a batch, we need to track local increments per date
            const lessonsToAdd: Lesson[] = [];
            const dateCounters: Record<string, number> = {};

            previewLessons.forEach(lesson => {
                const date = lesson.date!;
                // Initialize counter for this date based on *currently existing* lessons
                if (dateCounters[date] === undefined) {
                    dateCounters[date] = 0;
                }
                
                // Generate ID: Use existing lessons + any we've already queued in this loop for this date
                const newId = generateLessonId(date, lessons, dateCounters[date]);
                
                // Increment counter for this date so next one in loop gets next ID
                dateCounters[date]++;

                const finalLesson = {
                    ...lesson,
                    id: newId,
                    teacherId: lesson.teacherId || '',
                    studentIds: lesson.studentIds || [],
                    cost: Number(lesson.cost || 0),
                    price: Number(lesson.price),
                    isCompleted: false,
                    lessonPlan: '',
                    studentNotes: {},
                    subject: lesson.subject || effectiveSubjects[0]
                } as Lesson;
                lessonsToAdd.push(finalLesson);
            });

            lessonsToAdd.forEach(l => onAddLesson(l));
            handleCloseModal();
        } else {
            if (!formLesson.date || !formLesson.teacherId) { setFormMessage({type: 'error', text: "請填寫日期與教師"}); return; }
            
            const newStart = new Date(`${formLesson.date}T${formLesson.startTime}`).getTime();
            const newEnd = newStart + (formLesson.durationMinutes || 60) * 60000;
            const hasConflict = lessons.some(l => {
                if (l.id === editingLessonId) return false;
                if (l.teacherId !== formLesson.teacherId) return false;
                if (l.date !== formLesson.date) return false;
                const lStart = new Date(`${l.date}T${l.startTime}`).getTime();
                const lEnd = lStart + l.durationMinutes * 60000;
                return (newStart < lEnd && newEnd > lStart);
            });

            if (hasConflict && !pendingConflict) {
                const teacherName = teachers.find(t => t.id === formLesson.teacherId)?.name;
                setFormMessage({type: 'warning', text: `警告：${teacherName} 在此時段已有課程 (衝堂)。再次點擊按鈕以強制派課。`});
                setPendingConflict(true);
                return;
            }

            // Generate ID for new single lesson
            let lessonId = editingLessonId;
            if (!lessonId) {
                lessonId = generateLessonId(formLesson.date!, lessons);
            }

            const lessonData = {
                id: lessonId,
                title: formLesson.title!,
                subject: formLesson.subject || effectiveSubjects[0],
                teacherId: formLesson.teacherId!,
                studentIds: formLesson.studentIds || [],
                date: formLesson.date!,
                startTime: formLesson.startTime!,
                durationMinutes: formLesson.durationMinutes || 60,
                type: formLesson.type || ClassType.PRIVATE,
                price: Number(formLesson.price),
                cost: Number(formLesson.cost || 0), 
                isCompleted: formLesson.isCompleted || false,
                lessonPlan: formLesson.lessonPlan || '',
                studentNotes: formLesson.studentNotes || {}
            };
            if (editingLessonId) onUpdateLesson(lessonData); else onAddLesson(lessonData);
            handleCloseModal();
        }
    };

    // Availability Mode Handlers
    const handleDayClickInAvailabilityMode = (date: Date) => {
        let targetTeacherId = selectedTeacherFilter;
        if (currentUser?.role !== 'admin' && currentUser?.teacherId) {
            targetTeacherId = currentUser.teacherId;
        }

        if (!targetTeacherId) {
            setToastMessage({ type: 'error', text: "請先選擇一位教師以編輯空檔" });
            return;
        }

        const dateStr = formatDateLocal(date);
        const existingAvail = (availabilities || []).find(a => a.date === dateStr && a.teacherId === targetTeacherId);

        if (existingAvail) {
            setEditingAvailability(existingAvail);
            setTempTimeSlots([...existingAvail.timeSlots]);
            setIsNewAvailability(false);
        } else {
            setEditingAvailability({
                id: `av-${targetTeacherId}-${dateStr}`,
                teacherId: targetTeacherId,
                date: dateStr,
                timeSlots: []
            });
            setTempTimeSlots([]);
            setIsNewAvailability(true);
        }
        setSlotError('');
        setShowAvailabilityModal(true);
    };

    // New helper to open availability modal for a specific teacher on a specific day
    const handleEditSpecificTeacherAvailability = (teacherId: string, dateStr: string) => {
        const existingAvail = (availabilities || []).find(a => a.date === dateStr && a.teacherId === teacherId);

        if (existingAvail) {
            setEditingAvailability(existingAvail);
            setTempTimeSlots([...existingAvail.timeSlots]);
            setIsNewAvailability(false);
        } else {
            setEditingAvailability({
                id: `av-${teacherId}-${dateStr}`,
                teacherId: teacherId,
                date: dateStr,
                timeSlots: []
            });
            setTempTimeSlots([]);
            setIsNewAvailability(true);
        }
        setSlotError('');
        setShowAvailabilityModal(true);
    };

    // New helper for Text Note mode click
    const handleDayClickInNoteMode = (date: Date) => {
        if (!currentUser) return;
        const dateStr = formatDateLocal(date);
        const note = getNoteForDay(date);
        setCurrentNoteDate(dateStr);
        setCurrentNoteContent(note?.content || '');
        setEditingNoteId(note?.id || `note-${currentUser.id}-${dateStr}`);
        setShowNoteModal(true);
    };

    const handleSaveNote = () => {
        if(onSaveCalendarNote && currentUser) {
            onSaveCalendarNote({
                id: editingNoteId,
                date: currentNoteDate,
                content: currentNoteContent,
                userId: currentUser.id
            });
        }
        setShowNoteModal(false);
    };

    const isOverlapping = (start1: string, end1: string, start2: string, end2: string) => start1 < end2 && end1 > start2;
    const handleSaveSlotInput = () => {
        setSlotError('');
        if (!newSlotStart || !newSlotEnd) return;
        if (newSlotStart >= newSlotEnd) { setSlotError("結束時間必須晚於開始時間！"); return; }
        const hasOverlap = tempTimeSlots.some((slot, index) => { if (editingSlotIndex !== null && index === editingSlotIndex) return false; return isOverlapping(newSlotStart, newSlotEnd, slot.start, slot.end); });
        if (hasOverlap) { setSlotError("此時段與已登記的時段重疊，請重新設定"); return; }
        const newSlots = [...tempTimeSlots]; const newSlot = { start: newSlotStart, end: newSlotEnd };
        if (editingSlotIndex !== null) { newSlots[editingSlotIndex] = newSlot; setEditingSlotIndex(null); } else { newSlots.push(newSlot); }
        newSlots.sort((a, b) => a.start.localeCompare(b.start)); setTempTimeSlots(newSlots); setNewSlotStart(''); setNewSlotEnd('');
    };
    const handleEditSlot = (index: number) => { const slot = tempTimeSlots[index]; setNewSlotStart(slot.start); setNewSlotEnd(slot.end); setEditingSlotIndex(index); setSlotError(''); };
    const handleCancelEdit = () => { setNewSlotStart(''); setNewSlotEnd(''); setEditingSlotIndex(null); setSlotError(''); };
    const handleRemoveSlot = (index: number) => { if (editingSlotIndex === index) handleCancelEdit(); const newSlots = [...tempTimeSlots]; newSlots.splice(index, 1); setTempTimeSlots(newSlots); };
    const handleSaveAvailability = () => {
        if (editingAvailability) {
            const data = { ...editingAvailability, timeSlots: tempTimeSlots };
            if (isNewAvailability && onAddAvailability) onAddAvailability(data);
            else if (!isNewAvailability && onUpdateAvailability) onUpdateAvailability(data);
        }
        setShowAvailabilityModal(false);
    };
    
    // Toggle expand state for availability list item
    const toggleAvailExpand = (e: React.MouseEvent, key: string) => {
        e.stopPropagation(); // Prevent opening the main modal when clicking to expand
        setExpandedAvailKey(prev => prev === key ? null : key);
    };

    const handleTriggerDelete = () => setShowDeleteAlert(true);
    const confirmDelete = () => { 
        if (editingLessonId) { 
            onDeleteLesson(editingLessonId); 
            setShowDeleteAlert(false); 
            handleCloseModal(); 
        } 
    };
    const toggleStudent = (studentId: string) => {
        if (!canEditLogistics) return;
        const currentIds = formLesson.studentIds || [];
        if (currentIds.includes(studentId)) setFormLesson({ ...formLesson, studentIds: currentIds.filter(id => id !== studentId) });
        else setFormLesson({ ...formLesson, studentIds: [...currentIds, studentId] });
        setStudentSearchTerm('');
    };

    const filteredStudents = students.filter(s => (s.name.includes(studentSearchTerm) || s.phone.includes(studentSearchTerm)) && !formLesson.studentIds?.includes(s.id));
    const filteredTeachersForFilter = teachers.filter(t => t.name.toLowerCase().includes(teacherFilterSearchTerm.toLowerCase()));
    const currentTeacher = teachers.find(t => t.id === formLesson.teacherId);
    
    const canViewFinancials = !!(!currentUser || currentUser.role === 'admin' || (formLesson.teacherId && currentUser.teacherId === formLesson.teacherId));

    const canManageAvailability = !strictReadOnly && (!readOnly || (currentUser?.role === 'staff' && !!currentUser?.teacherId));

    return (
        <div className="h-full flex flex-col space-y-6 pt-2">
            {/* Toast Notification */}
            {toastMessage && (
                <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-4 ${toastMessage.type === 'error' ? 'bg-red-500 text-white' : 'bg-slate-800 text-white'}`}>
                    <Info className="w-4 h-4" />
                    <span className="text-sm font-medium">{toastMessage.text}</span>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-3 rounded-2xl shadow-sm border border-slate-100 gap-3">
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                    {/* Date Selectors */}
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <select value={currentYear} onChange={(e) => handleYearChange(parseInt(e.target.value))} className="appearance-none bg-white border border-slate-200 text-slate-700 py-1.5 pl-3 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm font-bold cursor-pointer hover:bg-slate-50 transition-colors h-9 text-sm">
                                {years.map(y => <option key={y} value={y}>{y}年</option>)}
                            </select>
                            <ChevronDown className="w-3 h-3 text-slate-900 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                        <div className="relative">
                            <select value={currentMonth} onChange={(e) => handleMonthChange(parseInt(e.target.value))} className="appearance-none bg-white border border-slate-200 text-slate-700 py-1.5 pl-3 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm font-bold cursor-pointer hover:bg-slate-50 transition-colors h-9 text-sm">
                                {months.map(m => <option key={m} value={m}>{m + 1}月</option>)}
                            </select>
                            <ChevronDown className="w-3 h-3 text-slate-900 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                    </div>
                    {/* Navigation Arrows */}
                    <div className="flex items-center bg-slate-50 rounded-lg p-1 border border-slate-200">
                        <button onClick={handlePrev} className="p-1.5 hover:bg-white hover:shadow-sm rounded-md text-slate-500 transition-all"><ChevronLeft className="w-4 h-4" /></button>
                        <button onClick={jumpToThisMonth} className={`px-3 py-1 text-xs font-bold transition-colors rounded-md ${viewMode === 'month' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-600 hover:text-blue-600'}`}>本月</button>
                        <div className="w-px h-3 bg-slate-300 mx-1"></div>
                        <button onClick={jumpToToday} className={`px-3 py-1 text-xs font-bold transition-colors rounded-md ${viewMode === 'week' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-600 hover:text-blue-600'}`}>本週</button>
                        <button onClick={handleNext} className="p-1.5 hover:bg-white hover:shadow-sm rounded-md text-slate-500 transition-all"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                    {/* Teacher Filter - Hide in Text Note Mode */}
                    {currentUser?.role === 'admin' && calendarMode !== 'text_note' && (
                        <div className="relative w-full sm:w-40" ref={teacherFilterRef}>
                            <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                            <input type="text" placeholder={selectedTeacherFilter ? teachers.find(t => t.id === selectedTeacherFilter)?.name : "篩選教師..."} value={teacherFilterSearchTerm} onChange={(e) => { setTeacherFilterSearchTerm(e.target.value); setShowTeacherFilterDropdown(true); setSelectedTeacherFilter(''); }} onFocus={() => setShowTeacherFilterDropdown(true)} className="w-full h-9 pl-8 pr-7 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-xs font-medium cursor-text" />
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-900 pointer-events-none"/>
                            {showTeacherFilterDropdown && (
                                <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-slate-100 max-h-60 overflow-y-auto z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm text-slate-500 border-b border-slate-50" onClick={() => { setSelectedTeacherFilter(''); setTeacherFilterSearchTerm(''); setShowTeacherFilterDropdown(false); }}>所有教師</div>
                                    {filteredTeachersForFilter.map(t => (
                                        <div key={t.id} className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm text-slate-700 border-b border-slate-50 last:border-0 flex items-center" onClick={() => { setSelectedTeacherFilter(t.id); setTeacherFilterSearchTerm(t.name); setShowTeacherFilterDropdown(false); }}>
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold mr-2 ${t.color.split(' ')[0]} ${t.color.split(' ')[1]}`}>{t.name[0]}</div>{t.name}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
                
                {/* Modified Header Right Side */}
                <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
                        {/* Show My Lessons Toggle - Now visible in strictReadOnly too if teacher */}
                        {currentUser?.teacherId && calendarMode === 'schedule' && (
                            <button
                                onClick={() => setShowOnlyMyLessons(!showOnlyMyLessons)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center transition-all border whitespace-nowrap ${
                                    showOnlyMyLessons 
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                }`}
                            >
                                <UserCheck className="w-3.5 h-3.5 mr-1.5" />
                                只顯示我的
                            </button>
                        )}

                        {/* Generate Report Dropdown */}
                        <div className="relative" ref={reportMenuRef}>
                            <button
                                onClick={() => setShowReportMenu(!showReportMenu)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center transition-all border whitespace-nowrap bg-white text-slate-600 border-slate-200 hover:bg-slate-50`}
                            >
                                <FileText className="w-3.5 h-3.5 mr-1.5" />
                                生成報告
                                <ChevronDown className="w-3 h-3 ml-1" />
                            </button>
                            {showReportMenu && (
                                <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-xl border border-slate-100 w-32 z-50 animate-in fade-in slide-in-from-top-2">
                                    <button onClick={() => handleGenerateReport('day')} className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 text-slate-700 border-b border-slate-50">
                                        今日課程
                                    </button>
                                    <button onClick={() => handleGenerateReport('week')} className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 text-slate-700 border-b border-slate-50">
                                        本週課程
                                    </button>
                                    <button onClick={() => handleGenerateReport('month')} className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 text-slate-700">
                                        本月課程
                                    </button>
                                </div>
                            )}
                        </div>

                        {!strictReadOnly && (
                            <>
                                <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                                    <button onClick={() => setCalendarMode('schedule')} className={`px-2.5 py-1.5 rounded-md text-xs font-bold flex items-center transition-all ${calendarMode === 'schedule' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><CalendarDays className="w-3.5 h-3.5 mr-1.5" />排課模式</button>
                                    {/* Allow availability mode if admin OR (staff AND has teacherId) */}
                                    {canManageAvailability && (
                                        <button onClick={() => setCalendarMode('availability')} className={`px-2.5 py-1.5 rounded-md text-xs font-bold flex items-center transition-all ${calendarMode === 'availability' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><ClockIcon className="w-3.5 h-3.5 mr-1.5" />登記空檔</button>
                                    )}
                                    {currentUser?.role === 'admin' && (
                                        <button onClick={() => setCalendarMode('booking')} className={`px-2.5 py-1.5 rounded-md text-xs font-bold flex items-center transition-all ${calendarMode === 'booking' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><CalendarCheck className="w-3.5 h-3.5 mr-1.5" />空檔派課</button>
                                    )}
                                    <button onClick={() => setCalendarMode('text_note')} className={`px-2.5 py-1.5 rounded-md text-xs font-bold flex items-center transition-all ${calendarMode === 'text_note' ? 'bg-white text-yellow-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><StickyNote className="w-3.5 h-3.5 mr-1.5" />文字行事曆</button>
                                </div>
                                
                                {calendarMode === 'schedule' && !readOnly && !strictReadOnly && (
                                    <button onClick={openAddModal} className="w-full sm:w-auto flex items-center justify-center px-4 py-1.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/30 transition-all font-medium h-9 text-xs whitespace-nowrap"><Plus className="w-4 h-4 mr-1.5" />新增派課</button>
                                )}
                            </>
                        )}
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 overflow-x-auto px-2 pt-0 pb-4 h-full min-h-0 custom-scrollbar">
                {/* ... [Grid implementation same as before] ... */}
                <div className="grid grid-cols-7 gap-2 w-full min-w-[600px] md:min-w-0">
                    {displayDays.map((day, idx) => {
                        const dateStr = formatDateLocal(day);
                        const isToday = dateStr === formatDateLocal(new Date());
                        const isCurrentMonth = day.getMonth() === currentMonth;
                        const dayLessons = getLessonsForDay(day);
                        let teacherIdForAvail = selectedTeacherFilter || currentUser?.teacherId || '';
                        
                        const relevantAvailabilities = bookingSlot === null && calendarMode === 'booking' 
                             ? (availabilities || []).filter(a => a.date === dateStr && (teacherIdForAvail ? a.teacherId === teacherIdForAvail : true))
                             : (teacherIdForAvail ? [(availabilities || []).find(a => a.date === dateStr && a.teacherId === teacherIdForAvail)].filter(Boolean) as Availability[] : []);

                        const singleAvailability = calendarMode === 'availability' && teacherIdForAvail 
                            ? getAvailabilityForDay(day, teacherIdForAvail) 
                            : null;
                        
                        const allAvailabilitiesForDay = calendarMode === 'availability' && !teacherIdForAvail
                            ? (availabilities || []).filter(a => a.date === dateStr)
                            : [];

                        let allBookingSlots: { teacher: Teacher, slot: {start:string, end:string}, availId: string, slotIdx: number }[] = [];
                        if (calendarMode === 'booking') {
                            relevantAvailabilities.forEach(avail => {
                                const teacher = teachers.find(t => t.id === avail.teacherId);
                                if (teacher) {
                                    avail.timeSlots.forEach((slot, slotIdx) => {
                                        allBookingSlots.push({ teacher, slot, availId: avail.id, slotIdx });
                                    });
                                }
                            });
                            allBookingSlots.sort((a, b) => a.slot.start.localeCompare(b.slot.start));
                        }

                        // For Text Note
                        const dayNote = getNoteForDay(day);

                        return (
                            <div 
                                key={idx} 
                                onClick={() => { 
                                    if (calendarMode === 'availability') handleDayClickInAvailabilityMode(day);
                                    if (calendarMode === 'text_note') handleDayClickInNoteMode(day);
                                }} 
                                className={`flex flex-col rounded-2xl overflow-hidden border transition-all ${viewMode === 'week' ? 'min-h-[500px]' : 'min-h-[120px]'} ${isToday ? 'border-blue-400 bg-blue-50 shadow-md ring-1 ring-blue-200' : (isCurrentMonth ? 'border-slate-200 bg-white shadow-sm' : 'border-slate-100 bg-slate-100/60 opacity-60')} ${(calendarMode === 'availability' || calendarMode === 'text_note') && isCurrentMonth ? 'cursor-pointer hover:ring-2 hover:ring-emerald-400 hover:border-emerald-400' : ''}`}
                            >
                                <div className={`flex flex-col xl:flex-row items-center justify-center p-2 border-b gap-1 xl:gap-2 ${isToday ? 'bg-blue-100' : (isCurrentMonth ? 'bg-white' : 'bg-slate-50')}`}>
                                    <span className={`text-xs font-semibold uppercase ${isToday ? 'text-blue-700' : (isCurrentMonth ? 'text-slate-500' : 'text-slate-300')}`}>{['週日', '週一', '週二', '週三', '週四', '週五', '週六'][day.getDay()]}</span>
                                    <span className={`text-sm font-bold ${isToday ? 'text-blue-700 bg-blue-200 w-6 h-6 flex items-center justify-center rounded-full' : (isCurrentMonth ? 'text-slate-900' : 'text-slate-400')}`}>{day.getDate()}</span>
                                </div>
                                <div className={`p-1 md:p-2 space-y-2 flex-1 ${!isCurrentMonth && 'grayscale-[0.5]'}`}>
                                    {/* Normal Schedule Mode */}
                                    {calendarMode === 'schedule' && dayLessons.map(lesson => {
                                        const teacher = teachers.find(t => t.id === lesson.teacherId);
                                        const isMyLesson = currentUser?.teacherId === lesson.teacherId;
                                        const isInProgress = checkIsInProgress(lesson);

                                        return (
                                            <div key={lesson.id} className={`group p-2 rounded-lg border text-xs shadow-sm cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md relative overflow-hidden ${lesson.isCompleted ? 'bg-slate-50 border-slate-200 opacity-70 grayscale-[0.5]' : (isInProgress ? 'bg-red-50 border-red-200 ring-1 ring-red-200' : (isMyLesson ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200' : 'bg-white border-slate-100 hover:border-blue-200'))}`} onClick={(e) => { e.stopPropagation(); openEditModal(lesson); }}>
                                                {isInProgress && (
                                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 animate-pulse"></div>
                                                )}
                                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${isInProgress ? 'bg-transparent' : (lesson.isCompleted ? 'bg-slate-300' : 'bg-blue-500')}`}></div>
                                                <div className="pl-2">
                                                    <div className="flex flex-col xl:flex-row xl:justify-between xl:items-center gap-1 mb-1">
                                                        <span className={`font-bold ${isInProgress ? 'text-red-600' : 'text-slate-700'}`}>{formatTimeWithPeriod(lesson.startTime)}</span>
                                                        <div className="flex flex-col xl:hidden">
                                                             <span className={`px-1.5 py-0.5 rounded-full text-[10px] w-fit truncate max-w-full ${teacher?.color}`}>{teacher?.name}</span>
                                                        </div>
                                                        <span className={`hidden xl:inline-block px-1.5 py-0.5 rounded-full text-[10px] w-fit truncate max-w-full ${teacher?.color}`}>{teacher?.name}</span>
                                                    </div>
                                                    <div className="font-bold text-slate-800 truncate flex items-center">
                                                        {lesson.title}
                                                        {isInProgress && <Radio className="w-3 h-3 text-red-500 ml-1 animate-pulse" />}
                                                        {isMyLesson && !isInProgress && <span className="ml-1 text-[8px] bg-blue-100 text-blue-600 px-1 rounded">您的課程</span>}
                                                    </div>
                                                    <>
                                                        <div className="text-blue-500 truncate mb-1">{lesson.subject}</div>
                                                        <div className="flex items-center text-slate-400 pt-1 border-t border-slate-100 border-dashed mt-1"><Clock className="w-3 h-3 mr-1" /> {lesson.durationMinutes}m</div>
                                                    </>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    
                                    {/* Availability Mode */}
                                    {calendarMode === 'availability' && singleAvailability && singleAvailability.timeSlots.length > 0 && (
                                        <div className="space-y-1">
                                            {singleAvailability.timeSlots.map((slot, idx) => (
                                                <div key={idx} className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 rounded px-2 py-1 font-medium text-center">{formatTimeWithPeriod(slot.start)} - {formatTimeWithPeriod(slot.end)}</div>
                                            ))}
                                        </div>
                                    )}

                                    {calendarMode === 'availability' && !teacherIdForAvail && allAvailabilitiesForDay.length > 0 && (
                                        <div className="space-y-2 pt-1">
                                            {allAvailabilitiesForDay
                                                .map(avail => ({ teacher: teachers.find(t => t.id === avail.teacherId), avail }))
                                                .filter(item => item.teacher && item.avail.timeSlots.length > 0)
                                                .map(({ teacher, avail }) => {
                                                     const uniqueKey = `${dateStr}-${teacher!.id}`;
                                                     const isExpanded = expandedAvailKey === uniqueKey;

                                                     return (
                                                     <div 
                                                        key={teacher!.id} 
                                                        className="border border-emerald-100 rounded-lg bg-white overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group"
                                                        onClick={(e) => toggleAvailExpand(e, uniqueKey)}
                                                     >
                                                        <div className={`px-2 py-1.5 flex justify-between items-center transition-colors ${isExpanded ? 'bg-emerald-100 border-b border-emerald-100' : 'bg-emerald-50/50 group-hover:bg-emerald-100/50'}`}>
                                                            <div className="flex items-center gap-1 overflow-hidden">
                                                                {isExpanded ? <ChevronUp className="w-3 h-3 text-emerald-600 flex-shrink-0" /> : <ChevronDown className="w-3 h-3 text-emerald-400 flex-shrink-0" />}
                                                                <span className="text-xs font-bold text-slate-700 truncate">{teacher!.name}</span>
                                                            </div>
                                                            <span className="text-[10px] text-emerald-600 bg-white px-1.5 rounded-full border border-emerald-100 flex-shrink-0">{avail.timeSlots.length}</span>
                                                        </div>
                                                        
                                                        {isExpanded && (
                                                            <div className="bg-white p-1.5 space-y-1 animate-in slide-in-from-top-1 duration-200">
                                                                {avail.timeSlots.map((slot, sIdx) => (
                                                                    <div key={sIdx} className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded text-center border border-emerald-100">
                                                                        {formatTimeWithPeriod(slot.start)} - {formatTimeWithPeriod(slot.end)}
                                                                    </div>
                                                                ))}
                                                                <button 
                                                                    onClick={(e) => {
                                                                        e.stopPropagation(); // Stop propagation to day cell
                                                                        handleEditSpecificTeacherAvailability(teacher!.id, dateStr);
                                                                    }}
                                                                    className="w-full mt-1 flex items-center justify-center text-[10px] bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800 py-1 rounded transition-colors"
                                                                >
                                                                    <Edit2 className="w-3 h-3 mr-1" />
                                                                    編輯
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                    
                                    {calendarMode === 'availability' && isCurrentMonth && !singleAvailability?.timeSlots?.length && (!teacherIdForAvail && allAvailabilitiesForDay.length === 0) && (
                                        <div className="h-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"><div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-400 flex items-center justify-center"><Plus className="w-4 h-4" /></div></div>
                                    )}

                                    {/* Text Note Mode Display */}
                                    {calendarMode === 'text_note' && (
                                        <div className="h-full flex flex-col relative group">
                                            {dayNote && dayNote.content.trim() ? (
                                                <div className="flex-1 bg-yellow-50 rounded-lg border border-yellow-200 p-2 shadow-sm text-xs text-slate-700 hover:bg-yellow-100 transition-colors cursor-pointer overflow-hidden relative">
                                                     <div className="absolute top-0 right-0 p-1">
                                                        <StickyNote className="w-3 h-3 text-yellow-500" />
                                                     </div>
                                                     <div className="whitespace-pre-wrap break-words line-clamp-[8] font-medium leading-relaxed">
                                                         {dayNote.content}
                                                     </div>
                                                </div>
                                            ) : (
                                                isCurrentMonth && (
                                                    <div className="h-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                                        <div className="flex flex-col items-center text-yellow-400">
                                                            <div className="w-8 h-8 rounded-full bg-yellow-50 flex items-center justify-center mb-1">
                                                                <Edit2 className="w-4 h-4" />
                                                            </div>
                                                            <span className="text-[10px]">新增紀錄</span>
                                                        </div>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    )}

                                    {/* Booking Mode Display */}
                                    {calendarMode === 'booking' && allBookingSlots.map(({ teacher, slot, availId, slotIdx }) => {
                                         const existingLesson = dayLessons.find(l => {
                                             if (l.teacherId !== teacher.id) return false;
                                             const lessonStart = parseInt(l.startTime.replace(':', ''));
                                             const slotStart = parseInt(slot.start.replace(':', ''));
                                             const slotEnd = parseInt(slot.end.replace(':', ''));
                                             return lessonStart >= slotStart && lessonStart < slotEnd;
                                         });

                                         if (existingLesson) {
                                            return (
                                                <button key={`${availId}-${slotIdx}`} onClick={() => openEditModal(existingLesson, { start: slot.start, end: slot.end })} className="w-full text-left p-2 rounded-lg border text-xs shadow-sm transition-all hover:shadow-md mb-1 bg-violet-50 border-violet-200 text-violet-800 hover:bg-violet-100">
                                                    <div className="flex justify-between items-center mb-0.5">
                                                        <span className="font-bold">{teacher.name}</span>
                                                        <span className="text-[10px] bg-violet-200 px-1 rounded-sm">已排課</span>
                                                    </div>
                                                    <div className="flex items-center text-[10px] opacity-80">
                                                        <Clock className="w-3 h-3 mr-1" />
                                                        {formatTimeWithPeriod(existingLesson.startTime)}
                                                    </div>
                                                    <div className="truncate font-medium mt-0.5">{existingLesson.title}</div>
                                                </button>
                                            );
                                         }
                                         return (
                                             <button key={`${availId}-${slotIdx}`} onClick={() => handleBookSlot(teacher.id, dateStr, slot.start, slot.end)} className={`w-full text-left p-2 rounded-lg border text-xs shadow-sm transition-all hover:shadow-md mb-1 ${teacher.color} hover:ring-2 hover:ring-opacity-50 hover:ring-amber-400`}>
                                                <div className="font-bold mb-0.5">{teacher.name}</div>
                                                <div className="flex items-center">
                                                    <Clock className="w-3 h-3 mr-1 opacity-70" />
                                                    {formatTimeWithPeriod(slot.start)} - {formatTimeWithPeriod(slot.end)}
                                                </div>
                                             </button>
                                         );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ... [Existing Modals: Report Detail, Lesson Edit, Availability] ... */}
            {/* Report Detail Modal */}
            {showReportModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-[95vw] h-[85vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">
                                    課程報告 - {reportType === 'day' ? '今日課程' : (reportType === 'week' ? '本週課程' : '本月課程')}
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">共 {reportLessons.length} 堂課程 (點擊列表可查看詳情)</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={handleExportReportCSV}
                                    className="flex items-center px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                                >
                                    <Download className="w-3.5 h-3.5 mr-1.5" />
                                    匯出 CSV
                                </button>
                                <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-slate-600">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">日期 / 時間</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">課程名稱</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">教師</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">學生</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-center">狀態</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {reportLessons.length > 0 ? reportLessons.map(lesson => {
                                        const teacher = teachers.find(t => t.id === lesson.teacherId);
                                        return (
                                            <tr 
                                                key={lesson.id} 
                                                className="hover:bg-blue-50 cursor-pointer transition-colors group"
                                                onClick={() => setSelectedReportLesson(lesson)}
                                                title="點擊查看課程詳情"
                                            >
                                                <td className="px-6 py-3">
                                                    <div className="text-sm font-medium text-slate-900">{lesson.date}</div>
                                                    <div className="text-xs text-slate-500 group-hover:text-blue-600">{formatTimeWithPeriod(lesson.startTime)} ({lesson.durationMinutes}m)</div>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <div className="text-sm font-medium text-slate-800 group-hover:text-blue-700">{lesson.title}</div>
                                                    <div className="text-xs text-slate-500">{lesson.subject}</div>
                                                </td>
                                                <td className="px-6 py-3">
                                                     <div className="flex items-center">
                                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold mr-2 ${teacher?.color.split(' ')[0]} ${teacher?.color.split(' ')[1]}`}>
                                                            {teacher?.name[0]}
                                                        </div>
                                                        <span className="text-sm text-slate-700">{teacher?.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <div className="flex flex-wrap gap-1">
                                                        {lesson.studentIds.map(sid => {
                                                            const s = students.find(stu => stu.id === sid);
                                                            return s ? <span key={sid} className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600">{s.name}</span> : null;
                                                        })}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3 text-center">
                                                     <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold ${lesson.isCompleted ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                                        {lesson.isCompleted ? <CheckCircle className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                                                        {lesson.isCompleted ? '已完成' : '未完成'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    }) : (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                                                此區間無課程資料
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Detailed Lesson View Modal */}
            {selectedReportLesson && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 relative flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">課程詳細資訊</h3>
                                <p className="text-xs text-slate-500 mt-1">{selectedReportLesson.title}</p>
                            </div>
                            <button onClick={() => setSelectedReportLesson(null)} className="bg-white p-1 rounded-full border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                            {/* ... Content same as existing ... */}
                            <div className="flex items-center justify-between">
                                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${selectedReportLesson.isCompleted ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                    {selectedReportLesson.isCompleted ? <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> : <Clock className="w-3.5 h-3.5 mr-1.5" />}
                                    {selectedReportLesson.isCompleted ? '已完成課程' : '尚未完課'}
                                </div>
                                <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100">ID: {selectedReportLesson.id}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <div className="text-xs text-slate-500 mb-1 flex items-center"><CalendarIcon className="w-3 h-3 mr-1"/> 日期時間</div>
                                    <div className="font-bold text-slate-800">{selectedReportLesson.date}</div>
                                    <div className="text-sm text-blue-600 font-medium">{formatTimeWithPeriod(selectedReportLesson.startTime)}</div>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <div className="text-xs text-slate-500 mb-1 flex items-center"><Clock className="w-3 h-3 mr-1"/> 時長與類型</div>
                                    <div className="font-bold text-slate-800">{selectedReportLesson.durationMinutes} 分鐘</div>
                                    <div className="text-sm text-slate-600">{getClassTypeName(selectedReportLesson.type)}</div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                            <button onClick={() => setSelectedReportLesson(null)} className="px-6 py-2 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 shadow-sm transition-colors text-sm">
                                關閉視窗
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add/Edit Lesson Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className={`bg-white rounded-3xl shadow-2xl w-full ${isRecurring ? 'max-w-7xl' : 'max-w-2xl'} overflow-hidden animate-in zoom-in-95 duration-200 relative transition-all`}>
                         {/* ... (Existing Modal Content) ... */}
                         {showDeleteAlert && (
                            <div className="absolute inset-0 bg-white/95 z-10 flex flex-col items-center justify-center p-8 animate-in fade-in duration-200">
                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6"><AlertTriangle className="w-8 h-8 text-red-600" /></div>
                                <h4 className="text-2xl font-bold text-slate-800 mb-2">確定要刪除此課程？</h4>
                                <p className="text-slate-500 text-center mb-8 max-w-sm">刪除後將無法復原此筆資料，請確認是否繼續執行。</p>
                                <div className="flex space-x-4 w-full max-w-xs">
                                    <button onClick={() => setShowDeleteAlert(false)} className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors">取消</button>
                                    <button onClick={confirmDelete} className="flex-1 px-4 py-3 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 shadow-lg shadow-red-500/30 transition-colors">確認刪除</button>
                                </div>
                            </div>
                        )}

                        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-800">
                                    {editingLessonId 
                                        ? ((readOnly && !canEditProgress) ? '課程詳情' : (readOnly && canEditProgress ? '填寫課堂進度' : '編輯派課')) 
                                        : (isRecurring ? '每週固定派課' : '新增派課')
                                    }
                                </h3>
                                <p className="text-slate-500 text-sm mt-1">{isRecurring ? '設定每週重複的課程時間與自動排程' : (editingLessonId && (readOnly && !canEditProgress) ? '檢視課程詳細資訊' : '請填寫課程詳細資訊與指派學生')}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                {editingLessonId && (
                                    <span className="hidden sm:inline-block text-xs font-mono text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded shadow-sm mr-2">
                                        ID: {editingLessonId}
                                    </span>
                                )}
                                {!editingLessonId && canEditLogistics && (
                                    <button onClick={() => { setIsRecurring(!isRecurring); setPreviewLessons([]); }} className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center transition-all ${isRecurring ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                                        <Repeat className="w-4 h-4 mr-2" />{isRecurring ? '切換至單堂派課' : '切換至每週派課'}
                                    </button>
                                )}
                                {editingLessonId && canEditProgress && (
                                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold shadow-sm ${formLesson.isCompleted ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{formLesson.isCompleted ? '已完成' : '未上課'}</span>
                                )}
                            </div>
                        </div>
                        
                        <div className="flex flex-col lg:flex-row h-[60vh]">
                            <div className={`p-8 overflow-y-auto custom-scrollbar ${isRecurring ? 'w-full lg:w-3/5 border-r border-slate-100' : 'w-full'}`}>
                                <div className="space-y-6">
                                    {/* ... [Form Fields for Lesson] ... */}
                                    {/* Note: Keeping existing form fields logic as is, just truncated for brevity in XML if not changing */}
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-slate-700">課程標題</label>
                                        <input type="text" className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all disabled:text-slate-500" value={formLesson.title || ''} onChange={e => setFormLesson({...formLesson, title: e.target.value})} placeholder="例如：週三鋼琴進階班" disabled={!canEditLogistics} />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-slate-700">授課科目</label>
                                        <div className="relative">
                                            <Music className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                            <select className="w-full h-11 pl-10 bg-slate-50 border border-slate-200 rounded-xl px-4 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none appearance-none cursor-pointer disabled:text-slate-500" value={formLesson.subject} onChange={e => setFormLesson({...formLesson, subject: e.target.value})} disabled={!canEditLogistics}>
                                                {effectiveSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-900 w-4 h-4 pointer-events-none" />
                                        </div>
                                    </div>

                                    {isRecurring ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-sm font-semibold text-slate-700">每週重複於 (起始日)</label>
                                                <div className="relative">
                                                    <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                                                    <input 
                                                        type="date" 
                                                        className="w-full h-11 pl-10 bg-slate-50 border border-slate-200 rounded-xl px-4 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none cursor-pointer" 
                                                        value={recurringStartDate} 
                                                        onChange={e => setRecurringStartDate(e.target.value)} 
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-sm font-semibold text-slate-700">開始時間</label>
                                                <div className="relative">
                                                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                                                    <input 
                                                        type="time" 
                                                        className="w-full h-11 pl-10 bg-slate-50 border border-slate-200 rounded-xl px-4 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none cursor-pointer" 
                                                        value={formLesson.startTime || ''} 
                                                        onChange={e => setFormLesson({...formLesson, startTime: e.target.value})} 
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-sm font-semibold text-slate-700">日期</label>
                                                <div className="relative">
                                                    <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                                                    <input 
                                                        type="date" 
                                                        className="w-full h-11 pl-10 bg-slate-50 border border-slate-200 rounded-xl px-4 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none cursor-pointer disabled:text-slate-500" 
                                                        value={formLesson.date || ''} 
                                                        onChange={e => setFormLesson({...formLesson, date: e.target.value})} 
                                                        disabled={!canEditLogistics} 
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-sm font-semibold text-slate-700">開始時間</label>
                                                <div className="relative">
                                                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                                                    <input 
                                                        type="time" 
                                                        className="w-full h-11 pl-10 bg-slate-50 border border-slate-200 rounded-xl px-4 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none cursor-pointer disabled:text-slate-500" 
                                                        value={formLesson.startTime || ''} 
                                                        min={bookingSlot?.start}
                                                        max={bookingSlot?.end}
                                                        onChange={e => {
                                                            const newTime = e.target.value;
                                                            if (bookingSlot) {
                                                                if (newTime < bookingSlot.start || newTime > bookingSlot.end) {
                                                                    setFormMessage({type: 'error', text: `選擇的時間超出空檔範圍 (${bookingSlot.start} - ${bookingSlot.end})。請調整時間。`});
                                                                } else {
                                                                    setFormMessage(null);
                                                                }
                                                            }
                                                            setFormLesson({...formLesson, startTime: newTime});
                                                        }} 
                                                        disabled={!canEditLogistics} 
                                                    />
                                                </div>
                                                {bookingSlot && (
                                                    <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded mt-1 flex items-center">
                                                        <Lock className="w-3 h-3 mr-1" />
                                                        只能選擇: {formatTimeWithPeriod(bookingSlot.start)} - {formatTimeWithPeriod(bookingSlot.end)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-slate-700">時長 (分)</label>
                                            <div className="relative">
                                                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                                <input type="number" className="w-full h-11 pl-10 bg-slate-50 border border-slate-200 rounded-xl px-4 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none disabled:text-slate-500" value={formLesson.durationMinutes} onChange={e => setFormLesson({...formLesson, durationMinutes: parseInt(e.target.value)})} disabled={!canEditLogistics} />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-slate-700">類型</label>
                                            <div className="relative">
                                                <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                                <select className="w-full h-11 pl-10 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none appearance-none disabled:text-slate-500" value={formLesson.type} onChange={e => setFormLesson({...formLesson, type: e.target.value as ClassType})} disabled={!canEditLogistics}>
                                                    <option value={ClassType.PRIVATE}>個別課</option>
                                                    <option value={ClassType.SMALL_GROUP}>小組課</option>
                                                    <option value={ClassType.LARGE_GROUP}>團體班</option>
                                                </select>
                                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-900 w-4 h-4 pointer-events-none" />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* ... Teacher Selection, Financials, Student Selectors ... */}
                                    {/* (Truncated for brevity, assuming minimal changes here needed for Text Note) */}
                                    {/* But I need to provide full file content. Re-adding the rest of the form. */}
                                    
                                     {/* Teacher Selection: Show ONLY in Single Mode */}
                                    {!isRecurring && (
                                        <div className="space-y-1.5" ref={teacherSearchRef}>
                                            <label className="text-sm font-semibold text-slate-700">授課教師 <span className="text-xs font-normal text-slate-400 ml-1">(可先不選，優先顯示有空檔教師)</span></label>
                                            <div className="relative">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                                <input 
                                                    type="text" 
                                                    className="w-full h-11 pl-10 bg-slate-50 border border-slate-200 rounded-xl px-4 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none disabled:text-slate-500 disabled:bg-slate-100" 
                                                    placeholder="搜尋教師..." 
                                                    value={teacherSearchTerm} 
                                                    onChange={(e) => { 
                                                        setTeacherSearchTerm(e.target.value); 
                                                        setShowTeacherDropdown(true); 
                                                        setFormLesson({ ...formLesson, teacherId: '' }); 
                                                    }} 
                                                    onFocus={() => !bookingSlot && setShowTeacherDropdown(true)} 
                                                    disabled={!canEditLogistics || !!bookingSlot} 
                                                />
                                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-900 w-4 h-4 pointer-events-none" />
                                                
                                                {showTeacherDropdown && canEditLogistics && !bookingSlot && (
                                                    <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-slate-100 max-h-60 overflow-y-auto z-50 custom-scrollbar">
                                                        {filteredTeachersForModal.length > 0 ? (
                                                            filteredTeachersForModal.map(t => {
                                                                const avail = (availabilities || []).find(a => a.date === formLesson.date && a.teacherId === t.id);
                                                                let relevantSlots = avail?.timeSlots || [];
                                                                if (formLesson.startTime) {
                                                                     const startMins = parseInt(formLesson.startTime.split(':')[0]) * 60 + parseInt(formLesson.startTime.split(':')[1]);
                                                                     relevantSlots = relevantSlots.filter(s => {
                                                                         const sStart = parseInt(s.start.split(':')[0]) * 60 + parseInt(s.start.split(':')[1]);
                                                                         const sEnd = parseInt(s.end.split(':')[0]) * 60 + parseInt(s.end.split(':')[1]);
                                                                         return startMins >= sStart && startMins < sEnd;
                                                                     });
                                                                }

                                                                return (
                                                                    <div key={t.id} className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 flex items-center justify-between group transition-colors" onClick={() => { setFormLesson({ ...formLesson, teacherId: t.id }); setTeacherSearchTerm(t.name); setShowTeacherDropdown(false); }}>
                                                                        <div className="flex items-center">
                                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mr-3 ${t.color.split(' ')[0]} ${t.color.split(' ')[1]}`}>{t.name[0]}</div>
                                                                            <div className="flex flex-col">
                                                                                <span className="font-medium text-slate-700 group-hover:text-blue-600 transition-colors">{t.name}</span>
                                                                                <span className="text-[10px] text-slate-400">抽成: {t.commissionRate}%</span>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex flex-col items-end">
                                                                            {relevantSlots.length > 0 && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold mb-1">有空檔</span>}
                                                                             {relevantSlots.length > 0 && (
                                                                                <div className="flex flex-wrap gap-1 justify-end">
                                                                                    {relevantSlots.map((slot, i) => (
                                                                                        <span key={i} className="text-[9px] text-emerald-600 bg-emerald-50 px-1 rounded border border-emerald-100">
                                                                                            {formatTimeWithPeriod(slot.start)}-{formatTimeWithPeriod(slot.end)}
                                                                                        </span>
                                                                                    ))}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })
                                                        ) : (
                                                            <div className="px-4 py-8 text-center text-sm text-slate-400 flex flex-col items-center"><Search className="w-8 h-8 mb-2 opacity-20" />找不到相符的教師</div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                     {/* Financials: Show ONLY in Single Mode */}
                                    {!isRecurring && canViewFinancials && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-sm font-semibold text-slate-700">本堂學費</label>
                                                <div className="relative">
                                                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                                    <input type="number" className="w-full h-11 pl-10 bg-white border border-slate-200 rounded-xl px-4 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none font-medium disabled:bg-gray-50" value={formLesson.price ?? ''} onChange={e => setFormLesson({...formLesson, price: e.target.value === '' ? undefined : Number(e.target.value)})} placeholder="" disabled={!canEditLogistics} />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-sm font-semibold text-blue-700 flex justify-between">應付薪資 {currentTeacher && <span className="text-xs font-normal text-blue-500">抽成: {currentTeacher.commissionRate}%</span>}</label>
                                                <div className="relative">
                                                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 w-4 h-4" />
                                                    <input type="number" className="w-full h-11 pl-10 bg-blue-50 border border-blue-200 rounded-xl px-4 text-blue-800 font-bold outline-none disabled:bg-gray-100" value={formLesson.cost ?? ''} onChange={e => setFormLesson({...formLesson, cost: e.target.value === '' ? undefined : Number(e.target.value)})} placeholder="" disabled={!canEditLogistics} />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Tuition input needed for recurring calculation base, but hidden cost output */}
                                    {isRecurring && canViewFinancials && (
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-slate-700">本堂學費 (用於計算薪資)</label>
                                            <div className="relative">
                                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                                <input type="number" className="w-full h-11 pl-10 bg-white border border-slate-200 rounded-xl px-4 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none font-medium disabled:bg-gray-50" value={formLesson.price ?? ''} onChange={e => setFormLesson({...formLesson, price: e.target.value === '' ? undefined : Number(e.target.value)})} placeholder="" disabled={!canEditLogistics} />
                                            </div>
                                        </div>
                                    )}

                                     {/* Recurring Auto Schedule Options */}
                                    {isRecurring && (
                                        <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 space-y-4">
                                            <h4 className="font-bold text-indigo-900 flex items-center"><CalendarIcon className="w-4 h-4 mr-2" /> 自動排課設定</h4>
                                            <div className="flex items-center gap-4">
                                                <label className="text-sm font-medium text-indigo-800">排程長度:</label>
                                                <div className="flex gap-2">
                                                    {[1, 2, 3, 4, 6].map(m => (
                                                        <button key={m} onClick={() => setRecurringMonths(m)} className={`w-10 h-10 rounded-lg font-bold text-sm transition-all ${recurringMonths === m ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-indigo-600 hover:bg-indigo-100'}`}>{m}月</button>
                                                    ))}
                                                </div>
                                            </div>
                                            <button onClick={handleAutoSchedule} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-md transition-transform active:scale-95 flex items-center justify-center">
                                                <CheckCircle className="w-5 h-5 mr-2" />
                                                生成排課預覽
                                            </button>
                                        </div>
                                    )}

                                    <div className="space-y-1.5 relative" ref={searchRef}>
                                        <label className="text-sm font-semibold text-slate-700 flex justify-between">指派學生 <span className="text-xs text-slate-400 font-normal">已選 {formLesson.studentIds?.length || 0} 位</span></label>
                                        <div className={`min-h-[56px] w-full bg-white border rounded-xl p-2 flex flex-wrap items-center gap-2 transition-all cursor-text ${showStudentDropdown && canEditLogistics ? 'ring-2 ring-blue-100 border-blue-400' : 'border-slate-200'} ${!canEditLogistics ? 'bg-gray-50 pointer-events-none' : 'hover:border-slate-300'}`} onClick={() => canEditLogistics && searchRef.current?.querySelector('input')?.focus()}>
                                            {(!formLesson.studentIds?.length && !studentSearchTerm) && <Search className="w-4 h-4 text-slate-400 ml-2" />}
                                            {formLesson.studentIds?.map(id => {
                                                const student = students.find(s => s.id === id);
                                                return (
                                                    <span key={id} className="inline-flex items-center pl-3 pr-1 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium border border-blue-100 shadow-sm">
                                                        <span className="mr-1">{student?.name}</span>
                                                        {canEditLogistics && <button onClick={(e) => { e.stopPropagation(); toggleStudent(id); }} className="hover:bg-blue-200 rounded-full p-0.5 transition-colors text-blue-400 hover:text-blue-700"><X className="w-3.5 h-3.5" /></button>}
                                                    </span>
                                                );
                                            })}
                                            <input type="text" className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400 ml-1 h-8 disabled:hidden" placeholder={formLesson.studentIds?.length ? "" : "搜尋學生..."} value={studentSearchTerm} onChange={(e) => { setStudentSearchTerm(e.target.value); setShowStudentDropdown(true); }} onFocus={() => setShowStudentDropdown(true)} disabled={!canEditLogistics} />
                                        </div>
                                        {showStudentDropdown && canEditLogistics && (
                                            <div className="absolute left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 max-h-60 overflow-y-auto z-50">
                                                {filteredStudents.length > 0 ? (
                                                    filteredStudents.map(s => (
                                                        <div key={s.id} className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 flex justify-between items-center group transition-colors" onClick={() => { toggleStudent(s.id); searchRef.current?.querySelector('input')?.focus(); }}>
                                                            <div className="flex items-center">
                                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 mr-3 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">{s.name[0]}</div>
                                                                <div><div className="font-medium text-slate-700 group-hover:text-blue-600 transition-colors">{s.name}</div><div className="text-xs text-slate-400">{s.grade}</div></div>
                                                            </div>
                                                            <div className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded group-hover:bg-white group-hover:shadow-sm">{s.phone}</div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="px-4 py-8 text-center text-sm text-slate-400 flex flex-col items-center"><Search className="w-8 h-8 mb-2 opacity-20" />{studentSearchTerm ? '找不到相符學生' : '輸入關鍵字搜尋'}</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Lesson Plan & Notes */}
                                    <div className="space-y-4 pt-4 border-t border-slate-100">
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-slate-700">課堂進度 (共同)</label>
                                            <div className="relative">
                                                <BookOpen className="absolute left-4 top-3 text-slate-400 w-4 h-4" />
                                                <textarea 
                                                    className="w-full p-3 pl-10 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none resize-none h-20 disabled:text-slate-500" 
                                                    placeholder="本堂課的教學重點、作業..."
                                                    value={formLesson.lessonPlan || ''}
                                                    onChange={e => setFormLesson({...formLesson, lessonPlan: e.target.value})}
                                                    disabled={!canEditProgress}
                                                />
                                            </div>
                                        </div>

                                        {formLesson.studentIds && formLesson.studentIds.length > 0 && (
                                            <div className="space-y-3">
                                                <label className="text-sm font-semibold text-slate-700">個別學生進度</label>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {formLesson.studentIds.map(studentId => {
                                                        const student = students.find(s => s.id === studentId);
                                                        return (
                                                            <div key={studentId} className="flex gap-2 items-start group">
                                                                <div className="mt-2 w-20 flex-shrink-0 text-xs font-bold text-slate-600 text-right truncate">
                                                                    {student?.name}
                                                                </div>
                                                                <div className="relative flex-1">
                                                                    <User className="absolute left-3 top-3 text-slate-400 w-3.5 h-3.5" />
                                                                    <textarea
                                                                        className="w-full p-2 pl-9 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none resize-none h-16 text-sm disabled:text-slate-500 disabled:bg-slate-50"
                                                                        placeholder={`針對 ${student?.name} 的個別評語...`}
                                                                        value={formLesson.studentNotes?.[studentId] || ''}
                                                                        onChange={e => {
                                                                            const newNotes = { ...(formLesson.studentNotes || {}) };
                                                                            newNotes[studentId] = e.target.value;
                                                                            setFormLesson({ ...formLesson, studentNotes: newNotes });
                                                                        }}
                                                                        disabled={!canEditProgress}
                                                                    />
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Preview (Only in Recurring Mode) */}
                            {isRecurring && (
                                <div className="w-full lg:w-2/5 p-8 bg-slate-50 flex flex-col h-full">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="font-bold text-slate-800 flex items-center">
                                            <span>預覽排課明細</span>
                                            <span className="ml-2 text-xs font-normal text-slate-500 bg-white px-2 py-1 rounded border">共 {previewLessons.length} 堂</span>
                                        </h4>
                                        {/* Batch Teacher Selector */}
                                        {previewLessons.length > 0 && (
                                            <BatchTeacherSelector 
                                                teachers={sortedTeachers} 
                                                onApply={handleBatchTeacherApply} 
                                            />
                                        )}
                                    </div>
                                    
                                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                                        {previewLessons.length > 0 ? previewLessons.map((lesson, idx) => (
                                            <PreviewLessonItem 
                                                key={lesson.id}
                                                lesson={lesson}
                                                index={idx}
                                                teachers={teachers}
                                                students={students}
                                                availabilities={availabilities}
                                                canViewFinancials={canViewFinancials}
                                                isTeacherAvailable={isTeacherAvailable}
                                                onTeacherChange={handlePreviewTeacherChange}
                                            />
                                        )) : (
                                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                                <CalendarDays className="w-12 h-12 mb-3 opacity-20" />
                                                <p>尚未生成預覽</p>
                                                <p className="text-xs mt-2">請設定左側條件並點擊「生成排課預覽」</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                             <div>
                                {editingLessonId && canEditLogistics && (
                                    <button onClick={handleTriggerDelete} className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center px-3 py-2 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4 mr-2" />刪除課程</button>
                                )}
                             </div>
                             
                             <div className="flex flex-col items-end gap-2">
                                {formMessage && (
                                    <div className={`text-sm font-medium ${formMessage.type === 'error' ? 'text-red-600' : (formMessage.type === 'warning' ? 'text-amber-600' : 'text-emerald-600')} animate-in fade-in slide-in-from-bottom-1`}>
                                        {formMessage.type === 'warning' && <AlertTriangle className="inline w-4 h-4 mr-1" />}
                                        {formMessage.type === 'success' && <CheckCircle className="inline w-4 h-4 mr-1" />}
                                        {formMessage.type === 'error' && <AlertTriangle className="inline w-4 h-4 mr-1" />}
                                        {formMessage.text}
                                    </div>
                                )}
                                <div className="flex space-x-3">
                                    {editingLessonId && canEditProgress && (
                                        <button onClick={() => setFormLesson({...formLesson, isCompleted: !formLesson.isCompleted})} className={`px-5 py-2.5 rounded-xl font-medium flex items-center transition-all ${formLesson.isCompleted ? 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50' : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 ring-2 ring-green-100 shadow-sm'}`}>{formLesson.isCompleted ? <XCircle className="w-4 h-4 mr-2"/> : <CheckCircle className="w-4 h-4 mr-2"/>}{formLesson.isCompleted ? '標記未完成' : '標記完成'}</button>
                                    )}
                                    <button onClick={handleCloseModal} className="px-5 py-2.5 text-slate-600 hover:bg-slate-200 rounded-xl transition-colors font-medium">{(readOnly && !canEditProgress) || strictReadOnly ? '關閉' : '取消'}</button>
                                    {canEditProgress && (
                                        <button onClick={handleSave} className="px-8 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all font-medium transform active:scale-95">{editingLessonId ? '儲存變更' : (isRecurring ? `確定排定 ${previewLessons.length} 堂` : '確定排課')}</button>
                                    )}
                                </div>
                             </div>
                        </div>
                    </div>
                </div>
            )}

             {/* Availability Modal */}
            {showAvailabilityModal && editingAvailability && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-in zoom-in-95 duration-200 overflow-hidden">
                        {/* ... (Existing availability modal content) ... */}
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-emerald-50">
                            <div>
                                <h3 className="text-lg font-bold text-emerald-800">管理空檔時間</h3>
                                <p className="text-xs text-emerald-600 mt-0.5">{editingAvailability.date}</p>
                            </div>
                            <button onClick={() => setShowAvailabilityModal(false)}><X className="w-5 h-5 text-emerald-700 hover:text-emerald-900" /></button>
                        </div>
                        
                        <div className="p-6">
                            {/* Existing Slots */}
                            <div className="space-y-3 mb-6">
                                <label className="text-sm font-semibold text-slate-700 flex justify-between items-center">
                                    已登記時段
                                    <span className="text-xs font-normal text-slate-500">共 {tempTimeSlots.length} 個時段</span>
                                </label>
                                {tempTimeSlots.length > 0 ? (
                                    <div className="max-h-48 overflow-y-auto custom-scrollbar border border-slate-100 rounded-xl p-2 bg-slate-50 space-y-2">
                                        {tempTimeSlots.map((slot, idx) => (
                                            <div key={idx} className={`flex justify-between items-center px-3 py-2 rounded-lg border transition-colors ${editingSlotIndex === idx ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'}`}>
                                                <span className={`font-medium ${editingSlotIndex === idx ? 'text-emerald-700' : 'text-slate-700'}`}>
                                                    {formatTimeWithPeriod(slot.start)} - {formatTimeWithPeriod(slot.end)}
                                                </span>
                                                <div className="flex items-center space-x-1">
                                                    <button 
                                                        onClick={() => handleEditSlot(idx)} 
                                                        className={`p-1.5 rounded-md transition-colors ${editingSlotIndex === idx ? 'text-emerald-600 bg-emerald-100' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`}
                                                        disabled={editingSlotIndex !== null && editingSlotIndex !== idx}
                                                    >
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleRemoveSlot(idx)} 
                                                        className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-md transition-colors"
                                                        disabled={editingSlotIndex !== null && editingSlotIndex !== idx}
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 text-slate-400 text-sm border border-dashed border-slate-200 rounded-lg">
                                        尚無登記時段
                                    </div>
                                )}
                            </div>

                            {/* Add/Edit Slot Input Area */}
                            <div className="space-y-3 pt-4 border-t border-slate-100">
                                <label className="text-sm font-semibold text-slate-700 flex items-center">
                                    {editingSlotIndex !== null ? (
                                        <span className="text-emerald-600 flex items-center"><Edit2 className="w-3 h-3 mr-1"/> 編輯時段</span>
                                    ) : (
                                        <span className="flex items-center"><Plus className="w-3 h-3 mr-1"/> 新增時段</span>
                                    )}
                                </label>
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="time" 
                                        value={newSlotStart} 
                                        onChange={e => { setNewSlotStart(e.target.value); setSlotError(''); }}
                                        className={`flex-1 h-10 px-3 border rounded-lg outline-none focus:ring-2 transition-all ${editingSlotIndex !== null ? 'border-emerald-300 focus:ring-emerald-500 bg-emerald-50/30' : 'border-slate-300 focus:ring-emerald-500'}`}
                                    />
                                    <span className="text-slate-400">-</span>
                                    <input 
                                        type="time" 
                                        value={newSlotEnd} 
                                        onChange={e => { setNewSlotEnd(e.target.value); setSlotError(''); }}
                                        className={`flex-1 h-10 px-3 border rounded-lg outline-none focus:ring-2 transition-all ${editingSlotIndex !== null ? 'border-emerald-300 focus:ring-emerald-500 bg-emerald-50/30' : 'border-slate-300 focus:ring-emerald-500'}`}
                                    />
                                    
                                    {editingSlotIndex !== null ? (
                                        <>
                                            <button 
                                                onClick={handleSaveSlotInput}
                                                disabled={!newSlotStart || !newSlotEnd}
                                                className="h-10 w-10 flex items-center justify-center bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-slate-200 disabled:cursor-not-allowed transition-colors shadow-sm"
                                                title="更新時段"
                                            >
                                                <Check className="w-5 h-5" />
                                            </button>
                                            <button 
                                                onClick={handleCancelEdit}
                                                className="h-10 w-10 flex items-center justify-center bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 transition-colors"
                                                title="取消編輯"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </>
                                    ) : (
                                        <button 
                                            onClick={handleSaveSlotInput}
                                            disabled={!newSlotStart || !newSlotEnd}
                                            className="h-10 w-10 flex items-center justify-center bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:bg-slate-200 disabled:cursor-not-allowed transition-colors shadow-sm"
                                            title="新增時段"
                                        >
                                            <Plus className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                                {slotError && (
                                    <div className="text-red-500 text-xs flex items-center animate-in fade-in slide-in-from-top-1 font-medium bg-red-50 p-2 rounded-lg border border-red-100">
                                        <AlertTriangle className="w-3 h-3 mr-1.5 flex-shrink-0" />
                                        {slotError}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-slate-100">
                            <button onClick={() => setShowAvailabilityModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors font-medium">關閉</button>
                            <button onClick={handleSaveAvailability} className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-sm transition-colors font-medium">儲存設定</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Text Note Modal (Large Modal) */}
            {showNoteModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl h-[80vh] animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col">
                        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-yellow-50">
                             <div>
                                <h3 className="text-2xl font-bold text-yellow-800 flex items-center">
                                    <StickyNote className="w-6 h-6 mr-2" />
                                    文字行事曆
                                </h3>
                                <p className="text-sm text-yellow-600 mt-1">{currentNoteDate}</p>
                            </div>
                            <button onClick={() => setShowNoteModal(false)}><X className="w-6 h-6 text-yellow-700 hover:text-yellow-900" /></button>
                        </div>
                        
                        <div className="flex-1 p-8 bg-white flex flex-col">
                            <textarea 
                                className="w-full h-full p-6 text-lg text-slate-700 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none resize-none leading-relaxed shadow-inner"
                                placeholder="在此輸入當日的行程備忘、重要事項或任何文字紀錄..."
                                value={currentNoteContent}
                                onChange={(e) => setCurrentNoteContent(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className="px-8 py-5 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
                            <button onClick={() => setShowNoteModal(false)} className="px-6 py-3 text-slate-600 hover:bg-slate-200 rounded-xl transition-colors font-medium text-lg">取消</button>
                            <button onClick={handleSaveNote} className="px-8 py-3 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 shadow-lg shadow-yellow-500/30 transition-colors font-bold text-lg flex items-center">
                                <Save className="w-5 h-5 mr-2" />
                                儲存紀錄
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};