const LEVEL_COUNT = 10;
const STANDARD_QUESTS_PER_LEVEL = 10;
const DAILY_ENGLISH_QUESTS_PER_LEVEL = 20;

const BUILTIN_TOPICS = [
  {
    id: "analyst",
    title: "分析師之路",
    goal: "三年後具備獨立研究公司的能力",
    skills: ["經濟學", "財報分析", "公司分析", "產業分析", "總經", "投資學"],
    primarySkill: "財報分析",
    baseMaxExp: 300,
    expStep: 60,
    accent: "cyan",
    bossTitle: "財報解讀壓力測試",
    bossQuestions: ["公司真正賺的是什麼？", "利潤是否可持續？", "風險來自哪裡？", "你的結論是什麼？"],
    projectTitle: "產業研究備忘錄",
    projectSteps: ["核心指標", "競爭優勢", "成長動能", "風險摘要", "投資結論"],
  },
  {
    id: "english",
    title: "英文",
    goal: "能閱讀英文年報與法說會",
    skills: ["財經英文", "閱讀", "寫作", "字彙"],
    primarySkill: "財經英文",
    baseMaxExp: 120,
    expStep: 40,
    accent: "violet",
    bossTitle: "英文材料理解測試",
    bossQuestions: ["管理層語氣是什麼？", "最重要關鍵字是什麼？", "哪一句最值得重看？", "你會怎麼中文總結？"],
    projectTitle: "英語閱讀檔案",
    projectSteps: ["摘要句", "關鍵字", "風險詞", "語氣判讀", "中文重述"],
  },
  {
    id: "dailyEnglish",
    title: "日常英語",
    goal: "把英文變成每天會開口與會寫的技能",
    skills: ["口說", "生活情境", "句型", "聽讀反應"],
    primarySkill: "口說表達",
    baseMaxExp: 100,
    expStep: 35,
    accent: "emerald",
    bossTitle: "情境英語通關",
    bossQuestions: ["這個情境你會怎麼開口？", "你會用哪個句型？", "哪個字是重點？", "你能自然地重說一次嗎？"],
    projectTitle: "生活英語口袋本",
    projectSteps: ["情境句", "常用詞", "替換說法", "短對話", "每日複誦"],
  },
  {
    id: "trading",
    title: "交易系統",
    goal: "建立自己的交易框架",
    skills: ["技術分析", "風控", "回測", "紀律"],
    primarySkill: "風控紀律",
    baseMaxExp: 120,
    expStep: 40,
    accent: "amber",
    bossTitle: "交易紀律壓力測試",
    bossQuestions: ["這筆交易的風險在哪？", "規則是否可重複？", "哪一步最容易失控？", "你會怎麼避免再犯？"],
    projectTitle: "交易系統草案",
    projectSteps: ["進場規則", "出場規則", "風險限制", "回測摘要", "紀律檢查"],
  },
  {
    id: "growth",
    title: "個人成長",
    goal: "建立穩定執行系統",
    skills: ["專注", "時間管理", "深度工作", "習慣建立"],
    primarySkill: "深度工作",
    baseMaxExp: 150,
    expStep: 50,
    accent: "rose",
    bossTitle: "執行力驗收",
    bossQuestions: ["阻力來自哪裡？", "你真的排進日程了嗎？", "最小可執行版本是什麼？", "你會怎麼持續？"],
    projectTitle: "個人系統升級卡",
    projectSteps: ["環境設定", "時間區塊", "最小習慣", "每週回顧", "修正策略"],
  },
];

export const DEFAULT_SETTINGS = {
  dailyLoad: "focused",
  reviewMode: "hybrid",
  timerMode: "focus",
  hintMode: "guided",
};

export const SETTINGS_OPTIONS = {
  dailyLoad: [
    { id: "focused", label: "單題推進", description: "每個主題每日 1 題，壓力最低。" },
    { id: "balanced", label: "平衡練習", description: "每個主題每日 2 題，進度更穩。" },
    { id: "intensive", label: "加壓模式", description: "每個主題每日 3 題，節奏最快。" },
  ],
  reviewMode: [
    { id: "coaching", label: "教練導向", description: "較重視鼓勵與補答建議。" },
    { id: "hybrid", label: "混合驗收", description: "規則判定與教練回饋並重。" },
    { id: "strict", label: "嚴格驗收", description: "需要更高覆蓋率與更完整回答。" },
  ],
  timerMode: [
    { id: "focus", label: "專注倒數", description: "使用原始倒數時間。" },
    { id: "relaxed", label: "寬鬆倒數", description: "時間延長 50%。" },
    { id: "off", label: "不計時", description: "保留流程，但不啟動倒數。" },
  ],
  hintMode: [
    { id: "sparse", label: "少提示", description: "一次只給一條提示。" },
    { id: "guided", label: "逐步引導", description: "按一次多推進一步。" },
    { id: "coach", label: "教練模式", description: "優先顯示補答方向與示意。" },
  ],
};

const DAILY_ENGLISH_SCENARIOS = [
  "打招呼", "自我介紹", "安排今天行程", "描述早餐", "點飲料", "買東西", "問路",
  "搭車", "報到", "打電話", "傳訊息", "邀約", "拒絕", "表達喜歡", "描述心情",
  "看醫生", "工作請求", "學習計畫", "旅行應對", "睡前回顧",
];

const ANALYST_LEVELS = [
  levelSpec("分析師 Lv0 基礎會計", "財報分析", "先建立會計三表與資金來源的直覺。", [
    "資產定義", "負債定義", "股東權益", "借款變化", "應收帳款", "存貨意義", "折舊直覺", "現金用途", "設備資產", "資金來源",
  ]),
  levelSpec("分析師 Lv1 損益表", "財報分析", "理解公司賺錢是如何一層一層形成。", [
    "營收來源", "銷貨成本", "毛利率", "營業費用", "營業利益", "稅後淨利", "業外項目", "費用侵蝕", "營收成長", "獲利品質",
  ]),
  levelSpec("分析師 Lv2 現金流", "財報分析", "把獲利和現金拆開來看。", [
    "營運現金流", "投資現金流", "籌資現金流", "資本支出", "折舊回加", "應收帳款增加", "存貨堆積", "自由現金流", "現金缺口", "現金流品質",
  ]),
  levelSpec("分析師 Lv3 效率指標", "公司分析", "開始用指標比較公司效率。", [
    "ROE", "ROA", "毛利率對比", "營益率", "淨利率", "資產週轉", "存貨週轉", "應收帳款週轉", "槓桿影響", "杜邦拆解",
  ]),
  levelSpec("分析師 Lv4 資本結構", "公司分析", "理解公司怎麼借錢、還錢、擴張。", [
    "負債比", "流動比率", "速動比率", "利息保障倍數", "短債壓力", "長債結構", "現金水位", "增資影響", "回購意義", "股利政策",
  ]),
  levelSpec("分析師 Lv5 公司分析", "公司分析", "從商業模式與競爭力看公司。", [
    "商業模式", "護城河", "定價權", "客戶集中", "供應商依賴", "產品組合", "管理層品質", "擴產邏輯", "市占率", "競爭優勢",
  ]),
  levelSpec("分析師 Lv6 產業分析", "產業分析", "把公司放回產業位置中理解。", [
    "產業鏈位置", "上游議價", "下游需求", "景氣循環", "進入門檻", "替代風險", "供需失衡", "庫存週期", "技術路線", "市場結構",
  ]),
  levelSpec("分析師 Lv7 總經框架", "總經", "把公司結果連回利率、景氣與政策。", [
    "升息影響", "降息影響", "匯率波動", "通膨壓力", "景氣循環", "出口需求", "資本支出週期", "政策補貼", "失業與消費", "領先指標",
  ]),
  levelSpec("分析師 Lv8 投資判讀", "投資學", "把財報與產業資訊轉成投資觀點。", [
    "估值邏輯", "成長 vs 價值", "安全邊際", "市場預期", "利多兌現", "風險報酬比", "催化劑", "下修風險", "多空論點", "投資結論",
  ]),
  levelSpec("分析師 Lv9 綜合驗收", "投資學", "綜合公司、產業、總經與估值做完整判讀。", [
    "季度總結", "關鍵數字排序", "管理層訊號", "風險摘要", "下一季觀察", "市場誤判", "研究筆記", "投資假設", "反方論點", "最終判斷",
  ]),
];

