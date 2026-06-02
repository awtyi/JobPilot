import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import {
  Archive,
  BarChart3,
  BellRing,
  BriefcaseBusiness,
  CalendarClock,
  Check,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  Download,
  FileDown,
  FileText,
  Filter,
  Gauge,
  KanbanSquare,
  LayoutGrid,
  List,
  Menu,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  createBlankJob,
  loadJobs,
  loadDirections,
  normalizeJob,
  parseJD,
  persistDirections,
  persistJob,
  priorities,
  removeJob,
  replaceJobs,
  stages,
  type Direction,
  type Job,
  type JobActivity,
  type Priority,
  type Stage,
} from "./data";

type Page = "dashboard" | "jobs" | "interviews" | "analytics" | "exports" | "settings";
type SaveState = "loading" | "saving" | "saved" | "error";
type JobView = "table" | "board" | "cards";
type QuickAddStep = "input" | "confirm";

const QUICK_ADD_DRAFT_KEY = "jobpilot-quick-add-draft";
const JOB_DRAFT_PREFIX = "jobpilot-job-draft:";

const pageMeta: Record<Page, { label: string; icon: typeof Gauge; caption: string }> = {
  dashboard: { label: "工作台", icon: Gauge, caption: "今天的求职进展，一眼看清" },
  jobs: { label: "岗位机会", icon: BriefcaseBusiness, caption: "整理、筛选和推进每一个机会" },
  interviews: { label: "面试复盘", icon: ClipboardList, caption: "把每次沟通沉淀成下一步行动" },
  analytics: { label: "数据分析", icon: BarChart3, caption: "从岗位积累中识别值得投入的方向" },
  exports: { label: "导入导出", icon: Archive, caption: "本地备份、恢复和阶段性复盘" },
  settings: { label: "设置", icon: Settings, caption: "管理本地数据和显示偏好" },
};

const stageTone: Record<Stage, string> = {
  待分析: "neutral",
  待投递: "blue",
  已投递: "blue",
  HR沟通: "orange",
  面试中: "purple",
  Offer: "green",
  已结束: "gray",
};

const directionTone: Record<Direction, string> = {
  产品经理: "blue",
  AI产品经理: "purple",
  数字员工产品: "green",
  解决方案产品: "orange",
};

function defaultJobDirection(directions: Direction[]) {
  return directions.includes("AI产品经理") ? "AI产品经理" : directions[0] ?? "产品经理";
}

function mergeJobDirections(directions: Direction[], jobs: Job[]) {
  const merged = [...directions];
  jobs.forEach((job) => {
    const direction = job.jobDirection.trim();
    if (direction && !merged.some((item) => item.toLocaleLowerCase() === direction.toLocaleLowerCase())) {
      merged.push(direction);
    }
  });
  return merged;
}

function loadLocalDraft<T>(key: string): T | null {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) as T : null;
  } catch {
    return null;
  }
}

function normalizeIdentity(value: string) {
  return value.trim().toLocaleLowerCase().replace(/\s+/g, "");
}

function collectCompanyOptions(jobs: Job[]) {
  const options = new Map<string, string>();
  jobs.forEach((job) => {
    const companyName = job.companyName.trim();
    const identity = normalizeIdentity(companyName);
    if (identity && !options.has(identity)) options.set(identity, companyName);
  });
  return [...options.values()].sort((a, b) => a.localeCompare(b, "zh-CN"));
}

function findPotentialDuplicate(jobs: Job[], candidate: Job) {
  const companyName = normalizeIdentity(candidate.companyName);
  const jobTitle = normalizeIdentity(candidate.jobTitle);
  const jdUrl = candidate.jdUrl.trim().toLocaleLowerCase();
  if (!companyName || !jobTitle) return null;
  return jobs.find((job) => {
    if (job.id === candidate.id) return false;
    if (normalizeIdentity(job.companyName) !== companyName || normalizeIdentity(job.jobTitle) !== jobTitle) return false;
    const existingUrl = job.jdUrl.trim().toLocaleLowerCase();
    return !jdUrl || !existingUrl || jdUrl === existingUrl;
  }) ?? null;
}

function createActivity(type: JobActivity["type"], toStage: Stage, note: string, fromStage?: Stage): JobActivity {
  return { id: crypto.randomUUID(), type, occurredAt: new Date().toISOString(), fromStage, toStage, note };
}

function formatDate(date: string) {
  if (!date) return "未设置";
  const parsed = new Date(date);
  const today = new Date();
  const sameDay = parsed.toDateString() === today.toDateString();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (sameDay) return "今天";
  if (parsed.toDateString() === tomorrow.toDateString()) return "明天";
  return date.slice(5, 10).replace("-", "/");
}

function isDue(date: string) {
  if (!date) return false;
  return date <= new Date().toISOString().slice(0, 10);
}

function downloadFile(content: string, filename: string, type = "text/plain;charset=utf-8") {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([content], { type }));
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function jobsToCsv(jobs: Job[]) {
  const fields: (keyof Job)[] = ["companyName", "jobTitle", "jobDirection", "stage", "priority", "matchScore", "salaryRange", "location", "sourceChannel", "nextAction", "nextFollowUpAt"];
  const labels = ["公司", "岗位", "方向", "阶段", "优先级", "匹配度", "薪资", "地点", "来源", "下一步", "跟进日期"];
  const escape = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  return [labels.map(escape).join(","), ...jobs.map((job) => fields.map((field) => escape(job[field])).join(","))].join("\n");
}

function jobsToMarkdown(jobs: Job[]) {
  const due = jobs.filter((job) => isDue(job.nextFollowUpAt));
  const focus = jobs.filter((job) => job.priority === "A");
  return `# JobPilot 求职周报

生成时间：${new Date().toLocaleString("zh-CN")}

## 本周概览

- 岗位总数：${jobs.length}
- 待跟进：${due.length}
- 已投递：${jobs.filter((job) => ["已投递", "HR沟通", "面试中", "Offer"].includes(job.stage)).length}
- 面试中：${jobs.filter((job) => job.stage === "面试中").length}
- Offer：${jobs.filter((job) => job.stage === "Offer").length}

## A 级重点机会

${focus.length ? focus.map((job) => `- ${job.companyName} / ${job.jobTitle}：${job.stage}，下一步 ${job.nextAction || "待补充"}`).join("\n") : "- 暂无"}

## 待跟进事项

${due.length ? due.map((job) => `- ${job.companyName} / ${job.jobTitle}：${job.nextAction || "待补充行动"}`).join("\n") : "- 暂无"}
`;
}

