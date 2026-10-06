export type Locale = "zh" | "en";

export const LOCALES: Locale[] = ["zh", "en"];
export const LOCALE_STORAGE_KEY = "wpa_locale";

export type Dictionary = {
  meta: {
    title: string;
    description: string;
  };
  nav: {
    brand: string;
    home: string;
    play: string;
    admin: string;
    langZh: string;
    langEn: string;
  };
  home: {
    eyebrow: string;
    titleLine1: string;
    titleLine2: string;
    subtitle: string;
    ctaPlay: string;
    ctaAdmin: string;
    heroBadge: string;
    feature1Title: string;
    feature1Body: string;
    feature2Title: string;
    feature2Body: string;
    feature3Title: string;
    feature3Body: string;
  };
  common: {
    male: string;
    female: string;
    time: string;
    score: string;
    target: string;
    loadingCamera: string;
    ready: string;
    openCamera: string;
    playAgain: string;
    start30s: string;
    endEarly: string;
    uploading: string;
    viewAdmin: string;
    consent: string;
    waitingFace: string;
    livePrefix: string;
    yearsOld: string;
    expressionUncertain: string;
  };
  expressions: {
    neutral: string;
    happy: string;
    sad: string;
    angry: string;
    fearful: string;
    disgusted: string;
    surprised: string;
  };
  faceCatch: {
    eyebrow: string;
    title: string;
    description: string;
    overlayHint: string;
    noFaceUpload: string;
    result: string;
    uploadFail: string;
    cameraError: string;
  };
  emotionMatch: {
    eyebrow: string;
    title: string;
    description: string;
    overlayHint: string;
    promptBanner: string;
    noFaceUpload: string;
    result: string;
    uploadFail: string;
    cameraError: string;
  };
  admin: {
    eyebrow: string;
    title: string;
    subtitle: string;
    refresh: string;
    clear: string;
    clearConfirm: string;
    loading: string;
    loadError: string;
    emptyTitle: string;
    emptyHintBefore: string;
    emptyHintLink: string;
    emptyHintAfter: string;
    kpiTodayUsers: string;
    kpiTodayUsersHint: string;
    kpiTotalAttempts: string;
    kpiTotalAttemptsHint: string;
    kpiMostTime: string;
    kpiMostAttempts: string;
    kpiNoData: string;
    chartAttempts: string;
    chartDuration: string;
    chartDaily: string;
    chartGender: string;
    chartAge: string;
    chartExpression: string;
    attempts: string;
    minutes: string;
    users: string;
    sessions: string;
    people: string;
    times: string;
    gameSummary: string;
    colGame: string;
    colAttempts: string;
    colDuration: string;
    colPlayers: string;
    colAvgScore: string;
    recentSessions: string;
    colTime: string;
    colAge: string;
    colGender: string;
    colExpression: string;
    colLength: string;
    colScore: string;
  };
};

