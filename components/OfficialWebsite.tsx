
import React, { useState, useEffect, useRef, ReactNode } from 'react';
import { Teacher, SystemConfig, Inquiry } from '../types';
import { DEFAULT_WEBSITE_CONFIG } from '../constants'; // Fallback
import { Music, Star, Phone, MapPin, Mail, ArrowRight, CheckCircle, Menu, X, Facebook, Instagram, Youtube, Award, Users, Calendar, HelpCircle, Sparkles, Quote, Clock, Image as ImageIcon, DollarSign, Zap, Play, ChevronRight, Send, Wifi } from 'lucide-react';

// --- Animation Helper Component ---
interface FadeInProps {
    children: ReactNode;
    delay?: number;
    direction?: 'up' | 'down' | 'left' | 'right' | 'none';
    className?: string;
    fullWidth?: boolean;
}

const FadeIn: React.FC<FadeInProps> = ({ 
    children, 
    delay = 0, 
    direction = 'up', 
    className = "",
    fullWidth = false 
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const domRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    if (domRef.current) observer.unobserve(domRef.current);
                }
            });
        }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

        const currentElement = domRef.current;
        if (currentElement) observer.observe(currentElement);

        return () => {
            if (currentElement) observer.unobserve(currentElement);
        };
    }, []);

    const getDirectionClass = () => {
        switch (direction) {
            case 'up': return 'translate-y-10';
            case 'down': return '-translate-y-10';
            case 'left': return '-translate-x-10';
            case 'right': return 'translate-x-10';
            default: return '';
        }
    };

    return (
        <div
            ref={domRef}
            className={`transition-all duration-1000 ease-out ${fullWidth ? 'w-full' : ''} ${className} ${
                isVisible ? 'opacity-100 translate-x-0 translate-y-0' : `opacity-0 ${getDirectionClass()}`
            }`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
};

// LINE Logo Component
const LineLogo = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" clipRule="evenodd" d="M12.0002 4C7.50209 4 3.8291 7.228 3.8291 11.237C3.8291 13.627 5.1631 15.753 7.2291 16.993C7.1291 17.362 6.8921 18.232 6.8681 18.334C6.8681 18.334 6.8091 18.496 6.9071 18.577C7.0051 18.658 7.1341 18.638 7.1341 18.638C7.6201 18.567 9.1721 17.625 9.9671 16.942C10.6271 17.067 11.3061 17.136 12.0002 17.136C16.4982 17.136 20.1712 13.908 20.1712 9.90002C20.1712 5.89102 16.4982 4 12.0002 4Z"/>
    </svg>
);

interface OfficialWebsiteProps {
    teachers: Teacher[];
    systemConfig: SystemConfig;
    onGoToLogin: () => void;
    onAddInquiry: (inquiry: Inquiry) => Promise<void>;
}

