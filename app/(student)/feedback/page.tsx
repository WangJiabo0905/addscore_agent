'use client';

import { useEffect, useState } from 'react';
import { message } from 'antd';
import { useRouter } from 'next/navigation';
import { getStoredToken } from '@/lib/client';
import type { FeedbackListItem } from '@/types/feedback';

interface FeedbackResponse {
  success: boolean;
  data?: { items: FeedbackListItem[] };
  message?: string;
}

const statusMap: Record<string, { label: string; className: string }> = {
  OPEN: {
    label: '待处理',
    className: 'bg-amber-50 text-amber-700 border border-amber-100',
  },
  IN_PROGRESS: {
    label: '处理中',
    className: 'bg-primary-50 text-primary-700 border border-primary-100',
  },
  RESOLVED: {
    label: '已解决',
    className: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  },
  WONT_FIX: {
    label: '暂不处理',
    className: 'bg-slate-100 text-slate-600 border border-slate-200',
  },
};

export default function StudentFeedbackHistoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<FeedbackListItem[]>([]);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      message.error('请登录后查看反馈记录');
      router.push('/login');
      return;
    }
    const fetchFeedback = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/feedback', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const result = (await response.json()) as FeedbackResponse;
        if (!response.ok || !result.success) {
          throw new Error(result.message || '加载失败');
        }
        setItems(result.data?.items ?? []);
      } catch (error) {
        message.error((error as Error).message || '加载失败');
      } finally {
        setLoading(false);
      }
    };

    void fetchFeedback();
  }, [router]);

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 md:px-0">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">我的反馈工单</h1>
        <p className="mt-2 text-sm text-slate-500">
          可随时追踪处理进度，如有补充可在工单详情中留言。
        </p>
      </header>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-24 animate-pulse rounded-3xl border border-slate-100 bg-slate-100/60"
            />
          ))}
        </div>
      ) : null}

      {!loading && items.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          暂无反馈记录，点击右下角“反馈问题”按钮即可创建新工单。
        </div>
      ) : null}

      <div className="space-y-3">
        {items.map((item) => {
          const statusInfo = statusMap[item.status] ?? statusMap.OPEN;
          return (
            <article
              key={item.id}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-400">
                    提交时间 {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusInfo.className}`}>
                  {statusInfo.label}
                </span>
              </div>
              {item.pageUrl ? (
                <p className="mt-2 text-xs text-slate-500">
                  页面：{' '}
                  <a
                    href={item.pageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary-600 underline"
                  >
                    {item.pageUrl}
                  </a>
                </p>
              ) : null}
              <p className="mt-3 text-sm text-slate-600">
                最新进展：{item.latestNote ?? '待处理'}
              </p>
            </article>
          );
        })}
      </div>
    </main>
  );
}
