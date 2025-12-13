
export enum ClassType {
    PRIVATE = 'PRIVATE',       // 單獨授課
    SMALL_GROUP = 'SMALL_GROUP', // 小團體
    LARGE_GROUP = 'LARGE_GROUP'  // 大團體
}

export interface Student {
    id: string;
    name: string;
    grade: string;
    phone: string;
    parentName: string;
    notes: string;
    joinedDate: string;
}

export interface Teacher {
    id: string;
    name: string;
    email: string;
    phone: string;
    commissionRate: number; // Percentage (e.g. 60 for 60%)
    color: string;
}

export interface Lesson {
    id: string;
    title: string;
    subject: string; // New: Instrument/Subject (e.g., Piano)
    teacherId: string;
    studentIds: string[];
    date: string; // YYYY-MM-DD
    startTime: string; // HH:mm
    durationMinutes: number;
    type: ClassType | string; // Allow dynamic string types
    price?: number; // New: Total Tuition Fee (Revenue) - Optional for empty input
    cost?: number; // Specific salary cost for this lesson (Expense) - Optional for empty input
    isCompleted: boolean;
    lessonPlan?: string; // General Lesson Syllabus (授課綱目)
    studentNotes?: Record<string, string>; // Individual Student Notes (課堂進度) - Map<StudentId, Note>
}

// New: Teacher Availability Interface
export interface Availability {
    id: string;
    teacherId: string;
    date: string; // YYYY-MM-DD
    timeSlots: { start: string; end: string }[];
}

// New: Calendar Note Interface
export interface CalendarNote {
    id: string;
    date: string; // YYYY-MM-DD
    content: string;
    userId: string; // Owner of the note
}

// New: Inquiry (Web Contact Form) Interface
export interface Inquiry {
    id: string;
    name: string;
    phone: string;
    subject: string; // Interested Subject
    message: string;
    status: 'new' | 'contacted' | 'closed';
    createdAt: string; // ISO String or YYYY-MM-DD HH:mm
    lastContactedAt?: string;
    lastContactedBy?: string; // Admin/Staff Name
    adminNotes?: string;
}

// Helper to get readable name for class type (Legacy helper, prefer using SystemConfig)
export const getClassTypeName = (type: string, configClassTypes?: {id: string, name: string}[]): string => {
    if (configClassTypes) {
        const found = configClassTypes.find(ct => ct.id === type);
        if (found) return found.name;
    }
    switch (type) {
        case ClassType.PRIVATE: return '個別課';
        case ClassType.SMALL_GROUP: return '小組課';
        case ClassType.LARGE_GROUP: return '團體班';
        default: return type;
    }
};

export interface PayrollRecord {
    teacherId: string;
    teacherName: string;
    totalHours: number;
    totalLessons: number;
    totalPay: number;
    breakdown: Record<string, { // Dynamic keys based on ClassType ID
        count: number;
        hours: number;
        amount: number;
    }>;
}

// --- New Features Types ---

export interface Expense {
    id: string;
    date: string;       // YYYY-MM-DD
    title: string;      // e.g., "Purchase Piano Books"
    category: string;   // From SystemConfig.expenseCategories
    amount: number;
    note?: string;
}

export interface Sale {
    id: string;
    date: string;       // YYYY-MM-DD
    studentId: string;  // Who bought it
    itemName: string;   // e.g., "Alfred Piano Level 1"
    quantity: number;
    price: number;      // Unit Price
    total: number;      // quantity * price
}

// --- Auth & Permissions Types ---

export type ModuleId = 
    | 'dashboard' 
    | 'calendar' 
    | 'students' 
    | 'teachers' 
    | 'sales' 
    | 'expenses' 
    | 'payroll' 
    | 'reports' 
    | 'users'     // User Management
    | 'settings'  // System Settings
    | 'website'   // Official Website CMS
    | 'test_mode' // Test Mode Toggle
    | 'inquiries'; // Contact Inquiries

export interface Permission {
    view: boolean;
    edit: boolean;
}

// --- System Settings Types ---
export interface AppSettings {
    fontSizeScale: number; // 0.85 to 1.15 (85% to 115%)
    spacingMode: 'compact' | 'normal' | 'comfortable';
}