export function App() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const jobsRef = useRef<Job[]>([]);
  const persistQueuesRef = useRef<Map<string, Promise<void>>>(new Map());
  const [page, setPage] = useState<Page>("dashboard");
  const [saveState, setSaveState] = useState<SaveState>("loading");
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [jobView, setJobView] = useState<JobView>("table");
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<Stage | "全部">("全部");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "全部">("全部");
  const [directionFilter, setDirectionFilter] = useState<Direction | "全部">("全部");
  const [locationFilter, setLocationFilter] = useState("");
  const [dueOnly, setDueOnly] = useState(false);
  const [directionOptions, setDirectionOptions] = useState<Direction[]>(loadDirections);
  const [lastBackup, setLastBackup] = useState(localStorage.getItem("jobpilot-last-backup") ?? "尚未备份");
  const [displayName, setDisplayName] = useState(localStorage.getItem("jobpilot-display-name") ?? "管理员");

  useEffect(() => {
    loadJobs()
      .then((items) => {
        jobsRef.current = items;
        setJobs(items);
        setSaveState("saved");
      })
      .catch(() => setSaveState("error"));
  }, []);

  useEffect(() => {
    jobsRef.current = jobs;
  }, [jobs]);

  useEffect(() => {
    const merged = mergeJobDirections(directionOptions, jobs);
    if (merged.length === directionOptions.length) return;
    setDirectionOptions(merged);
    persistDirections(merged);
  }, [directionOptions, jobs]);

  const replaceJobsState = (items: Job[]) => {
    jobsRef.current = items;
    setJobs(items);
  };

  const enqueuePersistJob = (job: Job) => {
    const previous = persistQueuesRef.current.get(job.id) ?? Promise.resolve();
    const next = previous.catch(() => undefined).then(() => persistJob(job));
    persistQueuesRef.current.set(job.id, next);
    return next.finally(() => {
      if (persistQueuesRef.current.get(job.id) === next) persistQueuesRef.current.delete(job.id);
    });
  };

  const companyOptions = useMemo(() => collectCompanyOptions(jobs), [jobs]);

  const saveJob = async (job: Job) => {
    const currentJobs = jobsRef.current;
    const existing = currentJobs.find((item) => item.id === job.id);
    const duplicate = findPotentialDuplicate(currentJobs, job);
    if (duplicate && !window.confirm(`可能已存在重复岗位：${duplicate.companyName} / ${duplicate.jobTitle}。仍要继续保存吗？`)) {
      return false;
    }
    let resultReason = job.resultReason.trim();
    if (job.stage === "已结束" && existing?.stage !== "已结束" && !resultReason) {
      return false;
    }
    const stageHistory = [...(existing?.stageHistory ?? job.stageHistory ?? [])];
    if (!existing) {
      stageHistory.push(createActivity("created", job.stage, "新增岗位"));
    } else if (existing.stage !== job.stage) {
      const note = job.stage === "已结束"
        ? `结束岗位：${resultReason}`
        : existing.stage === "已结束"
          ? "恢复岗位"
          : `阶段更新为“${job.stage}”`;
      stageHistory.push(createActivity("stage-change", job.stage, note, existing.stage));
    }
    const updated = { ...job, resultReason, stageHistory, updatedAt: new Date().toISOString() };
    setSaveState("saving");
    replaceJobsState(currentJobs.some((item) => item.id === updated.id)
      ? currentJobs.map((item) => item.id === updated.id ? updated : item)
      : [updated, ...currentJobs]);
    try {
      await enqueuePersistJob(updated);
      setSaveState("saved");
      return true;
    } catch {
      if (jobsRef.current.find((item) => item.id === updated.id) === updated) {
        replaceJobsState(existing
          ? jobsRef.current.map((item) => item.id === existing.id ? existing : item)
          : jobsRef.current.filter((item) => item.id !== updated.id));
      }
      setSaveState("error");
      window.alert("岗位保存失败，请稍后重试。当前编辑内容仍保留在页面中。");
      return false;
    }
  };

  const moveJobToStage = (id: string, stage: Stage) => {
    const job = jobsRef.current.find((item) => item.id === id);
    if (!job || job.stage === stage) return;
    if (stage === "已结束" && !job.resultReason.trim()) {
      setEditingJob({ ...job, stage });
      return;
    }
    void saveJob({ ...job, stage });
  };

  const deleteJob = async (id: string) => {
    if (!window.confirm("确定删除这个岗位吗？此操作无法撤销。")) return false;
    setSaveState("saving");
    try {
      await (persistQueuesRef.current.get(id) ?? Promise.resolve()).catch(() => undefined);
      await removeJob(id);
      replaceJobsState(jobsRef.current.filter((item) => item.id !== id));
      setEditingJob(null);
      setSaveState("saved");
      return true;
    } catch {
      setSaveState("error");
      window.alert("岗位删除失败，请稍后重试。");
      return false;
    }
  };

  const filteredJobs = useMemo(() => jobs.filter((job) => {
    const text = `${job.companyName} ${job.jobTitle} ${job.keywords.join(" ")}`.toLowerCase();
    return (!search || text.includes(search.toLowerCase()))
      && (stageFilter === "全部" ? job.stage !== "已结束" : job.stage === stageFilter)
      && (priorityFilter === "全部" || job.priority === priorityFilter)
      && (directionFilter === "全部" || job.jobDirection === directionFilter)
      && (!locationFilter || job.location.includes(locationFilter))
      && (!dueOnly || isDue(job.nextFollowUpAt));
  }), [directionFilter, dueOnly, jobs, locationFilter, priorityFilter, search, stageFilter]);

  const clearFilters = () => {
    setSearch("");
    setStageFilter("全部");
    setPriorityFilter("全部");
    setDirectionFilter("全部");
    setLocationFilter("");
    setDueOnly(false);
  };

  const quickFilter = (kind: "due" | "a" | "analysis" | "wuhan") => {
    setPage("jobs");
    clearFilters();
    if (kind === "a") setPriorityFilter("A");
    if (kind === "analysis") setStageFilter("待分析");
    if (kind === "wuhan") setLocationFilter("武汉");
    if (kind === "due") setDueOnly(true);
  };

  const addDirection = (value: string) => {
    const normalized = value.trim();
    if (!normalized) return null;
    const existing = directionOptions.find((item) => item.toLocaleLowerCase() === normalized.toLocaleLowerCase());
    if (existing) {
      window.alert("该岗位方向已存在。");
      return existing;
    }
    const updated = [...directionOptions, normalized];
    setDirectionOptions(updated);
    persistDirections(updated);
    return normalized;
  };

  const renameDirection = async (current: Direction, value: string) => {
    const normalized = value.trim();
    if (!normalized || normalized === current) return;
    if (directionOptions.some((item) => item !== current && item.toLocaleLowerCase() === normalized.toLocaleLowerCase())) {
      window.alert("该岗位方向已存在。");
      return;
    }
    const updatedDirections = directionOptions.map((item) => item === current ? normalized : item);
    const updatedJobs = jobs.map((job) => job.jobDirection === current ? { ...job, jobDirection: normalized, updatedAt: new Date().toISOString() } : job);
    setDirectionOptions(updatedDirections);
    persistDirections(updatedDirections);
    if (directionFilter === current) setDirectionFilter(normalized);
    if (updatedJobs.every((job, index) => job === jobs[index])) return;
    replaceJobsState(updatedJobs);
    setSaveState("saving");
    try {
      await replaceJobs(updatedJobs);
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  };

  const deleteDirection = (direction: Direction) => {
    if (directionOptions.length === 1) {
      window.alert("至少需要保留一个岗位方向。");
      return;
    }
    const usedCount = jobs.filter((job) => job.jobDirection === direction).length;
    if (usedCount) {
      window.alert(`仍有 ${usedCount} 个岗位使用“${direction}”，请先调整这些岗位或直接改名。`);
      return;
    }
    if (!window.confirm(`确定删除岗位方向“${direction}”吗？`)) return;
    const updated = directionOptions.filter((item) => item !== direction);
    setDirectionOptions(updated);
    persistDirections(updated);
    if (directionFilter === direction) setDirectionFilter("全部");
  };

  const renderPage = () => {
    if (page === "dashboard") return <Dashboard jobs={jobs} displayName={displayName} onOpen={setEditingJob} onPage={setPage} />;
    if (page === "jobs") return (
      <JobsPage
        jobs={filteredJobs}
        allCount={jobs.filter((job) => job.stage !== "已结束").length}
        directions={directionOptions}
        view={jobView}
        setView={setJobView}
        search={search}
        setSearch={setSearch}
        stageFilter={stageFilter}
        setStageFilter={setStageFilter}
        priorityFilter={priorityFilter}
        setPriorityFilter={setPriorityFilter}
        directionFilter={directionFilter}
        setDirectionFilter={setDirectionFilter}
        locationFilter={locationFilter}
        setLocationFilter={setLocationFilter}
        clearFilters={clearFilters}
        onQuickAdd={() => setQuickAddOpen(true)}
        onManualAdd={() => setEditingJob(createBlankJob(defaultJobDirection(directionOptions)))}
        onOpen={setEditingJob}
        onMoveStage={moveJobToStage}
      />
    );
    if (page === "interviews") return <InterviewsPage jobs={jobs} onOpen={setEditingJob} />;
    if (page === "analytics") return <AnalyticsPage jobs={jobs} directions={directionOptions} />;
    if (page === "exports") return <ExportsPage jobs={jobs} setJobs={replaceJobsState} setLastBackup={setLastBackup} />;
    return <SettingsPage jobs={jobs} directions={directionOptions} displayName={displayName} setDisplayName={setDisplayName} onAddDirection={addDirection} onRenameDirection={renameDirection} onDeleteDirection={deleteDirection} />;
  };

  return (
    <div className="app">
      <Sidebar
        page={page}
        setPage={(nextPage) => {
          if (nextPage === "jobs") clearFilters();
          setPage(nextPage);
        }}
        jobs={jobs}
        saveState={saveState}
        lastBackup={lastBackup}
        quickFilter={quickFilter}
      />
      <main className="main-shell">
        <header className="topbar">
          <div>
            <p className="eyebrow">{pageMeta[page].caption}</p>
            <h1>{pageMeta[page].label}</h1>
          </div>
          <div className="topbar-actions">
            <label className="top-search">
              <Search size={16} />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索公司、岗位或关键词" />
            </label>
            <button className="btn secondary" onClick={() => setEditingJob(createBlankJob(defaultJobDirection(directionOptions)))}><Plus size={16} /> 新增岗位</button>
            <button className="btn primary" onClick={() => setQuickAddOpen(true)}><Sparkles size={16} /> JD识别</button>
          </div>
        </header>
        <div className="page-content">{renderPage()}</div>
      </main>
      {quickAddOpen && <QuickAddDrawer companies={companyOptions} directions={directionOptions} onAddDirection={addDirection} onClose={() => setQuickAddOpen(false)} onSave={async (job) => {
        const saved = await saveJob(job);
        if (saved) setQuickAddOpen(false);
        return saved;
      }} />}
      {editingJob && <JobDetailDrawer job={editingJob} companies={companyOptions} directions={directionOptions} onAddDirection={addDirection} onClose={() => setEditingJob(null)} onSave={async (job) => {
        const saved = await saveJob(job);
        if (saved) setEditingJob(null);
        return saved;
      }} onDelete={deleteJob} />}
    </div>
  );
}

