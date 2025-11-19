import { z } from 'zod';
import {
  CATALOG_ITEMS,
  POLICY_FILTER_LABELS,
  POLICY_META,
  type CatalogFlag,
  type CatalogItemPolicy,
  findCatalogItem,
} from './policy';

const cutoffDate = new Date(`${POLICY_META.cutoffDate}T23:59:59.999Z`);

export const catalogFiltersSchema = z.object({
  search: z.string().min(1).max(120).optional(),
  category: z.string().optional(),
  flags: z
    .array(z.enum(Object.keys(POLICY_FILTER_LABELS) as [CatalogFlag]))
    .optional(),
  requireTags: z
    .string()
    .transform((value) =>
      value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    )
    .optional(),
});

const attachmentSchema = z.object({
  url: z.string().url(),
  name: z.string().min(1),
  mimeType: z.string().min(1).optional(),
  size: z.number().int().positive().optional(),
});

const teamMemberSchema = z.object({
  name: z.string().min(1),
  studentId: z.string().min(6).optional(),
  role: z.string().min(1),
  contributionPercent: z.number().min(0).max(100).optional(),
  isLeader: z.boolean().optional(),
});

const paperSchema = z.object({
  publicationType: z.enum(['journal', 'conference', 'preprint']).optional(),
  level: z.enum(['A', 'B', 'C', 'NSC']).optional(),
  firstUnit: z.boolean(),
  authorRank: z.number().int().min(1),
  isAdvisorIncluded: z.boolean().default(false),
  isEqualFirstAuthor: z.boolean().default(false),
  impactFactor: z.number().min(0).optional(),
});

const patentSchema = z.object({
  patentType: z.enum(['invention']).default('invention'),
  firstUnit: z.boolean(),
  inventorRank: z.number().int().min(1),
  isAdvisorInventor: z.boolean().default(false),
});

const competitionSchema = z.object({
  competitionName: z.string().min(2),
  level: z.enum(['A+', 'A', 'A-', 'B']).optional(),
  scope: z.enum(['international', 'national', 'provincial', 'school']),
  award: z.string().min(1),
  workName: z.string().min(1),
  isSameWorkSubmitted: z.boolean().optional(),
  isOutsideSchoolProject: z.boolean().optional(),
  teamSize: z.number().int().min(1).max(20),
  role: z.string().min(1),
});

const volunteerSchema = z.object({
  totalHours: z.number().min(0),
  recognitions: z
    .array(
      z.object({
        level: z.enum(['national', 'provincial', 'school']).optional(),
        title: z.string().min(1),
      })
    )
    .optional(),
});

const honorSchema = z.object({
  level: z.enum(['national', 'provincial', 'school']),
  year: z.string().length(4).optional(),
  title: z.string().min(1),
});

const socialWorkSchema = z.object({
  position: z.string().min(1),
  academicYear: z.string().min(4),
  coefficient: z.number().min(0),
  advisorScore: z.number().min(0).max(100),
});

const sportsSchema = z.object({
  competitionName: z.string().min(1),
  level: z.enum(['international', 'national', 'provincial', 'school']),
  ranking: z.number().int().min(1),
  isTeam: z.boolean().default(true),
});

const specialAcademicSchema = z.object({
  route: z.enum(['paper', 'competition']),
  hasProfessorEndorsement: z.boolean(),
  defensePlannedDate: z
    .string()
    .optional()
    .refine((value) => !value || !Number.isNaN(Date.parse(value)), {
      message: '公开答辩时间格式错误',
    }),
});

const metadataSchemaByCategory: Record<
  CatalogItemPolicy['category'],
  z.ZodSchema<any>
> = {
  paper: paperSchema,
  patent: patentSchema,
  competition: competitionSchema,
  innovation: z.object({
    projectLevel: z.enum(['national', 'provincial', 'school']),
    role: z.enum(['leader', 'member']),
    isConcluded: z.boolean().optional(),
  }),
  international_internship: z.object({
    organisation: z.string().min(1),
    durationMonths: z.number().min(1),
  }),
  volunteer: volunteerSchema,
  honor: honorSchema,
  social_work: socialWorkSchema,
  sports: sportsSchema,
  special_academic: specialAcademicSchema,
};

