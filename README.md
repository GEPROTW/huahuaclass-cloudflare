# Huahua Music Class (Cloudflare Edition)

這是一個專為音樂教育機構設計的智慧派課與薪酬管理系統。
本版本已優化為靜態網站架構，適合部署於 **Cloudflare Pages**。

## ☁️ Cloudflare D1 資料庫設定

本專案已設定連接至資料庫：`calss-cloudflare`。

### 1. 初始化資料庫 (首次部署必做)

請在終端機執行以下指令，將資料表結構寫入您的線上資料庫：

```bash
npx wrangler d1 execute calss-cloudflare --remote --file=./d1_schema.sql
```

若要在本機測試 (Local)，請執行：

```bash
npx wrangler d1 execute calss-cloudflare --local --file=./d1_schema.sql
```

### 2. 部署網站

```bash
npm run build
npx wrangler deploy
```

## 🚀 快速開始 (Run Locally)

1.  安裝相依套件：
    ```bash
    npm install
    ```

2.  設定 API Key：
    請在專案根目錄建立 `.env` 檔案，並填入您的 Google Gemini API Key：
    ```
    API_KEY=your_gemini_api_key_here
    ```

3.  啟動開發伺服器：
    ```bash
    npm run dev
    ```

## 💾 關於資料儲存架構

*   **目前狀態**：前端程式碼 (`services/db.ts`) 目前預設使用 **Local Storage** 進行展示與測試，這能讓您在不設定後端 API 的情況下直接體驗完整 UI 功能。
*   **啟用 D1 資料庫**：
    若要讓前端正式讀寫 Cloudflare D1 資料庫 (實現多裝置同步)，您需要：
    1.  在 `functions/` 目錄下建立 API 接口 (Cloudflare Pages Functions)。
    2.  修改 `services/db.ts` 將 `localStorage` 操作改為 `fetch('/api/...')` 呼叫。

## 🛠️ 技術堆疊

*   **Frontend**: React + Vite + TypeScript
*   **UI Framework**: Tailwind CSS + Lucide React
*   **Database**: Cloudflare D1 (SQL) / Local Storage (Fallback)
*   **Deployment**: Cloudflare Pages
