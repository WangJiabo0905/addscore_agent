import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { requireUser } from '@/lib/api-helpers';
import { getSupabaseClient } from '@/lib/supabase';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const MAX_FILE_SIZE = 50 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    await requireUser(request);

    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, message: '未找到上传文件' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, message: '上传图片大小不能超过 50MB' },
        { status: 400 }
      );
    }

    if (file.type && !file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, message: '仅支持上传图片文件' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const originalName = file.name || 'upload';
    const extension = path.extname(originalName) || '.jpg';
    const fileName = `${Date.now()}-${randomUUID()}${extension}`;
    const filePath = path.join(UPLOAD_DIR, fileName);

    const supabase = getSupabaseClient();
    const bucket = process.env.SUPABASE_STORAGE_BUCKET;

    if (supabase && bucket) {
      const storagePath = `uploads/${fileName}`;
      const { error } = await supabase.storage
        .from(bucket)
        .upload(storagePath, buffer, {
          cacheControl: '3600',
          contentType: file.type || 'application/octet-stream',
          upsert: true,
        });
      if (error) {
        console.error('Supabase upload error', error);
        throw new Error('上传失败，请稍后再试');
      }
      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(storagePath, {
        transform: {
          width: 1600,
        },
      });

      return NextResponse.json({
        success: true,
        message: '上传成功',
        url: publicUrl,
      });
    }

    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.writeFile(filePath, buffer);

    const url = `/uploads/${fileName}`;

    return NextResponse.json({
      success: true,
      message: '上传成功',
      url,
    });
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json(
        { success: false, message: '未授权' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, message: '上传失败' },
      { status: 500 }
    );
  }
}
