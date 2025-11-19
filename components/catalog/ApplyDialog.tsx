'use client';

import { useEffect, useMemo, useState } from 'react';
import { message } from 'antd';
import type { CatalogItemDTO } from '@/types/catalog';
import { getStoredToken, getStoredUser } from '@/lib/client';

type Attachment = {
  name: string;
  url: string;
  mimeType?: string;
  size?: number;
};

type TeamMember = {
  name: string;
  role: string;
  studentId?: string;
  contributionPercent?: number;
  isLeader?: boolean;
};

interface ApplyDialogProps {
  item: CatalogItemDTO | null;
  open: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
}

const categoryFieldDefaults: Record<string, Record<string, unknown>> = {
  paper: {
    publicationType: 'journal',
    level: 'A',
    firstUnit: true,
    authorRank: 1,
    isAdvisorIncluded: false,
    isEqualFirstAuthor: false,
  },
  patent: {
    patentType: 'invention',
    firstUnit: true,
    inventorRank: 1,
    isAdvisorInventor: false,
  },
  competition: {
    competitionName: '',
    scope: 'national',
    award: '',
    workName: '',
    teamSize: 3,
    role: '队长',
    isOutsideSchoolProject: false,
  },
  innovation: {
    projectLevel: 'national',
    role: 'leader',
    isConcluded: true,
  },
  international_internship: {
    organisation: '',
    durationMonths: 6,
  },
  volunteer: {
    totalHours: 200,
    recognitions: [],
  },
  honor: {
    level: 'national',
    title: '',
    year: new Date().getFullYear().toString(),
  },
  social_work: {
    position: '',
    academicYear: `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`,
    coefficient: 1,
    advisorScore: 90,
  },
  sports: {
    competitionName: '',
    level: 'national',
    ranking: 1,
    isTeam: true,
  },
  special_academic: {
    route: 'paper',
    hasProfessorEndorsement: false,
    defensePlannedDate: '',
  },
};

const scopeOptions = [
  { value: 'international', label: '国际级' },
  { value: 'national', label: '国家级' },
  { value: 'provincial', label: '省级' },
  { value: 'school', label: '校级' },
];

