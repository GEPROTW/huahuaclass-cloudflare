
import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { CalendarView } from './components/CalendarView';
import { StudentList } from './components/StudentList';
import { PayrollView } from './components/PayrollView';
import { TeacherList } from './components/TeacherList';
import { ReportView } from './components/ReportView';
import { SystemInit } from './components/SystemInit';
import { ExpenseView } from './components/ExpenseView';
import { SalesView } from './components/SalesView';
import { LoginView } from './components/LoginView';
import { UserManagement } from './components/UserManagement';
import { OfficialWebsite } from './components/OfficialWebsite';
import { InquiryView } from './components/InquiryView';
import { WebsiteSettings } from './components/WebsiteSettings'; // Import New Component
import { 
    DEFAULT_ADMIN_USER, 
    DEFAULT_SYSTEM_CONFIG 
} from './constants';
import { Lesson, Student, Teacher, Expense, Sale, AppUser, ModuleId, MODULE_NAMES, Permission, Availability, AppSettings, SystemConfig, CalendarNote, ClearDataOptions, Inquiry } from './types';
import { ShieldAlert, Menu, Loader2, Database, Wrench, Activity, Cloud, Monitor } from 'lucide-react';

// Local DB Service (Simulating Cloudflare D1)
import { db } from './services/db';

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('isSidebarOpen');
    if (saved !== null) return saved === 'true';
    return window.innerWidth >= 1280;
  });

  useEffect(() => {
    localStorage.setItem('isSidebarOpen', String(isSidebarOpen));
  }, [isSidebarOpen]);

  // System Settings State (Font Size, Spacing)
  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
      const saved = localStorage.getItem('appSettings');
      return saved ? JSON.parse(saved) : { fontSizeScale: 1, spacingMode: 'normal' };
  });

  // Global System Configuration
  const [systemConfig, setSystemConfig] = useState<SystemConfig>(DEFAULT_SYSTEM_CONFIG);

  // Apply Font Size Effect
  useEffect(() => {
      document.documentElement.style.fontSize = `${appSettings.fontSizeScale * 100}%`;
      localStorage.setItem('appSettings', JSON.stringify(appSettings));
  }, [appSettings]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auth State
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
      const saved = localStorage.getItem('currentUser');
      return saved ? JSON.parse(saved) : null;
  });

  // Impersonation State
  const [originalAdmin, setOriginalAdmin] = useState<AppUser | null>(null);

  // Test Mode State
  const [isTestMode, setIsTestMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('isTestMode');
    return saved === 'true';
  });

  // SYNC DB MODE: Ensure db service knows which tables to use
  useEffect(() => {
      db.setMode(isTestMode ? 'test' : 'production');
  }, [isTestMode]);

  // Data State
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [calendarNotes, setCalendarNotes] = useState<CalendarNote[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isRepairing, setIsRepairing] = useState(false);
  const [diagnosisMsg, setDiagnosisMsg] = useState<string | null>(null);

  // --- Data Loading ---
  const loadData = useCallback(async () => {
      setLoading(true);
      setLoadError(null);
      setDiagnosisMsg(null);

      // Failsafe Timeout
      const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Connection Timeout")), 15000)
      );

      try {
          // Initialize DB
          await Promise.race([
              db.initializeData(),
              timeoutPromise
          ]);
          
          const [s, t, l, e, sa, u, av, cn, inq, config] = await Promise.all([
              db.getCollection('students'),
              db.getCollection('teachers'),
              db.getCollection('lessons'),
              db.getCollection('expenses'),
              db.getCollection('sales'),
              db.getCollection('users'),
              db.getCollection('availabilities'),
              db.getCollection('calendar_notes'),
              db.getCollection('inquiries'),
              db.getSystemConfig()
          ]);

          setStudents(s);
          setTeachers(t);
          setLessons(l);
          setExpenses(e);
          setSales(sa);
          setUsers(u);
          setAvailabilities(av);
          setCalendarNotes(cn);
          setInquiries(inq);
          if (config) {
             setSystemConfig(config); 
          } else {
             setSystemConfig(DEFAULT_SYSTEM_CONFIG);
          }
      } catch (err: any) {
          console.error("Failed to load data", err);
          if (err.message === "Connection Timeout") {
              setLoadError("連線逾時 (請檢查網路或 Cloudflare 狀態)");
          } else {
              setLoadError("資料庫讀取失敗");
          }
      } finally {
          setLoading(false);
      }
  }, []);

  useEffect(() => {
      loadData();
  }, [loadData, isTestMode]);

  const handleRepairDatabase = async () => {
      setIsRepairing(true);
      setDiagnosisMsg("正在初始化資料庫...");
      try {
          await db.initializeData(true);
          alert("資料庫初始化成功！即將重新載入...");
          window.location.reload();
      } catch (e: any) {
          alert(`修復失敗: ${e.message}`);
          setDiagnosisMsg(`修復失敗: ${e.message}`);
      } finally {
          setIsRepairing(false);
      }
  };

  const handleHealthCheck = async () => {
      setDiagnosisMsg("正在診斷連線...");
      const result = await db.checkHealth();
      setDiagnosisMsg(result.message);
  };

  const handleToggleTestMode = () => {
    const newMode = !isTestMode;
    setIsTestMode(newMode);
    localStorage.setItem('isTestMode', String(newMode));
    db.setMode(newMode ? 'test' : 'production'); 
    loadData();
  };

  const handleLogin = (user: AppUser) => {
      setCurrentUser(user);
      setOriginalAdmin(null); 
      localStorage.setItem('currentUser', JSON.stringify(user));
      if (user.settings) setAppSettings(user.settings);
      navigate('/admin/dashboard');
  };

  const handleLogout = () => {
      setCurrentUser(null);
      setOriginalAdmin(null);
      localStorage.removeItem('currentUser');
      navigate('/login');
  };

  const handleImpersonate = (targetUser: AppUser) => {
      if (!currentUser || currentUser.role !== 'admin') return;
      setOriginalAdmin(currentUser);
      setCurrentUser(targetUser);
      if (targetUser.settings) setAppSettings(targetUser.settings);
      navigate('/admin/dashboard');
  };

  const handleStopImpersonation = () => {
      if (originalAdmin) {
          setCurrentUser(originalAdmin);
          setOriginalAdmin(null);
          if (originalAdmin.settings) setAppSettings(originalAdmin.settings);
          navigate('/admin/dashboard');
      }
  };

  // --- CRUD Handlers ---
  const createCRUDHandlers = <T extends { id: string }>(
      collectionName: string, 
      setState: React.Dispatch<React.SetStateAction<T[]>>
  ) => ({
      add: async (item: T) => {
          const newData = await db.add(collectionName, item);
          setState(newData);
      },
      update: async (item: T) => {
          const newData = await db.update(collectionName, item);
          setState(newData);
      },
      delete: async (id: string) => {
          const newData = await db.delete(collectionName, id);
          setState(newData);
      },
      set: async (item: T) => {
          const existing = await db.getCollection(collectionName);
          const index = existing.findIndex((i:any) => i.id === item.id);
          if (index >= 0) {
              const newData = await db.update(collectionName, item);
              setState(newData);
          } else {
              const newData = await db.add(collectionName, item);
              setState(newData);
          }
      }
  });

  const studentCRUD = createCRUDHandlers<Student>('students', setStudents);
  const lessonCRUD = createCRUDHandlers<Lesson>('lessons', setLessons);
  const expenseCRUD = createCRUDHandlers<Expense>('expenses', setExpenses);
  const salesCRUD = createCRUDHandlers<Sale>('sales', setSales);
  const userCRUD = createCRUDHandlers<AppUser>('users', setUsers);
  const availabilityCRUD = createCRUDHandlers<Availability>('availabilities', setAvailabilities);
  const calendarNoteCRUD = createCRUDHandlers<CalendarNote>('calendar_notes', setCalendarNotes);
  const inquiryCRUD = createCRUDHandlers<Inquiry>('inquiries', setInquiries);

  const handleSaveSettings = async () => {
      if (currentUser) {
          const updatedUser = { ...currentUser, settings: appSettings };
          await userCRUD.update(updatedUser);
          setCurrentUser(updatedUser);
          localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      }
  };

  const handleUpdateSystemConfig = async (newConfig: SystemConfig) => {
      await db.saveSystemConfig(newConfig);
      setSystemConfig(newConfig);
  };

  // Specialized Teacher CRUD to sync with Users
  const teacherCRUD = {
      add: async (teacher: Teacher) => {
          const newTeachers = await db.add('teachers', teacher);
          setTeachers(newTeachers);

          const defaultPermissions: Record<ModuleId, Permission> = Object.keys(MODULE_NAMES).reduce((acc, key) => {
            acc[key as ModuleId] = { view: false, edit: false };
            return acc;
          }, {} as Record<ModuleId, Permission>);
          
          defaultPermissions.dashboard = { view: true, edit: false };
          defaultPermissions.calendar = { view: true, edit: false };
          defaultPermissions.students = { view: true, edit: false };
          defaultPermissions.payroll = { view: true, edit: false };
          defaultPermissions.settings = { view: true, edit: false };

          const newUser: AppUser = {
              id: `user-${teacher.id}`,
              username: teacher.name,
              password: '123456',
              name: teacher.name,
              role: 'staff',
              isFirstLogin: true,
              permissions: defaultPermissions,
              teacherId: teacher.id
          };
          
          const newUsers = await db.add('users', newUser);
          setUsers(newUsers);
      },
      update: async (teacher: Teacher) => {
          const newTeachers = await db.update('teachers', teacher);
          setTeachers(newTeachers);

          const linkedUser = users.find(u => u.teacherId === teacher.id);
          if (linkedUser) {
              const updatedUser = { ...linkedUser, name: teacher.name };
              const newUsers = await db.update('users', updatedUser);
              setUsers(newUsers);
          }
      },
      delete: async (id: string) => {
          const newTeachers = await db.delete('teachers', id);
          setTeachers(newTeachers);

          const linkedUser = users.find(u => u.teacherId === id);
          if (linkedUser) {
              const newUsers = await db.delete('users', linkedUser.id);
              setUsers(newUsers);
          }
      }
  };

  const handleReset = async () => {
      setLoading(true);
      await db.initializeData(true); 
      await loadData();
      alert("系統已重置為預設範例資料。");
  };

  const handleClearAll = async (options: ClearDataOptions) => {
      setLoading(true);
      await db.clearAllData(options);
      
      if (options.teachers) {
           const currentUsers = await db.getCollection('users');
           if (!currentUsers.find((u:AppUser) => u.id === DEFAULT_ADMIN_USER.id)) {
               await db.add('users', DEFAULT_ADMIN_USER);
           }
      }
      
      await loadData();
      alert("所選資料已清除。");
  };

  const checkPermission = (moduleId: ModuleId): { canView: boolean; canEdit: boolean } => {
      if (!currentUser) return { canView: false, canEdit: false };
      if (currentUser.role === 'admin') return { canView: true, canEdit: true };
      const perm = currentUser.permissions[moduleId];
      return { canView: !!perm?.view, canEdit: !!perm?.edit };
  };

  const renderContent = (tab: string) => {
    const { canView, canEdit } = checkPermission(tab as ModuleId);
    
    if (!canView) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <ShieldAlert className="w-12 h-12 mb-4" />
                <h3 className="text-xl font-bold text-slate-600">存取被拒</h3>
                <p>您沒有權限檢視此頁面。</p>
            </div>
        );
    }
    
    const readOnly = !canEdit;

    switch (tab) {
        case 'dashboard':
            return <Dashboard lessons={lessons} students={students} teachers={teachers} onUpdateLesson={lessonCRUD.update} currentUser={currentUser} systemConfig={systemConfig} />;
        case 'calendar':
            return <CalendarView 
                lessons={lessons} teachers={teachers} students={students} availabilities={availabilities} calendarNotes={calendarNotes}
                onAddLesson={lessonCRUD.add} onUpdateLesson={lessonCRUD.update} onDeleteLesson={lessonCRUD.delete} 
                onUpdateAvailability={availabilityCRUD.update}
                onAddAvailability={availabilityCRUD.add}
                onSaveCalendarNote={calendarNoteCRUD.set}
                readOnly={readOnly}
                currentUser={currentUser}
                systemConfig={systemConfig}
            />;
        case 'inquiries':
            return <InquiryView 
                inquiries={inquiries}
                onUpdateInquiry={inquiryCRUD.update}
                readOnly={readOnly}
                currentUser={currentUser!}
            />;
        case 'students':
            return <StudentList 
                students={students} lessons={lessons} teachers={teachers}
                onUpdateStudent={studentCRUD.update} onAddStudent={studentCRUD.add} onDeleteStudent={studentCRUD.delete}
                readOnly={readOnly}
                currentUser={currentUser}
                systemConfig={systemConfig}
            />;
        case 'teachers':
            return <TeacherList 
                teachers={teachers} 
                onAddTeacher={teacherCRUD.add} onUpdateTeacher={teacherCRUD.update} onDeleteTeacher={teacherCRUD.delete}
                readOnly={readOnly}
            />;
        case 'expenses':
            return <ExpenseView 
                expenses={expenses}
                onAddExpense={expenseCRUD.add} onUpdateExpense={expenseCRUD.update} onDeleteExpense={expenseCRUD.delete}
                readOnly={readOnly}
                categories={systemConfig.expenseCategories}
            />;
        case 'sales':
            return <SalesView 
                sales={sales} students={students}
                onAddSale={salesCRUD.add} onUpdateSale={salesCRUD.update} onDeleteSale={salesCRUD.delete}
                readOnly={readOnly}
            />;
        case 'payroll':
            return <PayrollView lessons={lessons} teachers={teachers} currentUser={currentUser} systemConfig={systemConfig} />;
        case 'reports':
            return <ReportView lessons={lessons} teachers={teachers} students={students} systemConfig={systemConfig} />;
        case 'users':
            return <UserManagement 
                users={users} 
                onAddUser={userCRUD.add} onUpdateUser={userCRUD.update} onDeleteUser={userCRUD.delete}
                currentUser={currentUser!}
            />;
        case 'settings':
            return <SystemInit 
                onReset={handleReset} 
                onClearAll={handleClearAll} 
                isTestMode={isTestMode} 
                appSettings={appSettings}
                onUpdateSettings={setAppSettings}
                onSaveSettings={handleSaveSettings}
                systemConfig={systemConfig}
                onUpdateSystemConfig={handleUpdateSystemConfig}
                currentUser={currentUser}
            />;
        case 'website': // New Case
            return <WebsiteSettings 
                systemConfig={systemConfig} 
                onUpdateSystemConfig={handleUpdateSystemConfig}
                teachers={teachers}
            />;
        default:
            return <Dashboard lessons={lessons} students={students} teachers={teachers} systemConfig={systemConfig} />;
    }
  };

  const getSpacingClass = () => {
      switch (appSettings.spacingMode) {
          case 'compact': return 'p-2 md:p-3';
          case 'comfortable': return 'p-6 md:p-10';
          default: return 'p-4 md:p-6'; 
      }
  };

  if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 flex-col">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
            <p className="text-slate-500 font-medium">系統載入中...</p>
            <p className="text-slate-400 text-xs mt-2">連線 Cloudflare D1 資料庫</p>
        </div>
      );
  }

  const usersForLogin = users.length > 0 ? users : [DEFAULT_ADMIN_USER];

  return (
    <Routes>
        {/* Public Website */}
        <Route path="/" element={
            <OfficialWebsite 
                teachers={teachers} 
                systemConfig={systemConfig} 
                onGoToLogin={() => navigate('/login')} 
                onAddInquiry={inquiryCRUD.add}
            />
        } />

        {/* Login Page */}
        <Route path="/login" element={
            !currentUser ? (
                <div className="relative">
                    {loadError && (
                        <div className="absolute top-4 left-0 right-0 z-50 flex justify-center px-4">
                            <div className="bg-amber-50 border border-amber-200 text-amber-800 px-6 py-4 rounded-2xl shadow-lg flex flex-col items-center max-w-lg">
                                <div className="flex items-center mb-3">
                                    <Database className="w-5 h-5 mr-3 flex-shrink-0 text-amber-600" />
                                    <span className="text-base font-bold">{loadError}</span>
                                </div>
                                <p className="text-sm text-amber-700 mb-4 text-center">
                                    {diagnosisMsg ? diagnosisMsg : "無法讀取資料表。這通常是因為這是第一次部署，資料庫還是空的，或者API尚未啟動。"}
                                </p>
                                <div className="flex gap-3">
                                    <button 
                                        onClick={handleRepairDatabase}
                                        disabled={isRepairing}
                                        className="bg-amber-600 text-white px-4 py-2 rounded-lg font-bold flex items-center hover:bg-amber-700 transition-colors disabled:opacity-50"
                                    >
                                        {isRepairing ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Wrench className="w-4 h-4 mr-2"/>}
                                        {isRepairing ? '修復中...' : '一鍵初始化資料庫'}
                                    </button>
                                    <button 
                                        onClick={handleHealthCheck}
                                        className="bg-white border border-amber-300 text-amber-700 px-4 py-2 rounded-lg font-bold hover:bg-amber-50 flex items-center transition-colors"
                                    >
                                        <Activity className="w-4 h-4 mr-2"/>
                                        診斷連線
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    <LoginView 
                        users={usersForLogin} 
                        onLogin={handleLogin} 
                        onUpdateUser={userCRUD.update} 
                        systemConfig={systemConfig} 
                        onBack={() => navigate('/')}
                    />
                </div>
            ) : (
                <Navigate to="/admin/dashboard" replace />
            )
        } />

        {/* Admin Dashboard Routes */}
        <Route path="/admin/*" element={
            currentUser ? (
                <div className="min-h-screen bg-gray-50 flex font-sans">
                    <Sidebar 
                        currentTab={location.pathname.split('/')[2] || 'dashboard'} 
                        setCurrentTab={(tab) => navigate(`/admin/${tab}`)} 
                        isTestMode={isTestMode} onToggleTestMode={handleToggleTestMode}
                        currentUser={currentUser} onLogout={handleLogout}
                        onUpdateUser={userCRUD.update}
                        isOpen={isSidebarOpen}
                        setIsOpen={setIsSidebarOpen}
                        users={users}
                        originalAdmin={originalAdmin}
                        onImpersonate={handleImpersonate}
                        onStopImpersonation={handleStopImpersonation}
                        systemConfig={systemConfig}
                    />
                    
                    <main className={`flex-1 ${getSpacingClass()} overflow-y-auto h-screen transition-all duration-300 ${isSidebarOpen ? 'md:ml-64' : 'ml-0 md:ml-20'}`}>
                        <header className="mb-6 flex items-center justify-between md:hidden">
                            <div className="flex items-center">
                                <button 
                                    onClick={() => setIsSidebarOpen(true)}
                                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-700 mr-3"
                                >
                                    <Menu className="w-6 h-6" />
                                </button>
                                <h1 className="text-xl font-bold text-gray-800">{systemConfig.appInfo.sidebarTitle}</h1>
                            </div>
                        </header>

                        <Routes>
                            <Route path=":tab" element={<TabContentWrapper renderContent={renderContent} />} />
                            <Route path="" element={<Navigate to="dashboard" replace />} />
                        </Routes>
                    </main>
                </div>
            ) : (
                <Navigate to="/login" replace />
            )
        } />
        
        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// Helper component to extract params and render content
const TabContentWrapper = ({ renderContent }: { renderContent: (tab: string) => React.ReactNode }) => {
    const { tab } = useParams();
    return <>{renderContent(tab || 'dashboard')}</>;
};

export default App;