// --- Website Content Config Types ---
export interface WebsiteHero {
    titlePrefix: string;
    titleHighlight: string;
    subtitle: string;
    buttonText: string;
    heroImage: string;
    stats: { label: string; value: string }[];
}

export interface WebsiteFeatureItem {
    icon: string; // Lucide icon name or simple string key
    title: string;
    desc: string;
    visible: boolean; // Added visibility
}

export interface WebsiteCourseItem {
    subjectName: string; // Key to match SystemConfig.subjects
    description: string;
    visible: boolean;
}

export interface WebsitePricingItem {
    name: string;
    price: string;
    unit: string;
    desc: string;
    color: 'blue' | 'emerald' | 'amber' | 'purple';
    features: string[];
    visible: boolean; // Added visibility
}

export interface WebsiteTeacherConfig {
    teacherId: string;
    visible: boolean;
    customBio: string;
    imageUrl?: string; // New: Allow uploading teacher photo
}

export interface WebsiteTestimonialItem {
    id: string;
    name: string;
    role: string;
    content: string;
    stars: number;
    visible: boolean;
}

export interface WebsiteFaqItem {
    q: string;
    a: string;
    visible: boolean; // Added visibility
}

export interface WebsiteGalleryItem {
    url: string;
    visible: boolean;
}

export interface WebsiteContactItem {
    value: string;
    visible: boolean;
}

export interface WebsiteContactInfo {
    phone: WebsiteContactItem;
    email: WebsiteContactItem;
    address: WebsiteContactItem;
    openHours: WebsiteContactItem;
    mapUrl?: string; // Optional embedded map URL (kept as string for now, usually just one field)
}

export interface WebsiteConfig {
    hero: WebsiteHero;
    features: {
        visible: boolean;
        title: string;
        subtitle: string;
        items: WebsiteFeatureItem[];
    };
    courses: {
        visible: boolean;
        title: string;
        subtitle: string;
        items: WebsiteCourseItem[]; 
    };
    pricing: {
        visible: boolean;
        title: string;
        subtitle: string;
        plans: WebsitePricingItem[];
    };
    teachers: {
        visible: boolean;
        title: string;
        subtitle: string;
        items: WebsiteTeacherConfig[]; 
    };
    gallery: {
        visible: boolean;
        title: string;
        subtitle: string;
        images: WebsiteGalleryItem[]; // Changed from string[]
    };
    testimonials: {
        visible: boolean;
        title: string;
        subtitle: string;
        items: WebsiteTestimonialItem[];
    };
    faq: {
        visible: boolean;
        title: string;
        subtitle: string;
        items: WebsiteFaqItem[];
    };
    contact: {
        visible: boolean;
        title: string;
        subtitle: string;
        info: WebsiteContactInfo;
    };
}

export interface SystemConfig {
    subjects: string[];
    expenseCategories: string[];
    classTypes: { id: string; name: string }[];
    appInfo: {
        loginTitle: string;
        loginSubtitle: string;
        sidebarTitle: string;
        sidebarSubtitle: string;
    };
    website?: WebsiteConfig; // New: Website Content Configuration
}

export interface AppUser {
    id: string;
    username: string;
    password: string; // Stored as plain text for this demo requirements
    name: string;
    role: 'admin' | 'staff'; // Admin has full access, Staff depends on permissions
    permissions: Record<ModuleId, Permission>;
    isFirstLogin: boolean; // Force reset password on first login
    teacherId?: string; // Link to Teacher record if applicable
    settings?: AppSettings; // Personal UI settings
}

export const MODULE_NAMES: Record<ModuleId, string> = {
    dashboard: '總覽儀表板',
    calendar: '派課行事曆',
    students: '學生管理',
    teachers: '師資列表',
    sales: '銷售紀錄',
    expenses: '成本統計',
    payroll: '薪酬結算',
    reports: '詳細報表',
    users: '權限管理',
    settings: '系統設定',
    website: '官網設定',
    test_mode: '測試環境切換',
    inquiries: '預約諮詢'
};

export interface ClearDataOptions {
    students: boolean;
    teachers: boolean; // Also clears users
    lessons: boolean;
    finances: boolean;
    calendar: boolean;
    settings: boolean;
    // Optional date filter
    useDateFilter?: boolean;
    startDate?: string;
    endDate?: string;
}