const baseApplicationSchema = z.object({
  itemSlug: z.string().min(1),
  obtainedAt: z
    .string()
    .min(1)
    .refine((value) => !Number.isNaN(Date.parse(value)), '日期格式错误')
    .transform((value) => new Date(value))
    .refine(
      (value) => value <= cutoffDate,
      `材料日期需不晚于 ${POLICY_META.cutoffDate}`
    ),
  summary: z.string().min(10).max(2000),
  attachments: z.array(attachmentSchema).min(1),
  metadata: z.record(z.any()).default({}),
  teamMembers: z.array(teamMemberSchema).optional(),
});

export const applicationCreateSchema = baseApplicationSchema.superRefine(
  (data, ctx) => {
    const item = findCatalogItem(data.itemSlug);
    if (!item) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['itemSlug'],
        message: '未知的加分项目，请刷新目录后重试',
      });
      return;
    }

    const categorySchema = metadataSchemaByCategory[item.category];
    if (categorySchema) {
      const result = categorySchema.safeParse(data.metadata);
      if (!result.success) {
        result.error.issues.forEach((issue) => {
          ctx.addIssue({
            ...issue,
            path: ['metadata', ...(issue.path ?? [])],
          });
        });
      } else {
        const metadata = result.data;
        validatePolicyForItem(metadata, item, data, ctx);
      }
    }

    if (item.flags.includes('requiresTeam') && !data.teamMembers?.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['teamMembers'],
        message: '该项目需填写团队成员信息',
      });
    }
  }
);

function validatePolicyForItem(
  metadata: unknown,
  item: CatalogItemPolicy,
  data: z.infer<typeof baseApplicationSchema>,
  ctx: z.RefinementCtx
) {
  switch (item.category) {
    case 'paper': {
      const detail = paperSchema.parse(metadata);
      if (!detail.firstUnit && item.flags.includes('requiresFirstInstitution')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['metadata', 'firstUnit'],
          message: '需证明厦门大学为第一单位',
        });
      }
      if (detail.authorRank > 2 && item.flags.includes('requiresFirstAuthor')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['metadata', 'authorRank'],
          message: '仅计前两作者（导师除外）',
        });
      }
      if (detail.level === 'C' && countExistingApplications('paper-c-tier') >= 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['itemSlug'],
          message: 'C 类论文最多计 2 篇',
        });
      }
      if (item.slug === 'paper-nsc-top' && detail.impactFactor !== undefined) {
        if (detail.impactFactor < 10) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['metadata', 'impactFactor'],
            message: 'NSC 系列需 IF≥10',
          });
        }
      }
      break;
    }
    case 'patent': {
      const detail = patentSchema.parse(metadata);
      if (!detail.firstUnit) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['metadata', 'firstUnit'],
          message: '需提供厦门大学第一单位证明',
        });
      }
      break;
    }
    case 'competition': {
      const detail = competitionSchema.parse(metadata);
      if (item.flags.includes('limitedQuota')) {
        if (countExistingApplicationsByCategory('competition') >= 3) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['itemSlug'],
            message: '同学竞赛加分累计不超过 3 项',
          });
        }
      }
      if (detail.isOutsideSchoolProject && countOutsideSchoolCompetition() >= 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['metadata', 'isOutsideSchoolProject'],
          message: '非信息学院竞赛加分最多 1 项',
        });
      }
      break;
    }
    case 'volunteer': {
      const detail = volunteerSchema.parse(metadata);
      if (detail.totalHours < 200) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['metadata', 'totalHours'],
          message: '志愿服务需累计满 200 小时',
        });
      }
      break;
    }
    case 'honor': {
      // honors handled later if needed
      break;
    }
    case 'social_work': {
      const detail = socialWorkSchema.parse(metadata);
      const computedScore = (detail.coefficient * detail.advisorScore) / 100;
      if (computedScore > 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['metadata', 'advisorScore'],
          message: '社会工作折算分数不应超过 2 分',
        });
      }
      break;
    }
    case 'sports': {
      // Additional rules can be added if necessary.
      sportsSchema.parse(metadata);
      break;
    }
    case 'special_academic': {
      const detail = specialAcademicSchema.parse(metadata);
      if (!detail.hasProfessorEndorsement) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['metadata', 'hasProfessorEndorsement'],
          message: '需提供三名教授联名推荐证明',
        });
      }
      break;
    }
    default:
      break;
  }

  if (item.flags.includes('scoreCap')) {
    enforceScoreCap(ctx, item);
  }
}

