'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { message } from 'antd';
import { getStoredToken, getStoredUser } from '@/lib/client';
import type {
  FeedbackAdminItem,
  FeedbackPriority,
  FeedbackStatus,
} from '@/types/feedback';

interface FeedbackResponse {
  success: boolean;
  data?: {
    page: number;
    pageSize: number;
    total: number;
    items: FeedbackAdminItem[];
  };
  message?: string;
}

const priorityBadge: Record<FeedbackPriority, string> = {
  HIGH: 'bg-rose-50 text-rose-700 border border-rose-100',
  MEDIUM: 'bg-amber-50 text-amber-700 border border-amber-100',
  LOW: 'bg-slate-100 text-slate-600 border border-slate-200',
};

const statusOptions: { value: FeedbackStatus; label: string }[] = [
  { value: 'OPEN', label: '待处理' },
  { value: 'IN_PROGRESS', label: '处理中' },
  { value: 'RESOLVED', label: '已解决' },
  { value: 'WONT_FIX', label: '暂不处理' },
];

const priorityOptions: { value: FeedbackPriority; label: string }[] = [
  { value: 'HIGH', label: '高' },
  { value: 'MEDIUM', label: '中' },
  { value: 'LOW', label: '低' },
];

export default function AdminFeedbackTable() {
  const [filters, setFilters] = useState<{
    status?: FeedbackStatus;
    priority?: FeedbackPriority;
    keyword?: string;
  }>({});
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<FeedbackAdminItem[]>([]);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<FeedbackAdminItem | null>(null);
  const [updating, setUpdating] = useState(false);
  const [note, setNote] = useState('');

  const token = useMemo(() => getStoredToken(), []);
  const user = useMemo(() => getStoredUser(), []);

  useEffect(() => {
    if (user && user.role !== 'reviewer') {
      message.warning('仅审核人员可访问反馈面板');
    }
  }, [user]);

  const fetchData = useCallback(async () => {
    if (!token) {
      message.error('请登录后再访问后台面板');
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      if (filters.priority) params.set('priority', filters.priority);
      if (filters.keyword) params.set('keyword', filters.keyword);
      params.set('page', page.toString());
      params.set('pageSize', pageSize.toString());

      const response = await fetch(`/api/feedback?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const result = (await response.json()) as FeedbackResponse;
      if (!response.ok || !result.success) {
        throw new Error(result.message || '加载失败');
      }
      setItems(result.data?.items ?? []);
      setTotal(result.data?.total ?? 0);
    } catch (error) {
      message.error((error as Error).message || '加载反馈列表失败');
    } finally {
      setLoading(false);
    }
  }, [filters.keyword, filters.priority, filters.status, page, pageSize, token]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const applyUpdate = async (
    feedbackId: string,
    payload: { status?: FeedbackStatus; priority?: FeedbackPriority; note?: string }
  ) => {
    if (!token) {
      message.error('登录已过期，请重新登录');
      return;
    }
    setUpdating(true);
    try {
      const response = await fetch(`/api/feedback/${feedbackId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || '更新失败');
      }
      message.success('状态已更新');
      setSelected(null);
      setNote('');
      void fetchData();
    } catch (error) {
      message.error((error as Error).message || '更新失败，请稍后重试');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">
          网站问题反馈面板
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          支持按优先级与状态筛选，更新进度自动同步到学生端。
        </p>
      </header>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1fr,1fr,1fr,auto] md:items-end">
          <div>
            <label className="text-xs font-medium text-slate-500">状态</label>
            <select
              value={filters.status ?? ''}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  status: event.target.value
                    ? (event.target.value as FeedbackStatus)
                    : undefined,
                }))
              }
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
            >
              <option value="">全部</option>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500">优先级</label>
            <select
              value={filters.priority ?? ''}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  priority: event.target.value
                    ? (event.target.value as FeedbackPriority)
                    : undefined,
                }))
              }
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
            >
              <option value="">全部</option>
              {priorityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500">关键词</label>
            <input
              type="text"
              value={filters.keyword ?? ''}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  keyword: event.target.value || undefined,
                }))
              }
              placeholder="搜索标题、描述、学生姓名或学号"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
          </div>

          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={() => {
                setFilters({});
                setPage(1);
              }}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-primary-200 hover:text-primary-600"
            >
              重置筛选
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-6 py-3">标题</th>
                <th className="px-6 py-3">优先级</th>
                <th className="px-6 py-3">状态</th>
                <th className="px-6 py-3">提交人</th>
                <th className="px-6 py-3">页面</th>
                <th className="px-6 py-3">更新时间</th>
                <th className="px-6 py-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-500">
                    正在加载反馈数据...
                  </td>
                </tr>
              ) : null}
              {!loading && items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-500">
                    暂无数据，尝试调整筛选条件。
                  </td>
                </tr>
              ) : null}
              {!loading &&
                items.map((item) => (
                  <tr key={item.id} className="text-slate-700">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">
                        {item.title}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                        {item.description}
                      </p>
                      <p className="mt-2 text-[11px] text-slate-400">
                        工单号：{item.id.slice(0, 8).toUpperCase()}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${priorityBadge[item.priority]}`}
                      >
                        {priorityOptions.find(
                          (option) => option.value === item.priority
                        )?.label ?? item.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={item.status}
                        onChange={(event) =>
                          applyUpdate(item.id, {
                            status: event.target.value as FeedbackStatus,
                          })
                        }
                        className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                      >
                        {statusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-slate-600">
                        <p>{item.studentName ?? '匿名'}</p>
                        <p className="text-slate-400">{item.studentId}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {item.pageUrl ? (
                        <a
                          href={item.pageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-primary-600 underline"
                        >
                          链接
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(item.updatedAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setSelected(item);
                          setNote('');
                        }}
                        className="rounded-lg border border-primary-200 px-3 py-1 text-xs font-medium text-primary-600 transition hover:bg-primary-50"
                      >
                        查看详情
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {total > pageSize ? (
          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 text-xs text-slate-500">
            <span>
              第 {page} / {totalPages} 页，共 {total} 条
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-primary-200 hover:text-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                上一页
              </button>
              <button
                type="button"
                disabled={page === totalPages}
                onClick={() =>
                  setPage((prev) => Math.min(totalPages, prev + 1))
                }
                className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-primary-200 hover:text-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                下一页
              </button>
            </div>
          </div>
        ) : null}
      </section>

      {selected ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex justify-end bg-slate-900/30 backdrop-blur"
        >
          <div className="h-full w-full max-w-lg overflow-y-auto border-l border-slate-200 bg-white shadow-xl">
            <header className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {selected.title}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  工单号 {selected.id.slice(0, 8).toUpperCase()} ·{' '}
                  {new Date(selected.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelected(null);
                  setNote('');
                }}
                aria-label="关闭反馈详情"
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

            <div className="space-y-4 px-6 py-6 text-sm text-slate-600">
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  问题描述
                </h3>
                <p className="mt-2 whitespace-pre-line rounded-2xl bg-slate-50 p-4">
                  {selected.description}
                </p>
              </section>

              {selected.pageUrl ? (
                <section className="text-xs">
                  <span className="font-semibold text-slate-500">页面：</span>
                  <a
                    href={selected.pageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary-600 underline"
                  >
                    {selected.pageUrl}
                  </a>
                </section>
              ) : null}

              {selected.screenshotUrl ? (
                <section className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    截图
                  </h3>
                  <img
                    src={selected.screenshotUrl}
                    alt="用户反馈截图"
                    className="max-h-72 w-full rounded-2xl border border-slate-200 object-contain"
                  />
                </section>
              ) : null}

              <section className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-500">
                    更新状态
                  </label>
                  <select
                    value={selected.status}
                    onChange={(event) =>
                      applyUpdate(selected.id, {
                        status: event.target.value as FeedbackStatus,
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-500">
                    优先级
                  </label>
                  <select
                    value={selected.priority}
                    onChange={(event) =>
                      applyUpdate(selected.id, {
                        priority: event.target.value as FeedbackPriority,
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                  >
                    {priorityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-500">
                    备注记录
                  </label>
                  <textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="记录处理进展，学生端会看到该备注。"
                    rows={4}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                  />
                  <button
                    type="button"
                    disabled={!note.trim() || updating}
                    onClick={() =>
                      applyUpdate(selected.id, {
                        note: note.trim(),
                      })
                    }
                    className="mt-2 inline-flex items-center gap-2 rounded-xl bg-primary-500 px-4 py-2 text-xs font-semibold text-white shadow transition hover:bg-primary-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {updating ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/80 border-t-transparent" />
                    ) : null}
                    添加备注
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
