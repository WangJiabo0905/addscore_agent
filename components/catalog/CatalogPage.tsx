'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import CatalogFilters from './CatalogFilters';
import CatalogItemCard from './CatalogItemCard';
import ApplyDialog from './ApplyDialog';
import type {
  CatalogCategoryDTO,
  CatalogItemDTO,
  CatalogResponsePayload,
} from '@/types/catalog';

interface FetchState {
  data: CatalogResponsePayload | null;
  loading: boolean;
  error: string | null;
}

const initialState: FetchState = {
  data: null,
  loading: true,
  error: null,
};

export default function CatalogPage() {
  const [state, setState] = useState<FetchState>(initialState);
  const [filters, setFilters] = useState<{
    search: string;
    category?: string;
    flags: string[];
  }>({
    search: '',
    flags: [],
  });
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState<CatalogItemDTO | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 320);
    return () => window.clearTimeout(timer);
  }, [filters.search]);

  const fetchCatalog = useCallback(async () => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (filters.category) params.set('category', filters.category);
    if (filters.flags.length) params.set('flags', filters.flags.join(','));

    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await fetch(`/api/catalog?${params.toString()}`, {
        cache: 'no-store',
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || '加载失败');
      }
      setState({
        data: result.data as CatalogResponsePayload,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error: (error as Error).message || '加载失败',
      });
    }
  }, [debouncedSearch, filters.category, filters.flags]);

  useEffect(() => {
    void fetchCatalog();
  }, [fetchCatalog]);

  const categories: CatalogCategoryDTO[] = state.data?.categories ?? [];

  const flatItems = useMemo(() => {
    const mapping = new Map<string, { title: string; notes: string[] }>();
    for (const category of categories) {
      mapping.set(category.slug, {
        title: category.title,
        notes: category.policyNotes,
      });
    }
    return categories.flatMap((category) =>
      category.items.map((item) => ({
        ...item,
        categoryTitle: mapping.get(category.slug)?.title ?? category.slug,
        categoryNotes: mapping.get(category.slug)?.notes ?? [],
      }))
    );
  }, [categories]);

  const openApplyDialog = (item: CatalogItemDTO) => {
    setSelectedItem(item);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setSelectedItem(null);
  };

  const resetFilters = () =>
    setFilters({
      search: '',
      flags: [],
      category: undefined,
    });

  return (
    <div className="space-y-6">
      <header className="rounded-3xl border border-primary-100 bg-gradient-to-br from-primary-50 via-white to-white p-6 shadow-card">
        <h1 className="text-2xl font-semibold text-primary-900">
          加分项目总目录
        </h1>
        <p className="mt-2 text-sm text-primary-700">
          截止日期：{state.data?.policyMeta.cutoffDate ?? '——'}，学术专长封顶{' '}
          {state.data?.policyMeta.academicScoreCap ?? 15} 分，综合表现封顶{' '}
          {state.data?.policyMeta.comprehensiveScoreCap ?? 5} 分。
        </p>
        <p className="mt-1 text-xs text-primary-500">
          {state.data?.policyMeta.totalScoreFormula ??
            '综合成绩 = 学业综合成绩×80% + 学术专长成绩（≤15）+ 综合表现成绩（≤5）'}
        </p>
        {state.data?.timeline?.length ? (
          <div className="mt-4 flex flex-wrap gap-3">
            {state.data.timeline.map((event, index) => (
              <div
                key={`${event.title}-${index}`}
                className="flex items-center gap-2 rounded-2xl bg-white/80 px-4 py-2 text-xs text-primary-700 shadow-sm"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-[11px] font-semibold text-primary-700">
                  {index + 1}
                </span>
                <div>
                  <p className="font-semibold">{event.title}</p>
                  <p className="text-[11px] text-primary-500">
                    {event.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </header>

      <CatalogFilters
        categories={categories}
        search={filters.search}
        activeCategory={filters.category}
        activeFlags={filters.flags}
        onSearchChange={(value) =>
          setFilters((prev) => ({ ...prev, search: value }))
        }
        onCategoryChange={(value) =>
          setFilters((prev) => ({ ...prev, category: value }))
        }
        onFlagToggle={(flag) =>
          setFilters((prev) => ({
            ...prev,
            flags: prev.flags.includes(flag)
              ? prev.flags.filter((item) => item !== flag)
              : [...prev.flags, flag],
          }))
        }
        onReset={resetFilters}
        loading={state.loading}
      />

      {state.data?.hints?.length ? (
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-4 text-xs text-slate-500 shadow-sm">
          <p className="mb-2 text-xs font-semibold text-slate-600">
            搜索提示
          </p>
          <ul className="space-y-1">
            {state.data.hints.map((hint, index) => (
              <li key={`${hint}-${index}`} className="leading-relaxed">
                {hint}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {state.error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-600">
          {state.error}
        </div>
      ) : null}

      {state.loading ? (
        <div className="grid gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-48 animate-pulse rounded-3xl border border-slate-100 bg-slate-100/60"
            />
          ))}
        </div>
      ) : null}

      {!state.loading && flatItems.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          未找到匹配的加分项目。尝试调整关键字或筛选条件。
        </div>
      ) : null}

      <div className="grid gap-4">
        {flatItems.map((item) => (
          <CatalogItemCard
            key={item.id}
            item={item}
            searchTerm={debouncedSearch}
            onApply={openApplyDialog}
          />
        ))}
      </div>

      <ApplyDialog
        item={selectedItem}
        open={dialogOpen}
        onClose={closeDialog}
        onSubmitted={() => {
          closeDialog();
          void fetchCatalog();
        }}
      />
    </div>
  );
}