export const OfficialWebsite: React.FC<OfficialWebsiteProps> = ({ teachers, systemConfig, onGoToLogin, onAddInquiry }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
    const [scrolled, setScrolled] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [showLineBubble, setShowLineBubble] = useState(true);
    
    // Form State
    const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        subject: '',
        message: ''
    });

    // Merge config with default to ensure no crashes
    const config = systemConfig.website || DEFAULT_WEBSITE_CONFIG;

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleScrollTo = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            // Offset for fixed header
            const headerOffset = 80;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        
            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });
            setIsMenuOpen(false);
        }
    };

    const toggleFaq = (index: number) => {
        setOpenFaqIndex(openFaqIndex === index ? null : index);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormStatus('submitting');
        
        try {
            const newInquiry: Inquiry = {
                id: `inq-${Date.now()}`,
                name: formData.name,
                phone: formData.phone,
                subject: formData.subject || '未選擇',
                message: formData.message,
                status: 'new',
                createdAt: new Date().toISOString(),
                adminNotes: ''
            };

            await onAddInquiry(newInquiry);
            
            setFormStatus('success');
            setFormData({ name: '', phone: '', subject: '', message: '' });
            setTimeout(() => setFormStatus('idle'), 5000);
        } catch (error) {
            console.error("Failed to submit inquiry", error);
            alert("發送失敗，請稍後再試。");
            setFormStatus('idle');
        }
    };

    // Strict Teacher Display Logic
    // Only display teachers present in the config list
    const displayedTeachers = (config.teachers?.items || [])
        .map(item => {
            const teacherData = teachers.find(t => t.id === item.teacherId);
            if (!teacherData) return null; // Skip if teacher deleted from system
            return {
                ...teacherData,
                config: item
            };
        })
        .filter((t): t is (Teacher & { config: any }) => t !== null && t.config.visible !== false);

    // Get courses from config or fallback to system subjects
    const displayedCourses = config.courses?.items && config.courses.items.length > 0 
        ? config.courses.items.filter(c => c.visible) 
        : systemConfig.subjects.map(s => ({ subjectName: s, description: `專業的${s}教學，從基礎樂理到進階演奏技巧，培養紮實的音樂素養與演奏能力，適合各年齡層學員。`, visible: true }));

    // Get testimonials
    const displayTestimonials = config.testimonials?.items && config.testimonials.items.length > 0
        ? config.testimonials.items.filter(t => t.visible)
        : [];

    // Filter other sections by visibility
    const displayedFeatures = config.features.items.filter(item => item.visible !== false);
    const displayedPricing = config.pricing.plans.filter(item => item.visible !== false);
    const displayedFaq = config.faq.items.filter(item => item.visible !== false);
    const displayedGallery = config.gallery.images.filter(item => {
        if (typeof item === 'string') return true; // Legacy support
        return item.visible !== false;
    });

    // Icon Mapping for Features
    const iconMap: Record<string, any> = {
        Users, Award, Sparkles, Calendar, Music, HelpCircle, Zap
    };

    // Helper to get contact info values safely (handling string vs object migration)
    const getContactInfo = (key: keyof typeof config.contact.info) => {
        const info = config.contact.info as any;
        const item = info[key];
        if (typeof item === 'string') {
            return { value: item, visible: true };
        }
        return item || { value: '', visible: false };
    };

    const contactPhone = getContactInfo('phone');
    const contactEmail = getContactInfo('email');
    const contactAddress = getContactInfo('address');
    const contactOpenHours = getContactInfo('openHours');
    const lineUrl = config.contact.info.lineUrl; // Direct string access for LINE URL

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800 selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">
            {/* Navigation */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-lg shadow-slate-200/20 py-2' : 'bg-transparent py-4'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white mr-3 shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform duration-300">
                                <Music className="w-6 h-6" />
                            </div>
                            <div className="flex flex-col">
                                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700 tracking-tight leading-tight">
                                    {systemConfig.appInfo.sidebarTitle}
                                </h1>
                                <span className="text-[10px] tracking-[0.2em] text-slate-400 font-medium uppercase">Music Education</span>
                            </div>
                        </div>

                        {/* Desktop Menu */}
                        <div className="hidden md:flex items-center space-x-1">
                            {[
                                config.courses.visible ? {id: 'courses', label: '課程'} : null,
                                config.pricing.visible ? {id: 'pricing', label: '方案'} : null,
                                config.teachers.visible ? {id: 'teachers', label: '師資'} : null,
                                config.gallery.visible ? {id: 'gallery', label: '相簿'} : null,
                                config.faq.visible ? {id: 'faq', label: '問答'} : null
                            ].filter(Boolean).map(item => (
                                <button 
                                    key={item!.id} 
                                    onClick={() => handleScrollTo(item!.id)} 
                                    className="px-4 py-2 text-slate-600 hover:text-blue-600 font-medium transition-colors text-sm rounded-lg hover:bg-blue-50"
                                >
                                    {item!.label}
                                </button>
                            ))}
                            <div className="pl-4">
                                <button 
                                    onClick={() => handleScrollTo('contact')} 
                                    className="px-6 py-2.5 bg-slate-900 text-white rounded-full font-bold hover:bg-slate-800 shadow-md hover:shadow-xl transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center text-sm"
                                >
                                    預約體驗 <ArrowRight className="w-4 h-4 ml-1.5" />
                                </button>
                            </div>
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="md:hidden">
                            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-slate-600 p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu Dropdown */}
                {isMenuOpen && (
                    <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-slate-100 absolute w-full shadow-2xl animate-in slide-in-from-top-5 max-h-[80vh] overflow-y-auto">
                        <div className="px-4 pt-4 pb-8 space-y-2">
                            {[
                                config.courses.visible ? 'courses:課程介紹' : null,
                                config.pricing.visible ? 'pricing:收費方案' : null,
                                config.teachers.visible ? 'teachers:師資團隊' : null,
                                config.gallery.visible ? 'gallery:精彩相簿' : null,
                                config.faq.visible ? 'faq:常見問題' : null
                            ].filter(Boolean).map(item => {
                                const [id, label] = item!.split(':');
                                return (
                                    <button key={id} onClick={() => handleScrollTo(id)} className="block w-full text-left px-4 py-3 text-slate-600 font-medium hover:bg-slate-50 hover:text-blue-600 rounded-xl transition-colors">
                                        {label}
                                    </button>
                                );
                            })}
                            <button onClick={() => handleScrollTo('contact')} className="block w-full text-center mt-6 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30">
                                立即預約體驗
                            </button>
                        </div>
                    </div>
                )}
            </nav>

            {/* Hero Section */}
            <section className="relative pt-24 pb-12 lg:pt-32 lg:pb-24 overflow-hidden scroll-mt-20">
                {/* ... existing hero content ... */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-blue-100/40 rounded-full blur-[100px] animate-pulse duration-[8000ms]"></div>
                    <div className="absolute top-[40%] left-[-20%] w-[600px] h-[600px] bg-purple-100/40 rounded-full blur-[100px] animate-pulse duration-[10000ms]"></div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
                        <div className="flex-1 text-center lg:text-left pt-4 lg:pt-0">
                            <FadeIn direction="up" delay={100}>
                                <div className="inline-flex items-center px-3 py-1 rounded-full bg-white border border-blue-100 shadow-sm mb-6">
                                    <span className="flex h-2 w-2 relative mr-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                    </span>
                                    <span className="text-xs font-bold text-slate-600 tracking-wide">現正招生中，歡迎預約試上</span>
                                </div>
                            </FadeIn>
                            
                            <FadeIn direction="up" delay={200}>
                                <h1 className="text-3xl sm:text-5xl lg:text-7xl font-extrabold text-slate-900 leading-tight mb-6 tracking-tight break-words">
                                    {config.hero.titlePrefix}<br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                                        {config.hero.titleHighlight}
                                    </span>
                                </h1>
                            </FadeIn>

                            <FadeIn direction="up" delay={300}>
                                <p className="text-base sm:text-lg text-slate-600 mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                                    {config.hero.subtitle}
                                </p>
                            </FadeIn>
                            
                            <FadeIn direction="up" delay={400}>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                                    <button onClick={() => handleScrollTo('contact')} className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-700 shadow-xl shadow-blue-500/30 transition-all transform hover:-translate-y-1">
                                        {config.hero.buttonText}
                                    </button>
                                    <button onClick={() => handleScrollTo('courses')} className="px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-2xl font-bold text-lg hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm hover:shadow-md flex items-center justify-center">
                                        <Play className="w-4 h-4 mr-2 fill-current" />
                                        探索課程
                                    </button>
                                </div>
                            </FadeIn>
                            
                            <FadeIn direction="up" delay={500}>
                                <div className="mt-10 flex items-center justify-center lg:justify-start gap-8 border-t border-slate-200/60 pt-8">
                                    {config.hero.stats.map((stat, idx) => (
                                        <React.Fragment key={idx}>
                                            <div className="flex flex-col">
                                                <span className="text-3xl font-bold text-slate-800">{stat.value}</span>
                                                <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">{stat.label}</span>
                                            </div>
                                            {idx < config.hero.stats.length - 1 && <div className="w-px h-10 bg-slate-200"></div>}
                                        </React.Fragment>
                                    ))}
                                </div>
                            </FadeIn>
                        </div>
                        
                        <div className="flex-1 relative w-full max-w-[500px] lg:max-w-none md:perspective-1000 lg:pl-10">
                            <FadeIn direction="right" delay={200}>
                                <div className="relative rounded-2xl md:rounded-[2.5rem] overflow-hidden shadow-2xl border-4 md:border-8 border-white md:rotate-1 hover:rotate-0 transition-all duration-700 ease-out transform-gpu mx-auto">
                                    <img 
                                        src={config.hero.heroImage} 
                                        alt="Music Class" 
                                        className="w-full h-auto object-cover transform scale-100 md:scale-105 hover:scale-110 transition-transform duration-[1.5s]"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80"></div>
                                    <div className="absolute bottom-8 left-8 text-white">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="bg-green-500 w-2 h-2 rounded-full animate-pulse"></div>
                                            <span className="text-sm font-medium bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">現正上課中</span>
                                        </div>
                                        <p className="font-bold text-xl tracking-wide">快樂學習，自信演奏</p>
                                    </div>
                                </div>
                            </FadeIn>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            {config.features.visible && (
                <section className="py-16 lg:py-20 bg-white scroll-mt-28">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <FadeIn direction="up" delay={0}>
                            <div className="text-center max-w-3xl mx-auto mb-16">
                                <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6">{config.features.title}</h2>
                                <p className="text-slate-600 text-lg">{config.features.subtitle}</p>
                            </div>
                        </FadeIn>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {displayedFeatures.map((feature, idx) => {
                                const IconComponent = iconMap[feature.icon] || Users;
                                const colorClass = idx % 4 === 0 ? "text-blue-600" : idx % 4 === 1 ? "text-purple-600" : idx % 4 === 2 ? "text-amber-600" : "text-emerald-600";
                                const bgClass = idx % 4 === 0 ? "bg-blue-50" : idx % 4 === 1 ? "bg-purple-50" : idx % 4 === 2 ? "bg-amber-50" : "bg-emerald-50";
                                
                                return (
                                    <FadeIn key={idx} direction="up" delay={idx * 100}>
                                        <div className="p-8 rounded-[2rem] border border-slate-100 hover:border-blue-100 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 group bg-white h-full relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-slate-50 to-transparent rounded-bl-full opacity-50 group-hover:from-blue-50 transition-colors"></div>
                                            <div className={`w-14 h-14 ${bgClass} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 relative z-10`}>
                                                <IconComponent className={`w-7 h-7 ${colorClass}`} />
                                            </div>
                                            <h3 className="text-xl font-bold text-slate-800 mb-3 relative z-10">{feature.title}</h3>
                                            <p className="text-slate-500 leading-relaxed relative z-10">
                                                {feature.desc}
                                            </p>
                                        </div>
                                    </FadeIn>
                                );
                            })}
                        </div>
                    </div>
                </section>
            )}

            {/* Courses Section */}
            {config.courses.visible && (
                <section id="courses" className="py-16 lg:py-20 bg-slate-50 relative overflow-hidden scroll-mt-28">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                        <FadeIn direction="up">
                            <div className="text-center mb-16">
                                <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">{config.courses.title}</h2>
                                <p className="text-slate-600 max-w-2xl mx-auto text-lg">{config.courses.subtitle}</p>
                            </div>
                        </FadeIn>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {displayedCourses.map((course, idx) => (
                                <FadeIn key={idx} direction="up" delay={idx * 100}>
                                    <div className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-2 transition-all duration-300 border border-slate-100 group relative overflow-hidden h-full flex flex-col">
                                        <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-600 mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-sm">
                                            <Music className="w-7 h-7" />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-800 mb-3">{course.subjectName}</h3>
                                        <p className="text-slate-500 mb-8 line-clamp-3 leading-relaxed flex-1">
                                            {course.description}
                                        </p>
                                        <button onClick={() => handleScrollTo('contact')} className="text-blue-600 font-bold flex items-center group-hover:translate-x-1 transition-transform text-sm uppercase tracking-wide mt-auto">
                                            了解課程詳情 <ArrowRight className="w-4 h-4 ml-2" />
                                        </button>
                                    </div>
                                </FadeIn>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Pricing Section */}
            {config.pricing.visible && (
                <section id="pricing" className="py-16 lg:py-20 bg-white scroll-mt-28">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <FadeIn direction="up">
                            <div className="text-center max-w-3xl mx-auto mb-16">
                                <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6">{config.pricing.title}</h2>
                                <p className="text-slate-600 text-lg">{config.pricing.subtitle}</p>
                            </div>
                        </FadeIn>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {displayedPricing.map((plan, idx) => (
                                <FadeIn key={idx} direction="up" delay={idx * 150}>
                                    <div className="relative p-8 rounded-[2rem] border transition-all duration-300 flex flex-col h-full border-slate-100 hover:border-slate-200 hover:shadow-lg bg-slate-50/50">
                                        <h3 className={`text-xl font-bold mb-2 ${
                                            plan.color === 'blue' ? 'text-blue-600' : 
                                            (plan.color === 'emerald' ? 'text-emerald-600' : 
                                            (plan.color === 'amber' ? 'text-amber-600' : 'text-purple-600'))
                                        }`}>{plan.name}</h3>
                                        <div className="flex items-baseline mb-4">
                                            <span className="text-3xl font-extrabold text-slate-800">${plan.price}</span>
                                            <span className="text-slate-500 ml-1 font-medium text-xs">{plan.unit}</span>
                                        </div>
                                        <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                                            {plan.desc}
                                        </p>
                                        <ul className="space-y-4 mb-8 flex-1">
                                            {plan.features.map((feat, fIdx) => (
                                                <li key={fIdx} className="flex items-center text-sm text-slate-700">
                                                    <CheckCircle className={`w-4 h-4 mr-3 flex-shrink-0 ${
                                                        plan.color === 'blue' ? 'text-blue-500' : 
                                                        (plan.color === 'emerald' ? 'text-emerald-500' : 
                                                        (plan.color === 'amber' ? 'text-amber-500' : 'text-purple-500'))
                                                    }`} />
                                                    {feat}
                                                </li>
                                            ))}
                                        </ul>
                                        <button onClick={() => handleScrollTo('contact')} className="w-full py-3.5 rounded-xl font-bold transition-all bg-white border-2 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50">
                                            立即詢問
                                        </button>
                                    </div>
                                </FadeIn>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Teachers Section */}
            {config.teachers.visible && (
                <section id="teachers" className="py-16 lg:py-20 bg-slate-50 scroll-mt-28">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <FadeIn direction="up">
                            {/* Updated Header Layout: Centered */}
                            <div className="text-center max-w-3xl mx-auto mb-16">
                                <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">{config.teachers.title}</h2>
                                <p className="text-slate-600 text-lg">{config.teachers.subtitle}</p>
                            </div>
                        </FadeIn>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {displayedTeachers.length > 0 ? (
                                displayedTeachers.map((teacher, idx) => {
                                    // Use config data directly
                                    const teacherConfig = teacher.config;
                                    const bio = teacherConfig?.customBio || "教學經驗豐富，擅長引導學生建立自信。";
                                    const imageUrl = teacherConfig?.imageUrl;

                                    return (
                                    <FadeIn key={teacher.id} direction="up" delay={idx * 100}>
                                        <div className="group relative overflow-hidden rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all duration-500 bg-white border border-slate-100 h-full">
                                            <div className={`aspect-[3/4] ${!imageUrl ? teacher.color.replace('text-', 'bg-').split(' ')[0] : 'bg-slate-100'} bg-opacity-20 relative overflow-hidden`}>
                                                <div className="absolute inset-0 flex items-center justify-center bg-slate-100 text-slate-300">
                                                    {imageUrl ? (
                                                        <img src={imageUrl} alt={teacher.name} className="w-full h-full object-cover object-top" />
                                                    ) : (
                                                        <span className="text-8xl font-bold opacity-20">{teacher.name[0]}</span>
                                                    )}
                                                </div>
                                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
                                                
                                                <div className="absolute bottom-0 left-0 p-6 text-white w-full transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                                    <div className="border-l-4 border-blue-500 pl-4 mb-2">
                                                        <h3 className="text-2xl font-bold">{teacher.name}</h3>
                                                        <p className="text-white/80 text-sm font-medium uppercase tracking-wider">資深音樂教師</p>
                                                    </div>
                                                    <div className="h-0 group-hover:h-auto overflow-hidden transition-all opacity-0 group-hover:opacity-100 duration-500 delay-100">
                                                        <p className="text-sm text-white/70 mt-3 leading-relaxed">
                                                            {bio}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </FadeIn>
                                );})
                            ) : (
                                <div className="col-span-full text-center py-10 text-slate-400">
                                    <p>目前暫無師資介紹，請稍後再訪。</p>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* Gallery Section */}
            {config.gallery.visible && (
                <section id="gallery" className="py-16 lg:py-20 bg-white overflow-hidden scroll-mt-28">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <FadeIn direction="up">
                            <div className="text-center mb-16">
                                <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">{config.gallery.title}</h2>
                                <p className="text-slate-600 text-lg">{config.gallery.subtitle}</p>
                            </div>
                        </FadeIn>
                        
                        {/* Changed from columns-1 (Masonry) to Grid for fixed aspect ratio */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {displayedGallery.map((item, idx) => {
                                // Compatible with both string (legacy) and object
                                const src = typeof item === 'string' ? item : item.url;
                                return (
                                    <FadeIn key={idx} direction="up" delay={idx * 100}>
                                        <div 
                                            className="relative group rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 cursor-zoom-in aspect-video bg-slate-100"
                                            onClick={() => setSelectedImage(src)}
                                        >
                                            <img 
                                                src={src} 
                                                alt="Gallery" 
                                                className="w-full h-full object-cover absolute inset-0 transform group-hover:scale-110 transition-transform duration-700" 
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                                                <ImageIcon className="text-white w-8 h-8 opacity-80" />
                                            </div>
                                        </div>
                                    </FadeIn>
                                );
                            })}
                        </div>
                    </div>
                </section>
            )}

            {/* Testimonials Section */}
            {config.testimonials.visible && (
                <section className="py-16 lg:py-20 bg-slate-900 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/3"></div>
                    <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] -translate-x-1/3 translate-y-1/3"></div>

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                        <FadeIn direction="up">
                            <div className="text-center mb-16">
                                <h2 className="text-3xl lg:text-4xl font-bold mb-4">{config.testimonials.title}</h2>
                                <p className="text-indigo-200 text-lg">{config.testimonials.subtitle}</p>
                            </div>
                        </FadeIn>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {displayTestimonials.map((item, idx) => (
                                <FadeIn key={idx} direction="up" delay={idx * 150}>
                                    <div className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-colors h-full flex flex-col">
                                        <div className="flex gap-1 mb-6">
                                            {[...Array(item.stars)].map((_, i) => (
                                                <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                                            ))}
                                        </div>
                                        <p className="text-lg text-indigo-50 mb-8 leading-relaxed italic flex-1">
                                            "{item.content}"
                                        </p>
                                        <div className="flex items-center mt-auto border-t border-white/10 pt-6">
                                            <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center font-bold text-white mr-3">
                                                {item.name[0]}
                                            </div>
                                            <div>
                                                <div className="font-bold">{item.name}</div>
                                                <div className="text-xs text-indigo-300">{item.role}</div>
                                            </div>
                                        </div>
                                    </div>
                                </FadeIn>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* FAQ Section */}
            {config.faq.visible && (
                <section id="faq" className="py-16 lg:py-20 bg-white scroll-mt-28">
                    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                        <FadeIn direction="up">
                            <div className="text-center mb-12">
                                <h2 className="text-3xl font-bold text-slate-900 mb-4">{config.faq.title}</h2>
                                <p className="text-slate-600">{config.faq.subtitle}</p>
                            </div>
                        </FadeIn>
                        
                        <div className="space-y-4">
                            {displayedFaq.map((faq, idx) => (
                                <FadeIn key={idx} direction="up" delay={idx * 100}>
                                    <div className="bg-slate-50 rounded-2xl overflow-hidden transition-all duration-300 border border-transparent hover:border-slate-200">
                                        <button 
                                            onClick={() => toggleFaq(idx)}
                                            className="w-full px-6 py-5 text-left flex justify-between items-center focus:outline-none"
                                        >
                                            <span className="font-bold text-slate-800 text-lg flex items-center">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-4 text-sm font-bold flex-shrink-0">Q</div>
                                                {faq.q}
                                            </span>
                                            <span className={`transform transition-transform duration-300 text-slate-400 ${openFaqIndex === idx ? 'rotate-180' : ''}`}>
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                            </span>
                                        </button>
                                        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openFaqIndex === idx ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                                            <div className="px-6 pb-6 pt-0 pl-[4.5rem] text-slate-600 leading-relaxed">
                                                {faq.a}
                                            </div>
                                        </div>
                                    </div>
                                </FadeIn>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Contact Form Section */}
            {config.contact.visible && (
                <section id="contact" className="py-16 lg:py-20 bg-slate-50 relative scroll-mt-28">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                        <FadeIn direction="up">
                            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-blue-900/5 overflow-hidden flex flex-col md:flex-row border border-slate-100">
                                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-12 text-white md:w-2/5 flex flex-col justify-between relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                                    <div className="relative z-10">
                                        <h3 className="text-3xl font-bold mb-6">{config.contact.title}</h3>
                                        <p className="text-blue-100 mb-10 leading-relaxed text-lg">
                                            {config.contact.subtitle}
                                        </p>
                                        <div className="space-y-8">
                                            {contactPhone.visible && (
                                                <div className="flex items-start">
                                                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                                                        <Phone className="w-5 h-5 text-white" />
                                                    </div>
                                                    <div>
                                                        <p className="text-blue-200 text-xs font-bold uppercase tracking-wider mb-1">Call Us</p>
                                                        <p className="font-medium text-lg tracking-wide">{contactPhone.value}</p>
                                                    </div>
                                                </div>
                                            )}
                                            {contactEmail.visible && (
                                                <div className="flex items-start">
                                                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                                                        <Mail className="w-5 h-5 text-white" />
                                                    </div>
                                                    <div>
                                                        <p className="text-blue-200 text-xs font-bold uppercase tracking-wider mb-1">Email Us</p>
                                                        <p className="font-medium text-lg">{contactEmail.value}</p>
                                                    </div>
                                                </div>
                                            )}
                                            {contactAddress.visible && (
                                                <div className="flex items-start">
                                                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                                                        <MapPin className="w-5 h-5 text-white" />
                                                    </div>
                                                    <div>
                                                        <p className="text-blue-200 text-xs font-bold uppercase tracking-wider mb-1">Visit Us</p>
                                                        <p className="font-medium text-lg leading-snug">{contactAddress.value}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="mt-12 flex space-x-4 relative z-10">
                                        <a href="#" className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors"><Facebook className="w-5 h-5"/></a>
                                        <a href="#" className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors"><Instagram className="w-5 h-5"/></a>
                                        <a href="#" className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors"><Youtube className="w-5 h-5"/></a>
                                    </div>
                                </div>
                                
                                <div className="p-8 md:p-12 md:w-3/5 bg-white">
                                    {formStatus === 'success' ? (
                                        <div className="h-full flex flex-col items-center justify-center text-center py-10 animate-in zoom-in-95">
                                            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
                                                <CheckCircle className="w-10 h-10" />
                                            </div>
                                            <h3 className="text-3xl font-bold text-slate-800 mb-3">預約成功！</h3>
                                            <p className="text-slate-500 text-lg">感謝您的填寫，我們將盡快與您聯繫。</p>
                                            <button 
                                                onClick={() => setFormStatus('idle')}
                                                className="mt-8 text-blue-600 font-bold hover:underline"
                                            >
                                                填寫另一份表單
                                            </button>
                                        </div>
                                    ) : (
                                        <div>
                                            <h4 className="text-2xl font-bold text-slate-800 mb-8">預約體驗課程</h4>
                                            <form onSubmit={handleSubmit} className="space-y-6">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                    <div>
                                                        <label className="block text-sm font-bold text-slate-700 mb-2">您的姓名</label>
                                                        <input 
                                                            type="text" 
                                                            required
                                                            value={formData.name}
                                                            onChange={e => setFormData({...formData, name: e.target.value})}
                                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 transition-all focus:bg-white"
                                                            placeholder="請輸入姓名"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-bold text-slate-700 mb-2">聯絡電話</label>
                                                        <input 
                                                            type="tel" 
                                                            required
                                                            value={formData.phone}
                                                            onChange={e => setFormData({...formData, phone: e.target.value})}
                                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 transition-all focus:bg-white"
                                                            placeholder="09xx-xxx-xxx"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-bold text-slate-700 mb-2">感興趣的課程</label>
                                                    <div className="relative">
                                                        <select 
                                                            value={formData.subject}
                                                            onChange={e => setFormData({...formData, subject: e.target.value})}
                                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 appearance-none cursor-pointer transition-all focus:bg-white"
                                                        >
                                                            <option value="">請選擇課程</option>
                                                            {systemConfig.subjects.map(s => <option key={s} value={s}>{s}</option>)}
                                                        </select>
                                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                                            <ChevronRight className="w-4 h-4 rotate-90" />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-bold text-slate-700 mb-2">備註留言</label>
                                                    <textarea 
                                                        rows={4}
                                                        value={formData.message}
                                                        onChange={e => setFormData({...formData, message: e.target.value})}
                                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 resize-none transition-all focus:bg-white"
                                                        placeholder="想詢問的時段、孩子年齡或其他需求..."
                                                    />
                                                </div>
                                                <button 
                                                    type="submit" 
                                                    disabled={formStatus === 'submitting'}
                                                    className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-lg hover:bg-slate-800 transition-all disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center"
                                                >
                                                    {formStatus === 'submitting' ? (
                                                        '資料傳送中...'
                                                    ) : (
                                                        <>送出預約單 <Send className="w-4 h-4 ml-2" /></>
                                                    )}
                                                </button>
                                            </form>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </FadeIn>
                    </div>
                </section>
            )}

            {/* Footer */}
            <footer className="bg-slate-900 text-slate-400 py-16 border-t border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                        <div className="col-span-1 md:col-span-1">
                            <div className="flex items-center mb-6">
                                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white mr-3">
                                    <Music className="w-6 h-6" />
                                </div>
                                <span className="font-bold text-xl text-white">{systemConfig.appInfo.sidebarTitle}</span>
                            </div>
                            <p className="text-sm leading-relaxed mb-6 text-slate-400">
                                專注於提供高品質音樂教育，啟發孩子的藝術潛能。我們相信每個人都能在音樂中找到屬於自己的光芒。
                            </p>
                            <div className="flex space-x-4">
                                <a href="#" className="p-2 bg-slate-800 rounded-full hover:bg-blue-600 hover:text-white transition-colors"><Facebook className="w-4 h-4"/></a>
                                <a href="#" className="p-2 bg-slate-800 rounded-full hover:bg-pink-600 hover:text-white transition-colors"><Instagram className="w-4 h-4"/></a>
                                <a href="#" className="p-2 bg-slate-800 rounded-full hover:bg-red-600 hover:text-white transition-colors"><Youtube className="w-4 h-4"/></a>
                            </div>
                        </div>
                        
                        <div>
                            <h4 className="text-white font-bold mb-6">課程項目</h4>
                            <ul className="space-y-3 text-sm">
                                {displayedCourses.slice(0, 4).map((item) => (
                                    <li key={item.subjectName}>
                                        <button 
                                            onClick={() => handleScrollTo('courses')} 
                                            className="hover:text-blue-400 transition-colors text-left"
                                        >
                                            {item.subjectName}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-white font-bold mb-6">快速連結</h4>
                            <ul className="space-y-3 text-sm">
                                <li><button onClick={() => handleScrollTo('teachers')} className="hover:text-blue-400 transition-colors">師資介紹</button></li>
                                <li><button onClick={() => handleScrollTo('pricing')} className="hover:text-blue-400 transition-colors">收費方案</button></li>
                                <li><button onClick={() => handleScrollTo('gallery')} className="hover:text-blue-400 transition-colors">精彩相簿</button></li>
                                <li><button onClick={() => handleScrollTo('contact')} className="hover:text-blue-400 transition-colors">預約體驗</button></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-white font-bold mb-6">聯絡資訊</h4>
                            <ul className="space-y-4 text-sm">
                                {contactAddress.visible && <li className="flex items-start"><MapPin className="w-4 h-4 mr-3 mt-1 flex-shrink-0 text-slate-500"/> {contactAddress.value}</li>}
                                {contactPhone.visible && <li className="flex items-center"><Phone className="w-4 h-4 mr-3 flex-shrink-0 text-slate-500"/> {contactPhone.value}</li>}
                                {contactEmail.visible && <li className="flex items-center"><Mail className="w-4 h-4 mr-3 flex-shrink-0 text-slate-500"/> {contactEmail.value}</li>}
                                {contactOpenHours.visible && <li className="flex items-center"><Clock className="w-4 h-4 mr-3 flex-shrink-0 text-slate-500"/> {contactOpenHours.value}</li>}
                            </ul>
                        </div>
                    </div>
                    
                    <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-xs text-slate-600">© {new Date().getFullYear()} {systemConfig.appInfo.sidebarTitle}. All rights reserved.</p>
                        <div className="flex items-center gap-6 text-xs text-slate-500">
                            <a href="#" className="hover:text-white transition-colors">隱私權政策</a>
                            <a href="#" className="hover:text-white transition-colors">服務條款</a>
                            <button 
                                onClick={onGoToLogin}
                                className="text-slate-400 hover:text-white font-medium transition-colors border border-slate-700 px-3 py-1 rounded-full hover:border-slate-500 hover:bg-slate-800"
                            >
                                員工後台登入
                            </button>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Floating LINE Button - Only Show if lineUrl is configured */}
            {lineUrl && (
                <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 group">
                    {/* Speech Bubble */}
                    {showLineBubble && (
                        <div className="bg-white px-4 py-2.5 rounded-2xl shadow-xl border border-slate-100 mb-1 relative animate-bounce-slow origin-bottom-right transition-opacity duration-300 max-w-[200px]">
                            <span className="text-slate-800 text-sm font-bold leading-tight block">獲取最新課程消息！</span>
                            <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white transform rotate-45 border-r border-b border-slate-100"></div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowLineBubble(false);
                                }}
                                className="absolute -top-2 -left-2 bg-slate-200 text-slate-500 rounded-full p-0.5 hover:bg-slate-300 hover:text-slate-700 transition-colors"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    )}

                    {/* Main Button */}
                    <a
                        href={lineUrl} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-[#06C755] hover:bg-[#05b64d] text-white p-1 rounded-full shadow-lg shadow-green-500/30 transition-all duration-300 transform hover:scale-105 flex items-center pr-5 group"
                    >
                        <div className="w-12 h-12 flex items-center justify-center bg-white/20 rounded-full mr-3 backdrop-blur-sm">
                             <LineLogo />
                        </div>
                        <span className="font-bold text-base tracking-wide">加入官方LINE</span>
                    </a>
                </div>
            )}

            {/* Image Lightbox */}
            {selectedImage && (
                <div 
                    className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200"
                    onClick={() => setSelectedImage(null)}
                >
                    <button 
                        className="absolute top-4 right-4 text-white/50 hover:text-white p-2 transition-colors z-10"
                        onClick={() => setSelectedImage(null)}
                    >
                        <X className="w-8 h-8" />
                    </button>
                    <img 
                        src={selectedImage} 
                        alt="Gallery Full" 
                        className="max-w-full max-h-[90vh] object-contain rounded-md shadow-2xl animate-in zoom-in-95 duration-300"
                        onClick={(e) => e.stopPropagation()} 
                    />
                </div>
            )}
        </div>
    );
};