function Sidebar({ page, setPage, jobs, saveState, lastBackup, quickFilter }: {
  page: Page;
  setPage: (page: Page) => void;
  jobs: Job[];
  saveState: SaveState;
  lastBackup: string;
  quickFilter: (kind: "due" | "a" | "analysis" | "wuhan") => void;
}) {
  const dueCount = jobs.filter((job) => isDue(job.nextFollowUpAt)).length;
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark"><BriefcaseBusiness size={18} /></div>
        <div><strong>JobPilot</strong><span>个人求职工作台</span></div>
      </div>
      <nav className="nav-list">
        {(Object.keys(pageMeta) as Page[]).map((item) => {
          const Icon = pageMeta[item].icon;
          return <button className={`nav-item ${page === item ? "active" : ""}`} onClick={() => setPage(item)} key={item}><Icon size={17} />{pageMeta[item].label}</button>;
        })}
      </nav>
      <div className="sidebar-section">
        <p>快捷筛选</p>
        <button onClick={() => quickFilter("due")}><BellRing size={14} /> 今日待办 <span>{dueCount}</span></button>
        <button onClick={() => quickFilter("a")}><Sparkles size={14} /> A 级机会 <span>{jobs.filter((job) => job.priority === "A").length}</span></button>
        <button onClick={() => quickFilter("wuhan")}><BriefcaseBusiness size={14} /> 武汉岗位 <span>{jobs.filter((job) => job.location.includes("武汉")).length}</span></button>
        <button onClick={() => quickFilter("analysis")}><CircleHelp size={14} /> 待分析 <span>{jobs.filter((job) => job.stage === "待分析").length}</span></button>
      </div>
      <div className="sidebar-status">
        <div className={`save-dot ${saveState}`} />
        <div>
          <strong>{saveState === "saving" ? "正在保存" : saveState === "error" ? "保存失败" : saveState === "loading" ? "正在读取" : "已保存到本地"}</strong>
          <span>最近备份：{lastBackup}</span>
        </div>
      </div>
    </aside>
  );
}

