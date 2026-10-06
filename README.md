# Webcam Player Analytics POC

前台 Webcam 小遊戲 + 後台匿名分析儀表板（人口統計、遊戲耗時、每日用戶、嘗試次數）。

English: [README.en.md](./README.en.md)

## 功能一覽

| 路徑 | 說明 |
|------|------|
| `/` | 首頁導覽 |
| `/play` | **Face Catch**：用臉接星星；**Emotion Match**：跟著提示做表情 |
| `/admin` | 後台圖表：最耗時遊戲、最多嘗試、每日用戶、性別／年齡／表情 |
| `/api/sessions` | Session API（記憶體儲存；重啟程序／容器後清空） |

每局會上傳：`gameId`、匿名 `playerId`、年齡／性別／表情估計、分數、`durationMs`。

## 隱私與合規注意

- 臉部推論在 **瀏覽器端**（`@vladmandic/face-api`）執行
- **不上傳影片或照片**；只上傳匿名統計
- `playerId` 存在本機 `localStorage`，僅供每日活躍用戶估算，非真實身分
- 模型估測有誤差，**僅供 POC**，不可用於身分鑑定或商業決策

## 偵測準度提示

管線含 landmarks 對齊、較高解析度、EMA 平滑與離群值過濾。建議：

- 正面對鏡頭、光線充足
- 臉部約佔畫面 1/4 以上
- 避免大幅側臉、逆光、口罩／墨鏡

## 本機開發

```bash
npm install
npm run dev
```

開啟 [http://localhost:3000](http://localhost:3000)。

```bash
npm run build   # 目前使用 webpack（見 package.json）
npm start
```

## Docker

```bash
docker compose up --build
```

- 前台：http://localhost:3000/play  
- 後台：http://localhost:3000/admin  

停止：`docker compose down`

攝影機請用瀏覽器開 `http://localhost:3000`（安全來源）。不要用非本機的不安全 HTTP IP 測 webcam。

## 模型權重

`public/models/` 內的 **`.bin`／manifest 不需上傳 Git**（已在 `.gitignore`）。  
安裝依賴或建置時會自動從 `@vladmandic/face-api` 複製：

```bash
npm install          # postinstall → copy:models
npm run copy:models  # 手動同步
```

需要的檔案：`tiny_face_detector`、`face_landmark_68`、`age_gender`、`face_expression`。

## 安全與 Git

請勿將含個資、金鑰、錄影、session dump 的檔案提交到 Git。相關規則已寫在 `.gitignore`，例如：

- 環境變數：`.env`、`.env.*`（保留 `.env.example`）
- 憑證／金鑰：`*.pem`、`*.key`、`credentials*.json`、`service-account*.json`
- 媒體／臉部擷取：`*.webm`、`*.mp4`、`captures/`、`recordings/`、人臉圖檔等
- 分析匯出：`sessions*.json`、`analytics*.json`、`*.csv`、資料庫檔

本機可複製 `.env.example` 為 `.env.local` 後自行填寫（勿提交）。
