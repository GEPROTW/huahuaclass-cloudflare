
import React, { useState, useEffect, useRef } from 'react';
import { SystemConfig, WebsiteConfig, WebsitePricingItem, WebsiteFaqItem, WebsiteFeatureItem, Teacher, WebsiteCourseItem, WebsiteTeacherConfig, WebsiteTestimonialItem, WebsiteGalleryItem, WebsiteContactItem } from '../types';
import { DEFAULT_WEBSITE_CONFIG } from '../constants';
import { Save, Loader2, Globe, Layout, Image as ImageIcon, MessageSquare, DollarSign, Plus, Trash2, ChevronDown, ChevronUp, Eye, EyeOff, X, Users, Award, Sparkles, Calendar, Music, HelpCircle, Zap, Star } from 'lucide-react';
import { ImageUploader } from './ImageUploader';
import { db } from '../services/db';

interface WebsiteSettingsProps {
    systemConfig: SystemConfig;
    onUpdateSystemConfig: (config: SystemConfig) => void;
    teachers?: Teacher[]; // Need teachers to populate list
}

export const WebsiteSettings: React.FC<WebsiteSettingsProps> = ({ systemConfig, onUpdateSystemConfig, teachers = [] }) => {
    const [config, setConfig] = useState<WebsiteConfig>(systemConfig.website || DEFAULT_WEBSITE_CONFIG);
    const [activeTab, setActiveTab] = useState<'hero' | 'features' | 'courses' | 'teachers' | 'testimonials' | 'pricing' | 'gallery' | 'faq' | 'contact'>('hero');
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<string | null>(null);

    // Dropdown State for Features
    const [openFeatureDropdown, setOpenFeatureDropdown] = useState<number | null>(null);
    const featureDropdownRef = useRef<HTMLDivElement>(null);

    // Sync state if prop changes
    useEffect(() => {
        if (systemConfig.website) {
            // Handle migration of Contact Info from simple string to object structure if needed
            const newConfig = { ...systemConfig.website };
            
            // Check if contact info is using old format (string values) and convert if necessary
            // This prevents crashes if DB has old format
            const info = newConfig.contact.info as any;
            if (typeof info.phone === 'string') {
                newConfig.contact.info = {
                    phone: { value: info.phone, visible: true },
                    email: { value: info.email, visible: true },
                    address: { value: info.address, visible: true },
                    openHours: { value: info.openHours, visible: true },
                    mapUrl: info.mapUrl 
                };
            }

            setConfig(newConfig);
        }
    }, [systemConfig]);

    // Close Dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (featureDropdownRef.current && !featureDropdownRef.current.contains(event.target as Node)) {
                setOpenFeatureDropdown(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Ensure courses are synced with System Config Subjects
    useEffect(() => {
        const currentCourseItems = config.courses.items || [];
        let needsUpdate = false;
        const newItems = [...currentCourseItems];

        // Add missing subjects
        systemConfig.subjects.forEach(subject => {
            if (!newItems.find(i => i.subjectName === subject)) {
                newItems.push({
                    subjectName: subject,
                    description: `專業的${subject}教學，從基礎樂理到進階演奏技巧，培養紮實的音樂素養與演奏能力，適合各年齡層學員。`,
                    visible: true
                });
                needsUpdate = true;
            }
        });

        if (needsUpdate) {
            setConfig(prev => ({ ...prev, courses: { ...prev.courses, items: newItems } }));
        }
    }, [systemConfig.subjects]); // Run when subjects list changes

    // Ensure teachers are synced with Teacher List
    useEffect(() => {
        const currentTeacherConfigs = config.teachers.items || [];
        let needsUpdate = false;
        const newItems = [...currentTeacherConfigs];

        teachers.forEach(t => {
            if (!newItems.find(i => i.teacherId === t.id)) {
                newItems.push({
                    teacherId: t.id,
                    visible: true, // Default visible or false? Default to visible for now to populate.
                    customBio: "教學經驗豐富，擅長引導學生建立自信。"
                });
                needsUpdate = true;
            }
        });

        if (needsUpdate) {
            setConfig(prev => ({ ...prev, teachers: { ...prev.teachers, items: newItems } }));
        }
    }, [teachers]);


    const handleSave = async () => {
        setIsSaving(true);
        // Simulate async save
        await new Promise(resolve => setTimeout(resolve, 500));
        
        onUpdateSystemConfig({
            ...systemConfig,
            website: config
        });
        
        setSaveMessage("網站設定已儲存！");
        setTimeout(() => setSaveMessage(null), 3000);
        setIsSaving(false);
    };

    const updateHero = (field: string, value: any) => {
        setConfig(prev => ({ ...prev, hero: { ...prev.hero, [field]: value } }));
    };

    const updateSection = (section: keyof WebsiteConfig, field: string, value: any) => {
        setConfig(prev => ({
            ...prev,
            [section]: { ...prev[section], [field]: value }
        }));
    };

    // --- Array Updaters ---

    // Features
    const updateFeatureItem = (index: number, field: keyof WebsiteFeatureItem, value: any) => {
        const newItems = [...config.features.items];
        newItems[index] = { ...newItems[index], [field]: value };
        setConfig(prev => ({ ...prev, features: { ...prev.features, items: newItems } }));
    };

    const addFeatureItem = () => {
        const newItem: WebsiteFeatureItem = { icon: 'Users', title: '新特色', desc: '特色描述', visible: true };
        setConfig(prev => ({ ...prev, features: { ...prev.features, items: [...prev.features.items, newItem] } }));
    };

    const removeFeatureItem = (index: number) => {
        const newItems = [...config.features.items];
        newItems.splice(index, 1);
        setConfig(prev => ({ ...prev, features: { ...prev.features, items: newItems } }));
    };

    // Courses (Special: Only update desc/visibility)
    const updateCourseItem = (subjectName: string, field: keyof WebsiteCourseItem, value: any) => {
        const newItems = config.courses.items.map(item => 
            item.subjectName === subjectName ? { ...item, [field]: value } : item
        );
        setConfig(prev => ({ ...prev, courses: { ...prev.courses, items: newItems } }));
    };

    // Teachers (Special: Only update bio/visibility)
    const updateTeacherItem = (teacherId: string, field: keyof WebsiteTeacherConfig, value: any) => {
        const newItems = config.teachers.items.map(item => 
            item.teacherId === teacherId ? { ...item, [field]: value } : item
        );
        setConfig(prev => ({ ...prev, teachers: { ...prev.teachers, items: newItems } }));
    };

    // Testimonials
    const addTestimonial = () => {
        const newItem: WebsiteTestimonialItem = {
            id: `t-${Date.now()}`,
            name: "新學員",
            role: "學員",
            content: "請輸入評論內容...",
            stars: 5,
            visible: true
        };
        setConfig(prev => ({ ...prev, testimonials: { ...prev.testimonials, items: [...prev.testimonials.items, newItem] } }));
    };

    const removeTestimonial = (index: number) => {
        const newItems = [...config.testimonials.items];
        newItems.splice(index, 1);
        setConfig(prev => ({ ...prev, testimonials: { ...prev.testimonials, items: newItems } }));
    };

    const updateTestimonial = (index: number, field: keyof WebsiteTestimonialItem, value: any) => {
        const newItems = [...config.testimonials.items];
        newItems[index] = { ...newItems[index], [field]: value };
        setConfig(prev => ({ ...prev, testimonials: { ...prev.testimonials, items: newItems } }));
    };

    // Pricing
    const updatePricingPlan = (index: number, field: keyof WebsitePricingItem, value: any) => {
        const newPlans = [...config.pricing.plans];
        newPlans[index] = { ...newPlans[index], [field]: value };
        setConfig(prev => ({ ...prev, pricing: { ...prev.pricing, plans: newPlans } }));
    };

    const addPricingPlan = () => {
        const newPlan: WebsitePricingItem = {
            name: "新方案", price: "0", unit: "/ 堂", desc: "方案描述", color: "blue", features: ["特色1"], visible: true
        };
        setConfig(prev => ({ ...prev, pricing: { ...prev.pricing, plans: [...prev.pricing.plans, newPlan] } }));
    };

    const removePricingPlan = (index: number) => {
        const newPlans = [...config.pricing.plans];
        newPlans.splice(index, 1);
        setConfig(prev => ({ ...prev, pricing: { ...prev.pricing, plans: newPlans } }));
    };

    const updatePlanFeature = (planIndex: number, featureIndex: number, value: string) => {
        const newPlans = [...config.pricing.plans];
        const newFeatures = [...newPlans[planIndex].features];
        newFeatures[featureIndex] = value;
        newPlans[planIndex].features = newFeatures;
        setConfig(prev => ({ ...prev, pricing: { ...prev.pricing, plans: newPlans } }));
    };

    const addPlanFeature = (planIndex: number) => {
        const newPlans = [...config.pricing.plans];
        newPlans[planIndex].features.push("新特色");
        setConfig(prev => ({ ...prev, pricing: { ...prev.pricing, plans: newPlans } }));
    };

    const removePlanFeature = (planIndex: number, featureIndex: number) => {
        const newPlans = [...config.pricing.plans];
        newPlans[planIndex].features.splice(featureIndex, 1);
        setConfig(prev => ({ ...prev, pricing: { ...prev.pricing, plans: newPlans } }));
    };

    // FAQ
    const updateFaq = (index: number, field: keyof WebsiteFaqItem, value: any) => {
        const newItems = [...config.faq.items];
        newItems[index] = { ...newItems[index], [field]: value };
        setConfig(prev => ({ ...prev, faq: { ...prev.faq, items: newItems } }));
    };

    const addFaq = () => {
        setConfig(prev => ({ ...prev, faq: { ...prev.faq, items: [...prev.faq.items, { q: "新問題", a: "回答內容", visible: true }] } }));
    };

    const removeFaq = (index: number) => {
        const newItems = [...config.faq.items];
        newItems.splice(index, 1);
        setConfig(prev => ({ ...prev, faq: { ...prev.faq, items: newItems } }));
    };

    // Gallery (Now using WebsiteGalleryItem[])
    const updateGalleryImage = (index: number, field: keyof WebsiteGalleryItem, value: any) => {
        const newImages = [...config.gallery.images];
        // Handle migration if data was string[] previously
        if (typeof newImages[index] === 'string') {
             // @ts-ignore - Temporary handling for migration
             newImages[index] = { url: newImages[index], visible: true };
        }
        newImages[index] = { ...newImages[index], [field]: value };
        setConfig(prev => ({ ...prev, gallery: { ...prev.gallery, images: newImages } }));
    };

    const addGalleryImage = () => {
        setConfig(prev => ({ ...prev, gallery: { ...prev.gallery, images: [...prev.gallery.images, { url: "", visible: true }] } }));
    };

    const removeGalleryImage = async (index: number) => {
        const item = config.gallery.images[index];
        const url = typeof item === 'string' ? item : item.url;
        
        // Delete from R2 if url exists
        if (url) {
            await db.deleteImage(url);
        }

        const newImages = [...config.gallery.images];
        newImages.splice(index, 1);
        setConfig(prev => ({ ...prev, gallery: { ...prev.gallery, images: newImages } }));
    };

    const toggleVisibility = (section: keyof WebsiteConfig) => {
        // @ts-ignore - Dynamic key access
        const current = config[section].visible;
        updateSection(section, 'visible', !current);
    };

    // Contact Update Helper
    const updateContactInfo = (key: keyof Omit<typeof config.contact.info, 'mapUrl'>, field: keyof WebsiteContactItem, value: any) => {
        setConfig(prev => ({
            ...prev,
            contact: {
                ...prev.contact,
                info: {
                    ...prev.contact.info,
                    [key]: {
                        ...prev.contact.info[key],
                        [field]: value
                    }
                }
            }
        }));
    };

    // Available Icons for Features
    const availableIcons = [
        { value: 'Users', label: '用戶/團隊', icon: Users },
        { value: 'Award', label: '獎盃/認證', icon: Award },
        { value: 'Sparkles', label: '閃亮/特色', icon: Sparkles },
        { value: 'Calendar', label: '日曆/排程', icon: Calendar },
        { value: 'Music', label: '音樂/音符', icon: Music },
        { value: 'HelpCircle', label: '問號/協助', icon: HelpCircle },
        { value: 'Zap', label: '閃電/效率', icon: Zap },
    ];

    return (
        <div className="h-full flex flex-col space-y-6">
            <div className="flex justify-between items-center shrink-0">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">官方網站設定</h2>
                    <p className="text-sm text-gray-500">管理前台首頁的內容、圖片與顯示狀態</p>
                </div>
                <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-md transition-all flex items-center font-bold disabled:opacity-70"
                >
                    {isSaving ? (<Loader2 className="w-4 h-4 mr-2 animate-spin" />) : (<Save className="w-4 h-4 mr-2" />)}
                    {saveMessage || '儲存發布'}
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row flex-1 min-h-0">
                {/* Tabs */}
                <div className="w-full md:w-64 bg-slate-50 border-r border-slate-200 flex flex-row md:flex-col overflow-x-auto md:overflow-visible shrink-0">
                    {[
                        { id: 'hero', label: '首頁主視覺', icon: Globe },
                        { id: 'features', label: '特色介紹', icon: Layout },
                        { id: 'courses', label: '課程介紹', icon: Music },
                        { id: 'pricing', label: '收費方案', icon: DollarSign },
                        { id: 'teachers', label: '師資團隊', icon: Users },
                        { id: 'testimonials', label: '好評推薦', icon: Star },
                        { id: 'gallery', label: '活動相簿', icon: ImageIcon },
                        { id: 'faq', label: '常見問答', icon: MessageSquare },
                        { id: 'contact', label: '聯絡資訊', icon: Globe },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center px-6 py-4 text-sm font-medium transition-colors border-b md:border-b-0 md:border-l-4 whitespace-nowrap ${
                                activeTab === tab.id 
                                ? 'bg-white text-blue-600 border-blue-600' 
                                : 'text-slate-600 hover:bg-slate-100 border-transparent'
                            }`}
                        >
                            <tab.icon className="w-4 h-4 mr-3" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar">
                    
                    {/* --- HERO SECTION --- */}
                    {activeTab === 'hero' && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">主視覺設定 (Hero Section)</h3>
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">標題前綴</label>
                                    <input type="text" value={config.hero.titlePrefix} onChange={e => updateHero('titlePrefix', e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">標題重點 (漸層色)</label>
                                    <input type="text" value={config.hero.titleHighlight} onChange={e => updateHero('titleHighlight', e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div className="xl:col-span-2">
                                    <label className="block text-sm font-bold text-slate-700 mb-1">副標題描述</label>
                                    <textarea value={config.hero.subtitle} onChange={e => updateHero('subtitle', e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">主要按鈕文字</label>
                                    <input type="text" value={config.hero.buttonText} onChange={e => updateHero('buttonText', e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <ImageUploader 
                                        label="主圖片 (建議 1920x1080)"
                                        value={config.hero.heroImage}
                                        onChange={(url) => updateHero('heroImage', url)}
                                        onDelete={async (url) => await db.deleteImage(url)}
                                    />
                                </div>
                            </div>
                            
                            <div className="pt-4 border-t border-slate-100">
                                <label className="block text-sm font-bold text-slate-700 mb-3">數據統計欄位</label>
                                <div className="grid grid-cols-3 gap-4">
                                    {config.hero.stats.map((stat, idx) => (
                                        <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                            <input 
                                                type="text" 
                                                value={stat.value} 
                                                onChange={e => {
                                                    const newStats = [...config.hero.stats];
                                                    newStats[idx].value = e.target.value;
                                                    updateHero('stats', newStats);
                                                }}
                                                className="w-full bg-transparent font-bold text-lg mb-1 border-b border-slate-300 focus:border-blue-500 outline-none text-center" 
                                                placeholder="數值"
                                            />
                                            <input 
                                                type="text" 
                                                value={stat.label} 
                                                onChange={e => {
                                                    const newStats = [...config.hero.stats];
                                                    newStats[idx].label = e.target.value;
                                                    updateHero('stats', newStats);
                                                }}
                                                className="w-full bg-transparent text-xs text-slate-500 text-center outline-none" 
                                                placeholder="標籤"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- FEATURES SECTION --- */}
                    {activeTab === 'features' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-4">
                                <h3 className="text-lg font-bold text-slate-800">特色介紹設定</h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-slate-500">{config.features.visible ? '已顯示' : '已隱藏'}</span>
                                    <button onClick={() => toggleVisibility('features')} className={`p-1.5 rounded-lg transition-colors ${config.features.visible ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                                        {config.features.visible ? (<Eye className="w-4 h-4"/>) : (<EyeOff className="w-4 h-4"/>)}
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">區塊標題</label>
                                    <input type="text" value={config.features.title} onChange={e => updateSection('features', 'title', e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">副標題</label>
                                    <input type="text" value={config.features.subtitle} onChange={e => updateSection('features', 'subtitle', e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="block text-sm font-bold text-slate-700">特色項目</label>
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                    {config.features.items.map((item, idx) => {
                                        const SelectedIcon = availableIcons.find(i => i.value === item.icon)?.icon || HelpCircle;
                                        const selectedIconLabel = availableIcons.find(i => i.value === item.icon)?.label || '選擇圖示';

                                        return (
                                            <div key={idx} className={`flex gap-4 items-start p-4 rounded-xl border transition-colors ${item.visible !== false ? 'bg-slate-50 border-slate-200' : 'bg-slate-100 border-slate-200 opacity-60'}`}>
                                                <div className="w-32 flex-shrink-0 relative">
                                                    <label className="text-xs text-slate-500 mb-1 block">圖示</label>
                                                    
                                                    {/* Custom Dropdown Trigger */}
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setOpenFeatureDropdown(openFeatureDropdown === idx ? null : idx);
                                                        }}
                                                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 flex items-center justify-between text-sm hover:border-blue-300 transition-colors"
                                                    >
                                                        <div className="flex items-center gap-2 text-slate-700">
                                                            <SelectedIcon className="w-4 h-4 text-blue-600" />
                                                            <span className="truncate">{selectedIconLabel}</span>
                                                        </div>
                                                        <ChevronDown className="w-3 h-3 text-slate-400" />
                                                    </button>

                                                    {/* Dropdown Menu */}
                                                    {openFeatureDropdown === idx && (
                                                        <div ref={featureDropdownRef} className="absolute top-full left-0 w-48 mt-1 bg-white rounded-lg shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                                                            {availableIcons.map(iconDef => (
                                                                <button
                                                                    key={iconDef.value}
                                                                    onClick={() => {
                                                                        updateFeatureItem(idx, 'icon', iconDef.value);
                                                                        setOpenFeatureDropdown(null);
                                                                    }}
                                                                    className={`w-full text-left px-4 py-2.5 flex items-center gap-3 text-sm hover:bg-slate-50 transition-colors ${item.icon === iconDef.value ? 'bg-blue-50 text-blue-600' : 'text-slate-600'}`}
                                                                >
                                                                    <iconDef.icon className="w-4 h-4" />
                                                                    {iconDef.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 space-y-2">
                                                    <input 
                                                        type="text" 
                                                        value={item.title} 
                                                        onChange={e => updateFeatureItem(idx, 'title', e.target.value)}
                                                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-bold text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                        placeholder="特色標題"
                                                    />
                                                    <input 
                                                        type="text" 
                                                        value={item.desc} 
                                                        onChange={e => updateFeatureItem(idx, 'desc', e.target.value)}
                                                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-600 focus:ring-2 focus:ring-blue-500 outline-none"
                                                        placeholder="特色描述"
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <button 
                                                        onClick={() => updateFeatureItem(idx, 'visible', item.visible === false ? true : false)}
                                                        className={`p-1.5 rounded-lg transition-colors self-center ${item.visible !== false ? 'text-blue-600 bg-blue-50' : 'text-slate-400 bg-slate-200'}`}
                                                        title={item.visible !== false ? "點擊隱藏" : "點擊顯示"}
                                                    >
                                                        {item.visible !== false ? (<Eye className="w-4 h-4"/>) : (<EyeOff className="w-4 h-4"/>)}
                                                    </button>
                                                    <button onClick={() => removeFeatureItem(idx)} className="text-slate-400 hover:text-red-500 p-1 self-center">
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <button onClick={addFeatureItem} className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-blue-400 hover:text-blue-500 transition-colors flex items-center justify-center font-bold">
                                    <Plus className="w-4 h-4 mr-2" /> 新增特色項目
                                </button>
                            </div>
                        </div>
                    )}

                    {/* --- COURSES SECTION --- */}
                    {activeTab === 'courses' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-4">
                                <h3 className="text-lg font-bold text-slate-800">課程介紹設定</h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-slate-500">{config.courses.visible ? '已顯示' : '已隱藏'}</span>
                                    <button onClick={() => toggleVisibility('courses')} className={`p-1.5 rounded-lg transition-colors ${config.courses.visible ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                                        {config.courses.visible ? (<Eye className="w-4 h-4"/>) : (<EyeOff className="w-4 h-4"/>)}
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">區塊標題</label>
                                    <input type="text" value={config.courses.title} onChange={e => updateSection('courses', 'title', e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">副標題</label>
                                    <input type="text" value={config.courses.subtitle} onChange={e => updateSection('courses', 'subtitle', e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <p className="text-xs text-slate-500">以下課程項目來自「系統設定 → 授課科目」。您可以在此編輯顯示文字或隱藏個別課程。</p>
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                    {config.courses.items.map((item, idx) => (
                                        <div key={idx} className={`flex gap-4 items-start p-4 rounded-xl border transition-colors ${item.visible ? 'bg-slate-50 border-slate-200' : 'bg-slate-100 border-slate-200 opacity-60'}`}>
                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-bold text-slate-800">{item.subjectName}</span>
                                                    <button 
                                                        onClick={() => updateCourseItem(item.subjectName, 'visible', !item.visible)}
                                                        className={`p-1.5 rounded-lg ${item.visible ? 'text-blue-600 bg-blue-50' : 'text-slate-400 bg-slate-200'}`}
                                                        title={item.visible ? "點擊隱藏" : "點擊顯示"}
                                                    >
                                                        {item.visible ? (<Eye className="w-4 h-4"/>) : (<EyeOff className="w-4 h-4"/>)}
                                                    </button>
                                                </div>
                                                <textarea 
                                                    value={item.description} 
                                                    onChange={e => updateCourseItem(item.subjectName, 'description', e.target.value)}
                                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 focus:ring-2 focus:ring-blue-500 outline-none resize-none h-20"
                                                    placeholder="課程簡介描述..."
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- TEACHERS SECTION --- */}
                    {activeTab === 'teachers' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-4">
                                <h3 className="text-lg font-bold text-slate-800">師資團隊設定</h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-slate-500">{config.teachers.visible ? '已顯示' : '已隱藏'}</span>
                                    <button onClick={() => toggleVisibility('teachers')} className={`p-1.5 rounded-lg transition-colors ${config.teachers.visible ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                                        {config.teachers.visible ? (<Eye className="w-4 h-4"/>) : (<EyeOff className="w-4 h-4"/>)}
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">區塊標題</label>
                                    <input type="text" value={config.teachers.title} onChange={e => updateSection('teachers', 'title', e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">副標題</label>
                                    <input type="text" value={config.teachers.subtitle} onChange={e => updateSection('teachers', 'subtitle', e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <p className="text-xs text-slate-500">以下列出系統中的所有教師。勾選以顯示在官網，並可編輯對外顯示的介紹詞。</p>
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                    {config.teachers.items.map((item) => {
                                        const teacher = teachers.find(t => t.id === item.teacherId);
                                        if (!teacher) return null; // Skip if teacher deleted from system

                                        return (
                                            <div key={item.teacherId} className={`flex gap-4 items-start p-4 rounded-xl border transition-colors ${item.visible ? 'bg-slate-50 border-slate-200' : 'bg-slate-100 border-slate-200 opacity-60'}`}>
                                                <div className="w-24 flex-shrink-0">
                                                    {/* Integrated Image Uploader for Teachers */}
                                                    <ImageUploader 
                                                        value={item.imageUrl || ''} 
                                                        onChange={(url) => updateTeacherItem(item.teacherId, 'imageUrl', url)}
                                                        onDelete={async (url) => await db.deleteImage(url)}
                                                        className="aspect-[3/4] w-full"
                                                        placeholderLabel="上傳照片"
                                                        label="" 
                                                    />
                                                </div>
                                                
                                                <div className="flex-1 space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-bold text-slate-800">{teacher.name}</span>
                                                        <button 
                                                            onClick={() => updateTeacherItem(item.teacherId, 'visible', !item.visible)}
                                                            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-colors ${item.visible ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-slate-200 text-slate-500 border-slate-300'}`}
                                                        >
                                                            {item.visible ? (<span className="flex items-center gap-1"><Eye className="w-3 h-3"/> 顯示中</span>) : (<span className="flex items-center gap-1"><EyeOff className="w-3 h-3"/> 已隱藏</span>)}
                                                        </button>
                                                    </div>
                                                    <input 
                                                        type="text"
                                                        value={item.customBio} 
                                                        onChange={e => updateTeacherItem(item.teacherId, 'customBio', e.target.value)}
                                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 focus:ring-2 focus:ring-blue-500 outline-none"
                                                        placeholder="教師簡介/座右銘..."
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- TESTIMONIALS SECTION --- */}
                    {activeTab === 'testimonials' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-4">
                                <h3 className="text-lg font-bold text-slate-800">好評推薦設定</h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-slate-500">{config.testimonials.visible ? '已顯示' : '已隱藏'}</span>
                                    <button onClick={() => toggleVisibility('testimonials')} className={`p-1.5 rounded-lg transition-colors ${config.testimonials.visible ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                                        {config.testimonials.visible ? (<Eye className="w-4 h-4"/>) : (<EyeOff className="w-4 h-4"/>)}
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">區塊標題</label>
                                    <input type="text" value={config.testimonials.title} onChange={e => updateSection('testimonials', 'title', e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">副標題</label>
                                    <input type="text" value={config.testimonials.subtitle} onChange={e => updateSection('testimonials', 'subtitle', e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                    {config.testimonials.items.map((item, idx) => (
                                        <div key={idx} className={`p-4 rounded-xl border transition-colors relative group ${item.visible ? 'bg-slate-50 border-slate-200' : 'bg-slate-100 border-slate-200 opacity-60'}`}>
                                            <button onClick={() => removeTestimonial(idx)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3 pr-8">
                                                <div>
                                                    <label className="text-xs text-slate-500 mb-1 block">姓名</label>
                                                    <input 
                                                        type="text" 
                                                        value={item.name} 
                                                        onChange={e => updateTestimonial(idx, 'name', e.target.value)}
                                                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-bold"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-slate-500 mb-1 block">角色/身份</label>
                                                    <input 
                                                        type="text" 
                                                        value={item.role} 
                                                        onChange={e => updateTestimonial(idx, 'role', e.target.value)}
                                                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm"
                                                    />
                                                </div>
                                            </div>
                                            
                                            <div className="mb-3">
                                                <label className="text-xs text-slate-500 mb-1 block">評論內容</label>
                                                <textarea 
                                                    value={item.content} 
                                                    onChange={e => updateTestimonial(idx, 'content', e.target.value)}
                                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none h-20"
                                                />
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <label className="text-xs text-slate-500">評分:</label>
                                                    <select 
                                                        value={item.stars} 
                                                        onChange={e => updateTestimonial(idx, 'stars', parseInt(e.target.value))}
                                                        className="bg-white border border-slate-200 rounded px-2 py-1 text-xs"
                                                    >
                                                        {[1,2,3,4,5].map(s => <option key={s} value={s}>{s} 星</option>)}
                                                    </select>
                                                    <div className="flex">
                                                        {[...Array(item.stars)].map((_, i) => <Star key={i} className="w-3 h-3 text-yellow-400 fill-current"/>)}
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => updateTestimonial(idx, 'visible', !item.visible)}
                                                    className={`text-xs px-3 py-1 rounded-full border transition-colors flex items-center gap-1 ${item.visible ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-slate-200 text-slate-500 border-slate-300'}`}
                                                >
                                                    {item.visible ? (<span className="flex items-center gap-1"><Eye className="w-3 h-3"/> 顯示</span>) : (<span className="flex items-center gap-1"><EyeOff className="w-3 h-3"/> 隱藏</span>)}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button onClick={addTestimonial} className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-blue-400 hover:text-blue-500 transition-colors flex items-center justify-center font-bold">
                                    <Plus className="w-4 h-4 mr-2" /> 新增評論
                                </button>
                            </div>
                        </div>
                    )}

                    {/* --- PRICING SECTION --- */}
                    {activeTab === 'pricing' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-4">
                                <h3 className="text-lg font-bold text-slate-800">收費方案設定</h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-slate-500">{config.pricing.visible ? '已顯示' : '已隱藏'}</span>
                                    <button onClick={() => toggleVisibility('pricing')} className={`p-1.5 rounded-lg transition-colors ${config.pricing.visible ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                                        {config.pricing.visible ? (<Eye className="w-4 h-4"/>) : (<EyeOff className="w-4 h-4"/>)}
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">區塊標題</label>
                                    <input type="text" value={config.pricing.title} onChange={e => updateSection('pricing', 'title', e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">副標題</label>
                                    <input type="text" value={config.pricing.subtitle} onChange={e => updateSection('pricing', 'subtitle', e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {config.pricing.plans.map((plan, pIdx) => (
                                        <div key={pIdx} className={`border border-slate-200 rounded-xl p-4 transition-colors ${plan.visible !== false ? 'bg-slate-50/50' : 'bg-slate-100 opacity-60'}`}>
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex gap-2">
                                                    <input type="text" value={plan.name} onChange={e => updatePricingPlan(pIdx, 'name', e.target.value)} className="font-bold bg-transparent border-b border-transparent focus:border-blue-500 outline-none w-32" />
                                                    <select value={plan.color} onChange={e => updatePricingPlan(pIdx, 'color', e.target.value)} className="text-xs bg-white border border-slate-200 rounded px-1">
                                                        <option value="blue">藍色</option>
                                                        <option value="emerald">綠色</option>
                                                        <option value="amber">橘色</option>
                                                        <option value="purple">紫色</option>
                                                    </select>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => updatePricingPlan(pIdx, 'visible', plan.visible === false ? true : false)}
                                                        className={`p-1 rounded-md transition-colors ${plan.visible !== false ? 'text-blue-600 bg-blue-50' : 'text-slate-400 bg-slate-200'}`}
                                                        title={plan.visible !== false ? "點擊隱藏" : "點擊顯示"}
                                                    >
                                                        {plan.visible !== false ? (<Eye className="w-4 h-4"/>) : (<EyeOff className="w-4 h-4"/>)}
                                                    </button>
                                                    <button onClick={() => removePricingPlan(pIdx)} className="text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 mb-3">
                                                <input type="text" value={plan.price} onChange={e => updatePricingPlan(pIdx, 'price', e.target.value)} className="flex-1 px-3 py-1.5 border border-slate-200 rounded bg-white text-sm" placeholder="價格" />
                                                <input type="text" value={plan.unit} onChange={e => updatePricingPlan(pIdx, 'unit', e.target.value)} className="w-20 px-3 py-1.5 border border-slate-200 rounded bg-white text-sm" placeholder="單位" />
                                            </div>
                                            <input type="text" value={plan.desc} onChange={e => updatePricingPlan(pIdx, 'desc', e.target.value)} className="w-full px-3 py-1.5 border border-slate-200 rounded bg-white text-sm mb-3" placeholder="描述" />
                                            
                                            <div className="space-y-1">
                                                {plan.features.map((feat, fIdx) => (
                                                    <div key={fIdx} className="flex gap-2 items-center">
                                                        <div className="w-1.5 h-1.5 bg-slate-300 rounded-full"></div>
                                                        <input type="text" value={feat} onChange={e => updatePlanFeature(pIdx, fIdx, e.target.value)} className="flex-1 bg-transparent border-b border-transparent focus:border-slate-300 outline-none text-xs text-slate-600" />
                                                        <button onClick={() => removePlanFeature(pIdx, fIdx)} className="text-slate-300 hover:text-red-400"><X className="w-3 h-3"/></button>
                                                    </div>
                                                ))}
                                                <button onClick={() => addPlanFeature(pIdx)} className="text-xs text-blue-500 hover:text-blue-700 flex items-center mt-2">
                                                    <Plus className="w-3 h-3 mr-1" /> 新增特色
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button onClick={addPricingPlan} className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-blue-400 hover:text-blue-500 transition-colors flex items-center justify-center font-bold">
                                    <Plus className="w-4 h-4 mr-2" /> 新增方案
                                </button>
                            </div>
                        </div>
                    )}

                    {/* --- FAQ SECTION --- */}
                    {activeTab === 'faq' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-4">
                                <h3 className="text-lg font-bold text-slate-800">常見問答設定</h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-slate-500">{config.faq.visible ? '已顯示' : '已隱藏'}</span>
                                    <button onClick={() => toggleVisibility('faq')} className={`p-1.5 rounded-lg transition-colors ${config.faq.visible ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                                        {config.faq.visible ? (<Eye className="w-4 h-4"/>) : (<EyeOff className="w-4 h-4"/>)}
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">區塊標題</label>
                                    <input type="text" value={config.faq.title} onChange={e => updateSection('faq', 'title', e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">副標題</label>
                                    <input type="text" value={config.faq.subtitle} onChange={e => updateSection('faq', 'subtitle', e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                            </div>

                            <div className="space-y-4">
                                {config.faq.items.map((item, idx) => (
                                    <div key={idx} className={`bg-slate-50 p-4 rounded-xl border flex gap-4 items-start transition-colors ${item.visible !== false ? 'border-slate-200' : 'border-slate-200 opacity-60 bg-slate-100'}`}>
                                        <div className="flex-1 space-y-2">
                                            <input 
                                                type="text" 
                                                value={item.q} 
                                                onChange={e => updateFaq(idx, 'q', e.target.value)}
                                                className="w-full px-3 py-2 border border-slate-200 rounded bg-white font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none" 
                                                placeholder="問題"
                                            />
                                            <textarea 
                                                value={item.a} 
                                                onChange={e => updateFaq(idx, 'a', e.target.value)}
                                                className="w-full px-3 py-2 border border-slate-200 rounded bg-white text-sm text-slate-600 focus:ring-2 focus:ring-blue-500 outline-none resize-none h-20" 
                                                placeholder="回答"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2 mt-2">
                                            <button 
                                                onClick={() => updateFaq(idx, 'visible', item.visible === false ? true : false)}
                                                className={`p-1.5 rounded-lg transition-colors ${item.visible !== false ? 'text-blue-600 bg-blue-50' : 'text-slate-400 bg-slate-200'}`}
                                                title={item.visible !== false ? "點擊隱藏" : "點擊顯示"}
                                            >
                                                {item.visible !== false ? (<Eye className="w-4 h-4"/>) : (<EyeOff className="w-4 h-4"/>)}
                                            </button>
                                            <button onClick={() => removeFaq(idx)} className="text-slate-400 hover:text-red-500 p-1">
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                <button onClick={addFaq} className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-blue-400 hover:text-blue-500 transition-colors flex items-center justify-center font-bold">
                                    <Plus className="w-4 h-4 mr-2" /> 新增問答
                                </button>
                            </div>
                        </div>
                    )}

                    {/* --- GALLERY SECTION --- */}
                    {activeTab === 'gallery' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-4">
                                <h3 className="text-lg font-bold text-slate-800">相簿圖片連結</h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-slate-500">{config.gallery.visible ? '已顯示' : '已隱藏'}</span>
                                    <button onClick={() => toggleVisibility('gallery')} className={`p-1.5 rounded-lg transition-colors ${config.gallery.visible ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                                        {config.gallery.visible ? (<Eye className="w-4 h-4"/>) : (<EyeOff className="w-4 h-4"/>)}
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">區塊標題</label>
                                    <input type="text" value={config.gallery.title} onChange={e => updateSection('gallery', 'title', e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">副標題</label>
                                    <input type="text" value={config.gallery.subtitle} onChange={e => updateSection('gallery', 'subtitle', e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {config.gallery.images.map((img, idx) => {
                                    // Handle string vs object compatibility
                                    const imgUrl = typeof img === 'string' ? img : img.url;
                                    const imgVisible = typeof img === 'string' ? true : (img.visible !== false);

                                    return (
                                        <div key={idx} className={`relative group p-2 border rounded-xl transition-colors ${imgVisible ? 'border-slate-200' : 'border-slate-200 bg-slate-100 opacity-60'}`}>
                                            {/* Integrated Image Uploader for Gallery */}
                                            <div className="relative">
                                                <ImageUploader 
                                                    value={imgUrl}
                                                    onChange={(url) => updateGalleryImage(idx, 'url', url)}
                                                    onDelete={async (url) => await db.deleteImage(url)}
                                                    className="aspect-video mt-0"
                                                    placeholderLabel="上傳活動照片"
                                                    label="" 
                                                />
                                                {/* Visibility Toggle Overlay on top right */}
                                                <div className="absolute top-2 right-2 flex gap-1 z-10">
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            updateGalleryImage(idx, 'visible', !imgVisible);
                                                        }}
                                                        className={`p-1.5 rounded-md backdrop-blur-sm shadow-sm transition-colors ${imgVisible ? 'bg-white/80 text-slate-700 hover:bg-white hover:text-blue-600' : 'bg-slate-800/80 text-white'}`}
                                                        title={imgVisible ? "點擊隱藏" : "點擊顯示"}
                                                    >
                                                        {imgVisible ? (<Eye className="w-4 h-4"/>) : (<EyeOff className="w-4 h-4"/>)}
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            <div className="mt-2 flex justify-end">
                                                <button onClick={() => removeGalleryImage(idx)} className="text-xs text-red-500 hover:text-red-700 flex items-center px-2 py-1 hover:bg-red-50 rounded transition-colors">
                                                    <Trash2 className="w-3 h-3 mr-1" /> 移除照片
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                                <button onClick={addGalleryImage} className="aspect-video border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-500 hover:border-blue-400 hover:text-blue-500 transition-colors">
                                    <Plus className="w-8 h-8 mb-2" />
                                    <span>新增圖片</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* --- CONTACT SECTION --- */}
                    {activeTab === 'contact' && (
                        <div className="space-y-6">
                            {/* ... (Existing Contact Section) ... */}
                            <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-4">
                                <h3 className="text-lg font-bold text-slate-800">聯絡資訊設定</h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-slate-500">{config.contact.visible ? '已顯示' : '已隱藏'}</span>
                                    <button onClick={() => toggleVisibility('contact')} className={`p-1.5 rounded-lg transition-colors ${config.contact.visible ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                                        {config.contact.visible ? (<Eye className="w-4 h-4"/>) : (<EyeOff className="w-4 h-4"/>)}
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-slate-100 mb-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">區塊標題</label>
                                    <input type="text" value={config.contact.title} onChange={e => updateSection('contact', 'title', e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">副標題</label>
                                    <input type="text" value={config.contact.subtitle} onChange={e => updateSection('contact', 'subtitle', e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="block text-sm font-bold text-slate-700">電話</label>
                                        <button 
                                            onClick={() => updateContactInfo('phone', 'visible', !config.contact.info.phone.visible)}
                                            className={`p-1 rounded transition-colors ${config.contact.info.phone.visible ? 'text-blue-600 bg-blue-50' : 'text-slate-400 bg-slate-200'}`}
                                        >
                                            {config.contact.info.phone.visible ? (<Eye className="w-3.5 h-3.5"/>) : (<EyeOff className="w-3.5 h-3.5"/>)}
                                        </button>
                                    </div>
                                    <input type="text" value={config.contact.info.phone.value} onChange={(e) => updateContactInfo('phone', 'value', e.target.value)} className={`w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${!config.contact.info.phone.visible ? 'bg-slate-100 text-slate-500' : ''}`} />
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="block text-sm font-bold text-slate-700">Email</label>
                                        <button 
                                            onClick={() => updateContactInfo('email', 'visible', !config.contact.info.email.visible)}
                                            className={`p-1 rounded transition-colors ${config.contact.info.email.visible ? 'text-blue-600 bg-blue-50' : 'text-slate-400 bg-slate-200'}`}
                                        >
                                            {config.contact.info.email.visible ? (<Eye className="w-3.5 h-3.5"/>) : (<EyeOff className="w-3.5 h-3.5"/>)}
                                        </button>
                                    </div>
                                    <input type="text" value={config.contact.info.email.value} onChange={(e) => updateContactInfo('email', 'value', e.target.value)} className={`w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${!config.contact.info.email.visible ? 'bg-slate-100 text-slate-500' : ''}`} />
                                </div>
                                <div className="md:col-span-2">
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="block text-sm font-bold text-slate-700">地址</label>
                                        <button 
                                            onClick={() => updateContactInfo('address', 'visible', !config.contact.info.address.visible)}
                                            className={`p-1 rounded transition-colors ${config.contact.info.address.visible ? 'text-blue-600 bg-blue-50' : 'text-slate-400 bg-slate-200'}`}
                                        >
                                            {config.contact.info.address.visible ? (<Eye className="w-3.5 h-3.5"/>) : (<EyeOff className="w-3.5 h-3.5"/>)}
                                        </button>
                                    </div>
                                    <input type="text" value={config.contact.info.address.value} onChange={(e) => updateContactInfo('address', 'value', e.target.value)} className={`w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${!config.contact.info.address.visible ? 'bg-slate-100 text-slate-500' : ''}`} />
                                </div>
                                <div className="md:col-span-2">
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="block text-sm font-bold text-slate-700">營業時間</label>
                                        <button 
                                            onClick={() => updateContactInfo('openHours', 'visible', !config.contact.info.openHours.visible)}
                                            className={`p-1 rounded transition-colors ${config.contact.info.openHours.visible ? 'text-blue-600 bg-blue-50' : 'text-slate-400 bg-slate-200'}`}
                                        >
                                            {config.contact.info.openHours.visible ? (<Eye className="w-3.5 h-3.5"/>) : (<EyeOff className="w-3.5 h-3.5"/>)}
                                        </button>
                                    </div>
                                    <input type="text" value={config.contact.info.openHours.value} onChange={(e) => updateContactInfo('openHours', 'value', e.target.value)} className={`w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${!config.contact.info.openHours.visible ? 'bg-slate-100 text-slate-500' : ''}`} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