export const dictionaries: Record<Locale, Dictionary> = {
  zh: {
    meta: {
      title: "Webcam Player Analytics POC",
      description: "前台 Webcam 小遊戲 + 後台匿名分析儀表板",
    },
    nav: {
      brand: "Webcam Analytics POC",
      home: "首頁",
      play: "前台遊戲",
      admin: "後台分析",
      langZh: "中文",
      langEn: "EN",
    },
    home: {
      eyebrow: "Proof of Concept",
      titleLine1: "Webcam",
      titleLine2: "Player Analytics",
      subtitle:
        "前台可玩 Face Catch 與 Emotion Match；瀏覽器端估測年齡、性別與表情，後台看耗時、每日用戶與嘗試次數。",
      ctaPlay: "進入前台遊戲",
      ctaAdmin: "打開後台分析",
      heroBadge: "本機 TinyFaceDetector · AgeGender · Expression · 無影像上傳",
      feature1Title: "兩款 Webcam 遊戲",
      feature1Body:
        "Face Catch 接星星；Emotion Match 跟著提示做表情，各局都會回報耗時。",
      feature2Title: "分析在瀏覽器",
      feature2Body:
        "face-api 模型於 client 執行，只上傳匿名統計，不保存影片或照片。",
      feature3Title: "後台遊戲洞察",
      feature3Body: "最耗時遊戲、最多嘗試、每日用戶數，以及人口統計圖表。",
    },
    common: {
      male: "男性",
      female: "女性",
      time: "時間",
      score: "得分",
      target: "目標",
      loadingCamera: "載入模型與攝影機…",
      ready: "準備開始",
      openCamera: "開啟攝影機",
      playAgain: "再開一局",
      start30s: "開始 30 秒",
      endEarly: "提前結束",
      uploading: "上傳分析中…",
      viewAdmin: "前往後台看圖表 →",
      consent:
        "我了解這是 POC：臉部推斷僅在本機模型執行，上傳的是匿名年齡／性別／表情估計與分數，非真實身分資料。",
      waitingFace: "等待臉部偵測…請靠近鏡頭並保持正面",
      livePrefix: "即時",
      yearsOld: "歲",
      expressionUncertain: "（表情不確定）",
    },
    expressions: {
      neutral: "平靜",
      happy: "開心",
      sad: "難過",
      angry: "生氣",
      fearful: "害怕",
      disgusted: "厭惡",
      surprised: "驚訝",
    },
    faceCatch: {
      eyebrow: "Webcam Mini Game",
      title: "Face Catch",
      description:
        "用臉去接落下的星星。遊戲期間會在瀏覽器端估測年齡、性別與表情，結束後上傳匿名統計到後台（不存影片）。請正面對鏡頭、光線充足、臉部佔畫面約 1/4 以上，估測會較穩。",
      overlayHint: "允許攝影機權限後，對準臉部即可遊玩",
      noFaceUpload: "得分 {score}，但未穩定偵測到臉部，未上傳分析資料。",
      result:
        "得分 {score}｜估測約 {age} 歲｜{gender}｜表情 {expression}",
      uploadFail: "遊戲結束，但分析資料上傳失敗",
      cameraError: "無法啟動攝影機或模型",
    },
    emotionMatch: {
      eyebrow: "Webcam Mini Game",
      title: "Emotion Match",
      description:
        "跟隨畫面提示做出表情，維持約 0.7 秒即得分。同樣會估測年齡／性別並上傳匿名統計。",
      overlayHint: "做對提示表情並維持片刻即可得分",
      promptBanner: "請做出表情",
      noFaceUpload: "得分 {score}，但未穩定偵測到臉部，未上傳分析資料。",
      result: "配對成功 {score} 次｜估測約 {age} 歲｜{gender}",
      uploadFail: "遊戲結束，但分析資料上傳失敗",
      cameraError: "無法啟動攝影機或模型",
    },
    admin: {
      eyebrow: "Analytics Console",
      title: "玩家人口統計後台",
      subtitle:
        "彙整 Face Catch / Emotion Match 的匿名臉部估計、遊戲耗時、每日用戶與嘗試次數。每 5 秒自動刷新。",
      refresh: "立即刷新",
      clear: "清空資料",
      clearConfirm: "確定清空所有 session 資料？",
      loading: "載入儀表板…",
      loadError: "無法載入分析資料",
      emptyTitle: "尚無資料",
      emptyHintBefore: "請先到",
      emptyHintLink: "前台遊戲",
      emptyHintAfter: "完成一局",
      kpiTodayUsers: "今日用戶",
      kpiTodayUsersHint: "匿名瀏覽器 ID（當日）",
      kpiTotalAttempts: "總嘗試次數",
      kpiTotalAttemptsHint: "所有遊戲累計局數",
      kpiMostTime: "最耗時遊戲",
      kpiMostAttempts: "最多嘗試",
      kpiNoData: "尚無資料",
      chartAttempts: "各遊戲嘗試次數",
      chartDuration: "各遊戲累計遊玩時間（分鐘）",
      chartDaily: "每日活躍用戶數",
      chartGender: "性別分布",
      chartAge: "年齡區間",
      chartExpression: "主要表情",
      attempts: "嘗試次數",
      minutes: "分鐘",
      users: "用戶數",
      sessions: "局數",
      people: "人數",
      times: "次數",
      gameSummary: "遊戲摘要",
      colGame: "遊戲",
      colAttempts: "嘗試次數",
      colDuration: "累計時間",
      colPlayers: "獨立玩家",
      colAvgScore: "平均得分",
      recentSessions: "最近 Sessions",
      colTime: "時間",
      colAge: "年齡",
      colGender: "性別",
      colExpression: "表情",
      colLength: "時長",
      colScore: "得分",
    },
  },
  en: {
    meta: {
      title: "Webcam Player Analytics POC",
      description:
        "Webcam mini-games plus an anonymous analytics admin dashboard",
    },
    nav: {
      brand: "Webcam Analytics POC",
      home: "Home",
      play: "Play",
      admin: "Admin",
      langZh: "中文",
      langEn: "EN",
    },
    home: {
      eyebrow: "Proof of Concept",
      titleLine1: "Webcam",
      titleLine2: "Player Analytics",
      subtitle:
        "Play Face Catch and Emotion Match on the front end. Age, gender, and expression are estimated in-browser; the admin view shows playtime, daily users, and attempts.",
      ctaPlay: "Play games",
      ctaAdmin: "Open admin",
      heroBadge:
        "On-device TinyFaceDetector · AgeGender · Expression · no video upload",
      feature1Title: "Two webcam games",
      feature1Body:
        "Face Catch: catch stars. Emotion Match: follow expression prompts. Each round reports duration.",
      feature2Title: "Analysis in the browser",
      feature2Body:
        "face-api runs on the client. Only anonymous stats are uploaded — no photos or video.",
      feature3Title: "Game insights",
      feature3Body:
        "Most time spent, most attempts, daily users, plus demographic charts.",
    },
    common: {
      male: "Male",
      female: "Female",
      time: "Time",
      score: "Score",
      target: "Target",
      loadingCamera: "Loading models & camera…",
      ready: "Ready to start",
      openCamera: "Open camera",
      playAgain: "Play again",
      start30s: "Start 30s",
      endEarly: "End early",
      uploading: "Uploading analytics…",
      viewAdmin: "View admin charts →",
      consent:
        "I understand this is a POC: face inference runs locally; only anonymous age/gender/expression estimates and scores are uploaded — not real identity data.",
      waitingFace: "Waiting for a face… move closer and face the camera",
      livePrefix: "Live",
      yearsOld: "y",
      expressionUncertain: " (uncertain expression)",
    },
    expressions: {
      neutral: "Neutral",
      happy: "Happy",
      sad: "Sad",
      angry: "Angry",
      fearful: "Fearful",
      disgusted: "Disgusted",
      surprised: "Surprised",
    },
    faceCatch: {
      eyebrow: "Webcam Mini Game",
      title: "Face Catch",
      description:
        "Catch falling stars with your face. Age, gender, and expression are estimated in-browser and anonymous stats are uploaded after the round (no video stored). Face the camera with good light and keep your face ~¼ of the frame.",
      overlayHint: "Allow camera access, then face the lens to play",
      noFaceUpload:
        "Score {score}, but no stable face was detected — analytics were not uploaded.",
      result:
        "Score {score} · ~{age} yrs · {gender} · expression {expression}",
      uploadFail: "Round ended, but analytics upload failed",
      cameraError: "Could not start camera or models",
    },
    emotionMatch: {
      eyebrow: "Webcam Mini Game",
      title: "Emotion Match",
      description:
        "Follow the on-screen expression prompts and hold for ~0.7s to score. Age/gender are estimated and anonymous stats are uploaded.",
      overlayHint: "Match the prompt and hold briefly to score",
      promptBanner: "Make this expression",
      noFaceUpload:
        "Score {score}, but no stable face was detected — analytics were not uploaded.",
      result: "{score} matches · ~{age} yrs · {gender}",
      uploadFail: "Round ended, but analytics upload failed",
      cameraError: "Could not start camera or models",
    },
    admin: {
      eyebrow: "Analytics Console",
      title: "Player analytics",
      subtitle:
        "Anonymous face estimates, playtime, daily users, and attempts from Face Catch / Emotion Match. Auto-refreshes every 5 seconds.",
      refresh: "Refresh",
      clear: "Clear data",
      clearConfirm: "Clear all session data?",
      loading: "Loading dashboard…",
      loadError: "Could not load analytics",
      emptyTitle: "No data yet",
      emptyHintBefore: "Play a round on the",
      emptyHintLink: "game page",
      emptyHintAfter: "first",
      kpiTodayUsers: "Users today",
      kpiTodayUsersHint: "Anonymous browser IDs (today)",
      kpiTotalAttempts: "Total attempts",
      kpiTotalAttemptsHint: "Rounds across all games",
      kpiMostTime: "Most time spent",
      kpiMostAttempts: "Most attempts",
      kpiNoData: "No data",
      chartAttempts: "Attempts by game",
      chartDuration: "Total playtime by game (minutes)",
      chartDaily: "Daily active users",
      chartGender: "Gender distribution",
      chartAge: "Age buckets",
      chartExpression: "Dominant expressions",
      attempts: "Attempts",
      minutes: "Minutes",
      users: "Users",
      sessions: "Rounds",
      people: "Count",
      times: "Count",
      gameSummary: "Game summary",
      colGame: "Game",
      colAttempts: "Attempts",
      colDuration: "Total time",
      colPlayers: "Unique players",
      colAvgScore: "Avg score",
      recentSessions: "Recent sessions",
      colTime: "Time",
      colAge: "Age",
      colGender: "Gender",
      colExpression: "Expression",
      colLength: "Duration",
      colScore: "Score",
    },
  },
};

export function formatMessage(
  template: string,
  vars: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    String(vars[key] ?? `{${key}}`),
  );
}