const ENGLISH_LEVELS = [
  levelSpec("英文 Lv0 關鍵字抓取", "財經英文", "先看懂材料中的主軸與高頻字。", [
    "董事長信主軸", "高頻關鍵字", "一句中文摘要", "公司語氣", "展望字眼", "風險字眼", "客戶描述", "技術描述", "資本支出字眼", "成長敘事",
  ]),
  levelSpec("英文 Lv1 年報閱讀", "閱讀", "從段落中抓出管理層最想說的重點。", [
    "開場白總結", "段落主題句", "管理層重點", "重複概念", "正面措辭", "保守措辭", "未來展望", "目標客戶", "營運挑戰", "關鍵引用句",
  ]),
  levelSpec("英文 Lv2 法說會", "閱讀", "訓練法說會口語資訊的拆解能力。", [
    "開場語氣", "營收敘述", "成本壓力", "需求變化", "產能利用", "展望句型", "expect 用法", "maintain 用法", "navigate 用法", "一句總結",
  ]),
  levelSpec("英文 Lv3 風險段落", "字彙", "把風險字眼和投資判讀連起來。", [
    "uncertainty", "volatility", "regulation", "litigation", "exposure", "customer concentration", "inventory risk", "margin pressure", "currency impact", "guidance cut",
  ]),
  levelSpec("英文 Lv4 財報用語", "字彙", "熟悉常見財務敘述。", [
    "gross margin", "operating income", "free cash flow", "capital expenditure", "inventory turnover", "accounts receivable", "working capital", "share repurchase", "dividend policy", "guidance",
  ]),
  levelSpec("英文 Lv5 重述能力", "寫作", "把英文材料轉成自己的中文。", [
    "一句重述", "兩句摘要", "管理層觀點", "風險重點", "利多摘要", "利空摘要", "數字重點", "情緒判讀", "對投資人的意義", "反方提醒",
  ]),
  levelSpec("英文 Lv6 問答判讀", "閱讀", "拆解法說 Q&A 的真實訊號。", [
    "分析師提問", "管理層避重就輕", "重點回應", "模糊措辭", "承諾程度", "風險承認", "需求不確定", "訂單能見度", "庫存問題", "競爭回答",
  ]),
  levelSpec("英文 Lv7 專有字彙", "字彙", "逐步掌握投資圈高頻專有詞。", [
    "headwind", "tailwind", "normalized", "one-off", "resilient", "secular growth", "cyclical weakness", "pricing power", "utilization", "visibility",
  ]),
  levelSpec("英文 Lv8 輸出表達", "寫作", "開始用簡單英文輸出理解。", [
    "一句英文摘要", "兩句英文重述", "英文風險提示", "英文管理層語氣", "英文需求判讀", "英文成本敘述", "英文投資觀察", "英文市場預期", "英文結論", "英文追問",
  ]),
  levelSpec("英文 Lv9 綜合閱讀", "財經英文", "把英文閱讀能力整合到研究流程中。", [
    "整篇摘要", "關鍵段落排序", "最值得重讀的句子", "風險最高段", "最樂觀段", "最保守段", "你會抄下的字", "可疑訊號", "研究備忘錄", "最終判讀",
  ]),
];

const TRADING_LEVELS = [
  levelSpec("交易 Lv0 風控先行", "風控", "先學會保命，再談賺錢。", [
    "最大虧損", "停損位置", "單筆風險", "總資金風險", "錯誤成本", "連虧應對", "部位縮小", "先看風險", "報酬幻覺", "情緒止損",
  ]),
  levelSpec("交易 Lv1 部位管理", "風控", "把風險轉成具體部位大小。", [
    "部位大小", "風險單位", "波動大小", "加碼條件", "減碼條件", "資金分配", "集中風險", "相關性", "單筆上限", "風險一致性",
  ]),
  levelSpec("交易 Lv2 進場規則", "技術分析", "沒有明確規則的進場等於沒有系統。", [
    "突破進場", "回測進場", "趨勢確認", "量價配合", "假突破", "等待訊號", "進場清單", "市場噪音", "條件不足", "好機會定義",
  ]),
  levelSpec("交易 Lv3 出場與停利", "技術分析", "出場規則和進場規則一樣重要。", [
    "停利邏輯", "移動停損", "保本處理", "趨勢反轉", "目標價", "時間停損", "訊號失效", "出場紀律", "提早下車", "抱單壓力",
  ]),
  levelSpec("交易 Lv4 回測框架", "回測", "把想法變成可驗證規則。", [
    "進出場定義", "樣本期間", "市場條件", "勝率", "盈虧比", "期望值", "最大回撤", "過度擬合", "樣本外測試", "回測紀錄",
  ]),
  levelSpec("交易 Lv5 紀錄系統", "紀律", "沒有紀錄就很難知道自己哪裡在失控。", [
    "交易日誌", "犯錯分類", "情緒紀錄", "規則違反", "回顧頻率", "圖表存檔", "進場理由", "出場理由", "復盤問題", "改進方向",
  ]),
  levelSpec("交易 Lv6 市場判讀", "技術分析", "市場環境會決定策略是否適用。", [
    "震盪盤", "趨勢盤", "假訊號", "波動擴大", "量能萎縮", "關鍵支撐", "關鍵壓力", "多空切換", "高低點結構", "市場節奏",
  ]),
  levelSpec("交易 Lv7 系統期待值", "回測", "把單筆結果拉回整體系統。", [
    "期望值", "勝率迷思", "大賺小賠", "小賺大賠", "交易成本", "滑價", "樣本數", "回撤容忍", "長期期待", "策略穩定性",
  ]),
  levelSpec("交易 Lv8 壓力管理", "紀律", "系統真正的敵人常常是自己。", [
    "報復單", "追價衝動", "錯失恐懼", "過度交易", "連勝鬆懈", "連虧懷疑", "交易疲勞", "中斷規則", "停手機制", "情緒恢復",
  ]),
  levelSpec("交易 Lv9 系統整合", "回測", "把策略、風控與紀律整成一套可持續流程。", [
    "完整流程", "盤前檢查", "進場授權", "出場授權", "違規處理", "每週回顧", "每月檢查", "策略淘汰", "調整條件", "最終紀律",
  ]),
];

const GROWTH_LEVELS = [
  levelSpec("成長 Lv0 專注啟動", "專注", "先把專注環境搭起來。", [
    "深度工作時段", "手機干擾", "桌面整理", "單一目標", "開始儀式", "結束儀式", "專注阻力", "最小啟動", "番茄節奏", "中斷處理",
  ]),
  levelSpec("成長 Lv1 時間區塊", "時間管理", "先分配，再執行。", [
    "三段時間區塊", "黃金時段", "低能量任務", "行程留白", "緩衝時間", "明日規劃", "日程排序", "優先順序", "時間浪費點", "行程可行性",
  ]),
  levelSpec("成長 Lv2 習慣最小化", "習慣建立", "先小到能連續做。", [
    "目標習慣", "最小版本", "觸發點", "行為綁定", "環境提示", "失敗門檻", "七天持續", "習慣堆疊", "身份認同", "小幅加量",
  ]),
  levelSpec("成長 Lv3 深度工作", "深度工作", "練習進入長時間高品質輸出。", [
    "90 分鐘專注", "工作切片", "高能任務", "注意力回收", "干擾紀錄", "休息節點", "輸出標準", "專注指標", "低效訊號", "深度回顧",
  ]),
  levelSpec("成長 Lv4 拖延拆解", "習慣建立", "把阻力拆開來處理。", [
    "拖延觸發點", "任務模糊", "害怕失敗", "開始困難", "完美主義", "逃避行為", "降低門檻", "先做兩分鐘", "阻力紀錄", "破局步驟",
  ]),
  levelSpec("成長 Lv5 能量管理", "時間管理", "不是所有時間都適合做一樣的事。", [
    "高能時段", "低能修復", "睡眠影響", "飲食波動", "注意力耗損", "午間低潮", "恢復策略", "能量日誌", "高價值安排", "節奏穩定",
  ]),
  levelSpec("成長 Lv6 每週回顧", "深度工作", "讓系統每週都可修正。", [
    "本週完成", "本週卡點", "下週優先", "習慣成功率", "拖延原因", "環境修正", "時間分配", "輸出品質", "學習進度", "回顧節點",
  ]),
  levelSpec("成長 Lv7 決策清晰", "專注", "減少反覆橫跳與內耗。", [
    "今天只做一條主線", "決策條件", "放棄清單", "資訊過載", "同時做太多", "切換成本", "選擇疲勞", "預先承諾", "界線設定", "結束判準",
  ]),
  levelSpec("成長 Lv8 學習系統", "習慣建立", "把學習變成可複製流程。", [
    "輸入流程", "輸出流程", "複習節點", "筆記格式", "任務拆解", "驗收方式", "週期檢查", "知識回收", "作品化", "主題聚焦",
  ]),
  levelSpec("成長 Lv9 執行整合", "深度工作", "讓時間、專注、習慣與回顧接起來。", [
    "完整日流程", "週期節奏", "高低優先級", "每日啟動", "每日收尾", "系統脆弱點", "備援方案", "持續性風險", "修正策略", "執行總結",
  ]),
];

