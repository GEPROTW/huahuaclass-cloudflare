
import { SystemConfig, ClearDataOptions } from '../types';
import { 
    DEFAULT_SYSTEM_CONFIG, 
    MOCK_STUDENTS, 
    MOCK_TEACHERS, 
    INITIAL_LESSONS, 
    MOCK_EXPENSES, 
    MOCK_SALES, 
    MOCK_USERS, 
    MOCK_AVAILABILITIES,
    MOCK_INQUIRIES
} from '../constants';

const JSON_FIELDS: Record<string, string[]> = {
    lessons: ['studentIds', 'studentNotes'],
    users: ['permissions', 'settings'],
    availabilities: ['timeSlots'],
    system_config: ['subjects', 'expenseCategories', 'classTypes', 'appInfo', 'website']
};

// Mode State
let currentMode: 'production' | 'test' = 'production';
let useLocalStorage = false; // Detected automatically

export const db = {
    setMode(mode: 'production' | 'test') {
        currentMode = mode;
    },

    getMode() {
        return currentMode;
    },

    isUsingLocal() {
        return useLocalStorage;
    },

    // --- Data Processing Helpers ---
    processIncomingData(collection: string, data: any) {
        if (!data) return data;
        const fieldsToParse = JSON_FIELDS[collection];
        const processItem = (item: any) => {
            const newItem = { ...item };
            if (fieldsToParse) {
                fieldsToParse.forEach(field => {
                    if (newItem[field] && typeof newItem[field] === 'string') {
                        try { newItem[field] = JSON.parse(newItem[field]); } catch (e) {}
                    }
                });
            }
            if (newItem.isCompleted !== undefined) newItem.isCompleted = !!newItem.isCompleted;
            if (newItem.isFirstLogin !== undefined) newItem.isFirstLogin = !!newItem.isFirstLogin;
            return newItem;
        };
        return Array.isArray(data) ? data.map(processItem) : processItem(data);
    },

    processOutgoingData(collection: string, data: any) {
        const fieldsToStringify = JSON_FIELDS[collection];
        const newItem = { ...data };
        if (fieldsToStringify) {
            fieldsToStringify.forEach(field => {
                if (newItem[field] !== undefined && typeof newItem[field] !== 'string') {
                    newItem[field] = JSON.stringify(newItem[field]);
                }
            });
        }
        return newItem;
    },

    // --- Local Storage Adapter (Fallback for AI Studio Preview) ---
    lsGet(collection: string) {
        const key = `eduflow_${currentMode}_${collection}`;
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    },
    
    lsSave(collection: string, data: any[]) {
        const key = `eduflow_${currentMode}_${collection}`;
        localStorage.setItem(key, JSON.stringify(data));
    },

    // --- Core API with Fallback ---
    async apiCall(endpoint: string, options?: RequestInit) {
        // If we already know we are in LocalStorage mode, skip fetch
        if (useLocalStorage) {
            throw new Error("Using LocalStorage Fallback");
        }

        try {
            const res = await fetch(endpoint, options);
            
            // CRITICAL FIX: Check Content-Type. 
            // In AI Studio Preview, non-existent API routes return 200 OK with index.html (SPA fallback).
            // We must interpret this as an API failure.
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.includes("text/html")) {
                 console.warn("API returned HTML (SPA Fallback). Switching to Local Storage Mode.");
                 useLocalStorage = true;
                 throw new Error("Switching to LocalStorage");
            }

            if (!res.ok) {
                // If 404 (Endpoint not found), it likely means we are in AI Studio Preview (No Worker)
                if (res.status === 404) {
                    console.warn("API not found (404). Switching to Local Storage Mode.");
                    useLocalStorage = true;
                    throw new Error("Switching to LocalStorage");
                }
                throw new Error(await res.text());
            }
            return res;
        } catch (e: any) {
            // Network errors or specific fallback triggers
            if (e.message.includes("Failed to fetch") || e.message.includes("Switching to LocalStorage") || e.message.includes("Fallback triggered")) {
                useLocalStorage = true;
                throw new Error("Fallback triggered");
            }
            throw e;
        }
    },

    async checkHealth(): Promise<{ok: boolean, message: string}> {
        try {
            const res = await this.apiCall('/api/health');
            const data = await res.json();
            return { ok: true, message: `Cloudflare D1: ${data.status}` };
        } catch (e) {
            if (useLocalStorage) {
                return { ok: true, message: "⚠️ 預覽模式 (Local Storage)" };
            }
            return { ok: false, message: "連線失敗" };
        }
    },

    // --- Image Upload ---
    async uploadImage(file: File): Promise<string> {
        if (useLocalStorage) {
            // Simulated upload for LocalStorage mode (Base64)
            // Warning: This consumes a lot of LS quota.
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        }

        try {
            const formData = new FormData();
            formData.append('file', file);
            
            const res = await this.apiCall('/api/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            return data.url; // Relative URL e.g. /images/uuid.jpg
        } catch (e) {
            // Fallback to Base64 if upload fails in what we thought was prod mode
            console.warn("Upload failed, falling back to Base64", e);
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        }
    },

    // --- Image Delete (R2) ---
    async deleteImage(imageUrl: string): Promise<void> {
        if (!imageUrl) return;
        
        // Extract filename from URL (e.g., /images/uuid.jpg -> uuid.jpg)
        // If it's a full URL or relative, we handle basic splitting
        const parts = imageUrl.split('/');
        const filename = parts.pop();
        
        if (!filename) return;

        if (useLocalStorage) {
            console.log("Local Storage Mode: Skipping R2 deletion for", filename);
            return;
        }

        try {
            await this.apiCall(`/api/upload?filename=${filename}`, {
                method: 'DELETE'
            });
            console.log(`Deleted image: ${filename}`);
        } catch (e) {
            console.warn("Failed to delete image from R2", e);
        }
    },

    async getCollection(collection: string) {
        try {
            const res = await this.apiCall(`/api/data?collection=${collection}&mode=${currentMode}`);
            const data = await res.json();
            return this.processIncomingData(collection, data);
        } catch (e) {
            // Local Storage Fallback
            return this.lsGet(collection);
        }
    },

    async add(collection: string, item: any) {
        const payload = this.processOutgoingData(collection, item);
        try {
            await this.apiCall(`/api/data?collection=${collection}&mode=${currentMode}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } catch (e) {
            // LS Fallback
            const items = this.lsGet(collection);
            // Check for duplicate ID if system config (singleton)
            if (collection === 'system_config') {
                const idx = items.findIndex((i:any) => i.id === item.id);
                if (idx >= 0) items[idx] = item; else items.push(item);
            } else {
                items.push(item);
            }
            this.lsSave(collection, items);
        }
        return this.getCollection(collection);
    },

    async update(collection: string, item: any) {
        const payload = this.processOutgoingData(collection, item);
        try {
            await this.apiCall(`/api/data?collection=${collection}&mode=${currentMode}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } catch (e) {
            const items = this.lsGet(collection);
            const index = items.findIndex((i:any) => i.id === item.id);
            if (index !== -1) {
                items[index] = item;
                this.lsSave(collection, items);
            }
        }
        return this.getCollection(collection);
    },

    async delete(collection: string, id: string) {
        try {
            await this.apiCall(`/api/data?collection=${collection}&id=${id}&mode=${currentMode}`, {
                method: 'DELETE'
            });
        } catch (e) {
            const items = this.lsGet(collection);
            const newItems = items.filter((i:any) => i.id !== id);
            this.lsSave(collection, newItems);
        }
        return this.getCollection(collection);
    },

    async batchAdd(collection: string, items: any[]) {
        if (items.length === 0) return;
        const CHUNK_SIZE = 50; 
        
        // LS Fallback shortcut
        if (useLocalStorage) {
            const current = this.lsGet(collection);
            this.lsSave(collection, [...current, ...items]);
            return;
        }

        for (let i = 0; i < items.length; i += CHUNK_SIZE) {
            const chunk = items.slice(i, i + CHUNK_SIZE);
            const payload = chunk.map(item => this.processOutgoingData(collection, item));
            
            try {
                await this.apiCall(`/api/data?collection=${collection}&mode=${currentMode}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } catch (e) {
                if (useLocalStorage) {
                    const current = this.lsGet(collection);
                    this.lsSave(collection, [...current, ...items]);
                    return;
                }
                throw e;
            }
        }
    },

    async truncate(collection: string) {
        try {
            await this.apiCall(`/api/data?collection=${collection}&truncate=true&mode=${currentMode}`, {
                method: 'DELETE'
            });
        } catch (e) {
            this.lsSave(collection, []);
        }
    },

    async getSystemConfig(): Promise<SystemConfig | null> {
        const data = await this.getCollection('system_config');
        if (Array.isArray(data) && data.length > 0) return data[0] as SystemConfig;
        return null;
    },

    async saveSystemConfig(config: SystemConfig) {
        // Use 'update' (PUT) instead of 'add' (POST) to avoid PK collision for 'main'
        // If 'main' doesn't exist, UPDATE usually fails in SQL, but our API PUT logic requires ID.
        // However, we initialized the DB with 'main', so PUT is safer.
        // If for some reason it doesn't exist (fresh wiped DB without init), we catch and try add.
        try {
            return await this.update('system_config', { ...config, id: 'main' });
        } catch (e) {
            // Fallback to add if update fails (e.g. record doesn't exist yet)
            return await this.add('system_config', { ...config, id: 'main' });
        }
    },

    async initializeData(forceReset = false) {
        try {
            // 1. Probe Config. This will trigger apiCall and auto-detect mode.
            const config = await this.getSystemConfig();
            
            // If Local Storage is active after probe, ensure minimal config exists
            if (useLocalStorage && !config) {
                // If it's a fresh Local Storage, we might need to seed it even if forceReset is false,
                // otherwise the app loads with empty data.
                console.log("Local Storage detected but empty. Seeding defaults...");
                forceReset = true; 
            }

            if (config && !forceReset) return true;

            console.log(forceReset ? `Resetting (${currentMode})...` : `Initializing (${currentMode})...`);

            // 2. Init Backend if mode is not LS
            if (!useLocalStorage) {
                try {
                    const res = await fetch(`/api/init?reset=${forceReset}&mode=${currentMode}`, { method: 'POST' });
                    // Check for SPA Fallback (HTML) here too
                    const contentType = res.headers.get("content-type");
                    if (!res.ok || (contentType && contentType.includes("text/html"))) {
                        console.warn("Backend Init missing. Switching to Local Storage.");
                        useLocalStorage = true;
                    }
                } catch (e) {
                    console.warn("Backend Init failed. Switching to Local Storage.");
                    useLocalStorage = true;
                }
            }

            // 3. Init LS if mode is LS (either from start or just flipped)
            if (useLocalStorage) {
                if (forceReset) {
                    const collections = Object.keys(JSON_FIELDS);
                    collections.push('students', 'teachers', 'expenses', 'sales', 'inquiries'); 
                    collections.forEach(c => localStorage.removeItem(`eduflow_${currentMode}_${c}`));
                }
            }

            // 4. Seed Data
            if (forceReset) {
                await this.batchAdd('teachers', MOCK_TEACHERS);
                await this.batchAdd('students', MOCK_STUDENTS);
                await this.batchAdd('lessons', INITIAL_LESSONS);
                await this.batchAdd('expenses', MOCK_EXPENSES);
                await this.batchAdd('sales', MOCK_SALES);
                await this.batchAdd('users', MOCK_USERS);
                await this.batchAdd('availabilities', MOCK_AVAILABILITIES);
                await this.batchAdd('inquiries', MOCK_INQUIRIES);
                // For system_config, we use add here because reset clears the table
                await this.add('system_config', DEFAULT_SYSTEM_CONFIG);
            }
            return true;
        } catch (e) {
            console.error("Init Failed:", e);
            throw e;
        }
    },
    
    // New: Patch Schema Migration (Add missing 'website' column)
    async runMigration() {
        if (useLocalStorage) {
            console.log("Local Storage Mode: No schema migration needed.");
            return { success: true, message: "Local Storage Mode (Skipped)" };
        }
        try {
            const res = await fetch(`/api/migrate?mode=${currentMode}`);
            const data = await res.json();
            return data;
        } catch (e: any) {
            console.error("Migration Failed:", e);
            throw e;
        }
    },

    // --- Backup & Restore ---
    async exportDatabase() {
        if (useLocalStorage) {
            // Local Storage Export Logic
            const exportData: Record<string, any[]> = {};
            const collections = Object.keys(JSON_FIELDS);
            collections.push('students', 'teachers', 'expenses', 'sales', 'inquiries'); 
            
            collections.forEach(c => {
                // Map collection names to standard Table names if possible to keep format consistent with API
                const map: Record<string, string> = {
                    students: 'Students', teachers: 'Teachers', lessons: 'Lessons',
                    expenses: 'Expenses', sales: 'Sales', users: 'Users',
                    availabilities: 'Availabilities', calendar_notes: 'CalendarNotes',
                    system_config: 'SystemConfig', inquiries: 'Inquiries'
                };
                const key = map[c] || c;
                exportData[key] = this.lsGet(c);
            });

            const blob = new Blob([JSON.stringify({ 
                meta: { version: '1.0', timestamp: new Date().toISOString(), mode: 'local' }, 
                data: exportData 
            })], { type: 'application/json' });
            
            return blob;
        } else {
            // API Export Logic
            try {
                const res = await this.apiCall(`/api/backup?mode=${currentMode}`);
                return await res.blob();
            } catch (e) {
                console.error("Export Failed:", e);
                throw e;
            }
        }
    },

    async importDatabase(file: File) {
        const text = await file.text();
        const json = JSON.parse(text);

        if (useLocalStorage) {
            // Local Storage Import Logic
            if (!json.data) throw new Error("Invalid backup format");
            
            // Clear current data first (Safety)
            const collections = Object.keys(JSON_FIELDS);
            collections.push('students', 'teachers', 'expenses', 'sales', 'inquiries'); 
            collections.forEach(c => localStorage.removeItem(`eduflow_${currentMode}_${c}`));

            // Restore
            const mapReverse: Record<string, string> = {
                Students: 'students', Teachers: 'teachers', Lessons: 'lessons',
                Expenses: 'expenses', Sales: 'sales', Users: 'users',
                Availabilities: 'availabilities', CalendarNotes: 'calendar_notes',
                SystemConfig: 'system_config', Inquiries: 'inquiries'
            };

            for (const [key, rows] of Object.entries(json.data)) {
                const collectionName = mapReverse[key];
                if (collectionName && Array.isArray(rows)) {
                    this.lsSave(collectionName, rows);
                }
            }
            return { success: true };
        } else {
            // API Import Logic
            try {
                const res = await this.apiCall(`/api/backup?mode=${currentMode}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: text
                });
                return await res.json();
            } catch (e) {
                console.error("Import Failed:", e);
                throw e;
            }
        }
    },

    async clearAllData(options: ClearDataOptions) {
        if (options.students) await this.truncate('students');
        if (options.teachers) { await this.truncate('teachers'); await this.truncate('users'); }
        if (options.lessons) await this.truncate('lessons');
        if (options.finances) { await this.truncate('expenses'); await this.truncate('sales'); }
        if (options.calendar) { await this.truncate('availabilities'); await this.truncate('calendar_notes'); }
        
        if (options.teachers) {
             const adminUser = MOCK_USERS.find(u => u.id === 'admin')!;
             await this.add('users', adminUser);
        }
    }
};
