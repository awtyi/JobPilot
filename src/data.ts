export const stages = ["待分析", "待投递", "已投递", "HR沟通", "面试中", "Offer", "已结束"] as const;
export const defaultDirections = ["产品经理", "AI产品经理", "数字员工产品", "解决方案产品"] as const;
export const defaultSourceChannels = ["BOSS直聘", "猎聘", "脉脉", "官网", "朋友推荐", "拉勾", "智联招聘", "前程无忧", "LinkedIn", "其他"] as const;
export const interviewRounds = ["HR沟通", "一面", "二面", "终面", "其他"] as const;
export const priorities = ["A", "B", "C"] as const;
export const SKILL_LIBRARY_VERSION = "2026.06";
export const builtInSkills = [
  "Agent", "RAG", "Prompt", "LLM", "MCP", "知识库", "数据分析", "数据治理", "评测", "工作流",
  "ToB", "原型", "产品规划", "需求分析", "竞品分析", "用户研究", "PRD", "项目管理", "敏捷开发",
  "商业化", "增长", "A/B测试", "SQL", "Python", "API", "SaaS", "CRM", "ERP", "低代码", "自动化",
  "机器学习", "深度学习", "NLP", "多模态", "向量数据库", "Embedding", "检索", "Fine-tuning",
  "模型微调", "知识图谱", "数据标注", "BI", "Tableau", "Power BI", "Axure", "Figma", "墨刀",
] as const;
const builtInCities = ["北京", "上海", "广州", "深圳", "武汉", "杭州", "南京", "成都", "重庆", "苏州", "西安", "长沙", "合肥", "郑州", "天津", "厦门", "青岛", "宁波", "远程"] as const;

export type Stage = (typeof stages)[number];
export type Direction = string;
export type Priority = (typeof priorities)[number];
export type InterviewRound = (typeof interviewRounds)[number];

export interface MatchDimension {
  label: string;
  score: number;
  evidence: string;
}

export interface ParsedFieldEvidence {
  field: string;
  label: string;
  value: string;
  confidence: number;
  source: string;
}

export interface ProfileSkill {
  name: string;
  aliases: string[];
  weight: number;
}

export interface JobPreferenceProfile {
  targetDirections: string[];
  skills: ProfileSkill[];
  preferredLocations: string[];
  expectedMinSalaryK: number;
  expectedMaxSalaryK: number;
  customKeywords: string[];
}

