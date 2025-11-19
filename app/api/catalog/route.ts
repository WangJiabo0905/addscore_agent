import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  CATALOG_BADGES,
  CATALOG_CATEGORIES,
  CATALOG_ITEMS,
  DEFAULT_SEARCH_HINTS,
  POLICY_META,
  POLICY_TIMELINE,
} from '@/lib/policy';
import {
  catalogFiltersSchema,
  searchCatalogItems,
} from '@/lib/validation';

export async function GET(request: NextRequest) {
  const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parseResult = catalogFiltersSchema.safeParse({
    ...searchParams,
    flags: searchParams.flags
      ? searchParams.flags.split(',').filter(Boolean)
      : undefined,
  });
  if (!parseResult.success) {
    return NextResponse.json(
      {
        success: false,
        message: '筛选参数不合法',
        errors: parseResult.error.format(),
      },
      { status: 400 }
    );
  }
  const { search, flags, category } = parseResult.data;

  let categories:
    | {
        id: string;
        slug: string;
        title: string;
        description: string;
        order: number;
        policyNotes: string[];
        defaultBadge: string | null;
        items: {
          id: string;
          slug: string;
          title: string;
          shortDescription: string;
          maxScore: number | null;
          scoreNote: string | null;
          baselineScore: number | null;
          badges: string[];
          flags: string[];
          proofTips: string[];
          notes: string[];
          keywords: string[];
          materialsDeadlineNote: string | null;
          visibilityNote: string | null;
          order: number;
        }[];
      }[]
    | null = null;

  const shouldUseFallback =
    !process.env.DATABASE_URL || process.env.DATABASE_URL.trim() === '';

  if (!shouldUseFallback) {
    try {
      categories = await prisma.catalogCategory.findMany({
        include: {
          items: {
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { order: 'asc' },
      });
    } catch (error) {
      console.error('Catalog query failed, switching to static policy data.', error);
      categories = null;
    }
  }

  if (!categories) {
    categories = CATALOG_CATEGORIES.map((category) => ({
      id: category.slug,
      slug: category.slug,
      title: category.title,
      description: category.description,
      order: category.order,
      policyNotes: category.policyNotes ?? [],
      defaultBadge: category.defaultBadge?.id ?? null,
      items: CATALOG_ITEMS.filter(
        (item) => item.category === category.slug
      ).map((item, index) => ({
        id: item.slug,
        slug: item.slug,
        title: item.title,
        shortDescription: item.shortDescription,
        maxScore: item.maxScore,
        scoreNote: item.scoreNote ?? null,
        baselineScore: item.baselineScore ?? null,
        badges: item.badges.map((badge) => badge.id),
        flags: item.flags,
        proofTips: item.proofTips,
        notes: item.notes,
        keywords: item.keywords,
        materialsDeadlineNote: item.materialsDeadlineNote ?? null,
        visibilityNote: item.visibilityNote ?? null,
        order: index + 1,
      })),
    }));
  }

  const allowedSlugSet = new Set(
    searchCatalogItems({
      search,
      flags,
      category,
    }).map((item) => item.slug)
  );

  const filteredCategories = categories
    .map((categoryRecord) => {
      const items = categoryRecord.items.filter((item) =>
        allowedSlugSet.size ? allowedSlugSet.has(item.slug) : true
      );
      return { categoryRecord, items };
    })
    .filter(({ items }) => items.length > 0 || !allowedSlugSet.size);

  return NextResponse.json({
    success: true,
    data: {
      policyMeta: POLICY_META,
      timeline: POLICY_TIMELINE,
      hints: DEFAULT_SEARCH_HINTS,
      filters: parseResult.data,
      categories: filteredCategories.map(({ categoryRecord, items }) => ({
        id: categoryRecord.id,
        slug: categoryRecord.slug,
        title: categoryRecord.title,
        description: categoryRecord.description,
        order: categoryRecord.order,
        policyNotes: categoryRecord.policyNotes,
        defaultBadge: categoryRecord.defaultBadge
          ? CATALOG_BADGES[categoryRecord.defaultBadge] ?? null
          : null,
        items: items.map((item) => ({
          id: item.id,
          slug: item.slug,
          title: item.title,
          shortDescription: item.shortDescription,
          maxScore: item.maxScore,
          scoreNote: item.scoreNote,
          baselineScore: item.baselineScore,
          badges: item.badges.map(
            (badgeId) => CATALOG_BADGES[badgeId] ?? { id: badgeId, label: badgeId, tone: 'neutral' as const }
          ),
          flags: item.flags,
          proofTips: item.proofTips,
          notes: item.notes,
          keywords: item.keywords,
          materialsDeadlineNote: item.materialsDeadlineNote,
          visibilityNote: item.visibilityNote,
          categorySlug: categoryRecord.slug,
        })),
      })),
    },
  });
}