export default function ApplyDialog({
  item,
  open,
  onClose,
  onSubmitted,
}: ApplyDialogProps) {
  const [obtainedAt, setObtainedAt] = useState('');
  const [summary, setSummary] = useState('');
  const [metadata, setMetadata] = useState<Record<string, any>>({});
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const resetState = () => {
    setObtainedAt(new Date().toISOString().slice(0, 10));
    setSummary('');
    setMetadata({});
    setAttachments([]);
    setTeamMembers([]);
    setFormErrors({});
  };

  useEffect(() => {
    if (open && item) {
      resetState();
      const defaults =
        categoryFieldDefaults[item.categorySlug] ?? {};
      setMetadata({ ...defaults });
      if (item.flags.includes('requiresTeam')) {
        setTeamMembers([
          {
            name: getStoredUser()?.name ?? '',
            role: '负责人',
            studentId: getStoredUser()?.studentId,
            isLeader: true,
            contributionPercent: 50,
          },
        ]);
      }
    }
  }, [item, open]);

  const show = open && Boolean(item);

  const handleMetadataChange = (key: string, value: any) => {
    setMetadata((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const addAttachment = async (file: File) => {
    const token = getStoredToken();
    if (!token) {
      message.error('请先登录后再上传材料');
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await fetch('/api/uploads', {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || '上传失败');
      }
      setAttachments((prev) => [
        ...prev,
        {
          name: file.name,
          url: result.url,
          mimeType: file.type,
          size: file.size,
        },
      ]);
      message.success('上传成功');
    } catch (error) {
      message.error((error as Error).message || '上传失败');
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const updateTeamMember = (index: number, key: keyof TeamMember, value: any) => {
    setTeamMembers((prev) =>
      prev.map((member, i) => (i === index ? { ...member, [key]: value } : member))
    );
  };

  const addTeamMember = () => {
    setTeamMembers((prev) => [
      ...prev,
      { name: '', role: '成员', contributionPercent: 10 },
    ]);
  };

  const removeTeamMember = (index: number) => {
    setTeamMembers((prev) => prev.filter((_, i) => i !== index));
  };

  const metadataFields = useMemo(() => {
    if (!item) return null;
    switch (item.categorySlug) {
      case 'paper':
        return (
          <>
            <div>
              <label className="text-xs font-medium text-slate-600">
                论文级别 *
              </label>
              <select
                value={metadata.level ?? 'A'}
                onChange={(event) =>
                  handleMetadataChange('level', event.target.value)
                }
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
              >
                <option value="NSC">NSC（IF≥10）</option>
                <option value="A">A 类</option>
                <option value="B">B 类</option>
                <option value="C">C 类</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">
                作者排序 *
              </label>
              <input
                type="number"
                min={1}
                value={metadata.authorRank ?? 1}
                onChange={(event) =>
                  handleMetadataChange(
                    'authorRank',
                    Number(event.target.value)
                  )
                }
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
              <p className="mt-1 text-xs text-slate-400">
                仅计学生前两作者，导师不计入排序
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="paper-first-unit"
                type="checkbox"
                checked={metadata.firstUnit ?? true}
                onChange={(event) =>
                  handleMetadataChange('firstUnit', event.target.checked)
                }
                className="h-4 w-4 rounded border-slate-300 text-primary-500 focus:ring-primary-400"
              />
              <label
                htmlFor="paper-first-unit"
                className="text-sm text-slate-600"
              >
                厦门大学为第一单位
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="paper-equal-first"
                type="checkbox"
                checked={metadata.isEqualFirstAuthor ?? false}
                onChange={(event) =>
                  handleMetadataChange(
                    'isEqualFirstAuthor',
                    event.target.checked
                  )
                }
                className="h-4 w-4 rounded border-slate-300 text-primary-500 focus:ring-primary-400"
              />
              <label
                htmlFor="paper-equal-first"
                className="text-sm text-slate-600"
              >
                共同第一作者
              </label>
            </div>
            {metadata.level === 'NSC' ? (
              <div>
                <label className="text-xs font-medium text-slate-600">
                  影响因子 (IF)
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.1"
                  value={metadata.impactFactor ?? 10}
                  onChange={(event) =>
                    handleMetadataChange(
                      'impactFactor',
                      Number(event.target.value)
                    )
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                />
              </div>
            ) : null}
          </>
        );
      case 'patent':
        return (
          <>
            <div>
              <label className="text-xs font-medium text-slate-600">
                发明人排序 *
              </label>
              <input
                type="number"
                min={1}
                value={metadata.inventorRank ?? 1}
                onChange={(event) =>
                  handleMetadataChange(
                    'inventorRank',
                    Number(event.target.value)
                  )
                }
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="patent-first-unit"
                type="checkbox"
                checked={metadata.firstUnit ?? true}
                onChange={(event) =>
                  handleMetadataChange('firstUnit', event.target.checked)
                }
                className="h-4 w-4 rounded border-slate-300 text-primary-500 focus:ring-primary-400"
              />
              <label
                htmlFor="patent-first-unit"
                className="text-sm text-slate-600"
              >
                厦门大学为第一单位
              </label>
            </div>
          </>
        );
      case 'competition':
        return (
          <>
            <div>
              <label className="text-xs font-medium text-slate-600">
                赛事名称 *
              </label>
              <input
                type="text"
                value={metadata.competitionName ?? ''}
                onChange={(event) =>
                  handleMetadataChange('competitionName', event.target.value)
                }
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-slate-600">
                  赛事级别 *
                </label>
                <select
                  value={metadata.scope ?? 'national'}
                  onChange={(event) =>
                    handleMetadataChange('scope', event.target.value)
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                >
                  {scopeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">
                  赛事档次
                </label>
                <select
                  value={metadata.level ?? 'A'}
                  onChange={(event) =>
                    handleMetadataChange('level', event.target.value)
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                >
                  <option value="A+">A+</option>
                  <option value="A">A</option>
                  <option value="A-">A-</option>
                  <option value="B">B</option>
                </select>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-slate-600">
                  获奖等级 *
                </label>
                <input
                  type="text"
                  value={metadata.award ?? ''}
                  onChange={(event) =>
                    handleMetadataChange('award', event.target.value)
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">
                  申报作品名称 *
                </label>
                <input
                  type="text"
                  value={metadata.workName ?? ''}
                  onChange={(event) =>
                    handleMetadataChange('workName', event.target.value)
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                />
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-slate-600">
                  团队人数 *
                </label>
                <input
                  type="number"
                  min={1}
                  value={metadata.teamSize ?? 3}
                  onChange={(event) =>
                    handleMetadataChange('teamSize', Number(event.target.value))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">
                  本人角色 *
                </label>
                <input
                  type="text"
                  value={metadata.role ?? '队长'}
                  onChange={(event) =>
                    handleMetadataChange('role', event.target.value)
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="competition-outside"
                type="checkbox"
                checked={metadata.isOutsideSchoolProject ?? false}
                onChange={(event) =>
                  handleMetadataChange(
                    'isOutsideSchoolProject',
                    event.target.checked
                  )
                }
                className="h-4 w-4 rounded border-slate-300 text-primary-500 focus:ring-primary-400"
              />
              <label
                htmlFor="competition-outside"
                className="text-sm text-slate-600"
              >
                非信息学院项目
              </label>
            </div>
          </>
        );
      case 'innovation':
        return (
          <>
            <div>
              <label className="text-xs font-medium text-slate-600">
                项目级别 *
              </label>
              <select
                value={metadata.projectLevel ?? 'national'}
                onChange={(event) =>
                  handleMetadataChange('projectLevel', event.target.value)
                }
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
              >
                <option value="national">国家级</option>
                <option value="provincial">省级</option>
                <option value="school">校级</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">
                本人角色 *
              </label>
              <select
                value={metadata.role ?? 'leader'}
                onChange={(event) =>
                  handleMetadataChange('role', event.target.value)
                }
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
              >
                <option value="leader">项目组长</option>
                <option value="member">成员</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="innovation-concluded"
                type="checkbox"
                checked={metadata.isConcluded ?? true}
                onChange={(event) =>
                  handleMetadataChange('isConcluded', event.target.checked)
                }
                className="h-4 w-4 rounded border-slate-300 text-primary-500 focus:ring-primary-400"
              />
              <label
                htmlFor="innovation-concluded"
                className="text-sm text-slate-600"
              >
                已结题或通过中期考核
              </label>
            </div>
          </>
        );
      case 'international_internship':
        return (
          <>
            <div>
              <label className="text-xs font-medium text-slate-600">
                实习单位 *
              </label>
              <input
                type="text"
                value={metadata.organisation ?? ''}
                onChange={(event) =>
                  handleMetadataChange('organisation', event.target.value)
                }
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">
                实习月数 *
              </label>
              <input
                type="number"
                min={1}
                value={metadata.durationMonths ?? 6}
                onChange={(event) =>
                  handleMetadataChange(
                    'durationMonths',
                    Number(event.target.value)
                  )
                }
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
            </div>
          </>
        );
      case 'volunteer':
        return (
          <div>
            <label className="text-xs font-medium text-slate-600">
              累计志愿服务时长（小时） *
            </label>
            <input
              type="number"
              min={0}
              value={metadata.totalHours ?? 200}
              onChange={(event) =>
                handleMetadataChange('totalHours', Number(event.target.value))
              }
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
            <p className="mt-1 text-xs text-slate-400">
              需满足 200 小时起计，请附上志愿服务系统工时报表。
            </p>
          </div>
        );
      case 'honor':
        return (
          <>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-slate-600">
                  荣誉级别 *
                </label>
                <select
                  value={metadata.level ?? 'national'}
                  onChange={(event) =>
                    handleMetadataChange('level', event.target.value)
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                >
                  <option value="national">国家级</option>
                  <option value="provincial">省级</option>
                  <option value="school">校级</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">
                  获得年度
                </label>
                <input
                  type="text"
                  value={metadata.year ?? new Date().getFullYear().toString()}
                  onChange={(event) =>
                    handleMetadataChange('year', event.target.value)
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">
                荣誉名称 *
              </label>
              <input
                type="text"
                value={metadata.title ?? ''}
                onChange={(event) =>
                  handleMetadataChange('title', event.target.value)
                }
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
            </div>
          </>
        );
      case 'social_work':
        return (
          <>
            <div>
              <label className="text-xs font-medium text-slate-600">
                岗位名称 *
              </label>
              <input
                type="text"
                value={metadata.position ?? ''}
                onChange={(event) =>
                  handleMetadataChange('position', event.target.value)
                }
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-slate-600">
                  学年 *
                </label>
                <input
                  type="text"
                  value={metadata.academicYear ?? ''}
                  onChange={(event) =>
                    handleMetadataChange('academicYear', event.target.value)
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">
                  岗位系数 *
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.1"
                  value={metadata.coefficient ?? 1}
                  onChange={(event) =>
                    handleMetadataChange(
                      'coefficient',
                      Number(event.target.value)
                    )
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">
                导师评分 *
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={metadata.advisorScore ?? 90}
                onChange={(event) =>
                  handleMetadataChange(
                    'advisorScore',
                    Number(event.target.value)
                  )
                }
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
            </div>
          </>
        );
      case 'sports':
        return (
          <>
            <div>
              <label className="text-xs font-medium text-slate-600">
                赛事名称 *
              </label>
              <input
                type="text"
                value={metadata.competitionName ?? ''}
                onChange={(event) =>
                  handleMetadataChange('competitionName', event.target.value)
                }
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-slate-600">
                  赛事级别 *
                </label>
                <select
                  value={metadata.level ?? 'national'}
                  onChange={(event) =>
                    handleMetadataChange('level', event.target.value)
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                >
                  <option value="international">国际级</option>
                  <option value="national">国家级</option>
                  <option value="provincial">省级</option>
                  <option value="school">校级</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">
                  获奖名次 *
                </label>
                <input
                  type="number"
                  min={1}
                  value={metadata.ranking ?? 1}
                  onChange={(event) =>
                    handleMetadataChange('ranking', Number(event.target.value))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="sports-isTeam"
                type="checkbox"
                checked={metadata.isTeam ?? true}
                onChange={(event) =>
                  handleMetadataChange('isTeam', event.target.checked)
                }
                className="h-4 w-4 rounded border-slate-300 text-primary-500 focus:ring-primary-400"
              />
              <label
                htmlFor="sports-isTeam"
                className="text-sm text-slate-600"
              >
                团队项目
              </label>
            </div>
          </>
        );
      case 'special_academic':
        return (
          <>
            <div>
              <label className="text-xs font-medium text-slate-600">
                申报路径 *
              </label>
              <select
                value={metadata.route ?? 'paper'}
                onChange={(event) =>
                  handleMetadataChange('route', event.target.value)
                }
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
              >
                <option value="paper">代表性论文</option>
                <option value="competition">国家级竞赛一等奖及以上</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="special-professor"
                type="checkbox"
                checked={metadata.hasProfessorEndorsement ?? false}
                onChange={(event) =>
                  handleMetadataChange(
                    'hasProfessorEndorsement',
                    event.target.checked
                  )
                }
                className="h-4 w-4 rounded border-slate-300 text-primary-500 focus:ring-primary-400"
              />
              <label
                htmlFor="special-professor"
                className="text-sm text-slate-600"
              >
                已获得三名教授推荐
              </label>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">
                预计答辩日期
              </label>
              <input
                type="date"
                value={metadata.defensePlannedDate ?? ''}
                onChange={(event) =>
                  handleMetadataChange(
                    'defensePlannedDate',
                    event.target.value
                  )
                }
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
            </div>
          </>
        );
      default:
        return null;
    }
  }, [item, metadata]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!item) return;
    const token = getStoredToken();
    if (!token) {
      message.error('登录已过期，请重新登录');
      return;
    }
    setSubmitting(true);
    setFormErrors({});

    const payload = {
      itemSlug: item.slug,
      obtainedAt,
      summary,
      metadata,
      attachments,
      teamMembers: item.flags.includes('requiresTeam')
        ? teamMembers.filter((member) => member.name)
        : undefined,
    };

    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        if (result.errors) {
          const fieldErrors: Record<string, string> = {};
          Object.entries(result.errors).forEach(([key, value]) => {
            if (typeof value === 'object' && value && '_errors' in value) {
              const errors = (value as { _errors?: string[] })._errors;
              if (errors?.length) {
                fieldErrors[key] = errors[0];
              }
            }
          });
          setFormErrors(fieldErrors);
        }
        throw new Error(result.message || '提交失败');
      }
      message.success('申请已提交');
      onSubmitted?.();
      onClose();
    } catch (error) {
      const messageText = (error as Error).message;
      message.error(messageText || '提交失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur"
    >
      <div className="relative h-[90vh] w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <header className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {item?.title}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              请根据材料清单填写信息并上传证明
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭申请窗口"
            className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-primary-200 hover:text-primary-600"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        <form
          onSubmit={handleSubmit}
          className="h-full overflow-y-auto px-6 py-4"
        >
          <div className="space-y-5 pb-32">
            <section className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-slate-600">
                  材料日期 *
                </label>
                <input
                  type="date"
                  value={obtainedAt}
                  onChange={(event) => setObtainedAt(event.target.value)}
                  className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-100 ${
                    formErrors.obtainedAt
                      ? 'border-rose-400 focus:ring-rose-100'
                      : 'border-slate-200 focus:border-primary-500'
                  }`}
                />
                {formErrors.obtainedAt ? (
                  <p className="mt-1 text-xs text-rose-500">
                    {formErrors.obtainedAt}
                  </p>
                ) : null}
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">
                  材料概述 *
                </label>
                <input
                  type="text"
                  value={summary}
                  onChange={(event) => setSummary(event.target.value)}
                  placeholder="简要说明成果情况，便于审核快速了解"
                  className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-100 ${
                    formErrors.summary
                      ? 'border-rose-400 focus:ring-rose-100'
                      : 'border-slate-200 focus:border-primary-500'
                  }`}
                />
                {formErrors.summary ? (
                  <p className="mt-1 text-xs text-rose-500">
                    {formErrors.summary}
                  </p>
                ) : null}
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-800">
                项目必填信息
              </h3>
              <div className="grid gap-4 md:grid-cols-2">{metadataFields}</div>
              {formErrors.metadata ? (
                <p className="text-xs text-rose-500">{formErrors.metadata}</p>
              ) : null}
            </section>

            {item?.flags.includes('requiresTeam') ? (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-800">
                    团队成员
                  </h3>
                  <button
                    type="button"
                    onClick={addTeamMember}
                    className="rounded-lg border border-primary-200 px-3 py-1 text-xs font-medium text-primary-600 transition hover:bg-primary-50"
                  >
                    添加成员
                  </button>
                </div>
                <div className="space-y-3">
                  {teamMembers.map((member, index) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4"
                    >
                      <div className="flex justify-between">
                        <p className="text-xs font-semibold text-slate-500">
                          成员 {index + 1}
                        </p>
                        {index > 0 ? (
                          <button
                            type="button"
                            onClick={() => removeTeamMember(index)}
                            className="text-xs text-rose-500 hover:underline"
                          >
                            移除
                          </button>
                        ) : null}
                      </div>
                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        <input
                          aria-label="成员姓名"
                          placeholder="姓名"
                          value={member.name}
                          onChange={(event) =>
                            updateTeamMember(index, 'name', event.target.value)
                          }
                          className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                        />
                        <input
                          aria-label="成员学号"
                          placeholder="学号（选填）"
                          value={member.studentId ?? ''}
                          onChange={(event) =>
                            updateTeamMember(
                              index,
                              'studentId',
                              event.target.value
                            )
                          }
                          className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                        />
                        <input
                          aria-label="成员角色"
                          placeholder="角色"
                          value={member.role}
                          onChange={(event) =>
                            updateTeamMember(index, 'role', event.target.value)
                          }
                          className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                        />
                        <input
                          type="number"
                          min={0}
                          max={100}
                          aria-label="贡献比例"
                          placeholder="贡献比例 %"
                          value={member.contributionPercent ?? ''}
                          onChange={(event) =>
                            updateTeamMember(
                              index,
                              'contributionPercent',
                              Number(event.target.value)
                            )
                          }
                          className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-800">
                证明材料上传 *
              </h3>
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-6 text-sm text-slate-500 hover:border-primary-300 hover:bg-primary-50/40">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.zip"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      void addAttachment(file);
                      event.target.value = '';
                    }
                  }}
                />
                <span className="font-medium text-primary-600">
                  点击或拖拽上传
                </span>
                <span className="mt-1 text-xs text-slate-400">
                  支持 PDF、图片等格式，单个不超过 10MB
                </span>
              </label>
              {formErrors.attachments ? (
                <p className="text-xs text-rose-500">{formErrors.attachments}</p>
              ) : null}
              <ul className="space-y-2">
                {attachments.map((file, index) => (
                  <li
                    key={`${file.url}-${index}`}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-4 py-2 text-sm text-slate-600"
                  >
                    <span className="truncate">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="text-xs text-rose-500 hover:underline"
                    >
                      移除
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <footer className="sticky bottom-0 mt-6 flex items-center justify-end gap-3 border-t border-slate-100 bg-white px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-primary-200 hover:text-primary-600"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-primary-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:opacity-60"
            >
              {submitting ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/80 border-t-transparent" />
              ) : null}
              提交申请
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
