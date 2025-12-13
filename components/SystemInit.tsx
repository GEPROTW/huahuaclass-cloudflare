
import React, { useState } from 'react';
import { AlertTriangle, RefreshCw, Trash2, Database, X, Loader2, Settings, Monitor, Layout, Type, Save, List, Plus, Music, Tag, Edit, Type as TypeIcon, CheckSquare, Square, Calendar as CalendarIcon, Cloud, Wrench } from 'lucide-react';
import { AppUser, AppSettings, SystemConfig, ClearDataOptions } from '../types';
import { db } from '../services/db'; // Import db service directly for patching

interface SystemInitProps {
    onReset: () => Promise<void>;
    onClearAll: (options: ClearDataOptions) => Promise<void>;
    isTestMode: boolean;
    appSettings: AppSettings;
    onUpdateSettings: (settings: AppSettings) => void;
    onSaveSettings: () => Promise<void>;
    systemConfig: SystemConfig;
    onUpdateSystemConfig: (config: SystemConfig) => void;
    currentUser?: AppUser | null;
}

export const SystemInit: React.FC<SystemInitProps> = ({ 
    onReset, onClearAll, isTestMode, appSettings, onUpdateSettings, onSaveSettings,
    systemConfig, onUpdateSystemConfig, currentUser
}) => {
    const [activeTab, setActiveTab] = useState<'ui' | 'custom' | 'db'>('ui');
    const [confirmType, setConfirmType] = useState<'reset' | 'clear' | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<string | null>(null);
    const [patchMessage, setPatchMessage] = useState<string | null>(null);

    // Clear Selection State
    const [clearOptions, setClearOptions] = useState<ClearDataOptions>({
        students: true,
        teachers: true,
        lessons: true,
        finances: true,
        calendar: true,
        settings: false
    });
    
    const [useDateFilter, setUseDateFilter] = useState(false);
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
        end: new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0]
    });

    // Custom Config State
    const [newSubject, setNewSubject] = useState('');
    const [newExpenseCat, setNewExpenseCat] = useState('');
    
    const [newClassTypeId, setNewClassTypeId] = useState('');
    const [newClassTypeName, setNewClassTypeName] = useState('');

    const [appInfoForm, setAppInfoForm] = useState(systemConfig.appInfo);

    const isAdmin = currentUser?.role === 'admin';

    const handleConfirm = async () => {
        setIsProcessing(true);
        // Simulate a slight network delay for Cloudflare D1 feeling
        await new Promise(resolve => setTimeout(resolve, 800));
        
        if (confirmType === 'reset') {
            await onReset();
        } else if (confirmType === 'clear') {
            await onClearAll({
                ...clearOptions,
                useDateFilter,
                startDate: dateRange.start,
                endDate: dateRange.end
            });
        }
        setIsProcessing(false);
        setConfirmType(null);
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSaveMessage(null);
        try {
            await onSaveSettings();
            setSaveMessage("設定已儲存");
            setTimeout(() => setSaveMessage(null), 3000);
        } catch (e) {
            setSaveMessage("儲存失敗");
        } finally {
            setIsSaving(false);
        }
    };
    
    const handlePatchSchema = async () => {
        setIsProcessing(true);
        setPatchMessage("修復中...");
        try {
            const res = await db.runMigration();
            setPatchMessage(res.success ? "修復成功！官網設定功能已啟用。" : `修復失敗: ${res.error}`);
        } catch (e: any) {
            setPatchMessage(`連線錯誤: ${e.message}`);
        } finally {
            setIsProcessing(false);
            setTimeout(() => setPatchMessage(null), 5000);
        }
    };

    const handleFontSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onUpdateSettings({
            ...appSettings,
            fontSizeScale: parseFloat(e.target.value)
        });
    };

    const handleSpacingChange = (mode: AppSettings['spacingMode']) => {
        onUpdateSettings({
            ...appSettings,
            spacingMode: mode
        });
    };

    const handleAddSubject = () => {
        if (!newSubject.trim()) return;
        if (systemConfig.subjects.includes(newSubject.trim())) return;
        
        onUpdateSystemConfig({
            ...systemConfig,
            subjects: [...systemConfig.subjects, newSubject.trim()]
        });
        setNewSubject('');
    };

    const handleRemoveSubject = (index: number) => {
        const newSubjects = [...systemConfig.subjects];
        newSubjects.splice(index, 1);
        onUpdateSystemConfig({
            ...systemConfig,
            subjects: newSubjects
        });
    };

    const handleAddExpenseCat = () => {
        if (!newExpenseCat.trim()) return;
        if (systemConfig.expenseCategories.includes(newExpenseCat.trim())) return;

        onUpdateSystemConfig({
            ...systemConfig,
            expenseCategories: [...systemConfig.expenseCategories, newExpenseCat.trim()]
        });
        setNewExpenseCat('');
    };

    const handleRemoveExpenseCat = (index: number) => {
        const newCats = [...systemConfig.expenseCategories];
        newCats.splice(index, 1);
        onUpdateSystemConfig({
            ...systemConfig,
            expenseCategories: newCats
        });
    };

    const handleAddClassType = () => {
        if (!newClassTypeId.trim() || !newClassTypeName.trim()) return;
        if (systemConfig.classTypes.some(ct => ct.id === newClassTypeId.trim())) {
             alert("ID 已存在");
             return;
        }

        onUpdateSystemConfig({
            ...systemConfig,
            classTypes: [...systemConfig.classTypes, { id: newClassTypeId.trim().toUpperCase(), name: newClassTypeName.trim() }]
        });
        setNewClassTypeId('');
        setNewClassTypeName('');
    };

    const handleRemoveClassType = (index: number) => {
        const newTypes = [...systemConfig.classTypes];
        newTypes.splice(index, 1);
        onUpdateSystemConfig({
            ...systemConfig,
            classTypes: newTypes
        });
    };
    
    const handleSaveAppInfo = () => {
        onUpdateSystemConfig({
            ...systemConfig,
            appInfo: appInfoForm
        });
    };

    const toggleClearOption = (key: keyof ClearDataOptions) => {
        setClearOptions(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 relative">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-slate-800">系統設定</h2>
                <p className="text-slate-500 mt-2">自訂您的操作介面{isAdmin && "、系統參數或管理資料庫"}</p>
            </div>

            {isAdmin && (
                <div className="flex justify-center mb-8">
                    <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm inline-flex">
                        <button
                            onClick={() => setActiveTab('ui')}
                            className={`flex items-center px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'ui' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                        >
                            <Monitor className="w-4 h-4 mr-2" />
                            介面與品牌
                        </button>
                        <button
                            onClick={() => setActiveTab('custom')}
                            className={`flex items-center px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'custom' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                        >
                            <List className="w-4 h-4 mr-2" />
                            自訂參數
                        </button>
                        <button
                            onClick={() => setActiveTab('db')}
                            className={`flex items-center px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'db' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                        >
                            <Database className="w-4 h-4 mr-2" />
                            資料庫管理
                        </button>
                    </div>
                </div>
            )}

            {(activeTab === 'ui' || !isAdmin) && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {/* ... (Existing UI content unchanged) ... */}
                    {isAdmin && (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                 <div>
                                    <h3 className="text-lg font-bold text-slate-800 flex items-center">
                                        <TypeIcon className="w-5 h-5 mr-2 text-indigo-600" />
                                        品牌標題設定
                                    </h3>
                                    <p className="text-sm text-slate-500 mt-1">自訂登入頁面與側邊欄的標題文字。</p>
                                </div>
                            </div>
                             <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h4 className="font-bold text-slate-700 border-b border-slate-100 pb-2">登入頁面</h4>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-1">主標題</label>
                                        <input 
                                            type="text" 
                                            value={appInfoForm.loginTitle}
                                            onChange={(e) => setAppInfoForm({...appInfoForm, loginTitle: e.target.value})}
                                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-1">副標題 (描述)</label>
                                        <input 
                                            type="text" 
                                            value={appInfoForm.loginSubtitle}
                                            onChange={(e) => setAppInfoForm({...appInfoForm, loginSubtitle: e.target.value})}
                                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h4 className="font-bold text-slate-700 border-b border-slate-100 pb-2">側邊選單</h4>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-1">選單標題</label>
                                        <input 
                                            type="text" 
                                            value={appInfoForm.sidebarTitle}
                                            onChange={(e) => setAppInfoForm({...appInfoForm, sidebarTitle: e.target.value})}
                                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-1">選單副標</label>
                                        <input 
                                            type="text" 
                                            value={appInfoForm.sidebarSubtitle}
                                            onChange={(e) => setAppInfoForm({...appInfoForm, sidebarSubtitle: e.target.value})}
                                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                </div>
                                <div className="md:col-span-2 flex justify-end">
                                    <button 
                                        onClick={handleSaveAppInfo}
                                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold text-sm"
                                    >
                                        更新品牌設定
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 flex items-center">
                                    <Settings className="w-5 h-5 mr-2 text-blue-600" />
                                    介面參數設定
                                </h3>
                                <p className="text-sm text-slate-500 mt-1">調整字體大小與版面邊界。</p>
                            </div>
                        </div>

                        <div className="p-8 space-y-8">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="font-bold text-slate-700 flex items-center">
                                        <Type className="w-5 h-5 mr-2 text-slate-400" />
                                        字體大小縮放
                                    </label>
                                    <span className="text-sm font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">
                                        {(appSettings.fontSizeScale * 100).toFixed(0)}%
                                    </span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0.85" 
                                    max="1.15" 
                                    step="0.05" 
                                    value={appSettings.fontSizeScale}
                                    onChange={handleFontSizeChange}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                                <div className="flex justify-between text-xs text-slate-400 font-medium">
                                    <span>小 (85%)</span>
                                    <span>預設 (100%)</span>
                                    <span>大 (115%)</span>
                                </div>
                            </div>

                            <div className="w-full h-px bg-slate-100"></div>

                            <div className="space-y-4">
                                <label className="font-bold text-slate-700 flex items-center">
                                    <Layout className="w-5 h-5 mr-2 text-slate-400" />
                                    UI 邊界與間距
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <button
                                        onClick={() => handleSpacingChange('compact')}
                                        className={`p-4 rounded-xl border-2 text-left transition-all ${appSettings.spacingMode === 'compact' ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500' : 'border-slate-200 hover:border-slate-300'}`}
                                    >
                                        <div className="font-bold text-slate-800 mb-1">緊湊 (Compact)</div>
                                        <div className="text-xs text-slate-500">減少留白，適合小螢幕。</div>
                                    </button>
                                    <button
                                        onClick={() => handleSpacingChange('normal')}
                                        className={`p-4 rounded-xl border-2 text-left transition-all ${appSettings.spacingMode === 'normal' ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500' : 'border-slate-200 hover:border-slate-300'}`}
                                    >
                                        <div className="font-bold text-slate-800 mb-1">標準 (Default)</div>
                                        <div className="text-xs text-slate-500">系統預設間距。</div>
                                    </button>
                                    <button
                                        onClick={() => handleSpacingChange('comfortable')}
                                        className={`p-4 rounded-xl border-2 text-left transition-all ${appSettings.spacingMode === 'comfortable' ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500' : 'border-slate-200 hover:border-slate-300'}`}
                                    >
                                        <div className="font-bold text-slate-800 mb-1">寬鬆 (Comfortable)</div>
                                        <div className="text-xs text-slate-500">增加邊界與留白。</div>
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <button 
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-md transition-all flex items-center font-bold disabled:opacity-70"
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                    {saveMessage || '儲存設定'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isAdmin && activeTab === 'custom' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {/* ... (Existing Custom Params content unchanged) ... */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
                            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center">
                                    <Music className="w-5 h-5 mr-2 text-purple-600" />
                                    授課科目列表
                                </h3>
                                <p className="text-sm text-slate-500 mt-1">自訂派課時可選擇的樂器或課程項目。</p>
                            </div>
                            <div className="p-6 flex-1 flex flex-col">
                                <div className="flex gap-2 mb-4">
                                    <input 
                                        type="text" 
                                        placeholder="輸入科目名稱..." 
                                        className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        value={newSubject}
                                        onChange={(e) => setNewSubject(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddSubject()}
                                    />
                                    <button 
                                        onClick={handleAddSubject}
                                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-bold"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto max-h-[400px] custom-scrollbar space-y-2 p-1">
                                    {systemConfig.subjects.map((subject, idx) => (
                                        <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100 group hover:border-purple-200 transition-colors">
                                            <span className="text-slate-700 font-medium">{subject}</span>
                                            <button 
                                                onClick={() => handleRemoveSubject(idx)}
                                                className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
                            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center">
                                    <Tag className="w-5 h-5 mr-2 text-emerald-600" />
                                    支出類別列表
                                </h3>
                                <p className="text-sm text-slate-500 mt-1">管理用於成本統計的分類項目。</p>
                            </div>
                            <div className="p-6 flex-1 flex flex-col">
                                <div className="flex gap-2 mb-4">
                                    <input 
                                        type="text" 
                                        placeholder="輸入類別名稱..." 
                                        className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        value={newExpenseCat}
                                        onChange={(e) => setNewExpenseCat(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddExpenseCat()}
                                    />
                                    <button 
                                        onClick={handleAddExpenseCat}
                                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-bold"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto max-h-[400px] custom-scrollbar space-y-2 p-1">
                                    {systemConfig.expenseCategories.map((cat, idx) => (
                                        <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100 group hover:border-emerald-200 transition-colors">
                                            <span className="text-slate-700 font-medium">{cat}</span>
                                            <button 
                                                onClick={() => handleRemoveExpenseCat(idx)}
                                                className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center">
                                <Layout className="w-5 h-5 mr-2 text-orange-600" />
                                班別類型定義 (Class Types)
                            </h3>
                            <p className="text-sm text-slate-500 mt-1">設定派課時可選擇的班別種類 (如：個別課、團體班)。</p>
                        </div>
                         <div className="p-6 flex flex-col">
                             <div className="flex gap-2 mb-4 items-end">
                                 <div className="flex-1">
                                     <label className="text-xs text-slate-500 mb-1 block">代碼 (ID)</label>
                                     <input 
                                        type="text" 
                                        placeholder="ID" 
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 uppercase"
                                        value={newClassTypeId}
                                        onChange={(e) => setNewClassTypeId(e.target.value.toUpperCase())}
                                    />
                                 </div>
                                 <div className="flex-[2]">
                                     <label className="text-xs text-slate-500 mb-1 block">顯示名稱 (Name)</label>
                                     <input 
                                        type="text" 
                                        placeholder="名稱" 
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        value={newClassTypeName}
                                        onChange={(e) => setNewClassTypeName(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddClassType()}
                                     />
                                 </div>
                                 <button 
                                    onClick={handleAddClassType}
                                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-bold h-[42px]"
                                 >
                                    <Plus className="w-5 h-5" />
                                 </button>
                             </div>
                             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                                {systemConfig.classTypes.map((ct, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100 group hover:border-orange-200 transition-colors">
                                        <div>
                                            <div className="text-slate-800 font-bold">{ct.name}</div>
                                            <div className="text-xs text-slate-400 font-mono">{ct.id}</div>
                                        </div>
                                        <button 
                                            onClick={() => handleRemoveClassType(idx)}
                                            className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                             </div>
                         </div>
                    </div>

                    <div className="flex justify-end">
                        <button 
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-8 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-900 shadow-md transition-all flex items-center font-bold disabled:opacity-70"
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                            {saveMessage || '儲存自訂參數'}
                        </button>
                    </div>
                </div>
            )}

            {isAdmin && activeTab === 'db' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-8">
                     <div className={`p-4 rounded-xl border flex items-start text-sm ${isTestMode ? 'bg-amber-50 border-amber-100 text-amber-800' : 'bg-emerald-50 border-emerald-100 text-emerald-800'}`}>
                        <Cloud className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
                        <p>
                            <strong>資料庫狀態 (Cloudflare / Local)：</strong> 
                            目前系統運行於 {isTestMode ? '測試環境 (Test Mode)' : '正式環境 (Production)'}。
                            此應用程式目前使用瀏覽器本地儲存 (Local Storage) 作為資料庫，適合靜態部署 (Cloudflare Pages)。若清除瀏覽器快取，未備份的資料可能會遺失。
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 flex flex-col items-center text-center hover:shadow-md transition-shadow group">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 transition-colors ${isTestMode ? 'bg-amber-50 group-hover:bg-amber-100' : 'bg-blue-50 group-hover:bg-blue-100'}`}>
                                <Database className={`w-8 h-8 ${isTestMode ? 'text-amber-600' : 'text-blue-600'}`} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-3">重置為範例資料</h3>
                            <p className="text-slate-500 text-sm mb-8 leading-relaxed flex-1">
                                將目前環境資料庫還原至初始狀態，並寫入預設的模擬資料。
                                <br/><span className={`${isTestMode ? 'text-amber-600' : 'text-blue-500'} font-medium mt-2 block`}>適合：Demo 展示或功能測試</span>
                            </p>
                            <button 
                                onClick={() => setConfirmType('reset')}
                                className={`w-full py-3 bg-white border-2 rounded-xl font-bold flex items-center justify-center transition-all ${isTestMode ? 'border-amber-500 text-amber-600 hover:bg-amber-50' : 'border-blue-600 text-blue-600 hover:bg-blue-50'}`}
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                重置為預設值
                            </button>
                        </div>

                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-red-100 flex flex-col items-center text-center hover:shadow-md hover:border-red-200 transition-all group">
                            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6 group-hover:bg-red-100 transition-colors">
                                <Trash2 className="w-8 h-8 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-3">清空資料庫</h3>
                            <p className="text-slate-500 text-sm mb-8 leading-relaxed flex-1">
                                選擇性清除資料庫內的紀錄。
                                <br/><span className="text-red-500 font-medium mt-2 block">警告：此操作無法復原</span>
                            </p>
                            <button 
                                onClick={() => setConfirmType('clear')}
                                className="w-full py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 shadow-lg shadow-red-500/30 font-bold flex items-center justify-center transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <AlertTriangle className="w-4 h-4 mr-2" />
                                自訂清除內容
                            </button>
                        </div>
                    </div>
                    
                    {/* Patch Schema Button Section */}
                    <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 text-indigo-600">
                                <Wrench className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="font-bold text-indigo-900 text-lg">檢查並修復資料庫結構</h4>
                                <p className="text-indigo-700/80 text-sm mt-1 max-w-lg">
                                    若您發現官網設定無法儲存，或是圖片上傳後未顯示，可能是資料庫缺少必要欄位。此功能將嘗試補齊缺失的表格結構，不會影響現有資料。
                                </p>
                                {patchMessage && (
                                    <div className="mt-3 text-sm font-bold bg-white/60 px-3 py-1.5 rounded-lg inline-block text-indigo-800 animate-in fade-in">
                                        {patchMessage}
                                    </div>
                                )}
                            </div>
                        </div>
                        <button 
                            onClick={handlePatchSchema}
                            disabled={isProcessing}
                            className="whitespace-nowrap px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-md transition-all font-bold flex items-center disabled:opacity-70"
                        >
                            {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wrench className="w-4 h-4 mr-2" />}
                            執行結構修復
                        </button>
                    </div>
                </div>
            )}

            {confirmType && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full animate-in zoom-in-95 duration-200 relative">
                        {/* ... (Confirm modal content unchanged) ... */}
                        {!isProcessing && (
                            <button 
                                onClick={() => setConfirmType(null)} 
                                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}

                        <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 mx-auto ${confirmType === 'clear' ? 'bg-red-100' : (isTestMode ? 'bg-amber-100' : 'bg-blue-100')}`}>
                            {confirmType === 'clear' ? (
                                <AlertTriangle className="w-7 h-7 text-red-600" />
                            ) : (
                                <RefreshCw className={`w-7 h-7 ${isTestMode ? 'text-amber-600' : 'text-blue-600'}`} />
                            )}
                        </div>

                        <h4 className="text-xl font-bold text-slate-800 text-center mb-2">
                            {confirmType === 'clear' ? `自訂清除內容` : `確定重置資料庫？`}
                        </h4>
                        
                        {confirmType === 'clear' ? (
                            <div className="mb-6 space-y-4">
                                <p className="text-slate-500 text-center text-sm">請選擇您希望清除的資料類別：</p>
                                <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100 max-h-[250px] overflow-y-auto">
                                    {[
                                        { id: 'students', label: '學生資料' },
                                        { id: 'teachers', label: '教師與成員資料' },
                                        { id: 'lessons', label: '所有課程' },
                                        { id: 'finances', label: '財務與銷售' },
                                        { id: 'calendar', label: '行事曆設定' },
                                        { id: 'settings', label: '系統設定', warn: true }
                                    ].map((item) => (
                                        <label key={item.id} className="flex items-center space-x-3 cursor-pointer hover:bg-slate-100 p-2 rounded-lg transition-colors">
                                            <div onClick={(e) => { e.preventDefault(); toggleClearOption(item.id as keyof ClearDataOptions); }} className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${clearOptions[item.id as keyof ClearDataOptions] ? 'bg-red-500 border-red-500 text-white' : 'bg-white border-slate-300'}`}>
                                                {clearOptions[item.id as keyof ClearDataOptions] && <CheckSquare className="w-3.5 h-3.5" />}
                                            </div>
                                            <span className="text-sm font-medium text-slate-700">{item.label}</span>
                                        </label>
                                    ))}
                                </div>
                                
                                <div className="mt-4 pt-4 border-t border-slate-100">
                                    <label className="flex items-center space-x-2 cursor-pointer mb-3 select-none">
                                         <div onClick={() => setUseDateFilter(!useDateFilter)} className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${useDateFilter ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white border-slate-300'}`}>
                                            {useDateFilter && <CheckSquare className="w-3.5 h-3.5" />}
                                        </div>
                                        <span className="text-sm font-bold text-slate-700">僅清除特定日期範圍</span>
                                    </label>
                                    
                                    {useDateFilter && (
                                        <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-3 animate-in fade-in slide-in-from-top-2 shadow-sm">
                                            <div className="text-xs text-slate-500 mb-2 leading-relaxed">
                                                日期篩選僅適用於：<span className="font-bold text-slate-700">課程、財務、行事曆</span>。
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="relative flex-1">
                                                    <CalendarIcon className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                                    <input 
                                                        type="date" 
                                                        value={dateRange.start} 
                                                        onChange={e => setDateRange({...dateRange, start: e.target.value})} 
                                                        className="w-full pl-9 pr-2 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                                                    />
                                                </div>
                                                <span className="text-slate-400">-</span>
                                                <div className="relative flex-1">
                                                    <CalendarIcon className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                                    <input 
                                                        type="date" 
                                                        value={dateRange.end} 
                                                        onChange={e => setDateRange({...dateRange, end: e.target.value})} 
                                                        className="w-full pl-9 pr-2 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <p className="text-slate-500 text-center mb-8 text-sm leading-relaxed">
                                {isProcessing ? '正在處理請求，請稍候...' : (
                                    <>
                                        此動作將會還原資料庫至預設狀態，目前的所有變更將會<span className="font-bold text-red-500">遺失</span>。
                                    </>
                                )}
                            </p>
                        )}

                        <div className="flex space-x-3">
                            <button 
                                onClick={() => setConfirmType(null)}
                                disabled={isProcessing}
                                className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50"
                            >
                                取消
                            </button>
                            <button 
                                onClick={handleConfirm}
                                disabled={isProcessing}
                                className={`flex-1 px-4 py-3 text-white font-medium rounded-xl shadow-lg transition-colors flex items-center justify-center ${
                                    confirmType === 'clear' 
                                    ? 'bg-red-600 hover:bg-red-700 shadow-red-500/30' 
                                    : (isTestMode ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/30' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30')
                                } disabled:opacity-70`}
                            >
                                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : '確認執行'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
