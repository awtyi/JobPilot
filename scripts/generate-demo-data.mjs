import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = resolve(root, "md", "test-data", "jobpilot-demo-24-jobs-2026-06-23.json");

const validStages = new Set(["待分析", "待投递", "已投递", "HR沟通", "面试中", "Offer", "已结束"]);
const validPriorities = new Set(["A", "B", "C"]);
const validRounds = new Set(["HR沟通", "一面", "二面", "终面", "其他"]);

const timestamp = (date, time = "10:00") => `${date}T${time}:00+08:00`;
const interviewTime = (date, time) => `${date}T${time}`;
const itemText = (value) => value.split("；").map((item) => `- ${item}`).join("\n");

const sourceUrls = {
  BOSS直聘: (id) => `https://www.zhipin.com/job_detail/jobpilot-${id}.html`,
  猎聘: (id) => `https://www.liepin.com/job/jobpilot-${id}.shtml`,
  脉脉: (id) => `https://maimai.cn/jobs/jobpilot-${id}`,
  拉勾: (id) => `https://www.lagou.com/jobs/jobpilot-${id}.html`,
  智联招聘: (id) => `https://www.zhaopin.com/job/jobpilot-${id}.htm`,
  前程无忧: (id) => `https://jobs.51job.com/jobpilot-${id}.html`,
  LinkedIn: (id) => `https://www.linkedin.com/jobs/view/jobpilot-${id}`,
  官网: (id) => `https://careers.example.com/jobs/jobpilot-${id}`,
  朋友推荐: () => "",
  其他: () => "",
};

function buildInterview(jobId, index, data) {
  if (!validRounds.has(data.round)) throw new Error(`${jobId} 包含无效面试轮次：${data.round}`);
  const createdAt = timestamp(data.date, data.createdTime ?? "18:30");
  return {
    id: `${jobId}-interview-${String(index + 1).padStart(2, "0")}`,
    round: data.round,
    interviewAt: interviewTime(data.date, data.time),
    interviewerRole: data.role,
    questions: data.questions,
    answerSummary: data.answer,
    feedback: data.feedback,
    improvements: data.improvements,
    nextAction: data.nextAction,
    createdAt,
    updatedAt: createdAt,
  };
}

function buildJob(spec, index) {
  const id = `demo-job-${String(index + 1).padStart(2, "0")}`;
  const stageHistory = [{
    id: `${id}-activity-01`,
    type: "created",
    occurredAt: timestamp(spec.created, "09:20"),
    toStage: "待分析",
    note: "新增岗位",
  }];

  let currentStage = "待分析";
  for (const [progressIndex, progress] of (spec.progress ?? []).entries()) {
    if (!validStages.has(progress.to)) throw new Error(`${id} 包含无效阶段：${progress.to}`);
    stageHistory.push({
      id: `${id}-activity-${String(progressIndex + 2).padStart(2, "0")}`,
      type: "stage-change",
      occurredAt: timestamp(progress.date, progress.time ?? "10:30"),
      fromStage: currentStage,
      toStage: progress.to,
      note: progress.note,
    });
    currentStage = progress.to;
  }

  if (currentStage !== spec.stage) {
    throw new Error(`${id} 当前阶段 ${spec.stage} 与时间线最终阶段 ${currentStage} 不一致`);
  }
  if (!validPriorities.has(spec.priority)) throw new Error(`${id} 包含无效优先级`);
  if (spec.stage === "已结束" && !spec.resultReason) throw new Error(`${id} 已结束但没有结束原因`);

  const interviews = (spec.interviews ?? []).map((item, interviewIndex) => buildInterview(id, interviewIndex, item));
  const lastActivity = stageHistory.at(-1).occurredAt;
  const lastInterview = interviews.length ? timestamp(interviews.at(-1).interviewAt.slice(0, 10), "19:00") : "";
  const updatedAt = [lastActivity, lastInterview].filter(Boolean).sort().at(-1);
  const url = spec.jdUrl ?? (sourceUrls[spec.sourceChannel]?.(id) ?? "");
  const jdRawText = [
    `公司名称：${spec.companyName}`,
    `岗位名称：${spec.jobTitle}`,
    `工作地点：${spec.location}`,
    `薪资范围：${spec.salaryRange}`,
    "",
    "岗位职责：",
    itemText(spec.responsibilities),
    "",
    "任职要求：",
    itemText(spec.requirements),
  ].join("\n");

  return {
    id,
    companyName: spec.companyName,
    jobTitle: spec.jobTitle,
    jobDirection: spec.jobDirection,
    jdUrl: url,
    jdRawText,
    location: spec.location,
    salaryRange: spec.salaryRange,
    sourceChannel: spec.sourceChannel,
    stage: spec.stage,
    priority: spec.priority,
    matchScore: spec.matchScore,
    matchSuggestedScore: spec.matchScore,
    matchDimensions: [],
    dataCompletenessScore: 100,
    parseEvidence: [
      { field: "companyName", label: "公司名称", value: spec.companyName, confidence: 0.98, source: `公司名称：${spec.companyName}` },
      { field: "jobTitle", label: "岗位名称", value: spec.jobTitle, confidence: 0.98, source: `岗位名称：${spec.jobTitle}` },
      { field: "location", label: "工作地点", value: spec.location, confidence: 0.95, source: `工作地点：${spec.location}` },
      { field: "salaryRange", label: "薪资范围", value: spec.salaryRange, confidence: 0.92, source: `薪资范围：${spec.salaryRange}` },
    ],
    responsibilities: itemText(spec.responsibilities),
    requirements: itemText(spec.requirements),
    keywords: spec.keywords,
    nextAction: spec.nextAction,
    nextFollowUpAt: spec.nextFollowUpAt,
    notes: spec.notes,
    resultReason: spec.resultReason ?? "",
    stageHistory,
    interviews,
    createdAt: timestamp(spec.created, "09:20"),
    updatedAt,
  };
}

