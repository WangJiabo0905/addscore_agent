export const POLICY_META = {
  cutoffDate: '2024-08-31',
  academicScoreCap: 15,
  comprehensiveScoreCap: 5,
  totalScoreFormula:
    '综合成绩 = 学业综合成绩×80% + 学术专长成绩（≤15）+ 综合表现成绩（≤5）',
  retakePassingScore: 60,
} as const;

export type CatalogCategorySlug =
  | 'paper'
  | 'patent'
  | 'competition'
  | 'innovation'
  | 'international_internship'
  | 'volunteer'
  | 'honor'
  | 'social_work'
  | 'sports'
  | 'special_academic';

export type CatalogFlag =
  | 'requiresFirstAuthor'
  | 'requiresFirstInstitution'
  | 'requiresTeam'
  | 'requiresPublicDefense'
  | 'requiresPublicity'
  | 'requiresProfessorEndorsement'
  | 'limitsCount'
  | 'limitedQuota'
  | 'scoreCap'
  | 'breaksThreshold'
  | 'nscDoubleA'
  | 'singleSubmissionPerContest';

export interface CatalogBadge {
  id: string;
  label: string;
  tone:
    | 'primary'
    | 'success'
    | 'warning'
    | 'danger'
    | 'neutral'
    | 'accent'
    | 'muted';
}

export interface CatalogCategoryPolicy {
  slug: CatalogCategorySlug;
  title: string;
  description: string;
  order: number;
  defaultBadge?: CatalogBadge;
  policyNotes?: string[];
}

export interface CatalogItemPolicy {
  slug: string;
  category: CatalogCategorySlug;
  title: string;
  shortDescription: string;
  maxScore: number | null;
  scoreNote?: string;
  baselineScore?: number;
  badges: CatalogBadge[];
  flags: CatalogFlag[];
  proofTips: string[];
  notes: string[];
  keywords: string[];
  materialsDeadlineNote?: string;
  visibilityNote?: string;
}

export const CATALOG_BADGES: Record<string, CatalogBadge> = {
  firstAuthor: {
    id: 'firstAuthor',
    label: '需前两作者',
    tone: 'warning',
  },
  firstInstitution: {
    id: 'firstInstitution',
    label: '厦大第一单位',
    tone: 'warning',
  },
  nscDoubleA: {
    id: 'nscDoubleA',
    label: 'NSC 系列加倍',
    tone: 'primary',
  },
  contestCap: {
    id: 'contestCap',
    label: '单人限 3 项',
    tone: 'warning',
  },
  nonInfoLimit: {
    id: 'nonInfoLimit',
    label: '非本院限 1 项',
    tone: 'warning',
  },
  defense: {
    id: 'defense',
    label: '需公开答辩',
    tone: 'danger',
  },
  publicity: {
    id: 'publicity',
    label: '需公示',
    tone: 'neutral',
  },
  professorEndorse: {
    id: 'professorEndorse',
    label: '需三名教授推荐',
    tone: 'danger',
  },
  scoreCap: {
    id: 'scoreCap',
    label: '学术专长封顶 15',
    tone: 'muted',
  },
  comprehensiveCap: {
    id: 'comprehensiveCap',
    label: '综合表现封顶 5',
    tone: 'muted',
  },
  requiresTeam: {
    id: 'requiresTeam',
    label: '团队折算',
    tone: 'warning',
  },
  breaksThreshold: {
    id: 'breaksThreshold',
    label: '可破排名/外语线',
    tone: 'primary',
  },
};

