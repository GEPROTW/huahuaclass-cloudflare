
import { Student, Teacher, Lesson, ClassType, Expense, Sale, AppUser, ModuleId, MODULE_NAMES, Permission, Availability, SystemConfig, Inquiry, WebsiteConfig } from './types';

export const DEFAULT_MUSIC_SUBJECTS = [
    '鋼琴 (Piano)',
    '小提琴 (Violin)',
    '聲樂 (Vocal)',
    '吉他 (Guitar)',
    '長笛 (Flute)',
    '爵士鼓 (Drums)',
    '樂理 (Music Theory)',
    '幼兒律動 (Music & Movement)',
    '大提琴 (Cello)',
    '薩克斯風 (Saxophone)'
];

export const DEFAULT_EXPENSE_CATEGORIES = [
    '教材採購',
    '硬體設備',
    '房租水電',
    '行銷廣告',
    '人事雜支',
    '其他'
];

export const DEFAULT_CLASS_TYPES = [
    { id: ClassType.PRIVATE, name: '個別課' },
    { id: ClassType.SMALL_GROUP, name: '小組課' },
    { id: ClassType.LARGE_GROUP, name: '團體班' }
];

export const DEFAULT_APP_INFO = {
    loginTitle: 'Huahua Music Class',
    loginSubtitle: '智慧派課與薪酬管理系統',
    sidebarTitle: 'Huahua Music',
    sidebarSubtitle: '智慧派課系統'
};

