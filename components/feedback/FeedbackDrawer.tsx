'use client';

import { useEffect, useState } from 'react';
import { message } from 'antd';
import { getStoredToken } from '@/lib/client';

type FeedbackPriority = 'HIGH' | 'MEDIUM' | 'LOW';

interface FeedbackFormState {
  title: string;
  description: string;
  pageUrl: string;
  screenshotUrl?: string;
  priority: FeedbackPriority;
}

const defaultState: FeedbackFormState = {
  title: '',
  description: '',
  pageUrl: '',
  priority: 'MEDIUM',
};

export default function FeedbackDrawer() {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FeedbackFormState>(defaultState);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setForm((prev) => ({
        ...prev,
        pageUrl: window.location.href,
      }));
    } else {
      setErrors({});
      setForm(defaultState);
    }
  }, [open]);

  const uploadScreenshot = async (file: File) => {
    const token = getStoredToken();
    if (!token) {
      message.error('请先登录后再上传截图');
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
      setForm((prev) => ({
        ...prev,
        screenshotUrl: result.url as string,
      }));
      message.success('截图上传成功');
    } catch (error) {
      message.error((error as Error).message || '上传失败');
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const token = getStoredToken();
    if (!token) {
      message.error('登录已过期，请重新登录');
      return;
    }
    setSubmitting(true);
    setErrors({});

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        if (result.errors) {
          const fieldErrors: Record<string, string> = {};
          Object.entries(result.errors).forEach(([key, value]) => {
            if (typeof value === 'object' && value && '_errors' in value) {
              const messages = (value as { _errors?: string[] })._errors;
              if (messages?.length) {
                fieldErrors[key] = messages[0];
              }
            }
          });
          setErrors(fieldErrors);
        }
        throw new Error(result.message || '提交失败');
      }
      message.success(
        `反馈已提交，工单号 ${result.data?.ticketNo ?? ''}`.trim()
      );
      setOpen(false);
    } catch (error) {
      message.error((error as Error).message || '提交失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        aria-label="反馈问题"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-primary-500 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-primary-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
        反馈问题
      </button>

      {open ? (
        <div
          aria-modal="true"
          role="dialog"
          className="fixed inset-0 z-50 flex justify-end bg-slate-900/30 backdrop-blur"
        >
          <div className="h-full w-full max-w-md overflow-y-auto border-l border-slate-200 bg-white shadow-xl">
            <header className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  网站问题反馈
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  请详细描述遇到的问题，便于开发者定位与修复。
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="关闭反馈窗口"
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

            <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6">
              <div>
                <label className="text-xs font-medium text-slate-600">
                  标题 *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      title: event.target.value,
                    }))
                  }
                  className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-100 ${
                    errors.title
                      ? 'border-rose-400 focus:ring-rose-100'
                      : 'border-slate-200 focus:border-primary-500'
                  }`}
                  placeholder="一句话描述问题，如“竞赛申请无法提交”"
                />
                {errors.title ? (
                  <p className="mt-1 text-xs text-rose-500">{errors.title}</p>
                ) : null}
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600">
                  问题描述 *
                </label>
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                  rows={5}
                  className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-100 ${
                    errors.description
                      ? 'border-rose-400 focus:ring-rose-100'
                      : 'border-slate-200 focus:border-primary-500'
                  }`}
                  placeholder="请包含操作步骤、预期结果与实际结果，越详细越好。"
                />
                {errors.description ? (
                  <p className="mt-1 text-xs text-rose-500">
                    {errors.description}
                  </p>
                ) : null}
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600">
                  页面地址
                </label>
                <input
                  type="url"
                  value={form.pageUrl}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      pageUrl: event.target.value,
                    }))
                  }
                  className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-100 ${
                    errors.pageUrl
                      ? 'border-rose-400 focus:ring-rose-100'
                      : 'border-slate-200 focus:border-primary-500'
                  }`}
                  placeholder="如 http://localhost:3000/catalog"
                />
                {errors.pageUrl ? (
                  <p className="mt-1 text-xs text-rose-500">{errors.pageUrl}</p>
                ) : null}
              </div>

              <div>
                <span className="text-xs font-medium text-slate-600">
                  优先级
                </span>
                <div className="mt-2 flex gap-2">
                  {(
                    [
                      { value: 'HIGH', label: '高', helper: '影响提交流程' },
                      { value: 'MEDIUM', label: '中', helper: '使用体验受影响' },
                      { value: 'LOW', label: '低', helper: '建议/优化' },
                    ] as Array<{
                      value: FeedbackPriority;
                      label: string;
                      helper: string;
                    }>
                  ).map((option) => (
                    <label
                      key={option.value}
                      className={`flex flex-1 cursor-pointer flex-col items-start rounded-2xl border px-3 py-2 text-xs transition ${
                        form.priority === option.value
                          ? 'border-primary-400 bg-primary-50 text-primary-700'
                          : 'border-slate-200 text-slate-500 hover:border-primary-200 hover:text-primary-600'
                      }`}
                    >
                      <input
                        type="radio"
                        name="feedback-priority"
                        value={option.value}
                        checked={form.priority === option.value}
                        onChange={() =>
                          setForm((prev) => ({
                            ...prev,
                            priority: option.value,
                          }))
                        }
                        className="hidden"
                      />
                      <span className="text-sm font-semibold">
                        {option.label}
                      </span>
                      <span className="mt-1 text-[11px] text-slate-400">
                        {option.helper}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600">
                  截图上传
                </label>
                <label className="mt-1 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-5 text-sm text-slate-500 hover:border-primary-300 hover:bg-primary-50/40">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) {
                        void uploadScreenshot(file);
                        event.target.value = '';
                      }
                    }}
                  />
                  <span className="font-medium text-primary-600">
                    点击上传错误截图
                  </span>
                  <span className="mt-1 text-xs text-slate-400">
                    支持 PNG/JPG，单个不超过 5MB
                  </span>
                  {form.screenshotUrl ? (
                    <span className="mt-2 rounded-full bg-primary-100 px-3 py-1 text-[11px] text-primary-600">
                      已上传
                    </span>
                  ) : null}
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-primary-200 hover:text-primary-600"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-primary-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:opacity-70"
                >
                  {submitting ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/80 border-t-transparent" />
                  ) : null}
                  提交反馈
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