export interface InterviewRecord {
  id: string;
  round: InterviewRound;
  interviewAt: string;
  interviewerRole: string;
  questions: string;
  answerSummary: string;
  feedback: string;
  improvements: string;
  nextAction: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobActivity {
  id: string;
  type: "created" | "stage-change";
  occurredAt: string;
  fromStage?: Stage;
  toStage: Stage;
  note: string;
}

export interface Job {
  id: string;
  companyName: string;
  jobTitle: string;
  jobDirection: Direction;
  jdUrl: string;
  jdRawText: string;
  location: string;
  salaryRange: string;
  sourceChannel: string;
  stage: Stage;
  priority: Priority;
  matchScore: number;
  matchSuggestedScore: number;
  matchDimensions: MatchDimension[];
  dataCompletenessScore: number;
  parseEvidence: ParsedFieldEvidence[];
  responsibilities: string;
  requirements: string;
  keywords: string[];
  nextAction: string;
  nextFollowUpAt: string;
  notes: string;
  resultReason: string;
  stageHistory: JobActivity[];
  interviews: InterviewRecord[];
  createdAt: string;
  updatedAt: string;
}

const today = new Date();
const date = (offset: number) => {
  const target = new Date(today);
  target.setDate(today.getDate() + offset);
  return target.toISOString().slice(0, 10);
};

const seedJobs = [
  {
    id: "seed-1", companyName: "星河智能", jobTitle: "AI 产品经理", jobDirection: "AI产品经理",
    jdUrl: "", jdRawText: "负责 Agent 产品规划，结合 RAG 和知识库完成企业场景落地。",
    location: "武汉·光谷", salaryRange: "18k-25k", sourceChannel: "BOSS直聘", stage: "HR沟通",
    priority: "A", matchScore: 88, responsibilities: "规划 AI Agent 产品路线，推进知识库问答场景落地。",
    requirements: "3 年产品经验；熟悉 Agent、RAG、Prompt；具备数据分析能力。",
    keywords: ["Agent", "RAG", "Prompt", "知识库"], nextAction: "整理 Agent 项目案例，回复 HR",
    nextFollowUpAt: date(0), notes: "", resultReason: "", stageHistory: [], createdAt: date(-5), updatedAt: date(-1),
  },
  {
    id: "seed-2", companyName: "云帆科技", jobTitle: "数字员工产品经理", jobDirection: "数字员工产品",
    jdUrl: "", jdRawText: "面向企业客户设计数字员工解决方案。",
    location: "武汉", salaryRange: "16k-22k", sourceChannel: "猎聘", stage: "待投递",
    priority: "A", matchScore: 82, responsibilities: "设计数字员工场景方案，输出 PRD 并推进交付。",
    requirements: "熟悉工作流、LLM、企业服务；有 ToB 产品经验。",
    keywords: ["工作流", "LLM", "ToB", "数字员工"], nextAction: "按 JD 调整简历首屏",
    nextFollowUpAt: date(1), notes: "", resultReason: "", stageHistory: [], createdAt: date(-3), updatedAt: date(-2),
  },
  {
    id: "seed-3", companyName: "知微数据", jobTitle: "产品经理（知识库方向）", jobDirection: "AI产品经理",
    jdUrl: "", jdRawText: "负责企业知识库产品设计，关注检索评测和数据治理。",
    location: "杭州·远程", salaryRange: "20k-30k", sourceChannel: "脉脉", stage: "已投递",
    priority: "B", matchScore: 76, responsibilities: "负责知识库能力设计和客户需求分析。",
    requirements: "熟悉 RAG、检索评测、数据治理，有 AI 产品经验优先。",
    keywords: ["RAG", "评测", "数据治理", "知识库"], nextAction: "等待反馈，准备知识库案例",
    nextFollowUpAt: date(2), notes: "", resultReason: "", stageHistory: [], createdAt: date(-6), updatedAt: date(-2),
  },
  {
    id: "seed-4", companyName: "远见软件", jobTitle: "解决方案产品经理", jobDirection: "解决方案产品",
    jdUrl: "", jdRawText: "配合销售进行需求调研和解决方案设计。",
    location: "武汉·洪山", salaryRange: "15k-20k", sourceChannel: "官网", stage: "面试中",
    priority: "A", matchScore: 79, responsibilities: "负责售前需求调研、方案输出和项目协同。",
    requirements: "逻辑清晰，具有企业软件或工业软件经验。",
    keywords: ["售前", "企业软件", "方案设计"], nextAction: "准备二面：复盘售前项目",
    nextFollowUpAt: date(0), notes: "一面重点询问跨团队协同。", resultReason: "", stageHistory: [], createdAt: date(-9), updatedAt: date(0),
  },
  {
    id: "seed-5", companyName: "跃迁网络", jobTitle: "平台产品经理", jobDirection: "产品经理",
    jdUrl: "", jdRawText: "负责内部平台的需求分析、数据分析和迭代规划。",
    location: "深圳", salaryRange: "18k-24k", sourceChannel: "BOSS直聘", stage: "待分析",
    priority: "B", matchScore: 68, responsibilities: "负责平台产品规划和需求管理。",
    requirements: "3 年以上产品经验，擅长数据分析和复杂流程梳理。",
    keywords: ["平台产品", "数据分析", "流程"], nextAction: "判断城市与方向匹配度",
    nextFollowUpAt: date(3), notes: "", resultReason: "", stageHistory: [], createdAt: date(-1), updatedAt: date(-1),
  },
  {
    id: "seed-6", companyName: "构想实验室", jobTitle: "AI 应用产品经理", jobDirection: "AI产品经理",
    jdUrl: "", jdRawText: "关注 AI 应用创新，负责从 0 到 1 验证。",
    location: "上海", salaryRange: "22k-32k", sourceChannel: "朋友推荐", stage: "Offer",
    priority: "B", matchScore: 84, responsibilities: "验证 AI 应用场景，完成从原型到上线的闭环。",
    requirements: "理解 LLM、Prompt，具备快速原型能力。",
    keywords: ["LLM", "Prompt", "原型"], nextAction: "确认 Offer 细节",
    nextFollowUpAt: date(1), notes: "", resultReason: "", stageHistory: [], createdAt: date(-20), updatedAt: date(-1),
  },
].map((job) => normalizeJob(job as unknown as Job));

const DB_NAME = "jobpilot-db";
const STORE_NAME = "jobs";
const DB_VERSION = 1;
const DIRECTIONS_STORAGE_KEY = "jobpilot-directions";
const PROFILE_STORAGE_KEY = "jobpilot-preference-profile";

function normalizeDirections(values: unknown): Direction[] {
  if (!Array.isArray(values)) return [...defaultDirections];
  const result: Direction[] = [];
  values.forEach((value) => {
    if (typeof value !== "string") return;
    const normalized = value.trim();
    if (!normalized || result.some((item) => item.toLocaleLowerCase() === normalized.toLocaleLowerCase())) return;
    result.push(normalized);
  });
  return result.length ? result : [...defaultDirections];
}

export function loadDirections(): Direction[] {
  try {
    const stored = localStorage.getItem(DIRECTIONS_STORAGE_KEY);
    return stored ? normalizeDirections(JSON.parse(stored)) : [...defaultDirections];
  } catch {
    return [...defaultDirections];
  }
}

export function persistDirections(directions: Direction[]): void {
  localStorage.setItem(DIRECTIONS_STORAGE_KEY, JSON.stringify(normalizeDirections(directions)));
}

function normalizeStringList(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.filter((value): value is string => typeof value === "string").map((value) => value.trim()).filter(Boolean))];
}