const DAILY_ENGLISH_LEVELS = [
  dailyEnglishSpec("日常英語 Lv0 生存句", "最短句先開口，先敢講。"),
  dailyEnglishSpec("日常英語 Lv1 日常流程", "把一天常見情境變成固定句。"),
  dailyEnglishSpec("日常英語 Lv2 問答反應", "從單句進到來回兩句。"),
  dailyEnglishSpec("日常英語 Lv3 禮貌表達", "加入請求、拒絕與緩衝語氣。"),
  dailyEnglishSpec("日常英語 Lv4 描述能力", "能更完整描述人事時地物。"),
  dailyEnglishSpec("日常英語 Lv5 情緒與想法", "開始自然表達想法與感受。"),
  dailyEnglishSpec("日常英語 Lv6 工作學習", "能應付學習與工作中的小互動。"),
  dailyEnglishSpec("日常英語 Lv7 社交互動", "把對話延長，不只回答 yes/no。"),
  dailyEnglishSpec("日常英語 Lv8 旅行應對", "能更穩定地在陌生情境開口。"),
  dailyEnglishSpec("日常英語 Lv9 自然輸出", "把句型、詞彙和反應速度接起來。"),
];

const TOPIC_LEARNING_PROFILES = {
  analyst: {
    learnerStage: "beginner_unsteady",
    targetOutcome: "研究公司財報與各項資料，建立基本面分析能力",
    tone: "teacher_foundation",
    resourceMode: ["notes", "official_links", "worked_example"],
    resourceDepth: "detailed",
    questionBlend: "mixed",
    preferredQuizModes: ["single_choice", "multi_select", "boolean"],
    visualStyles: ["exam_explainer_card", "realistic_context_image"],
    visualPlacement: "above_question",
    externalSourceTypes: ["company_official", "government_official", "major_news"],
    preferredMultiSelectAnswers: 2,
  },
  english: {
    learnerStage: "beginner_unsteady",
    targetOutcome: "讀懂財經英文與年報句子",
    tone: "teacher_foundation",
    resourceMode: ["worked_example"],
    resourceDepth: "medium",
    questionBlend: "mixed",
    preferredQuizModes: ["single_choice", "boolean"],
    visualStyles: ["exam_explainer_card", "realistic_context_image"],
    visualPlacement: "above_question",
  },
  dailyEnglish: {
    learnerStage: "beginner_unsteady",
    targetOutcome: "在日常場景自然開口和回應",
    tone: "real_world_scenario",
    resourceMode: ["notes"],
    resourceDepth: "detailed",
    questionBlend: "mixed",
    preferredQuizModes: ["single_choice", "boolean", "short_response"],
    visualStyles: ["exam_explainer_card", "realistic_context_image"],
    visualPlacement: "above_question",
  },
  trading: {
    learnerStage: "beginner_unsteady",
    targetOutcome: "建立基本交易判斷與風控觀念",
    tone: "real_world_scenario",
    resourceMode: ["notes"],
    resourceDepth: "medium",
    questionBlend: "mixed",
    preferredQuizModes: ["single_choice", "multi_select", "boolean"],
    visualStyles: ["exam_explainer_card", "realistic_context_image"],
    visualPlacement: "above_question",
    preferredMultiSelectAnswers: 2,
  },
  growth: {
    learnerStage: "beginner_unsteady",
    targetOutcome: "建立穩定執行與不拖延的系統",
    tone: "coach_follow_up",
    resourceMode: ["notes"],
    resourceDepth: "medium",
    questionBlend: "mixed",
    preferredQuizModes: ["single_choice", "multi_select", "boolean"],
    visualStyles: ["exam_explainer_card", "realistic_context_image"],
    visualPlacement: "above_question",
    preferredMultiSelectAnswers: 2,
  },
};

function levelSpec(title, skill, materialLead, subtopics) {
  return { title, skill, materialLead, subtopics };
}

function dailyEnglishSpec(title, materialLead) {
  return {
    title,
    skill: "口說表達",
    materialLead,
    subtopics: DAILY_ENGLISH_SCENARIOS,
  };
}