function Dashboard({ jobs, displayName, onOpen, onPage }: { jobs: Job[]; displayName: string; onOpen: (job: Job) => void; onPage: (page: Page) => void }) {
  const dueJobs = jobs.filter((job) => isDue(job.nextFollowUpAt)).slice(0, 5);
  const focusJobs = jobs.filter((job) => job.priority === "A").slice(0, 4);
  const interviewCount = jobs.filter((job) => job.stage === "面试中").length;
  const submitted = jobs.filter((job) => ["已投递", "HR沟通", "面试中", "Offer"].includes(job.stage)).length;
  const keywordCounts = countKeywords(jobs).slice(0, 5);
  const funnel = stages.slice(0, 6).map((stage) => ({ stage, count: jobs.filter((job) => job.stage === stage).length }));
  return (
    <div className="stack">
      <section className="welcome-row">
        <div>
          <h2>早上好，{displayName}</h2>
          <p>先处理临近跟进，再把新看到的岗位随手收进来。</p>
        </div>
      </section>
      <section className="metric-grid">
        <Metric label="今日待跟进" value={dueJobs.length} note="避免错过关键沟通" icon={<BellRing size={17} />} tone="orange" />
        <Metric label="已投递" value={submitted} note={`共积累 ${jobs.length} 个机会`} icon={<FileText size={17} />} tone="blue" />
        <Metric label="面试中" value={interviewCount} note="及时记录问题与反馈" icon={<ClipboardList size={17} />} tone="purple" />
        <Metric label="A 级机会" value={focusJobs.length} note="优先投入准备时间" icon={<Sparkles size={17} />} tone="green" />
      </section>
      <section className="dashboard-grid">
        <Panel title="今日待办" action={<button className="text-btn" onClick={() => onPage("jobs")}>查看全部 <ChevronRight size={14} /></button>}>
          {dueJobs.length ? <div className="follow-list">{dueJobs.map((job) => <button className="follow-row" onClick={() => onOpen(job)} key={job.id}><span className="date-box">{formatDate(job.nextFollowUpAt)}</span><span><strong>{job.companyName} · {job.jobTitle}</strong><small>{job.nextAction || "补充下一步行动"}</small></span><ChevronRight size={15} /></button>)}</div> : <EmptyLine text="今天没有到期事项，可以整理新岗位。" />}
        </Panel>
        <Panel title="求职漏斗" action={<button className="text-btn" onClick={() => onPage("analytics")}>进入分析 <ChevronRight size={14} /></button>}>
          <div className="mini-funnel">{funnel.map((item, index) => <div className="funnel-row" key={item.stage}><span>{item.stage}</span><div><i style={{ width: `${Math.max(12, 94 - index * 11)}%` }} /></div><strong>{item.count}</strong></div>)}</div>
        </Panel>
        <Panel title="A 级重点机会" action={<button className="text-btn" onClick={() => onPage("jobs")}>管理机会 <ChevronRight size={14} /></button>}>
          <div className="focus-list">{focusJobs.map((job) => <button onClick={() => onOpen(job)} key={job.id}><span><strong>{job.companyName}</strong><small>{job.jobTitle}</small></span><Tag tone={stageTone[job.stage]}>{job.stage}</Tag><em>{job.matchScore}</em></button>)}</div>
        </Panel>
        <Panel title="高频能力要求" action={<button className="text-btn" onClick={() => onPage("analytics")}>查看排行 <ChevronRight size={14} /></button>}>
          <div className="keyword-list">{keywordCounts.map(([keyword, count], index) => <div key={keyword}><span><i>{index + 1}</i>{keyword}</span><strong>{count} 次</strong></div>)}</div>
        </Panel>
      </section>
    </div>
  );
}

function JobsPage(props: {
  jobs: Job[]; allCount: number; directions: Direction[]; view: JobView; setView: (view: JobView) => void;
  search: string; setSearch: (value: string) => void; stageFilter: Stage | "全部"; setStageFilter: (value: Stage | "全部") => void;
  priorityFilter: Priority | "全部"; setPriorityFilter: (value: Priority | "全部") => void;
  directionFilter: Direction | "全部"; setDirectionFilter: (value: Direction | "全部") => void;
  locationFilter: string; setLocationFilter: (value: string) => void; clearFilters: () => void;
  onQuickAdd: () => void; onManualAdd: () => void; onOpen: (job: Job) => void; onMoveStage: (id: string, stage: Stage) => void;
}) {
  const { jobs, allCount, directions, view, setView, search, setSearch, stageFilter, setStageFilter, priorityFilter, setPriorityFilter, directionFilter, setDirectionFilter, locationFilter, setLocationFilter, clearFilters, onOpen, onMoveStage } = props;
  return (
    <div className="stack">
      <section className="jobs-toolbar">
        <div><h2>岗位机会 <span>{allCount}</span></h2><p>把散落的信息收拢成清晰可推进的机会列表。</p></div>
        <div className="segmented">
          <button className={view === "table" ? "active" : ""} onClick={() => setView("table")} title="表格视图"><List size={15} /> 表格</button>
          <button className={view === "board" ? "active" : ""} onClick={() => setView("board")} title="看板视图"><KanbanSquare size={15} /> 看板</button>
          <button className={view === "cards" ? "active" : ""} onClick={() => setView("cards")} title="卡片视图"><LayoutGrid size={15} /> 卡片</button>
        </div>
      </section>
      <section className="filter-bar">
        <label className="filter-search"><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索公司、岗位或关键词" /></label>
        <Select value={directionFilter} onChange={(value) => setDirectionFilter(value as Direction | "全部")} options={["全部", ...directions]} label="方向" />
        <Select value={stageFilter} onChange={(value) => setStageFilter(value as Stage | "全部")} options={["全部", ...stages]} label="阶段" />
        <Select value={priorityFilter} onChange={(value) => setPriorityFilter(value as Priority | "全部")} options={["全部", ...priorities]} label="优先级" />
        <label className="compact-input"><BriefcaseBusiness size={15} /><input value={locationFilter} onChange={(event) => setLocationFilter(event.target.value)} placeholder="地点" /></label>
        <button className="icon-btn" onClick={clearFilters} title="清空筛选"><X size={16} /></button>
      </section>
      {view === "table" && <JobTable jobs={jobs} onOpen={onOpen} />}
      {view === "board" && <JobBoard jobs={jobs} onOpen={onOpen} onMoveStage={onMoveStage} />}
      {view === "cards" && <JobCards jobs={jobs} onOpen={onOpen} />}
    </div>
  );
}