export const CATALOG_CATEGORIES: CatalogCategoryPolicy[] = [
  {
    slug: 'paper',
    title: '论文成果',
    description:
      '厦门大学为第一单位发表的学术论文，限前两位作者（导师除外），独立作者计 100%。',
    order: 1,
    defaultBadge: CATALOG_BADGES.firstAuthor,
    policyNotes: [
      '奖励按 A/B/C 三档：A=10，B=6，C=1（C 类最多 2 篇）',
      'Nature/Science/Cell 主刊及子刊（Cell 系列 IF≥10）计两篇 A，即 20 分',
      '须在统一截止日前录用/见刊，材料需体现第一单位与作者顺序',
    ],
  },
  {
    slug: 'patent',
    title: '专利授权',
    description:
      '国家发明专利授权，厦门大学为第一单位，导师署名不计入作者排序。',
    order: 2,
    defaultBadge: CATALOG_BADGES.firstInstitution,
    policyNotes: ['授权证书日期不得晚于 8 月 31 日', '独立发明人按 100% 计分'],
  },
  {
    slug: 'competition',
    title: '学科竞赛',
    description:
      '纳入学院竞赛项目库的国家/省级赛事，按最高奖项折算，团队按人数与角色折算。',
    order: 3,
    policyNotes: [
      '同一作品或同一赛事不同级别仅取最高奖计分',
      '个人竞赛累计不超过 3 项，其中非信息学院项目不超过 1 项',
      '团队成绩需提供成员分工与名单',
    ],
  },
  {
    slug: 'innovation',
    title: '创新创业训练',
    description:
      '国/省/校级创新创业训练计划立项与结题成果，按项目级别与角色计分，上限 2 分。',
    order: 4,
    policyNotes: ['组长需说明项目职责，成员需提供任务分工说明'],
  },
  {
    slug: 'international_internship',
    title: '国际组织实习',
    description:
      '在国际组织实习经历需提供在岗证明与任务说明，按时长折算，最高 1 分。',
    order: 5,
  },
  {
    slug: 'volunteer',
    title: '志愿服务',
    description:
      '志愿服务时长需达到 200 小时方可计分，结合表彰折算，上限 1 分。',
    order: 6,
    policyNotes: [
      '同一志愿服务项目不可重复计分',
      '须提供校级志愿服务系统导出的工时报表及佐证材料',
    ],
  },
  {
    slug: 'honor',
    title: '荣誉称号',
    description:
      '国家/省/校级荣誉称号按级别折算，同一年度取最高，不累计，最高 2 分。',
    order: 7,
  },
  {
    slug: 'social_work',
    title: '社会工作',
    description:
      '学生干部社会工作成绩，按岗位系数与导师评分折算，同学年取最高，跨学年可累加，最高 2 分。',
    order: 8,
  },
  {
    slug: 'sports',
    title: '体育比赛',
    description:
      '体育赛事团队按名次折算，个人得分按 1/3 计，同赛事不同级别仅取最高。',
    order: 9,
  },
  {
    slug: 'special_academic',
    title: '特殊学术专长',
    description:
      '突破性科研业绩，可申请特殊学术专长，经审核与公开答辩一致通过，可直接赋予学术专长满分或破外语线、排名限制。',
    order: 10,
    policyNotes: [
      '需三名本专业教授联名推荐',
      '需通过专项审核与公开答辩，全票通过后公示',
    ],
    defaultBadge: CATALOG_BADGES.breaksThreshold,
  },
];

