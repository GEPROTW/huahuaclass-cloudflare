
// Define types locally since @cloudflare/workers-types might not be available in the build context
interface D1Result<T = unknown> {
  results: T[];
  success: boolean;
  meta: any;
  error?: string;
}

interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run<T = unknown>(): Promise<D1Result<T>>;
  all<T = unknown>(): Promise<D1Result<T>>;
  raw<T = unknown>(): Promise<T[]>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  dump(): Promise<ArrayBuffer>;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  exec<T = unknown>(query: string): Promise<D1Result<T>>;
}

// R2 Types
interface R2Bucket {
  put(key: string, value: any, options?: any): Promise<any>;
  get(key: string): Promise<any>;
}

interface Fetcher {
  fetch(request: Request | string, init?: RequestInit): Promise<Response>;
}

interface Env {
  DB: D1Database;
  BUCKET: R2Bucket;
  ASSETS: Fetcher;
}

// Base tables list
const TABLES = [
  'Students', 'Teachers', 'Lessons', 'Expenses', 'Sales', 
  'Users', 'Availabilities', 'CalendarNotes', 'SystemConfig', 'Inquiries'
];

// Helper to generate CREATE SQL for a specific prefix
const generateCreateSQL = (prefix: string) => `
  CREATE TABLE IF NOT EXISTS ${prefix}Students (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, grade TEXT, phone TEXT, parentName TEXT, notes TEXT, joinedDate TEXT
  );
  CREATE TABLE IF NOT EXISTS ${prefix}Teachers (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT, phone TEXT, commissionRate INTEGER, color TEXT
  );
  CREATE TABLE IF NOT EXISTS ${prefix}Lessons (
    id TEXT PRIMARY KEY, title TEXT NOT NULL, subject TEXT, teacherId TEXT, studentIds TEXT, 
    date TEXT, startTime TEXT, durationMinutes INTEGER, type TEXT, price INTEGER, cost INTEGER, 
    isCompleted BOOLEAN, lessonPlan TEXT, studentNotes TEXT
  );
  CREATE TABLE IF NOT EXISTS ${prefix}Expenses (
    id TEXT PRIMARY KEY, date TEXT, title TEXT, category TEXT, amount INTEGER, note TEXT
  );
  CREATE TABLE IF NOT EXISTS ${prefix}Sales (
    id TEXT PRIMARY KEY, date TEXT, studentId TEXT, itemName TEXT, quantity INTEGER, price INTEGER, total INTEGER
  );
  CREATE TABLE IF NOT EXISTS ${prefix}Users (
    id TEXT PRIMARY KEY, username TEXT, password TEXT, name TEXT, role TEXT, permissions TEXT, 
    isFirstLogin BOOLEAN, teacherId TEXT, settings TEXT
  );
  CREATE TABLE IF NOT EXISTS ${prefix}Availabilities (
    id TEXT PRIMARY KEY, teacherId TEXT, date TEXT, timeSlots TEXT
  );
  CREATE TABLE IF NOT EXISTS ${prefix}CalendarNotes (
    id TEXT PRIMARY KEY, date TEXT, content TEXT, userId TEXT
  );
  CREATE TABLE IF NOT EXISTS ${prefix}SystemConfig (
    id TEXT PRIMARY KEY, subjects TEXT, expenseCategories TEXT, classTypes TEXT, appInfo TEXT, website TEXT
  );
  CREATE TABLE IF NOT EXISTS ${prefix}Inquiries (
    id TEXT PRIMARY KEY, name TEXT, phone TEXT, subject TEXT, message TEXT, 
    status TEXT, createdAt TEXT, lastContactedAt TEXT, lastContactedBy TEXT, adminNotes TEXT
  );
`;