function enforceScoreCap(ctx: z.RefinementCtx, item: CatalogItemPolicy) {
  if (item.category === 'paper' || item.category === 'patent' || item.category === 'competition' || item.category === 'innovation') {
    if (getPlannedAcademicScore() >= POLICY_META.academicScoreCap) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '当前学术专长分数已达到 15 分封顶，提交可能不计分',
        path: ['itemSlug'],
      });
    }
  }
  if (
    item.category === 'international_internship' ||
    item.category === 'volunteer' ||
    item.category === 'honor' ||
    item.category === 'social_work' ||
    item.category === 'sports'
  ) {
    if (getPlannedComprehensiveScore() >= POLICY_META.comprehensiveScoreCap) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '综合表现分已达上限 5 分，提交可能不计分',
        path: ['itemSlug'],
      });
    }
  }
}

// Placeholder hooks for future cumulative checks; real values should be fetched from DB.
function countExistingApplications(slug: string): number {
  // 在接入数据库时替换为实际查询
  return 0;
}

function countExistingApplicationsByCategory(category: CatalogItemPolicy['category']): number {
  return 0;
}

function countOutsideSchoolCompetition(): number {
  return 0;
}

function getPlannedAcademicScore(): number {
  return 0;
}

function getPlannedComprehensiveScore(): number {
  return 0;
}

export class PolicyViolationError extends Error {
  violations: string[];

  constructor(violations: string[]) {
    super(violations.join('\n'));
    this.violations = violations;
    this.name = 'PolicyViolationError';
  }
}

export const feedbackCreateSchema = z.object({
  title: z.string().min(4).max(80),
  description: z.string().min(10).max(2000),
  pageUrl: z.string().url().optional(),
  screenshotUrl: z.string().url().optional(),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
});

export const feedbackUpdateSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'WONT_FIX']).optional(),
  note: z.string().min(1).max(1000).optional(),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
});

export const feedbackQuerySchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'WONT_FIX']).optional(),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
  keyword: z.string().min(1).max(120).optional(),
  page: z
    .string()
    .optional()
    .transform((value) => (value ? Number(value) : 1))
    .pipe(z.number().int().min(1))
    .default(1),
  pageSize: z
    .string()
    .optional()
    .transform((value) => (value ? Number(value) : 20))
    .pipe(z.number().int().min(5).max(100))
    .default(20),
});

export function searchCatalogItems({
  search,
  flags,
  category,
}: {
  search?: string;
  flags?: CatalogFlag[];
  category?: string;
}) {
  let items = [...CATALOG_ITEMS];
  if (category) {
    items = items.filter((item) => item.category === category);
  }
  if (flags?.length) {
    items = items.filter((item) =>
      flags.every((flag) => item.flags.includes(flag))
    );
  }
  if (search) {
    const keyword = search.toLowerCase();
    items = items.filter(
      (item) =>
        item.title.toLowerCase().includes(keyword) ||
        item.shortDescription.toLowerCase().includes(keyword) ||
        item.keywords.some((key) => key.toLowerCase().includes(keyword))
    );
  }
  return items;
}