function JobTable({ jobs, onOpen }: { jobs: Job[]; onOpen: (job: Job) => void }) {
  if (!jobs.length) return <EmptyPanel title="没有找到匹配的岗位" text="调整筛选条件，或录入一条新 JD。" />;
  return (
    <div className="table-wrap">
      <table>
        <thead><tr><th>公司 / 岗位</th><th>方向</th><th>当前阶段</th><th>优先级</th><th>匹配度</th><th>薪资范围</th><th>下次跟进</th><th /></tr></thead>
        <tbody>{jobs.map((job) => (
          <tr key={job.id} onClick={() => onOpen(job)}>
            <td><strong>{job.companyName || "未填写公司"}</strong><small>{job.jobTitle || "未填写岗位"}</small></td>
            <td><Tag tone={directionTone[job.jobDirection] ?? "neutral"}>{job.jobDirection}</Tag></td>
            <td><Tag tone={stageTone[job.stage]}>{job.stage}</Tag></td>
            <td><PriorityMark priority={job.priority} /></td>
            <td><Score score={job.matchScore} /></td>
            <td>{job.salaryRange || "-"}</td>
            <td className={isDue(job.nextFollowUpAt) ? "due" : ""}>{formatDate(job.nextFollowUpAt)}</td>
            <td><button className="icon-btn bare" title="查看详情"><MoreHorizontal size={16} /></button></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}

function JobBoard({ jobs, onOpen, onMoveStage }: { jobs: Job[]; onOpen: (job: Job) => void; onMoveStage: (id: string, stage: Stage) => void }) {
  const boardStages = jobs.some((job) => job.stage === "已结束") ? stages : stages.slice(0, 6);
  return (
    <div className="board" style={{ gridTemplateColumns: `repeat(${boardStages.length}, minmax(165px, 1fr))` }}>
      {boardStages.map((stage) => {
        const list = jobs.filter((job) => job.stage === stage);
        return (
          <section className="board-column" key={stage} onDragOver={(event) => event.preventDefault()} onDrop={(event) => {
            const id = event.dataTransfer.getData("job-id");
            if (id) onMoveStage(id, stage);
          }}>
            <header><span>{stage}</span><em>{list.length}</em></header>
            <div>{list.map((job) => <button draggable onDragStart={(event) => event.dataTransfer.setData("job-id", job.id)} onClick={() => onOpen(job)} className="board-card" key={job.id}><strong>{job.companyName}</strong><span>{job.jobTitle}</span><footer><PriorityMark priority={job.priority} /><small>{formatDate(job.nextFollowUpAt)}</small></footer></button>)}</div>
          </section>
        );
      })}
    </div>
  );
}

function JobCards({ jobs, onOpen }: { jobs: Job[]; onOpen: (job: Job) => void }) {
  return <div className="job-card-grid">{jobs.map((job) => <button className="job-card" onClick={() => onOpen(job)} key={job.id}><header><PriorityMark priority={job.priority} /><Tag tone={stageTone[job.stage]}>{job.stage}</Tag></header><h3>{job.companyName}</h3><p>{job.jobTitle}</p><div className="job-card-meta"><span>{job.location || "地点待补充"}</span><span>{job.salaryRange || "薪资待补充"}</span></div><footer><Score score={job.matchScore} /><small>{job.nextAction || "补充下一步行动"}</small></footer></button>)}</div>;
}

function InterviewsPage({ jobs, onOpen }: { jobs: Job[]; onOpen: (job: Job) => void }) {
  const interviewJobs = jobs.filter((job) => ["HR沟通", "面试中", "Offer"].includes(job.stage));
  return (
    <div className="split-layout">
      <section className="side-list">
        <div className="section-heading"><div><h2>面试与沟通记录</h2><p>{interviewJobs.length} 个进行中的机会</p></div></div>
        {interviewJobs.map((job) => <button key={job.id} onClick={() => onOpen(job)}><span><strong>{job.companyName}</strong><small>{job.jobTitle}</small></span><Tag tone={stageTone[job.stage]}>{job.stage}</Tag></button>)}
      </section>
      <section className="editor-placeholder">
        <ClipboardList size={28} />
        <h3>复盘每次关键沟通</h3>
        <p>首版可在岗位详情中记录面试笔记和下一步行动。独立复盘编辑器将在下一轮补充。</p>
      </section>
    </div>
  );
}

function AnalyticsPage({ jobs, directions }: { jobs: Job[]; directions: Direction[] }) {
  const stageStats = stages.slice(0, 6).map((label) => ({ label, value: jobs.filter((job) => job.stage === label).length }));
  const directionStats = directions.map((label) => ({ label, value: jobs.filter((job) => job.jobDirection === label).length }));
  const channelStats = [...new Set(jobs.map((job) => job.sourceChannel))].map((label) => ({ label, value: jobs.filter((job) => job.sourceChannel === label).length }));
  const keywordStats = countKeywords(jobs).slice(0, 8).map(([label, value]) => ({ label, value }));
  return (
    <div className="analytics-grid">
      <ChartPanel title="求职阶段漏斗" caption="从岗位积累到 Offer 的当前分布"><BarList data={stageStats} /></ChartPanel>
      <ChartPanel title="岗位方向分布" caption="观察精力投入是否符合求职目标"><BarList data={directionStats} colors /></ChartPanel>
      <ChartPanel title="来源渠道分布" caption="识别更有效的岗位来源"><BarList data={channelStats} /></ChartPanel>
      <ChartPanel title="高频 JD 关键词" caption="下一轮简历和学习计划的输入"><BarList data={keywordStats} colors /></ChartPanel>
    </div>
  );
}

function ExportsPage({ jobs, setJobs, setLastBackup }: { jobs: Job[]; setJobs: (jobs: Job[]) => void; setLastBackup: (value: string) => void }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const backup = () => {
    downloadFile(JSON.stringify({ version: "0.1.0", exportedAt: new Date().toISOString(), jobs }, null, 2), `jobpilot-backup-${new Date().toISOString().slice(0, 10)}.json`, "application/json");
    const now = new Date().toLocaleString("zh-CN", { hour12: false });
    localStorage.setItem("jobpilot-last-backup", now);
    setLastBackup(now);
  };
  const restore = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as { jobs?: Job[] };
      if (!Array.isArray(parsed.jobs)) throw new Error("invalid");
      if (!window.confirm(`将使用备份中的 ${parsed.jobs.length} 条岗位覆盖当前数据，确定继续吗？`)) return;
      await replaceJobs(parsed.jobs);
      setJobs(parsed.jobs.map(normalizeJob));
      alert("备份恢复完成。");
    } catch {
      alert("无法读取该备份，请确认文件来自 JobPilot。");
    }
    event.target.value = "";
  };
  return (
    <div className="export-grid">
      <ExportCard icon={<ShieldCheck />} title="JSON 完整备份" text="导出全部岗位数据，用于本地归档和迁移。" actions={<><button className="btn primary" onClick={backup}><Download size={16} /> 导出备份</button><button className="btn secondary" onClick={() => fileInput.current?.click()}><Upload size={16} /> 恢复数据</button><input ref={fileInput} hidden type="file" accept=".json" onChange={restore} /></>} />
      <ExportCard icon={<FileDown />} title="CSV 岗位清单" text="导出常用字段，可在表格工具中继续整理。" actions={<button className="btn secondary" onClick={() => downloadFile(`\uFEFF${jobsToCsv(jobs)}`, "jobpilot-jobs.csv", "text/csv;charset=utf-8")}><Download size={16} /> 导出 CSV</button>} />
      <ExportCard icon={<FileText />} title="Markdown 周报" text="汇总阶段进展、重点岗位和待跟进事项。" actions={<button className="btn secondary" onClick={() => downloadFile(jobsToMarkdown(jobs), "jobpilot-weekly-report.md")}><Download size={16} /> 导出周报</button>} />
      <ExportCard icon={<Archive />} title="Excel 工作簿" text="完整工作簿导出将在 v0.2 提供。" actions={<button className="btn secondary" disabled>即将支持</button>} />
    </div>
  );
}

function SettingsPage({ jobs, directions, displayName, setDisplayName, onAddDirection, onRenameDirection, onDeleteDirection }: {
  jobs: Job[];
  directions: Direction[];
  displayName: string;
  setDisplayName: (value: string) => void;
  onAddDirection: (value: string) => Direction | null;
  onRenameDirection: (direction: Direction, value: string) => void;
  onDeleteDirection: (direction: Direction) => void;
}) {
  const [draftName, setDraftName] = useState(displayName);
  const saveDisplayName = () => {
    const nextName = draftName.trim() || "管理员";
    localStorage.setItem("jobpilot-display-name", nextName);
    setDisplayName(nextName);
    setDraftName(nextName);
  };
  return (
    <div className="settings-list">
      <section><header><Pencil size={19} /><div><h3>工作台称呼</h3><p>用于首页欢迎语，默认显示“管理员”。</p></div></header><div className="setting-control"><input value={draftName} onChange={(event) => setDraftName(event.target.value)} maxLength={20} placeholder="管理员" /><button className="btn secondary" onClick={saveDisplayName}>保存</button></div></section>
      <DirectionSettings directions={directions} onAdd={onAddDirection} onRename={onRenameDirection} onDelete={onDeleteDirection} />
      <section><header><ShieldCheck size={19} /><div><h3>本地优先存储</h3><p>岗位、联系人、薪资和跟进记录默认保存在当前浏览器 IndexedDB 中。</p></div></header><Tag tone="green">已启用</Tag></section>
      <section><header><Sparkles size={19} /><div><h3>AI 云端分析</h3><p>首版仅使用本地规则拆分 JD，不会把任何内容发送到外部模型。</p></div></header><Tag tone="gray">未启用</Tag></section>
      <section><header><Archive size={19} /><div><h3>当前数据量</h3><p>建议每周导出一次 JSON 备份，并自行保管导出的文件。</p></div></header><strong>{jobs.length} 条岗位</strong></section>
    </div>
  );
}

function QuickAddDrawer({ companies, directions, onAddDirection, onClose, onSave }: {
  companies: string[];
  directions: Direction[];
  onAddDirection: (value: string) => Direction | null;
  onClose: () => void;
  onSave: (job: Job) => Promise<boolean>;
}) {
  const [savedDraft] = useState(() => loadLocalDraft<{ step: QuickAddStep; url: string; raw: string; job: Job | null }>(QUICK_ADD_DRAFT_KEY));
  const [step, setStep] = useState<QuickAddStep>(savedDraft?.step === "confirm" && savedDraft.job ? "confirm" : "input");
  const [url, setUrl] = useState(savedDraft?.url ?? "");
  const [raw, setRaw] = useState(savedDraft?.raw ?? "");
  const [job, setJob] = useState<Job | null>(savedDraft?.job ? normalizeJob(savedDraft.job) : null);
  const [message, setMessage] = useState(savedDraft ? "已恢复上次未保存的 JD 草稿。" : "");
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!url && !raw && !job) {
        localStorage.removeItem(QUICK_ADD_DRAFT_KEY);
        return;
      }
      localStorage.setItem(QUICK_ADD_DRAFT_KEY, JSON.stringify({ step, url, raw, job }));
    }, 600);
    return () => window.clearTimeout(timer);
  }, [job, raw, step, url]);
  const clearDraft = () => localStorage.removeItem(QUICK_ADD_DRAFT_KEY);
  const recognize = () => {
    if (!raw.trim()) {
      setMessage("请先粘贴 JD 原文，再进行识别。");
      return;
    }
    const parsed = parseJD(raw, url, directions);
    setJob(parsed);
    setMessage(parsed.companyName && parsed.jobTitle ? "" : "部分字段未识别，请补充公司名称和岗位名称后再保存。");
    setStep("confirm");
  };
  const save = async () => {
    if (!job) return;
    if (job.stage === "已结束" && !job.resultReason.trim()) {
      setMessage("进入“已结束”前，请先填写结束原因。");
      return;
    }
    if (await onSave(job)) clearDraft();
  };
  return (
    <Drawer title={step === "input" ? "录入 JD" : "确认识别结果"} onClose={onClose}>
      {message && <div className="drawer-note warning"><CircleHelp size={16} /><span>{message}</span></div>}
      {step === "input" ? (
        <>
          <div className="drawer-note"><ShieldCheck size={16} /><span>JD 文本仅在本地解析，不会发送到外部服务。</span></div>
          <Field label="来源链接（可选）"><input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="粘贴招聘页面链接，便于后续回看" /></Field>
          <Field label="粘贴 JD 原文"><textarea className="jd-textarea" value={raw} onChange={(event) => setRaw(event.target.value)} placeholder={"推荐保留原始格式，例如：\n公司：示例科技\n岗位：AI 产品经理\n地点：武汉·光谷\n薪资：18k-25k\n\n岗位职责：...\n任职要求：..."} /></Field>
          <div className="drawer-footer"><button className="btn secondary" onClick={onClose}>取消</button><button className="btn primary" disabled={!raw.trim()} onClick={recognize}><Sparkles size={16} /> 识别并继续</button></div>
        </>
      ) : job && (
        <>
          <div className="drawer-note"><Check size={16} /><span>已完成本地规则识别。保存前可以继续调整字段。</span></div>
          <Field label="来源链接（可选）"><input value={job.jdUrl} onChange={(event) => setJob({ ...job, jdUrl: event.target.value })} placeholder="粘贴招聘页面链接，便于后续回看" /></Field>
          <JobForm job={job} companies={companies} directions={directions} onAddDirection={onAddDirection} onChange={setJob} compact />
          <div className="drawer-footer"><button className="btn secondary" onClick={() => setStep("input")}>返回修改</button><button className="btn primary" disabled={!job.companyName || !job.jobTitle} onClick={save}><Check size={16} /> 保存岗位</button></div>
        </>
      )}
    </Drawer>
  );
}

