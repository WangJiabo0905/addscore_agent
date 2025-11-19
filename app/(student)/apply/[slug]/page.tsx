'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { message } from 'antd';
import ApplyDialog from '@/components/catalog/ApplyDialog';
import type { CatalogItemDTO } from '@/types/catalog';

interface CatalogItemResponse {
  success: boolean;
  data?: {
    id: string;
    slug: string;
    title: string;
    shortDescription: string;
    maxScore: number | null;
    scoreNote?: string | null;
    badges: CatalogItemDTO['badges'];
    flags: string[];
    proofTips: string[];
    notes: string[];
    keywords: string[];
    materialsDeadlineNote?: string | null;
    visibilityNote?: string | null;
    category: {
      slug: string;
      title: string;
      description: string;
    };
  };
  message?: string;
}

export default function DirectApplyPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const [item, setItem] = useState<CatalogItemDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItem = async () => {
      if (!params?.slug) return;
      setLoading(true);
      try {
        const response = await fetch(`/api/catalog/${params.slug}`);
        const result = (await response.json()) as CatalogItemResponse;
        if (!response.ok || !result.success || !result.data) {
          throw new Error(result.message || '未找到项目');
        }
        const data = result.data;
        setItem({
          id: data.id,
          slug: data.slug,
          title: data.title,
          shortDescription: data.shortDescription,
          maxScore: data.maxScore,
          scoreNote: data.scoreNote ?? undefined,
          baselineScore: null,
          badges: data.badges,
          flags: data.flags,
          proofTips: data.proofTips,
          notes: data.notes,
          keywords: data.keywords,
          materialsDeadlineNote: data.materialsDeadlineNote ?? undefined,
          visibilityNote: data.visibilityNote ?? undefined,
          categorySlug: data.category.slug,
        });
      } catch (error) {
        message.error((error as Error).message || '加载项目失败');
        router.push('/catalog');
      } finally {
        setLoading(false);
      }
    };

    void fetchItem();
  }, [params?.slug, router]);

  if (loading) {
    return (
      <main className="flex min-h-[80vh] items-center justify-center bg-slate-50">
        <div className="h-20 w-20 animate-spin rounded-full border-4 border-primary-200 border-t-primary-500" />
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <ApplyDialog
        item={item}
        open
        onClose={() => router.push('/catalog')}
        onSubmitted={() => router.push('/catalog')}
      />
    </div>
  );
}
