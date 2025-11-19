import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { requireUser } from '@/lib/api-helpers';
import { getSupabaseClient } from '@/lib/supabase';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const PDF_BUCKET = process.env.SUPABASE_PROOF_BUCKET || 'proof-pdfs';

interface ParsedPage {
  pageNumber: number;
  rawText: string;
}

function isPdfFile(file: File): boolean {
  const type = file.type?.toLowerCase();
  if (type && (type === 'application/pdf' || type === 'application/x-pdf')) {
    return true;
  }
  return file.name?.toLowerCase().endsWith('.pdf') ?? false;
}

function extractPagesFromPdf(buffer: Buffer): ParsedPage[] {
  const asciiText = buffer.toString('latin1');
  const cleaned = asciiText
    .replace(/[^\u4e00-\u9fa5\w\s.,:;!?()\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) {
    return [
      {
        pageNumber: 1,
        rawText: '暂无法解析该 PDF 内容，请联系管理员安装 pdfjs-dist。',
      },
    ];
  }

  const segments = cleaned.split(/\f+/);
  return segments.map((segment, index) => ({
    pageNumber: index + 1,
    rawText: segment.trim(),
  }));
}

async function uploadPdfToStorage(
  client: SupabaseClient,
  buffer: Buffer,
  contentType: string,
  userId: string
): Promise<string> {
  const storagePath = `proofs/${userId}/${Date.now()}-${randomUUID()}.pdf`;
  const { error } = await client.storage
    .from(PDF_BUCKET)
    .upload(storagePath, buffer, {
      contentType,
      upsert: true,
    });

  if (error) {
    throw new Error(error.message || '上传 PDF 到存储失败');
  }

  return storagePath;
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, message: '请上传 PDF 文件' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, message: 'PDF 不能超过 50MB' },
        { status: 400 }
      );
    }

    if (!isPdfFile(file)) {
      return NextResponse.json(
        { success: false, message: '仅支持上传 PDF 文件' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { success: false, message: '尚未配置 Supabase' },
        { status: 500 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileId = await uploadPdfToStorage(
      supabase,
      buffer,
      file.type || 'application/pdf',
      user._id.toString()
    );

    const pages = extractPagesFromPdf(buffer);

    return NextResponse.json({
      success: true,
      data: {
        fileId,
        pages,
      },
    });
  } catch (error) {
    const message = (error as Error).message || 'PDF 解析失败';
    const statusCode = message.includes('PDF 不能超过') ? 400 : 500;
    return NextResponse.json(
      { success: false, message },
      { status: statusCode }
    );
  }
}