function JobDetailDrawer({ job, companies, directions, onAddDirection, onClose, onSave, onDelete }: {
  job: Job;
  companies: string[];
  directions: Direction[];
  onAddDirection: (value: string) => Direction | null;
  onClose: () => void;
  onSave: (job: Job) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}) {
  const isNew = !job.companyName && !job.jobTitle;
  const draftKey = `${JOB_DRAFT_PREFIX}${isNew ? "new" : job.id}`;
  const [savedDraft] = useState(() => loadLocalDraft<Job>(draftKey));
  const [draft, setDraft] = useState(savedDraft ? { ...normalizeJob(savedDraft), stageHistory: job.stageHistory } : job);
  const [draftRestored] = useState(Boolean(savedDraft));
  const [message, setMessage] = useState("");
  useEffect(() => {
    const timer = window.setTimeout(() => localStorage.setItem(draftKey, JSON.stringify(draft)), 600);
    return () => window.clearTimeout(timer);
  }, [draft, draftKey]);
  const clearDraft = () => localStorage.removeItem(draftKey);
  const save = async () => {
    if (draft.stage === "已结束" && !draft.resultReason.trim()) {
      setMessage("进入“已结束”前，请先填写结束原因。");
      return;
    }
    setMessage("");
    if (await onSave(draft)) clearDraft();
  };
  const remove = async () => {
    if (await onDelete(draft.id)) clearDraft();
  };
  const restore = async () => {
    if (await onSave({ ...draft, stage: "待分析", nextAction: draft.nextAction || "重新评估岗位" })) clearDraft();
  };
  return (
    <Drawer title={isNew ? "新增岗位" : "岗位详情"} onClose={onClose} wide>
      {draftRestored && <div className="drawer-note warning"><CircleHelp size={16} /><span>已恢复上次未保存的编辑草稿。</span></div>}
      {message && <div className="drawer-note warning"><CircleHelp size={16} /><span>{message}</span></div>}
      {!isNew && <div className="detail-heading"><div><span>{draft.companyName}</span><h2>{draft.jobTitle}</h2></div><PriorityMark priority={draft.priority} /></div>}
      <div className="job-detail-workspace">
        <div className="job-detail-main">
          <JobForm job={draft} companies={companies} directions={directions} onAddDirection={onAddDirection} onChange={setDraft} />
        </div>
        <aside className="job-detail-side">
          <JobStatusSummary job={draft} />
          <JobTimeline job={job} />
        </aside>
      </div>
      <div className="drawer-footer spread">
        <button className="btn danger" onClick={remove}><Trash2 size={16} /> 删除</button>
        <div>{job.stage === "已结束" && <button className="btn secondary" onClick={restore}>恢复岗位</button>}<button className="btn secondary" onClick={onClose}>取消</button><button className="btn primary" disabled={!draft.companyName || !draft.jobTitle} onClick={save}><Check size={16} /> 保存更新</button></div>
      </div>
    </Drawer>
  );
}