export const CATALOG_ITEMS: CatalogItemPolicy[] = [
  {
    slug: 'paper-a-tier',
    category: 'paper',
    title: '论文 A 类（CCF-A / Top 期刊）',
    shortDescription:
      '厦大第一单位，学生为前两作者的 A 类论文，独立作者按 100%，共同一作各 50%。',
    maxScore: 10,
    badges: [
      CATALOG_BADGES.firstAuthor,
      CATALOG_BADGES.firstInstitution,
      CATALOG_BADGES.scoreCap,
    ],
    flags: [
      'requiresFirstAuthor',
      'requiresFirstInstitution',
      'scoreCap',
      'limitsCount',
    ],
    proofTips: [
      '录用通知或见刊证明（须含刊物分区/级别）',
      '署名页或作者排序说明（导师除外仅计前两作者）',
      '第一单位证明（如封面/版权页/系统截图）',
      '全文 PDF 或 DOI 检索链接',
    ],
    notes: [
      'C 类论文最多计 2 篇，A/B 无限但学术专长总分封顶 15 分',
      '同一成果不得重复计分，若已用于特殊学术专长则不可再次申报',
    ],
    keywords: ['CCF A', 'Top', '论文', 'A 类', '第一作者', '厦大'],
  },
  {
    slug: 'paper-b-tier',
    category: 'paper',
    title: '论文 B 类（CCF-B / 重要期刊）',
    shortDescription:
      '厦大第一单位，学生为前两作者的 B 类论文。共同第一作者各 50%。',
    maxScore: 6,
    badges: [
      CATALOG_BADGES.firstAuthor,
      CATALOG_BADGES.firstInstitution,
      CATALOG_BADGES.scoreCap,
    ],
    flags: [
      'requiresFirstAuthor',
      'requiresFirstInstitution',
      'scoreCap',
      'limitsCount',
    ],
    proofTips: [
      '录用证明或期刊封面扫描件',
      '作者排序与贡献声明',
      '第一单位证明材料',
    ],
    notes: [
      '同一论文不可跨级申报',
      '若导师为通讯作者且排序在前，不影响学生名次判定',
    ],
    keywords: ['CCF B', '论文', 'B 类', '厦门大学', '第一作者'],
  },
  {
    slug: 'paper-c-tier',
    category: 'paper',
    title: '论文 C 类（CCF-C / 其他核心）',
    shortDescription:
      '厦大第一单位，学生为前两作者的 C 类论文，每人最多计 2 篇。',
    maxScore: 1,
    scoreNote: '最多录入 2 篇；超过不再累计。',
    badges: [
      CATALOG_BADGES.firstAuthor,
      CATALOG_BADGES.firstInstitution,
      CATALOG_BADGES.scoreCap,
    ],
    flags: [
      'requiresFirstAuthor',
      'requiresFirstInstitution',
      'scoreCap',
      'limitsCount',
    ],
    proofTips: [
      '期刊/会议录用通知或检索截图',
      '作者排序证明',
      '第一单位材料',
    ],
    notes: [
      'C 类限 2 项，其余可转入综合表现“学术活动”说明但不计分',
      '需说明数据库检索号或会议官网链接',
    ],
    keywords: ['CCF C', '论文', 'C 类', '最多两篇'],
  },
  {
    slug: 'paper-nsc-top',
    category: 'paper',
    title: 'NSC 系列（Cell 系列 IF≥10）',
    shortDescription:
      'Nature/Science/Cell 主刊及子刊且影响因子≥10，等价两篇 A，最高 20 分。',
    maxScore: 20,
    badges: [
      CATALOG_BADGES.nscDoubleA,
      CATALOG_BADGES.firstAuthor,
      CATALOG_BADGES.firstInstitution,
      CATALOG_BADGES.scoreCap,
    ],
    flags: [
      'requiresFirstAuthor',
      'requiresFirstInstitution',
      'nscDoubleA',
      'scoreCap',
      'limitsCount',
    ],
    proofTips: [
      '期刊检索页面（需显示 IF≥10）',
      '作者排序及共同一作证明',
      '第一单位材料',
      '录用通知或发表页',
    ],
    notes: [
      '计 2×A 类即 20 分，仍受学术专长 15 分上限约束',
      '如为共同第一作者，按 50% 折算后再纳入封顶规则',
    ],
    keywords: ['NSC', 'Nature', 'Science', 'Cell', 'IF≥10'],
  },
  {
    slug: 'patent-national-invention',
    category: 'patent',
    title: '国家发明专利授权',
    shortDescription:
      '厦大第一单位的国家发明专利授权，除导师外第一发明人按 80% 计，独立发明人按 100%。',
    maxScore: 2,
    badges: [
      CATALOG_BADGES.firstInstitution,
      CATALOG_BADGES.scoreCap,
    ],
    flags: [
      'requiresFirstInstitution',
      'scoreCap',
    ],
    proofTips: [
      '国家知识产权局专利授权证书',
      '发明人列表，标明导师情况及学生排序',
      '第一单位证明',
      '专利权维持缴费凭证（如有）',
    ],
    notes: [
      '授权日需在 8 月 31 日前',
      '若发明人为团队，需说明学生贡献比例；导师不计入排序',
    ],
    keywords: ['专利', '国家发明', '授权', '厦大第一单位'],
  },
  {
    slug: 'competition-national-a-plus',
    category: 'competition',
    title: '国家级 A+ 类竞赛一等奖',
    shortDescription:
      '列入学院竞赛项目库的国家级 A+ 类赛事最高奖（如挑战杯、ICPC 总决赛等），按 30 分基准计入学术专长。',
    maxScore: 30,
    badges: [
      CATALOG_BADGES.requiresTeam,
      CATALOG_BADGES.contestCap,
      CATALOG_BADGES.scoreCap,
    ],
    flags: [
      'requiresTeam',
      'scoreCap',
      'limitedQuota',
      'singleSubmissionPerContest',
    ],
    proofTips: [
      '竞赛获奖证书原件或官方证明（需含队伍信息）',
      '团队名单与角色分工，注明参赛作品是否重复参赛',
      '赛事官方成绩公示链接',
      '指导教师证明（如需）',
    ],
    notes: [
      '若同一作品在不同赛事或复赛中获奖，仅取最高奖计分',
      '个人累计不超过 3 项，非信息学院赛事最多 1 项',
      '团队成绩需按学院折算系数换算后再计入学术专长 15 分封顶',
    ],
    keywords: ['竞赛', '国家级', 'A+', '挑战杯', 'ICPC', '一等奖'],
  },
  {
    slug: 'competition-national-a',
    category: 'competition',
    title: '国家级 A 类竞赛获奖',
    shortDescription:
      '国家级 A 类赛事（如全国信息安全竞赛、数模等）按等级计分：一等奖 15，二等奖 10，三等奖 5。',
    maxScore: 15,
    badges: [
      CATALOG_BADGES.requiresTeam,
      CATALOG_BADGES.contestCap,
      CATALOG_BADGES.scoreCap,
    ],
    flags: [
      'requiresTeam',
      'scoreCap',
      'limitedQuota',
      'singleSubmissionPerContest',
    ],
    proofTips: [
      '获奖证书扫描或官方公示截图',
      '团队成员名单及角色说明',
      '赛事级别说明（如官网截图）',
    ],
    notes: [
      '若同一队伍在多站比赛获奖，仅取最高级别成绩',
      '需说明是否为信息学院组织赛事，以判断限项规则',
    ],
    keywords: ['竞赛', '国家级', '一等奖', '二等奖', '三等奖', 'A 类'],
  },
  {
    slug: 'competition-provincial-a',
    category: 'competition',
    title: '省级 A 类竞赛获奖',
    shortDescription:
      '省级赛事如“网信柏鹭杯”“福建省程序设计竞赛”等，按奖项折算，团队需提供分工说明。',
    maxScore: 10,
    badges: [
      CATALOG_BADGES.requiresTeam,
      CATALOG_BADGES.contestCap,
      CATALOG_BADGES.scoreCap,
    ],
    flags: [
      'requiresTeam',
      'scoreCap',
      'limitedQuota',
      'singleSubmissionPerContest',
    ],
    proofTips: [
      '省级竞赛获奖证书或官方名单截图',
      '队员名单、角色及在校证明',
      '参赛作品唯一性说明',
    ],
    notes: [
      '如同一作品亦获国家级奖项，仅取高等级成绩',
      '需说明是否跨学院，以判定非本院限项',
    ],
    keywords: ['省级', '竞赛', '网信柏鹭杯', '程序设计'],
  },
  {
    slug: 'innovation-training',
    category: 'innovation',
    title: '创新创业训练计划',
    shortDescription:
      '国/省/校级创新创业训练项目，组长最高 2 分，成员按 50% 折算，取项内最高。',
    maxScore: 2,
    scoreNote: '项目总分封顶 2 分，可跨项目累计但不超过上限。',
    badges: [
      CATALOG_BADGES.requiresTeam,
      CATALOG_BADGES.scoreCap,
    ],
    flags: ['requiresTeam', 'scoreCap'],
    proofTips: [
      '立项通知书及项目编号',
      '阶段成果/结题报告',
      '项目成员与职责说明',
    ],
    notes: [
      '成员需说明实际贡献，导师评价需上传附件或截图',
      '如项目仍在进行，需提供阶段性成效与考核意见',
    ],
    keywords: ['创新创业', '训练计划', '项目', '结题'],
  },
  {
    slug: 'international-internship-long-term',
    category: 'international_internship',
    title: '国际组织实习（≥1 学年）',
    shortDescription:
      '在国际组织连续实习满 1 学年，提供在岗证明和工作成果，可计 1 分。',
    maxScore: 1,
    badges: [CATALOG_BADGES.comprehensiveCap],
    flags: ['scoreCap'],
    proofTips: [
      '实习单位出具的任职证明（需标明起止日期与工作地点）',
      '任务完成情况报告或推荐信',
      '签约或协议复印件',
    ],
    notes: [
      '不足一学年但超过一学期按 0.5 分计，需在备注说明',
      '如为多段实习需合并提供总时长与任务说明',
    ],
    keywords: ['国际组织', '实习', '长期', '学年'],
  },
  {
    slug: 'volunteer-service',
    category: 'volunteer',
    title: '志愿服务累计',
    shortDescription:
      '志愿服务累计时长达到 200 小时起计，上限 1 分，按时长与表彰折算。',
    maxScore: 1,
    badges: [CATALOG_BADGES.comprehensiveCap],
    flags: ['scoreCap'],
    proofTips: [
      '校级志愿服务系统工时报表（导出 PDF 或截图）',
      '具体服务项目佐证材料（照片、证明等）',
      '若有表彰，附上证书或公示截图',
    ],
    notes: [
      '需列出各项目名称、时长与职责，不得重复计时',
      '表彰性质需区分国家/省/校级，用于折算说明',
    ],
    keywords: ['志愿服务', '200 小时', '工时', '表彰'],
  },
  {
    slug: 'honor-titles',
    category: 'honor',
    title: '荣誉称号',
    shortDescription:
      '国家级 2 分、省级 1 分、校级 0.2 分，同一年度仅取最高，累计封顶 2 分。',
    maxScore: 2,
    badges: [CATALOG_BADGES.comprehensiveCap],
    flags: ['scoreCap', 'limitedQuota'],
    proofTips: [
      '荣誉称号证书或任命文件',
      '年度说明与颁发单位证明',
      '如为团队荣誉，需说明个人贡献',
    ],
    notes: [
      '同一荣誉不可跨学年重复申报',
      '若为专项表彰需说明评选标准及个人排名',
    ],
    keywords: ['荣誉称号', '国家级', '省级', '校级'],
  },
  {
    slug: 'social-work',
    category: 'social_work',
    title: '学生干部社会工作',
    shortDescription:
      '按岗位系数 × 导师评分 / 100 折算，同学年取最高，跨学年可累计，上限 2 分。',
    maxScore: 2,
    badges: [CATALOG_BADGES.comprehensiveCap],
    flags: ['scoreCap'],
    proofTips: [
      '任职证明（含岗位、起止时间、岗位系数）',
      '指导老师评分表或推荐意见',
      '岗位工作总结或述职材料',
    ],
    notes: [
      '需说明评分细则与计算过程',
      '若跨学年任职需拆分核算，避免重复计分',
    ],
    keywords: ['学生干部', '社会工作', '岗位系数', '导师评分'],
  },
  {
    slug: 'sports-competition',
    category: 'sports',
    title: '体育比赛成绩',
    shortDescription:
      '国际/国家级团体名次按表折算，个人成绩按 1/3，取最高奖项计分。',
    maxScore: 2,
    badges: [CATALOG_BADGES.comprehensiveCap],
    flags: ['scoreCap', 'singleSubmissionPerContest'],
    proofTips: [
      '体育赛事获奖证书或成绩册',
      '团队名单及出场记录（如适用）',
      '赛事级别说明与官网链接',
    ],
    notes: [
      '同赛事不同级别取最高，不同项目可累计至上限',
      '个人项目折算 1/3 后计入综合表现',
    ],
    keywords: ['体育', '竞赛', '名次', '团体', '个人'],
  },
  {
    slug: 'special-academic-excellence',
    category: 'special_academic',
    title: '特殊学术专长申请',
    shortDescription:
      '以第一作者在指定目录发表长文，或获国家级 A+/A 竞赛全国一等奖及以上，可申请特殊学术专长。',
    maxScore: null,
    scoreNote: '审核通过后可直接赋予学术专长满分 15 或破除排名、外语线限制。',
    badges: [
      CATALOG_BADGES.breaksThreshold,
      CATALOG_BADGES.professorEndorse,
      CATALOG_BADGES.defense,
      CATALOG_BADGES.publicity,
    ],
    flags: [
      'requiresProfessorEndorsement',
      'requiresPublicDefense',
      'requiresPublicity',
      'breaksThreshold',
    ],
    proofTips: [
      '三名本专业教授联名推荐信',
      '代表性成果材料（论文/竞赛证明等）',
      '公开答辩方案与会议记录（提交时可上传计划）',
      '成果公示材料或计划说明',
    ],
    notes: [
      '需先提交材料，经学院审核后安排公开答辩',
      '答辩一致通过后进行公示，期间如有异议需说明处理结果',
    ],
    keywords: ['特殊学术专长', '破外语线', '破排名线', '公开答辩'],
    visibilityNote:
      '申请通过后名单须在学院官网或公告栏公示，公示期满无异议后生效。',
  },
];

