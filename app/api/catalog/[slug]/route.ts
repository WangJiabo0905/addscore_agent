import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  CATALOG_BADGES,
  CATALOG_CATEGORIES,
  CATALOG_ITEMS,
  findCatalogItem,
} from '@/lib/policy';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const slug = params.slug;
  if (!slug) {
    return NextResponse.json(
      { success: false, message: '缺少项目标识' },
      { status: 400 }
    );
  }

  const shouldUseFallback =
    !process.env.DATABASE_URL || process.env.DATABASE_URL.trim() === '';

  let item:
    | {
        id: string;
        slug: string;
        title: string;
        shortDescription: string;
        maxScore: number | null;
        scoreNote: string | null;
        badges: string[];
        flags: string[];
        proofTips: string[];
        notes: string[];
        keywords: string[];
        materialsDeadlineNote: string | null;
        visibilityNote: string | null;
        category: {
          slug: string;
          title: string;
          description: string;
          policyNotes: string[];
        };
      }
    | null = null;

  if (!shouldUseFallback) {
    try {
      const record = await prisma.catalogItem.findUnique({
        where: { slug },
        include: {
          category: true,
        },
      });
      if (record) {
        item = {
          id: record.id,
          slug: record.slug,
          title: record.title,
          shortDescription: record.shortDescription,
          maxScore: record.maxScore,
          scoreNote: record.scoreNote,
          badges: record.badges,
          flags: record.flags,
          proofTips: record.proofTips,
          notes: record.notes,
          keywords: record.keywords,
          materialsDeadlineNote: record.materialsDeadlineNote,
          visibilityNote: record.visibilityNote,
          category: {
            slug: record.category.slug,
            title: record.category.title,
            description: record.category.description,
            policyNotes: record.category.policyNotes,
          },
        };
      }
    } catch (error) {
      console.error('Catalog detail query failed, switching to static data.', error);
      item = null;
    }
  }

  if (!item) {
    const policyItem = findCatalogItem(slug);
    if (!policyItem) {
      return NextResponse.json(
        { success: false, message: '未找到对应加分项目' },
        { status: 404 }
      );
    }
    const category = CATALOG_CATEGORIES.find(
      (category) => category.slug === policyItem.category
    );
    item = {
      id: policyItem.slug,
      slug: policyItem.slug,
      title: policyItem.title,
      shortDescription: policyItem.shortDescription,
      maxScore: policyItem.maxScore,
      scoreNote: policyItem.scoreNote ?? null,
      badges: policyItem.badges.map((badge) => badge.id),
      flags: policyItem.flags,
      proofTips: policyItem.proofTips,
      notes: policyItem.notes,
      keywords: policyItem.keywords,
      materialsDeadlineNote: policyItem.materialsDeadlineNote ?? null,
      visibilityNote: policyItem.visibilityNote ?? null,
      category: {
        slug: category?.slug ?? policyItem.category,
        title: category?.title ?? policyItem.category,
        description: category?.description ?? '',
        policyNotes: category?.policyNotes ?? [],
      },
    };
  }

  return NextResponse.json({
    success: true,
    data: {
      id: item.id,
      slug: item.slug,
      title: item.title,
      shortDescription: item.shortDescription,
      maxScore: item.maxScore,
      scoreNote: item.scoreNote,
      badges: item.badges.map(
        (badgeId) => CATALOG_BADGES[badgeId] ?? { id: badgeId, label: badgeId, tone: 'neutral' as const }
      ),
      flags: item.flags,
      proofTips: item.proofTips,
      notes: item.notes,
      keywords: item.keywords,
      materialsDeadlineNote: item.materialsDeadlineNote,
      visibilityNote: item.visibilityNote,
      category: {
        slug: item.category.slug,
        title: item.category.title,
        description: item.category.description,
        policyNotes: item.category.policyNotes,
      },
      policy: findCatalogItem(slug) ?? null,
    },
  });
}