function CompanyInput({ value, options, onChange }: {
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const suggestions = useMemo(() => {
    const identity = normalizeIdentity(value);
    return options
      .filter((option) => normalizeIdentity(option) !== identity)
      .filter((option) => !identity || normalizeIdentity(option).includes(identity))
      .slice(0, 6);
  }, [options, value]);
  return (
    <div className="company-input">
      <input value={value} onChange={(event) => onChange(event.target.value)} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)} placeholder="必填" />
      {open && suggestions.length > 0 && (
        <div className="company-suggestions">
          {suggestions.map((option) => (
            <button type="button" key={option} onMouseDown={(event) => {
              event.preventDefault();
              onChange(option);
              setOpen(false);
            }}>{option}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function JobForm({ job, companies, directions, onAddDirection, onChange, compact = false }: {
  job: Job;
  companies: string[];
  directions: Direction[];
  onAddDirection: (value: string) => Direction | null;
  onChange: (job: Job) => void;
  compact?: boolean;
}) {
  const patch = <K extends keyof Job>(key: K, value: Job[K]) => onChange({ ...job, [key]: value });
  return (
    <div className={`job-form ${compact ? "compact" : ""}`}>
      <div className="form-grid two">
        <Field label="公司名称"><CompanyInput value={job.companyName} options={companies} onChange={(value) => patch("companyName", value)} /></Field>
        <Field label="岗位名称"><input value={job.jobTitle} onChange={(event) => patch("jobTitle", event.target.value)} placeholder="必填" /></Field>
        <Field label="岗位方向"><DirectionSelect value={job.jobDirection} options={directions} onChange={(value) => patch("jobDirection", value)} onAdd={onAddDirection} /></Field>
        <Field label="当前阶段"><Select value={job.stage} onChange={(value) => patch("stage", value as Stage)} options={stages} /></Field>
        <Field label="地点"><input value={job.location} onChange={(event) => patch("location", event.target.value)} placeholder="例如：武汉·光谷" /></Field>
        <Field label="薪资范围"><input value={job.salaryRange} onChange={(event) => patch("salaryRange", event.target.value)} placeholder="例如：18k-25k" /></Field>
        <Field label="优先级"><Select value={job.priority} onChange={(value) => patch("priority", value as Priority)} options={priorities} /></Field>
        <Field label="匹配度"><input type="number" min="0" max="100" value={job.matchScore} onChange={(event) => patch("matchScore", Number(event.target.value))} /></Field>
      </div>
      <Field label="核心职责"><textarea value={job.responsibilities} onChange={(event) => patch("responsibilities", event.target.value)} placeholder="岗位需要做什么" /></Field>
      <Field label="任职要求"><textarea value={job.requirements} onChange={(event) => patch("requirements", event.target.value)} placeholder="能力、经验和加分项" /></Field>
      <Field label="JD 关键词"><input value={job.keywords.join("、")} onChange={(event) => patch("keywords", event.target.value.split(/[、,，\s]+/).filter(Boolean))} placeholder="Agent、RAG、Prompt" /></Field>
      {job.stage === "已结束" && <Field label="结束原因"><textarea value={job.resultReason} onChange={(event) => patch("resultReason", event.target.value)} placeholder="例如：已拒绝、主动放弃、岗位关闭" /></Field>}
      {!compact && <>
        <div className="form-grid two">
          <Field label="下一步行动"><input value={job.nextAction} onChange={(event) => patch("nextAction", event.target.value)} placeholder="例如：按 JD 调整简历首屏" /></Field>
          <Field label="下次跟进日期"><input type="date" value={job.nextFollowUpAt} onChange={(event) => patch("nextFollowUpAt", event.target.value)} /></Field>
        </div>
        <Field label="沟通与面试笔记"><textarea value={job.notes} onChange={(event) => patch("notes", event.target.value)} placeholder="记录问题、反馈和需要改进的地方" /></Field>
        <Field label="来源链接"><input value={job.jdUrl} onChange={(event) => patch("jdUrl", event.target.value)} placeholder="https://" /></Field>
      </>}
    </div>
  );
}

function JobTimeline({ job }: { job: Job }) {
  const activities = [...job.stageHistory].reverse();
  return (
    <section className="job-timeline">
      <header><CalendarClock size={16} /><h3>阶段时间线</h3></header>
      {activities.length ? (
        <div className="timeline-list">
          {activities.map((activity) => (
            <div className="timeline-item" key={activity.id}>
              <i />
              <div>
                <strong>{activity.note}</strong>
                <span>{new Date(activity.occurredAt).toLocaleString("zh-CN", { hour12: false })}</span>
              </div>
            </div>
          ))}
        </div>
      ) : <p>保存岗位或更新阶段后，这里会记录变化。</p>}
    </section>
  );
}

function JobStatusSummary({ job }: { job: Job }) {
  return (
    <section className="job-status-summary">
      <header><SlidersHorizontal size={16} /><h3>当前状态</h3></header>
      <dl>
        <div><dt>阶段</dt><dd><Tag tone={stageTone[job.stage]}>{job.stage}</Tag></dd></div>
        <div><dt>优先级</dt><dd><PriorityMark priority={job.priority} /></dd></div>
        <div><dt>匹配度</dt><dd><Score score={job.matchScore} /></dd></div>
        <div><dt>下次跟进</dt><dd>{formatDate(job.nextFollowUpAt)}</dd></div>
      </dl>
      <div className="job-status-action">
        <span>下一步动作</span>
        <p>{job.nextAction || "尚未设置"}</p>
      </div>
      {job.stage === "已结束" && <div className="job-status-action">
        <span>结束原因</span>
        <p>{job.resultReason || "保存前请补充结束原因"}</p>
      </div>}
    </section>
  );
}

function DirectionSelect({ value, options, onChange, onAdd }: {
  value: Direction;
  options: Direction[];
  onChange: (value: Direction) => void;
  onAdd: (value: string) => Direction | null;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const add = () => {
    const direction = onAdd(draft);
    if (!direction) return;
    onChange(direction);
    setDraft("");
    setAdding(false);
  };
  return (
    <div className="direction-select-stack">
      <div className="direction-select-control">
        <Select value={value} onChange={onChange} options={options} />
        <button type="button" className="btn secondary compact" onClick={() => setAdding(true)}><Plus size={14} /> 新增</button>
      </div>
      {adding && <div className="direction-inline-add">
        <input autoFocus value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => {
          if (event.key === "Enter") add();
          if (event.key === "Escape") setAdding(false);
        }} placeholder="输入新的岗位方向" />
        <button type="button" className="btn secondary compact" disabled={!draft.trim()} onClick={add}>确定</button>
        <button type="button" className="icon-btn compact" title="取消新增" onClick={() => { setDraft(""); setAdding(false); }}><X size={14} /></button>
      </div>}
    </div>
  );
}

function DirectionSettings({ directions, onAdd, onRename, onDelete }: {
  directions: Direction[];
  onAdd: (value: string) => Direction | null;
  onRename: (direction: Direction, value: string) => void;
  onDelete: (direction: Direction) => void;
}) {
  const [newDirection, setNewDirection] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const add = () => {
    if (!newDirection.trim()) return;
    if (onAdd(newDirection)) setNewDirection("");
  };
  return (
    <section className="direction-settings">
      <header><SlidersHorizontal size={19} /><div><h3>岗位方向</h3><p>新增方向会同步进入录入和筛选下拉。改名会同步更新已有岗位；使用中的方向不能直接删除。</p></div></header>
      <div className="direction-settings-body">
        <div className="direction-add">
          <input value={newDirection} onChange={(event) => setNewDirection(event.target.value)} placeholder="新增岗位方向" />
          <button className="btn secondary" disabled={!newDirection.trim()} onClick={add}><Plus size={14} /> 新增</button>
        </div>
        <div className="direction-option-list">
          {directions.map((direction) => {
            const value = drafts[direction] ?? direction;
            return (
              <div className="direction-option" key={direction}>
                <input value={value} onChange={(event) => setDrafts((current) => ({ ...current, [direction]: event.target.value }))} />
                <button className="btn secondary compact" disabled={!value.trim() || value.trim() === direction} onClick={() => onRename(direction, value)}><Check size={14} /> 保存</button>
                <button className="icon-btn" title="删除岗位方向" onClick={() => onDelete(direction)}><Trash2 size={14} /></button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Drawer({ title, onClose, wide, children }: { title: string; onClose: () => void; wide?: boolean; children: ReactNode }) {
  return <div className="drawer-backdrop" onMouseDown={onClose}><aside className={`drawer ${wide ? "wide" : ""}`} onMouseDown={(event) => event.stopPropagation()}><header><h2>{title}</h2><button className="icon-btn" title="关闭" onClick={onClose}><X size={18} /></button></header><div className="drawer-body">{children}</div></aside></div>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}

function Select({ value, onChange, options, label }: { value: string; onChange: (value: string) => void; options: readonly string[]; label?: string }) {
  return <label className={label ? "select-wrap filter-select" : "select-wrap"}>{label && <span>{label}</span>}<select value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option}>{option}</option>)}</select></label>;
}

function Metric({ label, value, note, icon, tone }: { label: string; value: number; note: string; icon: ReactNode; tone: string }) {
  return <article className="metric"><div className={`metric-icon ${tone}`}>{icon}</div><span>{label}</span><strong>{value}</strong><small>{note}</small></article>;
}

function Panel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return <section className="panel"><header><h3>{title}</h3>{action}</header>{children}</section>;
}

function Tag({ tone, children }: { tone: string; children: ReactNode }) {
  return <span className={`tag ${tone}`}>{children}</span>;
}

function PriorityMark({ priority }: { priority: Priority }) {
  return <span className={`priority p-${priority.toLowerCase()}`}>{priority}</span>;
}

function Score({ score }: { score: number }) {
  return <span className="score"><i style={{ width: `${score}%` }} /><em>{score}</em></span>;
}

function EmptyLine({ text }: { text: string }) {
  return <div className="empty-line">{text}</div>;
}

function EmptyPanel({ title, text }: { title: string; text: string }) {
  return <div className="empty-panel"><Filter size={24} /><h3>{title}</h3><p>{text}</p></div>;
}

function countKeywords(jobs: Job[]): [string, number][] {
  const counts = new Map<string, number>();
  jobs.flatMap((job) => job.keywords).forEach((keyword) => counts.set(keyword, (counts.get(keyword) ?? 0) + 1));
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

function ChartPanel({ title, caption, children }: { title: string; caption: string; children: ReactNode }) {
  return <section className="chart-panel"><header><h3>{title}</h3><p>{caption}</p></header>{children}</section>;
}

function BarList({ data, colors = false }: { data: { label: string; value: number }[]; colors?: boolean }) {
  const max = Math.max(1, ...data.map((item) => item.value));
  return <div className="bar-list">{data.map((item, index) => <div className="bar-item" key={item.label}><span>{item.label}</span><div><i className={colors ? `color-${index % 4}` : ""} style={{ width: `${Math.max(5, item.value / max * 100)}%` }} /></div><strong>{item.value}</strong></div>)}</div>;
}

function ExportCard({ icon, title, text, actions }: { icon: ReactNode; title: string; text: string; actions: ReactNode }) {
  return <section className="export-card"><div className="export-icon">{icon}</div><h3>{title}</h3><p>{text}</p><footer>{actions}</footer></section>;
}
