'use client';

import { useMemo } from 'react';
import { CatalogCategoryDTO } from '@/types/catalog';
import { POLICY_FILTER_LABELS } from '@/lib/policy';

interface CatalogFiltersProps {
  categories: CatalogCategoryDTO[];
  search: string;
  activeCategory?: string;
  activeFlags: string[];
  onSearchChange: (value: string) => void;
  onCategoryChange: (value?: string) => void;
  onFlagToggle: (flag: string) => void;
  onReset: () => void;
  loading?: boolean;
}

const flagEntries = Object.entries(POLICY_FILTER_LABELS);

export default function CatalogFilters({
  categories,
  search,
  activeCategory,
  activeFlags,
  onSearchChange,
  onCategoryChange,
  onFlagToggle,
  onReset,
  loading = false,
}: CatalogFiltersProps) {
  const categoryOptions = useMemo(
    () =>
      categories.map((category) => ({
        slug: category.slug,
        title: category.title,
        count: category.items.length,
      })),
    [categories]
  );

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-card backdrop-blur">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="flex-1">
          <label htmlFor="catalog-search" className="sr-only">
            关键字搜索
          </label>
          <div className="relative">
            <input
              id="catalog-search"
              aria-label="搜索加分项目"
              placeholder="搜索关键字，例如“国家级竞赛”"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-inner outline-none transition focus:border-primary-500 focus:ring focus:ring-primary-100"
            />
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-200 border-t-transparent" />
              ) : (
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <circle cx="11" cy="11" r="7" />
                  <line x1="20" y1="20" x2="16.65" y2="16.65" />
                </svg>
              )}
            </div>
          </div>
        </div>
        <button
          type="button"
          className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-primary-200 hover:text-primary-600"
          onClick={onReset}
        >
          重置筛选
        </button>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[200px,1fr] lg:gap-6">
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            分类
          </h3>
          <div className="flex flex-wrap gap-2">
            {categoryOptions.map((category) => {
              const isActive = category.slug === activeCategory;
              return (
                <button
                  key={category.slug}
                  type="button"
                  onClick={() =>
                    onCategoryChange(isActive ? undefined : category.slug)
                  }
                  className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${
                    isActive
                      ? 'border-primary-500 bg-primary-50 text-primary-600'
                      : 'border-slate-200 text-slate-600 hover:border-primary-200 hover:text-primary-600'
                  }`}
                >
                  {category.title}
                  <span className="ml-1 text-[11px] text-slate-400">
                    {category.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            高级筛选
          </h3>
          <div className="flex flex-wrap gap-2">
            {flagEntries.map(([flag, label]) => {
              const isActive = activeFlags.includes(flag);
              return (
                <button
                  key={flag}
                  type="button"
                  onClick={() => onFlagToggle(flag)}
                  className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${
                    isActive
                      ? 'border-primary-500 bg-primary-50 text-primary-600'
                      : 'border-slate-200 text-slate-600 hover:border-primary-200 hover:text-primary-600'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