function normalizeProfile(value: Partial<JobPreferenceProfile> = {}): JobPreferenceProfile {
  const skills = Array.isArray(value.skills) ? value.skills.flatMap((skill) => {
    if (!skill || typeof skill.name !== "string" || !skill.name.trim()) return [];
    return [{
      name: skill.name.trim(),
      aliases: normalizeStringList(skill.aliases),
      weight: Number.isFinite(skill.weight) ? Math.min(5, Math.max(1, skill.weight)) : 3,
    }];
  }) : [];
  return {
    targetDirections: normalizeStringList(value.targetDirections),
    skills,
    preferredLocations: normalizeStringList(value.preferredLocations),
    expectedMinSalaryK: Number.isFinite(value.expectedMinSalaryK) ? Math.max(0, value.expectedMinSalaryK ?? 0) : 0,
    expectedMaxSalaryK: Number.isFinite(value.expectedMaxSalaryK) ? Math.max(0, value.expectedMaxSalaryK ?? 0) : 0,
    customKeywords: normalizeStringList(value.customKeywords),
  };
}

export function loadPreferenceProfile(): JobPreferenceProfile {
  try {
    const stored = localStorage.getItem(PROFILE_STORAGE_KEY);
    return stored ? normalizeProfile(JSON.parse(stored) as Partial<JobPreferenceProfile>) : normalizeProfile();
  } catch {
    return normalizeProfile();
  }
}