export const POLICY_TIMELINE = [
  {
    title: '材料提交截止',
    description: '所有证明材料的落款或获奖日期须不晚于 2024 年 8 月 31 日。',
  },
  {
    title: '资格审核',
    description:
      '学院复核材料真实性、单位与作者顺序；竞赛与志愿服务需校级系统对账。',
  },
  {
    title: '公开答辩（限特殊学术专长）',
    description: '需公开答辩并全票通过，答辩记录存档。',
  },
  {
    title: '结果公示',
    description: '审核通过后，在学院官网公示不少于 5 个工作日。',
  },
] as const;

export const POLICY_FILTER_LABELS: Record<CatalogFlag, string> = {
  requiresFirstAuthor: '需前两作者',
  requiresFirstInstitution: '需厦大第一单位',
  requiresTeam: '团队项目',
  requiresPublicDefense: '需公开答辩',
  requiresPublicity: '需公示',
  requiresProfessorEndorsement: '需教授推荐',
  limitsCount: '限量申报',
  limitedQuota: '竞赛限项',
  scoreCap: '封顶项',
  breaksThreshold: '破线特批',
  nscDoubleA: 'NSC 加倍',
  singleSubmissionPerContest: '同赛事仅一次',
};

export const DEFAULT_SEARCH_HINTS = [
  '关键词：论文 A 类、国家级竞赛、志愿服务 200 小时',
  '筛选条件支持团队/第一作者/需公示等标签组合查询',
  '特殊学术专长需教授推荐、公开答辩与公示，请提前准备材料',
] as const;

export function findCatalogItem(slug: string): CatalogItemPolicy | undefined {
  return CATALOG_ITEMS.find((item) => item.slug === slug);
}

export function findCatalogCategory(
  slug: CatalogCategorySlug
): CatalogCategoryPolicy | undefined {
  return CATALOG_CATEGORIES.find((category) => category.slug === slug);
}