function titleCaseLevel(level) {
  return "Lv" + level;
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function createCustomTopicId(title, existingIds) {
  const base = slugify("custom-" + String(title || "").trim()) || "custom-topic";
  const existing = new Set(existingIds || []);
  if (!existing.has(base)) {
    return base;
  }
  let suffix = 2;
  while (existing.has(base + "-" + suffix)) {
    suffix += 1;
  }
  return base + "-" + suffix;
}

function loadCountFromSettings(settings) {
  switch (settings?.dailyLoad) {
    case "balanced":
      return 2;
    case "intensive":
      return 3;
    default:
      return 1;
  }
}

function timerMultiplier(settings) {
  if (settings?.timerMode === "relaxed") {
    return 1.5;
  }
  return 1;
}

function getHintIncrement(settings) {
  if (settings?.hintMode === "coach") {
    return 2;
  }
  return 1;
}

function getReviewThresholds(settings, quest) {
  const questionWeight = quest.questions.length * 48;
  if (settings?.reviewMode === "strict") {
    return {
      minFailLength: Math.max(55, quest.questions.length * 22),
      passLength: Math.max(180, questionWeight + 20),
      passCoverage: 0.85,
      reinforceCoverage: 0.6,
    };
  }
  if (settings?.reviewMode === "coaching") {
    return {
      minFailLength: Math.max(35, quest.questions.length * 16),
      passLength: Math.max(120, questionWeight - 30),
      passCoverage: 0.68,
      reinforceCoverage: 0.45,
    };
  }
  return {
    minFailLength: Math.max(45, quest.questions.length * 18),
    passLength: Math.max(150, questionWeight),
    passCoverage: 0.75,
    reinforceCoverage: 0.5,
  };
}

function keywordList(topic, levelTitle, label, extras) {
  return [label, topic.primarySkill, levelTitle, ...(extras || [])];
}

function buildQuestRubric(topic, levelSpecData, itemLabel, concepts) {
  return concepts.map(function (item) {
    return {
      concept: item.concept,
      keywords: keywordList(topic, levelSpecData.title, itemLabel, item.keywords),
      followUp: item.followUp.replaceAll("{label}", itemLabel),
      coachNote: item.coachNote,
    };
  });
}

function getTopicLearningProfile(topicId) {
  return TOPIC_LEARNING_PROFILES[topicId] || null;
}

function noteResource(label, content) {
  return { type: "note", label, content };
}

function choiceOption(id, text) {
  return { id, text };
}

function finalizeQuizItems(items, seedBase) {
  const expandedItems = ensurePreferredQuizLength(items, seedBase);
  return expandedItems.map(function (item, index) {
    const shuffledOptions = [...item.options].sort(function (left, right) {
      return quizHash(seedBase + ":" + index + ":" + left.id) - quizHash(seedBase + ":" + index + ":" + right.id);
    });
    return { ...item, options: shuffledOptions };
  });
}

function ensurePreferredQuizLength(items, seedBase) {
  if (items.length >= 5) {
    return items;
  }
  const parts = String(seedBase || "").split(":");
  const topicId = parts[0];
  const levelIndex = Number(parts[1] || 0);
  const itemLabel = parts.slice(2).join(":");
  const nextItems = [...items];
  while (nextItems.length < 5) {
    nextItems.push(buildFallbackQuizItem(topicId, levelIndex, itemLabel, nextItems.length + 1));
  }
  return nextItems;
}

function buildFallbackQuizItem(topicId, levelIndex, itemLabel, questionNumber) {
  if (topicId === "analyst") {
    return {
      id: "q" + questionNumber,
      format: "multi_select",
      prompt: itemLabel + " 這題最適合優先參考哪些來源？",
      options: [
        choiceOption("a", "公司法說會或投資人關係資料"),
        choiceOption("b", "主管機關或正式統計資料"),
        choiceOption("c", "大型新聞網站的產業報導"),
        choiceOption("d", "沒有來源的短影音摘要"),
      ],
      correctAnswer: ["a", "b", "c"],
      explanation: "分析基本面時，優先使用公司官方資料、正式部門資料與大型媒體報導，避免只看無來源的二手摘要。",
    };
  }
  if (topicId === "english") {
    return {
      id: "q" + questionNumber,
      format: "choice",
      prompt: "讀到年報句子時，哪個順序最適合作為第一輪理解？",
      options: [
        choiceOption("a", "先抓主詞與動詞，再看轉折，最後補專有名詞"),
        choiceOption("b", "先背整句，再猜意思"),
        choiceOption("c", "先查每個字，再完全重翻"),
        choiceOption("d", "先判斷股價漲跌"),
      ],
      correctAnswer: "a",
      explanation: "英文主題先練句子骨架，再補細節，這樣比較能真正讀懂財經文本。",
    };
  }
  if (topicId === "dailyEnglish") {
    return {
      id: "q" + questionNumber,
      format: "choice",
      prompt: "在「" + itemLabel + "」情境中，初學者最好的第一步是什麼？",
      options: [
        choiceOption("a", "先用一小句可直接開口的英文完成回應"),
        choiceOption("b", "先寫一段正式作文"),
        choiceOption("c", "先記十個艱深片語"),
        choiceOption("d", "先不說，等完全準備好再開口"),
      ],
      correctAnswer: "a",
      explanation: "日常英語先求能開口和能回應，再慢慢拉長句子與細節。",
    };
  }
  if (topicId === "trading") {
    return {
      id: "q" + questionNumber,
      format: "multi_select",
      prompt: "面對交易情境時，哪些步驟應該在進場前先確認？",
      options: [
        choiceOption("a", "停損位置"),
        choiceOption("b", "進場條件是否成立"),
        choiceOption("c", "單筆風險是否在規則內"),
        choiceOption("d", "先猜這筆一定會賺多少"),
      ],
      correctAnswer: ["a", "b", "c"],
      explanation: "交易系統先確認規則、風險與條件，不靠情緒預測結果。",
    };
  }
  return {
    id: "q" + questionNumber,
    format: "multi_select",
    prompt: "要讓「" + itemLabel + "」真的落地，哪些做法通常比較有效？",
    options: [
      choiceOption("a", "把行動拆成可執行的小步驟"),
      choiceOption("b", "設定固定觸發條件"),
      choiceOption("c", "留下回顧與追蹤方式"),
      choiceOption("d", "只靠臨時情緒撐下去"),
    ],
    correctAnswer: ["a", "b", "c"],
    explanation: "個人成長題目重點在可執行、可追蹤、可回顧，而不是只靠意志力。",
  };
}

function quizHash(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return Math.abs(hash >>> 0);
}

function buildQuizGroupQuest(topic, levelIndex, levelSpecData, itemLabel, itemIndex, seconds, exp, followUpOpenEnded) {
  const base = buildBaseQuest(topic, levelIndex, levelSpecData, itemLabel, itemIndex, seconds, exp);
  const quizItems = createQuizItems(topic, levelIndex, itemLabel);
  return {
    ...base,
    type: "quiz_group",
    materialTitle: "題組導讀：" + itemLabel,
    materials: [
      levelSpecData.materialLead,
      "這一題先不要長篇作答，先用題組確認基礎概念。",
      "先完成判斷，再看系統回饋與解釋。",
    ],
    summary: [
      "你現在在基礎階段，這題先用選擇題和是非題確認觀念。",
      "目標不是硬背，而是先知道哪些判斷是對的、哪些直覺是錯的。",
    ],
    answerGuide: [
      "先逐題作答，不要跳題。",
      "遇到不確定時，先選你最有把握的判斷。",
      "完成後看錯題解釋，再把概念補回去。",
    ],
    resources: [
      noteResource("題組策略", "先做判斷題建立基本輪廓，再進到後面的開放題會更順。"),
      noteResource("通過標準", "題組全部作答後，答對率達到門檻就算通過。"),
    ],
    followUpOpenEnded,
    questions: quizItems,
    clear: "請完成整組題目並提交驗收。",
    hints: [
      "先選你最直覺認為對的答案。",
      "如果卡住，回頭看題組導讀和學習資源。",
      "錯題的重點不是扣分，而是幫你抓出觀念缺口。",
    ],
  };
}

function createQuizItems(topic, levelIndex, itemLabel) {
  if (topic.id === "analyst") {
    return createAnalystQuizItems(levelIndex, itemLabel);
  }
  if (topic.id === "english") {
    return createEnglishQuizItems(levelIndex, itemLabel);
  }
  if (topic.id === "dailyEnglish") {
    return createDailyEnglishQuizItems(levelIndex, itemLabel);
  }
  if (topic.id === "trading") {
    return createTradingQuizItems(itemLabel);
  }
  return createGrowthQuizItems(itemLabel);
}

function createAnalystQuizItems(levelIndex, itemLabel) {
  if (levelIndex === 0) {
    return finalizeQuizItems([
      {
        id: "q1",
        format: "choice",
        prompt: "下列哪一個最接近「" + itemLabel + "」在財報中的意思？",
        options: [
          choiceOption("a", "公司控制的資源或未來可帶來價值的項目"),
          choiceOption("b", "公司已經付出去、不能再收回的現金支出"),
          choiceOption("c", "公司帳上任何看得到的金額都算"),
          choiceOption("d", "只要會讓公司未來賺錢的想法都算"),
        ],
        correctAnswer: "a",
        explanation: itemLabel + " 在基礎會計裡，重點是先理解它代表公司掌握的資源，不是市場價格或情緒。",
      },
      {
        id: "q2",
        format: "boolean",
        prompt: "是非題：資產增加時，負債和股東權益一定也要有對應變化。",
        options: [choiceOption("true", "是"), choiceOption("false", "否")],
        correctAnswer: "true",
        explanation: "會計式一定要平衡，所以資產的變動一定會對應到負債、權益，或另一個資產項目的變化。",
      },
      {
        id: "q3",
        format: "choice",
        prompt: "公司向銀行借 100 萬現金時，最可能發生什麼？",
        options: [
          choiceOption("a", "資產增加、負債增加"),
          choiceOption("b", "現金增加，所以股東權益同步增加"),
          choiceOption("c", "因為借到的是現金，所以只會影響資產"),
          choiceOption("d", "負債增加，但資產不一定會變"),
        ],
        correctAnswer: "a",
        explanation: "借款進來會讓現金增加，同時公司對銀行的債務也增加。",
      },
      {
        id: "q4",
        format: "boolean",
        prompt: "是非題：存貨一定越高越好，因為代表公司東西很多。",
        options: [choiceOption("true", "是"), choiceOption("false", "否")],
        correctAnswer: "false",
        explanation: "存貨高可能是備貨，也可能是賣不掉，所以不能單看高低判斷好壞。",
      },
    ], "analyst:" + levelIndex + ":" + itemLabel);
  }

  if (levelIndex === 1) {
    return finalizeQuizItems([
      {
        id: "q1",
        format: "choice",
        prompt: "毛利率下降時，第一個該聯想到的是哪一類問題？",
        options: [
          choiceOption("a", "成本、售價或產品組合變化"),
          choiceOption("b", "公司營收一定同時下降"),
          choiceOption("c", "只代表市場情緒變差"),
          choiceOption("d", "代表稅率突然提高"),
        ],
        correctAnswer: "a",
        explanation: "毛利率主要反映營收扣掉直接成本後的結果，通常先看成本、售價與產品組合。",
      },
      {
        id: "q2",
        format: "boolean",
        prompt: "是非題：營收成長，就一定代表公司獲利品質也變好。",
        options: [choiceOption("true", "是"), choiceOption("false", "否")],
        correctAnswer: "false",
        explanation: "營收成長不等於獲利變好，還要一起看毛利率、費用率與現金流。",
      },
      {
        id: "q3",
        format: "choice",
        prompt: "如果營收上升，但營業利益率下降，較合理的初步判讀是？",
        options: [
          choiceOption("a", "公司可能多賣了，但賺得不一定更有效率"),
          choiceOption("b", "代表獲利一定比去年高很多"),
          choiceOption("c", "代表費用一定沒有變"),
          choiceOption("d", "代表公司只是會計寫法不同，不能判讀"),
        ],
        correctAnswer: "a",
        explanation: "營收和效率要分開看，營業利益率下降代表費用或成本壓力可能在增加。",
      },
      {
        id: "q4",
        format: "boolean",
        prompt: "是非題：稅後淨利會受到業外項目影響。",
        options: [choiceOption("true", "是"), choiceOption("false", "否")],
        correctAnswer: "true",
        explanation: "稅後淨利是最終結果，會受到營運內外各種收益與損失影響。",
      },
    ], "analyst:" + levelIndex + ":" + itemLabel);
  }

  return finalizeQuizItems([
    {
      id: "q1",
      format: "choice",
      prompt: "哪一項最能說明為什麼「獲利」和「現金」不能直接畫上等號？",
      options: [
        choiceOption("a", "因為應收帳款、存貨、折舊等都可能讓兩者不同步"),
        choiceOption("b", "因為現金流只跟借款有關，和營運沒有關係"),
        choiceOption("c", "因為只要有獲利，現金就會自動跟上"),
        choiceOption("d", "因為現金流看的是股東權益，不看營收成本"),
      ],
      correctAnswer: "a",
      explanation: "損益表採認列原則，現金流則看เงินจริง進出，所以常常不同步。",
    },
    {
      id: "q2",
      format: "boolean",
      prompt: "是非題：營運現金流為負，代表公司一定是壞公司。",
      options: [choiceOption("true", "是"), choiceOption("false", "否")],
      correctAnswer: "false",
      explanation: "要看原因，成長期擴張或短期營運變化都可能讓現金流轉弱。",
    },
    {
      id: "q3",
      format: "choice",
      prompt: "如果應收帳款增加很多，但營收也在成長，第一個該注意的是？",
      options: [
        choiceOption("a", "公司收款是否變慢"),
        choiceOption("b", "公司 logo 是否改版"),
        choiceOption("c", "公司一定更安全"),
        choiceOption("d", "代表現金一定變多"),
      ],
      correctAnswer: "a",
      explanation: "應收帳款拉高常代表錢還沒真正收到，要留意現金回收品質。",
    },
    {
      id: "q4",
      format: "boolean",
      prompt: "是非題：自由現金流通常比單看淨利更接近公司真實可運用的現金能力。",
      options: [choiceOption("true", "是"), choiceOption("false", "否")],
        correctAnswer: "true",
        explanation: "自由現金流會把營運現金和資本支出都納入，比單看獲利更接近現金實況。",
      },
  ], "analyst:" + levelIndex + ":" + itemLabel);
}

function createEnglishQuizItems(levelIndex, itemLabel) {
  return finalizeQuizItems([
    {
      id: "q1",
      format: "choice",
      prompt: "When you read a finance sentence in English, what is the best first move?",
      options: [
        choiceOption("a", "Find the subject, main verb, and any contrast word"),
        choiceOption("b", "Translate every word before reading the whole sentence"),
        choiceOption("c", "Memorize the whole sentence first"),
        choiceOption("d", "Guess the stock price direction immediately"),
      ],
      correctAnswer: "a",
      explanation: "先抓句子骨架，比逐字翻更容易看懂整體意思。",
    },
    {
      id: "q2",
      format: "boolean",
      prompt: "是非題：although、but 這類字常常在提示保留條件或語氣轉折。",
      options: [choiceOption("true", "是"), choiceOption("false", "否")],
      correctAnswer: "true",
      explanation: "這些字很常決定句子真正重點在哪裡。",
    },
      {
        id: "q3",
        format: "choice",
        prompt: "For \"" + itemLabel + "\", what are you mainly training?",
        options: [
          choiceOption("a", "Catch the key idea and restate it in your own words"),
          choiceOption("b", "Translate every word in exactly the same way each time"),
          choiceOption("c", "Only memorize vocabulary without sentence meaning"),
          choiceOption("d", "Judge the company only from one unknown word"),
        ],
        correctAnswer: "a",
        explanation: "財經英文重點是理解材料、抓語氣、轉成自己的研究語言。",
    },
    {
      id: "q4",
      format: "boolean",
      prompt: "是非題：看英文材料時，能用中文白話重述，通常比逐字硬翻更能證明你真的懂。",
      options: [choiceOption("true", "是"), choiceOption("false", "否")],
        correctAnswer: "true",
        explanation: "白話重述能驗證你有沒有抓到真正意思。",
      },
  ], "english:" + levelIndex + ":" + itemLabel);
}

function createDailyEnglishQuizItems(levelIndex, itemLabel) {
  const stagePrompt =
    levelIndex === 0 ? "最短能用句" :
    levelIndex === 1 ? "把情境接成兩句" :
    "讓對話能往下走";
  return finalizeQuizItems([
    {
      id: "q1",
      format: "choice",
      prompt: "在「" + itemLabel + "」情境裡，如果目標是" + stagePrompt + "，第一步最合理的是？",
      options: [
        choiceOption("a", "先講出一個最短可用句"),
        choiceOption("b", "先把句子想成中文再逐字翻"),
        choiceOption("c", "等想到完美文法再說"),
        choiceOption("d", "先安靜觀察，不要開口"),
      ],
      correctAnswer: "a",
      explanation: "日常英語先求能開口，之後再慢慢延長句子。",
    },
    {
      id: "q2",
      format: "boolean",
      prompt: "是非題：日常情境英語的目標是先能被聽懂，不是第一天就文法完美。",
      options: [choiceOption("true", "是"), choiceOption("false", "否")],
      correctAnswer: "true",
      explanation: "先能表達需求，才有機會越講越自然。",
    },
      {
        id: "q3",
        format: "choice",
        prompt: "如果你已經說完第一句，第二句最好的功能通常是？",
        options: [
          choiceOption("a", "補資訊，讓對方更懂你的需求"),
          choiceOption("b", "換更難的單字，讓句子看起來厲害"),
          choiceOption("c", "把第一句全部重說一次，避免出錯"),
          choiceOption("d", "直接切回中文補完細節"),
        ],
        correctAnswer: "a",
        explanation: "第二句的任務是讓對話能走下去，而不是再背一個新規則。",
    },
    {
      id: "q4",
      format: "boolean",
      prompt: "是非題：日常英語每題都應該至少帶走一個可重複使用的句型。",
      options: [choiceOption("true", "是"), choiceOption("false", "否")],
        correctAnswer: "true",
        explanation: "這樣你才會從單題練習累積成真正可用的語言庫。",
      },
  ], "dailyEnglish:" + levelIndex + ":" + itemLabel);
}

function createTradingQuizItems(itemLabel) {
  return finalizeQuizItems([
    {
      id: "q1",
      format: "choice",
      prompt: "交易系統基礎題裡，面對「" + itemLabel + "」最好的思路是？",
      options: [
        choiceOption("a", "先看風險，再看報酬"),
        choiceOption("b", "先找報酬最大的點，風險之後再補"),
        choiceOption("c", "先看市場最熱的說法，再決定要不要跟"),
        choiceOption("d", "先進場測試，之後再補規則"),
      ],
      correctAnswer: "a",
      explanation: "交易系統的底層永遠先是風險控制。",
    },
    {
      id: "q2",
      format: "boolean",
      prompt: "是非題：有沒有規則，比這筆單最後有沒有賺錢更重要。",
      options: [choiceOption("true", "是"), choiceOption("false", "否")],
      correctAnswer: "true",
      explanation: "單筆盈虧會有運氣，規則才決定你能不能長期活下來。",
    },
    {
      id: "q3",
      format: "choice",
      prompt: "如果一筆交易的最大風險你根本算不出來，較合理的做法是？",
      options: [
        choiceOption("a", "先不要做，或縮小到能控制的範圍"),
        choiceOption("b", "加大部位測試"),
        choiceOption("c", "追價進場"),
        choiceOption("d", "忽略風險"),
      ],
      correctAnswer: "a",
      explanation: "算不出風險，代表你還沒有真的準備好進場。",
    },
    {
      id: "q4",
      format: "boolean",
      prompt: "是非題：連續幾筆賺錢，不代表你的交易紀律就一定穩。",
      options: [choiceOption("true", "是"), choiceOption("false", "否")],
        correctAnswer: "true",
        explanation: "連勝可能來自運氣，紀律要看長期是否照規則執行。",
      },
  ], "trading:" + itemLabel);
}

function createGrowthQuizItems(itemLabel) {
  return finalizeQuizItems([
    {
      id: "q1",
      format: "choice",
      prompt: "在個人成長題裡，面對「" + itemLabel + "」最好的開始方式通常是？",
      options: [
        choiceOption("a", "先做一個最小可執行版本"),
        choiceOption("b", "先把規則寫到最完整，之後再行動"),
        choiceOption("c", "等連續三天狀態都很好再開始"),
        choiceOption("d", "先提高標準，這樣比較有動力"),
      ],
      correctAnswer: "a",
      explanation: "能開始比看起來很完整更重要。",
    },
    {
      id: "q2",
      format: "boolean",
      prompt: "是非題：想持續執行時，環境設計通常比單靠意志力更重要。",
      options: [choiceOption("true", "是"), choiceOption("false", "否")],
      correctAnswer: "true",
      explanation: "環境和流程會大幅降低摩擦，讓行為更容易發生。",
    },
    {
      id: "q3",
      format: "choice",
      prompt: "如果一個習慣總是做不起來，第一個要檢查的是？",
      options: [
        choiceOption("a", "門檻是不是設太高"),
        choiceOption("b", "是不是自己完全沒救"),
        choiceOption("c", "是不是要一次做更久"),
        choiceOption("d", "是不是應該加更多規則"),
      ],
      correctAnswer: "a",
      explanation: "很多失敗不是不夠努力，而是起手式太大。",
    },
    {
      id: "q4",
      format: "boolean",
      prompt: "是非題：每週回顧的功能之一，就是找出你總是卡住的固定模式。",
      options: [choiceOption("true", "是"), choiceOption("false", "否")],
        correctAnswer: "true",
        explanation: "回顧不是自責，而是找規律並修正系統。",
      },
  ], "growth:" + itemLabel);
}

function buildBaseQuest(topic, levelIndex, levelSpecData, itemLabel, itemIndex, seconds, exp) {
  const questId = topic.id + "-" + levelIndex + "-" + String(itemIndex + 1).padStart(2, "0");
  const learningProfile = getTopicLearningProfile(topic.id);
  return {
    id: questId,
    topic: topic.id,
    skill: levelSpecData.skill,
    type: "standard",
    title: levelSpecData.title + " " + String(itemIndex + 1).padStart(2, "0") + "｜" + itemLabel,
    track: topic.title + " / " + levelSpecData.skill,
    minLevel: levelIndex,
    maxLevel: levelIndex,
    seconds,
    exp,
    learningProfile,
    visualAid: {
      placement: learningProfile?.visualPlacement || "above_question",
      styles: learningProfile?.visualStyles || [],
      prompt:
        topic.id === "analyst"
          ? "題庫解析圖卡，展示 " + itemLabel + " 的財報/來源判讀重點"
          : topic.id === "english"
            ? "題庫解析圖卡，拆解 " + itemLabel + " 的英文句子結構與關鍵詞"
            : topic.id === "dailyEnglish"
              ? "真實情境插圖，呈現 " + itemLabel + " 的日常對話場景"
              : topic.id === "trading"
                ? "題庫解析圖卡，展示 " + itemLabel + " 的交易規則與情境判斷"
                : "題庫解析圖卡，展示 " + itemLabel + " 的執行流程與反思重點",
    },
  };
}

function buildAnalystConceptQuest(topic, levelIndex, levelSpecData, itemLabel, itemIndex, seconds, exp) {
  return {
    ...buildBaseQuest(topic, levelIndex, levelSpecData, itemLabel, itemIndex, seconds, exp),
    materialTitle: "學習資料：" + levelSpecData.materialLead,
    materials: [
      levelSpecData.materialLead,
      "本題焦點：" + itemLabel,
      "先講清楚定義，再把它放進一個最小財務情境。",
      "不要背名詞，要說它在公司裡實際代表什麼。 ",
    ],
    questions: [
      "如果你要用白話解釋「" + itemLabel + "」，你會怎麼說？",
      "這個概念在財報或公司經營裡，通常反映什麼現象？",
      "請用一個最小例子說明它怎麼變化。",
    ],
    summary: [
      itemLabel + " 屬於財報基礎概念，重點不是背定義，而是知道它在公司裡代表什麼。",
      "先把名詞翻成白話，再連回公司正在發生的事情，答案就會自然很多。",
    ],
    answerGuide: [
      "先用自己的話定義，不要照課本。",
      "再補一句它在公司經營或財報裡代表什麼。",
      "最後用一個最小數字例子說明變化。",
    ],
    resources: [
      noteResource("白話提醒", itemLabel + " 不是考名詞背誦，而是看你能不能把它翻成真實公司語言。"),
      noteResource("作答骨架", "白話定義 -> 商業意義 -> 最小例子"),
    ],
    rubric: buildQuestRubric(topic, levelSpecData, itemLabel, [
      { concept: "白話定義", keywords: ["定義", "意思", "代表"], followUp: "請把 {label} 改用更白話的方式講一次。", coachNote: "先像在教初學者一樣解釋，不要直接背術語。" },
      { concept: "商業意義", keywords: ["反映", "代表", "公司", "財報"], followUp: "這個概念在真實公司裡通常代表什麼？", coachNote: "不要只停在名詞本身，要連到公司運作。" },
      { concept: "最小例子", keywords: ["例如", "假設", "如果", "增加", "減少"], followUp: "請補一個數字或情境例子。", coachNote: "只要一個很小的例子，就能看出你有沒有真的懂。" },
    ]),
    clear: "請用白話解釋、補商業意義，再舉一個最小例子。",
    hints: [
      "想像你在向完全沒學過財報的人解釋。",
      "先講它是什麼，再講它反映了什麼。",
      "用借款、購貨、收款這種小情境最容易舉例。",
    ],
  };
}

function buildAnalystOpenEndedQuest(topic, levelIndex, levelSpecData, itemLabel, itemIndex, seconds, exp) {
  return levelIndex <= 2
    ? buildAnalystConceptQuest(topic, levelIndex, levelSpecData, itemLabel, itemIndex, seconds, exp)
    : buildAnalystCaseQuest(topic, levelIndex, levelSpecData, itemLabel, itemIndex, seconds, exp);
}

function buildAnalystCaseQuest(topic, levelIndex, levelSpecData, itemLabel, itemIndex, seconds, exp) {
  const caseNumbers = [
    "公司本季營收年增 18%，毛利率從 41% 降到 36%，存貨比上季增加 22%。",
    "公司宣布擴產，資本支出提高，但自由現金流轉弱，短期借款同步上升。",
    "管理層表示需求仍強，但應收帳款天數拉長，現金回收速度變慢。",
    "公司獲利成長，但營運現金流沒有同步增加，且業外收益占比提高。",
  ];
  const caseText = caseNumbers[(levelIndex + itemIndex) % caseNumbers.length];
  return {
    ...buildBaseQuest(topic, levelIndex, levelSpecData, itemLabel, itemIndex, seconds, exp),
    materialTitle: "案例資料：" + itemLabel,
    materials: [
      caseText,
      "請不要先背定義，先像分析師一樣抓異常點。",
      "先判讀訊號，再推可能原因，最後下暫時結論。",
    ],
    questions: [
      "這段案例裡，和「" + itemLabel + "」最有關的訊號是什麼？",
      "你認為這個訊號比較偏正面、偏負面，還是需要更多資訊？為什麼？",
      "如果你要追問管理層一個問題，你會問什麼？",
    ],
    summary: [
      "這題在練的不是背概念，而是從一小段公司資訊裡先抓出最值得看的訊號。",
      "先找異常，再判讀方向，最後想下一個要問的問題。",
    ],
    answerGuide: [
      "先指出案例裡最異常的一個訊號。",
      "再說它偏正面、偏負面，還是暫時無法下定論。",
      "最後補一個你會追問管理層的問題。",
    ],
    resources: [
      noteResource("分析順序", "訊號 -> 判讀 -> 追問"),
      noteResource("判讀提醒", "不要急著一次下結論，先說你還缺什麼資訊。"),
    ],
    rubric: buildQuestRubric(topic, levelSpecData, itemLabel, [
      { concept: "抓出關鍵訊號", keywords: ["訊號", "重點", "關鍵", "異常"], followUp: "請指出案例裡最值得先看的那一個訊號。", coachNote: "不要整段都講，先抓最關鍵的變化。" },
      { concept: "做出判讀", keywords: ["正面", "負面", "觀察", "風險", "原因"], followUp: "你為什麼這樣判讀？請補原因。", coachNote: "判讀一定要連原因，不要只說好或不好。" },
      { concept: "提出追問", keywords: ["追問", "管理層", "確認", "還要"], followUp: "如果只能多問一題，你最想確認什麼？", coachNote: "好的分析不是一次下定論，而是知道下一題要問什麼。" },
    ]),
    clear: "請抓出訊號、做出判讀，並提出一個你會追問的問題。",
    hints: [
      "先看哪個數字或變化最不尋常。",
      "再想這個變化可能來自需求、成本、現金或庫存哪一邊。",
      "最後補一句：如果要確認，我還想再看什麼。",
    ],
  };
}

function buildEnglishMaterialQuest(topic, levelIndex, levelSpecData, itemLabel, itemIndex, seconds, exp) {
  const sentencePool = [
    "Management expects demand to remain resilient, although margin pressure may persist in the second half.",
    "The company continues to prioritize inventory discipline while maintaining selective capital expenditure.",
    "Customer orders improved sequentially, but visibility for the next quarter remains limited.",
    "Free cash flow declined due to higher working capital needs and expansion-related spending.",
  ];
  const sourceSentence = sentencePool[(levelIndex + itemIndex) % sentencePool.length];
  return {
    ...buildBaseQuest(topic, levelIndex, levelSpecData, itemLabel, itemIndex, seconds, exp),
    materialTitle: "英文材料：" + itemLabel,
    materials: [
      sourceSentence,
      "先不要逐字翻，先抓語氣、主詞、動作、限制條件。",
      "把句子拆成：公司在說什麼 / 但書在哪裡 / 對投資人代表什麼。",
    ],
    questions: [
      "這句英文如果用中文白話重述，最自然的意思是什麼？",
      "句子裡最重要的 1 到 2 個關鍵字是什麼？它們在這裡的語氣是偏正面、保留還是警告？",
      "如果你是做研究筆記，你會怎麼用一句中文記下這句話？",
    ],
    summary: [
      "這題先練抓句意，不是逐字翻譯。",
      "真正重點是找出語氣轉折、關鍵字，以及這句話對研究判讀有什麼影響。",
    ],
    answerGuide: [
      "先用中文白話重述整句意思。",
      "再抓 1 到 2 個關鍵字和語氣。",
      "最後濃縮成一句自己的研究筆記。",
    ],
    resources: [
      noteResource("拆句方式", "主詞是誰 -> 說了什麼 -> but/although 後面補了什麼保留條件"),
      noteResource("翻譯提醒", "不要逐字翻，先確保你真的懂句子在講什麼。"),
    ],
    rubric: buildQuestRubric(topic, levelSpecData, itemLabel, [
      { concept: "白話重述", keywords: ["中文", "意思", "重述", "表示"], followUp: "請不要逐字翻，直接用中文把意思重講一次。", coachNote: "英文學習在這裡的重點不是翻得漂亮，是有沒有抓到意思。" },
      { concept: "關鍵字與語氣", keywords: ["關鍵字", "語氣", "正面", "保留", "警告"], followUp: "哪個字最能決定這句話的語氣？", coachNote: "先抓關鍵字，再判斷這句話是樂觀、保守還是提醒風險。" },
      { concept: "研究筆記輸出", keywords: ["筆記", "摘要", "重點", "投資人"], followUp: "如果只能記一句，你會怎麼記？", coachNote: "這一步是在練把材料轉成自己的研究語言。" },
    ]),
    clear: "請白話重述句意，抓出關鍵字與語氣，再寫一句研究筆記。",
    hints: [
      "先抓主詞和主要動詞，不要一開始就逐字翻。",
      "看 although、but、remain 這種字，通常能看出保留條件。",
      "最後把它濃縮成一句你之後看得懂的中文。",
    ],
  };
}

function buildDailyEnglishQuest(topic, levelIndex, levelSpecData, itemLabel, itemIndex, seconds, exp) {
  return {
    ...buildBaseQuest(topic, levelIndex, levelSpecData, itemLabel, itemIndex, seconds, exp),
    materialTitle: "情境任務：" + itemLabel,
    materials: [
      levelSpecData.materialLead,
      "你現在正在這個情境裡：" + itemLabel,
      "先講最短可用句，再補一個延伸句。",
      "目標不是文法滿分，是能真的開口。 ",
    ],
    questions: [
      "如果現在真的遇到「" + itemLabel + "」，你第一句會怎麼說？",
      "再補一句，讓對方更清楚你的意思或能接話。",
      "這個情境你最想記住的句型或關鍵字是什麼？",
    ],
    summary: [
      "這題目標不是文法完美，而是能在真實情境裡先開口。",
      "先有一句能用的，再補第二句讓對話走下去。",
    ],
    answerGuide: [
      "先寫一句最短可用句。",
      "再補一句資訊或需求，讓對方更懂你。",
      "最後帶走一個句型或關鍵字。",
    ],
    resources: [
      noteResource("開口原則", "先可用，再自然，最後才是漂亮。"),
      noteResource("作答骨架", "第一句先講目的，第二句補資訊。"),
    ],
    rubric: buildQuestRubric(topic, levelSpecData, itemLabel, [
      { concept: "先開口", keywords: ["hello", "hi", "i", "can", "would", "please"], followUp: "先給我一句你真的敢開口講的版本。", coachNote: "先有一句能用的，不要先追求很完整。" },
      { concept: "延伸一句", keywords: ["and", "because", "need", "want", "looking"], followUp: "再補一句，讓情境更完整。", coachNote: "第二句的功能是讓對話走下去。" },
      { concept: "記住句型", keywords: ["句型", "關鍵字", "用法"], followUp: "這題你最值得背下來的是哪個句型？", coachNote: "每題至少帶走一個可重複使用的句型。" },
    ]),
    clear: "至少寫兩句可直接使用的英文，並指出一個你要記住的句型或關鍵字。",
    hints: [
      "先用最短句把目的講出來。",
      "第二句只要補資訊，不用硬寫很長。",
      "把這題當成真的要對人開口，不是寫考卷。",
    ],
  };
}

function buildGenericAppliedQuest(topic, levelIndex, levelSpecData, itemLabel, itemIndex, seconds, exp) {
  return {
    ...buildBaseQuest(topic, levelIndex, levelSpecData, itemLabel, itemIndex, seconds, exp),
    materialTitle: "任務焦點：" + itemLabel,
    materials: [
      levelSpecData.materialLead,
      "本題焦點：" + itemLabel,
      "請把它當成你今天真的要處理的一個小任務。",
    ],
    questions: [
      "如果今天真的要處理「" + itemLabel + "」，你第一步會做什麼？",
      "你會用什麼標準判斷自己有沒有做對？",
      "最容易失敗的點是什麼？你會怎麼避免？",
    ],
    summary: [
      "這題把抽象概念轉成今天真的能執行的小任務。",
      "你的答案重點應該是可開始、可判斷、可修正。",
    ],
    answerGuide: [
      "先講第一步要做什麼。",
      "再講你會怎麼驗收自己有沒有做對。",
      "最後補一個最可能失敗的點與避免方式。",
    ],
    resources: [
      noteResource("任務原則", "能開始 > 看起來完整；能驗收 > 聽起來漂亮。"),
      noteResource("作答骨架", "第一步 -> 驗收標準 -> 失敗點"),
    ],
    rubric: buildQuestRubric(topic, levelSpecData, itemLabel, [
      { concept: "先做什麼", keywords: ["第一步", "先", "開始"], followUp: "請把第一步講得再具體一點。", coachNote: "先把任務變成可以開始的動作。" },
      { concept: "判斷標準", keywords: ["標準", "判斷", "完成"], followUp: "你如何知道自己不是只是做了，而是真的做對？", coachNote: "沒有標準就很難驗收。" },
      { concept: "風險與修正", keywords: ["失敗", "卡點", "避免", "修正"], followUp: "最常出錯的是哪一步？", coachNote: "真的能持續的人，通常都先知道自己會怎麼失敗。" },
    ]),
    clear: "請講出第一步、判斷標準，以及一個你會預防的失敗點。",
    hints: [
      "先把它講成具體動作，不要停在概念。",
      "再補一句：怎樣算完成。",
      "最後想一個最可能出錯的地方。",
    ],
  };
}

function buildOpenEndedQuest(topic, levelIndex, levelSpecData, itemLabel, itemIndex, seconds, exp) {
  if (topic.id === "analyst") {
    return buildAnalystOpenEndedQuest(topic, levelIndex, levelSpecData, itemLabel, itemIndex, seconds, exp);
  }
  if (topic.id === "english") {
    return buildEnglishMaterialQuest(topic, levelIndex, levelSpecData, itemLabel, itemIndex, seconds, exp);
  }
  if (topic.id === "dailyEnglish") {
    return buildDailyEnglishQuest(topic, levelIndex, levelSpecData, itemLabel, itemIndex, seconds, exp);
  }
  return buildGenericAppliedQuest(topic, levelIndex, levelSpecData, itemLabel, itemIndex, seconds, exp);
}

function buildStandardQuest(topic, levelIndex, levelSpecData, itemLabel, itemIndex, totalPerLevel) {
  const lowMinutes = topic.id === "analyst" ? 16 : topic.id === "dailyEnglish" ? 6 : 8;
  const seconds = Math.round((lowMinutes + levelIndex + (itemIndex % 3) * 2) * 60);
  const expBase = topic.id === "analyst" ? 52 : topic.id === "dailyEnglish" ? 20 : 28;
  const exp = expBase + levelIndex * 6 + (itemIndex % 4) * 2;
  const followUpOpenEnded = buildOpenEndedQuest(topic, levelIndex, levelSpecData, itemLabel, itemIndex, seconds, exp);

  if (levelIndex <= 2) {
    return buildQuizGroupQuest(topic, levelIndex, levelSpecData, itemLabel, itemIndex, seconds, exp, followUpOpenEnded);
  }
  return followUpOpenEnded;
}

function generateLevelPool(topic, levelSpecs, countPerLevel) {
  const quests = [];
  levelSpecs.forEach(function (spec, levelIndex) {
    const items = spec.subtopics.slice(0, countPerLevel);
    items.forEach(function (itemLabel, itemIndex) {
      quests.push(buildStandardQuest(topic, levelIndex, spec, itemLabel, itemIndex, countPerLevel));
    });
  });
  return quests;
}

function buildBuiltinQuestPools() {
  const topicMap = Object.fromEntries(BUILTIN_TOPICS.map(function (topic) { return [topic.id, topic]; }));
  return {
    analyst: generateLevelPool(topicMap.analyst, ANALYST_LEVELS, STANDARD_QUESTS_PER_LEVEL),
    english: generateLevelPool(topicMap.english, ENGLISH_LEVELS, STANDARD_QUESTS_PER_LEVEL),
    dailyEnglish: generateLevelPool(topicMap.dailyEnglish, DAILY_ENGLISH_LEVELS, DAILY_ENGLISH_QUESTS_PER_LEVEL),
    trading: generateLevelPool(topicMap.trading, TRADING_LEVELS, STANDARD_QUESTS_PER_LEVEL),
    growth: generateLevelPool(topicMap.growth, GROWTH_LEVELS, STANDARD_QUESTS_PER_LEVEL),
  };
}

function createCustomTopicPool(topic) {
  const actions = ["定義", "拆解", "比較", "辨識", "應用", "舉例", "反思", "追問", "總結", "復盤"];
  const skills = topic.skills.length ? topic.skills : [topic.primarySkill];
  const specs = Array.from({ length: LEVEL_COUNT }, function (_, levelIndex) {
    return {
      title: topic.title + " " + titleCaseLevel(levelIndex),
      skill: skills[levelIndex % skills.length] || topic.primarySkill,
      materialLead: "這一層先圍繞「" + (skills[levelIndex % skills.length] || topic.primarySkill) + "」建立你的主題框架。",
      subtopics: actions.map(function (action, actionIndex) {
        const skill = skills[(levelIndex + actionIndex) % skills.length] || topic.primarySkill;
        return skill + action;
      }),
    };
  });
  return generateLevelPool(topic, specs, STANDARD_QUESTS_PER_LEVEL);
}

function normalizeCustomTopic(topic) {
  const title = (topic.title || "").trim();
  const skills = Array.isArray(topic.skills)
    ? topic.skills.filter(Boolean)
    : String(topic.skills || "")
        .split(/[,，/]/)
        .map(function (item) { return item.trim(); })
        .filter(Boolean);
  const id = topic.id || createCustomTopicId(title, []);
  return {
    id,
    title,
    goal: topic.goal || "建立屬於這個主題的長期學習系統",
    skills: skills.length ? skills : [topic.primarySkill || title],
    primarySkill: topic.primarySkill || skills[0] || title,
    baseMaxExp: topic.baseMaxExp || 130,
    expStep: topic.expStep || 45,
    accent: topic.accent || "cyan",
    bossTitle: topic.bossTitle || title + " Boss",
    bossQuestions: topic.bossQuestions || ["核心概念是什麼？", "你真的理解了嗎？", "最大的卡點在哪？", "下一步要做什麼？"],
    projectTitle: topic.projectTitle || title + " 月度作品",
    projectSteps: topic.projectSteps || ["核心概念", "練習紀錄", "應用例子", "補強點", "總結"],
    custom: true,
  };
}

export function buildTopicRegistry(customTopics) {
  const normalizedCustomTopics = (customTopics || []).map(normalizeCustomTopic);
  const allTopics = [...BUILTIN_TOPICS, ...normalizedCustomTopics];
  const topicMeta = Object.fromEntries(allTopics.map(function (topic) { return [topic.id, topic]; }));
  const topicOrder = allTopics.map(function (topic) { return topic.id; });
  const progressDefaults = Object.fromEntries(
    allTopics.map(function (topic) {
      return [topic.id, { level: 0, exp: 0, maxExp: topic.baseMaxExp }];
    }),
  );
  const questPools = { ...buildBuiltinQuestPools() };
  normalizedCustomTopics.forEach(function (topic) {
    questPools[topic.id] = createCustomTopicPool(topic);
  });

  return {
    customTopics: normalizedCustomTopics,
    topicMeta,
    topicOrder,
    questPools,
    progressDefaults,
  };
}

export function getDailyLoadCount(settings) {
  return loadCountFromSettings(settings);
}

export function getTimerMultiplier(settings) {
  return timerMultiplier(settings);
}

export function getHintStep(settings) {
  return getHintIncrement(settings);
}

export function getThresholdPreset(settings, quest) {
  return getReviewThresholds(settings, quest);
}