// Helper to generate Seed SQL
const generateSeedSQL = (prefix: string) => `
  INSERT OR IGNORE INTO ${prefix}SystemConfig (id, subjects, expenseCategories, classTypes, appInfo, website) VALUES (
    'main',
    '["鋼琴 (Piano)","小提琴 (Violin)","聲樂 (Vocal)","吉他 (Guitar)","長笛 (Flute)","爵士鼓 (Drums)"]',
    '["教材採購","硬體設備","房租水電","行銷廣告","人事雜支","其他"]',
    '[{"id":"PRIVATE","name":"個別課"},{"id":"SMALL_GROUP","name":"小組課"},{"id":"LARGE_GROUP","name":"團體班"}]',
    '{"loginTitle":"Huahua Music Class","loginSubtitle":"智慧派課與薪酬管理系統","sidebarTitle":"Huahua Music","sidebarSubtitle":"智慧派課系統"}',
    NULL
  );

  INSERT OR IGNORE INTO ${prefix}Users (id, username, password, name, role, permissions, isFirstLogin, teacherId, settings) VALUES (
    'admin',
    'admin',
    'admin',
    '系統管理員',
    'admin',
    '{"dashboard":{"view":true,"edit":true},"calendar":{"view":true,"edit":true},"students":{"view":true,"edit":true},"teachers":{"view":true,"edit":true},"sales":{"view":true,"edit":true},"expenses":{"view":true,"edit":true},"payroll":{"view":true,"edit":true},"reports":{"view":true,"edit":true},"users":{"view":true,"edit":true},"settings":{"view":true,"edit":true},"test_mode":{"view":true,"edit":true},"inquiries":{"view":true,"edit":true},"website":{"view":true,"edit":true}}',
    0,
    NULL,
    '{"fontSizeScale":1,"spacingMode":"normal"}'
  );
`;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // 1. API Handling Logic
    if (url.pathname.startsWith('/api/data')) {
      return handleApiRequest(request, env);
    }
    
    // 2. R2 Image Upload Handling
    if (url.pathname === '/api/upload' && request.method === 'POST') {
      try {
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file || !(file instanceof File)) {
          return new Response('No file uploaded', { status: 400 });
        }

        const ext = file.name.split('.').pop() || 'jpg';
        const filename = `${crypto.randomUUID()}.${ext}`;
        
        await env.BUCKET.put(filename, file.stream(), {
          httpMetadata: {
            contentType: file.type || 'application/octet-stream',
          },
        });

        // Return the relative URL. The frontend/worker needs to handle /images/filename
        return new Response(JSON.stringify({ url: `/images/${filename}` }), {
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
      }
    }

    // 3. R2 Image Serving Handling
    if (url.pathname.startsWith('/images/')) {
      const key = url.pathname.slice(8); // remove '/images/'
      if (!key) return new Response('Image key missing', { status: 400 });

      const object = await env.BUCKET.get(key);

      if (!object) {
        return new Response('Image not found', { status: 404 });
      }

      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set('etag', object.httpEtag);
      // Ensure Cache-Control is set to avoid re-fetching often
      if (!headers.has('Cache-Control')) {
          headers.set('Cache-Control', 'public, max-age=31536000');
      }

      return new Response(object.body, {
        headers,
      });
    }
    
    // 4. Health Check
    if (url.pathname === '/api/health') {
        try {
            await env.DB.prepare('SELECT 1').first();
            try {
                // Check standard Users table
                const { results } = await env.DB.prepare("SELECT count(*) as count FROM Users").all();
                return new Response(JSON.stringify({ 
                    status: 'ok', 
                    tables: 'ready', 
                    userCount: results[0] ? (results[0] as any).count : 0 
                }), { status: 200, headers: {'Content-Type': 'application/json'} });
            } catch (e) {
                return new Response(JSON.stringify({ status: 'ok', tables: 'missing' }), { status: 200, headers: {'Content-Type': 'application/json'} });
            }
        } catch (err: any) {
            return new Response(JSON.stringify({ status: 'error', message: err.message }), { status: 500, headers: {'Content-Type': 'application/json'} });
        }
    }
    
    // 5. Database Initialization Endpoint
    if (url.pathname === '/api/init') {
      const reset = url.searchParams.get('reset') === 'true';
      const mode = url.searchParams.get('mode') || 'production';
      const prefix = mode === 'test' ? 'Test_' : '';

      try {
        if (reset) {
            // Drop only tables for the current mode
            for (const table of TABLES) {
                await env.DB.prepare(`DROP TABLE IF EXISTS ${prefix}${table}`).run();
            }
        }

        // Generate and execute CREATE statements
        const sql = generateCreateSQL(prefix) + generateSeedSQL(prefix);
        const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
        
        for (const statement of statements) {
            await env.DB.prepare(statement).run();
        }

        return new Response(`Database (${mode}) initialized successfully.`, { status: 200 });
      } catch (err: any) {
        return new Response(`Initialization failed: ${err.message}`, { status: 500 });
      }
    }

    // 6. Schema Migration Endpoint (PATCH)
    if (url.pathname === '/api/migrate') {
        const mode = url.searchParams.get('mode') || 'production';
        const prefix = mode === 'test' ? 'Test_' : '';
        
        try {
            // Attempt to add 'website' column to SystemConfig if it doesn't exist
            // SQLite doesn't support IF NOT EXISTS for column adding in all versions simply, 
            // but D1 usually handles the error gracefully or we catch it.
            // We'll catch "duplicate column name" error and treat as success.
            try {
                await env.DB.prepare(`ALTER TABLE ${prefix}SystemConfig ADD COLUMN website TEXT`).run();
            } catch (e: any) {
                if (!e.message?.includes('duplicate column name')) {
                    throw e; // Rethrow real errors
                }
            }
            
            return new Response(JSON.stringify({ success: true, message: 'Schema patched: website column added' }), { headers: {'Content-Type': 'application/json'} });
        } catch (e: any) {
            return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: {'Content-Type': 'application/json'} });
        }
    }

    // 7. Serve Static Assets (with SPA Fallback)
    // Try to get the static asset
    let response = await env.ASSETS.fetch(request);

    // If not found (404) and it's not a file request (doesn't look like an extension), 
    // allow falling back to index.html for React Router (Single Page App)
    if (response.status === 404 && !url.pathname.includes('.')) {
        response = await env.ASSETS.fetch(new Request(new URL('/index.html', request.url), request));
    }

    return response;
  }
};