export const DEFAULT_WEBSITE_CONFIG: WebsiteConfig = {
    hero: {
        titlePrefix: "用音樂，",
        titleHighlight: "點亮生活的瞬間",
        subtitle: "我們提供專業且充滿熱情的音樂教育，無論是古典鋼琴、流行吉他還是兒童律動，都能在這裡找到最適合您的學習方式，開啟您的音樂旅程。",
        buttonText: "免費預約諮詢",
        heroImage: "https://images.unsplash.com/photo-1552422535-c45813c61732?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
        stats: [
            { label: "累計學員", value: "500+" },
            { label: "專業師資", value: "20+" },
            { label: "家長滿意", value: "100%" }
        ]
    },
    features: {
        visible: true,
        title: "為什麼選擇我們？",
        subtitle: "我們不只教音樂，更致力於培養孩子對藝術的熱愛與自信。",
        items: [
            { icon: "Users", title: "客製化教學", desc: "依據每位學員的程度與目標，量身打造專屬的學習計畫。", visible: true },
            { icon: "Award", title: "專業師資認證", desc: "所有教師皆來自國內外知名音樂院校，並通過嚴格考核。", visible: true },
            { icon: "Sparkles", title: "定期成果發表", desc: "每年舉辦兩次大型成果發表會，提供展現自我的舞台。", visible: true },
            { icon: "Calendar", title: "彈性排課系統", desc: "透過智慧系統輕鬆預約與請假，讓學習時間安排更靈活。", visible: true }
        ]
    },
    courses: {
        visible: true,
        title: "多元豐富的音樂課程",
        subtitle: "針對不同年齡與程度，提供最完整且專業的樂器教學",
        items: [] // Populated dynamically if empty
    },
    pricing: {
        visible: true,
        title: "透明的收費方案",
        subtitle: "依照您的學習需求，選擇最合適的課程方案。",
        plans: [
            { name: "個別指導", price: "1,200", unit: "/ 堂起", desc: "專注個人進度，老師全程指導。", color: "blue", features: ["1 對 1 專屬教學", "客製化進度安排", "可彈性預約時段", "包含樂器使用費"], visible: true },
            { name: "小組班", price: "600", unit: "/ 堂起", desc: "2-4 人小班制，同儕互動激勵。", color: "emerald", features: ["精緻小班教學", "互動式樂理遊戲", "固定上課時段", "培養合奏能力"], visible: true },
            { name: "團體班", price: "400", unit: "/ 堂起", desc: "大團體快樂學習，培養節奏感與聽力。", color: "amber", features: ["團體律動與歌唱", "基礎樂理與聽音", "社交能力培養", "定期成果展演"], visible: true },
            { name: "線上課程", price: "800", unit: "/ 堂起", desc: "打破空間限制，在家也能專業學習。", color: "purple", features: ["視訊即時互動", "電子樂譜提供", "課後錄影回放", "節省交通時間"], visible: true },
        ]
    },
    teachers: {
        visible: true,
        title: "專業師資團隊",
        subtitle: "來自各大音樂院校的優秀教師，擁有豐富教學經驗。",
        items: [] // Populated dynamically if empty
    },
    gallery: {
        visible: true,
        title: "精彩時刻",
        subtitle: "紀錄每一個專注練習與自信演出的瞬間",
        images: [
            { url: "https://images.unsplash.com/photo-1552422535-c45813c61732?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", visible: true },
            { url: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", visible: true },
            { url: "https://images.unsplash.com/photo-1545231499-52e4682c7009?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", visible: true },
            { url: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", visible: true },
            { url: "https://images.unsplash.com/photo-1525673337348-1b21773455a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", visible: true },
            { url: "https://images.unsplash.com/photo-1571327073757-71d13c24de30?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", visible: true },
        ]
    },
    testimonials: {
        visible: true,
        title: "學員與家長好評推薦",
        subtitle: "聽聽他們在這裡的學習故事",
        items: [
            { id: "t1", name: "陳媽媽", role: "學員家長", content: "自從孩子在這裡學鋼琴後，變得更有自信了！老師非常有耐心，不只是教技巧，更引導孩子享受音樂。", stars: 5, visible: true },
            { id: "t2", name: "林小弟", role: "吉他學員 (國二)", content: "原本覺得樂理很難，但老師用流行歌來教，讓我很快就上手，現在已經可以自彈自唱了！", stars: 5, visible: true },
            { id: "t3", name: "王先生", role: "成人鋼琴班", content: "小時候沒機會學琴，現在終於圓夢。環境很舒適，下班後來這裡練琴是非常放鬆的享受。", stars: 5, visible: true },
        ]
    },
    faq: {
        visible: true,
        title: "常見問題",
        subtitle: "整理了大家最常詢問的問題，希望能為您解答。",
        items: [
            { q: "完全沒有音樂基礎可以報名嗎？", a: "當然可以！我們有專門為零基礎學員設計的入門課程，無論是兒童還是成人，老師都會從最基礎的樂理和姿勢開始指導。", visible: true },
            { q: "上課需要自備樂器嗎？", a: "鋼琴、爵士鼓等大型樂器教室都有提供頂級設備供上課使用。小提琴、吉他等建議自備以便回家練習，若初期尚未購買，我們也提供課堂租借服務。", visible: true },
            { q: "可以預約試上嗎？", a: "可以的，我們提供付費體驗課程（費用可折抵正式學費）。這能讓您親自體驗老師的教學風格與教室環境，確認合適後再報名。", visible: true },
            { q: "請問請假或補課的機制？", a: "若需請假，請至少提前 24 小時通知，我們將協助安排補課。詳細規範會在其入學手冊中說明。", visible: true },
        ]
    },
    contact: {
        visible: true,
        title: "聯絡我們",
        subtitle: "無論是課程諮詢、參觀預約，都歡迎填寫表單，我們將盡快安排專人與您聯繫。",
        info: {
            phone: { value: "(02) 2345-6789", visible: true },
            email: { value: "info@huahuamusic.com", visible: true },
            address: { value: "台北市信義區音樂路 123 號", visible: true },
            openHours: { value: "週一至週日 10:00 - 21:00", visible: true }
        }
    }
};

export const DEFAULT_SYSTEM_CONFIG: SystemConfig = {
    subjects: DEFAULT_MUSIC_SUBJECTS,
    expenseCategories: DEFAULT_EXPENSE_CATEGORIES,
    classTypes: DEFAULT_CLASS_TYPES,
    appInfo: DEFAULT_APP_INFO,
    website: DEFAULT_WEBSITE_CONFIG
};

// ... rest of the file remains the same ...
// Data Generators Helpers
const SURNAMES = ['陳', '林', '黃', '張', '李', '王', '吳', '劉', '蔡', '楊', '許', '鄭', '謝', '郭', '洪', '曾', '邱', '廖', '賴', '徐'];
const NAMES_M = ['偉', '志', '豪', '明', '俊', '傑', '宇', '安', '廷', '宏', '家', '凱', '文', '強', '翔', '銘', '憲', '博', '承', '恩'];
const NAMES_F = ['雅', '婷', '怡', '君', '珊', '雯', '玲', '欣', '宜', '靜', '敏', '惠', '真', '儀', '佳', '琪', '涵', '宣', '如', '瑤'];
const GRADES = ['小一', '小二', '小三', '小四', '小五', '小六', '國一', '國二', '國三', '高一', '高二', '高三'];

const getRandomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// --- Generate Students ---
export const generateStudents = (count: number): Student[] => {
    const students: Student[] = [];
    for (let i = 1; i <= count; i++) {
        const isMale = Math.random() > 0.5;
        const name = getRandomItem(SURNAMES) + (isMale ? getRandomItem(NAMES_M) : getRandomItem(NAMES_F)) + (Math.random() > 0.3 ? (isMale ? getRandomItem(NAMES_M) : getRandomItem(NAMES_F)) : '');
        const parentName = name[0] + (Math.random() > 0.5 ? '爸爸' : '媽媽');
        
        students.push({
            id: `s${i}`,
            name: name,
            grade: getRandomItem(GRADES),
            phone: `09${getRandomInt(10, 99)}-${getRandomInt(100, 999)}-${getRandomInt(100, 999)}`,
            parentName: parentName,
            notes: Math.random() > 0.7 ? '需加強基礎' : '',
            joinedDate: `202${getRandomInt(1, 4)}-${getRandomInt(1, 12).toString().padStart(2, '0')}-${getRandomInt(1, 28).toString().padStart(2, '0')}`
        });
    }
    return students;
};

// --- Generate Teachers ---
const TEACHER_COLORS = [
    'bg-blue-100 text-blue-800 border-blue-200',
    'bg-green-100 text-green-800 border-green-200',
    'bg-purple-100 text-purple-800 border-purple-200',
    'bg-orange-100 text-orange-800 border-orange-200',
    'bg-pink-100 text-pink-800 border-pink-200',
    'bg-teal-100 text-teal-800 border-teal-200',
    'bg-indigo-100 text-indigo-800 border-indigo-200',
    'bg-rose-100 text-rose-800 border-rose-200',
    'bg-cyan-100 text-cyan-800 border-cyan-200',
    'bg-amber-100 text-amber-800 border-amber-200',
];

export const generateTeachers = (count: number): Teacher[] => {
    const teachers: Teacher[] = [];
    for (let i = 1; i <= count; i++) {
        const lastName = getRandomItem(SURNAMES);
        const firstName = Math.random() > 0.5 ? getRandomItem(NAMES_M) : getRandomItem(NAMES_F);
        // Special names for first few to match old mock data style slightly
        const name = i <= 3 ? (i===1 ? '王老師' : (i===2 ? 'Sara Chen' : 'David Wu')) : `${lastName}${firstName} 老師`;
        
        // Random Commission Rate between 50% and 70%
        const commissionRate = getRandomInt(50, 70); 
        
        teachers.push({
            id: `t${i}`,
            name: name,
            email: `teacher${i}@music.com`,
            phone: `09${getRandomInt(10, 99)}-000-${String(i).padStart(3, '0')}`,
            color: TEACHER_COLORS[i % TEACHER_COLORS.length],
            commissionRate: commissionRate
        });
    }
    return teachers;
};

// --- Generate Lessons (Expanded to ~2 months back + 2 weeks future) ---
export const generateLessons = (count: number, teachers: Teacher[], students: Student[]): Lesson[] => {
    const lessons: Lesson[] = [];
    const now = new Date();
    
    for (let i = 1; i <= count; i++) {
        // Date distribution: mostly past 60 days, some future 14 days
        const dayOffset = getRandomInt(-60, 14); 
        const date = new Date(now);
        date.setDate(date.getDate() + dayOffset);
        const dateStr = date.toISOString().split('T')[0];
        
        // Random Time (10:00 - 20:00)
        const hour = getRandomInt(10, 20);
        const minute = Math.random() > 0.5 ? '00' : '30';
        
        const teacher = getRandomItem(teachers);
        const type = Math.random() > 0.6 ? ClassType.PRIVATE : (Math.random() > 0.5 ? ClassType.SMALL_GROUP : ClassType.LARGE_GROUP);
        const subject = getRandomItem(DEFAULT_MUSIC_SUBJECTS);
        
        // Assign students based on type
        let lessonStudentIds: string[] = [];
        if (type === ClassType.PRIVATE) {
            lessonStudentIds = [getRandomItem(students).id];
        } else if (type === ClassType.SMALL_GROUP) {
            const size = getRandomInt(2, 4);
            for(let j=0; j<size; j++) lessonStudentIds.push(getRandomItem(students).id);
        } else {
            const size = getRandomInt(5, 12);
            for(let j=0; j<size; j++) lessonStudentIds.push(getRandomItem(students).id);
        }
        // Dedupe students
        lessonStudentIds = [...new Set(lessonStudentIds)];

        const duration = type === ClassType.LARGE_GROUP ? 90 : (type === ClassType.SMALL_GROUP ? 60 : (Math.random() > 0.8 ? 30 : 60));
        
        // Calculate Price and Cost
        // Base price assumptions per lesson
        let basePrice = 0;
        if (type === ClassType.PRIVATE) basePrice = getRandomInt(8, 15) * 100; // 800 - 1500
        else if (type === ClassType.SMALL_GROUP) basePrice = getRandomInt(12, 20) * 100; // 1200 - 2000 total
        else basePrice = getRandomInt(20, 40) * 100; // 2000 - 4000 total

        const price = basePrice;
        const cost = Math.floor(price * (teacher.commissionRate / 100));

        // Completion status: Past dates are mostly completed
        const isPast = dayOffset < 0;
        // 95% chance a past lesson is complete to make reports look realistic
        const isCompleted = isPast ? (Math.random() > 0.05) : false; 
        
        // Generate some realistic notes
        const lessonPlan = isCompleted ? `進度：${subject} 第 ${getRandomInt(1, 10)} 單元\n重點：音階練習與節奏感培養。` : '';
        const studentNotes: Record<string, string> = {};
        if (isCompleted) {
            lessonStudentIds.forEach(sid => {
                if (Math.random() > 0.5) {
                    studentNotes[sid] = Math.random() > 0.5 ? '表現優異，回家請多練習指法。' : '基礎稍弱，需加強視譜能力。';
                }
            });
        }

        lessons.push({
            id: `l${i}`,
            title: `${subject.split(' ')[0]} - ${type === ClassType.PRIVATE ? '個別指導' : (type === ClassType.SMALL_GROUP ? '小組班' : '團體大班')}`,
            subject: subject,
            teacherId: teacher.id,
            studentIds: lessonStudentIds,
            date: dateStr,
            startTime: `${hour}:${minute}`,
            durationMinutes: duration,
            type: type,
            price: price,
            cost: cost,
            isCompleted: isCompleted,
            lessonPlan: lessonPlan,
            studentNotes: studentNotes
        });
    }
    return lessons;
};

// --- Generate Mock Expenses (Cost Statistics) ---
export const generateExpenses = (count: number): Expense[] => {
    const expenses: Expense[] = [];
    const now = new Date();
    
    // 1. Generate Fixed Costs for this month and last month (Rent, Utilities)
    const monthsToCover = [0, 1]; // Current month offset, Previous month offset
    
    monthsToCover.forEach(monthOffset => {
        const d = new Date(now.getFullYear(), now.getMonth() - monthOffset, 5); // 5th of the month
        const dateStr = d.toISOString().split('T')[0];
        const monthName = d.getMonth() + 1;

        // Rent
        expenses.push({
            id: `e-rent-${monthOffset}`,
            date: dateStr,
            title: `${monthName}月 房租`,
            category: '房租水電',
            amount: 35000,
            note: '固定支出'
        });

        // Utilities
        expenses.push({
            id: `e-util-${monthOffset}`,
            date: dateStr,
            title: `${monthName}月 電費與水費`,
            category: '房租水電',
            amount: getRandomInt(3500, 5000),
            note: '依帳單實報實銷'
        });
        
         // Internet/Phone
         expenses.push({
            id: `e-net-${monthOffset}`,
            date: dateStr,
            title: `${monthName}月 網路費`,
            category: '硬體設備',
            amount: 1200,
            note: '光纖網路'
        });
    });

    // 2. Generate Random Variable Expenses
    const ITEMS = [
        { name: '鋼琴教本 Level 1 (批發)', cat: '教材採購', avg: 5000 },
        { name: '小提琴弦備品', cat: '硬體設備', avg: 2000 },
        { name: 'Facebook 廣告投放', cat: '行銷廣告', avg: 3000 },
        { name: '影印紙與文具', cat: '人事雜支', avg: 800 },
        { name: '調音師費用', cat: '硬體設備', avg: 2500 },
        { name: '環境清潔費', cat: '人事雜支', avg: 1500 },
        { name: '零食與茶水', cat: '人事雜支', avg: 600 },
        { name: '社群媒體行銷代操', cat: '行銷廣告', avg: 5000 },
    ];

    for (let i = 1; i <= count; i++) {
        const item = getRandomItem(ITEMS);
        const dayOffset = getRandomInt(-60, 0); // Last 2 months
        const date = new Date(now);
        date.setDate(date.getDate() + dayOffset);
        
        expenses.push({
            id: `e${i}`,
            date: date.toISOString().split('T')[0],
            title: item.name,
            category: item.cat,
            amount: Math.floor(item.avg * (Math.random() * 0.4 + 0.8)), // +/- 20%
            note: Math.random() > 0.7 ? '需統編' : ''
        });
    }
    
    // Sort by date desc
    return expenses.sort((a, b) => b.date.localeCompare(a.date));
};

// --- Generate Mock Sales (Sales Records) ---
export const generateSales = (count: number, students: Student[]): Sale[] => {
    const sales: Sale[] = [];
    const now = new Date();

    const PRODUCTS = [
        { name: '鋼琴教本 Level 1', price: 350 },
        { name: '初級樂理練習', price: 280 },
        { name: '小提琴松香', price: 150 },
        { name: '音樂班書包', price: 500 },
        { name: '節拍器', price: 800 },
        { name: '檢定報名費', price: 1200 },
        { name: '譜架', price: 450 },
    ];

    for (let i = 1; i <= count; i++) {
        const product = getRandomItem(PRODUCTS);
        const student = getRandomItem(students);
        // Distribution over last 60 days
        const dayOffset = getRandomInt(-60, 0);
        const date = new Date(now);
        date.setDate(date.getDate() + dayOffset);
        const qty = getRandomInt(1, 2);

        sales.push({
            id: `sale${i}`,
            date: date.toISOString().split('T')[0],
            studentId: student.id,
            itemName: product.name,
            quantity: qty,
            price: product.price,
            total: product.price * qty
        });
    }
    return sales.sort((a, b) => b.date.localeCompare(a.date));
};

// --- Generate Mock Users (Admin + Staff for Teachers) ---

const FULL_ACCESS = { view: true, edit: true };

// Default permissions for a teacher staff
const getStaffPermissions = (): Record<ModuleId, Permission> => {
    const perms: Record<ModuleId, Permission> = {} as any;
    Object.keys(MODULE_NAMES).forEach((key) => {
        perms[key as ModuleId] = { view: false, edit: false };
    });
    // Grant basic access
    perms.dashboard = { view: true, edit: false };
    perms.calendar = { view: true, edit: false }; // View only (or their own)
    perms.students = { view: true, edit: false };
    perms.payroll = { view: true, edit: false }; // Can only see own via App logic
    perms.settings = { view: true, edit: false }; // Personal UI settings only
    return perms;
};

export const DEFAULT_ADMIN_USER: AppUser = {
    id: 'admin',
    username: 'admin',
    password: 'admin',
    name: '系統管理員',
    role: 'admin',
    isFirstLogin: false,
    permissions: {
        dashboard: FULL_ACCESS,
        calendar: FULL_ACCESS,
        students: FULL_ACCESS,
        teachers: FULL_ACCESS,
        sales: FULL_ACCESS,
        expenses: FULL_ACCESS,
        payroll: FULL_ACCESS,
        reports: FULL_ACCESS,
        users: FULL_ACCESS,
        settings: FULL_ACCESS,
        test_mode: FULL_ACCESS,
        inquiries: FULL_ACCESS,
        website: FULL_ACCESS // Enable Website CMS for Admin
    }
};

export const generateMockUsers = (teachers: Teacher[]): AppUser[] => {
    const users = [DEFAULT_ADMIN_USER];
    
    teachers.forEach((teacher, index) => {
        const user: AppUser = {
            id: `user-${teacher.id}`,
            username: `teacher${index + 1}`,
            password: '123456',
            name: teacher.name,
            role: 'staff',
            isFirstLogin: true, // Mock users need to reset password
            permissions: getStaffPermissions(),
            teacherId: teacher.id
        };
        users.push(user);
    });

    return users;
};

// --- Generate Mock Availabilities ---
export const generateMockAvailabilities = (teachers: Teacher[]): Availability[] => {
    const availabilities: Availability[] = [];
    const now = new Date();
    // Generate for next 2 months for all teachers to ensure calendar looks active
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Pick 5 active teachers to have regular schedules
    const activeTeachers = teachers.slice(0, 8);

    activeTeachers.forEach(teacher => {
        // Create availability for 3 random days a week for next 8 weeks
        for (let w = 0; w < 8; w++) {
             for (let d = 0; d < 3; d++) {
                 // Random day offset
                 const dayOffset = (w * 7) + getRandomInt(0, 6);
                 const date = new Date(startDate);
                 date.setDate(date.getDate() + dayOffset);
                 const dateStr = date.toISOString().split('T')[0];

                 if (date.getDay() === 0) continue; // Skip Sunday for this mock

                 availabilities.push({
                    id: `avail-${teacher.id}-${dateStr}`,
                    teacherId: teacher.id,
                    date: dateStr,
                    timeSlots: [
                        { start: '13:00', end: '17:00' },
                        { start: '18:00', end: '21:00' }
                    ]
                });
             }
        }
    });

    return availabilities;
};

// --- Generate Inquiries (Website Contact Forms) ---
export const generateInquiries = (count: number): Inquiry[] => {
    const inquiries: Inquiry[] = [];
    const now = new Date();
    
    for (let i = 1; i <= count; i++) {
        // Random date in last 30 days
        const dayOffset = getRandomInt(-30, 0);
        const date = new Date(now);
        date.setDate(date.getDate() + dayOffset);
        // Add random time
        date.setHours(getRandomInt(9, 21), getRandomInt(0, 59));
        
        const isMale = Math.random() > 0.5;
        const name = getRandomItem(SURNAMES) + (isMale ? getRandomItem(NAMES_M) : getRandomItem(NAMES_F));
        
        const statusPool: Inquiry['status'][] = ['new', 'new', 'contacted', 'contacted', 'closed'];
        const status = getRandomItem(statusPool);
        
        let lastContactedAt = undefined;
        let lastContactedBy = undefined;
        let adminNotes = '';

        if (status !== 'new') {
            const contactDate = new Date(date);
            contactDate.setHours(date.getHours() + getRandomInt(2, 48)); // Contacted 2-48 hours later
            lastContactedAt = contactDate.toISOString();
            lastContactedBy = '系統管理員';
            adminNotes = status === 'closed' ? '已安排試上課程，家長滿意。' : '電話聯繫中，考慮週末時段。';
        }

        inquiries.push({
            id: `inq-${i}`,
            name: name,
            phone: `09${getRandomInt(10, 99)}-${getRandomInt(100, 999)}-${getRandomInt(100, 999)}`,
            subject: getRandomItem(DEFAULT_MUSIC_SUBJECTS),
            message: Math.random() > 0.5 ? '請問還有名額嗎？小孩完全沒學過。' : '',
            status: status,
            createdAt: date.toISOString(),
            lastContactedAt,
            lastContactedBy,
            adminNotes
        });
    }
    // Sort by createdAt desc
    return inquiries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

// Initial Generation for App Start (Static)
// These are kept for fallback, but the Reset function will use the generators to create FRESH data.
export const MOCK_STUDENTS = generateStudents(200);
export const MOCK_TEACHERS = generateTeachers(25);
export const INITIAL_LESSONS = generateLessons(450, MOCK_TEACHERS, MOCK_STUDENTS);
export const MOCK_EXPENSES = generateExpenses(35);
export const MOCK_SALES = generateSales(60, MOCK_STUDENTS);
export const MOCK_USERS = generateMockUsers(MOCK_TEACHERS);
export const MOCK_AVAILABILITIES = generateMockAvailabilities(MOCK_TEACHERS);
export const MOCK_INQUIRIES = generateInquiries(15);