export function persistPreferenceProfile(profile: JobPreferenceProfile): JobPreferenceProfile {
  const normalized = normalizeProfile(profile);
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

export function inferSourceChannel(url: string): string {
  const value = url.trim().toLocaleLowerCase();
  if (!value) return "";
  if (value.includes("zhipin.com")) return "BOSS直聘";
  if (value.includes("liepin.com")) return "猎聘";
  if (value.includes("maimai.cn")) return "脉脉";
  if (value.includes("lagou.com")) return "拉勾";
  if (value.includes("zhaopin.com")) return "智联招聘";
  if (value.includes("51job.com")) return "前程无忧";
  if (value.includes("linkedin.com")) return "LinkedIn";
  return "官网";
}

function parseSalaryRange(value: string) {
  const values = [...value.matchAll(/\d+(?:\.\d+)?/g)].map((match) => Number(match[0]));
  return values.length ? { min: values[0], max: values[1] ?? values[0] } : null;
}

function calculateCompleteness(job: Pick<Job, "companyName" | "jobTitle" | "jobDirection" | "keywords" | "responsibilities" | "requirements" | "location" | "salaryRange" | "sourceChannel">) {
  const fields = [job.companyName, job.jobTitle, job.jobDirection, job.location, job.salaryRange, job.sourceChannel, job.responsibilities, job.requirements, job.keywords.length ? "keywords" : ""];
  return Math.round(fields.filter(Boolean).length / fields.length * 100);
}

export function buildMatchSuggestion(job: Pick<Job, "companyName" | "jobTitle" | "jobDirection" | "keywords" | "responsibilities" | "requirements" | "location" | "salaryRange" | "sourceChannel">, profile = loadPreferenceProfile()) {
  const directions = profile.targetDirections.map((value) => value.toLocaleLowerCase());
  const directionScore = !directions.length ? 50 : directions.some((value) => job.jobDirection.toLocaleLowerCase().includes(value) || value.includes(job.jobDirection.toLocaleLowerCase())) ? 100 : 30;
  const normalizedKeywords = job.keywords.map((keyword) => keyword.toLocaleLowerCase());
  const skillTotal = profile.skills.reduce((sum, skill) => sum + skill.weight, 0);
  const skillMatched = profile.skills.filter((skill) => [skill.name, ...skill.aliases].some((value) => normalizedKeywords.includes(value.toLocaleLowerCase())));
  const skillScore = !skillTotal ? 50 : Math.round(skillMatched.reduce((sum, skill) => sum + skill.weight, 0) / skillTotal * 100);
  const locations = profile.preferredLocations.map((value) => value.toLocaleLowerCase());
  const locationScore = !locations.length ? 50 : locations.some((value) => job.location.toLocaleLowerCase().includes(value) || value.includes(job.location.toLocaleLowerCase())) ? 100 : job.location ? 25 : 50;
  const salary = parseSalaryRange(job.salaryRange);
  const expectedMin = profile.expectedMinSalaryK;
  const expectedMax = profile.expectedMaxSalaryK;
  const salaryScore = !expectedMin && !expectedMax ? 50 : !salary ? 50 : salary.max >= (expectedMin || 0) && (!expectedMax || salary.min <= expectedMax) ? 100 : 25;
  const matchDimensions: MatchDimension[] = [
    { label: "方向匹配", score: directionScore, evidence: directions.length ? `岗位方向为“${job.jobDirection}”，与个人目标方向进行比较。` : "尚未在设置中维护目标方向。" },
    { label: "技能匹配", score: skillScore, evidence: skillTotal ? `命中 ${skillMatched.length}/${profile.skills.length} 项个人技能：${skillMatched.map((skill) => skill.name).join("、") || "暂无"}。` : "尚未在设置中维护个人技能。" },
    { label: "地点匹配", score: locationScore, evidence: locations.length ? `岗位地点“${job.location || "未识别"}”，期望地点：${profile.preferredLocations.join("、")}。` : "尚未在设置中维护期望地点。" },
    { label: "薪资匹配", score: salaryScore, evidence: expectedMin || expectedMax ? `岗位薪资“${job.salaryRange || "未识别"}”，期望区间：${expectedMin || 0}k-${expectedMax || "不限"}k。` : "尚未在设置中维护薪资期望。" },
  ];
  return {
    matchSuggestedScore: Math.round(directionScore * 0.3 + skillScore * 0.35 + locationScore * 0.2 + salaryScore * 0.15),
    matchDimensions,
    dataCompletenessScore: calculateCompleteness(job),
  };
}

export function createBlankInterview(): InterviewRecord {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(), round: "一面", interviewAt: now.slice(0, 16), interviewerRole: "",
    questions: "", answerSummary: "", feedback: "", improvements: "", nextAction: "", createdAt: now, updatedAt: now,
  };
}