async function handleApiRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const collection = url.searchParams.get('collection');
  const mode = url.searchParams.get('mode') || 'production'; // Default to production
  
  if (!collection) return new Response(JSON.stringify({ error: 'Missing collection' }), { status: 400 });

  const tableMap: Record<string, string> = {
    students: 'Students',
    teachers: 'Teachers',
    lessons: 'Lessons',
    expenses: 'Expenses',
    sales: 'Sales',
    users: 'Users',
    availabilities: 'Availabilities',
    calendar_notes: 'CalendarNotes',
    system_config: 'SystemConfig',
    inquiries: 'Inquiries'
  };

  let tableName = tableMap[collection];
  if (!tableName) return new Response(JSON.stringify({ error: 'Invalid collection' }), { status: 400 });

  // Apply Prefix for Test Mode
  if (mode === 'test') {
      tableName = `Test_${tableName}`;
  }

  try {
    if (request.method === 'GET') {
      const { results } = await env.DB.prepare(`SELECT * FROM ${tableName}`).all();
      return new Response(JSON.stringify(results), { headers: { 'Content-Type': 'application/json' } });
    } 
    
    else if (request.method === 'POST') {
      const body = await request.json() as any;
      
      if (Array.isArray(body)) {
          if (body.length === 0) return new Response(JSON.stringify({ count: 0 }), { headers: { 'Content-Type': 'application/json' } });
          const stmts = body.map(item => {
              const keys = Object.keys(item);
              const placeholders = keys.map(() => '?').join(',');
              const values = Object.values(item);
              // Use INSERT OR REPLACE to handle upserts gracefully
              return env.DB.prepare(`INSERT OR REPLACE INTO ${tableName} (${keys.join(',')}) VALUES (${placeholders})`).bind(...values);
          });
          await env.DB.batch(stmts);
          return new Response(JSON.stringify({ success: true, count: body.length }), { headers: { 'Content-Type': 'application/json' } });
      } 
      else {
          const keys = Object.keys(body);
          const placeholders = keys.map(() => '?').join(',');
          const values = Object.values(body);
          await env.DB.prepare(`INSERT OR REPLACE INTO ${tableName} (${keys.join(',')}) VALUES (${placeholders})`).bind(...values).run();
          return new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } });
      }
    } 
    
    else if (request.method === 'PUT') {
      const data = await request.json() as any;
      if (!data.id) return new Response('Missing ID', { status: 400 });
      const keys = Object.keys(data).filter(k => k !== 'id');
      const setClause = keys.map(k => `${k} = ?`).join(',');
      const values = keys.map(k => data[k]);
      values.push(data.id); 
      await env.DB.prepare(`UPDATE ${tableName} SET ${setClause} WHERE id = ?`).bind(...values).run();
      return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
    } 
    
    else if (request.method === 'DELETE') {
      const id = url.searchParams.get('id');
      const truncate = url.searchParams.get('truncate');

      if (truncate === 'true') {
          await env.DB.prepare(`DELETE FROM ${tableName}`).run();
          return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
      }

      if (!id) return new Response('Missing ID', { status: 400 });
      await env.DB.prepare(`DELETE FROM ${tableName} WHERE id = ?`).bind(id).run();
      return new Response(JSON.stringify({ success: true, id }), { headers: { 'Content-Type': 'application/json' } });
    }

    return new Response('Method not allowed', { status: 405 });

  } catch (err: any) {
    console.error("API Error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