const jobs = [
  {
    companyName: "智舟科技", jobTitle: "AI Agent 产品经理", jobDirection: "AI产品经理",
    location: "武汉·光谷", salaryRange: "20k-28k·14薪", sourceChannel: "BOSS直聘",
    stage: "面试中", priority: "A", matchScore: 91, created: "2026-06-03",
    responsibilities: "负责企业级 Agent 产品规划与版本路线；推动知识库问答、任务编排和工具调用能力落地；协同算法与交付团队完成客户验证",
    requirements: "3年以上 ToB 产品经验；熟悉 Agent、RAG、Prompt 和 API；具备从需求分析到上线复盘的完整经验",
    keywords: ["Agent", "RAG", "Prompt", "知识库", "API", "ToB", "产品规划"],
    nextAction: "准备二面：补充 Agent 工作流评测和失败兜底案例", nextFollowUpAt: "2026-06-23",
    notes: "业务方向匹配度高。一面重点关注复杂需求拆解、模型效果评估和跨团队协作。",
    progress: [
      { to: "待投递", date: "2026-06-05", note: "完成岗位分析，准备定制简历" },
      { to: "已投递", date: "2026-06-07", note: "通过 BOSS 发送定制简历" },
      { to: "HR沟通", date: "2026-06-12", note: "HR 电话沟通工作经历和到岗时间" },
      { to: "面试中", date: "2026-06-18", note: "通过一面，等待业务负责人二面" },
    ],
    interviews: [
      {
        round: "HR沟通", date: "2026-06-12", time: "15:30", role: "招聘 HR",
        questions: "当前求职方向是什么？为什么关注 Agent 产品？到岗周期多久？",
        answer: "说明目标方向为企业级 AI 产品，结合知识库和工作流项目介绍相关经验，并确认两周内可到岗。",
        feedback: "岗位预算和方向基本匹配，HR 建议一面重点准备 Agent 项目和客户需求处理案例。",
        improvements: "把项目成果补充为可量化指标，并准备一个效果不达预期时的处理案例。",
        nextAction: "整理 Agent 项目 STAR 案例",
      },
      {
        round: "一面", date: "2026-06-19", time: "14:00", role: "AI 产品负责人",
        questions: "如何定义 Agent 成功率？RAG 效果不稳定如何定位？如何平衡通用能力与客户定制？",
        answer: "从任务完成率、人工接管率和关键节点成功率拆指标；RAG 按召回、排序、生成三层定位；产品层用标准工作流加配置项控制定制范围。",
        feedback: "业务理解较好，追问了评测集构建和上线后的反馈闭环。",
        improvements: "补充离线评测集样本来源、灰度发布和线上监控方案。",
        nextAction: "准备二面材料并复盘评测指标",
      },
    ],
  },
  {
    companyName: "云启数科", jobTitle: "企业知识库产品经理", jobDirection: "AI产品经理",
    location: "杭州·支持远程", salaryRange: "22k-30k·13薪", sourceChannel: "脉脉",
    stage: "HR沟通", priority: "A", matchScore: 88, created: "2026-06-06",
    responsibilities: "规划企业知识库检索与问答能力；设计文档解析、权限和知识更新流程；跟进重点客户 PoC 与交付反馈",
    requirements: "熟悉 RAG、向量数据库和 Embedding；有企业 SaaS 或知识管理经验；具备数据分析和项目管理能力",
    keywords: ["RAG", "向量数据库", "Embedding", "检索", "知识库", "SaaS", "数据分析"],
    nextAction: "回复 HR 期望薪资并确认远程办公频次", nextFollowUpAt: "2026-06-24",
    notes: "产品方向高度匹配，需确认每月到杭州现场的频率。",
    progress: [
      { to: "待投递", date: "2026-06-07", note: "补充知识库项目案例" },
      { to: "已投递", date: "2026-06-08", note: "通过脉脉内推投递" },
      { to: "HR沟通", date: "2026-06-20", note: "收到 HR 初步沟通邀请" },
    ],
    interviews: [{
      round: "HR沟通", date: "2026-06-20", time: "17:30", role: "HRBP",
      questions: "是否接受杭州办公？薪资期望是多少？知识库项目中承担什么角色？",
      answer: "可以接受阶段性到场，期望 25k-30k；介绍了从需求调研到评测验收的完整职责。",
      feedback: "经验方向符合，HR 需要与业务确认远程安排。",
      improvements: "准备知识库项目的客户价值、采用率和准确率指标。",
      nextAction: "补充薪资与办公方式说明",
    }],
  },
  {
    companyName: "启明工业智能", jobTitle: "工业 AI 解决方案产品经理", jobDirection: "解决方案产品",
    location: "武汉·经开区", salaryRange: "18k-26k·14薪", sourceChannel: "猎聘",
    stage: "已投递", priority: "A", matchScore: 84, created: "2026-06-08",
    responsibilities: "面向制造客户开展需求调研和方案设计；结合视觉检测与知识助手设计解决方案；推动售前、研发和交付协同",
    requirements: "有制造业或工业软件经验；具备 ToB 方案设计与项目管理能力；了解机器学习和数据治理",
    keywords: ["ToB", "机器学习", "数据治理", "项目管理", "需求分析", "自动化"],
    nextAction: "三天内未反馈则联系猎头确认简历进度", nextFollowUpAt: "2026-06-25",
    notes: "本地岗位，业务场景明确。需要进一步确认售前出差比例。",
    progress: [
      { to: "待投递", date: "2026-06-09", note: "完成制造业案例梳理" },
      { to: "已投递", date: "2026-06-15", note: "猎头协助提交简历" },
    ],
  },
  {
    companyName: "星图协同", jobTitle: "数字员工产品经理", jobDirection: "数字员工产品",
    location: "深圳·南山区", salaryRange: "25k-35k·13薪", sourceChannel: "BOSS直聘",
    stage: "待投递", priority: "A", matchScore: 86, created: "2026-06-19",
    responsibilities: "规划数字员工和流程自动化产品；沉淀财务、人事和客服场景模板；设计工作流编排和运营指标",
    requirements: "熟悉工作流、低代码或 RPA；具备企业服务产品经验；能独立完成原型、PRD 和项目推进",
    keywords: ["工作流", "低代码", "自动化", "ToB", "原型", "PRD", "项目管理"],
    nextAction: "根据财务数字员工场景调整项目经历后投递", nextFollowUpAt: "2026-06-23",
    notes: "岗位与数字员工经验匹配，深圳工作地点是主要决策因素。",
    progress: [{ to: "待投递", date: "2026-06-20", note: "完成岗位初步分析，进入简历定制" }],
  },
  {
    companyName: "拾光云服", jobTitle: "SaaS 产品经理", jobDirection: "产品经理",
    location: "武汉·武昌区", salaryRange: "16k-22k·13薪", sourceChannel: "拉勾",
    stage: "待分析", priority: "B", matchScore: 72, created: "2026-06-22",
    responsibilities: "负责客户成功平台的需求规划；优化工单、续费和客户健康度功能；跟踪产品使用数据",
    requirements: "2年以上 SaaS 产品经验；熟悉 CRM 或客户成功业务；具备数据分析和用户研究能力",
    keywords: ["SaaS", "CRM", "数据分析", "用户研究", "产品规划"],
    nextAction: "确认产品服务的客户规模和岗位汇报关系", nextFollowUpAt: "2026-06-26",
    notes: "岗位稳定但 AI 相关度较低，作为本地保底机会继续评估。",
  },
  {
    companyName: "知行教育", jobTitle: "AI 学习产品经理", jobDirection: "AI产品经理",
    location: "北京·海淀区", salaryRange: "24k-34k·14薪", sourceChannel: "官网",
    stage: "已投递", priority: "A", matchScore: 89, created: "2026-06-10",
    responsibilities: "负责 AI 学习助手和智能练习产品；设计个性化学习路径与反馈机制；协同教研和算法团队完成效果评估",
    requirements: "有教育产品或 AI 应用经验；熟悉 LLM、Prompt 和评测；具备用户研究与 A/B 测试能力",
    keywords: ["LLM", "Prompt", "评测", "用户研究", "A/B测试", "数据分析"],
    nextAction: "补充学习效果指标案例并关注官网投递状态", nextFollowUpAt: "2026-06-24",
    notes: "产品创新空间较大，需确认是否接受北京长期办公。",
    progress: [
      { to: "待投递", date: "2026-06-11", note: "完成教育场景项目经历调整" },
      { to: "已投递", date: "2026-06-14", note: "通过官网完成投递" },
    ],
  },
  {
    companyName: "微澜数据", jobTitle: "数据产品经理", jobDirection: "产品经理",
    location: "上海·杨浦区", salaryRange: "24k-32k·13薪", sourceChannel: "猎聘",
    stage: "HR沟通", priority: "B", matchScore: 78, created: "2026-06-04",
    responsibilities: "规划企业指标平台和数据资产目录；推进数据口径治理；设计 BI 看板和自助分析能力",
    requirements: "熟悉 SQL、BI 和数据治理；有数据中台或指标平台经验；具备跨部门项目推动能力",
    keywords: ["SQL", "BI", "数据治理", "数据分析", "Tableau", "项目管理"],
    nextAction: "确认业务一面时间并准备指标体系案例", nextFollowUpAt: "2026-06-23",
    notes: "技术匹配度一般，但数据治理和分析经验可迁移。",
    progress: [
      { to: "待投递", date: "2026-06-05", note: "调整数据分析相关经历" },
      { to: "已投递", date: "2026-06-07", note: "猎头提交简历" },
      { to: "HR沟通", date: "2026-06-21", note: "HR 完成基础信息沟通" },
    ],
    interviews: [{
      round: "HR沟通", date: "2026-06-21", time: "11:00", role: "招聘经理",
      questions: "为什么从业务产品转向数据产品？SQL 熟练度如何？是否接受上海办公？",
      answer: "说明过往工作持续涉及指标体系和分析平台，SQL 可完成常见查询和验证，工作地点需要综合评估。",
      feedback: "业务经验可迁移，业务负责人会重点考察数据口径治理和产品抽象能力。",
      improvements: "复习指标体系设计和数据质量管理案例。",
      nextAction: "等待一面安排",
    }],
  },
  {
    companyName: "远望软件", jobTitle: "企业解决方案产品经理", jobDirection: "解决方案产品",
    location: "武汉·洪山区", salaryRange: "18k-24k·14薪", sourceChannel: "朋友推荐",
    stage: "面试中", priority: "A", matchScore: 85, created: "2026-05-28",
    responsibilities: "负责重点客户需求调研与解决方案设计；输出售前材料和产品能力地图；协调产品、研发和交付推进项目",
    requirements: "具备企业软件和售前方案经验；能够处理复杂客户需求；具备良好的表达与项目管理能力",
    keywords: ["ToB", "需求分析", "项目管理", "产品规划", "SaaS"],
    nextAction: "准备终面：梳理项目取舍和客户冲突处理案例", nextFollowUpAt: "2026-06-24",
    notes: "朋友内推，团队反馈积极。终面可能重点考察管理潜力和客户沟通。",
    progress: [
      { to: "待投递", date: "2026-05-30", note: "完成内推材料准备" },
      { to: "已投递", date: "2026-06-01", note: "朋友完成内部推荐" },
      { to: "HR沟通", date: "2026-06-05", note: "HR 沟通薪资和面试流程" },
      { to: "面试中", date: "2026-06-10", note: "进入业务面试阶段" },
    ],
    interviews: [
      {
        round: "一面", date: "2026-06-10", time: "10:00", role: "解决方案负责人",
        questions: "如何处理客户需求与标准产品冲突？如何评估定制需求？",
        answer: "用客户价值、复用范围、交付成本和长期维护成本建立评估矩阵，并区分配置、扩展和定制。",
        feedback: "方法清晰，希望补充一个真实冲突案例。",
        improvements: "把需求分级方法与具体项目结果对应起来。",
        nextAction: "准备二面案例",
      },
      {
        round: "二面", date: "2026-06-18", time: "15:00", role: "产品总监",
        questions: "如何搭建解决方案产品体系？如何让售前和产品形成反馈闭环？",
        answer: "按行业场景、标准能力和交付组件沉淀方案资产，并通过商机复盘和需求池治理形成闭环。",
        feedback: "整体匹配，下一轮会关注业务判断和团队协作。",
        improvements: "准备跨部门冲突、失败项目和复盘案例。",
        nextAction: "等待终面通知",
      },
    ],
  },
  {
    companyName: "城市脉络", jobTitle: "政务数字化产品经理", jobDirection: "解决方案产品",
    location: "武汉·江汉区", salaryRange: "16k-21k·13薪", sourceChannel: "智联招聘",
    stage: "已投递", priority: "B", matchScore: 74, created: "2026-06-12",
    responsibilities: "负责政务服务平台需求分析和流程设计；协同实施团队完成项目交付；沉淀标准产品能力",
    requirements: "有政务或 ToB 项目经验；熟悉流程梳理、原型和 PRD；能够接受省内短期出差",
    keywords: ["ToB", "需求分析", "原型", "PRD", "项目管理"],
    nextAction: "下周一确认简历筛选结果", nextFollowUpAt: "2026-06-27",
    notes: "本地机会，业务稳定；需进一步确认出差频率。",
    progress: [
      { to: "待投递", date: "2026-06-13", note: "完成政务项目经历整理" },
      { to: "已投递", date: "2026-06-16", note: "通过智联招聘投递" },
    ],
  },
  {
    companyName: "智联工坊", jobTitle: "低代码平台产品经理", jobDirection: "数字员工产品",
    location: "广州·天河区", salaryRange: "20k-28k·14薪", sourceChannel: "BOSS直聘",
    stage: "待投递", priority: "B", matchScore: 76, created: "2026-06-18",
    responsibilities: "负责低代码表单、流程和权限能力规划；优化搭建体验和模板市场；分析用户行为并推动版本迭代",
    requirements: "有低代码、工作流或企业应用经验；熟悉用户研究和数据分析；具备原型与 PRD 能力",
    keywords: ["低代码", "工作流", "用户研究", "数据分析", "原型", "PRD"],
    nextAction: "体验竞品后补充低代码平台对比分析", nextFollowUpAt: "2026-06-28",
    notes: "产品方向相关，但需要补足低代码平台深度。",
    progress: [{ to: "待投递", date: "2026-06-20", note: "开始准备低代码竞品分析" }],
  },
  {
    companyName: "云帆企服", jobTitle: "CRM 产品经理", jobDirection: "产品经理",
    location: "杭州·滨江区", salaryRange: "20k-26k·13薪", sourceChannel: "拉勾",
    stage: "待分析", priority: "B", matchScore: 70, created: "2026-06-21",
    responsibilities: "负责销售过程、客户管理和线索分配模块；分析销售团队使用反馈；规划产品版本",
    requirements: "熟悉 CRM 或销售管理业务；有 SaaS 产品经验；具备需求分析和数据分析能力",
    keywords: ["CRM", "SaaS", "需求分析", "数据分析", "产品规划"],
    nextAction: "研究产品客户类型后决定是否投递", nextFollowUpAt: "",
    notes: "业务成熟但创新性一般，暂不设跟进日期。",
  },
  {
    companyName: "元境交互", jobTitle: "AI 应用产品经理", jobDirection: "AI产品经理",
    location: "上海·徐汇区", salaryRange: "28k-38k·15薪", sourceChannel: "脉脉",
    stage: "面试中", priority: "A", matchScore: 92, created: "2026-05-25",
    responsibilities: "负责多模态内容创作产品规划；设计模型能力评测和用户反馈闭环；推动从原型验证到商业化上线",
    requirements: "熟悉 LLM、多模态和 Prompt；具备 AI 应用从 0 到 1 经验；有增长或商业化经验优先",
    keywords: ["LLM", "多模态", "Prompt", "评测", "商业化", "增长", "A/B测试"],
    nextAction: "完成终面作业：设计 AI 内容创作产品的北极星指标", nextFollowUpAt: "2026-06-25",
    notes: "当前最匹配的机会之一，面试节奏快，需重点准备商业化判断。",
    progress: [
      { to: "待投递", date: "2026-05-27", note: "完成 AI 应用项目材料" },
      { to: "已投递", date: "2026-05-29", note: "通过脉脉内推投递" },
      { to: "HR沟通", date: "2026-06-05", note: "完成 HR 初步沟通" },
      { to: "面试中", date: "2026-06-10", note: "进入多轮业务面试" },
    ],
    interviews: [
      {
        round: "HR沟通", date: "2026-06-05", time: "16:00", role: "招聘 HR",
        questions: "AI 产品经历、薪资期望、为什么考虑上海机会？",
        answer: "介绍 AI 产品项目和从需求到上线的职责，说明上海机会需结合发展空间评估。",
        feedback: "基本条件符合，业务面会关注 AI 产品理解。",
        improvements: "准备 AI 应用产品的方法论和失败案例。",
        nextAction: "准备一面",
      },
      {
        round: "一面", date: "2026-06-10", time: "19:00", role: "产品负责人",
        questions: "如何判断模型能力适合什么场景？如何设计用户反馈闭环？",
        answer: "从任务价值、容错率、可评测性和人工成本判断场景，建立显式反馈与行为数据结合的闭环。",
        feedback: "产品判断清晰，建议进一步量化模型价值。",
        improvements: "准备模型成本、响应时间和用户留存的联合指标。",
        nextAction: "准备二面",
      },
      {
        round: "二面", date: "2026-06-18", time: "14:30", role: "业务总经理",
        questions: "AI 内容产品如何商业化？如何建立竞争壁垒？",
        answer: "从高频专业工作流切入，以模板、私有知识和协作资产形成迁移成本，并通过席位与用量组合收费。",
        feedback: "方向基本认可，要求提交一份指标设计作业。",
        improvements: "把商业模式与冷启动阶段的核心指标拆开。",
        nextAction: "提交终面作业",
      },
    ],
  },
  {
    companyName: "栖木零售", jobTitle: "零售数字化产品经理", jobDirection: "产品经理",
    location: "深圳·福田区", salaryRange: "22k-30k·13薪", sourceChannel: "猎聘",
    stage: "已投递", priority: "B", matchScore: 77, created: "2026-06-09",
    responsibilities: "规划门店运营和会员营销产品；推动 POS、库存与会员数据打通；通过数据分析优化活动效果",
    requirements: "有零售、电商或会员产品经验；熟悉 CRM、数据分析和增长；能推动跨系统项目",
    keywords: ["CRM", "数据分析", "增长", "项目管理", "商业化"],
    nextAction: "整理会员增长案例后联系猎头补充材料", nextFollowUpAt: "2026-06-26",
    notes: "行业经验不足，但 CRM 和数据分析能力可迁移。",
    progress: [
      { to: "待投递", date: "2026-06-10", note: "调整会员增长项目描述" },
      { to: "已投递", date: "2026-06-17", note: "猎头完成简历推荐" },
    ],
  },
  {
    companyName: "北辰企服", jobTitle: "商业化产品经理", jobDirection: "产品经理",
    location: "北京·朝阳区", salaryRange: "30k-40k·14薪", sourceChannel: "LinkedIn",
    stage: "HR沟通", priority: "B", matchScore: 81, created: "2026-06-02",
    responsibilities: "负责企业服务产品定价、套餐和付费转化；设计商业化实验；协同销售与客户成功优化收入结构",
    requirements: "有 SaaS 商业化或增长经验；熟悉 A/B 测试和数据分析；具备良好的业务建模能力",
    keywords: ["SaaS", "商业化", "增长", "A/B测试", "数据分析"],
    nextAction: "确认业务面时间并准备定价策略案例", nextFollowUpAt: "2026-06-24",
    notes: "薪资和平台有吸引力，商业化经验需要进一步结构化表达。",
    progress: [
      { to: "待投递", date: "2026-06-03", note: "补充商业化项目指标" },
      { to: "已投递", date: "2026-06-05", note: "通过 LinkedIn 投递" },
      { to: "HR沟通", date: "2026-06-19", note: "HR 联系确认履历和薪资" },
    ],
    interviews: [{
      round: "HR沟通", date: "2026-06-19", time: "13:30", role: "招聘 HR",
      questions: "商业化项目中最核心的指标是什么？期望薪资和到岗时间？",
      answer: "按产品阶段区分付费转化、续费和客单价，并说明当前薪资期望与到岗时间。",
      feedback: "业务负责人希望重点了解定价实验和销售协同经验。",
      improvements: "补充定价调整前后的转化变化和客户分层方法。",
      nextAction: "准备业务一面",
    }],
  },
  {
    companyName: "光谷智造", jobTitle: "工业软件产品经理", jobDirection: "产品经理",
    location: "武汉·光谷", salaryRange: "19k-25k·14薪", sourceChannel: "官网",
    stage: "Offer", priority: "A", matchScore: 87, created: "2026-05-18",
    responsibilities: "负责设备运维和生产协同产品；规划数据看板、工单和知识库能力；推动重点制造客户上线",
    requirements: "有工业软件、ERP 或 ToB 产品经验；熟悉项目交付和数据分析；具备客户沟通能力",
    keywords: ["ERP", "ToB", "数据分析", "知识库", "项目管理", "BI"],
    nextAction: "核对 Offer 薪资结构、试用期和年度奖金", nextFollowUpAt: "2026-06-23",
    notes: "本地稳定机会，业务与过往经验匹配。需要综合比较成长空间和薪酬。",
    progress: [
      { to: "待投递", date: "2026-05-20", note: "完成工业软件项目梳理" },
      { to: "已投递", date: "2026-05-22", note: "官网完成投递" },
      { to: "HR沟通", date: "2026-05-27", note: "完成 HR 初步沟通" },
      { to: "面试中", date: "2026-06-02", note: "进入业务面试流程" },
      { to: "Offer", date: "2026-06-20", note: "收到口头 Offer，等待正式邮件" },
    ],
    interviews: [
      {
        round: "HR沟通", date: "2026-05-27", time: "10:30", role: "招聘 HR",
        questions: "工业软件经历、薪资期望、离职原因和到岗时间。",
        answer: "介绍工业项目职责，说明希望在产品规划和 AI 结合方向有更大发展。",
        feedback: "履历符合，进入业务面。",
        improvements: "准备工业客户价值和项目推进案例。",
        nextAction: "准备一面",
      },
      {
        round: "一面", date: "2026-06-03", time: "14:00", role: "产品负责人",
        questions: "如何处理设备数据不完整？如何设计工单闭环？",
        answer: "先建立数据质量分级和人工补录机制，再围绕发现、派发、处理、验收和复盘设计工单状态。",
        feedback: "业务理解较好，建议补充上线后的运营指标。",
        improvements: "准备工单及时率、关闭率和重复问题占比等指标。",
        nextAction: "准备二面",
      },
      {
        round: "二面", date: "2026-06-10", time: "15:30", role: "研发与交付负责人",
        questions: "如何控制客户定制？需求变化如何管理？",
        answer: "建立标准能力、行业配置和项目定制三级边界，并使用变更评审和版本基线控制范围。",
        feedback: "协作经验符合岗位需要。",
        improvements: "补充一个项目延期后的复盘案例。",
        nextAction: "等待终面",
      },
      {
        round: "终面", date: "2026-06-17", time: "16:00", role: "事业部负责人",
        questions: "未来三年职业规划？为什么选择工业软件？",
        answer: "希望在企业级产品和 AI 应用结合方向形成长期积累，工业场景有明确业务价值和落地空间。",
        feedback: "整体认可，进入 Offer 审批。",
        improvements: "确认岗位资源、团队配置和绩效目标。",
        nextAction: "等待正式 Offer",
      },
    ],
  },
  {
    companyName: "轻舟自动化", jobTitle: "智能工作流产品经理", jobDirection: "数字员工产品",
    location: "远程", salaryRange: "18k-26k·13薪", sourceChannel: "朋友推荐",
    stage: "待投递", priority: "A", matchScore: 83, created: "2026-06-17",
    responsibilities: "负责智能工作流编排和自动化节点设计；沉淀业务模板；优化搭建、调试和运行监控体验",
    requirements: "熟悉工作流、API 和自动化工具；有低代码或数字员工产品经验；具备复杂流程抽象能力",
    keywords: ["工作流", "API", "自动化", "低代码", "数字员工产品"],
    nextAction: "请推荐人确认团队阶段和岗位 HC 后提交简历", nextFollowUpAt: "2026-06-25",
    notes: "远程方式有吸引力，需确认创业团队稳定性和社保方案。",
    progress: [{ to: "待投递", date: "2026-06-18", note: "与推荐人沟通岗位背景" }],
  },
  {
    companyName: "智识方舟", jobTitle: "RAG 产品经理", jobDirection: "AI产品经理",
    location: "南京·建邺区", salaryRange: "22k-30k·14薪", sourceChannel: "BOSS直聘",
    stage: "已投递", priority: "A", matchScore: 90, created: "2026-06-13",
    responsibilities: "负责企业 RAG 平台的检索、评测和知识运营能力；设计数据接入与权限方案；推动产品标准化",
    requirements: "熟悉 RAG、检索、Embedding 和向量数据库；有企业知识库经验；具备评测和数据治理能力",
    keywords: ["RAG", "检索", "Embedding", "向量数据库", "评测", "数据治理", "知识库"],
    nextAction: "主动联系招聘方，补充 RAG 评测方案", nextFollowUpAt: "2026-06-23",
    notes: "技术方向最匹配的岗位之一，重点突出评测和知识运营经验。",
    progress: [
      { to: "待投递", date: "2026-06-14", note: "完成 RAG 项目材料调整" },
      { to: "已投递", date: "2026-06-18", note: "通过 BOSS 完成投递" },
    ],
  },
  {
    companyName: "经纬能源", jobTitle: "能源数字化解决方案产品经理", jobDirection: "解决方案产品",
    location: "成都·高新区", salaryRange: "18k-25k·13薪", sourceChannel: "前程无忧",
    stage: "待分析", priority: "C", matchScore: 68, created: "2026-06-20",
    responsibilities: "负责能源管理和设备监控解决方案；参与客户调研、招投标与项目交付；沉淀行业方案",
    requirements: "有能源、工业或物联网项目经验；具备解决方案和项目管理能力；可接受较高频出差",
    keywords: ["项目管理", "ToB", "数据分析", "自动化"],
    nextAction: "确认出差比例和产品岗位与售前岗位的边界", nextFollowUpAt: "2026-06-30",
    notes: "方向可迁移，但出差频率可能不符合预期。",
  },
  {
    companyName: "研途科技", jobTitle: "AI 评测产品经理", jobDirection: "AI产品经理",
    location: "北京·海淀区", salaryRange: "26k-36k·14薪", sourceChannel: "脉脉",
    stage: "HR沟通", priority: "A", matchScore: 88, created: "2026-06-01",
    responsibilities: "建设大模型应用评测平台；设计数据集、指标和人工评审流程；推动评测结果进入产品迭代",
    requirements: "理解 LLM、RAG 和 Prompt；熟悉评测、数据标注或实验平台；具备数据分析能力",
    keywords: ["LLM", "RAG", "Prompt", "评测", "数据标注", "数据分析"],
    nextAction: "发送评测项目说明并确认一面时间", nextFollowUpAt: "2026-06-25",
    notes: "岗位专业度较高，需准备评测指标体系和数据集构建细节。",
    progress: [
      { to: "待投递", date: "2026-06-02", note: "整理 AI 评测相关经历" },
      { to: "已投递", date: "2026-06-04", note: "通过脉脉内推投递" },
      { to: "HR沟通", date: "2026-06-21", note: "HR 邀请补充项目材料" },
    ],
    interviews: [{
      round: "HR沟通", date: "2026-06-21", time: "16:30", role: "招聘 HR",
      questions: "是否做过评测平台？对北京办公和薪资的预期？",
      answer: "介绍了 RAG 评测与人工抽检经验，并说明需要综合考虑办公地点。",
      feedback: "业务希望先查看项目材料，再决定一面安排。",
      improvements: "把评测流程画成图，并补充指标定义和样本规模。",
      nextAction: "发送项目说明",
    }],
  },
  {
    companyName: "晨曦医疗", jobTitle: "医疗 SaaS 产品经理", jobDirection: "产品经理",
    location: "苏州·工业园区", salaryRange: "20k-27k·13薪", sourceChannel: "猎聘",
    stage: "已结束", priority: "C", matchScore: 64, created: "2026-05-20",
    responsibilities: "负责医院运营管理 SaaS 产品；对接院方需求并推动实施；优化数据报表和权限体系",
    requirements: "有医疗信息化经验；熟悉 SaaS、项目交付和数据分析；能接受驻场沟通",
    keywords: ["SaaS", "数据分析", "项目管理", "BI"],
    nextAction: "", nextFollowUpAt: "",
    notes: "完成 HR 沟通后确认岗位要求较强医疗行业背景，暂不继续。",
    resultReason: "医疗行业经验要求较高，与当前目标方向不匹配",
    progress: [
      { to: "待投递", date: "2026-05-22", note: "完成岗位分析" },
      { to: "已投递", date: "2026-05-25", note: "猎头提交简历" },
      { to: "HR沟通", date: "2026-05-30", note: "完成 HR 电话沟通" },
      { to: "已结束", date: "2026-06-03", note: "结束岗位：医疗行业经验要求较高，与当前目标方向不匹配" },
    ],
    interviews: [{
      round: "HR沟通", date: "2026-05-30", time: "11:30", role: "招聘 HR",
      questions: "是否有医院信息化项目经验？能否长期驻场？",
      answer: "说明有 ToB 交付经验，但没有直接医疗项目背景，驻场频率需要评估。",
      feedback: "业务更偏好有 HIS 或医院运营系统经验的候选人。",
      improvements: "后续筛选行业壁垒高的岗位时，提前确认硬性背景要求。",
      nextAction: "结束跟进",
    }],
  },
  {
    companyName: "智云办公", jobTitle: "协同办公产品经理", jobDirection: "产品经理",
    location: "武汉·汉口", salaryRange: "14k-18k·13薪", sourceChannel: "BOSS直聘",
    stage: "已结束", priority: "B", matchScore: 69, created: "2026-05-24",
    responsibilities: "负责审批、日程和组织协同模块；跟踪用户反馈；输出产品需求和版本计划",
    requirements: "有协同办公或企业服务产品经验；熟悉原型、PRD 和敏捷开发；沟通能力良好",
    keywords: ["SaaS", "原型", "PRD", "敏捷开发", "需求分析"],
    nextAction: "", nextFollowUpAt: "",
    notes: "岗位内容尚可，但薪资上限明显低于当前期望。",
    resultReason: "薪资区间低于个人最低期望",
    progress: [
      { to: "待投递", date: "2026-05-25", note: "完成基础分析" },
      { to: "已投递", date: "2026-05-27", note: "通过 BOSS 投递" },
      { to: "已结束", date: "2026-06-02", note: "结束岗位：薪资区间低于个人最低期望" },
    ],
  },
  {
    companyName: "海岳科技", jobTitle: "海外增长产品经理", jobDirection: "产品经理",
    location: "深圳·宝安区", salaryRange: "25k-35k·14薪", sourceChannel: "LinkedIn",
    stage: "已结束", priority: "C", matchScore: 66, created: "2026-05-29",
    responsibilities: "负责海外 SaaS 产品增长和用户转化；设计实验与运营工具；协同市场团队拓展重点区域",
    requirements: "有海外产品和增长经验；英语可作为工作语言；能够接受长期海外出差",
    keywords: ["SaaS", "增长", "A/B测试", "商业化", "数据分析"],
    nextAction: "", nextFollowUpAt: "",
    notes: "产品和薪资有吸引力，但长期海外出差不符合当前安排。",
    resultReason: "岗位要求长期海外出差，与个人当前安排冲突",
    progress: [
      { to: "待投递", date: "2026-05-30", note: "完成英文项目经历调整" },
      { to: "已投递", date: "2026-06-01", note: "通过 LinkedIn 投递" },
      { to: "HR沟通", date: "2026-06-04", note: "HR 沟通海外出差安排" },
      { to: "已结束", date: "2026-06-06", note: "结束岗位：岗位要求长期海外出差，与个人当前安排冲突" },
    ],
    interviews: [{
      round: "HR沟通", date: "2026-06-04", time: "18:00", role: "区域招聘 HR",
      questions: "英语使用情况？是否接受每季度两个月海外出差？",
      answer: "说明可以进行英文文档和会议沟通，但当前无法接受长期高频海外出差。",
      feedback: "出差是硬性要求，双方决定不继续流程。",
      improvements: "投递前优先确认出差、驻场和办公地点等硬约束。",
      nextAction: "结束跟进",
    }],
  },
  {
    companyName: "观澜数据", jobTitle: "BI 产品经理", jobDirection: "产品经理",
    location: "杭州·西湖区", salaryRange: "20k-28k·13薪", sourceChannel: "官网",
    stage: "待分析", priority: "B", matchScore: 75, created: "2026-06-22",
    responsibilities: "负责自助 BI、数据看板和指标管理产品；调研业务分析场景；推动产品易用性优化",
    requirements: "熟悉 BI、SQL 和数据分析；有 Tableau、Power BI 或指标平台经验；具备用户研究能力",
    keywords: ["BI", "SQL", "数据分析", "Tableau", "Power BI", "用户研究"],
    nextAction: "体验公开产品 Demo 后评估匹配度", nextFollowUpAt: "2026-06-29",
    notes: "岗位技能可迁移，但与 AI 方向距离较远。",
  },
  {
    companyName: "灵犀机器人", jobTitle: "机器人应用产品经理", jobDirection: "AI产品经理",
    location: "上海·浦东新区", salaryRange: "28k-40k·14薪", sourceChannel: "朋友推荐",
    stage: "待投递", priority: "A", matchScore: 86, created: "2026-06-15",
    responsibilities: "负责服务机器人应用场景和任务流程设计；协同算法、硬件和交付团队验证方案；建立试点效果指标",
    requirements: "有 AI 应用或智能硬件产品经验；熟悉多模态、工作流和项目管理；具备现场调研能力",
    keywords: ["多模态", "工作流", "机器学习", "项目管理", "用户研究"],
    nextAction: "请推荐人评估简历，并补充软硬件协同项目案例", nextFollowUpAt: "2026-06-24",
    notes: "方向有吸引力，缺少机器人行业经验，需要突出场景设计和跨团队协作。",
    progress: [{ to: "待投递", date: "2026-06-17", note: "与推荐人完成岗位信息沟通" }],
  },
].map(buildJob);

const ids = new Set(jobs.map((job) => job.id));
if (ids.size !== jobs.length) throw new Error("岗位 ID 存在重复");
if (jobs.length < 20) throw new Error("测试数据少于 20 条");

const stageSummary = Object.fromEntries([...validStages].map((stage) => [stage, jobs.filter((job) => job.stage === stage).length]));
const payload = {
  version: "0.1.0",
  exportedAt: "2026-06-23T10:30:00+08:00",
  description: "JobPilot 初赛演示测试数据：24 条虚构且脱敏的岗位记录",
  stageSummary,
  jobs,
};

mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ output, count: jobs.length, stageSummary }, null, 2));