export function normalizeJob(job: Job): Job {
  const normalized = {
    ...job,
    sourceChannel: typeof job.sourceChannel === "string" && job.sourceChannel.trim() ? job.sourceChannel : inferSourceChannel(job.jdUrl ?? ""),
    resultReason: typeof job.resultReason === "string" ? job.resultReason : "",
    stageHistory: Array.isArray(job.stageHistory) ? job.stageHistory : [],
    interviews: Array.isArray(job.interviews) ? job.interviews : [],
    parseEvidence: Array.isArray(job.parseEvidence) ? job.parseEvidence : [],
  };
  const suggestion = buildMatchSuggestion(normalized);
  return {
    ...normalized,
    ...suggestion,
  };
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function loadJobs(): Promise<Job[]> {
  const db = await openDatabase();
  const jobs = await new Promise<Job[]>((resolve, reject) => {
    const request = db.transaction(STORE_NAME).objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result as Job[]);
    request.onerror = () => reject(request.error);
  });
  if (jobs.length > 0) return jobs.map(normalizeJob);
  await replaceJobs(seedJobs);
  return seedJobs;
}

export async function replaceJobs(jobs: Job[]): Promise<void> {
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    store.clear();
    jobs.forEach((job) => store.put(normalizeJob(job)));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function persistJob(job: Job): Promise<void> {
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const request = db.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).put(normalizeJob(job));
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function removeJob(id: string): Promise<void> {
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const request = db.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export function createBlankJob(jobDirection: Direction = "AI产品经理"): Job {
  const now = new Date().toISOString();
  return normalizeJob({
    id: crypto.randomUUID(), companyName: "", jobTitle: "", jobDirection, jdUrl: "",
    jdRawText: "", location: "", salaryRange: "", sourceChannel: "", stage: "待分析",
    priority: "B", matchScore: 70, responsibilities: "", requirements: "", keywords: [],
    nextAction: "", nextFollowUpAt: "", notes: "", resultReason: "", stageHistory: [], interviews: [], parseEvidence: [], createdAt: now, updatedAt: now,
  } as unknown as Job);
}

function escapePattern(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractField(lines: string[], aliases: string[], maxLength = 40) {
  const pattern = new RegExp(`^(?:${aliases.map(escapePattern).join("|")})\\s*[:：=\\-]?\\s*(.{2,${maxLength}})$`, "i");
  for (const line of lines) {
    const match = line.match(pattern);
    if (match?.[1]) return { value: match[1].trim(), source: line };
  }
  return null;
}

function extractSection(lines: string[], aliases: string[]) {
  const heading = new RegExp(`^(?:${aliases.map(escapePattern).join("|")})\\s*[:：]?\\s*(.*)$`, "i");
  const anyHeading = /^[\u4e00-\u9fa5A-Za-z\s]{2,12}[:：]\s*/;
  const start = lines.findIndex((line) => heading.test(line));
  if (start < 0) return "";
  const first = lines[start].match(heading)?.[1]?.trim();
  const content = first ? [first] : [];
  for (const line of lines.slice(start + 1)) {
    if (anyHeading.test(line)) break;
    content.push(line);
  }
  return content.filter(Boolean).slice(0, 12).join("\n");
}

function collectKeywords(text: string, profile: JobPreferenceProfile) {
  const values = [...builtInSkills, ...profile.customKeywords, ...profile.skills.flatMap((skill) => [skill.name, ...skill.aliases])];
  const unique = [...new Set(values.map((value) => value.trim()).filter(Boolean))];
  return unique.filter((keyword) => text.toLocaleLowerCase().includes(keyword.toLocaleLowerCase()));
}

export function parseJD(raw: string, url = "", directions: Direction[] = [...defaultDirections], profile = loadPreferenceProfile()): Job {
  const defaultDirection = directions.includes("AI产品经理") ? "AI产品经理" : directions[0] ?? "产品经理";
  const job = createBlankJob(defaultDirection);
  const lines = raw.replace(/\r/g, "").split("\n").map((line) => line.replace(/[ \t]+/g, " ").trim()).filter(Boolean);
  const joined = lines.join("\n");
  const salary = joined.match(/(\d{1,2}\s*[kK千万][-~至到]\s*\d{1,2}\s*[kK千万](?:·\d{1,2}薪)?)/);
  const explicitLocation = extractField(lines, ["工作地点", "办公地点", "工作地址", "办公地址", "地址", "所在城市", "工作城市", "城市"], 50);
  const fallbackCity = builtInCities.find((city) => joined.includes(city));
  const location = explicitLocation ?? (fallbackCity ? { value: fallbackCity, source: `JD 中出现城市词“${fallbackCity}”` } : null);
  const company = extractField(lines, ["公司名称", "公司", "企业名称", "企业"], 50);
  const title = extractField(lines, ["岗位名称", "职位名称", "招聘岗位", "职位", "岗位"], 50);
  const keywords = collectKeywords(joined, profile);
  const responsibilities = extractSection(lines, ["岗位职责", "职位职责", "工作职责", "工作内容", "职责描述"])
    || lines.filter((line) => /负责|职责|工作内容|推进|规划|设计/.test(line)).slice(0, 8).join("\n");
  const requirements = extractSection(lines, ["任职要求", "职位要求", "岗位要求", "任职资格", "能力要求"])
    || lines.filter((line) => /要求|任职|熟悉|经验|能力|优先/.test(line)).slice(0, 8).join("\n");
  const inferredDirection: Direction = /Agent|RAG|LLM|Prompt|知识库|AI|人工智能/i.test(joined)
    ? "AI产品经理"
    : /数字员工|工作流/.test(joined)
      ? "数字员工产品"
      : /售前|解决方案/.test(joined)
        ? "解决方案产品"
        : "产品经理";

  const parseEvidence: ParsedFieldEvidence[] = [
    company && { field: "companyName", label: "公司名称", value: company.value, confidence: 96, source: company.source },
    title && { field: "jobTitle", label: "岗位名称", value: title.value, confidence: 96, source: title.source },
    location && { field: "location", label: "地点", value: location.value, confidence: explicitLocation ? 94 : 62, source: location.source },
    salary && { field: "salaryRange", label: "薪资", value: salary[1].replace(/\s/g, ""), confidence: 90, source: salary[0] },
    url && { field: "sourceChannel", label: "岗位来源", value: inferSourceChannel(url), confidence: 90, source: url },
    { field: "jobDirection", label: "岗位方向", value: directions.includes(inferredDirection) ? inferredDirection : defaultDirection, confidence: 72, source: "根据 JD 中的方向关键词推断" },
    keywords.length > 0 && { field: "keywords", label: "JD 关键词", value: keywords.join("、"), confidence: 78, source: `命中技能词库：${keywords.join("、")}` },
    responsibilities && { field: "responsibilities", label: "核心职责", value: responsibilities, confidence: 76, source: responsibilities.slice(0, 100) },
    requirements && { field: "requirements", label: "任职要求", value: requirements, confidence: 76, source: requirements.slice(0, 100) },
  ].filter((item): item is ParsedFieldEvidence => Boolean(item));
  const parsed = {
    ...job,
    jdUrl: url,
    sourceChannel: inferSourceChannel(url),
    jdRawText: raw,
    companyName: company?.value ?? lines[0]?.replace(/招聘|诚聘/g, "").slice(0, 24) ?? "",
    jobTitle: title?.value ?? lines.find((line) => /产品经理|Product Manager|PM/i.test(line))?.slice(0, 30) ?? "",
    location: location?.value ?? "",
    salaryRange: salary?.[1]?.replace(/\s/g, "") ?? "",
    jobDirection: directions.includes(inferredDirection) ? inferredDirection : defaultDirection,
    responsibilities,
    requirements,
    keywords,
    parseEvidence,
  };
  return { ...parsed, ...buildMatchSuggestion(parsed, profile) };
}
