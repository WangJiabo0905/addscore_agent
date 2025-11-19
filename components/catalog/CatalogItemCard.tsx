'use client';

import { useMemo, useState } from 'react';
import type { CatalogItemDTO } from '@/types/catalog';

interface CatalogItemCardProps {
  item: CatalogItemDTO & {
    categoryTitle?: string;
    categoryNotes?: string[];
  };
  searchTerm?: string;
  onApply: (item: CatalogItemDTO) => void;
}

const badgeToneMap: Record<
  CatalogItemDTO['badges'][number]['tone'],
  string
> = {
  primary:
    'bg-primary-50 text-primary-600 border border-primary-100 hover:bg-primary-100',
  success:
    'bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100',
  warning:
    'bg-amber-50 text-amber-700 border border-amber-100 hover:bg-amber-100',
  danger:
    'bg-rose-50 text-rose-700 border border-rose-100 hover:bg-rose-100',
  neutral:
    'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200',
  accent: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
  muted: 'bg-slate-50 text-slate-500 border border-slate-200',
};

function highlight(text: string, keyword?: string) {
  if (!keyword) return text;
  const escaped = keyword.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  const pattern = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(pattern);
  return parts.map((part, index) =>
    index % 2 === 1 ? (
      <mark key={`${part}-${index}`} className="bg-primary-100 px-0.5 text-primary-700">
        {part}
      </mark>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    )
  );
}

export default function CatalogItemCard({
  item,
  searchTerm,
  onApply,
}: CatalogItemCardProps) {
  const [expanded, setExpanded] = useState(false);

  const badges = useMemo(
    () =>
      item.badges.map((badge) => ({
        ...badge,
        className: badgeToneMap[badge.tone] ?? badgeToneMap.neutral,
      })),
    [item.badges]
  );

  return (
    <article className="flex flex-col rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-card backdrop-blur transition hover:border-primary-200 hover:shadow-lg">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            {highlight(item.title, searchTerm)}
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            {highlight(item.shortDescription, searchTerm)}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2 text-sm text-slate-500">
          {item.maxScore !== null ? (
            <span className="rounded-xl border border-primary-100 bg-primary-50 px-3 py-1 text-sm font-medium text-primary-600">
              最高 {item.maxScore} 分
            </span>
          ) : (
            <span className="rounded-xl border border-slate-200 bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
              按政策封顶
            </span>
          )}
          {item.scoreNote ? (
            <span className="text-xs text-slate-400">{item.scoreNote}</span>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {badges.map((badge) => (
          <span
            key={badge.id}
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition ${badge.className}`}
          >
            {badge.label}
          </span>
        ))}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr,220px] lg:gap-6">
        <div className="space-y-3 text-sm text-slate-600">
          {expanded ? (
            <>
              <section>
                <h4 className="font-semibold text-slate-800">材料清单</h4>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {item.proofTips.map((tip) => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ul>
              </section>
              {item.notes.length ? (
                <section>
                  <h4 className="font-semibold text-slate-800">注意事项</h4>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {item.notes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                </section>
              ) : null}
              {item.visibilityNote ? (
                <section>
                  <h4 className="font-semibold text-slate-800">
                    公示/答辩提示
                  </h4>
                  <p className="mt-1 text-sm text-slate-600">
                    {item.visibilityNote}
                  </p>
                </section>
              ) : null}
              {item.materialsDeadlineNote ? (
                <p className="rounded-xl bg-amber-50 px-4 py-2 text-xs text-amber-700">
                  {item.materialsDeadlineNote}
                </p>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-slate-500">
              {highlight(
                item.notes[0] ??
                  '点击“了解规则”查看更多材料清单与注意事项。',
                searchTerm
              )}
            </p>
          )}
        </div>

        <div className="flex flex-col items-stretch justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
          <div className="space-y-2 text-xs text-slate-500">
            <div>
              <span className="font-semibold text-slate-700">分类：</span>
              <span>{item.categorySlug}</span>
            </div>
            {item.keywords.length ? (
              <div>
                <span className="font-semibold text-slate-700">
                  关键词：
                </span>
                <span>{item.keywords.join('、')}</span>
              </div>
            ) : null}
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              aria-expanded={expanded}
              onClick={() => setExpanded((prev) => !prev)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-primary-200 hover:text-primary-600"
            >
              {expanded ? '收起规则' : '了解规则'}
            </button>
            <button
              type="button"
              onClick={() => onApply(item)}
              className="w-full rounded-xl bg-primary-500 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-primary-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
            >
              我要申报
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
