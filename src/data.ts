export const stages = ["待分析", "待投递", "已投递", "HR沟通", "面试中", "Offer", "已结束"] as const;
export const defaultDirections = ["产品经理", "AI产品经理", "数字员工产品", "解决方案产品"] as const;
export const priorities = ["A", "B", "C"] as const;

export type Stage = (typeof stages)[number];
export type Direction = string;
export type Priority = (typeof priorities)[number];

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
  responsibilities: string;
  requirements: string;
  keywords: string[];
  nextAction: string;
  nextFollowUpAt: string;
  notes: string;
  resultReason: string;
  stageHistory: JobActivity[];
  createdAt: string;
  updatedAt: string;
}

const today = new Date();
const date = (offset: number) => {
  const target = new Date(today);
  target.setDate(today.getDate() + offset);
  return target.toISOString().slice(0, 10);
};

const seedJobs: Job[] = [
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
];

const DB_NAME = "jobpilot-db";
const STORE_NAME = "jobs";
const DB_VERSION = 1;
const DIRECTIONS_STORAGE_KEY = "jobpilot-directions";

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

export function normalizeJob(job: Job): Job {
  return {
    ...job,
    resultReason: typeof job.resultReason === "string" ? job.resultReason : "",
    stageHistory: Array.isArray(job.stageHistory) ? job.stageHistory : [],
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
  return {
    id: crypto.randomUUID(), companyName: "", jobTitle: "", jobDirection, jdUrl: "",
    jdRawText: "", location: "", salaryRange: "", sourceChannel: "BOSS直聘", stage: "待分析",
    priority: "B", matchScore: 70, responsibilities: "", requirements: "", keywords: [],
    nextAction: "", nextFollowUpAt: "", notes: "", resultReason: "", stageHistory: [], createdAt: now, updatedAt: now,
  };
}

export function parseJD(raw: string, url = "", directions: Direction[] = [...defaultDirections]): Job {
  const defaultDirection = directions.includes("AI产品经理") ? "AI产品经理" : directions[0] ?? "产品经理";
  const job = createBlankJob(defaultDirection);
  const lines = raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const joined = lines.join("\n");
  const salary = joined.match(/(\d{1,2}\s*[kK千万][-~至到]\s*\d{1,2}\s*[kK千万](?:·\d{1,2}薪)?)/);
  const location = joined.match(/(?:工作地点|地点|城市|办公地点)[：:\s]*([^\n，,；;]{2,20})/);
  const company = joined.match(/(?:公司名称|公司|企业)[：:\s]*([^\n，,；;]{2,30})/);
  const title = joined.match(/(?:岗位名称|职位名称|招聘岗位|职位|岗位)[：:\s]*([^\n，,；;]{2,30})/);
  const keywordPool = ["Agent", "RAG", "Prompt", "LLM", "MCP", "知识库", "数据分析", "数据治理", "评测", "工作流", "ToB", "原型", "产品规划"];
  const keywords = keywordPool.filter((keyword) => joined.toLowerCase().includes(keyword.toLowerCase()));
  const responsibilityLines = lines.filter((line) => /负责|职责|工作内容|推进|规划|设计/.test(line)).slice(0, 5);
  const requirementLines = lines.filter((line) => /要求|任职|熟悉|经验|能力|优先/.test(line)).slice(0, 5);
  const inferredDirection: Direction = /Agent|RAG|LLM|Prompt|知识库|AI|人工智能/i.test(joined)
    ? "AI产品经理"
    : /数字员工|工作流/.test(joined)
      ? "数字员工产品"
      : /售前|解决方案/.test(joined)
        ? "解决方案产品"
        : "产品经理";

  return {
    ...job,
    jdUrl: url,
    jdRawText: raw,
    companyName: company?.[1] ?? lines[0]?.replace(/招聘|诚聘/g, "").slice(0, 24) ?? "",
    jobTitle: title?.[1] ?? lines.find((line) => /产品经理|Product Manager|PM/i.test(line))?.slice(0, 30) ?? "",
    location: location?.[1] ?? "",
    salaryRange: salary?.[1]?.replace(/\s/g, "") ?? "",
    jobDirection: directions.includes(inferredDirection) ? inferredDirection : defaultDirection,
    responsibilities: responsibilityLines.join("\n"),
    requirements: requirementLines.join("\n"),
    keywords,
  };
}
